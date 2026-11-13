import { arenaPayout } from "../../arenaFee";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
    Check,
    ChevronDown,
    CircleHelp,
    Clock3,
    Coins,
    Gamepad2,
    Shield,
    Sparkles,
    Swords,
    Trophy,
    Users,
    X,
    Zap
} from "lucide-react";
import PetArt from "../../PetArt";
import "./Multiplayer.css";
import SectionHeading from "../../SectionHeading";
import BrawlCatalogModal from "../arcade/BrawlCatalogModal";
import MatchExitConfirmation from "../arcade/MatchExitConfirmation";
import BrawlStatusBadges from "../arcade/BrawlStatusBadges";
import BrawlStatGuide from "../arcade/BrawlStatGuide";
import BrawlSkillGuide from "../arcade/BrawlSkillGuide";
import BrawlGuideModal from "../arcade/BrawlGuideModal";
import DuoClash from "./DuoClash";

type Friend = {
    friend_id: string;
    username: string;
    status: string
};
type Player = {
    userId: string;
    username: string;
    petName: string;
    species: string;
    breed: string;
    color: string;
    hp: number;
    maxHp: number;
    shield: number;
    focus: number;
    cooldown: number;
    attack: number;
    defense: number;
    speed: number;
    style: number;
    trait: number;
    special?: {
        name: string;
        description: string;
        cost: number;
        cooldown: number;
        trigger?: string;
        kind?: string;
        bonus?: string
    };
    specials?: Array<{
        name: string;
        description: string;
        cost: number;
        cooldown: number;
        kind?: string;
        trigger?: string;
        bonus?: string;
    }>;
    cooldowns?: [number, number];
    passive?: {
        name: string;
        description: string;
        kind?: string;
        strength?: number
    };
    progression?: {
        rank: number;
        unlockLevel: number;
        tier: string;
        grade?: string;
        bonus: {
            hp: number;
            attack: number;
            defense: number;
            speed: number
        }
    };
    powerCharge?: number;
    evadeCharges?: number;
    guardStreak?: number;
    stunnedRounds?: number;
    stunImmunity?: number;
    poisonRounds?: number;
    poisonDamage?: number;
    shieldExpiresRound?: number;
    shieldBreakRefund?: number;
    adaptiveDodgeUntil?: number;
    lastStandUsed?: boolean;
    weakenedRounds?: number;
    counterDamage?: number;
};
type VisualChange = {
    targetId: string;
    kind: "damage" | "poison" | "heal" | "shield" | "focus" | "counter" | "recoil" | "pressure" | "status";
    amount?: number;
    label?: string;
};
type RoundEffect = {
    visualChanges?: VisualChange[];
    actorId: string;
    targetId: string;
    action: string;
    moveName?: string;
    dodged?: boolean;
    playersAfter?: [Player, Player]
};
type BattleRules = {
    focusCap: number;
    shieldCap: number;
    strikeFocus: number;
    guardFocus: number;
    focusGain: number;
    guardShield: number;
    repeatedGuardShield: number;
    exhaustedGuardShield: number;
    repeatedGuardFocus?: number;
    exhaustedGuardFocus?: number;
    basicShieldPiercePercent?: number;
    shieldDecayWhenNotGuarding?: number;
    shieldDurationRounds?: number;
    pressureStartsRound?: number
};
type Challenge = {
    id: string;
    game_id: string;
    game_name: string;
    challenger_id: string;
    challenged_id: string;
    challenger_username: string;
    challenged_username: string;
    wager: number;
    arena_fee_percent: number;
    status: "pending" | "active" | "finished" | "declined" | "cancelled" | "expired";
    battle: {
        players: [Player, Player];
        focusCap?: number;
        rules?: BattleRules;
        serverNow?: string;
        turn: string;
        turns: number;
        turnExpiresAt: string;
        myMove?: string | null;
        readyCount?: number;
        log: string[];
        roundSerial?: number;
        lastRoundEffects?: RoundEffect[];
        roundStartPlayers?: [Player, Player];
        matchTotals?: Record<string, {damage:number;healing:number;shield:number;specials:number}>
    } | null;
    winner_id: string | null;
    created_at: string;
    expires_at: string;
    updated_at: string;
};
type Props = {
    api: string;
    token: string;
    userId: string;
    friends: Friend[];
    coins: number;
    petLevel: number;
    refreshSignal: number;
    onUpdate: () => Promise<void>;
    onToast: (message: string) => void;
};
/*
 * DOCU: Format the current state for this feature.
 * @param {number} value - value value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
const format = (value: number) => value.toLocaleString();
// Server performs the same calculation again before transferring any coins.
const DEFAULT_FOCUS_CAP = 8; // Older saved matches can use this until the server sends its cap.

/*
 * DOCU: Render the multiplayer interface and provide its feature behavior.
 * @param {Props} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export default function Multiplayer({ api, token, userId, friends, coins, petLevel, refreshSignal, onUpdate, onToast }: Props) {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const latestRefresh = useRef(0);
    const [friendId, setFriendId] = useState("");
    const [wager, setWager] = useState(petLevel >= 10 ? "100" : "0");
    const [gameId, setGameId] = useState<string | null>(null);
    const [brawlMode, setBrawlMode] = useState<"1v1" | "2v2">("1v1");
    const [duoLobbyOpen, setDuoLobbyOpen] = useState(false);
    const [duoInitialized, setDuoInitialized] = useState(false);
    const duoModeTriggerRef = useRef<HTMLButtonElement | null>(null);
    useEffect(() => {
        if (window.sessionStorage.getItem("pawpal_open_duo") === "1") {
            window.sessionStorage.removeItem("pawpal_open_duo");
            setGameId("paw_brawl");
            setBrawlMode("2v2");
            setDuoLobbyOpen(true);
            setDuoInitialized(true);
        }
    }, [refreshSignal]);
    const [busy, setBusy] = useState(false);
    const [hiddenBattleId, setHiddenBattleId] = useState<string | null>(null);
    const [showBattleInfo, setShowBattleInfo] = useState(false);
    const [showSkillsInfo, setShowSkillsInfo] = useState(false);
    const [showGameCatalog, setShowGameCatalog] = useState(false);
    const [challengeModalOpen, setChallengeModalOpen] = useState(false);
    const [showBattleLog, setShowBattleLog] = useState(false);
    const [showRecentBattles, setShowRecentBattles] = useState(false);
    const [showSpecialHelp, setShowSpecialHelp] = useState(false);
    const [selectedSpecialIndex, setSelectedSpecialIndex] = useState<0 | 1>(0);
    const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
    const [forfeitError, setForfeitError] = useState("");
    const [clockOffset, setClockOffset] = useState(0);
    const [locallyLockedMove, setLocallyLockedMove] = useState("");
    const [visualPlayers, setVisualPlayers] = useState<[Player, Player] | null>(null);
    const [animatingRound, setAnimatingRound] = useState(false);
    const [visualPopups, setVisualPopups] = useState<{ index: number; changes: VisualChange[] } | null>(null);
    const [finishedResultReady, setFinishedResultReady] = useState(false);
    const [dismissedFinishId, setDismissedFinishId] = useState<string | null>(null);
    const lastActiveBattleId = useRef<string | null>(null);
    const [visualEffect, setVisualEffect] = useState<(RoundEffect & {
        index: number
    }) | null>(null);
    const [lungeOffset, setLungeOffset] = useState<{
        key: string;
        x: number;
        y: number
    } | null>(null);
    const lastAnimatedRound = useRef<string>("");
    const playerSpriteRef = useRef<HTMLDivElement | null>(null);
    const enemySpriteRef = useRef<HTMLDivElement | null>(null);
    const specialHelpTriggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const specialHelpCloseRef = useRef<HTMLButtonElement | null>(null);
    const challengeTriggerRef = useRef<HTMLButtonElement | null>(null);
    const challengeCloseRef = useRef<HTMLButtonElement | null>(null);
    const battleLogTriggerRef = useRef<HTMLButtonElement | null>(null);
    const battleLogCloseRef = useRef<HTMLButtonElement | null>(null);
    const recentBattlesTriggerRef = useRef<HTMLButtonElement | null>(null);
    const recentBattlesCloseRef = useRef<HTMLButtonElement | null>(null);

    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), 250);
        return () => window.clearInterval(id)
    }, []);
    const accepted = friends.filter(friend => friend.status === "accepted" && friend.friend_id !== userId);
    const wagerAmount = Number(wager);
    const validWager = /^\d+$/.test(wager) && Number.isSafeInteger(wagerAmount) && wagerAmount >= 0 && wagerAmount <= 1000000;
    const wagerLevelLocked = wagerAmount > 0 && petLevel < 10;
    const wagerPreview = validWager ? arenaPayout(wagerAmount, 2) : null;
    const open = challenges.filter(challenge => challenge.status === "pending" || challenge.status === "active");
    const incoming = open.filter(challenge => challenge.status === "pending" && challenge.challenged_id === userId);
    const outgoing = open.filter(challenge => challenge.status === "pending" && challenge.challenger_id === userId);
    const active = open.filter(challenge => challenge.status === "active");
    const history = challenges.filter(challenge => !["pending", "active"].includes(challenge.status)).slice(0, 5);
    // Keep the last active match mounted after the server marks it finished.
    // Otherwise the modal disappears before the final attack animation begins.
    if (active[0]) {
        lastActiveBattleId.current = active[0].id;
    }
    const completedBattle = lastActiveBattleId.current && dismissedFinishId !== lastActiveBattleId.current
        ? challenges.find(challenge => challenge.id === lastActiveBattleId.current && challenge.status === "finished" && challenge.battle)
        : undefined;
    const battle = active[0] || completedBattle;
    const matchFinished = battle?.status === "finished";
    const battleRules = battle?.battle?.rules;
    const focusCap = battleRules?.focusCap ?? battle?.battle?.focusCap ?? DEFAULT_FOCUS_CAP;
    const battleModalOpen = !!battle?.battle && hiddenBattleId !== battle.id;
    const renderedPlayers = animatingRound && visualPlayers ? visualPlayers : battle?.battle?.players;
    const myPet = renderedPlayers?.find(player => player.userId === userId);
    const otherPet = renderedPlayers?.find(player => player.userId !== userId);
    const timeLeft = battle?.battle?.turnExpiresAt ? Math.max(0, Math.ceil((new Date(battle.battle.turnExpiresAt).getTime() - now + clockOffset) / 1000)) : 30;
    const currentTurnKey = `${battle?.id || ""}:${battle?.battle?.roundSerial ?? 0}`;
    const moveLocked = !!battle?.battle?.myMove || locallyLockedMove === currentTurnKey || !!battle?.battle?.players.find(player => player.userId === userId)?.stunnedRounds;
    const readyCount = battle?.battle?.readyCount || 0;
    const isRoundSyncing = !matchFinished && timeLeft === 0 && !moveLocked;
    const roundNumber = Math.min(18, (battle?.battle?.roundSerial || 0) + (matchFinished ? 0 : 1));
    const firstSpecial = myPet?.specials?.[0] || myPet?.special;
    const secondSpecial = myPet?.specials?.[1];
        /*
     * DOCU: Handle conditional bonus ready behavior for this feature.
     * @param {typeof firstSpecial} skill - skill value used by this function
     * @returns {boolean} - Result returned by this function.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const conditionalBonusReady = (skill: typeof firstSpecial): boolean => {
        if (!skill || !myPet || !otherPet) { return false; }
        switch (skill.trigger) {
            case "faster": return myPet.speed > otherPet.speed;
            case "enemy_healthy": return otherPet.hp > otherPet.maxHp / 2;
            case "enemy_shielded": return otherPet.shield > 0;
            case "wounded": return myPet.hp <= myPet.maxHp / 2;
            case "low_shield": return myPet.shield <= 4;
            case "low_focus": return myPet.focus - skill.cost <= 3;
            case "has_shield": return myPet.shield > 0;
            case "shield_created": return myPet.shield < (battleRules?.shieldCap ?? 34);
            default: return false;
        }
    };
    const isStunned = !!myPet?.stunnedRounds;
        /*
     * DOCU: Handle skill ready behavior for this feature.
     * @param {typeof firstSpecial} skill - skill value used by this function
     * @param {number} slot - slot value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const skillReady = (skill: typeof firstSpecial, slot: number) => !!myPet && !isStunned && !!skill
        && myPet.focus >= skill.cost && (myPet.cooldowns?.[slot] ?? (slot === 0 ? myPet.cooldown : 0)) === 0
        ;
    const guardBoost = myPet?.passive?.kind === "guardboost" ? (myPet.passive.strength || 0) + 2 : 0;
    const guardStreak = myPet?.guardStreak ?? 0;
    const guardShieldPotential = guardStreak >= 2 ? (battleRules?.exhaustedGuardShield ?? 0)
        : guardStreak === 1 ? (battleRules?.repeatedGuardShield ?? 8) + Math.ceil(guardBoost / 2)
            : (battleRules?.guardShield ?? 16) + guardBoost;
    const nextGuardShield = Math.min(Math.max(0, (battleRules?.shieldCap ?? 34) - (myPet?.shield || 0)), guardShieldPotential);
    const nextGuardFocus = guardStreak === 0 && nextGuardShield > 0 ? (battleRules?.guardFocus ?? 1) : 0;
    // A readable attack preview, not a guarantee: shields, dodge and passives can
    // still change how much damage the opponent actually takes.
    const basicAttackPreview = (() => {
        if (!myPet || !otherPet) { return null; }
        let raw = Math.max(9, myPet.attack + 9 - Math.floor(otherPet.defense / 2));
        if (myPet.passive?.kind === "comeback" && myPet.hp <= myPet.maxHp / 2) {
            raw += 2 + (myPet.passive.strength || 0);
        }
        if (myPet.passive?.kind === "stride" && myPet.speed > otherPet.speed) {
            raw += 3 + Math.max(0, (myPet.passive.strength || 0) - 2);
        }
        if (myPet.weakenedRounds) { raw = Math.max(1, raw - 5); }
        raw += myPet.powerCharge || 0;
        if (otherPet.passive?.kind === "steady") {
            raw = Math.max(1, raw - (otherPet.passive.strength || 0) - 1);
        }
        const pierce = Math.min(raw, Math.max(2, Math.ceil(raw * (battleRules?.basicShieldPiercePercent ?? 40) / 100)));
        const absorbed = Math.min(otherPet.shield, Math.max(0, raw - pierce));
        return { hp: raw - absorbed, blocked: absorbed };
    })();
    const locked = open.length > 0;
        /*
     * DOCU: Handle breed grade behavior for this feature.
     * @param {Player} player - player value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const breedGrade = (player: Player) => player.progression?.grade || player.progression?.tier || "Origin";
    // Short hints fit the action buttons; the full server-defined explanation stays in Battle Info.

    const request = useCallback(async (path: string, method = "GET", data?: object) => {
        const response = await fetch(`${api}/api/multiplayer${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: data ? JSON.stringify(data) : undefined
        });
        const json = await response.json().catch(() => {
            throw Error("PawPal's backend returned an invalid response. Check the Render deployment, then refresh.");
        });
        if (!response.ok) {
            throw Error(json.error || "Multiplayer request failed.");
        }
        return json;
    }, [api, token]);
    const reload = useCallback(async () => {
        const sequence = ++latestRefresh.current;
        try {
            const latest = await request("/challenges") as Challenge[];
            if (sequence !== latestRefresh.current) { return; }
            const serverNow = latest.find(item => item.status === "active")?.battle?.serverNow;
            if (serverNow) { setClockOffset(Date.now() - Date.parse(serverNow)); }
            setChallenges(latest);
        } catch (error) {
            if (sequence === latestRefresh.current) {
                onToast(error instanceof Error ? error.message : "Could not load challenges.");
            }
        }
    }, [request, onToast]);
    // SSE triggers refreshSignal; polling covers temporarily lost connections and second browser tabs.
    useEffect(() => {
        void reload()
    }, [reload, refreshSignal]);
    useEffect(() => {
        const id = window.setInterval(() => {
            if (document.visibilityState === "visible") { void reload(); }
        }, 4500);
        return () => window.clearInterval(id);
    }, [reload]);
        /*
     * DOCU: Send the current state for this feature.
     * @param {string} path - path value used by this function
     * @param {object} data - Input data used by this operation
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const send = async (path: string, data: object) => {
        setBusy(true);
        try {
            const result = await request(path, "POST", data);
            // The finishing move must animate before showing any victory/defeat announcement.
            if (!(path.endsWith("/move") && result.message?.startsWith("Battle over!"))) {
                onToast(result.message || "Challenge updated!");
            }
            // A committed wager/forfeit stays successful even if a secondary
            // profile refresh temporarily fails during a network interruption.
            // Avoid blocking the combat buttons on an unrelated profile refresh.
            void Promise.allSettled([reload(), onUpdate()]);
            return true;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to update challenge.";
            onToast(message);
            if (path.endsWith("/forfeit")) { setForfeitError(message); }
            void reload();
            return false;
        } finally {
            setBusy(false);
        }
    };
        /*
     * DOCU: Handle challenge behavior for this feature.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const challenge = async () => {
        if (gameId !== "paw_brawl" || !friendId || !validWager || wagerLevelLocked || wagerAmount > coins || locked) {
            return;
        }
        if (await send("/challenges", {
            friendId,
            gameId,
            wager: wagerAmount
        })) {
            setChallengeModalOpen(false);
        }
    };
        /*
     * DOCU: Handle respond behavior for this feature.
     * @param {string} id - Identifier of the record or item being handled
     * @param {"accept" | "decline" | "cancel"} action - action value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const respond = (id: string, action: "accept" | "decline" | "cancel") => send(`/challenges/${id}/respond`, {
        action
    });
        /*
     * DOCU: Move the current state for this feature.
     * @param {string} id - Identifier of the record or item being handled
     * @param {string} action - action value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const move = async (id: string, action: string) => {
        const key = `${id}:${battle?.battle?.roundSerial ?? 0}`;
        setLocallyLockedMove(key);
        const success = await send(`/challenges/${id}/move`, { action });
        if (!success) { setLocallyLockedMove(""); }
    };
        /*
     * DOCU: Handle confirm forfeit behavior for this feature.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const confirmForfeit = async () => {
        if (!battle) {
            return;
        }
        // Keep the confirmation displayed until the server has committed the outcome.
        // If the request fails, the dialog stays open so the user can retry.
        setForfeitError("");
        const succeeded = await send(`/challenges/${battle.id}/forfeit`, {});
        if (succeeded) { setShowForfeitConfirm(false); setForfeitError(""); }
    };

        /*
     * DOCU: Close special help for this feature.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const closeSpecialHelp = () => {
        setShowSpecialHelp(false);
        specialHelpTriggerRefs.current[selectedSpecialIndex]?.focus();
    };
    useEffect(() => {
        if (!showSpecialHelp) {
            return;
        }
        specialHelpCloseRef.current?.focus();
    }, [showSpecialHelp]);
    const closeDuoLobby = useCallback(() => {
        setDuoLobbyOpen(false);
        window.requestAnimationFrame(() => duoModeTriggerRef.current?.focus());
    }, []);
        /*
     * DOCU: Close challenge modal for this feature.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const closeChallengeModal = () => {
        setChallengeModalOpen(false);
        window.requestAnimationFrame(() => challengeTriggerRef.current?.focus());
    };
        /*
     * DOCU: Close recent battles for this feature.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const closeRecentBattles = () => {
        setShowRecentBattles(false);
        window.requestAnimationFrame(() => recentBattlesTriggerRef.current?.focus());
    };
        /*
     * DOCU: Close battle log for this feature.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const closeBattleLog = () => {
        setShowBattleLog(false);
        window.requestAnimationFrame(() => battleLogTriggerRef.current?.focus());
    };
    useEffect(() => {
        if (!challengeModalOpen) {
            return;
        }
        challengeCloseRef.current?.focus();
                /*
         * DOCU: Handle escape for this feature.
         * @param {KeyboardEvent} event - User or browser event that triggered this operation
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeChallengeModal();
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [challengeModalOpen]);
    useEffect(() => {
        if (showBattleLog) {
            battleLogCloseRef.current?.focus();
        }
    }, [showBattleLog]);
    useEffect(() => {
        if (!showRecentBattles) {
            return;
        }
        recentBattlesCloseRef.current?.focus();
                /*
         * DOCU: Handle on escape behavior for this feature.
         * @param {KeyboardEvent} event - User or browser event that triggered this operation
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const onEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeRecentBattles();
            }
        };
        window.addEventListener("keydown", onEscape);
        return () => window.removeEventListener("keydown", onEscape);
    }, [showRecentBattles]);
    useEffect(() => {
        if (!battleModalOpen) {
            return;
        }
                /*
         * DOCU: Handle escape for this feature.
         * @param {KeyboardEvent} event - User or browser event that triggered this operation
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") {
                return;
            }
            if (showSpecialHelp) {
                closeSpecialHelp();
            } else if (showBattleLog) {
                closeBattleLog();
            } else if (showForfeitConfirm) {
                if (!busy) { setShowForfeitConfirm(false); }
            } else if (showSkillsInfo) {
                setShowSkillsInfo(false);
            } else if (showBattleInfo) {
                setShowBattleInfo(false);
            } else if (battle) {
                if (matchFinished) {
                    setDismissedFinishId(battle.id);
                } else {
                    setShowForfeitConfirm(true);
                }
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [battleModalOpen, battle?.id, matchFinished, showSpecialHelp, showForfeitConfirm, showBattleInfo, showSkillsInfo, showBattleLog, busy]);

    // The backend resolves the round and pays out atomically. The browser delays only
    // the *presentation* of each resulting stat change until its animation lands.
    useEffect(() => {
        if (!battleModalOpen || !battle?.battle) {
            return;
        }
        const key = `${battle.id}:${battle.battle.roundSerial || 0}`;
        if (lastAnimatedRound.current === key) {
            return;
        }
        lastAnimatedRound.current = key;
        const effects = battle.battle.lastRoundEffects || [];
        if (!effects.length) {
            setVisualEffect(null);
            setVisualPopups(null);
            setVisualPlayers(battle.battle.players);
            setAnimatingRound(false);
            setFinishedResultReady(battle.status === "finished");
            return;
        }
        setFinishedResultReady(false);
        setAnimatingRound(true);
        setVisualPopups(null);
        setVisualPlayers(battle.battle.roundStartPlayers || battle.battle.players);
        const timers: number[] = [];
        // Every resolved action gets a full, readable animation before the next
        // action begins. Previously 540ms cut off the 1050ms lunge mid-flight.
        const actionDuration = 1180;
        effects.forEach((effect, index) => {
            const start = index * actionDuration;
            timers.push(window.setTimeout(() => setVisualEffect({
                ...effect,
                index
            }), start));
            // Damage, healing, shielding and focus become visible at the impact point.
            timers.push(window.setTimeout(() => {
                if (effect.playersAfter) {
                    setVisualPlayers(effect.playersAfter);
                }
                setVisualPopups({ index, changes: effect.visualChanges || [] });
            }, start + (["strike", "special", "special2"].includes(effect.action) ? 510 : 350)));
        });
        timers.push(window.setTimeout(() => {
            setVisualPlayers(battle.battle!.players);
            setVisualEffect(null);
            setVisualPopups(null);
            setAnimatingRound(false);
            setFinishedResultReady(battle.status === "finished");
        }, effects.length * actionDuration + 80));
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
    const attackEffectActive = !!visualEffect && visualEffect.actorId !== visualEffect.targetId && ["strike", "special", "special2"].includes(visualEffect.action);
    const attackMotionReady = attackEffectActive && !!effectMotionKey && lungeOffset?.key === effectMotionKey;

    useLayoutEffect(() => {
        if (!attackEffectActive || !visualEffect || !effectMotionKey || !battleModalOpen) {
            return;
        }
        const attacker = visualEffect.actorId === userId ? playerSpriteRef.current : enemySpriteRef.current;
        const target = visualEffect.actorId === userId ? enemySpriteRef.current : playerSpriteRef.current;
        if (!attacker || !target) {
            return;
        }

        // Sprites are unanimated while this calculation runs. Measurements account
        // for the actual responsive SVG dimensions and the smaller distant enemy.
        const from = attacker.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        if (!from.width || !from.height || !to.width || !to.height) {
            return;
        }
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        const distance = Math.hypot(dx, dy);
        if (distance < 1) {
            return;
        }

        // Finish at the opposing SVG, not midway across the field. Keep only a
        // small space between centers so impact artwork overlays the actual pet.
        const contactGap = Math.min(distance * .24, (from.width + to.width) * .19);
        const travelRatio = (distance - contactGap) / distance;
        setLungeOffset({
            key: effectMotionKey,
            x: Math.round(dx * travelRatio),
            y: Math.round(dy * travelRatio)
        });
    }, [attackEffectActive, visualEffect, effectMotionKey, battleModalOpen, userId]);

        /*
     * DOCU: Handle sprite lunge style behavior for this feature.
     * @param {string} petId - petId value used by this function
     * @returns {CSSProperties | undefined} - Result returned by this function.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const spriteLungeStyle = (petId: string): CSSProperties | undefined => {
        if (!attackMotionReady || !lungeOffset || visualEffect?.actorId !== petId) {
            return undefined;
        }
        return {
            "--paw-lunge-x": `${lungeOffset.x}px`,
            "--paw-lunge-y": `${lungeOffset.y}px`,
            "--paw-lunge-x-contact": `${Math.round(lungeOffset.x * .88)}px`,
            "--paw-lunge-y-contact": `${Math.round(lungeOffset.y * .88)}px`,
            "--paw-lunge-x-return": `${Math.round(lungeOffset.x * .22)}px`,
            "--paw-lunge-y-return": `${Math.round(lungeOffset.y * .22 - 5)}px`
        } as CSSProperties;
    };
    // Force separate DOM instances for each resolved effect so a consecutive
    // strike by the same pet always restarts its animation, including round one.
    const spriteEffectKey = `${battle?.id || "battle"}:${battle?.battle?.roundSerial ?? 0}:${visualEffect?.index ?? "idle"}`;

        /*
     * DOCU: Handle pet aura behavior for this feature.
     * @param {string} petId - petId value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const petAura = (petId: string) => {
        if (!visualEffect || visualEffect.actorId !== petId || !["guard", "focus"].includes(visualEffect.action)) {
            return null;
        }
        return <div key={`${battle?.id}-${battle?.battle?.roundSerial}-${visualEffect.index}`} className={`paw-brawl-pet-aura paw-brawl-pet-aura-${visualEffect.action}`} aria-hidden="true">
            <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
                {visualEffect.action === "guard" ? <>
                    <path
                        d="M100 10 L177 42 V103 Q171 152 100 188 Q29 152 23 103 V42 Z"
                        fill="#68c9fb"
                        fillOpacity=".22"
                        stroke="#73d6ff"
                        strokeOpacity=".72"
                        strokeWidth="7"
                    />
                    <path
                        d="M100 25 L158 51 V100 Q150 137 100 166 Q50 137 42 100 V51 Z"
                        fill="#d6f6ff"
                        fillOpacity=".12"
                        stroke="#fff"
                        strokeOpacity=".55"
                        strokeWidth="4"
                    />
                    <path d="M100 58 V135 M65 97 H135" stroke="#fff" strokeOpacity=".48" strokeWidth="8" strokeLinecap="round" />
                </> : <>
                    <path
                        d="M100 6 Q72 52 80 83 Q51 47 53 100 Q20 82 33 144 Q55 191 100 190 Q145 191 167 144 Q180 82 147 100 Q149 47 120 83 Z"
                        fill="#ffe45b"
                        fillOpacity=".30"
                        stroke="#ffd66a"
                        strokeOpacity=".73"
                        strokeWidth="5"
                    />
                    <path d="M82 42 Q54 104 83 162 M125 34 Q153 100 123 166" stroke="#fff7aa" strokeOpacity=".60" strokeWidth="8" strokeLinecap="round" fill="none" />
                    <path d="M100 5 V22 M28 54 L43 68 M172 54 L157 68" stroke="#fff" strokeOpacity=".65" strokeWidth="6" strokeLinecap="round" />
                </>}
            </svg>
        </div>;
    };
        /*
     * DOCU: Handle sprite motion class behavior for this feature.
     * @param {string} petId - petId value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const spriteMotionClass = (petId: string) => {
        if (!attackMotionReady || !visualEffect) {
            return "";
        }
        if (visualEffect.actorId === petId) {
            return `is-attacking ${visualEffect.actorId === userId ? "attack-from-player" : "attack-from-enemy"} ${visualEffect.dodged ? "attack-dodged" : "attack-hit"}`;
        }
        if (visualEffect.targetId === petId) {
            return `is-targeted ${visualEffect.dodged ? "attack-dodged" : "attack-hit"}`;
        }
        return "";
    };
        /*
     * DOCU: Handle hit overlay behavior for this feature.
     * @param {string} petId - petId value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const hitOverlay = (petId: string) => {
        if (!attackMotionReady || !visualEffect || visualEffect.targetId !== petId) {
            return null;
        }
        return <div key={`${battle?.id}-${battle?.battle?.roundSerial}-${visualEffect.index}-hit`} className={`paw-brawl-hit-overlay ${visualEffect.dodged ? "is-dodged" : "is-hit"}`} aria-hidden="true">
            {!visualEffect.dodged && <svg className="paw-brawl-hit-burst" viewBox="0 0 160 160">
                <path
                    d="M79 8 L94 49 L129 24 L119 64 L153 77 L119 94 L137 135 L93 116 L75 155 L61 113 L21 134 L38 93 L7 76 L48 63 L31 25 L65 49 Z"
                    fill="#ffe8a3"
                    stroke="#ec996b"
                    strokeWidth="6"
                />
                <path d="M37 119 L125 33 M24 77 L135 66" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
            </svg>}
            <span className="paw-brawl-hit-label">
                {visualEffect.dodged ? "DODGED!" : ["special", "special2"].includes(visualEffect.action) ? (visualEffect.moveName || "SPECIAL ATTACK!") : "PAW STRIKE!"}
            </span>
        </div>;
    };

    // Values arrive from server-resolved before/after snapshots. Never infer
    // damage from attack animation or calculate opponent move data locally.
        /*
     * DOCU: Handle floating numbers behavior for this feature.
     * @param {string} petId - petId value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const floatingNumbers = (petId: string) => {
        const changes = visualPopups?.changes.filter(change => change.targetId === petId) || [];
        if (!changes.length) {
            return null;
        }
        // Damage is the primary visual. Show at most three readable cues per pet;
        // the HUD continues to show every resource and status change.
        const ordered = [...changes].sort((a, b) => {
            const importance: Record<VisualChange["kind"], number> = {
                damage: 0, poison: 0, counter: 0, recoil: 0, pressure: 0, heal: 1, shield: 2, focus: 3, status: 4
            };
            return importance[a.kind] - importance[b.kind];
        });
        return <div className="paw-brawl-float-stack" key={`${battle?.id}-${battle?.battle?.roundSerial}-${visualPopups?.index}-${petId}`} role="status" aria-live="polite">
            {ordered.slice(0, 3).map((change, index) => {
                const amount = Math.abs(change.amount || 0);
                let label = change.label || "";
                if (change.kind === "damage") { label = `−${amount} HP`; }
                else if (change.kind === "poison") { label = `−${amount} POISON`; }
                else if (change.kind === "heal") { label = `+${amount} HP`; }
                else if (change.kind === "shield") { label = `${(change.amount || 0) > 0 ? "+" : "−"}${amount} SHIELD${change.label ? ` · ${change.label}` : ""}`; }
                else if (change.kind === "focus") { label = `${(change.amount || 0) > 0 ? "+" : "−"}${amount} FOCUS`; }
                else if (change.kind === "counter") { label = `−${amount} COUNTER`; }
                else if (change.kind === "recoil") { label = `−${amount} RECOIL`; }
                else if (change.kind === "pressure") { label = `−${amount} OVERTIME`; }
                return <span key={`${change.kind}-${index}`} className={`paw-brawl-float is-${change.kind}`} style={{ "--float-order": index } as CSSProperties}>{label}</span>;
            })}
        </div>;
    };

        /*
     * DOCU: Handle pet card behavior for this feature.
     * @param {Player} player - player value used by this function
     * @param {boolean} mine - mine value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const petCard = (player: Player, mine: boolean) => (
        <div className={`paw-brawl-fighter ${mine ? "mine" : ""} ${battle?.battle?.turn === player.userId ? "is-turn" : ""}`} key={player.userId}>
            <div className="paw-brawl-fighter-art">
                <PetArt species={player.species} breed={player.breed} color={player.color} cosmetic="none" />
            </div>
            <div className="paw-brawl-fighter-details">
                <small>
                    {mine ? "YOUR PET" : `@${player.username}`}
                </small>
                <b>
                    {player.petName}
                </b>
                <span>
                    {player.species} · {player.breed.replaceAll("_", " ")}
                </span>
                <div className="paw-brawl-health-track" aria-label={`${player.hp} of ${player.maxHp} HP`}>
                    <span style={{
                        width: `${100 * player.hp / player.maxHp}%`
                    }} />
                </div>
                <small>
                    {player.hp}/{player.maxHp} HP · {player.shield} shield · {player.focus}/{focusCap} Focus</small>
                <div className="paw-brawl-traits">
                    <span>ATK {player.attack}
                    </span>
                    <span>DEF {player.defense}
                    </span>
                    <span>SPD {player.speed}
                    </span>
                </div>
                <small className="paw-brawl-breed-skill">Passive: {player.passive?.name || "Loading…"}
                </small>
            </div>
        </div>
    );

    return <section className="panel paw-multiplayer">
        <div className="eyebrow">PLAY TOGETHER, PAWS TOGETHER</div>
        <div className="paw-multiplayer-heading">
            <SectionHeading title="Multiplayer" Icon={Swords} />
            <button ref={recentBattlesTriggerRef} type="button" className="paw-multi-header-history" aria-haspopup="dialog" aria-expanded={showRecentBattles} onClick={() => setShowRecentBattles(true)}>
                <Trophy size={16} /> Recent Battles{history.length > 0 && <small>
                    {history.length}
                </small>}
            </button>
        </div>
        <div className="paw-multi-game-library">
            <div className={`paw-multi-game-tile paw-multi-brawl-card ${gameId === "paw_brawl" ? "selected" : ""}`}>
                <button type="button" className="paw-multi-game-picker" onClick={() => setGameId(current => current === "paw_brawl" ? null : "paw_brawl")} aria-pressed={gameId === "paw_brawl"}>
                    <span className="paw-multi-game-art paw-multi-game-art-brawl">
                        <span className="paw-multi-game-art-circle">
                            <Swords size={46} />
                        </span>
                    </span>
                    <span className="paw-multi-game-info">
                        <b>Paw Brawl</b>
                        <small>Classic 1v1 or Duo Clash 2v2</small>
                        <strong>{gameId === "paw_brawl" ? "SELECTED" : "PLAY"}</strong>
                    </span>
                </button>
                <button type="button" className="paw-multi-game-help" aria-label="View all Paw Brawl pet stats and skills" title="All pets, special skills and passives" aria-haspopup="dialog" onClick={() => setShowGameCatalog(true)}>
                    <CircleHelp size={21} strokeWidth={2.2} />
                </button>
            </div>
            <div className="paw-multi-game-tile paw-multi-game-upcoming" aria-label="More multiplayer games coming soon">
                <span className="paw-multi-game-art paw-multi-game-art-soon">
                    <span className="paw-multi-game-art-circle">
                        <Gamepad2 size={44} />
                    </span>
                    <span className="paw-multi-game-status">
                        <Clock3 size={13} /> COMING SOON</span>
                </span>
                <span className="paw-multi-game-info">
                    <b>More Games Soon!</b>
                    <small>New ways to play with friends</small>
                    <strong>STAY TUNED ♡</strong>
                </span>
            </div>
        </div>
        <BrawlCatalogModal open={showGameCatalog} api={api} onClose={() => setShowGameCatalog(false)} />
        {gameId === "paw_brawl" && <div className="paw-brawl-mode-choice" role="group" aria-label="Choose Paw Brawl mode">
            <button
                ref={challengeTriggerRef}
                type="button"
                className={brawlMode === "1v1" ? "is-selected" : ""}
                aria-haspopup="dialog"
                aria-expanded={challengeModalOpen}
                onClick={() => {
                    setBrawlMode("1v1");
                    setDuoLobbyOpen(false);
                    setChallengeModalOpen(true);
                }}
            >
                <Swords size={17}/> Classic Clash 1v1 <small>2 players</small>
            </button>
            <button
                ref={duoModeTriggerRef}
                type="button"
                className={brawlMode === "2v2" ? "is-selected" : ""}
                aria-haspopup="dialog"
                aria-expanded={duoLobbyOpen}
                onClick={() => {
                    setBrawlMode("2v2");
                    setChallengeModalOpen(false);
                    setDuoLobbyOpen(true);
                    setDuoInitialized(true);
                }}
            >
                <Users size={17}/> Duo Clash 2v2 <small>4 players</small>
            </button>
        </div>}
        {duoInitialized && <DuoClash
            api={api}
            token={token}
            userId={userId}
            friends={accepted}
            onUpdate={onUpdate}
            onToast={onToast}
            petLevel={petLevel}
            lobbyOpen={duoLobbyOpen}
            onCloseLobby={closeDuoLobby}
        />}
        {(incoming.length > 0 || outgoing.length > 0) && <div className="paw-multi-notification-list" aria-label="Battle invitation notifications" aria-live="polite">
            {incoming.map(item => <div key={item.id} className="paw-multi-invite-bar is-incoming">
                <span className="paw-multi-invite-icon">
                    <Swords size={19} />
                </span>
                <div className="paw-multi-invite-body">
                    <b>@{item.challenger_username} challenged you to {item.game_name}!</b>
                    <small>
                        <Coins size={13} /> {format(item.wager)} coins each · Winner receives {format(arenaPayout(item.wager, 2, item.arena_fee_percent).payoutPerWinner)} after Arena Fee · Expires {new Date(item.expires_at).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit"
                        })}
                    </small>
                    {coins < item.wager && <small className="paw-multi-error">Need {format(item.wager - coins)} more Paw Coins to accept</small>}
                    {petLevel < 10 && item.wager > 0 && <small className="paw-multi-error">Wagered challenges unlock at Level 10. You can still play free matches.</small>}
                </div>
                <div className="paw-multi-invite-bar-actions">
                    <button type="button" className="paw-multi-accept" disabled={busy || coins < item.wager || (item.wager > 0 && petLevel < 10)} onClick={() => void respond(item.id, "accept")}>
                        <Check size={15} /> Accept</button>
                    <button type="button" className="paw-multi-decline" disabled={busy} onClick={() => void respond(item.id, "decline")}>
                        <X size={15} /> Decline</button>
                </div>
            </div>)}
            {outgoing.map(item => <div key={item.id} className="paw-multi-invite-bar is-outgoing">
                <span className="paw-multi-invite-icon">
                    <Clock3 size={19} />
                </span>
                <div className="paw-multi-invite-body">
                    <b>Invitation sent to @{item.challenged_username}
                    </b>
                    <small>
                        <Coins size={13} /> {format(item.wager)} coins reserved · Awaiting reply</small>
                </div>
                <div className="paw-multi-invite-bar-actions">
                    <button type="button" className="paw-multi-decline" disabled={busy} onClick={() => void respond(item.id, "cancel")}>Cancel & refund</button>
                </div>
            </div>)}
        </div>}
        {challengeModalOpen && <div className="paw-multi-dialog-backdrop" onMouseDown={event => {if (event.target ===event.currentTarget) {closeChallengeModal()}}}>
            <section className="paw-multi-dialog paw-challenge-form" role="dialog" aria-modal="true" aria-labelledby="paw-challenge-title">
                <div className="paw-multi-dialog-header">
                    <div>
                        <h3 id="paw-challenge-title">
                            <Swords size={21} /> Classic Clash · 1v1</h3>
                        <p className="paw-modal-subtitle">Choose a friend and wager to send a challenge.</p>
                    </div>
                    <button ref={challengeCloseRef} type="button" className="paw-multi-dialog-close" aria-label="Close challenge form" onClick={closeChallengeModal}>
                        <X size={19} />
                    </button>
                </div>
                <div className="paw-multi-dialog-body">
                    <label htmlFor="paw-multi-friend">Select your friend</label>
                    <div className="paw-multi-select-wrap">
                        <Users size={18} />
                        <select id="paw-multi-friend" value={friendId} onChange={event => setFriendId(event.target.value)} disabled={locked}>
                            <option value="">Choose a PawPal friend...</option>
                            {accepted.map(friend => <option value={friend.friend_id} key={friend.friend_id}>@{friend.username}
                            </option>)}
                        </select>
                        <ChevronDown size={18} />
                    </div>
                    {accepted.length === 0 && <p className="paw-multi-hint">Add and accept a friend first. Your existing PawPal friends will appear here.</p>}
                    <label htmlFor="paw-multi-wager">Your custom wager</label>
                    <div className="paw-multi-wager-input">
                        <Coins size={18} />
                        <input
                            id="paw-multi-wager"
                            type="number"
                            inputMode="numeric"
                            min="0"
                            max="1000000"
                            step="1"
                            value={wager}
                            onChange={event => setWager(event.target.value)}
                            placeholder="Enter Paw Coins"
                            disabled={locked}
                        />
                        <span>COINS</span>
                    </div>
                    <div className="paw-multi-presets">
                        {[0, 25, 50, 100].map(amount => <button type="button" className={wager === String(amount) ? "chosen" : ""} key={amount} disabled={locked || (petLevel < 10 && amount > 0)} onClick={() => setWager(String(amount))}>
                            {amount === 0 ? "Free" : amount}
                        </button>)}
                    </div>
                    {!validWager && <p className="paw-multi-error">Enter a whole number between 0 and 1,000,000.</p>}
                    {validWager && wagerAmount > coins && <p className="paw-multi-error">You don't have enough coins for this wager.</p>}
                    {petLevel < 10 && <p className="paw-multi-hint">Wagers unlock at Level 10 for both players. Free matches are available now.</p>}
                    {validWager && wagerLevelLocked && <p className="paw-multi-error">Reach Level 10 to wager Paw Coins. Choose Free to play now.</p>}
                    <div className="paw-multi-prize">
                        <span>Your stake <b>
                            {validWager ? format(wagerAmount) : " - "}
                        </b>
                        </span>
                        <span>Friend's stake <b>
                            {validWager ? format(wagerAmount) : " - "}
                        </b>
                        </span>
                        <span>Total prize pool <b>{wagerPreview ? format(wagerPreview.grossPool) : " - "}</b></span>
                        <span className="paw-multi-arena-fee"><span className="paw-multi-arena-fee-label"><span>Arena Fee · up to 5%</span><small>Gov't tax? Baka sa bulsa lang mapunta. (Joke lang! In-game coins only.)</small></span><b>−{wagerPreview ? format(wagerPreview.fee) : " - "}</b></span>
                        <div>
                            <span>Winner receives (after fee)</span>
                            <strong>
                                <Trophy size={18} /> {wagerPreview ? format(wagerPreview.payoutPerWinner) : " - "}
                            </strong>
                        </div>
                        <small className="paw-multi-arena-note">Net profit: {wagerPreview ? `+${format(wagerPreview.payoutPerWinner - wagerAmount)}` : "–"} coins. Arena Fee is removed from circulation only if the match has a winner. Draws and cancelled matches refund the full stake.</small>
                    </div>
                    <p className="paw-multi-hint">
                        <Shield size={15} /> Wagered matches require both pets to be Level 10+. Paid stakes are reserved when challenges are sent and accepted; declined and expired invites are refunded. Free matches reserve no coins.</p>
                    {locked && <p className="paw-multi-hint">Finish or cancel your current invitation or match before starting another.</p>}
                </div>
                <div className="paw-multi-dialog-actions">
                    <button type="button" className="paw-multi-decline" onClick={closeChallengeModal}>Cancel</button>
                    <button className="paw-multi-primary" type="button" disabled={busy || !friendId || !validWager || wagerLevelLocked || wagerAmount > coins || locked} onClick={() => void challenge()}>
                        <Swords size={18} /> Send Battle Challenge</button>
                </div>
            </section>
        </div>}
        {battle && battle.battle && myPet && otherPet && !battleModalOpen && <div className="paw-brawl-rejoin">
            <div>
                <Swords size={20} />
                <span>
                    <b>Your Paw Brawl match is live!</b>
                    <small>vs @{otherPet.username} · {format(arenaPayout(battle.wager, 2, battle.arena_fee_percent).payoutPerWinner)} Paw Coins prize (after fee)</small>
                </span>
            </div>
            <button type="button" onClick={() => setHiddenBattleId(null)}>Return to battle</button>
        </div>}
        {battleModalOpen && battle && battle.battle && myPet && otherPet && <div className="paw-brawl-modal-backdrop" onMouseDown={event => {if (event.target ===event.currentTarget && !showForfeitConfirm && !showSpecialHelp && !showBattleLog && !showBattleInfo && !showSkillsInfo) {if (matchFinished) {setDismissedFinishId(battle.id);} else {setShowForfeitConfirm(true);}}}}>
            <section className="paw-brawl-modal" role="dialog" aria-modal="true" aria-labelledby="paw-brawl-modal-title">
                <div className="paw-brawl-modal-header paw-multi-dialog-header">
                    <div>
                        <h2 id="paw-brawl-modal-title">
                            <Swords size={22} /> Paw Brawl
                        </h2>
                        <span className="paw-brawl-modal-kicker">Live multiplayer · Round {roundNumber} · {format(arenaPayout(battle.wager, 2, battle.arena_fee_percent).payoutPerWinner)} Paw Coins prize (after fee)</span>
                    </div>
                    <div className="paw-brawl-modal-header-right">
                        <button type="button" className="paw-brawl-info-toggle" aria-expanded={showBattleInfo} onClick={() => { setShowSkillsInfo(false); setShowBattleInfo(true); }}>
                            <CircleHelp size={17} /> Effects</button>
                        <button type="button" className="paw-brawl-info-toggle" aria-expanded={showSkillsInfo} onClick={() => { setShowBattleInfo(false); setShowSkillsInfo(true); }}>
                            <Swords size={16} /> Skills</button>
                        <button
                            type="button"
                            className="paw-brawl-modal-close paw-multi-dialog-close"
                            aria-label={matchFinished ? "Close battle" : "Quit battle (forfeit)"}
                            title={matchFinished ? "Close battle" : "Quit battle (forfeit)"}
                            onClick={() => {
                                if (matchFinished) {
                                    setDismissedFinishId(battle.id);
                                } else {
                                    setShowForfeitConfirm(true);
                                }
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
                {showBattleInfo && <BrawlGuideModal title="Combat Effects" subtitle="Poison, Counter, Dodge, Stun, Shield and other statuses" onClose={() => setShowBattleInfo(false)}>
                    <BrawlStatGuide />
                </BrawlGuideModal>}
                {showSkillsInfo && <BrawlGuideModal title="Breed Skills & Passives" subtitle="Special abilities, Focus costs and passive traits" onClose={() => setShowSkillsInfo(false)}>
                    <BrawlSkillGuide pets={[myPet, otherPet]} />
                </BrawlGuideModal>}
                <div className="paw-brawl-scoreboard" aria-label="Current battle statistics">
                        <div className="paw-brawl-battle-hud paw-brawl-hud-player">
                            <div className="paw-brawl-hud-top">
                                <b>
                                    {myPet.petName}
                                </b>
                                <small>YOUR PET</small>
                            </div>
                            <span className="paw-brawl-grade" title={`${myPet.breed.replaceAll("_", " ")} · ${breedGrade(myPet)} breed grade`}>✦ {breedGrade(myPet)} grade</span>
                            <div className="paw-brawl-hud-health">
                                <span style={{
                                    width: `${100 * myPet.hp / myPet.maxHp}%`
                                }} />
                            </div>
                            <small>HP {myPet.hp}/{myPet.maxHp} · Shield {myPet.shield} · Focus {myPet.focus}/{focusCap}
                            </small>
                            <div className="paw-brawl-mini-stats" aria-label="Your attack, defense and speed">
                                <span>ATK {myPet.attack}</span><span>DEF {myPet.defense}</span><span>SPD {myPet.speed}</span>
                            </div>
                            <div className="paw-brawl-status-with-help">
                                <BrawlStatusBadges player={myPet} round={battle.battle.roundSerial || 0} compact />
                                <button type="button" className="paw-brawl-hud-stats-help" onClick={() => setShowBattleInfo(true)} title="Explain Poison, Counter and other status effects" aria-label="Explain combat status effects"><CircleHelp size={13}/></button>
                            </div>
                            <div className="paw-brawl-focus-pips" aria-label={`${myPet.focus} of ${focusCap} Focus`}>
                                {Array.from({
                                    length: focusCap
                                }, (_, index) => <span key={index} className={index < myPet.focus ? "is-filled" : ""} />)}
                            </div>
                        </div>
                        <div className="paw-brawl-battle-hud paw-brawl-hud-opponent">
                            <div className="paw-brawl-hud-top">
                                <b>
                                    {otherPet.petName}
                                </b>
                                <small>@{otherPet.username}
                                </small>
                            </div>
                            <span className="paw-brawl-grade" title={`${otherPet.breed.replaceAll("_", " ")} · ${breedGrade(otherPet)} breed grade`}>✦ {breedGrade(otherPet)} grade</span>
                            <div className="paw-brawl-hud-health">
                                <span style={{
                                    width: `${100 * otherPet.hp / otherPet.maxHp}%`
                                }} />
                            </div>
                            <small>HP {otherPet.hp}/{otherPet.maxHp} · Shield {otherPet.shield} · Focus {otherPet.focus}/{focusCap}
                            </small>
                            <div className="paw-brawl-mini-stats" aria-label="Enemy attack, defense and speed">
                                <span>ATK {otherPet.attack}</span><span>DEF {otherPet.defense}</span><span>SPD {otherPet.speed}</span>
                            </div>
                            <div className="paw-brawl-status-with-help">
                                <BrawlStatusBadges player={otherPet} round={battle.battle.roundSerial || 0} compact />
                                <button type="button" className="paw-brawl-hud-stats-help" onClick={() => setShowBattleInfo(true)} title="Explain Poison, Counter and other status effects" aria-label="Explain combat status effects"><CircleHelp size={13}/></button>
                            </div>
                        </div>
                </div>
                <div className="paw-brawl-battlefield">
                    <div className="paw-brawl-turn-order" aria-label="Speed-based action resolution order">
                        <strong>ACTION ORDER</strong>
                        <div className="is-line">{[myPet, otherPet].sort((a, b) => b.speed - a.speed || a.userId.localeCompare(b.userId)).map(p => <div key={p.userId} className={`is-portrait ${p.userId === userId ? "is-mine" : ""} ${visualEffect?.actorId === p.userId && animatingRound ? "is-acting" : ""} ${p.hp <= 0 ? "is-downed" : ""}`} title={`${p.petName} · SPD ${p.speed}${myPet.speed === otherPet.speed ? " · simultaneous Speed tie" : ""}`}><PetArt species={p.species} breed={p.breed} color={p.color} cosmetic="none"/><small>{p.speed}</small></div>)}</div>
                    </div>
                    <div className="paw-brawl-landscape-sun" />
                    <div className="paw-brawl-hill paw-brawl-hill-back" />
                    <div className="paw-brawl-hill paw-brawl-hill-front" />
                    <div className="paw-brawl-arena-arch" aria-hidden="true" />
                    <div className="paw-brawl-arena-pillar is-left" aria-hidden="true" />
                    <div className="paw-brawl-arena-pillar is-right" aria-hidden="true" />
                    <div className="paw-brawl-arena-rune" aria-hidden="true" />
                    <div className="paw-brawl-arena-sparks" aria-hidden="true" />
                    <div className={`paw-brawl-combatant paw-brawl-combatant-enemy ${attackEffectActive && visualEffect?.actorId === otherPet.userId ? "has-attacking-pet" : ""}`}>
                        <div className="paw-brawl-platform" />
                        {floatingNumbers(otherPet.userId)}
                        <div key={`${spriteEffectKey}:enemy`} ref={enemySpriteRef} style={spriteLungeStyle(otherPet.userId)} className={`paw-brawl-pet-sprite paw-brawl-sprite-enemy ${spriteMotionClass(otherPet.userId)}`}>
                            <PetArt species={otherPet.species} breed={otherPet.breed} color={otherPet.color} cosmetic="none" />
                            {petAura(otherPet.userId)}
                            {hitOverlay(otherPet.userId)}
                        </div>
                    </div>
                    <div className={`paw-brawl-combatant paw-brawl-combatant-player ${attackEffectActive && visualEffect?.actorId === myPet.userId ? "has-attacking-pet" : ""}`}>
                        <div className="paw-brawl-platform" />
                        {floatingNumbers(myPet.userId)}
                        <div key={`${spriteEffectKey}:player`} ref={playerSpriteRef} style={spriteLungeStyle(myPet.userId)} className={`paw-brawl-pet-sprite paw-brawl-sprite-player ${spriteMotionClass(myPet.userId)}`}>
                            <PetArt species={myPet.species} breed={myPet.breed} color={myPet.color} cosmetic="none" />
                            {petAura(myPet.userId)}
                            {hitOverlay(myPet.userId)}
                        </div>
                    </div>
                </div>
                {matchFinished && finishedResultReady && <div className="paw-brawl-final-result" role="status" aria-live="polite">
                    <Trophy size={27} />
                    <h3>
                        {!battle.winner_id ? "Draw!" : battle.winner_id === userId ? "Victory!" : "Defeat"}
                    </h3>
                    <p>
                        {!battle.winner_id ? "Both wagers have been refunded." : battle.winner_id === userId ? `You received ${format(arenaPayout(battle.wager, 2, battle.arena_fee_percent).payoutPerWinner)} Paw Coins (after ${format(arenaPayout(battle.wager, 2, battle.arena_fee_percent).fee)} Arena Fee). Net profit: +${format(arenaPayout(battle.wager, 2, battle.arena_fee_percent).payoutPerWinner - battle.wager)}.` : "Your opponent won this match."}
                    </p>
                    {battle.battle.matchTotals && <div className="paw-brawl-result-stats" aria-label="Match performance">
                        {[myPet, otherPet].map(p => <span key={p.userId}><b>{p.petName}</b> {format(battle.battle!.matchTotals?.[p.userId]?.damage || 0)} damage · {format(battle.battle!.matchTotals?.[p.userId]?.healing || 0)} healed · {battle.battle!.matchTotals?.[p.userId]?.specials || 0} specials</span>)}
                    </div>}
                    <button type="button" onClick={() => setDismissedFinishId(battle.id)}>View battle history</button>
                </div>}
                {showForfeitConfirm && !matchFinished && (
                    <MatchExitConfirmation
                        gameName="Paw Brawl"
                        description={`You will lose the match. Your friend receives ${format(arenaPayout(battle.wager, 2, battle.arena_fee_percent).payoutPerWinner)} Paw Coins after a ${format(arenaPayout(battle.wager, 2, battle.arena_fee_percent).fee)}-coin Arena Fee. This cannot be undone.`}
                        busy={busy}
                        error={forfeitError}
                        onCancel={() => { setShowForfeitConfirm(false); setForfeitError(""); }}
                        onForfeit={() => void confirmForfeit()}
                    />
                )}
                {showSpecialHelp && <div className="paw-brawl-special-help-backdrop" onMouseDown={event => {if (event.target ===event.currentTarget) {closeSpecialHelp()}}}>
                    <section className="paw-brawl-special-help-dialog" role="dialog" aria-modal="true" aria-labelledby="paw-brawl-special-help-title">
                        <div className="paw-modal-top paw-brawl-special-help-header paw-multi-dialog-header">
                            <div>
                                <h3 id="paw-brawl-special-help-title">
                                    <Sparkles size={20} /> Special {selectedSpecialIndex + 1} details
                                </h3>
                                <p className="paw-modal-subtitle">{myPet.breed.replaceAll("_", " ")} · {breedGrade(myPet)}</p>
                            </div>
                            <button ref={specialHelpCloseRef} type="button" className="paw-brawl-special-help-close paw-modal-close paw-multi-dialog-close" aria-label="Close skill details" onClick={closeSpecialHelp}>
                                <X size={18} />
                            </button>
                        </div>
                        {(() => {
                            const skill = selectedSpecialIndex === 0 ? firstSpecial : secondSpecial;
                            if (!skill) { return <p>Skill details are not available for this match.</p>; }
                            const remaining = myPet.cooldowns?.[selectedSpecialIndex] ?? (selectedSpecialIndex === 0 ? myPet.cooldown : 0);
                            return <div className="paw-brawl-special-guide-entry">
                                <h4>{skill.name}</h4>
                                <p>{skill.description}</p>
                                <div className="paw-brawl-special-help-stats">
                                    <span><Zap size={15} /> {skill.cost} Focus, {skill.cooldown} rounds</span>
                                    {remaining > 0 && <span><Clock3 size={15} /> {remaining} left</span>}
                                </div>
                                {skill.trigger && <p className="paw-brawl-special-activation">{conditionalBonusReady(skill) ? "Extra effect available now (depending on the enemy's move)." : "Normal skill still works even when its extra effect is unavailable."}</p>}
                            </div>;
                        })()}
                        <button type="button" className="paw-brawl-special-help-done" onClick={closeSpecialHelp}>Got it</button>
                    </section>
                </div>}
                {showBattleLog && <div className="paw-brawl-log-modal-backdrop" onMouseDown={event => {if (event.target ===event.currentTarget) {closeBattleLog()}}}>
                    <section className="paw-brawl-log-modal" role="dialog" aria-modal="true" aria-labelledby="paw-brawl-log-modal-title">
                        <div className="paw-brawl-log-modal-heading paw-multi-dialog-header">
                            <div>
                                <h3 id="paw-brawl-log-modal-title">
                                    <Clock3 size={19} /> Battle Log</h3>
                                <p className="paw-modal-subtitle">Live round {roundNumber} · Recent actions</p>
                            </div>
                            <button ref={battleLogCloseRef} type="button" className="paw-multi-dialog-close" aria-label="Close battle log" onClick={closeBattleLog}>
                                <X size={19} />
                            </button>
                        </div>
                        <div className="paw-brawl-log-modal-entries" role="log" aria-live="polite">
                            {battle.battle.log.length ? battle.battle.log.slice().reverse().map((entry, index) => <p key={`${battle.id}-${battle.battle!.turns}-${index}`}>
                                {entry}
                            </p>) : <p>No moves yet. Your battle story starts here!</p>}
                        </div>
                        <button type="button" className="paw-brawl-special-help-done" onClick={closeBattleLog}>Back to battle</button>
                    </section>
                </div>}
                <div className="paw-brawl-modal-controls">
                    {!matchFinished && <>
                        <div className="paw-brawl-turn-banner">
                            <span className={`paw-brawl-turn-clock ${timeLeft <= 10 ? "is-urgent" : ""}`}>
                                <Clock3 size={16} /> {timeLeft}s</span>
                            <span className="paw-brawl-turn-message" title={moveLocked ? "Your move is locked in. Waiting for your opponent." : `Choose ${myPet.petName}'s secret move.`}>
                                {isStunned ? "Stunned · skips this round" : moveLocked ? "Move locked · waiting" : isRoundSyncing ? "Round expired · syncing new round" : busy ? "Submitting move…" : "Choose a move"}
                            </span>
                            <span className="paw-brawl-ready-count">
                                {readyCount}/2 ready</span>
                        </div>
                        {isRoundSyncing && <button type="button" className="paw-brawl-sync-round" onClick={() => void reload()}>Refresh battle round</button>}
                        <div className="paw-brawl-hidden-move-note">
                            <Shield size={14} /> Secret moves · 30s rounds · Guard fatigue · Overtime pressure</div>
                        <div className="paw-brawl-action-grid" aria-label="Choose an action">
                            <button type="button" title={`If this attack hits right now: about ${basicAttackPreview?.hp ?? "?"} HP damage${basicAttackPreview?.blocked ? `, with ${basicAttackPreview.blocked} blocked by Shield` : ""}. Dodge and effects may change the actual result. You also earn Focus.`} disabled={moveLocked || busy || timeLeft === 0} onClick={() => void move(battle.id, "strike")}>
                                <Swords size={19} />
                                <b>Paw Strike</b>
                                <small>{basicAttackPreview?.hp ?? "?"} HP if hit · +{(battleRules?.strikeFocus ?? 1) + (myPet.passive?.kind === "stride" ? 1 : 0)} Focus</small>
                            </button>
                            <button type="button" title={`Gain up to ${nextGuardShield} Shield and +${nextGuardFocus} Focus. Only a first consecutive Guard with room for Shield earns Focus; the second earns 0 Focus and later Guards are exhausted.`} disabled={moveLocked || busy || timeLeft === 0} onClick={() => void move(battle.id, "guard")}>
                                <Shield size={19} />
                                <b>Guard</b>
                                <small>
                                    {nextGuardShield > 0 ? `+${nextGuardShield} Shield · +${nextGuardFocus} Focus` : "Guard exhausted · +0 Focus"}
                                </small>
                            </button>
                            <button type="button" title={`Recharge ${battleRules?.focusGain ?? 3} Focus, up to ${focusCap}. Both special skills spend Focus.`} disabled={moveLocked || busy || timeLeft === 0} onClick={() => void move(battle.id, "focus")}>
                                <Zap size={19} />
                                <b>Focus</b>
                                <small>Recharge · +{battleRules?.focusGain ?? 3} Focus</small>
                            </button>
                            {([firstSpecial, secondSpecial] as const).map((skill, index) => skill ? <div className="paw-brawl-special-action" key={`${skill.name}-${index}`}>
                                <button type="button" className="paw-brawl-special-move" title={`${skill.name} · costs ${skill.cost} Focus · ${skill.description}`} disabled={moveLocked || busy || timeLeft === 0 || !skillReady(skill, index)} onClick={() => void move(battle.id, index === 0 ? "special" : "special2")}>
                                    <Sparkles size={19} />
                                    <b>Special {index + 1}: {skill.name}</b>
                                    <small className="paw-brawl-special-role" aria-label={`Extra skill bonus ${conditionalBonusReady(skill) ? "currently active" : "not currently active"}`}>
                                        {conditionalBonusReady(skill) ? "Extra bonus: YES" : "Normal skill only"}
                                    </small>
                                    <small className="paw-brawl-special-cost">
                                        {skill.cost} Focus, {skill.cooldown} rounds
                                        {(myPet.cooldowns?.[index] ?? (index === 0 ? myPet.cooldown : 0)) > 0
                                            ? ` · ${myPet.cooldowns?.[index] ?? (index === 0 ? myPet.cooldown : 0)} left`
                                            : ""}
                                    </small>
                                </button>
                                <button
                                    ref={element => { specialHelpTriggerRefs.current[index] = element; }}
                                    type="button"
                                    className="paw-brawl-special-help"
                                    aria-label={`Details for ${skill.name}`}
                                    aria-haspopup="dialog"
                                    aria-expanded={showSpecialHelp && selectedSpecialIndex === index}
                                    title={`Read ${skill.name} only`}
                                    onClick={() => {
                                        setSelectedSpecialIndex(index as 0 | 1);
                                        setShowBattleInfo(false);
                                        setShowSpecialHelp(true);
                                    }}
                                ><CircleHelp size={15} /></button>
                            </div> : null)}
                        </div>
                    </>}
                    <div className="paw-brawl-utilities">
                        <button
                            ref={battleLogTriggerRef}
                            type="button"
                            className="paw-brawl-log-button"
                            aria-haspopup="dialog"
                            onClick={() => {
                                setShowBattleInfo(false);
                                setShowBattleLog(true)
                            }}
                        >
                            <Clock3 size={15} /> Battle log ({battle.battle.log.length})</button>
                        {!matchFinished && <button type="button" className="paw-brawl-forfeit" disabled={busy} onClick={() => setShowForfeitConfirm(true)}>Forfeit match</button>}
                    </div>
                </div>
            </section>
        </div>}
        {showRecentBattles && <div className="paw-multi-dialog-backdrop" onMouseDown={event => {if (event.target ===event.currentTarget) {closeRecentBattles()}}}>
            <section className="paw-multi-dialog paw-multi-history-dialog" role="dialog" aria-modal="true" aria-labelledby="paw-recent-battles-title">
                <div className="paw-multi-dialog-header">
                    <div>
                        <h3 id="paw-recent-battles-title">
                            <Trophy size={20} /> Recent Battles</h3>
                        <span className="paw-brawl-modal-kicker">Paw Brawl · Match history</span>
                    </div>
                    <button ref={recentBattlesCloseRef} type="button" className="paw-multi-dialog-close" aria-label="Close recent battles" onClick={closeRecentBattles}>
                        <X size={19} />
                    </button>
                </div>
                <div className="paw-multi-dialog-body paw-multi-history-list">
                    {history.length === 0 ? <div className="paw-multi-history-empty">
                        <Trophy size={29} />
                        <b>No battles yet</b>
                        <p>Challenge a friend to start your match history.</p>
                    </div> : history.map(item => <div className="paw-multi-history-row" key={item.id}>
                        <div>
                            <b>
                                {item.game_name}
                            </b>
                            <small>vs @{item.challenger_id === userId ? item.challenged_username : item.challenger_username} · {format(item.wager)} each</small>
                            <small>
                                {new Date(item.updated_at).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                })}
                            </small>
                        </div>
                        <span className={item.status === "finished" ? item.winner_id === userId ? "won" : "lost" : ""}>
                            {item.status === "finished" ? !item.winner_id ? "Draw · refunded" : item.winner_id === userId ? "Victory" : "Defeat" : item.status}
                        </span>
                    </div>)}
                </div>
                <div className="paw-multi-dialog-actions">
                    <button type="button" className="paw-multi-history-done" onClick={closeRecentBattles}>Close</button>
                </div>
            </section>
        </div>}
    </section>;
}
