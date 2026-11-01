/**
 * Reproducible, lightweight 1v1 balance smoke test. This is NOT a substitute
 * for matches played by people with different strategies.
 * Run with: npm run test:brawl:balance
 */
import assert from "node:assert/strict";
import { BREED_LIST } from "../src/brawlAbilities.js";

process.env.DATABASE_URL ??= "postgresql://unit:unit@127.0.0.1:5432/pawpal_test";
const { makePlayer, resolveRound } = await import("../src/multiplayer.js");

const seedSpecies = Object.keys(BREED_LIST);
const perMatchup = 30;
const results: Record<string, { wins: number; losses: number; draws: number }> = {};
const db = { query: async () => ({ rows: [], rowCount: 1 }) };
let seed = 142857;
const originalRandom = Math.random;

function chooseMove(me: ReturnType<typeof makePlayer>, opponent: ReturnType<typeof makePlayer>) {
    if (me.stunnedRounds) {
        return undefined;
    }
    // Pick based on build and conditional triggers, not on the old slot-first/slot-last rule.
    const prefersDefense = me.shield > 6 || me.hp < me.maxHp * 0.55;
    const preferred = prefersDefense ? 1 : 0;
    for (const slot of [preferred, 1 - preferred]) {
        const skill = me.specials?.[slot];
        if (skill && me.focus >= skill.cost && !me.specialLockout && !(me.cooldowns?.[slot])) {
            return slot === 0 ? "special" : "special2";
        }
    }
    if (me.focus < 5 && me.shield < 14 && me.hp < me.maxHp * 0.6 && !me.guardStreak && Math.random() < 0.1) {
        return "guard";
    }
    if (me.focus < 4 && Math.random() < 0.55) {
        return "focus";
    }
    return "strike";
}

try {
    // 32-bit seeded generator keeps these tests reproducible across machines.
    Math.random = () => {
        seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    for (const species of seedSpecies) {
        results[species] = { wins: 0, losses: 0, draws: 0 };
        for (const opponentSpecies of seedSpecies) {
            for (let i = 0; i < perMatchup; i++) {
                const one = makePlayer("a", "a", {
                    species, breed: BREED_LIST[species][i % 11], name: "One", color: "classic"
                });
                const two = makePlayer("b", "b", {
                    species: opponentSpecies,
                    breed: BREED_LIST[opponentSpecies][(i * 7 + 1) % 11],
                    name: "Two", color: "classic"
                });
                const battle = {
                    players: [one, two] as [typeof one, typeof two],
                    turn: "a", turns: 0, roundSerial: 0,
                    turnExpiresAt: new Date(Date.now() + 30000).toISOString(),
                    pendingMoves: {} as Record<string, "strike" | "guard" | "focus" | "special" | "special2">,
                    log: [] as string[]
                };
                for (let round = 0; round < 18; round++) {
                    const first = chooseMove(one, two);
                    const second = chooseMove(two, one);
                    battle.pendingMoves = {};
                    if (first) { battle.pendingMoves.a = first; }
                    if (second) { battle.pendingMoves.b = second; }
                    const outcome = await resolveRound(db, {
                        id: "simulation", challenger_id: "a", challenged_id: "b", wager: 5
                    }, battle);
                    for (const fighter of [one, two]) {
                        assert.ok(fighter.focus >= 0 && fighter.focus <= 8);
                        assert.ok(fighter.shield >= 0 && fighter.shield <= 34);
                        assert.ok(fighter.hp >= 0 && fighter.hp <= fighter.maxHp);
                    }
                    if (outcome !== "active") { break; }
                }
                const aRatio = one.hp / one.maxHp;
                const bRatio = two.hp / two.maxHp;
                if (aRatio > bRatio) {
                    results[species].wins++;
                } else if (bRatio > aRatio) {
                    results[species].losses++;
                } else {
                    results[species].draws++;
                }
            }
        }
    }
    console.log("Paw Brawl strategy simulation (30 matches per 8x8 species pair):");
    for (const [species, result] of Object.entries(results)) {
        const winRate = result.wins / (seedSpecies.length * perMatchup);
        console.log(`${species}: ${result.wins} wins, ${result.losses} losses, ${result.draws} ties (${Math.round(winRate * 100)}% wins)`);
        // Smoke-test band for this deterministic strategy, not a promise of
        // equal live win rates. Catch extreme tank/fast-pet regressions.
        assert.ok(winRate >= 0.35 && winRate <= 0.65, `${species} may need a closer balance review`);
    }
} finally {
    Math.random = originalRandom;
}
