import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Check, CircleHelp, Clock3, Coins, Copy, HeartPulse, Moon, Shield, Sparkles, Star, Swords, Trophy, Users, X, Zap } from "lucide-react";
import { arenaPayout } from "./arenaFee";
import PetArt from "./PetArt";
import BrawlStatusBadges from "./BrawlStatusBadges";
import MatchExitConfirmation from "./MatchExitConfirmation";
import "./DuoClash.css";

type DuoPlayer = {
    userId: string; username: string; petName: string; species: string; breed: string; color: string;
    team: 0 | 1; hp: number; maxHp: number; focus: number; shield: number; shieldExpiresRound?: number;
    attack: number; defense: number; speed: number; cooldowns?: [number, number];
    coverCooldown?: number; stunnedRounds?: number; stunEffectiveRound?: number; downedRound?: number | null;
    poisonRounds?: number; poisonDamage?: number; counterDamage?: number; evadeCharges?: number;
    specials?: { name: string; description: string; cost: number; cooldown: number; kind: string }[];
};
type Participant = { userId: string; username?: string; team: 0 | 1; ready: boolean; lastSeen: string };
type DuoMove = { action: string; targetId?: string };
type DuoBattle = {
    players: DuoPlayer[]; round: number; deadline: string; serverNow?: string; paused: boolean; log: string[];
    effects: { actorId: string; targetId: string; action: string; description: string; changes: { targetId: string; kind: string; amount: number }[] }[];
    rescueUsed: [boolean, boolean]; myMove?: DuoMove | null; readyCount?: number; winnerTeam: 0 | 1 | null;
    teamReady?: string[]; teamSignals?: Record<string,{ targetId:string; round:number }>;
    totals?: Record<string,{damageDealt:number;coverDamage:number;rescues:number;healing?:number;shieldsGranted?:number}>;
};
type Room = {
    id: string; code: string; hostId: string; wager: number; arenaFeePercent: number; status: "lobby" | "active" | "finished" | "void";
    participants: Participant[]; battle: DuoBattle | null; winnerTeam: 0 | 1 | null;
};
type Props = { api: string; token: string; userId: string; friends: { friend_id: string; username: string }[]; onUpdate: () => Promise<void>; onToast: (text: string) => void; petLevel: number; lobbyOpen: boolean; onCloseLobby: () => void };
type Action = "strike" | "guard" | "focus" | "special" | "special2" | "cover" | "rescue";
const actions: { value: Action; label: string }[] = [
    { value: "strike", label: "Paw Strike" }, { value: "guard", label: "Guard" }, { value: "focus", label: "Focus" },
    { value: "special", label: "Special 1" }, { value: "special2", label: "Special 2" }, { value: "cover", label: "Cover" }, { value: "rescue", label: "Rescue" }
];
const TEAM_NAMES = ["Moonpaws", "Starwhiskers"] as const;
const supportsAlly = new Set(["mend", "cleanse", "aegis", "bulwark", "fortress", "riposte", "rallyguard"]);

