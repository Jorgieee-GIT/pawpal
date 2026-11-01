import assert from "node:assert/strict";
import { BRAWL_RULES } from "../src/brawlAbilities.js";
import type { Battle, BattleVisualChange } from "../src/multiplayer.js";

process.env.DATABASE_URL ??= "postgresql://unit:unit@127.0.0.1:5432/pawpal_test";
const { makePlayer, resolveRound } = await import("../src/multiplayer.js");
const fakeDb = { query: async () => ({ rows: [], rowCount: 1 }) };
const mk = (id: string, species: string, breed = "classic") => makePlayer(id, id, { species, breed, name: id, color: "classic" });
const duel = (a: ReturnType<typeof mk>, b: ReturnType<typeof mk>): Battle => ({
    players: [a, b],
    turn: a.userId,
    turns: 0,
    roundSerial: 0,
    turnExpiresAt: new Date(Date.now() + 30000).toISOString(),
    pendingMoves: {},
    log: []
});
async function round(battle: Battle, a: "strike" | "guard" | "focus" | "special" | "special2", b: "strike" | "guard" | "focus" | "special" | "special2") {
    battle.pendingMoves = {
        [battle.players[0].userId]: a,
        [battle.players[1].userId]: b
    };
    await resolveRound(fakeDb, {
        id: "visual-check", challenger_id: battle.players[0].userId, challenged_id: battle.players[1].userId, wager: 1
    }, battle);
    return battle.lastRoundEffects || [];
}
const has = (list: BattleVisualChange[] | undefined, targetId: string, kind: BattleVisualChange["kind"], amount?: number) =>
    !!list?.find(change => change.targetId === targetId && change.kind === kind && (amount === undefined || change.amount === amount));
const previousRandom = Math.random;
try {
    Math.random = () => 0.99;
    const cat = mk("cat", "cat");
    const dog = mk("dog", "dog");
    const strike = duel(cat, dog);
    const hit = (await round(strike, "strike", "focus")).find(change => change.actorId === "cat");
    assert.ok(has(hit?.visualChanges, "dog", "damage", dog.maxHp - dog.hp), "actual HP damage must appear in red");
    assert.ok(has(hit?.visualChanges, "cat", "focus", 1), "Paw Strike must show earned Focus");

    const guard = duel(mk("guard", "dog"), mk("observer", "fox"));
    const guardStep = (await round(guard, "guard", "focus")).find(change => change.actorId === "guard");
    const shieldRaised = guard.players[0].shield;
    assert.ok(shieldRaised >= BRAWL_RULES.guardShield);
    assert.ok(has(guardStep?.visualChanges, "guard", "shield", shieldRaised), "new Shield must appear in blue");
    assert.ok(has(guardStep?.visualChanges, "guard", "focus", 1));
    await round(guard, "focus", "focus");
    assert.equal(guard.players[0].shield, shieldRaised, "Shield survives the second round");
    await round(guard, "focus", "focus");
    const expired = guard.lastRoundEffects?.find(change => change.action === "round_end");
    assert.ok(has(expired?.visualChanges, "guard", "shield", -shieldRaised), "Shield expiry should not look like HP damage");

    const healer = mk("healer", "axolotl");
    const bystander = mk("bystander", "dog");
    healer.hp -= 30;
    const healMatch = duel(healer, bystander);
    const beforeHeal = healer.hp;
    const heals = (await round(healMatch, "focus", "focus")).find(change => change.actorId === "healer");
    assert.ok(has(heals?.visualChanges, "healer", "heal", healer.hp - beforeHeal), "healing must be a separate green number");

    const venom = mk("venom", "cat", "tabby");
    const victim = mk("victim", "dog");
    venom.focus = 8;
    const poisonMatch = duel(venom, victim);
    const poisonEvents = await round(poisonMatch, "special", "guard");
    const poisonTick = poisonEvents.find(change => change.action === "round_end");
    assert.ok(has(poisonTick?.visualChanges, "victim", "poison", victim.poisonDamage || 5), "poison tick must be violet, not red");
    assert.ok(poisonEvents.find(change => change.actorId === "venom")?.visualChanges?.some(change => change.kind === "status" && change.label === "POISONED"));

    const panda = mk("panda", "panda");
    const attacker = mk("attacker", "cat");
    panda.focus = 8;
    const counterMatch = duel(panda, attacker);
    await round(counterMatch, "special", "focus");
    const counterEvents = await round(counterMatch, "focus", "strike");
    assert.ok(counterEvents.some(step => has(step.visualChanges, "attacker", "counter")), "counter damage should be labeled separately");

    for (const event of [hit, guardStep, heals, poisonTick, ...counterEvents]) {
        assert.ok(!event?.visualChanges?.some(change => typeof change.amount === "number" && (!Number.isFinite(change.amount) || change.amount === 0)));
    }
    console.log("Paw Brawl 2.5 visual events passed: hit damage, Focus, Shield gain/expiry, heals, violet poison ticks and counters.");
} finally {
    Math.random = previousRandom;
}
