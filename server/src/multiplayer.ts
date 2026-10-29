import {randomUUID} from 'node:crypto';
import type {Express} from 'express';
import {z} from 'zod';
import {pool} from './db.js';
import {BRAWL_RULES, FOCUS_CAP, SHIELD_CAP, guardShieldForStreak, getCombatKit, getPublicCombatCatalog, getStyle, type BattleSpecial, type BattlePassive, type BreedProgression} from './brawlAbilities.js';

export type Player = {
    userId: string;
    username: string;
    petName: string;
    species: string;
    breed: string;
    color: string;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
    shield: number;
    focus: number;
    cooldown: number;
    style: number;
    trait: number;
    special?: BattleSpecial;
    passive?: BattlePassive;
    progression?: BreedProgression;
    powerCharge?: number;
    evadeCharges?: number;
    lastStandUsed?: boolean;
    guardStreak?: number;
};
export type Battle = {
    players: [Player, Player];
    focusCap?: number;
    rules?: typeof BRAWL_RULES;
    turn: string;
    turns: number;
    turnExpiresAt: string;
    pendingMoves?: Record<string, 'strike' | 'guard' | 'focus' | 'special'>;
    log: string[];
    lastRoundEffects?: Array<{actorId: string; targetId: string; action: string; moveName?: string; dodged?: boolean; playersAfter?: [Player, Player]}>;
    roundSerial?: number;
    roundStartPlayers?: [Player, Player];
};

type DbClient = {query: (sql: string, params?: unknown[]) => Promise<any>};
const gameNames: Record<string, string> = {paw_brawl: 'Paw Brawl'};
const challengeInput = z.object({friendId: z.string().uuid(), gameId: z.literal('paw_brawl'), wager: z.number().int().min(1).max(1000000)});
const actionInput = z.object({action: z.enum(['strike', 'guard', 'focus', 'special'])});
const validId = z.string().uuid();
const alive = (battle: Battle) => battle.players.every(player => player.hp > 0);
const TURN_MS = 30000;
const dodgeChance = (speed: number) => Math.min(0.15, Math.max(0.03, speed * 0.006));
// Abilities are defined in one authoritative catalog, shared through the public rules API.
function kitFor(player: Player) {
    return getCombatKit(player.species, player.breed);
}
function normalizePlayer(player: Player) {
    const kit = kitFor(player);
    player.special = kit.special;
    player.passive = kit.passive;
    player.powerCharge ??= 0;
    player.evadeCharges ??= 0;
    player.lastStandUsed ??= false;
    player.guardStreak ??= 0;
}
function getPassive(player: Player) {
    return kitFor(player).passive;
}
function getDodge(player: Player) {
    const passive = getPassive(player);
    const bonus = passive.kind === 'lightfoot' ? passive.strength / 100 : 0;
    return Math.min(0.45, dodgeChance(player.speed) + bonus + (player.evadeCharges ? 0.20 : 0));
}
export function makePlayer(userId: string, username: string, pet: any): Player {
    const kit = getCombatKit(pet.species, pet.breed);
    return {
        userId, username, petName: pet.name, species: pet.species, breed: pet.breed,
        color: pet.color, hp: kit.stats.hp, maxHp: kit.stats.hp,
        attack: kit.stats.attack, defense: kit.stats.defense, speed: kit.stats.speed,
        shield: 0, focus: 0, cooldown: 0, style: getStyle(pet.breed),
        trait: [...pet.breed].reduce((total: number, char: string) => total + char.charCodeAt(0), 0) % 3,
        special: kit.special, passive: kit.passive, progression: kit.progression, powerCharge: 0, evadeCharges: 0, lastStandUsed: false, guardStreak: 0
    };
}

