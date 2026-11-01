import { randomBytes, randomUUID } from "node:crypto";
import type { Express } from "express";
import { z } from "zod";
import { pool } from "./db.js";
import { calculateArenaPayout, recordArenaFee } from "./arenaFees.js";
import { applyMove, makePlayer, type Player, type Battle, type BattleVisualChange } from "./multiplayer.js";
import { BRAWL_RULES, FOCUS_CAP, SHIELD_CAP, getCombatKit } from "./brawlAbilities.js";

export type DuoPlayer = Player & {
    team: 0 | 1;
    coverCooldown: number;
    missedRounds: number;
    downedRound: number | null;
};
export type DuoParticipant = {
    userId: string;
    team: 0 | 1;
    ready: boolean;
    lastSeen: string;
    username?: string;
};
export type DuoAction = "strike" | "guard" | "focus" | "special" | "special2" | "cover" | "rescue";
export type DuoMove = { action: DuoAction; targetId?: string };
export type DuoEffect = { actorId: string; targetId: string; action: string; description: string; changes: BattleVisualChange[] };
export type DuoBattle = {
    players: DuoPlayer[];
    round: number;
    deadline: string;
    pendingMoves: Record<string, DuoMove>;
    rescueUsed: [boolean, boolean];
    paused: boolean;
    effects: DuoEffect[];
    log: string[];
    winnerTeam: 0 | 1 | null;
    totals?: Record<string,{ damageDealt:number; coverDamage:number; rescues:number; healing:number; shieldsGranted:number }>;
    // Visible only to teammates; contains suggestions, never hidden battle actions.
    teamSignals?: Record<string,{ targetId:string; round:number }>;
    teamReady?: string[];
};

type Queryable = { query: (sql: string, params?: unknown[]) => Promise<any> };
const createInput = z.object({ wager: z.number().int().min(0).max(100) });
const joinInput = z.object({ code: z.string().min(5).max(12), team: z.union([z.literal(0), z.literal(1)]) });
const moveInput = z.object({ action: z.enum(["strike", "guard", "focus", "special", "special2", "cover", "rescue"]), targetId: z.string().uuid().optional() });
const uuidInput = z.string().uuid();
const ROUND_MS = 40000;
const RECONNECT_MS = 45000;
const OFFLINE_MS = 12000;
const MAX_ROUND = 18;
const MAX_LOG = 24;
const inviteInput = z.object({ friendId: z.string().uuid() });
const signalInput = z.object({ targetId: z.string().uuid() });
const eligibleSupportKinds = new Set(["mend", "cleanse", "aegis", "bulwark", "fortress", "riposte", "rallyguard"]);
const nowIso = () => new Date().toISOString();
const appendLog = (battle: DuoBattle, message: string) => { battle.log = [...battle.log, message].slice(-MAX_LOG); };
const living = (battle: DuoBattle, team: 0 | 1) => battle.players.filter(p => p.team === team && p.hp > 0);
const find = (battle: DuoBattle, id: string) => battle.players.find(p => p.userId === id);
const coinsQuery = "UPDATE pets SET coins=coins+$2 WHERE owner_id=$1";

export function canDuoTarget(battle: DuoBattle, actor: DuoPlayer, move: DuoMove): boolean {
    if (move.action === "focus" || move.action === "guard") { return !move.targetId; }
    if (move.action === "cover") { return actor.coverCooldown <= 0 && !!move.targetId && battle.players.some(p => p.userId === move.targetId && p.team === actor.team && p.userId !== actor.userId && p.hp > 0); }
    if (move.action === "rescue") { return battle.round < BRAWL_RULES.pressureStartsRound && !battle.rescueUsed[actor.team] && actor.focus >= 6 && !!move.targetId && battle.players.some(p => p.userId === move.targetId && p.team === actor.team && p.hp <= 0 && p.downedRound === battle.round - 1); }
    if (!move.targetId) { return false; }
    const target = find(battle, move.targetId);
    if (!target || target.hp <= 0) { return false; }
    if (target.team !== actor.team) { return true; }
    if (!(["special", "special2"] as string[]).includes(move.action)) { return false; }
    const skill = getCombatKit(actor.species, actor.breed).specials[move.action === "special" ? 0 : 1];
    return eligibleSupportKinds.has(skill.kind);
}

function simpleChange(targetId: string, kind: BattleVisualChange["kind"], amount: number, label?: string): BattleVisualChange {
    return { targetId, kind, amount, label };
}
function applyAllySpecial(battle: DuoBattle, actor: DuoPlayer, target: DuoPlayer, action: "special" | "special2"): DuoEffect {
    const index = action === "special" ? 0 : 1;
    const skill = getCombatKit(actor.species, actor.breed).specials[index];
    actor.focus -= skill.cost;
    actor.cooldowns ??= [0, 0];
    actor.cooldowns = actor.cooldowns.map(n => Math.max(0, n - 1)) as [number, number];
    actor.cooldowns[index] = Math.max(2, skill.cooldown);
    actor.cooldown = actor.cooldowns[0];
    actor.guardStreak = 0;
    let gained = 0;
    let kind: BattleVisualChange["kind"] = "heal";
    if (["mend", "cleanse"].includes(skill.kind)) {
        gained = Math.min(target.maxHp - target.hp, Math.floor((8 + skill.strength) * .75));
        target.hp += gained;
        if (skill.kind === "cleanse") { target.poisonRounds = 0; target.poisonDamage = 5; }
    } else {
        kind = "shield";
        gained = Math.min(SHIELD_CAP - target.shield, Math.floor((9 + skill.strength) * .75));
        target.shield += gained;
        if (gained) { target.shieldExpiresRound = battle.round + BRAWL_RULES.shieldDurationRounds - 1; }
    }
    const description = `${actor.petName} supported ${target.petName} with ${skill.name}: +${gained} ${kind === "heal" ? "HP" : "Shield"}.`;
    appendLog(battle, description);
    return { actorId: actor.userId, targetId: target.userId, action, description, changes: gained ? [simpleChange(target.userId, kind, gained)] : [] };
}

