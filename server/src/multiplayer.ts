import { randomUUID } from "node:crypto";
import { logSafeError } from "./security.js";
import type { Express } from "express";
import { z } from "zod";
import { pool } from "./db.js";
import { calculateArenaPayout, recordArenaFee } from "./arenaFees.js";
import {
    BRAWL_RULES,
    FOCUS_CAP,
    SHIELD_CAP,
    guardShieldForStreak,
    getCombatKit,
    getPublicCombatCatalog,
    getStyle,
    type BattleSpecial,
    type BattlePassive,
    type BreedProgression
} from "./brawlAbilities.js";

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
    shieldExpiresRound?: number;
    shieldBreakRefund?: number;
    adaptiveDodgeUntil?: number;
    focus: number;
    cooldown: number;
    style: number;
    trait: number;
    special?: BattleSpecial;
    specials?: [BattleSpecial, BattleSpecial];
    cooldowns?: [number, number];
    specialLockout?: number;
    passive?: BattlePassive;
    progression?: BreedProgression;
    powerCharge?: number;
    evadeCharges?: number;
    lastStandUsed?: boolean;
    guardStreak?: number;
    stunnedRounds?: number;
    stunEffectiveRound?: number;
    stunImmunity?: number;
    poisonRounds?: number;
    poisonDamage?: number;
    weakenedRounds?: number;
    counterDamage?: number;
};
export type Battle = {
    players: [Player, Player];
    focusCap?: number;
    rules?: typeof BRAWL_RULES;
    turn: string;
    turns: number;
    turnExpiresAt: string;
    pendingMoves?: Record<string, "strike" | "guard" | "focus" | "special" | "special2">;
    roundStartMoves?: Record<string, "strike" | "guard" | "focus" | "special" | "special2">;
    log: string[];
    lastRoundEffects?: Array<{
        visualChanges?: BattleVisualChange[];
        actorId: string;
        targetId: string;
        action: string;
        moveName?: string;
        dodged?: boolean;
        playersAfter?: [Player, Player]
    }>;
    roundSerial?: number;
    roundStartPlayers?: [Player, Player];
    matchTotals?: Record<string, { damage: number; healing: number; shield: number; specials: number }>;
};

export type BattleVisualChange = {
    targetId: string;
    kind: "damage" | "poison" | "heal" | "shield" | "focus" | "counter" | "recoil" | "pressure" | "status";
    amount?: number;
    label?: string;
};