export function applyMove(battle: Battle, actor: Player, target: Player, action: 'strike' | 'guard' | 'focus' | 'special') {
    normalizePlayer(actor);
    normalizePlayer(target);
    const kit = kitFor(actor);
    const passive = kit.passive;
    const targetPassive = getPassive(target);
    const special = kit.special;
    if (action === 'special' && (actor.focus < special.cost || actor.cooldown > 0)) {
        // A previously queued ability should never roll back the whole round.
        // A reserved Focus cost cannot be stolen by a faster opponent's special.
        throw new Error('Special unavailable at resolution.');
    }
    if (actor.cooldown > 0 && action !== 'special') actor.cooldown--;
    let message = '';
    const effect: {actorId: string; targetId: string; action: string; moveName?: string; dodged?: boolean} = {
        actorId: actor.userId, targetId: target.userId, action,
        moveName: action === 'special' ? special.name : action === 'strike' ? 'Paw Strike' : undefined
    };
    const notes: string[] = [];
    if (action === 'guard') {
        const shieldPotential = guardShieldForStreak(actor.guardStreak || 0, passive);
        const gained = Math.min(Math.max(0, SHIELD_CAP - actor.shield), shieldPotential);
        actor.shield += gained;
        actor.guardStreak = Math.min(2, (actor.guardStreak || 0) + 1);
        // Guard never grants Focus; its diminishing Shield gain prevents turtling.
        message = gained ? `${actor.petName} raised a shield (+${gained} Shield)!` : `${actor.petName} guarded, but could not add any more Shield!`;
    } else if (action === 'focus') {
        actor.guardStreak = 0;
        const before = actor.focus;
        actor.focus = Math.min(FOCUS_CAP, actor.focus + BRAWL_RULES.focusGain);
        const recovered = passive.kind === 'focusheal' ? Math.min(actor.maxHp - actor.hp, passive.strength + 2) : 0;
        actor.hp += recovered;
        message = `${actor.petName} focused (+${actor.focus - before} Focus)${recovered ? ` and healed ${recovered} HP` : ''}!`;
    } else {
        actor.guardStreak = 0;
        if (action === 'special') {
            actor.focus -= special.cost;
            actor.cooldown = Math.max(1, special.cooldown - (passive.kind === 'quickreset' ? 1 : 0));
        } else {
            const gain = BRAWL_RULES.strikeFocus + (passive.kind === 'stride' ? 1 : 0);
            actor.focus = Math.min(FOCUS_CAP, actor.focus + gain);
        }
        let damage = Math.max(8, actor.attack + (action === 'special' ? 2 + Math.floor(special.cost * 1.3) : 7) - Math.floor(target.defense / 2));
        if (passive.kind === 'comeback' && actor.hp <= actor.maxHp / 2) damage += 3 + Math.floor(passive.strength / 2);
        if (actor.powerCharge) {
            damage += actor.powerCharge;
            actor.powerCharge = 0;
        }
        if (action === 'special') {
            if (special.kind === 'burst') damage += 4 + special.strength;
            if (special.kind === 'pierce') damage += 2 + special.strength;
            if (special.kind === 'siphon') damage += Math.floor(special.strength / 2) + 1;
            if (special.kind === 'sunder') damage += 2 + Math.floor(special.strength / 2);
            if (special.kind === 'battery') damage += 2;
            if (special.kind === 'sidestep') damage += 2 + special.strength;
            if (special.kind === 'rally') damage += 3;
            if (special.kind === 'recoil') damage += 9 + special.strength;
            if (special.kind === 'finisher' && target.hp <= target.maxHp / 2) damage += 7 + special.strength;
            if (special.kind === 'mend') {
                const restored = Math.min(actor.maxHp - actor.hp, 4 + special.cost + Math.floor(special.strength / 2));
                actor.hp += restored;
                if (restored) notes.push(`restored ${restored} HP`);
            }
            if (special.kind === 'aegis') {
                const gained = Math.min(SHIELD_CAP - actor.shield, 5 + special.cost + Math.floor(special.strength / 2));
                actor.shield += gained;
                if (gained) notes.push(`gained ${gained} Shield`);
            }
            if (special.kind === 'sidestep') {
                actor.evadeCharges = 1;
                notes.push('prepared an evasive step');
            }
            if (special.kind === 'rally') {
                actor.powerCharge = Math.max(actor.powerCharge || 0, 2 + special.strength);
                notes.push(`charged +${2 + special.strength} damage for the next attack`);
            }
        }
        if (action === 'special' && targetPassive.kind === 'steady') damage = Math.max(1, damage - targetPassive.strength - 1);
        const dodged = Math.random() < getDodge(target);
        effect.dodged = dodged;
        // Prepared evasion is spent by the next incoming attack, hit or miss.
        if (target.evadeCharges) target.evadeCharges = 0;
        const moveName = action === 'special' ? special.name : 'Paw Strike';
        if (dodged) {
            message = `${target.petName} dodged ${actor.petName}'s ${moveName}!`;
        } else {
            if (action === 'special' && special.kind === 'sunder') {
                const shattered = Math.min(target.shield, 8 + special.strength * 2);
                target.shield -= shattered;
                if (shattered) notes.push(`shattered ${shattered} enemy Shield`);
            }
            const pierce = action === 'special' && special.kind === 'pierce' ? Math.min(damage, special.strength + 3) : 0;
            const blocked = Math.min(target.shield, damage - pierce);
            target.shield -= blocked;
            const hpDamage = damage - blocked;
            target.hp = Math.max(0, target.hp - hpDamage);
            if (action === 'special' && special.kind === 'siphon') {
                // Keep enough Focus for an opponent who already locked in a special.
                const reserved = battle.pendingMoves?.[target.userId] === 'special' ? kitFor(target).special.cost : 0;
                const stolen = Math.min(Math.min(2, special.strength - 1), Math.max(0, target.focus - reserved));
                target.focus -= stolen;
                actor.focus = Math.min(FOCUS_CAP, actor.focus + stolen);
                if (stolen) notes.push(`stole ${stolen} Focus`);
            }
            if (action === 'special' && special.kind === 'battery') {
                const before = actor.focus;
                actor.focus = Math.min(FOCUS_CAP, actor.focus + Math.min(3, special.strength));
                if (actor.focus > before) notes.push(`recovered ${actor.focus - before} Focus`);
            }
            if (action === 'strike' && passive.kind === 'leech') actor.hp = Math.min(actor.maxHp, actor.hp + passive.strength + 1);
            if (targetPassive.kind === 'thorns' && blocked > 0) actor.hp = Math.max(1, actor.hp - targetPassive.strength - 2);
            if (targetPassive.kind === 'resolve' && hpDamage > 0) target.focus = Math.min(FOCUS_CAP, target.focus + 1);
            if (targetPassive.kind === 'laststand' && !target.lastStandUsed && target.hp > 0 && target.hp <= target.maxHp * 0.35) {
                const before = target.shield;
                target.shield = Math.min(SHIELD_CAP, target.shield + 6 + targetPassive.strength * 2);
                target.lastStandUsed = true;
                notes.push(`${target.petName}'s ${targetPassive.name} activated (+${target.shield - before} Shield)`);
            }
            message = `${actor.petName} used ${moveName} for ${hpDamage} HP damage${blocked ? ` (${blocked} blocked)` : ''}!`;
        }
        if (action === 'special' && special.kind === 'recoil') {
            const before = actor.hp;
            actor.hp = Math.max(1, actor.hp - 2 - special.strength);
            notes.push(`took ${before - actor.hp} recoil HP`);
        }
        if (notes.length) message += ` (${notes.join('; ')})`;
    }
    battle.lastRoundEffects = [...(battle.lastRoundEffects || []), {...effect, playersAfter: structuredClone(battle.players)}];
    battle.log = [...battle.log, message].slice(-12);
    battle.turns++;
}

