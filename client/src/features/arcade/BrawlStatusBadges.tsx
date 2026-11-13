import {
    AlertTriangle,
    ArrowDown,
    CheckCircle2,
    Droplets,
    Eye,
    HeartPulse,
    RotateCcw,
    Shield,
    ShieldCheck,
    Swords,
    Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Only resolved, public battle state. Never reveal either player's secret move.
type StatusPlayer = {
    shield: number;
    shieldExpiresRound?: number;
    shieldBreakRefund?: number;
    adaptiveDodgeUntil?: number;
    poisonRounds?: number;
    poisonDamage?: number;
    counterDamage?: number;
    powerCharge?: number;
    evadeCharges?: number;
    weakenedRounds?: number;
    stunnedRounds?: number;
    stunImmunity?: number;
    guardStreak?: number;
    coverCooldown?: number;
    lastStandUsed?: boolean;
    passive?: { kind?: string };
};

type Props = {
    player: StatusPlayer;
    round: number;
    compact?: boolean;
};

type EffectBadge = {
    id: string;
    icon: LucideIcon;
    amount?: number | string;
    rounds?: number;
    description: string;
};

/*
 * DOCU: Render the brawl status badges interface and provide its feature behavior.
 * @param {Props} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export default function BrawlStatusBadges({ player, round, compact = false }: Props) {
    const effects: EffectBadge[] = [];
    const remainingShieldRounds = player.shield > 0 && player.shieldExpiresRound
        ? Math.max(0, player.shieldExpiresRound - round + 1)
        : 0;

    if (player.shield > 0) {
        effects.push({
            id: "shield", icon: Shield, amount: player.shield,
            rounds: remainingShieldRounds || undefined,
            description: `${player.shield} Shield. ${remainingShieldRounds || "Unknown"} rounds remaining. Shield blocks part of an attack.`
        });
    }
    if ((player.poisonRounds || 0) > 0) {
        const damage = player.poisonDamage || 5;
        effects.push({
            id: "poison", icon: Droplets, amount: `−${damage}`, rounds: player.poisonRounds,
            description: `Poison: lose ${damage} HP at the end of each of the next ${player.poisonRounds} rounds. Poison ignores Shield.`
        });
    }
    if ((player.counterDamage || 0) > 0) {
        effects.push({
            id: "counter", icon: RotateCcw, amount: player.counterDamage,
            description: `Counter ready. When attacked, hit back for ${player.counterDamage} damage once.`
        });
    }
    if ((player.powerCharge || 0) > 0) {
        effects.push({
            id: "power", icon: Swords, amount: `+${player.powerCharge}`,
            description: `Next damaging attack gets ${player.powerCharge} extra damage.`
        });
    }
    if ((player.evadeCharges || 0) > 0) {
        effects.push({
            id: "dodge", icon: Eye, amount: "+20%",
            description: "The next enemy attack has up to 20% more chance to miss. Not a guaranteed dodge."
        });
    }
    if ((player.adaptiveDodgeUntil || 0) > 0) {
        effects.push({
            id: "adaptive", icon: ShieldCheck, amount: "10",
            description: "Dodge prepared. If the enemy Guards or Focuses instead of attacking, this becomes up to 10 Shield."
        });
    }
    if ((player.weakenedRounds || 0) > 0) {
        effects.push({
            id: "weaken", icon: ArrowDown, amount: "−5", rounds: player.weakenedRounds,
            description: "The next attack deals 5 less damage."
        });
    }
    if ((player.stunnedRounds || 0) > 0) {
        effects.push({
            id: "stun", icon: AlertTriangle, rounds: player.stunnedRounds,
            description: "Stunned: cannot choose an action when the stun takes effect next round."
        });
    }
    if ((player.stunImmunity || 0) > 0) {
        effects.push({
            id: "immune", icon: ShieldCheck, rounds: player.stunImmunity,
            description: `Stun protection: cannot be stunned again for ${player.stunImmunity} more action(s).`
        });
    }
    if ((player.shieldBreakRefund || 0) > 0 && player.shield > 0) {
        effects.push({
            id: "refund", icon: Zap, amount: `+${player.shieldBreakRefund}`,
            description: `If this Shield is broken by damage before it expires, gain up to ${player.shieldBreakRefund} Focus. Expiry gives none.`
        });
    }
    if ((player.coverCooldown || 0) > 0) {
        effects.push({
            id: "cover-cooldown", icon: ShieldCheck,
            amount: "CD", rounds: player.coverCooldown,
            description: `Cover Teammate available after ${player.coverCooldown} more round(s).`
        });
    }
    if ((player.guardStreak || 0) > 0) {
        effects.push({
            id: "fatigue", icon: Droplets, amount: player.guardStreak,
            description: player.guardStreak! >= 2
                ? "Guard exhausted: guarding again earns no Shield and no Focus. Use another action to reset."
                : "Guard fatigue: guarding again earns less Shield and no Focus."
        });
    }
    if (player.passive?.kind === "laststand" && player.lastStandUsed) {
        effects.push({
            id: "laststand", icon: HeartPulse,
            description: "Last Stand already saved this pet once. It cannot activate again this match."
        });
    }

    return <div className={`paw-brawl-status-list ${compact ? "is-compact" : ""}`} aria-label="Active battle effects. Icons show the effect amount and a small circle shows rounds remaining.">
        {effects.length === 0 && <span className="paw-brawl-status-idle" title="No active effects" aria-label="No active effects">
            <CheckCircle2 size={15} aria-hidden="true" />
        </span>}
        {effects.map(effect => {
            const Icon = effect.icon;
            return <span className={`paw-brawl-effect is-${effect.id}`} key={effect.id} title={effect.description} aria-label={effect.description} tabIndex={0}>
                <Icon size={15} aria-hidden="true" />
                {effect.amount !== undefined && <b className="paw-brawl-effect-amount">{effect.amount}</b>}
                {effect.rounds !== undefined && <small className="paw-brawl-effect-rounds" aria-label={`${effect.rounds} rounds left`}>{effect.rounds}</small>}
            </span>;
        })}
    </div>;
}
