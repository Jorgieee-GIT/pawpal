import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {CSSProperties} from 'react';
import {Check, ChevronDown, CircleHelp, Clock3, Coins, Gamepad2, Shield, Sparkles, Swords, Trophy, Users, X, Zap} from 'lucide-react';
import PetArt from './PetArt';
import './Multiplayer.css';

type Friend = {friend_id: string; username: string; status: string};
type Player = {
    userId: string; username: string; petName: string; species: string; breed: string; color: string;
    hp: number; maxHp: number; shield: number; focus: number; cooldown: number;
    attack: number; defense: number; speed: number; style: number; trait: number;
    special?: {name: string; description: string; cost: number; cooldown: number};
    passive?: {name: string; description: string; kind?: string; strength?: number};
    progression?: {rank: number; unlockLevel: number; tier: string; grade?: string; bonus: {hp: number; attack: number; defense: number; speed: number}};
    powerCharge?: number; evadeCharges?: number; guardStreak?: number;
};
type RoundEffect = {actorId: string; targetId: string; action: string; moveName?: string; dodged?: boolean; playersAfter?: [Player, Player]};
type BattleRules = {focusCap: number; shieldCap: number; strikeFocus: number; guardFocus: number; focusGain: number; guardShield: number; repeatedGuardShield: number; exhaustedGuardShield: number};
type Challenge = {
    id: string; game_id: string; game_name: string; challenger_id: string; challenged_id: string;
    challenger_username: string; challenged_username: string; wager: number;
    status: 'pending' | 'active' | 'finished' | 'declined' | 'cancelled' | 'expired';
    battle: {players: [Player, Player]; focusCap?: number; rules?: BattleRules; turn: string; turns: number; turnExpiresAt: string; myMove?: string | null; readyCount?: number; log: string[]; roundSerial?: number; lastRoundEffects?: RoundEffect[]; roundStartPlayers?: [Player, Player]} | null;
    winner_id: string | null; created_at: string; expires_at: string; updated_at: string;
};
type Props = {
    api: string; token: string; userId: string; friends: Friend[];
    coins: number; refreshSignal: number; onUpdate: () => Promise<void>;
    onToast: (message: string) => void;
};
const format = (value: number) => value.toLocaleString();
const DEFAULT_FOCUS_CAP = 8; // Older saved matches can use this until the server sends its cap.