// A round stays private until both players choose or the shared timer expires.
// Missing moves are skipped, never replaced with an automatic attack.
export async function resolveRound(client: DbClient, row: any, battle: Battle) {
    const pending = battle.pendingMoves || {};
    battle.players.forEach(normalizePlayer);
    battle.focusCap = FOCUS_CAP;
    battle.roundStartPlayers = structuredClone(battle.players);
    battle.lastRoundEffects = [];
    battle.roundSerial = (battle.roundSerial || 0) + 1;
    const [first, second] = [...battle.players].sort((a, b) => b.speed - a.speed || (a.userId < b.userId ? -1 : 1));
    const actions = [first, second];
    for (const actor of actions) {
        if (!alive(battle)) break;
        const target = battle.players.find(p => p.userId !== actor.userId)!;
        const selectedMove = pending[actor.userId];
        if (selectedMove) {
            // A resolved action no longer needs its reserved Focus; only future
            // locked specials are protected from the other player's Focus drain.
            delete pending[actor.userId];
            applyMove(battle, actor, target, selectedMove);
        }
        else battle.log = [...battle.log, `${actor.petName} did not choose a move and skipped this round.`].slice(-12);
    }
    battle.pendingMoves = {};
    battle.turn = first.userId; // retained for compatibility with saved battles
    battle.turnExpiresAt = new Date(Date.now() + TURN_MS).toISOString();
    const people = [row.challenger_id, row.challenged_id];
    const defeated = battle.players.find(player => player.hp <= 0);
    if (defeated || (battle.roundSerial || 0) >= BRAWL_RULES.maxRounds) {
        const winnerId = defeated
            ? battle.players.find(player => player.userId !== defeated.userId)!.userId
            : Math.abs(battle.players[0].hp / battle.players[0].maxHp - battle.players[1].hp / battle.players[1].maxHp) < 0.00001
                ? null
                : (battle.players[0].hp / battle.players[0].maxHp > battle.players[1].hp / battle.players[1].maxHp ? battle.players[0].userId : battle.players[1].userId);
        if (winnerId) await client.query('UPDATE pets SET coins=coins+$2 WHERE owner_id=$1', [winnerId, row.wager * 2]);
        else await client.query('UPDATE pets SET coins=coins+$2 WHERE owner_id=ANY($1::uuid[])', [people, row.wager]);
        await client.query(`UPDATE multiplayer_challenges SET battle=$2::jsonb,status='finished',winner_id=$3,updated_at=NOW() WHERE id=$1`, [row.id, JSON.stringify(battle), winnerId]);
        await client.query(`INSERT INTO mission_events(user_id,metric,amount) SELECT unnest($1::uuid[]),'brawl',1`, [people]);
        return winnerId ? 'finished' : 'draw';
    }
    await client.query('UPDATE multiplayer_challenges SET battle=$2::jsonb,updated_at=NOW() WHERE id=$1', [row.id, JSON.stringify(battle)]);
    return 'active';
}