// Existing 1v1 calculations remain the authority for every offensive or self-directed move.
// The temporary two-player wrapper references the same DuoPlayer objects, so the changes
// are persisted back into the four-player battle without copying or rewriting breed rules.
function applyExistingMove(battle: DuoBattle, actor: DuoPlayer, opponent: DuoPlayer, move: DuoMove): DuoEffect {
    const mirror: Battle = {
        players: [actor, opponent], turn: actor.userId, turns: 0,
        turnExpiresAt: battle.deadline, roundSerial: battle.round,
        pendingMoves: {}, lastRoundEffects: [], log: []
    };
    if (battle.pendingMoves[opponent.userId]?.action === "special" || battle.pendingMoves[opponent.userId]?.action === "special2") {
        mirror.pendingMoves![opponent.userId] = battle.pendingMoves[opponent.userId].action as "special" | "special2";
    }
    applyMove(mirror, actor, opponent, move.action as "strike" | "guard" | "focus" | "special" | "special2");
    const effect = mirror.lastRoundEffects?.[0];
    const description = mirror.log[mirror.log.length - 1] || `${actor.petName} used ${move.action}.`;
    appendLog(battle, description);
    return { actorId: actor.userId, targetId: opponent.userId, action: move.action, description, changes: effect?.visualChanges || [] };
}

export function createDuoBattle(pets: Array<{ userId: string; team: 0 | 1; username: string; pet: any }>): DuoBattle {
    if (pets.length !== 4 || pets.filter(p => p.team === 0).length !== 2 || pets.filter(p => p.team === 1).length !== 2 || new Set(pets.map(p => p.userId)).size !== 4) {
        throw Error("A Duo Clash match requires four distinct pets, two on each team.");
    }
    return {
        players: pets.map(p => ({ ...makePlayer(p.userId, p.username, p.pet), team: p.team, coverCooldown: 0, missedRounds: 0, downedRound: null })),
        totals: {}, teamSignals: {}, round: 1, deadline: new Date(Date.now() + ROUND_MS).toISOString(), pendingMoves: {}, rescueUsed: [false, false], paused: false, effects: [], log: ["Duo Clash started! Choose an action and target."], winnerTeam: null
    };
}