export default function Multiplayer({api, token, userId, friends, coins, refreshSignal, onUpdate, onToast}: Props) {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [friendId, setFriendId] = useState('');
    const [wager, setWager] = useState('100');
    const [gameId, setGameId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [hiddenBattleId, setHiddenBattleId] = useState<string | null>(null);
    const [showBattleInfo, setShowBattleInfo] = useState(false);
    const [challengeModalOpen, setChallengeModalOpen] = useState(false);
    const [showBattleLog, setShowBattleLog] = useState(false);
    const [showRecentBattles, setShowRecentBattles] = useState(false);
    const [showSpecialHelp, setShowSpecialHelp] = useState(false);
    const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
    const [visualPlayers, setVisualPlayers] = useState<[Player, Player] | null>(null);
    const [animatingRound, setAnimatingRound] = useState(false);
    const [finishedResultReady, setFinishedResultReady] = useState(false);
    const [dismissedFinishId, setDismissedFinishId] = useState<string | null>(null);
    const lastActiveBattleId = useRef<string | null>(null);
    const [visualEffect, setVisualEffect] = useState<(RoundEffect & {index: number}) | null>(null);
    const [lungeOffset, setLungeOffset] = useState<{key: string; x: number; y: number} | null>(null);
    const lastAnimatedRound = useRef<string>('');
    const playerSpriteRef = useRef<HTMLDivElement | null>(null);
    const enemySpriteRef = useRef<HTMLDivElement | null>(null);
    const specialHelpTriggerRef = useRef<HTMLButtonElement | null>(null);
    const specialHelpCloseRef = useRef<HTMLButtonElement | null>(null);
    const challengeTriggerRef = useRef<HTMLButtonElement | null>(null);
    const challengeCloseRef = useRef<HTMLButtonElement | null>(null);
    const battleLogTriggerRef = useRef<HTMLButtonElement | null>(null);
    const battleLogCloseRef = useRef<HTMLButtonElement | null>(null);
    const recentBattlesTriggerRef = useRef<HTMLButtonElement | null>(null);
    const recentBattlesCloseRef = useRef<HTMLButtonElement | null>(null);

    const [now, setNow] = useState(Date.now());
    useEffect(() => {const id = window.setInterval(() => setNow(Date.now()), 250); return () => window.clearInterval(id)}, []);
    const accepted = friends.filter(friend => friend.status === 'accepted' && friend.friend_id !== userId);
    const wagerAmount = Number(wager);
    const validWager = /^\d+$/.test(wager) && Number.isSafeInteger(wagerAmount) && wagerAmount >= 1 && wagerAmount <= 1000000;
    const open = challenges.filter(challenge => challenge.status === 'pending' || challenge.status === 'active');
    const incoming = open.filter(challenge => challenge.status === 'pending' && challenge.challenged_id === userId);
    const outgoing = open.filter(challenge => challenge.status === 'pending' && challenge.challenger_id === userId);
    const active = open.filter(challenge => challenge.status === 'active');
    const history = challenges.filter(challenge => !['pending', 'active'].includes(challenge.status)).slice(0, 5);
    // Keep the last active match mounted after the server marks it finished.
    // Otherwise the modal disappears before the final attack animation begins.
    if (active[0]) lastActiveBattleId.current = active[0].id;
    const completedBattle = lastActiveBattleId.current && dismissedFinishId !== lastActiveBattleId.current
        ? challenges.find(challenge => challenge.id === lastActiveBattleId.current && challenge.status === 'finished' && challenge.battle)
        : undefined;
    const battle = active[0] || completedBattle;
    const matchFinished = battle?.status === 'finished';
    const battleRules = battle?.battle?.rules;
    const focusCap = battleRules?.focusCap ?? battle?.battle?.focusCap ?? DEFAULT_FOCUS_CAP;
    const battleModalOpen = !!battle?.battle && hiddenBattleId !== battle.id;
    const renderedPlayers = animatingRound && visualPlayers ? visualPlayers : battle?.battle?.players;
    const myPet = renderedPlayers?.find(player => player.userId === userId);
    const otherPet = renderedPlayers?.find(player => player.userId !== userId);
    const timeLeft = battle?.battle?.turnExpiresAt ? Math.max(0, Math.ceil((new Date(battle.battle.turnExpiresAt).getTime() - now) / 1000)) : 30;
    const moveLocked = !!battle?.battle?.myMove || animatingRound;
    const readyCount = battle?.battle?.readyCount || 0;
    const roundNumber = Math.min(18, (battle?.battle?.roundSerial || 0) + (matchFinished ? 0 : 1));
    const specialCost = myPet?.special?.cost ?? 3;
    const specialAvailable = !!myPet && myPet.focus >= specialCost && myPet.cooldown === 0;
    const guardBoost = myPet?.passive?.kind === 'guardboost' ? (myPet.passive.strength || 0) + 3 : 0;
    const guardStreak = myPet?.guardStreak ?? 0;
    const guardShieldPotential = guardStreak >= 2 ? (battleRules?.exhaustedGuardShield ?? 0)
        : guardStreak === 1 ? (battleRules?.repeatedGuardShield ?? 7) + Math.ceil(guardBoost / 2)
        : (battleRules?.guardShield ?? 14) + guardBoost;
    const nextGuardShield = Math.min(Math.max(0, (battleRules?.shieldCap ?? 30) - (myPet?.shield || 0)), guardShieldPotential);
    const locked = open.length > 0;
    const breedGrade = (player: Player) => player.progression?.grade || player.progression?.tier || 'Origin';
    // Short hints fit the action buttons; the full server-defined explanation stays in Battle Info.
    const specialHint = myPet?.special?.description || 'Unique breed ability';

    const request = useCallback(async (path: string, method = 'GET', data?: object) => {
        const response = await fetch(`${api}/api/multiplayer${path}`, {
            method, headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
            body: data ? JSON.stringify(data) : undefined
        });
        const json = await response.json();
        if (!response.ok) throw Error(json.error || 'Multiplayer request failed.');
        return json;
    }, [api, token]);
    const reload = useCallback(async () => {
        try {
            setChallenges(await request('/challenges'));
        } catch (error) {
            onToast(error instanceof Error ? error.message : 'Could not load challenges.');
        }
    }, [request, onToast]);
    // SSE triggers refreshSignal; polling covers temporarily lost connections and second browser tabs.
    useEffect(() => {void reload()}, [reload, refreshSignal]);
    useEffect(() => {
        const id = window.setInterval(() => {
            if (document.visibilityState === 'visible') void reload();
        }, 3000);
        return () => window.clearInterval(id);
    }, [reload]);
    const send = async (path: string, data: object) => {
        setBusy(true);
        try {
            const result = await request(path, 'POST', data);
            // The finishing move must animate before showing any victory/defeat announcement.
            if (!(path.endsWith('/move') && result.message?.startsWith('Battle over!'))) onToast(result.message || 'Challenge updated!');
            await Promise.all([reload(), onUpdate()]);
            return true;
        } catch (error) {
            onToast(error instanceof Error ? error.message : 'Unable to update challenge.');
            await reload();
            return false;
        } finally {
            setBusy(false);
        }
    };
    const challenge = async () => {
        if (gameId !== 'paw_brawl' || !friendId || !validWager || wagerAmount > coins || locked) return;
        if (await send('/challenges', {friendId, gameId, wager: wagerAmount})) setChallengeModalOpen(false);
    };
    const respond = (id: string, action: 'accept' | 'decline' | 'cancel') => send(`/challenges/${id}/respond`, {action});
    const move = (id: string, action: string) => send(`/challenges/${id}/move`, {action});
    const confirmForfeit = async () => {
        if (!battle) return;
        setShowForfeitConfirm(false);
        await send(`/challenges/${battle.id}/forfeit`, {});
    };

    const closeSpecialHelp = () => {
        setShowSpecialHelp(false);
        specialHelpTriggerRef.current?.focus();
    };
    useEffect(() => {
        if (!showSpecialHelp) return;
        specialHelpCloseRef.current?.focus();
    }, [showSpecialHelp]);
    const closeChallengeModal = () => {
        setChallengeModalOpen(false);
        window.requestAnimationFrame(() => challengeTriggerRef.current?.focus());
    };
    const closeRecentBattles = () => {
        setShowRecentBattles(false);
        window.requestAnimationFrame(() => recentBattlesTriggerRef.current?.focus());
    };
    const closeBattleLog = () => {
        setShowBattleLog(false);
        window.requestAnimationFrame(() => battleLogTriggerRef.current?.focus());
    };
    useEffect(() => {
        if (!challengeModalOpen) return;
        challengeCloseRef.current?.focus();
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeChallengeModal();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [challengeModalOpen]);
    useEffect(() => {
        if (showBattleLog) battleLogCloseRef.current?.focus();
    }, [showBattleLog]);
    useEffect(() => {
        if (!showRecentBattles) return;
        recentBattlesCloseRef.current?.focus();
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeRecentBattles();
        };
        window.addEventListener('keydown', onEscape);
        return () => window.removeEventListener('keydown', onEscape);
    }, [showRecentBattles]);
    useEffect(() => {
        if (!battleModalOpen) return;
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            if (showSpecialHelp) {
                closeSpecialHelp();
            } else if (showBattleLog) {
                closeBattleLog();
            } else if (showForfeitConfirm) {
                setShowForfeitConfirm(false);
            } else if (showBattleInfo) {
                setShowBattleInfo(false);
            } else if (battle) {
                setHiddenBattleId(battle.id);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [battleModalOpen, battle?.id, showSpecialHelp, showForfeitConfirm, showBattleInfo, showBattleLog]);

    // The backend resolves the round and pays out atomically. The browser delays only
    // the *presentation* of each resulting stat change until its animation lands.
    useEffect(() => {
        if (!battleModalOpen || !battle?.battle) return;
        const key = `${battle.id}:${battle.battle.roundSerial || 0}`;
        if (lastAnimatedRound.current === key) return;
        lastAnimatedRound.current = key;
        const effects = battle.battle.lastRoundEffects || [];
        if (!effects.length) {
            setVisualEffect(null);
            setVisualPlayers(battle.battle.players);
            setAnimatingRound(false);
            setFinishedResultReady(battle.status === 'finished');
            return;
        }
        setFinishedResultReady(false);
        setAnimatingRound(true);
        setVisualPlayers(battle.battle.roundStartPlayers || battle.battle.players);
        const timers: number[] = [];
        effects.forEach((effect, index) => {
            const start = index * 1150;
            timers.push(window.setTimeout(() => setVisualEffect({...effect, index}), start));
            // Damage, healing, shielding and focus become visible at the impact point.
            timers.push(window.setTimeout(() => {
                if (effect.playersAfter) setVisualPlayers(effect.playersAfter);
            }, start + (['strike', 'special'].includes(effect.action) ? 660 : 380)));
        });
        timers.push(window.setTimeout(() => {
            setVisualPlayers(battle.battle!.players);
            setVisualEffect(null);
            setAnimatingRound(false);
            setFinishedResultReady(battle.status === 'finished');
        }, effects.length * 1150 + 250));
        return () => timers.forEach(window.clearTimeout);
    }, [battleModalOpen, battle?.id, battle?.battle?.roundSerial]);

    // A completed match may become visible while its last round is still animating.
    useEffect(() => {
        if (!matchFinished) {
            setFinishedResultReady(false);
        } else if (!animatingRound && lastAnimatedRound.current === `${battle?.id}:${battle?.battle?.roundSerial || 0}`) {
            setFinishedResultReady(true);
        }
    }, [matchFinished, animatingRound, battle?.id, battle?.battle?.roundSerial]);

    // Two-phase attack animation: first render both pets at rest, then measure their
    // actual on-screen centers, *then* mount the lunge animation with its distance set.
    // Starting a CSS animation before its custom distance exists makes round 1 play
    // using the CSS fallback (0px), so the pet only scales on its own platform.
    const effectMotionKey = visualEffect && battle?.battle
        ? `${battle.id}:${battle.battle.roundSerial ?? 0}:${visualEffect.index}:${visualEffect.actorId}`
        : null;
    const attackEffectActive = !!visualEffect && ['strike', 'special'].includes(visualEffect.action);
    const attackMotionReady = attackEffectActive && !!effectMotionKey && lungeOffset?.key === effectMotionKey;

    useLayoutEffect(() => {
        if (!attackEffectActive || !visualEffect || !effectMotionKey || !battleModalOpen) return;
        const attacker = visualEffect.actorId === userId ? playerSpriteRef.current : enemySpriteRef.current;
        const target = visualEffect.actorId === userId ? enemySpriteRef.current : playerSpriteRef.current;
        if (!attacker || !target) return;

        // Sprites are unanimated while this calculation runs. Measurements account
        // for the actual responsive SVG dimensions and the smaller distant enemy.
        const from = attacker.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        if (!from.width || !from.height || !to.width || !to.height) return;
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        const distance = Math.hypot(dx, dy);
        if (distance < 1) return;

        // Finish at the opposing SVG, not midway across the field. Keep only a
        // small space between centers so impact artwork overlays the actual pet.
        const contactGap = Math.min(distance * .24, (from.width + to.width) * .19);
        const travelRatio = (distance - contactGap) / distance;
        setLungeOffset({key: effectMotionKey, x: Math.round(dx * travelRatio), y: Math.round(dy * travelRatio)});
    }, [attackEffectActive, visualEffect, effectMotionKey, battleModalOpen, userId]);

    const spriteLungeStyle = (petId: string): CSSProperties | undefined => {
        if (!attackMotionReady || !lungeOffset || visualEffect?.actorId !== petId) return undefined;
        return {
            '--paw-lunge-x': `${lungeOffset.x}px`,
            '--paw-lunge-y': `${lungeOffset.y}px`
        } as CSSProperties;
    };
    // Force separate DOM instances for each resolved effect so a consecutive
    // strike by the same pet always restarts its animation, including round one.
    const spriteEffectKey = `${battle?.id || 'battle'}:${battle?.battle?.roundSerial ?? 0}:${visualEffect?.index ?? 'idle'}`;

    const petAura = (petId: string) => {
        if (!visualEffect || visualEffect.actorId !== petId || !['guard', 'focus'].includes(visualEffect.action)) return null;
        return <div key={`${battle?.id}-${battle?.battle?.roundSerial}-${visualEffect.index}`} className={`paw-brawl-pet-aura paw-brawl-pet-aura-${visualEffect.action}`} aria-hidden="true">
            <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
                {visualEffect.action === 'guard' ? <>
                    <path d="M100 10 L177 42 V103 Q171 152 100 188 Q29 152 23 103 V42 Z" fill="#68c9fb" fillOpacity=".22" stroke="#73d6ff" strokeOpacity=".72" strokeWidth="7"/>
                    <path d="M100 25 L158 51 V100 Q150 137 100 166 Q50 137 42 100 V51 Z" fill="#d6f6ff" fillOpacity=".12" stroke="#fff" strokeOpacity=".55" strokeWidth="4"/>
                    <path d="M100 58 V135 M65 97 H135" stroke="#fff" strokeOpacity=".48" strokeWidth="8" strokeLinecap="round"/>
                </> : <>
                    <path d="M100 6 Q72 52 80 83 Q51 47 53 100 Q20 82 33 144 Q55 191 100 190 Q145 191 167 144 Q180 82 147 100 Q149 47 120 83 Z" fill="#ffe45b" fillOpacity=".30" stroke="#ffd66a" strokeOpacity=".73" strokeWidth="5"/>
                    <path d="M82 42 Q54 104 83 162 M125 34 Q153 100 123 166" stroke="#fff7aa" strokeOpacity=".60" strokeWidth="8" strokeLinecap="round" fill="none"/>
                    <path d="M100 5 V22 M28 54 L43 68 M172 54 L157 68" stroke="#fff" strokeOpacity=".65" strokeWidth="6" strokeLinecap="round"/>
                </>}
            </svg>
        </div>;
    };
    const spriteMotionClass = (petId: string) => {
        if (!attackMotionReady || !visualEffect) return '';
        if (visualEffect.actorId === petId) return `is-attacking ${visualEffect.actorId === userId ? 'attack-from-player' : 'attack-from-enemy'} ${visualEffect.dodged ? 'attack-dodged' : 'attack-hit'}`;
        if (visualEffect.targetId === petId) return `is-targeted ${visualEffect.dodged ? 'attack-dodged' : 'attack-hit'}`;
        return '';
    };
    const hitOverlay = (petId: string) => {
        if (!attackMotionReady || !visualEffect || visualEffect.targetId !== petId) return null;
        return <div key={`${battle?.id}-${battle?.battle?.roundSerial}-${visualEffect.index}-hit`} className={`paw-brawl-hit-overlay ${visualEffect.dodged ? 'is-dodged' : 'is-hit'}`} aria-hidden="true">
            {!visualEffect.dodged && <svg className="paw-brawl-hit-burst" viewBox="0 0 160 160">
                <path d="M79 8 L94 49 L129 24 L119 64 L153 77 L119 94 L137 135 L93 116 L75 155 L61 113 L21 134 L38 93 L7 76 L48 63 L31 25 L65 49 Z" fill="#ffe8a3" stroke="#ec996b" strokeWidth="6"/>
                <path d="M37 119 L125 33 M24 77 L135 66" stroke="#fff" strokeWidth="9" strokeLinecap="round"/>
            </svg>}
            <span className="paw-brawl-hit-label">{visualEffect.dodged ? 'DODGED!' : visualEffect.action === 'special' ? (visualEffect.moveName || 'SPECIAL ATTACK!') : 'PAW STRIKE!'}</span>
        </div>;
    };

    const petCard = (player: Player, mine: boolean) => (
        <div className={`paw-brawl-fighter ${mine ? 'mine' : ''} ${battle?.battle?.turn === player.userId ? 'is-turn' : ''}`} key={player.userId}>
            <div className="paw-brawl-fighter-art">
                <PetArt species={player.species} breed={player.breed} color={player.color} cosmetic="none" />
            </div>
            <div className="paw-brawl-fighter-details">
                <small>{mine ? 'YOUR PET' : `@${player.username}`}</small>
                <b>{player.petName}</b>
                <span>{player.species} · {player.breed.replaceAll('_', ' ')}</span>
                <div className="paw-brawl-health-track" aria-label={`${player.hp} of ${player.maxHp} HP`}>
                    <span style={{width: `${100 * player.hp / player.maxHp}%`}} />
                </div>
                <small>{player.hp}/{player.maxHp} HP · {player.shield} shield · {player.focus}/{focusCap} Focus</small>
                <div className="paw-brawl-traits"><span>ATK {player.attack}</span><span>DEF {player.defense}</span><span>SPD {player.speed}</span></div><small className="paw-brawl-breed-skill">Passive: {player.passive?.name || 'Loading…'}</small>
            </div>
        </div>
    );

    return <section className="panel paw-multiplayer">
        <div className="eyebrow">PLAY TOGETHER, PAWS TOGETHER</div>
        <div className="paw-multiplayer-heading"><h2>Multiplayer</h2><button ref={recentBattlesTriggerRef} type="button" className="paw-multi-header-history" aria-haspopup="dialog" aria-expanded={showRecentBattles} onClick={() => setShowRecentBattles(true)}><Trophy size={16}/> Recent Battles{history.length > 0 && <small>{history.length}</small>}</button></div>
        <div className="paw-multi-game-library">
            <button type="button" className={`paw-multi-game-tile ${gameId === 'paw_brawl' ? 'selected' : ''}`} onClick={() => setGameId('paw_brawl')} aria-pressed={gameId === 'paw_brawl'}>
                <span className="paw-multi-game-art paw-multi-game-art-brawl"><span className="paw-multi-game-art-circle"><Swords size={46}/></span><span className="paw-multi-game-status"><Sparkles size={13}/> PLAYABLE</span></span>
                <span className="paw-multi-game-info"><b>Paw Brawl</b><small>1v1 turn-based pet battles</small><strong>{gameId === 'paw_brawl' ? 'SELECTED ✓' : 'PLAY →'}</strong></span>
            </button>
            <div className="paw-multi-game-tile paw-multi-game-upcoming" aria-label="More multiplayer games coming soon">
                <span className="paw-multi-game-art paw-multi-game-art-soon"><span className="paw-multi-game-art-circle"><Gamepad2 size={44}/></span><span className="paw-multi-game-status"><Clock3 size={13}/> COMING SOON</span></span>
                <span className="paw-multi-game-info"><b>More Games Soon!</b><small>New ways to play with friends</small><strong>STAY TUNED ♡</strong></span>
            </div>
        </div>
        {gameId === 'paw_brawl' && <div className="paw-multi-selected-banner">
            <div className="paw-multi-selected-title"><Swords size={19}/><span><b>Paw Brawl</b> · 1v1 friend battles</span></div>
            <div className="paw-multi-selected-actions">
                <button ref={challengeTriggerRef} type="button" className="paw-multi-open-challenge" onClick={() => setChallengeModalOpen(true)}><Users size={16}/> <span>Challenge a Friend</span></button>
                <button type="button" className="paw-multi-change-game" onClick={() => {setGameId(null); setChallengeModalOpen(false)}}><Gamepad2 size={16}/> <span>Change Game</span></button>
            </div>
        </div>}
        {(incoming.length > 0 || outgoing.length > 0) && <div className="paw-multi-notification-list" aria-label="Battle invitation notifications" aria-live="polite">
            {incoming.map(item => <div key={item.id} className="paw-multi-invite-bar is-incoming">
                <span className="paw-multi-invite-icon"><Swords size={19}/></span>
                <div className="paw-multi-invite-body"><b>@{item.challenger_username} challenged you to {item.game_name}!</b><small><Coins size={13}/> {format(item.wager)} coins each · Expires {new Date(item.expires_at).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}</small>{coins < item.wager && <small className="paw-multi-error">Need {format(item.wager - coins)} more Paw Coins to accept</small>}</div>
                <div className="paw-multi-invite-bar-actions"><button type="button" className="paw-multi-accept" disabled={busy || coins < item.wager} onClick={() => void respond(item.id, 'accept')}><Check size={15}/> Accept</button><button type="button" className="paw-multi-decline" disabled={busy} onClick={() => void respond(item.id, 'decline')}><X size={15}/> Decline</button></div>
            </div>)}
            {outgoing.map(item => <div key={item.id} className="paw-multi-invite-bar is-outgoing">
                <span className="paw-multi-invite-icon"><Clock3 size={19}/></span>
                <div className="paw-multi-invite-body"><b>Invitation sent to @{item.challenged_username}</b><small><Coins size={13}/> {format(item.wager)} coins reserved · Awaiting reply</small></div>
                <div className="paw-multi-invite-bar-actions"><button type="button" className="paw-multi-decline" disabled={busy} onClick={() => void respond(item.id, 'cancel')}>Cancel & refund</button></div>
            </div>)}
        </div>}
        {challengeModalOpen && <div className="paw-multi-dialog-backdrop" onMouseDown={event => {if (event.target === event.currentTarget) closeChallengeModal()}}>
            <section className="paw-multi-dialog paw-challenge-form" role="dialog" aria-modal="true" aria-labelledby="paw-challenge-title">
                <div className="paw-multi-dialog-header"><div><span className="paw-brawl-modal-kicker">PAW BRAWL · FRIEND MATCH</span><h3 id="paw-challenge-title"><Users size={21}/> Challenge a Friend</h3></div><button ref={challengeCloseRef} type="button" className="paw-multi-dialog-close" aria-label="Close challenge form" onClick={closeChallengeModal}><X size={19}/></button></div>
                <div className="paw-multi-dialog-body">
                    <label htmlFor="paw-multi-friend">Select your friend</label>
                    <div className="paw-multi-select-wrap"><Users size={18}/><select id="paw-multi-friend" value={friendId} onChange={event => setFriendId(event.target.value)} disabled={locked}><option value="">Choose a PawPal friend...</option>{accepted.map(friend => <option value={friend.friend_id} key={friend.friend_id}>@{friend.username}</option>)}</select><ChevronDown size={18}/></div>
                    {accepted.length === 0 && <p className="paw-multi-hint">Add and accept a friend first. Your existing PawPal friends will appear here.</p>}
                    <label htmlFor="paw-multi-wager">Your custom wager</label>
                    <div className="paw-multi-wager-input"><Coins size={18}/><input id="paw-multi-wager" type="number" inputMode="numeric" min="1" max="1000000" step="1" value={wager} onChange={event => setWager(event.target.value)} placeholder="Enter Paw Coins" disabled={locked}/><span>COINS</span></div>
                    <div className="paw-multi-presets">{[25, 50, 100, 250].map(amount => <button type="button" className={wager === String(amount) ? 'chosen' : ''} key={amount} disabled={locked} onClick={() => setWager(String(amount))}>{amount}</button>)}</div>
                    {!validWager && <p className="paw-multi-error">Enter a whole number between 1 and 1,000,000.</p>}
                    {validWager && wagerAmount > coins && <p className="paw-multi-error">You don't have enough coins for this wager.</p>}
                    <div className="paw-multi-prize"><span>Your stake <b>{validWager ? format(wagerAmount) : ' - '}</b></span><span>Friend's stake <b>{validWager ? format(wagerAmount) : ' - '}</b></span><div><span>Total prize for the winner</span><strong><Trophy size={18}/> {validWager ? format(wagerAmount * 2) : ' - '}</strong></div></div>
                    <p className="paw-multi-hint"><Shield size={15}/> Your wager is reserved when you send. Your friend's equal stake is reserved when they accept. Declines and expired invites refund you.</p>
                    {locked && <p className="paw-multi-hint">Finish or cancel your current invitation or match before starting another.</p>}
                </div>
                <div className="paw-multi-dialog-actions"><button type="button" className="paw-multi-decline" onClick={closeChallengeModal}>Cancel</button><button className="paw-multi-primary" type="button" disabled={busy || !friendId || !validWager || wagerAmount > coins || locked} onClick={() => void challenge()}><Swords size={18}/> Send Battle Challenge</button></div>
            </section>
        </div>}
        {battle && battle.battle && myPet && otherPet && !battleModalOpen && <div className="paw-brawl-rejoin">
            <div><Swords size={20}/><span><b>Your Paw Brawl match is live!</b><small>vs @{otherPet.username} · {format(battle.wager * 2)} Paw Coins prize</small></span></div>
            <button type="button" onClick={() => setHiddenBattleId(null)}>Return to battle</button>
        </div>}
        {battleModalOpen && battle && battle.battle && myPet && otherPet && <div className="paw-brawl-modal-backdrop" onMouseDown={event => {if (event.target === event.currentTarget && !matchFinished) setHiddenBattleId(battle.id)}}>
            <section className="paw-brawl-modal" role="dialog" aria-modal="true" aria-labelledby="paw-brawl-modal-title">
                <div className="paw-brawl-modal-header">
                    <div><span className="paw-brawl-modal-kicker">LIVE MULTIPLAYER · ROUND {roundNumber}</span><h2 id="paw-brawl-modal-title"><Swords size={22}/> Paw Brawl</h2></div>
                    <div className="paw-brawl-modal-header-right"><button type="button" className="paw-brawl-info-toggle" aria-expanded={showBattleInfo} onClick={() => setShowBattleInfo(value => !value)}><CircleHelp size={17}/> Battle Info</button><span className="paw-brawl-arena-prize"><Coins size={16}/> {format(battle.wager * 2)} prize</span><button type="button" className="paw-brawl-modal-close" aria-label="Minimize battle" title="Minimize battle" onClick={() => {if (matchFinished) setDismissedFinishId(battle.id); else setHiddenBattleId(battle.id)}}><X size={20}/></button></div>
                </div>
                {showBattleInfo && <div className="paw-brawl-info-panel" role="dialog" aria-modal="true" aria-label="Battle information">
                    <div className="paw-brawl-info-panel-heading"><b>Battle Info · Breed Grades & Moves</b><button type="button" onClick={() => setShowBattleInfo(false)} aria-label="Close battle information"><X size={18}/></button></div>
                    {[myPet, otherPet].map((pet, index) => <div key={pet.userId} className="paw-brawl-info-pet">
                        <h3>{index === 0 ? 'Your pet' : 'Opponent'}: {pet.petName}</h3>
                        <p><b>{pet.species}</b> · {pet.breed.replaceAll('_', ' ')} · @{pet.username}</p>
                        {pet.progression && <p className="paw-brawl-breed-progression"><b>Breed Grade: {breedGrade(pet)}</b> · {pet.progression.tier} category · {pet.progression.rank === 0 ? 'Classic breed' : `Unlocked at player level ${pet.progression.unlockLevel}`} · Bonus: +{pet.progression.bonus.hp} HP, +{pet.progression.bonus.attack} ATK, +{pet.progression.bonus.defense} DEF, +{pet.progression.bonus.speed} SPD</p>}
                        <div className="paw-brawl-info-stats"><span>HP <b>{pet.hp}/{pet.maxHp}</b></span><span>ATK <b>{pet.attack}</b></span><span>DEF <b>{pet.defense}</b></span><span>SPD <b>{pet.speed}</b></span></div>
                        <p><b>Breed special ({pet.special?.name || 'Breed special'}):</b> {pet.special?.description || 'Special information will load with your match.'}</p>
                        <p><b>Passive ({pet.passive?.name || 'Breed passive'}):</b> {pet.passive?.description || 'Passive information will load with your match.'}</p>
                        <p><b>Dodge:</b> {Math.round(Math.min(0.15, Math.max(0.03, pet.speed * 0.006)) * 100)}% base per incoming attack (passives and dodge buffs may add more). Higher Speed acts first.</p>
                    </div>)}
                    <div className="paw-brawl-info-moves"><p><b>Breed grades:</b> Origin → Rookie → Rising → Adept → Veteran → Prime → Prestige → Elite → Mythic → Celestial → Apex. These describe breed unlock stages, not player levels. Higher-grade breeds get small HP and combat-stat bonuses, but starter and lower-tier breeds can still win using their unique moves, passives, timing, and dodges. Every breed shares the same {focusCap}-Focus cap.</p><h3>Moves & Focus ({myPet.focus}/{focusCap})</h3><p><b>Paw Strike:</b> basic attack, no ordinary Focus gain (Stride passives give +1). <b>Guard:</b> up to +{battleRules?.guardShield ?? 14} Shield initially, +{battleRules?.repeatedGuardShield ?? 7} if repeated, then +{battleRules?.exhaustedGuardShield ?? 0} until you choose another move; Guardboost passives improve the first two Guards. Guard never charges Focus, and Shield caps at {battleRules?.shieldCap ?? 30}. <b>Focus:</b> +{battleRules?.focusGain ?? 3} Focus. <b>Special:</b> a unique breed ability costing 3–7 Focus, with an individual cooldown. Focus is capped at {focusCap}. Both players secretly choose a move each round. Moves are revealed together, with the faster pet acting first. Each round lasts 30 seconds; no selection means you skip the round. After 18 rounds, the pet with higher remaining HP percentage wins, or an exact tie refunds both wagers.</p></div>
                </div>}
                <div className="paw-brawl-battlefield">
                    <div className="paw-brawl-landscape-sun"/>
                    <div className="paw-brawl-hill paw-brawl-hill-back"/>
                    <div className="paw-brawl-hill paw-brawl-hill-front"/>
                    <div className={`paw-brawl-combatant paw-brawl-combatant-enemy ${attackEffectActive && visualEffect?.actorId === otherPet.userId ? 'has-attacking-pet' : ''}`}>
                        <div className="paw-brawl-battle-hud">
                            <div className="paw-brawl-hud-top"><b>{otherPet.petName}</b><small>@{otherPet.username}</small></div>
                            <span className="paw-brawl-grade" title={`${otherPet.breed.replaceAll('_', ' ')} · ${breedGrade(otherPet)} breed grade`}>✦ {breedGrade(otherPet)} grade</span>
                            <div className="paw-brawl-hud-health"><span style={{width: `${100 * otherPet.hp / otherPet.maxHp}%`}}/></div>
                            <small>HP {otherPet.hp}/{otherPet.maxHp} · Shield {otherPet.shield}</small>
                        </div>
                        <div className="paw-brawl-platform"/>
                        <div key={`${spriteEffectKey}:enemy`} ref={enemySpriteRef} style={spriteLungeStyle(otherPet.userId)} className={`paw-brawl-pet-sprite paw-brawl-sprite-enemy ${spriteMotionClass(otherPet.userId)}`}><PetArt species={otherPet.species} breed={otherPet.breed} color={otherPet.color} cosmetic="none"/>{petAura(otherPet.userId)}{hitOverlay(otherPet.userId)}</div>
                    </div>
                    <div className={`paw-brawl-combatant paw-brawl-combatant-player ${attackEffectActive && visualEffect?.actorId === myPet.userId ? 'has-attacking-pet' : ''}`}>
                        <div className="paw-brawl-platform"/>
                        <div key={`${spriteEffectKey}:player`} ref={playerSpriteRef} style={spriteLungeStyle(myPet.userId)} className={`paw-brawl-pet-sprite paw-brawl-sprite-player ${spriteMotionClass(myPet.userId)}`}><PetArt species={myPet.species} breed={myPet.breed} color={myPet.color} cosmetic="none"/>{petAura(myPet.userId)}{hitOverlay(myPet.userId)}</div>
                        <div className="paw-brawl-battle-hud">
                            <div className="paw-brawl-hud-top"><b>{myPet.petName}</b><small>YOUR PET</small></div>
                            <span className="paw-brawl-grade" title={`${myPet.breed.replaceAll('_', ' ')} · ${breedGrade(myPet)} breed grade`}>✦ {breedGrade(myPet)} grade</span>
                            <div className="paw-brawl-hud-health"><span style={{width: `${100 * myPet.hp / myPet.maxHp}%`}}/></div>
                            <small>HP {myPet.hp}/{myPet.maxHp} · Shield {myPet.shield} · Focus {myPet.focus}/{focusCap}</small>
                            <div className="paw-brawl-focus-pips" aria-label={`${myPet.focus} of ${focusCap} Focus`}>
                                {Array.from({length: focusCap}, (_, index) => <span key={index} className={index < myPet.focus ? 'is-filled' : ''}/>)}
                            </div>
                        </div>
                    </div>
                </div>
                {matchFinished && finishedResultReady && <div className="paw-brawl-final-result" role="status" aria-live="polite">
                    <Trophy size={27}/>
                    <h3>{!battle.winner_id ? 'Draw!' : battle.winner_id === userId ? 'Victory!' : 'Defeat'}</h3>
                    <p>{!battle.winner_id ? 'Both wagers have been refunded.' : battle.winner_id === userId ? `You won ${format(battle.wager * 2)} Paw Coins!` : 'Your opponent won this match.'}</p>
                    <button type="button" onClick={() => setDismissedFinishId(battle.id)}>View battle history</button>
                </div>}
                {showForfeitConfirm && !matchFinished && <div className="paw-brawl-confirm-backdrop" role="presentation" onMouseDown={event => {if (event.target === event.currentTarget) setShowForfeitConfirm(false)}}>
                    <div className="paw-brawl-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="paw-brawl-confirm-title" aria-describedby="paw-brawl-confirm-description">
                        <div className="paw-brawl-confirm-icon"><Shield size={25}/></div>
                        <h3 id="paw-brawl-confirm-title">Forfeit Paw Brawl?</h3>
                        <p id="paw-brawl-confirm-description">You will lose the match and your friend will receive the {format(battle.wager * 2)} Paw Coin prize pool. This cannot be undone.</p>
                        <div className="paw-brawl-confirm-actions">
                            <button type="button" onClick={() => setShowForfeitConfirm(false)}>Keep playing</button>
                            <button type="button" className="is-danger" disabled={busy} onClick={() => void confirmForfeit()}>Yes, forfeit</button>
                        </div>
                    </div>
                </div>}
                {showSpecialHelp && <div className="paw-brawl-special-help-backdrop" onMouseDown={event => {if (event.target === event.currentTarget) closeSpecialHelp()}}>
                    <section className="paw-brawl-special-help-dialog" role="dialog" aria-modal="true" aria-labelledby="paw-brawl-special-help-title">
                        <button ref={specialHelpCloseRef} type="button" className="paw-brawl-special-help-close" aria-label="Close skill details" onClick={closeSpecialHelp}><X size={18}/></button>
                        <span className="paw-brawl-modal-kicker">{myPet.breed.replaceAll('_', ' ')} · {breedGrade(myPet)}</span>
                        <h3 id="paw-brawl-special-help-title"><Sparkles size={20}/> {myPet.special?.name || 'Breed Special'}</h3>
                        <p>{specialHint}</p>
                        <div className="paw-brawl-special-help-stats"><span><Zap size={15}/> {specialCost} / {focusCap} Focus</span><span><Clock3 size={15}/> {myPet.special?.cooldown ?? 0}-action cooldown</span></div>
                        <p className="paw-brawl-special-help-passive"><b>Passive: {myPet.passive?.name || 'Breed passive'}</b>. {myPet.passive?.description || 'See Battle Info for details.'}</p>
                        <button type="button" className="paw-brawl-special-help-done" onClick={closeSpecialHelp}>Got it</button>
                    </section>
                </div>}
                {showBattleLog && <div className="paw-brawl-log-modal-backdrop" onMouseDown={event => {if (event.target === event.currentTarget) closeBattleLog()}}>
                    <section className="paw-brawl-log-modal" role="dialog" aria-modal="true" aria-labelledby="paw-brawl-log-modal-title">
                        <div className="paw-brawl-log-modal-heading"><div><span className="paw-brawl-modal-kicker">PAW BRAWL · ROUND {roundNumber}</span><h3 id="paw-brawl-log-modal-title"><Clock3 size={19}/> Battle Log</h3></div><button ref={battleLogCloseRef} type="button" aria-label="Close battle log" onClick={closeBattleLog}><X size={19}/></button></div>
                        <div className="paw-brawl-log-modal-entries" role="log" aria-live="polite">{battle.battle.log.length ? battle.battle.log.slice().reverse().map((entry, index) => <p key={`${battle.id}-${battle.battle!.turns}-${index}`}>{entry}</p>) : <p>No moves yet. Your battle story starts here!</p>}</div>
                        <button type="button" className="paw-brawl-special-help-done" onClick={closeBattleLog}>Back to battle</button>
                    </section>
                </div>}
                <div className="paw-brawl-modal-controls">
                    {!matchFinished && <><div className="paw-brawl-turn-banner"><span className={`paw-brawl-turn-clock ${timeLeft <= 10 ? 'is-urgent' : ''}`}><Clock3 size={16}/> {timeLeft}s</span><span className="paw-brawl-turn-message" title={moveLocked ? 'Your move is locked in. Waiting for your opponent.' : `Choose ${myPet.petName}'s secret move.`}>{moveLocked ? 'Move locked · waiting' : 'Choose a move'}</span><span className="paw-brawl-ready-count">{readyCount}/2 ready</span></div>
                    <div className="paw-brawl-hidden-move-note"><Shield size={14}/> Secret moves · 30s rounds · No auto-move</div>
                    <div className="paw-brawl-action-grid" aria-label="Choose an action">
                        <button type="button" title="Deal basic damage. Standard Paw Strike does not build Focus; a breed's Stride passive can grant 1 Focus." disabled={moveLocked || busy || animatingRound || timeLeft === 0} onClick={() => void move(battle.id, 'strike')}><Swords size={19}/><b>Paw Strike</b><small>Basic attack</small></button>
                        <button type="button" title={`Block incoming damage. Next Guard: +${nextGuardShield} Shield (cap 30). Repeat Guard to receive less Shield; switch moves to reset. No Focus gain.`} disabled={moveLocked || busy || animatingRound || timeLeft === 0} onClick={() => void move(battle.id, 'guard')}><Shield size={19}/><b>Guard</b><small>{nextGuardShield > 0 ? `Block · +${nextGuardShield} Shield` : 'Shield exhausted · reset'}</small></button>
                        <button type="button" title={`Recharge ${battleRules?.focusGain ?? 3} Focus, up to ${focusCap}. Use Focus to activate your special skill.`} disabled={moveLocked || busy || animatingRound || timeLeft === 0} onClick={() => void move(battle.id, 'focus')}><Zap size={19}/><b>Focus</b><small>Recharge · +{battleRules?.focusGain ?? 3} Focus</small></button>
                        <div className="paw-brawl-special-action">
                            <button type="button" className="paw-brawl-special-move" title={`${myPet.special?.name || 'Breed special'} · ${specialCost} Focus`} disabled={moveLocked || busy || animatingRound || timeLeft === 0 || !specialAvailable} onClick={() => void move(battle.id, 'special')}><Sparkles size={19}/><b>{myPet.special?.name || 'Breed Special'}</b><small className="paw-brawl-special-cost">{specialCost} Focus · {myPet.cooldown ? `${myPet.cooldown} cooldown` : 'Ready'}</small></button>
                            <button ref={specialHelpTriggerRef} type="button" className="paw-brawl-special-help" aria-label={`Details for ${myPet.special?.name || 'your breed special'}`} aria-haspopup="dialog" aria-expanded={showSpecialHelp} title="View special skill details" onClick={() => {setShowBattleInfo(false); setShowSpecialHelp(true)}}><CircleHelp size={15}/></button>
                        </div>
                    </div>
                    </>}
                    <div className="paw-brawl-utilities">
                        <button ref={battleLogTriggerRef} type="button" className="paw-brawl-log-button" aria-haspopup="dialog" onClick={() => {setShowBattleInfo(false); setShowBattleLog(true)}}><Clock3 size={15}/> Battle log ({battle.battle.log.length})</button>
                        {!matchFinished && <button type="button" className="paw-brawl-forfeit" disabled={busy} onClick={() => setShowForfeitConfirm(true)}>Forfeit match</button>}
                    </div>
                </div>
            </section>
        </div>}
        {showRecentBattles && <div className="paw-multi-dialog-backdrop" onMouseDown={event => {if (event.target === event.currentTarget) closeRecentBattles()}}>
            <section className="paw-multi-dialog paw-multi-history-dialog" role="dialog" aria-modal="true" aria-labelledby="paw-recent-battles-title">
                <div className="paw-multi-dialog-header"><div><span className="paw-brawl-modal-kicker">PAW BRAWL · MATCH HISTORY</span><h3 id="paw-recent-battles-title"><Trophy size={20}/> Recent Battles</h3></div><button ref={recentBattlesCloseRef} type="button" className="paw-multi-dialog-close" aria-label="Close recent battles" onClick={closeRecentBattles}><X size={19}/></button></div>
                <div className="paw-multi-dialog-body paw-multi-history-list">
                    {history.length === 0 ? <div className="paw-multi-history-empty"><Trophy size={29}/><b>No battles yet</b><p>Challenge a friend to start your match history.</p></div> : history.map(item => <div className="paw-multi-history-row" key={item.id}><div><b>{item.game_name}</b><small>vs @{item.challenger_id === userId ? item.challenged_username : item.challenger_username} · {format(item.wager)} each</small><small>{new Date(item.updated_at).toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}</small></div><span className={item.status === 'finished' ? item.winner_id === userId ? 'won' : 'lost' : ''}>{item.status === 'finished' ? !item.winner_id ? 'Draw · refunded' : item.winner_id === userId ? 'Victory' : 'Defeat' : item.status}</span></div>)}
                </div>
                <div className="paw-multi-dialog-actions"><button type="button" className="paw-multi-history-done" onClick={closeRecentBattles}>Close</button></div>
            </section>
        </div>}
    </section>;
}