export default function DuoClash({ api, token, userId, friends, onUpdate, onToast, petLevel, lobbyOpen, onCloseLobby }: Props) {
    const [room, setRoom] = useState<Room | null>(null);
    const [autoShowResult, setAutoShowResult] = useState(false);
    const previousRoomStatus = useRef<string | null>(null);
    const dialogCloseRef = useRef<HTMLButtonElement | null>(null);
    const [wager, setWager] = useState(petLevel >= 10 ? "100" : "0");
    const [inviteFriend, setInviteFriend] = useState("");
    const [invitations, setInvitations] = useState<{id:string;code:string;wager:number;inviter_username:string}[]>([]);
    const [joinCode, setJoinCode] = useState("");
    const [codeCopied, setCodeCopied] = useState(false);
    useEffect(() => setCodeCopied(false), [room?.code]);
    const [team, setTeam] = useState<0 | 1>(1);
    const [action, setAction] = useState<Action>("strike");
    const [targetId, setTargetId] = useState("");
    const [busy, setBusy] = useState(false);
    const [now, setNow] = useState(Date.now());
    const [confirmQuit, setConfirmQuit] = useState(false);
    const [forfeitError, setForfeitError] = useState("");
    const [clockOffset, setClockOffset] = useState(0);
    const [locallyLockedMove, setLocallyLockedMove] = useState("");
    const mutationGeneration = useRef(0);
    const [skillHelp, setSkillHelp] = useState<number | null>(null);
    const [battleHistory, setBattleHistory] = useState(false);
    const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0, covered: 0, rescues: 0, damage: 0 });
    const [dismissedId, setDismissedId] = useState<string | null>(null);
    const [floating, setFloating] = useState<{ round: number; byPet: Record<string, {kind:string; amount:number}[]> } | null>(null);
    const [effectStep, setEffectStep] = useState<{ round: number; index: number } | null>(null);
    const refreshInFlight = useRef(false);

    const request = useCallback(async (path: string, method = "GET", body?: object) => {
        const response = await fetch(`${api}/api/multiplayer/duo${path}`, {
            method,
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: body ? JSON.stringify(body) : undefined
        });
        const json = await response.json().catch(() => {
            throw Error("Duo Clash couldn't reach a working backend. Check the Render deployment and refresh.");
        });
        if (!response.ok) { throw Error(json.error || "Duo Clash couldn't complete the request."); }
        return json;
    }, [api, token]);
    const refresh = useCallback(async () => {
        if (refreshInFlight.current) { return; }
        refreshInFlight.current = true;
        const generation = mutationGeneration.current;
        try {
            // Parallel, deduplicated reads avoid stale lobby states from overlapping polls.
            const [result, invites] = await Promise.all([request("/current"), request("/invites")]);
            // An older GET must never overwrite a room changed by a successful POST.
            if (generation === mutationGeneration.current) {
                const serverNow = result.room?.battle?.serverNow;
                if (serverNow) { setClockOffset(Date.now() - Date.parse(serverNow)); }
                setRoom(result.room || null);
                setInvitations(invites);
            }
        } catch (error) {
            // Temporary reconnect failures do not erase the current battle UI.
            if (document.visibilityState === "visible") {
                onToast(error instanceof Error ? error.message : "Couldn't refresh Duo Clash.");
            }
        } finally { refreshInFlight.current = false; }
    }, [request, onToast]);
    useEffect(() => {
        void refresh();
        void request("/stats").then(setStats).catch(() => {});
        const interval = window.setInterval(() => {
            // Polling also keeps the authenticated reconnect heartbeat alive.
            void refresh();
        }, 3500);
        return () => window.clearInterval(interval);
    }, [refresh, request]);
    useEffect(() => {
        const interval = window.setInterval(() => setNow(Date.now()), 350);
        return () => window.clearInterval(interval);
    }, []);
    const submit = async (path: string, body: object) => {
        if (busy) { return false; }
        mutationGeneration.current++;
        setBusy(true);
        try {
            const data = await request(path, "POST", body);
            if (data.room) { setRoom(data.room); }
            if (data.message) { onToast(data.message); }
            if (path.endsWith("/forfeit")) { setForfeitError(""); }
            // The POST is authoritative. Noncritical refresh errors must not turn a
            // successful forfeit into an apparent failure.
            void refresh();
            void onUpdate().catch(() => {});
            void request("/stats").then(setStats).catch(() => {});
            return true;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Action failed.";
            onToast(message);
            if (path.endsWith("/forfeit")) { setForfeitError(message); }
            await refresh();
            return false;
        } finally { setBusy(false); }
    };
    useEffect(() => {
        if (previousRoomStatus.current === "active" && (room?.status === "finished" || room?.status === "void")) {
            setAutoShowResult(true);
        }
        previousRoomStatus.current = room?.status || null;
    }, [room?.status]);
    const closeLobbyDialog = () => {
        setAutoShowResult(false);
        onCloseLobby();
    };
    const validWager = /^\d+$/.test(wager) && Number.isSafeInteger(Number(wager)) && Number(wager) >= 0 && Number(wager) <= 100;
    const wagerAmount = validWager ? Number(wager) : 0;
    const wagerLevelLocked = validWager && wagerAmount > 0 && petLevel < 10;
    const wagerPreview = validWager ? arenaPayout(wagerAmount, 4) : null;
    const roomPrize = room ? arenaPayout(room.wager, 4, room.arenaFeePercent) : null;
    const self = room?.participants.find(p => p.userId === userId);
    const battle = room?.battle;
    const me = battle?.players.find(p => p.userId === userId);
    const teamPlayers = battle?.players.filter(p => p.team === me?.team) || [];
    const enemyPlayers = battle?.players.filter(p => p.team !== me?.team) || [];
    const ally = teamPlayers.find(p => p.userId !== userId);
    const spec = action === "special" ? me?.specials?.[0] : action === "special2" ? me?.specials?.[1] : undefined;
    const isSupport = !!spec && supportsAlly.has(spec.kind);
    const targetOptions = battle && me && (action === "cover" ? teamPlayers.filter(p => p.userId !== userId && p.hp > 0)
        : action === "rescue" ? teamPlayers.filter(p => p.userId !== userId && p.hp <= 0 && p.downedRound === battle.round - 1)
            : action === "guard" || action === "focus" ? []
                : [...enemyPlayers.filter(p => p.hp > 0), ...(isSupport ? teamPlayers.filter(p => p.hp > 0 && p.userId !== userId) : [])]) || [];
    const selectedTarget = targetOptions.find(p => p.userId === targetId) || targetOptions[0];
    const timeLeft = battle ? Math.max(0, Math.ceil((Date.parse(battle.deadline) - now + clockOffset) / 1000)) : 40;
    const currentTurnKey = `${room?.id || ""}:${battle?.round ?? 0}`;
    const locallyLocked = locallyLockedMove === currentTurnKey;
    const totalReady = battle?.players.filter(p => p.hp > 0).length || 4;
    const canAct = !!room && room.status === "active" && !!me && me.hp > 0 && !battle?.myMove && !locallyLocked && !busy && !battle?.paused && timeLeft > 0 && !(me.stunnedRounds && (me.stunEffectiveRound || 0) <= battle!.round)
        && (!spec || (me.focus >= spec.cost && (me.cooldowns?.[action === "special" ? 0 : 1] || 0) === 0))
        && (action !== "cover" || (me.coverCooldown || 0) === 0)
        && (action !== "rescue" || (me.focus >= 6 && !battle?.rescueUsed[me.team] && !!battle && battle.round < 11))
        && (!!selectedTarget || ["focus", "guard"].includes(action));
    const order = [...(battle?.players || [])].filter(p => p.hp > 0).sort((a, b) => b.speed - a.speed || a.userId.localeCompare(b.userId));
    const activeEffect = effectStep && battle && effectStep.round === battle.round ? battle.effects[effectStep.index] : undefined;
    const activeTargets = new Set(activeEffect?.changes?.map(c => c.targetId) || []);
    const suggested = Object.values(battle?.teamSignals || {}).filter(s => s.round === battle?.round).map(s => s.targetId);
    const ownSignal = !!battle && battle.teamSignals?.[userId]?.round === battle.round;
    const teamLocked = battle?.teamReady || [];
    const matchTotals: NonNullable<DuoBattle["totals"]> = battle?.totals || {};
    const matchLeader = (field: "damageDealt" | "coverDamage" | "rescues" | "healing") => {
        const players = battle?.players || [];
        const highest = Math.max(0, ...players.map(p => matchTotals[p.userId]?.[field] || 0));
        return highest > 0 ? players.find(p => (matchTotals[p.userId]?.[field] || 0) === highest) : undefined;
    };
    useEffect(() => {
        if (!battle || !room || room.status !== "active" || battle.round <= 1 || !battle.effects?.length) { return; }
        const byPet: Record<string, {kind:string; amount:number}[]> = {};
        for (const effect of battle.effects) {
            for (const value of effect.changes) {
                if (!value.amount) { continue; }
                (byPet[value.targetId] ??= []).push({ kind: value.kind, amount: value.amount });
            }
        }
        setFloating({ round: battle.round - 1, byPet });
        setEffectStep({ round: battle.round, index: 0 });
        const timeouts = battle.effects.map((_, index) => window.setTimeout(() => {
            setEffectStep({ round: battle.round, index });
        }, index * 360));
        const end = window.setTimeout(() => { setFloating(null); setEffectStep(null); }, Math.max(1700, battle.effects.length * 360 + 250));
        return () => { timeouts.forEach(window.clearTimeout); window.clearTimeout(end); };
    }, [room?.id, room?.status, battle?.round]);
    useEffect(() => {
        if (!room || room.status !== "active") { return; }
        const onEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") { return; }
            if (skillHelp !== null) { setSkillHelp(null); }
            else if (battleHistory) { setBattleHistory(false); }
            else if (confirmQuit) { if (!busy) { setConfirmQuit(false); } }
            else { setConfirmQuit(true); }
        };
        window.addEventListener("keydown", onEscape);
        return () => window.removeEventListener("keydown", onEscape);
    }, [room?.status, skillHelp, battleHistory, confirmQuit, busy]);
    useEffect(() => {
        if (!(lobbyOpen || autoShowResult) || room?.status === "active") { return; }
        dialogCloseRef.current?.focus();
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.stopImmediatePropagation();
                closeLobbyDialog();
            }
        };
        window.addEventListener("keydown", onEscape);
        return () => window.removeEventListener("keydown", onEscape);
    }, [lobbyOpen, autoShowResult, room?.status, onCloseLobby]);

    const renderLobbyDialog = (title: string, subtitle: string, contents: ReactNode) => <div
        className="paw-multi-dialog-backdrop paw-duo-modal-backdrop"
        onMouseDown={event => {
            if (event.target === event.currentTarget) { closeLobbyDialog(); }
        }}
    >
        <section className="paw-multi-dialog paw-duo-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="paw-duo-modal-title">
            <div className="paw-multi-dialog-header">
                <div>
                    <h3 id="paw-duo-modal-title"><Users size={21}/> {title}</h3>
                    <p className="paw-modal-subtitle">{subtitle}</p>
                </div>
                <button ref={dialogCloseRef} type="button" className="paw-multi-dialog-close" aria-label="Close Duo Clash" onClick={closeLobbyDialog}><X size={19}/></button>
            </div>
            <div className="paw-multi-dialog-body paw-duo-dialog-content">
                {contents}
            </div>
        </section>
    </div>;

    const chooseAction = (value: Action) => { setAction(value); setTargetId(""); };
    useEffect(() => {
        // Start each new round on a usable basic move, not an unaffordable
        // special or Cover with an active cooldown left from the previous turn.
        setAction("strike");
        setTargetId("");
    }, [room?.id, battle?.round]);
    const suggestEnemy = () => {
        if (!room || !selectedTarget || selectedTarget.team === me?.team || ownSignal || busy) { return; }
        void submit(`/${room.id}/signal`, { targetId: selectedTarget.userId });
    };
    const move = () => {
        if (!room || !canAct) { return; }
        const key = `${room.id}:${battle?.round ?? 0}`;
        setLocallyLockedMove(key);
        void submit(`/${room.id}/move`, { action, ...(selectedTarget ? { targetId: selectedTarget.userId } : {}) })
            .then(ok => { if (!ok) { setLocallyLockedMove(""); } });
    };

    return <section className="paw-duo-root" aria-label="Paw Brawl Duo Clash">
        {room?.status === "active" && battle && me ? <div className="paw-duo-backdrop">
            <section className="paw-duo-battle" role="dialog" aria-modal="true" aria-label="Duo Clash battle">
                <header className="paw-duo-battle-head paw-multi-dialog-header"><div><h2><Swords size={20}/> Paw Brawl · Duo Clash</h2><small>Round {battle.round} · {TEAM_NAMES[me.team]} vs {TEAM_NAMES[me.team === 0 ? 1 : 0]} · {roomPrize?.grossPool} Paw Coins pool · {roomPrize?.fee} Arena Fee</small></div><button className="paw-duo-close paw-multi-dialog-close" aria-label="Quit Duo Clash" onClick={() => setConfirmQuit(true)}><X size={20}/></button></header>
                <div className="paw-duo-score-row"><span><b>{battle.round >= 11 ? "OVERTIME" : `ROUND ${battle.round}`}</b></span><span><Clock3 size={14}/> {battle.paused ? "PAUSED · RECONNECTING" : timeLeft <= 0 ? "SYNCING ROUND" : `${timeLeft}s`}</span><span>{battle.readyCount || 0}/{totalReady} ready</span></div>
                <div className="paw-duo-arena">
                    <div className="paw-duo-order" aria-label="Action resolution order"><span>ACTION ORDER</span><div>{order.map((p, i) => <div key={p.userId} className={`paw-duo-order-pet ${p.team === me.team ? "ally" : "enemy"} ${activeEffect?.actorId === p.userId ? "is-acting" : ""}`} title={`${i + 1}. ${p.petName} · Speed ${p.speed}`}><PetArt species={p.species} breed={p.breed} color={p.color} cosmetic="none"/><small>{p.speed}</small></div>)}</div></div>
                    <div className="paw-duo-arena-lines" aria-hidden="true"/>
                    <div className="paw-duo-arena-side is-enemy">{enemyPlayers.map(p => <DuoFighter key={p.userId} pet={p} mine={false} round={Math.max(0,battle.round-1)} changes={floating?.round === battle.round - 1 ? floating.byPet[p.userId] : undefined} selectable={targetOptions.some(t => t.userId === p.userId) && !battle.myMove} selected={selectedTarget?.userId === p.userId} onChoose={() => setTargetId(p.userId)} acting={activeEffect?.actorId === p.userId} impacted={activeTargets.has(p.userId)} suggested={suggested.includes(p.userId)}/>)}</div>
                    <div className="paw-duo-center-vs" aria-hidden="true">VS</div>
                    <div className="paw-duo-arena-side is-ally">{teamPlayers.map(p => <DuoFighter key={p.userId} pet={p} mine={p.userId === userId} round={Math.max(0,battle.round-1)} changes={floating?.round === battle.round - 1 ? floating.byPet[p.userId] : undefined} selectable={targetOptions.some(t => t.userId === p.userId) && !battle.myMove} selected={selectedTarget?.userId === p.userId} onChoose={() => setTargetId(p.userId)} acting={activeEffect?.actorId === p.userId} impacted={activeTargets.has(p.userId)} ready={teamLocked.includes(p.userId)}/>)}</div>
                </div>
                <div className="paw-duo-actions">
                    {!battle.paused && timeLeft <= 0 && !battle.myMove && <button type="button" className="paw-duo-refresh-turn" onClick={() => void refresh()}>Refresh battle round</button>}
                    {battle.myMove || locallyLocked ? <div className="paw-duo-locked"><Check size={18}/> Your move is locked. Waiting for teammates and opponents.</div> : <>
                        <div className="paw-duo-move-list">{actions.map(item => {
                            const index = item.value === "special" ? 0 : 1;
                            const skill = item.value === "special" || item.value === "special2" ? me.specials?.[index] : null;
                            const disabled = !!skill && (me.focus < skill.cost || (me.cooldowns?.[index] || 0) > 0) || item.value === "cover" && !!me.coverCooldown || item.value === "rescue" && (battle.rescueUsed[me.team] || me.focus < 6 || battle.round >= 11 || !ally || ally.hp > 0);
                            return <div className="paw-duo-move-item" key={item.value}>
                                <button type="button" disabled={disabled} className={action === item.value ? "is-selected" : ""} onClick={() => chooseAction(item.value)}>
                                    {item.value === "cover" ? <Shield size={16}/> : item.value === "rescue" ? <HeartPulse size={16}/> : item.value === "focus" ? <Zap size={16}/> : <Swords size={16}/>}
                                    <span>{skill ? skill.name : item.label}</span>
                                    {skill ? <small>{skill.cost} Focus · {skill.cooldown} rounds</small> : item.value === "rescue" ? <small>6 Focus</small> : null}
                                </button>
                                {skill && <button type="button" className="paw-duo-skill-help" aria-label={`Explain ${skill.name}`} title={`Explain ${skill.name}`} onClick={() => setSkillHelp(index)}><CircleHelp size={15}/></button>}
                            </div>;
                        })}</div>
                        {!!targetOptions.length && <div className="paw-duo-target-row" aria-label="Choose target"><b>Target:</b>{targetOptions.map(p => <button key={p.userId} className={selectedTarget?.userId === p.userId ? "is-selected" : ""} onClick={() => setTargetId(p.userId)}>{p.team === me.team ? <HeartPulse size={13}/> : <Swords size={13}/>} {p.petName} <small>{p.hp} HP</small></button>)}</div>}
                        {selectedTarget && selectedTarget.team !== me.team && !ownSignal && <button type="button" className="paw-duo-signal" disabled={busy || battle.paused} onClick={suggestEnemy}><Users size={13}/> Suggest {selectedTarget.petName} to teammate</button>}
                        {suggested.length > 0 && <small className="paw-duo-signal-note">Team suggestion: {enemyPlayers.filter(p => suggested.includes(p.userId)).map(p => p.petName).join(", ")}</small>}
                        {!canAct && <small className="paw-duo-action-reason" role="status">{
                            battle.paused ? "Match paused while a player reconnects. Moves resume automatically."
                            : timeLeft <= 0 ? "This round expired. Waiting for the server to advance it."
                            : me.stunnedRounds && (me.stunEffectiveRound || 0) <= battle.round ? "Your pet is stunned for this round."
                            : spec && me.focus < spec.cost ? `Need ${spec.cost} Focus for this special.`
                            : spec && (me.cooldowns?.[action === "special" ? 0 : 1] || 0) > 0 ? "This special is on cooldown."
                            : action === "cover" && !!me.coverCooldown ? "Cover is on cooldown."
                            : action === "rescue" && (me.focus < 6 || battle.rescueUsed[me.team]) ? "Rescue requires 6 Focus and is usable once per team."
                            : !selectedTarget && !["focus", "guard"].includes(action) ? "Select a valid pet target."
                            : busy ? "Submitting your action…" : ""
                        }</small>}
                        <button className="paw-duo-lock" disabled={!canAct} onClick={move}>Lock in {spec ? spec.name : actions.find(a => a.value === action)?.label}{selectedTarget ? ` → ${selectedTarget.petName}` : ""}</button>
                    </>}
                    <div className="paw-duo-foot"><button onClick={() => setBattleHistory(true)}>Battle history</button><span>{battle.paused ? "Reconnect grace: 45 seconds" : "All four moves resolve together; faster pets act first."}</span><button onClick={() => setConfirmQuit(true)}>Forfeit</button></div>
                </div>
                {battleHistory && <div className="paw-duo-overlay" onClick={e => { if (e.target === e.currentTarget) { setBattleHistory(false); } }}><section className="paw-duo-overlay-panel" role="dialog" aria-label="Battle history"><div className="paw-duo-overlay-head paw-multi-dialog-header"><h3>Round history</h3><button className="paw-multi-dialog-close" onClick={() => setBattleHistory(false)} aria-label="Close"><X size={18}/></button></div><div className="paw-duo-log">{battle.log.slice().reverse().map((line, i) => <p key={i}>{line}</p>)}</div></section></div>}
                {skillHelp !== null && <div className="paw-duo-overlay" onClick={e => { if (e.target === e.currentTarget) { setSkillHelp(null); } }}><section className="paw-duo-overlay-panel" role="dialog" aria-label="Special skill details"><div className="paw-duo-overlay-head paw-multi-dialog-header"><h3>{me.specials?.[skillHelp]?.name}</h3><button className="paw-multi-dialog-close" onClick={() => setSkillHelp(null)} aria-label="Close"><X size={18}/></button></div><p>{me.specials?.[skillHelp]?.description}</p><small>{me.specials?.[skillHelp]?.cost} Focus, {me.specials?.[skillHelp]?.cooldown} rounds</small></section></div>}
                {confirmQuit && <MatchExitConfirmation gameName="Duo Clash" error={forfeitError} description={`Quitting forfeits the whole match for your team. Each opponent receives ${roomPrize?.payoutPerWinner} Paw Coins after a ${roomPrize?.fee}-coin Arena Fee. Continue?`} busy={busy} onCancel={() => { setConfirmQuit(false); setForfeitError(""); }} onForfeit={() => { void (async () => { setForfeitError(""); const success = await submit(`/${room.id}/forfeit`, {}); if (success) { setConfirmQuit(false); setForfeitError(""); } })(); }}/>}</section>
        </div> : lobbyOpen || autoShowResult ? (
            !room || dismissedId === room.id && ["finished", "void"].includes(room.status)
                ? renderLobbyDialog("Duo Clash · 2v2", "Four real players, one permanent pet each.", <div className="paw-duo-entry">
            <div className="paw-duo-entry-head"><Users size={23}/><div><h3>Duo Clash · 2v2</h3><p>Four real players. One permanent pet each.</p></div></div>
            <div className="paw-duo-entry-columns">
                <div className="paw-duo-entry-block">
                    <b>Create a private room</b>
                    <p className="paw-duo-auto-code"><Sparkles size={15}/> Your room code is generated automatically when you create the room.</p>
                    <label className="paw-duo-wager-label" htmlFor="paw-duo-wager">Your custom wager</label>
                    <div className="paw-multi-wager-input paw-duo-wager-input">
                        <Coins size={18}/>
                        <input id="paw-duo-wager" inputMode="numeric" type="number" min="0" max="100" step="1" placeholder="Enter Paw Coins" value={wager} onChange={e => setWager(e.target.value)}/>
                        <span>COINS</span>
                    </div>
                    <div className="paw-multi-presets paw-duo-wager-presets" aria-label="Quick wager amounts">
                        {[0, 25, 50, 100].map(amount => <button key={amount} type="button" disabled={petLevel < 10 && amount > 0} className={wager === String(amount) ? "chosen" : ""} onClick={() => setWager(String(amount))}>{amount === 0 ? "Free" : amount}</button>)}
                    </div>
                    {!validWager && <p className="paw-multi-error">Enter a whole number between 0 and 100.</p>}
                    {petLevel < 10 && <p className="paw-duo-auto-code">Paid Duo Clash wagers unlock at Level 10 for all four players. Free rooms are available now.</p>}
                    {wagerLevelLocked && <p className="paw-multi-error">Reach Level 10 to create a wagered room. Choose Free instead.</p>}
                    <div className="paw-multi-prize paw-duo-prize" aria-live="polite">
                        <span>Your stake <b>{validWager ? wagerAmount.toLocaleString() : "–"}</b></span>
                        <span>Teammate's stake <b>{validWager ? wagerAmount.toLocaleString() : "–"}</b></span>
                        <span>Total 4-player prize pool <b>{wagerPreview ? wagerPreview.grossPool.toLocaleString() : "–"}</b></span>
                        <span className="paw-multi-arena-fee"><span className="paw-multi-arena-fee-label"><span>Arena Fee · up to 5%</span><small>Gov't tax? Baka sa bulsa lang mapunta. (Joke lang! In-game coins only.)</small></span><b>−{wagerPreview ? wagerPreview.fee.toLocaleString() : "–"}</b></span>
                        <div><span>Each winner receives (after fee)</span><strong><Trophy size={17}/>{wagerPreview ? wagerPreview.payoutPerWinner.toLocaleString() : "–"}</strong></div>
                        <small className="paw-multi-arena-note">Net profit: {wagerPreview ? `+${(wagerPreview.payoutPerWinner - wagerAmount).toLocaleString()}` : "–"} coins per winner. Fee only applies to a winning result. Full refunds for draws and voids.</small>
                    </div>
                    <small>All four players accept the same stake by clicking Ready. Coins are only taken once everyone is ready.</small>
                    <button disabled={busy || !validWager || wagerLevelLocked} onClick={() => void submit("/create", { wager: wagerAmount })}><Users size={16}/> Create room &amp; generate code</button>
                </div>
                <div className="paw-duo-entry-block">
                    <b>Join a friend's room</b>
                    <label htmlFor="paw-duo-code">Enter your friend's room code</label>
                    <input id="paw-duo-code" placeholder="PAW-XXXXXXXX" value={joinCode} maxLength={12} onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/\s/g, ""))} />
                    <label>Choose your team</label>
                    <div className="paw-duo-team-pick"><button type="button" aria-pressed={team === 0} className={team === 0 ? "selected is-moonpaws" : "is-moonpaws"} onClick={() => setTeam(0)}><Moon size={16}/> {TEAM_NAMES[0]}</button><button type="button" aria-pressed={team === 1} className={team === 1 ? "selected is-starwhiskers" : "is-starwhiskers"} onClick={() => setTeam(1)}><Star size={16}/> {TEAM_NAMES[1]}</button></div>
                    <button disabled={busy || joinCode.length < 5} onClick={() => void submit("/join", { code: joinCode, team })}>Join Duo Clash</button>
                </div>
            </div>
            {invitations.length > 0 && <div className="paw-duo-invites"><b>Duo Clash invitations</b>{invitations.map(invite => <div key={invite.id}><span>@{invite.inviter_username} invited you to a {invite.wager}-coin Duo Clash.</span><button disabled={busy || (invite.wager > 0 && petLevel < 10)} onClick={() => { setJoinCode(invite.code); void submit("/join", { code: invite.code, team }); }}>Join {TEAM_NAMES[team]}</button></div>)}</div>}
            <p className="paw-duo-statline"><Swords size={15}/> Your Duo record: {stats.wins} wins · {stats.losses} losses · {stats.draws} draws</p>
            <p className="paw-duo-statline">{stats.rescues} rescues · {stats.covered} HP covered · {stats.damage} damage dealt</p>
        </div>)
                : room.status === "lobby"
                    ? renderLobbyDialog("Duo Clash Lobby", "Invite friends, pick teams, and get everyone ready.", <div className="paw-duo-lobby">
            <div className="paw-duo-entry-head"><Users size={22}/><div><h3>Duo Clash Lobby</h3><p>Invite three friends or share the room code.</p></div></div>
            <div className="paw-duo-room-code"><span><small>YOUR AUTO-GENERATED ROOM CODE</small><strong>{room.code}</strong></span><button type="button" onClick={() => { void navigator.clipboard.writeText(room.code).then(() => { setCodeCopied(true); onToast("Room code copied!"); }).catch(() => onToast("Couldn't copy. Select the code to copy it manually.")); }} title="Copy the code to invite your friends"><Copy size={17}/> {codeCopied ? "Copied!" : "Copy"}</button></div>
            <div className="paw-duo-lobby-teams">
                {([0, 1] as const).map(t => <div key={t} className={`paw-duo-team-panel is-team-${t}`}><h4>{t === 0 ? <Moon size={17}/> : <Star size={17}/>} {TEAM_NAMES[t]}</h4>{[0, 1].map(slot => {
                    const p = room.participants.filter(x => x.team === t)[slot];
                    return <div key={slot} className="paw-duo-lobby-slot"><Users size={16}/><span>{p ? `@${p.username || "Player"}${p.userId === userId ? " (you)" : ""}` : "Waiting for player"}</span>{p && <small>{p.ready ? "Ready" : "Not ready"}</small>}</div>;
                })}</div>)}
            </div>
            {room.hostId === userId && <div className="paw-duo-invite-friend"><select aria-label="Choose a PawPal friend to invite" value={inviteFriend} onChange={e => setInviteFriend(e.target.value)}><option value="">Invite a friend...</option>{friends.filter(f => !room.participants.some(p => p.userId === f.friend_id)).map(f => <option value={f.friend_id} key={f.friend_id}>@{f.username}</option>)}</select><button disabled={!inviteFriend || busy || room.participants.length >= 4} onClick={() => void submit(`/${room.id}/invite`, { friendId: inviteFriend })}>Send invite</button></div>}
            <p className="paw-duo-wager-note"><Coins size={16}/> {room.wager} Paw Coins per player · Pool {roomPrize?.grossPool} · Arena Fee {roomPrize?.fee} · Each winner receives {roomPrize?.payoutPerWinner} · {room.wager > 0 ? "All players must be Level 10+ and ready" : "Free room · everyone must be ready"}</p>
            {room.wager > 0 && petLevel < 10 && <p className="paw-multi-error">Level 10 is required to ready up in a wagered room.</p>}
            <div className="paw-duo-lobby-actions">
                <button disabled={busy || (!self?.ready && room.wager > 0 && petLevel < 10)} onClick={() => void submit(`/${room.id}/ready`, { ready: !self?.ready })}>{self?.ready ? <X size={16}/> : <Check size={16}/>} {self?.ready ? "Cancel Ready" : "Ready · accept wager"}</button>
                <button className="is-secondary" disabled={busy} onClick={() => void submit(`/${room.id}/leave`, {})}>Leave room</button>
            </div>
        </div>)
                    : renderLobbyDialog("Duo Clash Results", "Paw Brawl · 2v2 match summary", <div className="paw-duo-result"><h3>{room.status === "void" || room.winnerTeam === null ? "Match void / draw" : self?.team === room.winnerTeam ? `${TEAM_NAMES[self?.team ?? 0]} victory!` : `${TEAM_NAMES[self?.team === 0 ? 1 : 0]} victory`}</h3><p>{room.status === "void" || room.winnerTeam === null ? "Your Paw Coins were refunded." : `The winning team received ${roomPrize?.payoutPerWinner} Paw Coins each after the ${roomPrize?.fee}-coin Arena Fee.`}</p>
                        {battle && <div className="paw-duo-results-stats"><h4>Match performance</h4>
                            <div className="paw-duo-results-head"><span>Pet</span><span>Damage</span><span>Covered</span><span>Healed</span></div>
                            {battle.players.map(p => <div key={p.userId} className="paw-duo-results-player"><span>{p.petName}<small>{TEAM_NAMES[p.team]}</small></span><b>{matchTotals[p.userId]?.damageDealt || 0}</b><b>{matchTotals[p.userId]?.coverDamage || 0}</b><b>{matchTotals[p.userId]?.healing || 0}</b></div>)}
                            <div className="paw-duo-awards">{([['Heavy Hitter','damageDealt'],['Top Protector','coverDamage'],['Helping Paw','healing'],['Clutch Rescue','rescues']] as const).map(([label,field]) => { const top = matchLeader(field); return top ? <span key={label}><Trophy size={13}/>{label}: {top.petName}</span> : null; })}</div>
                        </div>}
                        <button onClick={() => { setDismissedId(room.id); setAutoShowResult(false); }}>Back to Duo Clash</button></div>)
        ) : null}
    </section>;
}