// Call only when all four players have moved or the server deadline expires.
// Locked attacks resolve even if an earlier attack knocked the attacker out;
// stun effects from the current round do not cancel already-locked moves.
export function resolveDuoRound(battle: DuoBattle): { finished: boolean; winnerTeam: 0 | 1 | null; timedOut: string[] } {
    const start = structuredClone(battle.players);
    const moves = { ...battle.pendingMoves };
    const timedOut: string[] = [];
    const currentlyAble = start.filter(p => p.hp > 0);
    battle.effects = [];
    for (const p of currentlyAble) {
        if (!moves[p.userId] && !p.stunnedRounds) {
            moves[p.userId] = { action: "focus" };
            timedOut.push(p.userId);
            appendLog(battle, `${p.petName} timed out: automatic Focus.`);
        }
    }
    for (const p of battle.players) {
        p.missedRounds = timedOut.includes(p.userId) ? (p.missedRounds || 0) + 1 : moves[p.userId] ? 0 : p.missedRounds || 0;
    }
    const cover: Record<string, DuoPlayer> = {};
    // Shields, Cover and rescue declarations are defensive preparations, never blocked by Speed.
    for (const p of battle.players) { p.coverCooldown = Math.max(0, (p.coverCooldown || 0) - 1); }
    for (const actor of currentlyAble) {
        const move = moves[actor.userId];
        if (move?.action === "cover" && move.targetId) {
            cover[move.targetId] = find(battle, actor.userId)!;
            find(battle, actor.userId)!.coverCooldown = 2;
            appendLog(battle, `${actor.petName} is covering their teammate this round.`);
        }
    }
    const rescue: Array<{ actor: DuoPlayer; target: DuoPlayer }> = [];
    for (const actor of currentlyAble) {
        const move = moves[actor.userId];
        if (move?.action === "rescue" && move.targetId) {
            const current = find(battle, actor.userId)!;
            const target = find(battle, move.targetId)!;
            current.focus -= 6;
            current.guardStreak = 0;
            battle.rescueUsed[actor.team] = true;
            rescue.push({ actor: current, target });
            appendLog(battle, `${actor.petName} spent 6 Focus preparing Second Chance for ${target.petName}.`);
        }
    }
    const order = currentlyAble.sort((a, b) => b.speed - a.speed || a.userId.localeCompare(b.userId));
    for (const saved of order) {
        const actor = find(battle, saved.userId)!;
        const move = moves[actor.userId];
        if (!move || move.action === "cover" || move.action === "rescue") { continue; }
        if (actor.stunnedRounds && (actor.stunEffectiveRound || 0) <= battle.round) {
            actor.stunnedRounds--;
            actor.stunEffectiveRound = 0;
            actor.stunImmunity = 3;
            appendLog(battle, `${actor.petName} was stunned and missed their action.`);
            continue;
        }
        let target = move.targetId ? find(battle, move.targetId) : undefined;
        if (!target) {
            // Focus/Guard have no enemy target, but still resolve using the shared combat rules.
            target = battle.players.find(p => p.team !== actor.team && p.hp > 0);
        }
        if (!target) { continue; }
        // An earlier knockout does not silently redirect a committed attack.
        if (move.targetId && target.hp <= 0 && target.team !== actor.team) {
            appendLog(battle, `${actor.petName}'s target was already knocked out; the move was not redirected.`);
            continue;
        }
        let effect: DuoEffect;
        if (target.team === actor.team) {
            effect = applyAllySpecial(battle, actor, target, move.action as "special" | "special2");
        } else {
            const targetBefore = target.hp;
            effect = applyExistingMove(battle, actor, target, move);
            const redirected = cover[target.userId];
            if (redirected && redirected.hp > 0 && targetBefore > target.hp && redirected.userId !== actor.userId) {
                const actual = targetBefore - target.hp;
                const split = Math.floor(actual / 2);
                target.hp = Math.min(target.maxHp, target.hp + split);
                redirected.hp = Math.max(0, redirected.hp - split);
                effect.changes = effect.changes.filter(c => !(c.targetId === target!.userId && c.kind === "damage"));
                effect.changes.push(simpleChange(target.userId, "damage", actual - split));
                effect.changes.push(simpleChange(redirected.userId, "damage", split, "COVER"));
                appendLog(battle, `${redirected.petName} covered ${target.petName} and absorbed ${split} damage.`);
            }
        }
        battle.effects.push(effect);
    }
    for (const p of battle.players) {
        if (p.shield > 0 && (p.shieldExpiresRound || 0) <= battle.round) {
            battle.effects.push({ actorId: "round", targetId: p.userId, action: "shield_expire", description: `${p.petName}'s Shield expired.`, changes: [simpleChange(p.userId, "shield", -p.shield, "EXPIRED")] });
            p.shield = 0;
            p.shieldBreakRefund = 0;
            p.shieldExpiresRound = 0;
        }
        if (p.poisonRounds && p.hp > 0) {
            const damage = Math.min(p.hp, p.poisonDamage || 5);
            p.hp -= damage;
            p.poisonRounds--;
            battle.effects.push({ actorId: "round", targetId: p.userId, action: "poison", description: `${p.petName} took ${damage} poison damage.`, changes: [simpleChange(p.userId, "poison", damage)] });
        }
        if (battle.round >= BRAWL_RULES.pressureStartsRound && p.hp > 0) {
            const pressure = BRAWL_RULES.pressureFirstDamage + (battle.round - BRAWL_RULES.pressureStartsRound) * BRAWL_RULES.pressureGrowth;
            p.hp = Math.max(0, p.hp - pressure);
            battle.effects.push({ actorId: "round", targetId: p.userId, action: "pressure", description: `${p.petName} lost ${pressure} HP to overtime.`, changes: [simpleChange(p.userId, "pressure", pressure)] });
        }
    }
    // Rescue completes only if the rescuer survived the round.
    for (const { actor, target } of rescue) {
        if (actor.hp > 0 && target.hp <= 0 && target.downedRound === battle.round - 1) {
            target.hp = Math.max(1, Math.floor(target.maxHp * .20));
            target.focus = 0;
            target.shield = 0;
            target.shieldExpiresRound = 0;
            target.downedRound = null;
            battle.effects.push({ actorId: actor.userId, targetId: target.userId, action: "rescue", description: `${target.petName} was rescued!`, changes: [simpleChange(target.userId, "heal", target.hp, "REVIVED")] });
            appendLog(battle, `${actor.petName} revived ${target.petName} with 20% HP!`);
        }
    }
    for (const p of battle.players) {
        if (p.hp <= 0 && p.downedRound === null) { p.downedRound = battle.round; }
    }
    const present = ([0, 1] as const).map(team => living(battle, team).length);
    let winner: 0 | 1 | null = null;
    let finished = false;
    if (present[0] === 0 || present[1] === 0) {
        finished = true;
        winner = present[0] === 0 && present[1] === 0 ? null : present[0] > 0 ? 0 : 1;
    }
    const timeoutTeams = ([0, 1] as const).filter(team => battle.players.some(p => p.team === team && p.missedRounds >= 2));
    if (timeoutTeams.length === 2) {
        finished = true;
        winner = null;
        appendLog(battle, "Both teams repeatedly missed turns. Draw: wager refunded.");
    } else if (timeoutTeams.length === 1) {
        finished = true;
        winner = timeoutTeams[0] === 0 ? 1 : 0;
        appendLog(battle, `Team ${timeoutTeams[0] + 1} forfeited after repeated missed turns.`);
    }
    if (!finished && battle.round >= MAX_ROUND) {
        const totals = ([0, 1] as const).map(team => battle.players.filter(p => p.team === team).reduce((sum, p) => sum + p.hp / p.maxHp, 0));
        finished = true;
        winner = Math.abs(totals[0] - totals[1]) < 1e-5 ? null : totals[0] > totals[1] ? 0 : 1;
    }
    // Totals accumulate across all resolved rounds, not only the final round.
    battle.totals ??= {};
    for (const p of battle.players) {
        const previous = battle.totals[p.userId] || { damageDealt: 0, coverDamage: 0, rescues: 0, healing: 0, shieldsGranted: 0 };
        previous.damageDealt += battle.effects.filter(e => e.actorId === p.userId).flatMap(e => e.changes).filter(c => c.kind === "damage" || c.kind === "poison").reduce((sum,c) => sum + (c.amount || 0),0);
        previous.coverDamage += battle.effects.flatMap(e => e.changes).filter(c => c.targetId === p.userId && c.label === "COVER").reduce((sum,c) => sum + (c.amount || 0),0);
        previous.rescues += battle.effects.filter(e => e.actorId === p.userId && e.action === "rescue").length;
        // Rescue HP is not treated as ordinary healing for match recognition.
        previous.healing = (previous.healing || 0) + battle.effects.filter(e => e.actorId === p.userId && e.action !== "rescue").flatMap(e => e.changes).filter(c => c.kind === "heal").reduce((sum,c) => sum + Math.max(0,c.amount || 0),0);
        previous.shieldsGranted = (previous.shieldsGranted || 0) + battle.effects.filter(e => e.actorId === p.userId).flatMap(e => e.changes).filter(c => c.kind === "shield" && (c.amount || 0) > 0).reduce((sum,c) => sum + (c.amount || 0),0);
        battle.totals[p.userId] = previous;
    }
    battle.pendingMoves = {};
    battle.teamSignals = {};
    battle.winnerTeam = winner;
    if (!finished) { battle.round++; battle.deadline = new Date(Date.now() + ROUND_MS).toISOString(); }
    return { finished, winnerTeam: winner, timedOut };
}