function publicChallenge(row: any, viewerId: string) {
    // Never send the opponent's queued move to the browser before round resolution.
    const battle = row.battle ? {...row.battle} : null;
    if (battle) {
        (battle.players || []).forEach(normalizePlayer);
        battle.focusCap = FOCUS_CAP;
        // Rules in the challenge response let every client's move labels reflect
        // the same authoritative balance numbers as the backend and Develop panel.
        battle.rules = BRAWL_RULES;
        const pending = battle.pendingMoves || {};
        battle.myMove = pending[viewerId] || null;
        battle.readyCount = Object.keys(pending).length;
        delete battle.pendingMoves;
    }
    return {
        id: row.id, game_id: row.game_id, game_name: gameNames[row.game_id] || row.game_id,
        challenger_id: row.challenger_id, challenged_id: row.challenged_id,
        challenger_username: row.challenger_username, challenged_username: row.challenged_username,
        wager: row.wager, status: row.status, battle, winner_id: row.winner_id,
        created_at: row.created_at, expires_at: row.expires_at, updated_at: row.updated_at
    };
}
const challengeSelect = `SELECT c.*, a.username AS challenger_username, b.username AS challenged_username
    FROM multiplayer_challenges c
    JOIN users a ON a.id=c.challenger_id JOIN users b ON b.id=c.challenged_id`;