function DuoFighter({ pet, mine, round, changes, selectable = false, selected = false, onChoose, acting = false, impacted = false, suggested = false, ready = false }: {
    pet: DuoPlayer; mine: boolean; round: number; changes?: {kind:string; amount:number}[];
    selectable?: boolean; selected?: boolean; onChoose?: () => void;
    acting?: boolean; impacted?: boolean; suggested?: boolean; ready?: boolean;
}) {
    return <div
        className={`paw-duo-fighter ${mine ? "is-mine" : ""} ${pet.hp <= 0 ? "is-downed" : ""} ${selectable ? "is-targetable" : ""} ${selected ? "is-selected-target" : ""} ${acting ? "is-acting" : ""} ${impacted ? "is-impacted" : ""}`}
        role={selectable ? "button" : undefined}
        tabIndex={selectable ? 0 : undefined}
        aria-label={selectable ? `Target ${pet.petName}, ${pet.hp} HP` : undefined}
        aria-pressed={selectable ? selected : undefined}
        onClick={selectable ? onChoose : undefined}
        onKeyDown={selectable ? event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onChoose?.(); } } : undefined}
    >
        <div className="paw-duo-fighter-hud"><div><b>{pet.petName}</b><small>@{pet.username}{mine ? " · YOU" : ""}</small></div><small>HP {pet.hp}/{pet.maxHp}</small><div className="paw-duo-health"><i style={{ width: `${Math.max(0, 100 * pet.hp / pet.maxHp)}%` }}/></div><div className="paw-duo-ministats">{pet.shield} Shield · {pet.focus}/8 Focus · SPD {pet.speed}</div><BrawlStatusBadges player={pet} round={round} compact/></div>
        <div className="paw-duo-pet-art"><PetArt species={pet.species} breed={pet.breed} color={pet.color} cosmetic="none"/></div><div className="paw-duo-platform" aria-hidden="true"/>
        {selected && <span className="paw-duo-fighter-marker">TARGET</span>}
        {suggested && <span className="paw-duo-fighter-suggested">TEAM TARGET</span>}
        {ready && <span className="paw-duo-fighter-ready"><Check size={11}/> Locked</span>}
        {!!changes?.length && <div className="paw-duo-floating" aria-live="polite">{changes.slice(0,2).map((c,i) => <span key={`${c.kind}-${i}`} className={`is-${c.kind}`}>{c.kind === "damage" || c.kind === "poison" || c.kind === "pressure" || c.kind === "counter" || c.kind === "recoil" ? "−" : c.amount > 0 ? "+" : "−"}{Math.abs(c.amount)} {c.kind === "heal" || c.kind === "damage" ? "HP" : c.kind.toUpperCase()}</span>)}</div>}
        {pet.hp <= 0 && <span className="paw-duo-downed">KNOCKED OUT</span>}
    </div>;
}