async function settle(client: Queryable, row: any, winner: 0 | 1 | null, battle: DuoBattle | null, status: "finished" | "void" = "finished") {
    const participants = row.participants as DuoParticipant[];
    if (row.status !== "active") { return; }
    const chosen = winner === null ? participants : participants.filter(p => p.team === winner);
    const payout = winner === null ? null : calculateArenaPayout(row.wager, 4, row.arena_fee_percent);
    const eachReceives = payout ? payout.payoutPerWinner : row.wager;
    for (const p of chosen) {
        await client.query(coinsQuery, [p.userId, eachReceives]);
    }
    if (payout) {
        await recordArenaFee(client, "duo_2v2", row.id, payout);
    }
    await client.query("UPDATE duo_rooms SET status=$2,battle=$3::jsonb,winner_team=$4,updated_at=NOW() WHERE id=$1", [row.id, status, battle ? JSON.stringify(battle) : row.battle, winner]);
    if (status === "finished") {
        for (const p of participants) {
            const outcome = winner === null ? "draw" : p.team === winner ? "win" : "loss";
            const totals = battle?.totals?.[p.userId] || { damageDealt: 0, coverDamage: 0, rescues: 0 };
            const { damageDealt, coverDamage, rescues: rescueCount } = totals;
            await client.query(`INSERT INTO duo_records(room_id,user_id,team,outcome,wager,cover_damage,rescues,damage_dealt,created_at)
                VALUES($1,$2,$3,$4,$5,$6,$7,$8,NOW()) ON CONFLICT (room_id,user_id) DO NOTHING`, [row.id, p.userId, p.team, outcome, row.wager, coverDamage, rescueCount, damageDealt]);
            await client.query("INSERT INTO mission_events(user_id,metric,amount) VALUES($1,'brawl',1)", [p.userId]);
        }
    }
}

function publicRoom(row: any, viewer: string) {
    const battle = row.battle ? structuredClone(row.battle) as DuoBattle : null;
    if (battle) {
        (battle as any).serverNow = nowIso();
        const moves = battle.pendingMoves;
        (battle as any).myMove = moves[viewer] || null;
        (battle as any).readyCount = Object.keys(moves).length + battle.players.filter(p => p.hp > 0 && p.stunnedRounds && (p.stunEffectiveRound || 0) <= battle.round).length;
        const myTeam = battle.players.find(p => p.userId === viewer)?.team;
        battle.teamReady = Object.keys(moves).filter(sender => battle.players.some(p => p.userId === sender && p.team === myTeam));
        delete (battle as any).pendingMoves;
        // No opponent submission IDs or hidden actions are sent to the client.
        const visibilityTeam = battle.players.find(p => p.userId === viewer)?.team;
        battle.teamSignals = Object.fromEntries(Object.entries(battle.teamSignals || {}).filter(([sender]) =>
            battle.players.some(p => p.userId === sender && p.team === visibilityTeam)));
    }
    return { id: row.id, code: row.code, hostId: row.host_id, wager: row.wager, arenaFeePercent: row.arena_fee_percent, status: row.status, participants: row.participants, battle, winnerTeam: row.winner_team, createdAt: row.created_at };
}

async function assertNotOccupied(client: Queryable, userId: string) {
    const busy = await client.query(`SELECT 1 FROM multiplayer_challenges WHERE status IN ('pending','active') AND (challenger_id=$1 OR challenged_id=$1) LIMIT 1`, [userId]);
    if (busy.rowCount) { throw Error("Finish your Classic 1v1 invitation or match first."); }
    const duo = await client.query(`SELECT 1 FROM duo_rooms WHERE status IN ('lobby','active') AND participants @> $1::jsonb LIMIT 1`, [JSON.stringify([{ userId }])]);
    if (duo.rowCount) { throw Error("You already belong to an open Duo Clash room."); }
}