async function cleanupExpired() {
    const client = await pool.connect();
    const affected: string[] = [];
    try {
        await client.query('BEGIN');
        // One transaction owns each expiry; other requests cannot pay out the same escrow twice.
        const expired = await client.query(`SELECT id, challenger_id, challenged_id, wager, status
            FROM multiplayer_challenges
            WHERE (status='pending' AND expires_at<NOW())
               OR (status='active' AND updated_at<NOW()-INTERVAL '15 minutes')
            FOR UPDATE SKIP LOCKED LIMIT 100`);
        for (const row of expired.rows) {
            const status = row.status === 'pending' ? 'expired' : 'cancelled';
            await client.query('UPDATE multiplayer_challenges SET status=$2,updated_at=NOW() WHERE id=$1', [row.id, status]);
            await client.query('UPDATE pets SET coins=coins+$2 WHERE owner_id=$1', [row.challenger_id, row.wager]);
            if (row.status === 'active') await client.query('UPDATE pets SET coins=coins+$2 WHERE owner_id=$1', [row.challenged_id, row.wager]);
            affected.push(row.challenger_id, row.challenged_id);
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
    return affected;
}

export function registerMultiplayer(app: Express, auth: any, publishLive: (users: string[], type: string) => void) {
    const handle = (fn: (req: any, res: any) => Promise<void>) => (req: any, res: any) => {
        Promise.resolve(fn(req, res)).catch(error => {
            console.error('Multiplayer error', error);
            if (!res.headersSent) res.status(500).json({error: 'Unable to complete multiplayer request.'});
        });
    };
    const notify = (users: string[]) => publishLive(users, 'multiplayer_updated');

    // Server-owned and public: the Develop gallery reads the same live rules as battles.
    app.get('/api/multiplayer/rules', (_req, res) => res.json(getPublicCombatCatalog()));

    // Sweep periodically and on reads; works even when the browser was closed.
    const timer = setInterval(() => {
        void cleanupExpired().then(users => {if (users.length) notify(users)}).catch(console.error);
    }, 60000);
    timer.unref();

    // Database-owned turn deadlines: timers keep working with both clients disconnected.
    const turnTimer = setInterval(async () => {
        const client = await pool.connect();
        const affected: string[] = [];
        try {
            await client.query('BEGIN');
            const q = await client.query(`SELECT * FROM multiplayer_challenges WHERE status='active'
                AND (battle->>'turnExpiresAt') IS NOT NULL
                AND (battle->>'turnExpiresAt')::timestamptz <= NOW()
                FOR UPDATE SKIP LOCKED LIMIT 40`);
            for (const row of q.rows) {
                const battle = row.battle as Battle;
                if (!alive(battle)) continue;
                await resolveRound(client, row, battle);
                affected.push(row.challenger_id, row.challenged_id);
            }
            await client.query('COMMIT');
            if (affected.length) notify([...new Set(affected)]);
        } catch (error) {await client.query('ROLLBACK'); console.error('Paw Brawl turn timeout', error)}
        finally {client.release()}
    }, 2000);
    turnTimer.unref();

    app.get('/api/multiplayer/challenges', auth, handle(async (req, res) => {
        const changed = await cleanupExpired();
        if (changed.length) notify(changed);
        const query = await pool.query(`${challengeSelect}
            WHERE c.challenger_id=$1 OR c.challenged_id=$1
            ORDER BY CASE WHEN c.status IN ('pending','active') THEN 0 ELSE 1 END,
                     c.created_at DESC LIMIT 30`, [req.userId]);
        res.json(query.rows.map((row: any) => publicChallenge(row, req.userId)));
    }));

    app.post('/api/multiplayer/challenges', auth, handle(async (req, res) => {
        const input = challengeInput.safeParse(req.body);
        if (!input.success) {res.status(400).json({error: 'Choose a real friend and a whole-number wager from 1 to 1,000,000.'}); return}
        const {friendId, gameId, wager} = input.data;
        if (friendId === req.userId) {res.status(400).json({error: 'You cannot challenge yourself.'}); return}
        const client = await pool.connect();
        let status = 201;
        let error = '';
        let id = '';
        try {
            await client.query('BEGIN');
            // Guard against concurrent creation from multiple tabs/servers.
            const keys = [req.userId, friendId].sort();
            for (const key of keys) await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [key]);
            const friends = await client.query(`SELECT 1 FROM friendships WHERE status='accepted'
                AND ((requester_id=$1 AND recipient_id=$2) OR (requester_id=$2 AND recipient_id=$1))`, [req.userId, friendId]);
            if (!friends.rowCount) {status = 403; error = 'Only accepted PawPal friends can be challenged.'}
            if (!error) {
                const occupied = await client.query(`SELECT 1 FROM multiplayer_challenges
                    WHERE status IN ('pending','active') AND
                    (challenger_id=ANY($1::uuid[]) OR challenged_id=ANY($1::uuid[])) LIMIT 1`, [[req.userId, friendId]]);
                if (occupied.rowCount) {status = 409; error = 'You or your friend already has an open challenge or battle.'}
            }
            if (!error) {
                const paid = await client.query('UPDATE pets SET coins=coins-$2 WHERE owner_id=$1 AND coins >= $2 RETURNING id', [req.userId, wager]);
                if (!paid.rowCount) {status = 400; error = 'You do not have enough Paw Coins for that wager.'}
            }
            if (!error) {
                id = randomUUID();
                await client.query(`INSERT INTO multiplayer_challenges (id,game_id,challenger_id,challenged_id,wager)
                    VALUES ($1,$2,$3,$4,$5)`, [id, gameId, req.userId, friendId, wager]);
            }
            if (error) await client.query('ROLLBACK');
            else await client.query('COMMIT');
        } catch (e) {await client.query('ROLLBACK'); throw e} finally {client.release()}
        if (error) {res.status(status).json({error}); return}
        notify([req.userId, friendId]);
        res.status(201).json({id, message: 'Paw Brawl challenge sent! Your wager is safely reserved.'});
    }));

    app.post('/api/multiplayer/challenges/:id/respond', auth, handle(async (req, res) => {
        if (!validId.safeParse(req.params.id).success || !['accept', 'decline', 'cancel'].includes(req.body?.action)) {
            res.status(400).json({error: 'Invalid challenge action.'}); return;
        }
        const action = req.body.action as 'accept' | 'decline' | 'cancel';
        const client = await pool.connect();
        let error = '';
        let status = 400;
        let people: string[] = [];
        try {
            await client.query('BEGIN');
            const found = await client.query('SELECT * FROM multiplayer_challenges WHERE id=$1 FOR UPDATE', [req.params.id]);
            const row = found.rows[0];
            if (!row) {status = 404; error = 'Challenge not found.'}
            else if (row.status !== 'pending') {status = 409; error = 'That challenge is no longer pending.'}
            else if (action === 'cancel' && row.challenger_id !== req.userId || action !== 'cancel' && row.challenged_id !== req.userId) {
                status = 403; error = 'This challenge is not addressed to you.';
            } else if (new Date(row.expires_at).getTime() <= Date.now()) {
                status = 409; error = 'That challenge expired. Refresh the page.';
            } else {
                people = [row.challenger_id, row.challenged_id];
                if (action !== 'accept') {
                    await client.query('UPDATE pets SET coins=coins+$2 WHERE owner_id=$1', [row.challenger_id, row.wager]);
                    await client.query('UPDATE multiplayer_challenges SET status=$2,updated_at=NOW() WHERE id=$1', [row.id, action === 'cancel' ? 'cancelled' : 'declined']);
                } else {
                    const paid = await client.query('UPDATE pets SET coins=coins-$2 WHERE owner_id=$1 AND coins >= $2 RETURNING id', [row.challenged_id, row.wager]);
                    if (!paid.rowCount) {error = 'You need enough Paw Coins to match the wager.'}
                    else {
                        const p = await client.query(`SELECT p.owner_id, p.name, p.species, p.breed, p.color, u.username
                            FROM pets p JOIN users u ON u.id=p.owner_id WHERE p.owner_id = ANY($1::uuid[])`, [people]);
                        const first = p.rows.find((entry: any) => entry.owner_id === row.challenger_id);
                        const second = p.rows.find((entry: any) => entry.owner_id === row.challenged_id);
                        if (!first || !second) {error = 'Both players must have adopted pets.'}
                        else {
                            const players: [Player, Player] = [makePlayer(row.challenger_id, first.username, first), makePlayer(row.challenged_id, second.username, second)];
                            const turn = players[0].speed >= players[1].speed ? players[0].userId : players[1].userId;
                            const battle: Battle = {players, focusCap: FOCUS_CAP, turn, turns: 0, pendingMoves: {}, turnExpiresAt: new Date(Date.now() + TURN_MS).toISOString(), log: [`${players.find(p => p.userId === turn)?.petName} moves first!`]};
                            await client.query(`UPDATE multiplayer_challenges SET status='active',battle=$2::jsonb,updated_at=NOW() WHERE id=$1`, [row.id, JSON.stringify(battle)]);
                        }
                    }
                }
            }
            if (error) await client.query('ROLLBACK'); else await client.query('COMMIT');
        } catch (e) {await client.query('ROLLBACK'); throw e} finally {client.release()}
        if (error) {res.status(status).json({error}); return}
        notify(people);
        res.json({message: action === 'accept' ? 'Battle started!' : action === 'decline' ? 'Challenge declined. Wager refunded.' : 'Challenge cancelled. Wager refunded.'});
    }));

    app.post('/api/multiplayer/challenges/:id/move', auth, handle(async (req, res) => {
        const input = actionInput.safeParse(req.body);
        if (!validId.safeParse(req.params.id).success || !input.success) {
            res.status(400).json({error: 'Choose a valid battle move.'}); return;
        }
        const client = await pool.connect();
        let error = '';
        let status = 409;
        let players: string[] = [];
        let outcome = 'active';
        try {
            await client.query('BEGIN');
            const found = await client.query('SELECT * FROM multiplayer_challenges WHERE id=$1 FOR UPDATE', [req.params.id]);
            const row = found.rows[0];
            if (!row || ![row.challenger_id, row.challenged_id].includes(req.userId)) {status = 404; error = 'Battle not found.'}
            else if (row.status !== 'active') error = 'That battle has already ended.';
            else {
                const battle = row.battle as Battle;
                const pending = battle.pendingMoves || {};
                if (pending[req.userId]) error = 'Your move is already locked in for this round.';
                else if (!alive(battle)) error = 'Battle already completed.';
                else if (new Date(battle.turnExpiresAt).getTime() <= Date.now()) error = 'This round has expired. Any player who did not choose a move skips the round.';
                else if (input.data.action === 'special' && (battle.players.find(player => player.userId === req.userId)!.focus < kitFor(battle.players.find(player => player.userId === req.userId)!).special.cost || battle.players.find(player => player.userId === req.userId)!.cooldown > 0)) error = `You need ${kitFor(battle.players.find(player => player.userId === req.userId)!).special.cost} Focus and no cooldown to use that special.`;
                else {
                    pending[req.userId] = input.data.action;
                    battle.pendingMoves = pending;
                    if (Object.keys(pending).length === 2) outcome = await resolveRound(client, row, battle);
                    else await client.query('UPDATE multiplayer_challenges SET battle=$2::jsonb,updated_at=NOW() WHERE id=$1', [row.id, JSON.stringify(battle)]);
                    players = [row.challenger_id, row.challenged_id];
                }
            }
            if (error) await client.query('ROLLBACK'); else await client.query('COMMIT');
        } catch (e) {await client.query('ROLLBACK'); throw e} finally {client.release()}
        if (error) {res.status(status).json({error}); return}
        notify(players);
        res.json({message: outcome === 'draw' ? 'Draw! Both wagers refunded.' : outcome === 'finished' ? 'Battle over! Winner paid.' : outcome === 'active' ? 'Move locked in! The round resolves when both players choose.' : 'Move submitted!'});
    }));

    app.post('/api/multiplayer/challenges/:id/forfeit', auth, handle(async (req, res) => {
        if (!validId.safeParse(req.params.id).success) {res.status(400).json({error: 'Invalid battle.'}); return}
        const client = await pool.connect();
        let people: string[] = [];
        let error = '';
        try {
            await client.query('BEGIN');
            const q = await client.query('SELECT * FROM multiplayer_challenges WHERE id=$1 FOR UPDATE', [req.params.id]);
            const row = q.rows[0];
            if (!row || ![row.challenger_id, row.challenged_id].includes(req.userId) || row.status !== 'active') error = 'That battle is not active.';
            else {
                const winnerId = row.challenger_id === req.userId ? row.challenged_id : row.challenger_id;
                people = [row.challenger_id, row.challenged_id];
                await client.query('UPDATE pets SET coins=coins+$2 WHERE owner_id=$1', [winnerId, row.wager * 2]);
                await client.query(`UPDATE multiplayer_challenges SET status='finished',winner_id=$2,updated_at=NOW() WHERE id=$1`, [row.id, winnerId]);
            }
            if (error) await client.query('ROLLBACK'); else await client.query('COMMIT');
        } catch (e) {await client.query('ROLLBACK'); throw e} finally {client.release()}
        if (error) {res.status(409).json({error}); return}
        notify(people);
        res.json({message: 'You forfeited. Your opponent won the prize pool.'});
    }));
}