type DbClient = {
    query: (sql: string, params?: unknown[]) => Promise<any>
};
const gameNames: Record<string, string> = {
    paw_brawl: "Paw Brawl"
};
const challengeInput = z.object({
    friendId: z.string().uuid(),
    gameId: z.literal("paw_brawl"),
    wager: z.number().int().min(0).max(1000000)
});
const actionInput = z.object({
    action: z.enum(["strike", "guard", "focus", "special", "special2"])
});
const validId = z.string().uuid();
/*
 * DOCU: Alive the current state for this feature.
 * @param {Battle} battle - battle value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
const alive = (battle: Battle) => battle.players.every(player => player.hp > 0);
const TURN_MS = 30000;
/*
 * DOCU: Handle dodge chance behavior for this feature.
 * @param {number} speed - speed value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
const dodgeChance = (speed: number) => Math.min(0.15, Math.max(0.03, speed * 0.006));
// Abilities are defined in one authoritative catalog, shared through the public rules API.
/*
 * DOCU: Handle kit for behavior for this feature.
 * @param {Player} player - player value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function kitFor(player: Player) {
    return getCombatKit(player.species, player.breed);
}
/*
 * DOCU: Normalize player for this feature.
 * @param {Player} player - player value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function normalizePlayer(player: Player) {
    const kit = kitFor(player);
    player.special = kit.special;
    player.specials = kit.specials;
    player.cooldowns ??= [player.cooldown ?? 0, 0];
    // Legacy saved matches may contain a shared lockout; different specials
    // can now combo within a three-round Shield window if Focus permits.
    player.specialLockout = 0;
    player.cooldown = player.cooldowns[0];
    player.passive = kit.passive;
    player.powerCharge ??= 0;
    player.evadeCharges ??= 0;
    player.shieldExpiresRound ??= 0;
    player.shieldBreakRefund ??= 0;
    player.adaptiveDodgeUntil ??= 0;
    player.lastStandUsed ??= false;
    player.guardStreak ??= 0;
    player.stunnedRounds ??= 0;
    player.stunEffectiveRound ??= 0;
    player.stunImmunity ??= 0;
    player.poisonRounds ??= 0;
    player.poisonDamage ??= 5;
    player.weakenedRounds ??= 0;
    player.counterDamage ??= 0;
}
/*
 * DOCU: Get passive for this feature.
 * @param {Player} player - player value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function getPassive(player: Player) {
    return kitFor(player).passive;
}
/*
 * DOCU: Get dodge for this feature.
 * @param {Player} player - player value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function getDodge(player: Player) {
    const passive = getPassive(player);
    const bonus = passive.kind === "lightfoot" ? (passive.strength + 2) / 100 : 0;
    return Math.min(0.35, dodgeChance(player.speed) + bonus + (player.evadeCharges ? 0.20 : 0));
}
/*
 * DOCU: Handle make player behavior for this feature.
 * @param {string} userId - userId value used by this function
 * @param {string} username - username value used by this function
 * @param {any} pet - pet value used by this function
 * @returns {Player} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function makePlayer(userId: string, username: string, pet: any): Player {
    const kit = getCombatKit(pet.species, pet.breed);
    return {
        userId,
        username,
        petName: pet.name,
        species: pet.species,
        breed: pet.breed,
        color: pet.color,
        hp: kit.stats.hp,
        maxHp: kit.stats.hp,
        attack: kit.stats.attack,
        defense: kit.stats.defense,
        speed: kit.stats.speed,
        shield: 0,
        shieldExpiresRound: 0,
        shieldBreakRefund: 0,
        adaptiveDodgeUntil: 0,
        focus: 0,
        cooldown: 0,
        style: getStyle(pet.breed),
        trait: [...pet.breed].reduce((total: number, char: string) => total + char.charCodeAt(0), 0) % 3,
        special: kit.special,
        specials: kit.specials,
        cooldowns: [0, 0],
        specialLockout: 0,
        passive: kit.passive,
        progression: kit.progression,
        powerCharge: 0,
        evadeCharges: 0,
        lastStandUsed: false,
        guardStreak: 0,
        stunnedRounds: 0,
        stunEffectiveRound: 0,
        stunImmunity: 0,
        poisonRounds: 0,
        poisonDamage: 5,
        weakenedRounds: 0,
        counterDamage: 0
    };
}

type BattleAction = "strike" | "guard" | "focus" | "special" | "special2";
/*
 * DOCU: Is special for this feature.
 * @param {BattleAction | undefined} action - action value used by this function
 * @returns {action is "special" | "special2"} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function isSpecial(action: BattleAction | undefined): action is "special" | "special2" {
    return action === "special" || action === "special2";
}
/*
 * DOCU: Handle special for behavior for this feature.
 * @param {Player} player - player value used by this function
 * @param {"special" | "special2"} action - action value used by this function
 * @returns {BattleSpecial} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function specialFor(player: Player, action: "special" | "special2"): BattleSpecial {
    return kitFor(player).specials[action === "special" ? 0 : 1];
}
// Conditional specials care about their actual game state, never skill slot.
/*
 * DOCU: Handle trigger met behavior for this feature.
 * @param {BattleSpecial} skill - skill value used by this function
 * @param {Player} actor - actor value used by this function
 * @param {Player} target - target value used by this function
 * @returns {boolean} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function triggerMet(skill: BattleSpecial, actor: Player, target: Player): boolean {
    switch (skill.trigger) {
        case "faster": return actor.speed > target.speed;
        case "enemy_healthy": return target.hp > target.maxHp / 2;
        case "enemy_shielded": return target.shield > 0;
        case "wounded": return actor.hp <= actor.maxHp / 2;
        case "low_shield": return actor.shield <= 4;
        case "low_focus": return actor.focus - skill.cost <= 3;
        case "has_shield": return actor.shield > 0;
        case "shield_created": return true; // Refund arms only if Shield is gained below.
    }
}
/*
 * DOCU: Mark new shield for this feature.
 * @param {Player} pet - pet value used by this function
 * @param {number} round - round value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function markNewShield(pet: Player, round: number) {
    if (pet.shield > 0) {
        // Count creation round + the next two rounds; expire at the end of round 3.
        pet.shieldExpiresRound = round + BRAWL_RULES.shieldDurationRounds - 1;
    }
}
/*
 * DOCU: Handle reward broken shield behavior for this feature.
 * @param {Player} pet - pet value used by this function
 * @param {number} before - before value used by this function
 * @param {string[]} notes - notes value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function rewardBrokenShield(pet: Player, before: number, notes: string[]) {
    if (before > 0 && pet.shield === 0 && (pet.shieldBreakRefund || 0) > 0) {
        const gained = Math.min(FOCUS_CAP - pet.focus, pet.shieldBreakRefund || 0);
        pet.focus += gained;
        pet.shieldBreakRefund = 0;
        if (gained) { notes.push(`${pet.petName} +${gained} Focus when Shield broke`); }
    }
}
// Single-source combat resolver; only the server applies damage, shields, status
// effects and resource changes. This deliberately favors choices over breed tier.
/*
 * DOCU: Apply move for this feature.
 * @param {Battle} battle - battle value used by this function
 * @param {Player} actor - actor value used by this function
 * @param {Player} target - target value used by this function
 * @param {BattleAction} action - action value used by this function
 * @throws {Error} - Propagates an error when this operation cannot complete.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function applyMove(battle: Battle, actor: Player, target: Player, action: BattleAction) {
    normalizePlayer(actor);
    normalizePlayer(target);
    const passive = getPassive(actor);
    const targetPassive = getPassive(target);
    const special = isSpecial(action) ? specialFor(actor, action) : kitFor(actor).special;
    const chosenSkillIndex = action === "special2" ? 1 : 0;
    const conditionMet = isSpecial(action) && triggerMet(special, actor, target);
    const visualBefore = battle.players.map(pet => ({
        userId: pet.userId, hp: pet.hp, shield: pet.shield, focus: pet.focus
    }));
    const actorShieldBefore = actor.shield;
    if (actor.stunnedRounds && (actor.stunEffectiveRound || 0) <= (battle.roundSerial || 0)) {
        throw new Error("This pet is stunned and cannot choose a move this round.");
    }
    if (isSpecial(action) && (actor.focus < special.cost || (actor.cooldowns?.[chosenSkillIndex] || 0) > 0)) {
        throw new Error("Special unavailable at resolution.");
    }
    if (!isSpecial(action)) {
        actor.specialLockout = 0;
    }
    actor.cooldowns = [(actor.cooldowns || [actor.cooldown, 0])[0], (actor.cooldowns || [actor.cooldown, 0])[1]];
    actor.cooldowns = actor.cooldowns.map(value => Math.max(0, value - 1)) as [number, number];
    actor.cooldown = actor.cooldowns[0];
    if (actor.stunImmunity) {
        actor.stunImmunity--;
    }
    const notes: string[] = [];
    const effect: { actorId: string; targetId: string; action: string; moveName?: string; dodged?: boolean } = {
        actorId: actor.userId,
        targetId: target.userId,
        action,
        moveName: isSpecial(action) ? special.name : action === "strike" ? "Paw Strike" : undefined
    };
    let message = "";
    if (action === "guard") {
        const streak = actor.guardStreak || 0;
        const potential = guardShieldForStreak(streak, passive);
        const gained = Math.min(Math.max(0, SHIELD_CAP - actor.shield), potential);
        actor.shield += gained;
        actor.guardStreak = Math.min(2, streak + 1);
        // The second and subsequent consecutive Guards cannot farm Focus.
        const focusPotential = streak === 0 && gained > 0 ? BRAWL_RULES.guardFocus : 0;
        const focusGained = Math.min(FOCUS_CAP - actor.focus, focusPotential);
        actor.focus += focusGained;
        message = gained ? `${actor.petName} raised +${gained} Shield` : `${actor.petName} guarded but gained no Shield`;
        message += focusGained ? ` and +${focusGained} Focus!` : " (no Focus: Guard fatigue or full Shield)!";
    } else if (action === "focus") {
        actor.guardStreak = 0;
        // Shield has a fixed three-round lifetime instead of losing points on basic moves.
        const before = actor.focus;
        actor.focus = Math.min(FOCUS_CAP, actor.focus + BRAWL_RULES.focusGain);
        const heal = passive.kind === "focusheal" ? Math.min(actor.maxHp - actor.hp, passive.strength + 1) : 0;
        actor.hp += heal;
        message = `${actor.petName} gathered +${actor.focus - before} Focus${heal ? ` and healed ${heal} HP` : ""}!`;
    } else {
        actor.guardStreak = 0;
        // Shield has a fixed three-round lifetime instead of losing points on basic moves.
        if (isSpecial(action)) {
            actor.focus -= special.cost;
            actor.cooldowns![chosenSkillIndex] = Math.max(2, special.cooldown - (passive.kind === "quickreset" && special.kind !== "stagger" ? 1 : 0));
            actor.cooldown = actor.cooldowns![0];
            actor.specialLockout = 0; // Individual cooldowns and Focus prevent spam.
        } else {
            const earned = Math.min(FOCUS_CAP - actor.focus, BRAWL_RULES.strikeFocus + (passive.kind === "stride" ? 1 : 0));
            actor.focus += earned;
            if (earned) {
                notes.push(`+${earned} Focus`);
            }
        }
        let damage = Math.max(9, actor.attack + (action === "strike" ? 9 : 5) - Math.floor(target.defense / 2));
        if (passive.kind === "comeback" && actor.hp <= actor.maxHp / 2) {
            damage += 2 + passive.strength;
        }
        if (action === "strike" && passive.kind === "stride" && actor.speed > target.speed) {
            const speedBonus = 3 + Math.max(0, passive.strength - 2);
            damage += speedBonus;
            notes.push(`speed advantage +${speedBonus} damage`);
        }
        if (actor.weakenedRounds) {
            damage = Math.max(1, damage - 5);
            actor.weakenedRounds--;
            notes.push("weakened -5 damage");
        }
        if (actor.powerCharge) {
            damage += actor.powerCharge;
            actor.powerCharge = 0;
        }
        if (isSpecial(action)) {
            const n = special.strength;
            switch (special.kind) {
                case "burst": damage += 5 + n; break;
                case "pierce": damage += 3; break;
                case "recoil": damage += 8 + n; break;
                case "sidestep": damage += 3; break;
                case "finisher": if (target.hp < target.maxHp / 2) { damage += 6 + n; } break;
                case "rally": damage += 2; break;
                case "feint": damage += 2 + n; break;
                case "tempo": damage += 2 + n; break;
                case "ambush": damage += 3 + n; break;
                case "bloodrush": if (target.hp > target.maxHp / 2) { damage += 6 + n; } break;
                case "hex": damage += 2 + Math.floor(n / 2); break;
                case "stagger": damage += Math.floor(n / 2); break;
                case "battery": damage += Math.floor(n / 2); break;
                case "rallyguard": damage += 1; break;
                case "adaptive_dodge": damage += 3; break;
                case "shield_bash": damage += 3; break;
            }
            if (conditionMet) {
                switch (special.bonus) {
                    case "quickhit": damage += 3; notes.push("speed +3 damage"); break;
                    case "critical":
                        if (Math.random() < 0.25) { damage += 8; notes.push("critical +8 damage"); }
                        break;
                    case "revenge":
                        damage += 4;
                        notes.push("wounded revenge +4 damage");
                        break;
                    case "spark": actor.focus = Math.min(FOCUS_CAP, actor.focus + 1); notes.push("conditional +1 Focus"); break;
                    case "evasion": actor.evadeCharges = 1; notes.push("conditional evasion prepared"); break;
                    case "fortify": {
                        const gained = Math.min(SHIELD_CAP - actor.shield, 3);
                        actor.shield += gained;
                        if (gained) { notes.push(`conditional +${gained} Shield`); }
                        break;
                    }
                    case "renew": {
                        const healed = Math.min(actor.maxHp - actor.hp, 4);
                        actor.hp += healed;
                        if (healed) { notes.push(`conditional healed ${healed} HP`); }
                        break;
                    }
                    case "counter": actor.counterDamage = Math.max(actor.counterDamage || 0, 4); notes.push("conditional counter readied"); break;
                    case "shieldstrike": {
                        const bonus = Math.min(7, Math.floor(actor.shield / 3));
                        if (bonus) {
                            damage += bonus;
                            actor.shield = Math.max(0, actor.shield - Math.min(5, actor.shield));
                            notes.push(`Shield Slam +${bonus} damage, spent up to 5 Shield`);
                        }
                        break;
                    }
                    case "adaptive": {
                        actor.evadeCharges = 1;
                        actor.adaptiveDodgeUntil = (battle.roundSerial || 0) + 1;
                        notes.push("adaptive dodge ready: converts to 10 Shield if opponent Guards/Focuses");
                        break;
                    }
                    case "refund": break; // Arm after Shield is actually granted.
                    case "breaker": break; // Apply after dodge, before Shield absorbs damage.
                }
            }
            // Support effects resolve even if the enemy dodges; damage-dependent
            // drain, theft, poison and stun require the attack to actually land.
            if (special.kind === "mend" || special.kind === "cleanse" || special.kind === "fortress" || special.kind === "bulwark") {
                const heal = Math.min(actor.maxHp - actor.hp, special.kind === "mend" ? 8 + n : special.kind === "fortress" ? 3 + Math.floor(n / 2) : special.kind === "bulwark" ? 3 : 7 + n);
                actor.hp += heal;
                if (heal) { notes.push(`healed ${heal} HP`); }
                if (special.kind === "cleanse" && actor.poisonRounds) {
                    actor.poisonRounds = 0;
                    notes.push("cleansed poison");
                }
            }
            if (special.kind === "aegis" || special.kind === "riposte" || special.kind === "bulwark" || special.kind === "fortress" || special.kind === "rallyguard") {
                const shield = Math.min(SHIELD_CAP - actor.shield, special.kind === "aegis" ? 9 + n : special.kind === "bulwark" || special.kind === "fortress" ? 9 + n : special.kind === "rallyguard" ? 5 + n : 7 + n);
                actor.shield += shield;
                if (shield) { notes.push(`+${shield} Shield`); }
                if (special.kind === "riposte") {
                    actor.counterDamage = 3 + n;
                    notes.push(`counter readied (${actor.counterDamage} damage)`);
                }
            }
            if (special.kind === "sidestep" || special.kind === "ambush" || special.kind === "adaptive_dodge") {
                actor.evadeCharges = 1;
                notes.push("evasion prepared");
            }
            if (special.kind === "rally" || special.kind === "rallyguard") {
                const nextPower = special.kind === "rallyguard" ? 2 + n : 3 + n;
                actor.powerCharge = Math.max(actor.powerCharge || 0, nextPower);
                notes.push(`next attack +${nextPower} damage`);
            }
        }
        if (isSpecial(action) && targetPassive.kind === "steady") {
            damage = Math.max(1, damage - targetPassive.strength - 1);
        }
        const dodged = Math.random() < getDodge(target);
        effect.dodged = dodged;
        target.evadeCharges = 0;
        target.adaptiveDodgeUntil = 0; // Any enemy attack consumes the prepared adaptive dodge.
        const moveName = isSpecial(action) ? special.name : "Paw Strike";
        if (dodged) {
            message = `${target.petName} dodged ${actor.petName}'s ${moveName}!`;
        } else {
            const targetShieldBefore = target.shield;
            if (conditionMet && special.bonus === "breaker") {
                const broken = Math.min(target.shield, 5);
                target.shield -= broken;
                if (broken) { notes.push(`conditional broke ${broken} Shield`); }
            }
            if (isSpecial(action) && special.kind === "sunder") {
                const broken = Math.min(target.shield, 9 + special.strength);
                target.shield -= broken;
                if (broken) { notes.push(`broke ${broken} Shield`); }
            }
            // Every pet can pierce some Shield, so no breed is helpless against
            // armor. The Pierce archetype bypasses even more.
            const naturalPierce = Math.min(damage, Math.max(2, Math.ceil(damage * BRAWL_RULES.basicShieldPiercePercent / 100)));
            const extraPierce = isSpecial(action) && special.kind === "pierce" ? 7 + special.strength : 0;
            const hpBypass = Math.min(damage, naturalPierce + extraPierce);
            const blocked = Math.min(target.shield, Math.max(0, damage - hpBypass));
            target.shield -= blocked;
            rewardBrokenShield(target, targetShieldBefore, notes);
            const hpDamage = Math.max(0, damage - blocked);
            target.hp = Math.max(0, target.hp - hpDamage);
            if (isSpecial(action)) {
                if (special.kind === "siphon" || special.kind === "hex") {
                    // A locked-in opponent special is never cancelled mid-round.
                    const targetAction = battle.pendingMoves?.[target.userId];
                    const reserved = isSpecial(targetAction) ? specialFor(target, targetAction).cost : 0;
                    const stolen = Math.min(special.kind === "hex" ? 1 : Math.min(2, 1 + Math.floor(special.strength / 3)), Math.max(0, target.focus - reserved), FOCUS_CAP - actor.focus);
                    target.focus -= stolen;
                    actor.focus += stolen;
                    if (stolen) { notes.push(`stole ${stolen} Focus`); }
                }
                if (special.kind === "battery") {
                    const gain = Math.min(FOCUS_CAP - actor.focus, 2);
                    actor.focus += gain;
                    if (gain) { notes.push(`recovered ${gain} Focus`); }
                }
                if (special.kind === "drain") {
                    const heal = Math.min(actor.maxHp - actor.hp, 7 + special.strength, Math.ceil(hpDamage * 0.4));
                    actor.hp += heal;
                    if (heal) { notes.push(`drained ${heal} HP`); }
                }
                if (special.kind === "venom") {
                    target.poisonRounds = Math.max(2, target.poisonRounds || 0);
                    target.poisonDamage = Math.max(target.poisonDamage || 5, 5 + Math.floor((special.strength - 2) / 2));
                    notes.push(`poisoned for 2 rounds (${target.poisonDamage} HP/round)`);
                }
                if (special.kind === "stagger") {
                    if (!target.stunnedRounds && !target.stunImmunity) {
                        target.stunnedRounds = 1;
                        target.stunEffectiveRound = (battle.roundSerial || 0) + 1;
                        notes.push("stunned next round");
                    } else {
                        notes.push("enemy resisted stun (temporary immunity)");
                    }
                }
                if (special.kind === "feint" || special.kind === "hex") {
                    target.weakenedRounds = 1;
                    notes.push("weakened next attack by 5");
                }
            }
            if (action === "strike" && passive.kind === "leech" && hpDamage > 0) {
                const healed = Math.min(actor.maxHp - actor.hp, passive.strength);
                actor.hp += healed;
                if (healed) { notes.push(`healed ${healed} HP`); }
            }
            if (targetPassive.kind === "thorns" && blocked > 0) {
                actor.hp = Math.max(1, actor.hp - targetPassive.strength - 1);
                notes.push(`${target.petName} reflected damage`);
            }
            if (target.counterDamage) {
                actor.hp = Math.max(1, actor.hp - target.counterDamage);
                notes.push(`${target.petName} counterattacked for ${target.counterDamage}`);
                target.counterDamage = 0;
            }
            if (targetPassive.kind === "resolve" && hpDamage > 0) {
                target.focus = Math.min(FOCUS_CAP, target.focus + 1);
            }
            if (targetPassive.kind === "laststand" && !target.lastStandUsed && target.hp <= target.maxHp * 0.35) {
                // A true one-time Last Stand can rescue a lethal direct hit.
                // Poison or end-of-round pressure can still finish the pet.
                if (target.hp <= 0) {
                    target.hp = 1;
                    notes.push(`${target.petName} survived with 1 HP`);
                }
                const gained = Math.min(SHIELD_CAP - target.shield, 5 + targetPassive.strength);
                target.shield += gained;
                if (gained) { markNewShield(target, battle.roundSerial || 0); target.shieldBreakRefund = 0; }
                target.lastStandUsed = true;
                if (gained) { notes.push(`${target.petName}'s Last Hope +${gained} Shield`); }
            }
            message = `${actor.petName} used ${moveName} for ${hpDamage} HP damage${blocked ? ` (${blocked} blocked)` : ""}!`;
        }
        if (isSpecial(action) && special.kind === "recoil") {
            actor.hp = Math.max(1, actor.hp - 5);
            notes.push("5 recoil HP");
        }
    }
    if (actor.shield > actorShieldBefore) {
        markNewShield(actor, battle.roundSerial || 0);
        if (isSpecial(action) && conditionMet && special.bonus === "refund") {
            actor.shieldBreakRefund = Math.max(actor.shieldBreakRefund || 0, BRAWL_RULES.shieldBreakFocusReward);
            notes.push(`+${BRAWL_RULES.shieldBreakFocusReward} Focus if this Shield breaks before expiring`);
        } else {
            // A newly raised non-special barrier cannot inherit an old reward.
            actor.shieldBreakRefund = 0;
        }
    }
    if (notes.length) { message += ` (${notes.join("; ")})`; }
    // Visual numbers are calculated from the SAME resolved server state as the HP bars.
    // That keeps Shield absorption, dodges, thorns, counters and heals truthful.
    const visualChanges: BattleVisualChange[] = [];
    for (const old of visualBefore) {
        const current = battle.players.find(pet => pet.userId === old.userId)!;
        const hpDiff = current.hp - old.hp;
        const shieldDiff = current.shield - old.shield;
        const focusDiff = current.focus - old.focus;
        if (hpDiff < 0) {
            const selfDamage = old.userId === actor.userId;
            visualChanges.push({
                targetId: old.userId,
                kind: selfDamage ? (isSpecial(action) && special.kind === "recoil" ? "recoil" : "counter") : "damage",
                amount: -hpDiff
            });
        } else if (hpDiff > 0) {
            visualChanges.push({ targetId: old.userId, kind: "heal", amount: hpDiff });
        }
        if (shieldDiff !== 0) {
            visualChanges.push({ targetId: old.userId, kind: "shield", amount: shieldDiff });
        }
        if (focusDiff > 0 && (action === "strike" || action === "guard" || action === "focus" || old.userId !== actor.userId)) {
            visualChanges.push({ targetId: old.userId, kind: "focus", amount: focusDiff });
        } else if (focusDiff < 0 && old.userId !== actor.userId) {
            visualChanges.push({ targetId: old.userId, kind: "focus", amount: focusDiff });
        }
    }
    if (effect.dodged) {
        visualChanges.push({ targetId: target.userId, kind: "status", label: "DODGED" });
    }
    if (notes.some(note => note.includes("critical"))) {
        visualChanges.push({ targetId: target.userId, kind: "status", label: "CRITICAL!" });
    }
    if (notes.some(note => note.includes("stunned next round"))) {
        visualChanges.push({ targetId: target.userId, kind: "status", label: "STUNNED" });
    }
    if (notes.some(note => note.includes("poisoned for"))) {
        visualChanges.push({ targetId: target.userId, kind: "status", label: "POISONED" });
    }
    battle.lastRoundEffects = [...(battle.lastRoundEffects || []), {
        ...effect,
        visualChanges,
        playersAfter: structuredClone(battle.players)
    }];
    battle.log = [...battle.log, message].slice(-12);
    battle.turns++;
}

// A round stays private until both players choose or the shared timer expires.
// Missing moves are skipped, never replaced with an automatic attack.
/*
 * DOCU: Resolve player actions and effects for the current battle round.
 * @param {DbClient} client - client value used by this function
 * @param {any} row - row value used by this function
 * @param {Battle} battle - battle value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export async function resolveRound(client: DbClient, row: any, battle: Battle) {
    const pending = battle.pendingMoves || {};
    battle.roundStartMoves = { ...pending };
    battle.players.forEach(normalizePlayer);
    for (const pet of battle.players) {
        if (pet.shield > 0 && !pet.shieldExpiresRound) { pet.shieldExpiresRound = (battle.roundSerial || 0) + BRAWL_RULES.shieldDurationRounds; }
    }
    battle.focusCap = FOCUS_CAP;
    battle.roundStartPlayers = structuredClone(battle.players);
    battle.lastRoundEffects = [];
    battle.roundSerial = (battle.roundSerial || 0) + 1;
    const [first, second] = [...battle.players].sort((a, b) => b.speed - a.speed || (a.userId < b.userId ? -1 : 1));
    const actions = [first, second];
    for (const actor of actions) {
        if (!alive(battle)) {
            break;
        }
        const target = battle.players.find(p => p.userId !== actor.userId)!;
        const selectedMove = pending[actor.userId];
        if (actor.stunnedRounds && (actor.stunEffectiveRound || 0) <= (battle.roundSerial || 0)) {
            actor.stunnedRounds--;
            actor.stunEffectiveRound = 0;
            actor.stunImmunity = 3;
            if (actor.cooldowns) {
                actor.cooldowns = actor.cooldowns.map(value => Math.max(0, value - 1)) as [number, number];
                actor.cooldown = actor.cooldowns[0];
            }
            actor.specialLockout = 0;
            battle.turns++;
            battle.log = [...battle.log, `${actor.petName} is stunned and misses this round (stun immunity gained)!`].slice(-12);
            battle.lastRoundEffects.push({
                actorId: actor.userId, targetId: target.userId, action: "stunned",
                playersAfter: structuredClone(battle.players)
            });
        } else if (selectedMove) {
            // A resolved action no longer needs its reserved Focus; only future
            // locked specials are protected from the other player's Focus drain.
            delete pending[actor.userId];
            applyMove(battle, actor, target, selectedMove);
        } else {
            battle.log = [...battle.log, `${actor.petName} did not choose a move and skipped this round.`].slice(-12);
        }
    }
    const endRoundChanges: BattleVisualChange[] = [];
    // A faster pet can prepare an adaptive dodge. If the opponent chose a non-
    // attacking action, trade that prepared dodge for Shield instead. The flag
    // survives into the next round if the opponent had already attacked before
    // the dodge was prepared; it cannot be farmed across multiple rounds.
    for (const pet of battle.players) {
        if (!pet.adaptiveDodgeUntil) { continue; }
        const opponent = battle.players.find(other => other.userId !== pet.userId)!;
        const enemyMove = (battle.roundStartMoves || {})[opponent.userId];
        if (enemyMove === "guard" || enemyMove === "focus") {
            const gained = Math.min(SHIELD_CAP - pet.shield, 10);
            pet.shield += gained;
            pet.evadeCharges = 0;
            pet.adaptiveDodgeUntil = 0;
            if (gained) {
                markNewShield(pet, battle.roundSerial || 0);
                endRoundChanges.push({ targetId: pet.userId, kind: "shield", amount: gained });
            }
            battle.log = [...battle.log, `${pet.petName} converted an unused dodge into ${gained} Shield!`].slice(-12);
        } else if ((pet.adaptiveDodgeUntil || 0) < (battle.roundSerial || 0)) {
            pet.adaptiveDodgeUntil = 0;
        }
    }
    // Shields last the creation round and the next two rounds; expiration
    // never counts as a break and never grants an on-break Focus refund.
    for (const pet of battle.players) {
        if (pet.shield > 0 && (pet.shieldExpiresRound || 0) <= (battle.roundSerial || 0)) {
            endRoundChanges.push({ targetId: pet.userId, kind: "shield", amount: -pet.shield, label: "EXPIRED" });
            pet.shield = 0;
            pet.shieldBreakRefund = 0;
            pet.shieldExpiresRound = 0;
            battle.log = [...battle.log, `${pet.petName}'s Shield expired after ${BRAWL_RULES.shieldDurationRounds} rounds.`].slice(-12);
        }
    }
    // Pressure starts in round 11; bypasses Shield to stop healing/Guard loops.
    // Poison likewise ignores Shield, but can be cleansed by a breed special.
    for (const pet of battle.players) {
        normalizePlayer(pet);
        if (pet.poisonRounds && pet.hp > 0) {
            const poisonDamage = pet.poisonDamage || 5;
            const lost = Math.min(pet.hp, poisonDamage);
            pet.hp = Math.max(0, pet.hp - poisonDamage);
            if (lost) { endRoundChanges.push({ targetId: pet.userId, kind: "poison", amount: lost }); }
            pet.poisonRounds--;
            if (!pet.poisonRounds) { pet.poisonDamage = 5; }
            battle.log = [...battle.log, `${pet.petName} took ${poisonDamage} poison damage!`].slice(-12);
        }
        const round = battle.roundSerial || 0;
        if (round >= BRAWL_RULES.pressureStartsRound && pet.hp > 0) {
            const pressure = BRAWL_RULES.pressureFirstDamage + (round - BRAWL_RULES.pressureStartsRound) * BRAWL_RULES.pressureGrowth;
            const lost = Math.min(pet.hp, pressure);
            pet.hp = Math.max(0, pet.hp - pressure);
            if (lost) { endRoundChanges.push({ targetId: pet.userId, kind: "pressure", amount: lost }); }
            battle.log = [...battle.log, `${pet.petName} lost ${pressure} HP to overtime pressure!`].slice(-12);
        }
    }
    // End-of-round poison/pressure/expiry is a distinct visual step, not a
    // second attack. Keep the previous action's HP delta and colors intact.
    if (endRoundChanges.length) {
        battle.lastRoundEffects.push({
            actorId: "round-end",
            targetId: "round-end",
            action: "round_end",
            visualChanges: endRoundChanges,
            playersAfter: structuredClone(battle.players)
        });
    }
    // Match summary is part of the battle JSON: no new DB migration needed.
    battle.matchTotals ??= {};
    for (const player of battle.players) {
        const total = battle.matchTotals[player.userId] || { damage: 0, healing: 0, shield: 0, specials: 0 };
        for (const effect of battle.lastRoundEffects || []) {
            if (effect.actorId !== player.userId) { continue; }
            total.specials += effect.action === "special" || effect.action === "special2" ? 1 : 0;
            for (const change of effect.visualChanges || []) {
                if (change.kind === "damage" || change.kind === "counter") { total.damage += Math.max(0, change.amount || 0); }
                if (change.kind === "heal") { total.healing += Math.max(0, change.amount || 0); }
                if (change.kind === "shield") { total.shield += Math.max(0, change.amount || 0); }
            }
        }
        battle.matchTotals[player.userId] = total;
    }
    battle.pendingMoves = {};
    battle.turn = first.userId; // retained for compatibility with saved battles
    battle.turnExpiresAt = new Date(Date.now() + TURN_MS).toISOString();
    const people = [row.challenger_id, row.challenged_id];
    const defeated = battle.players.find(player => player.hp <= 0);
    if (defeated || (battle.roundSerial || 0) >= BRAWL_RULES.maxRounds) {
        const winnerId = battle.players.every(player => player.hp <= 0)
            ? null
            : defeated
            ? battle.players.find(player => player.userId !== defeated.userId)!.userId
            : Math.abs(battle.players[0].hp / battle.players[0].maxHp - battle.players[1].hp / battle.players[1].maxHp) < 0.00001
                ? null
                : (battle.players[0].hp / battle.players[0].maxHp > battle.players[1].hp / battle.players[1].maxHp ? battle.players[0].userId : battle.players[1].userId);
        if (winnerId) {
            const payout = calculateArenaPayout(row.wager, 2, row.arena_fee_percent);
            await client.query("UPDATE pets SET coins=coins+$2 WHERE owner_id=$1", [winnerId, payout.payoutPerWinner]);
            await recordArenaFee(client, "classic_1v1", row.id, payout);
        } else {
            await client.query("UPDATE pets SET coins=coins+$2 WHERE owner_id=ANY($1::uuid[])", [people, row.wager]);
        }
        await client.query(`UPDATE multiplayer_challenges SET battle=$2::jsonb,status='finished',winner_id=$3,updated_at=NOW() WHERE id=$1`, [row.id, JSON.stringify(battle), winnerId]);
        await client.query(`INSERT INTO mission_events(user_id,metric,amount) SELECT unnest($1::uuid[]),'brawl',1`, [people]);
        return winnerId ? "finished" : "draw";
    }
    await client.query("UPDATE multiplayer_challenges SET battle=$2::jsonb,updated_at=NOW() WHERE id=$1", [row.id, JSON.stringify(battle)]);
    return "active";
}

/*
 * DOCU: Handle public challenge behavior for this feature.
 * @param {any} row - row value used by this function
 * @param {string} viewerId - viewerId value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function publicChallenge(row: any, viewerId: string) {
    // Never send the opponent's queued move to the browser before round resolution.
    const battle = row.battle ? {
        ...row.battle
    } : null;
    if (battle) {
        (battle.players || []).forEach(normalizePlayer);
        battle.focusCap = FOCUS_CAP;
        battle.serverNow = new Date().toISOString();
        // Rules in the challenge response let every client's move labels reflect
        // the same authoritative balance numbers as the backend and Develop panel.
        battle.rules = BRAWL_RULES;
        const pending = battle.pendingMoves || {};
        battle.myMove = pending[viewerId] || null;
        battle.readyCount = Object.keys(pending).length + battle.players.filter((player: Player) => !!player.stunnedRounds).length;
        delete battle.pendingMoves;
        delete battle.roundStartMoves;
    }
    return {
        id: row.id,
        game_id: row.game_id,
        game_name: gameNames[row.game_id] || row.game_id,
        challenger_id: row.challenger_id,
        challenged_id: row.challenged_id,
        challenger_username: row.challenger_username,
        challenged_username: row.challenged_username,
        wager: row.wager,
        arena_fee_percent: row.arena_fee_percent,
        status: row.status,
        battle,
        winner_id: row.winner_id,
        created_at: row.created_at,
        expires_at: row.expires_at,
        updated_at: row.updated_at
    };
}
const challengeSelect = `SELECT c.*, a.username AS challenger_username, b.username AS challenged_username
    FROM multiplayer_challenges c
    JOIN users a ON a.id=c.challenger_id JOIN users b ON b.id=c.challenged_id`;

/*
 * DOCU: Handle cleanup expired behavior for this feature.
 * @throws {Error} - Propagates an error when this operation cannot complete.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
async function cleanupExpired() {
    const client = await pool.connect();
    const affected: string[] = [];
    try {
        await client.query("BEGIN");
        // One transaction owns each expiry; other requests cannot pay out the same escrow twice.
        const expired = await client.query(`SELECT id, challenger_id, challenged_id, wager, status
            FROM multiplayer_challenges
            WHERE (status='pending' AND expires_at<NOW())
                OR (status='active' AND updated_at<NOW()-INTERVAL '15 minutes')
            FOR UPDATE SKIP LOCKED LIMIT 100`);
        for (const row of expired.rows) {
            const status = row.status === "pending" ? "expired" : "cancelled";
            await client.query("UPDATE multiplayer_challenges SET status=$2,updated_at=NOW() WHERE id=$1", [row.id, status]);
            await client.query("UPDATE pets SET coins=coins+$2 WHERE owner_id=$1", [row.challenger_id, row.wager]);
            if (row.status === "active") {
                await client.query("UPDATE pets SET coins=coins+$2 WHERE owner_id=$1", [row.challenged_id, row.wager]);
            }
            affected.push(row.challenger_id, row.challenged_id);
        }
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
    return affected;
}

/*
 * DOCU: Register multiplayer API routes and actions.
 * @param {Express} app - app value used by this function
 * @param {any} auth - auth value used by this function
 * @param {(users: string[], type: string) => void} publishLive - publishLive value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function registerMultiplayer(app: Express, auth: any, publishLive: (users: string[], type: string) => void) {
        /*
     * DOCU: Handle the current state for this feature.
     * @param {(req: any, res: any) => Promise<void>} fn - fn value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const handle = (fn: (req: any, res: any) => Promise<void>) => (req: any, res: any) => {
        Promise.resolve(fn(req, res)).catch(error => {
            logSafeError("Multiplayer request failed", error);
            if (!res.headersSent) {
                const migrationMissing = error?.code === "42P01" && String(error?.message || "").includes("arena_fee_ledger");
                res.status(500).json({
                    error: migrationMissing
                        ? "Paw Brawl's Arena Fee table is missing. Run database/schema.sql against the API database, then try again. No coins were transferred."
                        : "The server couldn't finish this multiplayer request. No incomplete wager payout was committed. Please retry or check the Render logs."
                });
            }
        });
    };
        /*
     * DOCU: Notify the current state for this feature.
     * @param {string[]} users - users value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const notify = (users: string[]) => publishLive(users, "multiplayer_updated");

    // Server-owned and public: the Develop gallery reads the same live rules as battles.
    app.get("/api/multiplayer/rules", (_req, res) => res.json(getPublicCombatCatalog()));

    // Sweep periodically and on reads; works even when the browser was closed.
    const timer = setInterval(() => {
        void cleanupExpired().then(users => {
            if (users.length) {
                notify(users)

            }
}).catch((error) => logSafeError("Multiplayer sweep failed", error));
    }, 60000);
    timer.unref();

    // Database-owned turn deadlines: timers keep working with both clients disconnected.
    const turnTimer = setInterval(async () => {
        const client = await pool.connect();
        const affected: string[] = [];
        try {
            await client.query("BEGIN");
            const q = await client.query(`SELECT * FROM multiplayer_challenges WHERE status='active'
                AND (battle->>'turnExpiresAt') IS NOT NULL
                AND (battle->>'turnExpiresAt')::timestamptz <= NOW()
                FOR UPDATE SKIP LOCKED LIMIT 40`);
            for (const row of q.rows) {
                const battle = row.battle as Battle;
                if (!alive(battle)) {
                    continue;
                }
                await resolveRound(client, row, battle);
                affected.push(row.challenger_id, row.challenged_id);
            }
            await client.query("COMMIT");
            if (affected.length) {
                notify([...new Set(affected)]);
            }
        } catch (error) {
            await client.query("ROLLBACK");
            logSafeError("Paw Brawl turn timeout failed", error)
        } finally {
            client.release()
        }
    }, 2000);
    turnTimer.unref();


    // If the hosting instance was sleeping when the periodic timeout tick should
    // have fired, the first returning player can still advance an expired round.
    // FOR UPDATE SKIP LOCKED prevents racing the regular timer or another request.
        /*
     * DOCU: Handle catch up expired round behavior for this feature.
     * @param {string} userId - userId value used by this function
     * @returns {Promise<string[]>} - Result returned by this function.
     * @throws {Error} - Propagates an error when this operation cannot complete.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
async function catchUpExpiredRound(userId: string): Promise<string[]> {
        const client = await pool.connect();
        const affected: string[] = [];
        try {
            await client.query("BEGIN");
            const q = await client.query(`SELECT * FROM multiplayer_challenges
                WHERE status='active' AND (challenger_id=$1 OR challenged_id=$1)
                    AND (battle->>'turnExpiresAt') IS NOT NULL
                    AND (battle->>'turnExpiresAt')::timestamptz <= NOW()
                FOR UPDATE SKIP LOCKED`, [userId]);
            for (const row of q.rows) {
                if (row.battle && alive(row.battle as Battle)) {
                    await resolveRound(client, row, row.battle as Battle);
                    affected.push(row.challenger_id, row.challenged_id);
                }
            }
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
        return affected;
    }

    app.get("/api/multiplayer/challenges", auth, handle(async (req, res) => {
        const changed = [...await cleanupExpired(), ...await catchUpExpiredRound(req.userId)];
        if (changed.length) {
            notify(changed);
        }
        const query = await pool.query(`${challengeSelect}
            WHERE c.challenger_id=$1 OR c.challenged_id=$1
            ORDER BY CASE WHEN c.status IN ('pending','active') THEN 0 ELSE 1 END,
                    c.created_at DESC LIMIT 30`, [req.userId]);
        res.json(query.rows.map((row: any) => publicChallenge(row, req.userId)));
    }));

    app.post("/api/multiplayer/challenges", auth, handle(async (req, res) => {
        const input = challengeInput.safeParse(req.body);
        if (!input.success) {
            res.status(400).json({
                error: "Choose a real friend and a whole-number wager from 0 to 1,000,000."
            });
            return
        }
        const { friendId, gameId, wager } = input.data;
        if (friendId === req.userId) {
            res.status(400).json({
                error: "You cannot challenge yourself."
            });
            return
        }
        const client = await pool.connect();
        let status = 201;
        let error = "";
        let id = "";
        try {
            await client.query("BEGIN");
            // Guard against concurrent creation from multiple tabs/servers.
            const keys = [req.userId, friendId].sort();
            for (const key of keys) {
                await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [key]);
            }
            const friends = await client.query(`SELECT 1 FROM friendships WHERE status='accepted'
                AND ((requester_id=$1 AND recipient_id=$2) OR (requester_id=$2 AND recipient_id=$1))`, [req.userId, friendId]);
            if (!friends.rowCount) {
                status = 403;
                error = "Only accepted PawPal friends can be challenged."
            }
            if (!error) {
                const occupied = await client.query(`SELECT 1 FROM multiplayer_challenges
                    WHERE status IN ('pending','active') AND
                    (challenger_id=ANY($1::uuid[]) OR challenged_id=ANY($1::uuid[])) LIMIT 1`, [[req.userId, friendId]]);
                if (occupied.rowCount) {
                    status = 409;
                    error = "You or your friend already has an open challenge or battle."
                }
            }
            if (!error) {
                const inDuo = await client.query(`SELECT 1 FROM duo_rooms WHERE status IN ('lobby','active')
                    AND (participants @> $1::jsonb OR participants @> $2::jsonb) LIMIT 1`,
                    [JSON.stringify([{ userId: req.userId }]), JSON.stringify([{ userId: friendId }])]);
                if (inDuo.rowCount) {
                    status = 409;
                    error = "Finish your Duo Clash room before starting Classic Paw Brawl.";
                }
            }
            if (!error) {
                // All wagered battles require BOTH players to have a Level 10+ pet.
                // Free (0-coin) matches are open to players of every level.
                const levels = await client.query(`SELECT owner_id, level FROM pets
                    WHERE owner_id=ANY($1::uuid[]) FOR UPDATE`, [[req.userId, friendId]]);
                if (levels.rows.length !== 2) {
                    status = 400;
                    error = "Both players must have an adopted pet.";
                } else if (wager > 0 && levels.rows.some((pet: any) => Number(pet.level) < 10)) {
                    status = 403;
                    error = "Wagered matches require both players to be Level 10 or higher. Choose Free to play at any level.";
                }
            }
            if (!error) {
                const paid = await client.query("UPDATE pets SET coins=coins-$2 WHERE owner_id=$1 AND coins >= $2 RETURNING id", [req.userId, wager]);
                if (!paid.rowCount) {
                    status = 400;
                    error = "You do not have enough Paw Coins for that wager."
                }
            }
            if (!error) {
                id = randomUUID();
                await client.query(`INSERT INTO multiplayer_challenges (id,game_id,challenger_id,challenged_id,wager)
                    VALUES ($1,$2,$3,$4,$5)`, [id, gameId, req.userId, friendId, wager]);
            }
            if (error) {
                await client.query("ROLLBACK");
            } else {
                await client.query("COMMIT");
            }
        } catch (e) {
            await client.query("ROLLBACK");
            throw e
        } finally {
            client.release()
        }
        if (error) {
            res.status(status).json({
                error
            });
            return
        }
        notify([req.userId, friendId]);
        res.status(201).json({
            id,
            message: "Paw Brawl challenge sent! Your wager is safely reserved."
        });
    }));

    app.post("/api/multiplayer/challenges/:id/respond", auth, handle(async (req, res) => {
        if (!validId.safeParse(req.params.id).success || !["accept", "decline", "cancel"].includes(req.body?.action)) {
            res.status(400).json({
                error: "Invalid challenge action."
            });
            return;
        }
        const action = req.body.action as "accept" | "decline" | "cancel";
        const client = await pool.connect();
        let error = "";
        let status = 400;
        let people: string[] = [];
        try {
            await client.query("BEGIN");
            const found = await client.query("SELECT * FROM multiplayer_challenges WHERE id=$1 FOR UPDATE", [req.params.id]);
            const row = found.rows[0];
            if (!row) {
                status = 404;
                error = "Challenge not found."
            } else if (row.status !== "pending") {
                status = 409;
                error = "That challenge is no longer pending."
            } else if (action === "cancel" && row.challenger_id !== req.userId || action !== "cancel" && row.challenged_id !== req.userId) {
                status = 403;
                error = "This challenge is not addressed to you.";
            } else if (new Date(row.expires_at).getTime() <= Date.now()) {
                status = 409;
                error = "That challenge expired. Refresh the page.";
            } else {
                people = [row.challenger_id, row.challenged_id];
                if (action !== "accept") {
                    await client.query("UPDATE pets SET coins=coins+$2 WHERE owner_id=$1", [row.challenger_id, row.wager]);
                    await client.query("UPDATE multiplayer_challenges SET status=$2,updated_at=NOW() WHERE id=$1", [row.id, action === "cancel" ? "cancelled" : "declined"]);
                } else {
                    const inDuo = await client.query(`SELECT 1 FROM duo_rooms WHERE status IN ('lobby','active')
                        AND (participants @> $1::jsonb OR participants @> $2::jsonb) LIMIT 1`,
                        [JSON.stringify([{ userId: row.challenger_id }]), JSON.stringify([{ userId: row.challenged_id }])]);
                    if (inDuo.rowCount) {
                        error = "A player is already in Duo Clash. Decline or cancel this invitation.";
                    }
                    if (!error && row.wager > 0) {
                        const levels = await client.query(`SELECT owner_id, level FROM pets
                            WHERE owner_id=ANY($1::uuid[]) FOR UPDATE`, [people]);
                        if (levels.rows.length !== 2 || levels.rows.some((pet: any) => Number(pet.level) < 10)) {
                            error = "Both players must be Level 10 or higher to play a wagered match. Decline this challenge to receive a full refund.";
                        }
                    }
                    if (!error) {
                    const paid = await client.query("UPDATE pets SET coins=coins-$2 WHERE owner_id=$1 AND coins >= $2 RETURNING id", [row.challenged_id, row.wager]);
                    if (!paid.rowCount) {
                        error = "You need enough Paw Coins to match the wager."
                    } else {
                        const p = await client.query(`SELECT p.owner_id, p.name, p.species, p.breed, p.color, u.username
                            FROM pets p JOIN users u ON u.id=p.owner_id WHERE p.owner_id = ANY($1::uuid[])`, [people]);
                        const first = p.rows.find((entry: any) => entry.owner_id === row.challenger_id);
                        const second = p.rows.find((entry: any) => entry.owner_id === row.challenged_id);
                        if (!first || !second) {
                            error = "Both players must have adopted pets."
                        } else {
                            const players: [Player, Player] = [
                                makePlayer(row.challenger_id, first.username, first),
                                makePlayer(row.challenged_id, second.username, second)
                            ];
                            const turn = players[0].speed >= players[1].speed ? players[0].userId : players[1].userId;
                            const battle: Battle = {
                                players,
                                focusCap: FOCUS_CAP,
                                turn,
                                turns: 0,
                                pendingMoves: {},
                                turnExpiresAt: new Date(Date.now() + TURN_MS).toISOString(),
                                log: [`${players.find(p => p.userId === turn)?.petName} moves first!`]
                            };
                            await client.query(`UPDATE multiplayer_challenges SET status='active',battle=$2::jsonb,updated_at=NOW() WHERE id=$1`, [row.id, JSON.stringify(battle)]);
                        }
                    }
                    }
                }
            }
            if (error) {
                await client.query("ROLLBACK");
            } else {
                await client.query("COMMIT");
            }
        } catch (e) {
            await client.query("ROLLBACK");
            throw e
        } finally {
            client.release()
        }
        if (error) {
            res.status(status).json({
                error
            });
            return
        }
        notify(people);
        res.json({
            message: action === "accept" ? "Battle started!" : action === "decline" ? "Challenge declined. Wager refunded." : "Challenge cancelled. Wager refunded."
        });
    }));

    app.post("/api/multiplayer/challenges/:id/move", auth, handle(async (req, res) => {
        const input = actionInput.safeParse(req.body);
        if (!validId.safeParse(req.params.id).success || !input.success) {
            res.status(400).json({
                error: "Choose a valid battle move."
            });
            return;
        }
        const client = await pool.connect();
        let error = "";
        let status = 409;
        let players: string[] = [];
        let outcome = "active";
        try {
            await client.query("BEGIN");
            const found = await client.query("SELECT * FROM multiplayer_challenges WHERE id=$1 FOR UPDATE", [req.params.id]);
            const row = found.rows[0];
            if (!row || ![row.challenger_id, row.challenged_id].includes(req.userId)) {
                status = 404;
                error = "Battle not found."
            } else if (row.status !== "active") {
                error = "That battle has already ended.";
            } else {
                const battle = row.battle as Battle;
                const pending = battle.pendingMoves || {};
                if (pending[req.userId]) {
                    error = "Your move is already locked in for this round.";
                } else if (!alive(battle)) {
                    error = "Battle already completed.";
                } else if (new Date(battle.turnExpiresAt).getTime() <= Date.now()) {
                    error = "This round has expired. Any player who did not choose a move skips the round.";
                } else if (battle.players.find(player => player.userId === req.userId)!.stunnedRounds) {
                    error = "Your pet is stunned this round. You will automatically skip and gain stun immunity.";
                } else if (isSpecial(input.data.action) && (() => {
                    const pet = battle.players.find(player => player.userId === req.userId)!;
                    normalizePlayer(pet);
                    const skillIndex = input.data.action === "special2" ? 1 : 0;
                    const skill = pet.specials![skillIndex];
                    return pet.focus < skill.cost || (pet.cooldowns?.[skillIndex] || 0) > 0;
                })()) {
                    error = "Not enough Focus or that special is still on cooldown.";
                } else {
                    pending[req.userId] = input.data.action;
                    battle.pendingMoves = pending;
                    if (Object.keys(pending).length + battle.players.filter(player => !!player.stunnedRounds).length >= 2) {
                        outcome = await resolveRound(client, row, battle);
                    } else {
                        await client.query("UPDATE multiplayer_challenges SET battle=$2::jsonb,updated_at=NOW() WHERE id=$1", [row.id, JSON.stringify(battle)]);
                    }
                    players = [row.challenger_id, row.challenged_id];
                }
            }
            if (error) {
                await client.query("ROLLBACK");
            } else {
                await client.query("COMMIT");
            }
        } catch (e) {
            await client.query("ROLLBACK");
            throw e
        } finally {
            client.release()
        }
        if (error) {
            res.status(status).json({
                error
            });
            return
        }
        notify(players);
        res.json({
            message: outcome === "draw" ? "Draw! Both wagers refunded." : outcome === "finished" ? "Battle over! Winner paid." : outcome === "active" ? "Move locked in! The round resolves when both players choose." : "Move submitted!"
        });
    }));

    app.post("/api/multiplayer/challenges/:id/forfeit", auth, handle(async (req, res) => {
        if (!validId.safeParse(req.params.id).success) {
            res.status(400).json({
                error: "Invalid battle."
            });
            return
        }
        const client = await pool.connect();
        let people: string[] = [];
        let error = "";
        try {
            await client.query("BEGIN");
            const q = await client.query("SELECT * FROM multiplayer_challenges WHERE id=$1 FOR UPDATE", [req.params.id]);
            const row = q.rows[0];
            if (!row || ![row.challenger_id, row.challenged_id].includes(req.userId)) {
                error = "Battle not found or you aren't a participant.";
            } else if (row.status === "finished") {
                // Safe, idempotent response if the original request committed but its response was lost.
                people = [row.challenger_id, row.challenged_id];
            } else if (row.status !== "active") {
                error = "That battle is no longer active. Refresh to see its result.";
            } else {
                const winnerId = row.challenger_id === req.userId ? row.challenged_id : row.challenger_id;
                people = [row.challenger_id, row.challenged_id];
                const payout = calculateArenaPayout(row.wager, 2, row.arena_fee_percent);
                await client.query("UPDATE pets SET coins=coins+$2 WHERE owner_id=$1", [winnerId, payout.payoutPerWinner]);
                await recordArenaFee(client, "classic_1v1", row.id, payout);
                await client.query(`UPDATE multiplayer_challenges SET status='finished',winner_id=$2,updated_at=NOW() WHERE id=$1`, [row.id, winnerId]);
            }
            if (error) {
                await client.query("ROLLBACK");
            } else {
                await client.query("COMMIT");
            }
        } catch (e) {
            await client.query("ROLLBACK");
            throw e
        } finally {
            client.release()
        }
        if (error) {
            res.status(409).json({
                error
            });
            return
        }
        notify(people);
        res.json({
            message: "Match result saved. Refresh your battle to see the final outcome."
        });
    }));
}