export function registerDuoClash(app: Express, auth: any, publish: (users: string[], type: string) => void) {
    const handler = (fn: (req: any, res: any) => Promise<void>) => (req: any, res: any) => void Promise.resolve(fn(req, res)).catch(error => {
        console.error("Duo Clash", error);
        if (!res.headersSent) {
            const migrationMissing = (error as any)?.code === "42P01" && String((error as any)?.message || "").includes("arena_fee_ledger");
            res.status(migrationMissing ? 500 : 400).json({ error: migrationMissing
                ? "Paw Brawl's Arena Fee table is missing. Run migration 014 in Neon and retry. No partial coin payout was committed."
                : error instanceof Error ? error.message : "Duo Clash request failed." });
        }
    });
    const inform = (participants: DuoParticipant[]) => publish(participants.map(p => p.userId), "multiplayer_updated");

    app.get("/api/multiplayer/duo/invites", auth, handler(async (req, res) => {
        const q = await pool.query(`SELECT i.id,i.room_id,i.created_at,r.code,r.wager,u.username AS inviter_username
            FROM duo_invites i JOIN duo_rooms r ON r.id=i.room_id JOIN users u ON u.id=i.inviter_id
            WHERE i.recipient_id=$1 AND i.expires_at>NOW() AND r.status='lobby'
              AND NOT (r.participants @> $2::jsonb) AND jsonb_array_length(r.participants)<4
            ORDER BY i.created_at DESC LIMIT 10`, [req.userId, JSON.stringify([{ userId: req.userId }])]);
        res.json(q.rows);
    }));
    app.post("/api/multiplayer/duo/:id/invite", auth, handler(async (req, res) => {
        if (!uuidInput.safeParse(req.params.id).success) { throw Error("Invalid room."); }
        const { friendId } = inviteInput.parse(req.body);
        if (friendId === req.userId) { throw Error("You cannot invite yourself."); }
        const client = await pool.connect();
        let participants: DuoParticipant[] = [];
        try {
            await client.query("BEGIN");
            const q = await client.query("SELECT * FROM duo_rooms WHERE id=$1 FOR UPDATE", [req.params.id]);
            const room = q.rows[0];
            if (!room || room.status !== "lobby" || room.host_id !== req.userId) { throw Error("Only the room host can invite friends."); }
            participants = room.participants as DuoParticipant[];
            if (participants.some(p => p.userId === friendId) || participants.length >= 4) { throw Error("Friend is already in the room or the room is full."); }
            const f = await client.query(`SELECT 1 FROM friendships WHERE status='accepted' AND
              ((requester_id=$1 AND recipient_id=$2) OR (requester_id=$2 AND recipient_id=$1))`, [req.userId, friendId]);
            if (!f.rowCount) { throw Error("You can only invite accepted PawPal friends."); }
            await client.query(`INSERT INTO duo_invites(id,room_id,inviter_id,recipient_id)
              VALUES($1,$2,$3,$4) ON CONFLICT(room_id,recipient_id) DO UPDATE SET created_at=NOW(),expires_at=NOW()+INTERVAL '20 minutes'`, [randomUUID(), room.id, req.userId, friendId]);
            await client.query("COMMIT");
        } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
        inform([...participants, { userId: friendId, team: 0, ready: false, lastSeen: nowIso() }]);
        res.json({ message: "Duo Clash invitation sent!" });
    }));
    app.get("/api/multiplayer/duo/current", auth, handler(async (req, res) => {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const q = await client.query(`SELECT * FROM duo_rooms WHERE participants @> $1::jsonb
                ORDER BY CASE WHEN status IN ('lobby','active') THEN 0 ELSE 1 END,updated_at DESC LIMIT 1 FOR UPDATE`, [JSON.stringify([{ userId: req.userId }])]);
            let row = q.rows[0];
            if (row && ["lobby", "active"].includes(row.status)) {
                const participants = row.participants as DuoParticipant[];
                participants.find(p => p.userId === req.userId)!.lastSeen = nowIso();
                if (row.status === "active" && row.battle?.paused && participants.every(p => Date.now() - Date.parse(p.lastSeen) < OFFLINE_MS)) {
                    row.battle.paused = false;
                    row.battle.deadline = new Date(Date.now() + ROUND_MS).toISOString();
                }
                row.participants = participants;
                await client.query("UPDATE duo_rooms SET participants=$2::jsonb,battle=$3::jsonb WHERE id=$1", [row.id, JSON.stringify(participants), JSON.stringify(row.battle)]);
                if (row.status === "active" && row.battle && !row.battle.paused
                    && participants.every(p => Date.now() - Date.parse(p.lastSeen) < OFFLINE_MS)
                    && Date.now() >= Date.parse(row.battle.deadline)) {
                    const outcome = resolveDuoRound(row.battle as DuoBattle);
                    if (outcome.finished) {
                        await settle(client, row, outcome.winnerTeam, row.battle as DuoBattle);
                    } else {
                        await client.query("UPDATE duo_rooms SET battle=$2::jsonb,updated_at=NOW() WHERE id=$1", [row.id, JSON.stringify(row.battle)]);
                    }
                    const updated = await client.query("SELECT * FROM duo_rooms WHERE id=$1", [row.id]);
                    row = updated.rows[0];
                }
            }
            await client.query("COMMIT");
            res.json({ room: row ? publicRoom(row, req.userId) : null });
        } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
    }));

    app.post("/api/multiplayer/duo/create", auth, handler(async (req, res) => {
        const input = createInput.parse(req.body);
        const client = await pool.connect();
        let room: any;
        try {
            await client.query("BEGIN");
            await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [req.userId]);
            await assertNotOccupied(client, req.userId);
            if (input.wager > 0) {
                const eligible = await client.query("SELECT level FROM pets WHERE owner_id=$1", [req.userId]);
                if (Number(eligible.rows[0]?.level || 0) < 10) {
                    throw Error("Wagered Duo Clash rooms require Level 10 or higher. Choose Free to play at any level.");
                }
            }
            const id = randomUUID();
            const userQ = await client.query("SELECT username FROM users WHERE id=$1", [req.userId]);
            const participant: DuoParticipant = { userId: req.userId, team: 0, ready: false, lastSeen: nowIso(), username: userQ.rows[0]?.username || "Player" };
            for (let attempt = 0; attempt < 4; attempt++) {
                const code = "PAW-" + randomBytes(4).toString("hex").toUpperCase();
                const q = await client.query(`INSERT INTO duo_rooms(id,code,host_id,wager,participants,status)
                    VALUES($1,$2,$3,$4,$5::jsonb,'lobby') ON CONFLICT(code) DO NOTHING RETURNING *`, [id, code, req.userId, input.wager, JSON.stringify([participant])]);
                if (q.rowCount) { room = q.rows[0]; break; }
            }
            if (!room) { throw Error("Could not create a unique room code."); }
            await client.query("COMMIT");
        } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
        res.json({ room: publicRoom(room, req.userId) });
    }));

    app.post("/api/multiplayer/duo/join", auth, handler(async (req, res) => {
        const input = joinInput.parse(req.body);
        const client = await pool.connect();
        let room: any;
        try {
            await client.query("BEGIN");
            await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [req.userId]);
            const q = await client.query("SELECT * FROM duo_rooms WHERE code=$1 FOR UPDATE", [input.code.toUpperCase()]);
            room = q.rows[0];
            if (!room || room.status !== "lobby") { throw Error("Room not found or already started."); }
            if (room.wager > 0) {
                const eligible = await client.query("SELECT level FROM pets WHERE owner_id=$1", [req.userId]);
                if (Number(eligible.rows[0]?.level || 0) < 10) {
                    throw Error("You must reach Level 10 to join a wagered Duo Clash room. Ask the host to create a Free room instead.");
                }
            }
            const participants = room.participants as DuoParticipant[];
            if (!participants.some(p => p.userId === req.userId)) {
                await assertNotOccupied(client, req.userId);
                if (participants.length >= 4 || participants.filter(p => p.team === input.team).length >= 2) { throw Error("That team is full."); }
                const userQ = await client.query("SELECT username FROM users WHERE id=$1", [req.userId]);
                participants.push({ userId: req.userId, team: input.team, ready: false, lastSeen: nowIso(), username: userQ.rows[0]?.username || "Player" });
            } else {
                const existing = participants.find(p => p.userId === req.userId)!;
                if (existing.team !== input.team && participants.filter(p => p.team === input.team).length >= 2) { throw Error("That team is full."); }
                existing.team = input.team;
            }
            participants.forEach(p => { p.ready = false; });
            await client.query("UPDATE duo_rooms SET participants=$2::jsonb,updated_at=NOW() WHERE id=$1", [room.id, JSON.stringify(participants)]);
            room.participants = participants;
            await client.query("COMMIT");
        } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
        inform(room.participants);
        res.json({ room: publicRoom(room, req.userId) });
    }));

    app.post("/api/multiplayer/duo/:id/ready", auth, handler(async (req, res) => {
        if (!uuidInput.safeParse(req.params.id).success) { throw Error("Invalid room."); }
        const client = await pool.connect();
        let participants: DuoParticipant[] = [];
        let outcome = "Ready updated.";
        try {
            await client.query("BEGIN");
            const before = await client.query("SELECT participants FROM duo_rooms WHERE id=$1", [req.params.id]);
            if (!before.rowCount) { throw Error("Lobby no longer available."); }
            const startingIds: string[] = (before.rows[0].participants as DuoParticipant[]).map(p => p.userId).sort();
            // Acquire cross-mode user locks BEFORE the room lock, matching room-join order.
            // Concurrent room membership changes force a retry rather than unsafe escrow.
            for (const id of startingIds) { await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [id]); }
            const q = await client.query("SELECT * FROM duo_rooms WHERE id=$1 FOR UPDATE", [req.params.id]);
            const room = q.rows[0];
            if (!room || room.status !== "lobby") { throw Error("Lobby no longer available."); }
            if (JSON.stringify((room.participants as DuoParticipant[]).map(p => p.userId).sort()) !== JSON.stringify(startingIds)) { throw Error("Room participants changed. Please click Ready again."); }
            participants = room.participants as DuoParticipant[];
            const self = participants.find(p => p.userId === req.userId);
            if (!self) { throw Error("You are not in this room."); }
            self.ready = req.body.ready === true;
            self.lastSeen = nowIso();
            if (participants.length === 4 && participants.every(p => p.ready) && participants.filter(p => p.team === 0).length === 2 && participants.filter(p => p.team === 1).length === 2) {
                // Deterministic row locking avoids duplicate stake deduction across requests.
                const ids = participants.map(p => p.userId).sort();
                // Serialize against simultaneous 1v1 challenge creation and Duo joining.
                const classic = await client.query(`SELECT 1 FROM multiplayer_challenges
                    WHERE status IN ('pending','active') AND (challenger_id=ANY($1::uuid[]) OR challenged_id=ANY($1::uuid[])) LIMIT 1`, [ids]);
                if (classic.rowCount) { throw Error("A player has an open Classic 1v1 invitation or match. Please finish it first."); }
                const petsQ = await client.query(`SELECT p.owner_id,p.name,p.species,p.breed,p.color,p.coins,p.level,u.username
                    FROM pets p JOIN users u ON u.id=p.owner_id WHERE p.owner_id=ANY($1::uuid[]) FOR UPDATE OF p`, [ids]);
                if (petsQ.rows.length !== 4) { throw Error("All four players need pets."); }
                const pets = participants.map(p => ({ userId: p.userId, team: p.team, username: petsQ.rows.find((v: any) => v.owner_id === p.userId).username, pet: petsQ.rows.find((v: any) => v.owner_id === p.userId) }));
                if (room.wager > 0) {
                    if (pets.some(p => Number(p.pet.level) < 10)) {
                        throw Error("All four players must be Level 10 or higher for wagered Duo Clash. Free rooms have no level requirement.");
                    }
                    if (pets.some(p => p.pet.coins < room.wager)) { throw Error("At least one player no longer has enough Paw Coins. Ask everyone to ready again."); }
                    for (const id of ids) { await client.query("UPDATE pets SET coins=coins-$2 WHERE owner_id=$1", [id, room.wager]); }
                }
                room.battle = createDuoBattle(pets);
                room.status = "active";
                outcome = "All four players are ready. Duo Clash started!";
            }
            await client.query("UPDATE duo_rooms SET participants=$2::jsonb,battle=$3::jsonb,status=$4,updated_at=NOW() WHERE id=$1", [room.id, JSON.stringify(participants), room.battle ? JSON.stringify(room.battle) : null, room.status]);
            await client.query("COMMIT");
        } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
        inform(participants);
        res.json({ message: outcome });
    }));

    app.post("/api/multiplayer/duo/:id/leave", auth, handler(async (req, res) => {
        if (!uuidInput.safeParse(req.params.id).success) { throw Error("Invalid room."); }
        const client = await pool.connect();
        let participants: DuoParticipant[] = [];
        try {
            await client.query("BEGIN");
            const q = await client.query("SELECT * FROM duo_rooms WHERE id=$1 FOR UPDATE", [req.params.id]);
            const room = q.rows[0];
            if (!room) { throw Error("Room not found."); }
            participants = room.participants as DuoParticipant[];
            const self = participants.find(p => p.userId === req.userId);
            if (!self) { throw Error("You are not in this room."); }
            if (room.status === "lobby") {
                participants = participants.filter(p => p.userId !== req.userId);
                await client.query("UPDATE duo_rooms SET participants=$2::jsonb,status=$3,updated_at=NOW() WHERE id=$1", [room.id, JSON.stringify(participants), participants.length ? "lobby" : "void"]);
            } else if (room.status === "active") {
                const winner = (self.team === 0 ? 1 : 0) as 0 | 1;
                await settle(client, room, winner, room.battle);
            } else { throw Error("Match already ended."); }
            await client.query("COMMIT");
        } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
        inform(participants);
        res.json({ message: "You left the room." });
    }));

    // Suggestions are teammate-only and never reveal a locked move.
    // One suggestion per player per round avoids spam and server churn.
    app.post("/api/multiplayer/duo/:id/signal", auth, handler(async (req, res) => {
        if (!uuidInput.safeParse(req.params.id).success) { throw Error("Invalid match."); }
        const { targetId } = signalInput.parse(req.body);
        const client = await pool.connect();
        let participants: DuoParticipant[] = [];
        try {
            await client.query("BEGIN");
            const q = await client.query("SELECT * FROM duo_rooms WHERE id=$1 FOR UPDATE", [req.params.id]);
            const room = q.rows[0];
            if (!room || room.status !== "active") { throw Error("This match is no longer active."); }
            participants = room.participants as DuoParticipant[];
            const battle = room.battle as DuoBattle;
            const sender = battle.players.find(p => p.userId === req.userId);
            const target = battle.players.find(p => p.userId === targetId);
            if (!sender || sender.hp <= 0 || !target || target.hp <= 0 || sender.team === target.team) { throw Error("Select a living enemy to suggest."); }
            battle.teamSignals ??= {};
            if (battle.teamSignals[req.userId]?.round === battle.round) { throw Error("You've already suggested a target this round."); }
            battle.teamSignals[req.userId] = { targetId, round: battle.round };
            await client.query("UPDATE duo_rooms SET battle=$2::jsonb WHERE id=$1", [room.id, JSON.stringify(battle)]);
            await client.query("COMMIT");
        } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
        inform(participants.filter(p => p.team === participants.find(x => x.userId === req.userId)?.team));
        res.json({ message: "Target suggestion sent to your teammate." });
    }));

    app.post("/api/multiplayer/duo/:id/forfeit", auth, handler(async (req, res) => {
        if (!uuidInput.safeParse(req.params.id).success) { throw Error("Invalid match."); }
        const client = await pool.connect();
        let participants: DuoParticipant[] = [];
        try {
            await client.query("BEGIN");
            const q = await client.query("SELECT * FROM duo_rooms WHERE id=$1 FOR UPDATE", [req.params.id]);
            const room = q.rows[0];
            if (!room || !["active", "finished", "void"].includes(room.status)) { throw Error("This match isn't available."); }
            participants = room.participants as DuoParticipant[];
            const self = participants.find(p => p.userId === req.userId);
            if (!self) { throw Error("You are not in this match."); }
            // A retried request must never overwrite or pay out a finished match again.
            if (room.status === "active") {
                await settle(client, room, self.team === 0 ? 1 : 0, room.battle);
            }
            await client.query("COMMIT");
        } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
        inform(participants);
        res.json({ message: "Match result saved. The finished match is available to all players." });
    }));

    app.post("/api/multiplayer/duo/:id/move", auth, handler(async (req, res) => {
        if (!uuidInput.safeParse(req.params.id).success) { throw Error("Invalid match."); }
        const move = moveInput.parse(req.body);
        const client = await pool.connect();
        let participants: DuoParticipant[] = [];
        let result = "Move locked.";
        try {
            await client.query("BEGIN");
            const q = await client.query("SELECT * FROM duo_rooms WHERE id=$1 FOR UPDATE", [req.params.id]);
            const room = q.rows[0];
            if (!room || room.status !== "active") { throw Error("Match is no longer active."); }
            participants = room.participants as DuoParticipant[];
            if (!participants.some(p => p.userId === req.userId)) { throw Error("Not a participant."); }
            const battle = room.battle as DuoBattle;
            if (battle.paused) { throw Error("Battle paused while a player reconnects."); }
            if (Date.now() > Date.parse(battle.deadline)) { throw Error("The action timer has ended."); }
            const actor = find(battle, req.userId);
            if (!actor || actor.hp <= 0) { throw Error("Your pet is knocked out."); }
            if (actor.stunnedRounds && (actor.stunEffectiveRound || 0) <= battle.round) { throw Error("Your pet is stunned."); }
            if (battle.pendingMoves[req.userId]) { throw Error("Your move is already locked."); }
            if (!canDuoTarget(battle, actor, move)) { throw Error("Choose a valid target for this move."); }
            if (move.action === "special" || move.action === "special2") {
                const index = move.action === "special" ? 0 : 1;
                const skill = getCombatKit(actor.species, actor.breed).specials[index];
                if (actor.focus < skill.cost || (actor.cooldowns?.[index] || 0) > 0) { throw Error("Not enough Focus or skill still cooling down."); }
            }
            battle.pendingMoves[req.userId] = move;
            const expected = battle.players.filter(p => p.hp > 0 && !(p.stunnedRounds && (p.stunEffectiveRound || 0) <= battle.round)).length;
            if (Object.keys(battle.pendingMoves).length >= expected) {
                const outcome = resolveDuoRound(battle);
                if (outcome.finished) { await settle(client, room, outcome.winnerTeam, battle); result = "Round complete. Match finished!"; }
                else { await client.query("UPDATE duo_rooms SET battle=$2::jsonb,updated_at=NOW() WHERE id=$1", [room.id, JSON.stringify(battle)]); result = "Round resolved!"; }
            } else {
                await client.query("UPDATE duo_rooms SET battle=$2::jsonb,updated_at=NOW() WHERE id=$1", [room.id, JSON.stringify(battle)]);
            }
            await client.query("COMMIT");
        } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
        inform(participants);
        res.json({ message: result });
    }));

    app.get("/api/multiplayer/duo/stats", auth, handler(async (req, res) => {
        const q = await pool.query(`SELECT outcome,COUNT(*)::int AS count FROM duo_records WHERE user_id=$1 GROUP BY outcome`, [req.userId]);
        const totals = await pool.query("SELECT COALESCE(SUM(cover_damage),0)::int AS covered,COALESCE(SUM(rescues),0)::int AS rescues,COALESCE(SUM(damage_dealt),0)::int AS damage FROM duo_records WHERE user_id=$1", [req.userId]);
        res.json({ wins: Number(q.rows.find((r: any) => r.outcome === "win")?.count || 0), losses: Number(q.rows.find((r: any) => r.outcome === "loss")?.count || 0), draws: Number(q.rows.find((r: any) => r.outcome === "draw")?.count || 0), covered: Number(totals.rows[0]?.covered || 0), rescues: Number(totals.rows[0]?.rescues || 0), damage: Number(totals.rows[0]?.damage || 0) });
    }));

    // Row-locked sweeper makes deadlines, reconnect grace and payouts work
    // even if no browser has the page open; it is safe on multiple API instances.
    const sweep = setInterval(async () => {
        const client = await pool.connect();
        const changed: DuoParticipant[][] = [];
        try {
            await client.query("BEGIN");
            const q = await client.query(`SELECT * FROM duo_rooms WHERE status IN ('lobby','active') FOR UPDATE SKIP LOCKED LIMIT 40`);
            for (const room of q.rows) {
                const participants = room.participants as DuoParticipant[];
                if (room.status === "lobby") {
                    if (Date.now() - Date.parse(room.created_at) > 30 * 60 * 1000) {
                        await client.query("UPDATE duo_rooms SET status='void' WHERE id=$1", [room.id]);
                        changed.push(participants);
                    }
                    continue;
                }
                const battle = room.battle as DuoBattle;
                const disconnected = participants.filter(p => Date.now() - Date.parse(p.lastSeen) >= OFFLINE_MS);
                const timedOut = participants.filter(p => Date.now() - Date.parse(p.lastSeen) >= RECONNECT_MS);
                if (timedOut.length) {
                    const absentTeams = new Set(timedOut.map(p => p.team));
                    if (absentTeams.size === 2) { await settle(client, room, null, battle, "void"); }
                    else { await settle(client, room, (timedOut[0].team === 0 ? 1 : 0) as 0 | 1, battle); }
                    changed.push(participants);
                } else if (disconnected.length) {
                    if (!battle.paused) {
                        battle.paused = true;
                        appendLog(battle, "Battle paused for reconnect (45-second grace). ");
                        await client.query("UPDATE duo_rooms SET battle=$2::jsonb WHERE id=$1", [room.id, JSON.stringify(battle)]);
                        changed.push(participants);
                    }
                } else if (!battle.paused && Date.now() >= Date.parse(battle.deadline)) {
                    const outcome = resolveDuoRound(battle);
                    if (outcome.finished) { await settle(client, room, outcome.winnerTeam, battle); }
                    else { await client.query("UPDATE duo_rooms SET battle=$2::jsonb,updated_at=NOW() WHERE id=$1", [room.id, JSON.stringify(battle)]); }
                    changed.push(participants);
                }
            }
            await client.query("COMMIT");
            changed.forEach(inform);
        } catch (e) { await client.query("ROLLBACK"); console.error("Duo Clash sweep:", e); } finally { client.release(); }
    }, 3000);
    sweep.unref();
}
