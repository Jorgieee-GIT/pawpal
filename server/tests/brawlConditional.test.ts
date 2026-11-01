import assert from "node:assert/strict";
import { BREED_LIST, FOCUS_CAP, SHIELD_CAP, getCombatKit } from "../src/brawlAbilities.js";

process.env.DATABASE_URL ??= "postgresql://unit:unit@127.0.0.1:5432/pawpal_test";
const { applyMove, makePlayer, resolveRound } = await import("../src/multiplayer.js");
const fakeDb = { query: async () => ({ rows: [], rowCount: 1 }) };
const previousRandom = Math.random;
const make = (id: string, species: string, breed = "classic") => makePlayer(id, id, { species, breed, name: id, color: "default" });
function duel(first: ReturnType<typeof make>, second: ReturnType<typeof make>) {
    return {
        players: [first, second] as [typeof first, typeof second],
        turn: first.userId,
        turns: 0,
        roundSerial: 0,
        turnExpiresAt: new Date(Date.now() + 30000).toISOString(),
        pendingMoves: {} as Record<string, "strike" | "guard" | "focus" | "special" | "special2">,
        log: [] as string[]
    };
}
async function round(battle: ReturnType<typeof duel>, firstAction: "strike" | "guard" | "focus" | "special" | "special2", secondAction: "strike" | "guard" | "focus" | "special" | "special2") {
    battle.pendingMoves = {
        [battle.players[0].userId]: firstAction,
        [battle.players[1].userId]: secondAction
    };
    return resolveRound(fakeDb, {
        id: "test", challenger_id: battle.players[0].userId,
        challenged_id: battle.players[1].userId, wager: 1
    }, battle);
}
try {
    Math.random = () => 0.99;
    let breeds = 0;
    const skillNames = new Set<string>();
    for (const [species, entries] of Object.entries(BREED_LIST)) {
        for (const breed of entries) {
            const kit = getCombatKit(species, breed);
            assert.equal(kit.specials.length, 2);
            for (const special of kit.specials) {
                assert.ok(special.trigger && special.bonus);
                assert.ok(special.cost >= 4 && special.cost <= FOCUS_CAP);
                assert.ok(!skillNames.has(special.name));
                skillNames.add(special.name);
                assert.ok(!special.description.includes("FIRST-move"));
                assert.ok(!special.description.includes("LAST-move"));
            }
            breeds++;
        }
    }
    assert.equal(breeds, 88);
    assert.equal(skillNames.size, 176);

    const bunny = make("fast-bunny", "bunny");
    const slow = make("slow-bunny", "bunny");
    bunny.speed = slow.speed + 2;
    bunny.focus = 8;
    const fastDuel = duel(bunny, slow);
    applyMove(fastDuel, bunny, slow, "special");
    assert.ok(fastDuel.log.some(line => line.includes("speed +3")));
    const tiedOne = make("tied-one", "bunny");
    const tiedTwo = make("tied-two", "bunny");
    tiedOne.focus = 8;
    const equalDuel = duel(tiedOne, tiedTwo);
    applyMove(equalDuel, tiedOne, tiedTwo, "special");
    assert.ok(!equalDuel.log.some(line => line.includes("speed +3")));

    const nimble = make("nimble", "bunny");
    const blocker = make("blocker", "cat");
    nimble.speed = blocker.speed + 3;
    nimble.focus = 8;
    const dodgeDuel = duel(nimble, blocker);
    await round(dodgeDuel, "special2", "guard");
    assert.equal(nimble.shield, 10, "unused dodge converts to 10 Shield");
    assert.equal(nimble.evadeCharges, 0);
    assert.equal(nimble.adaptiveDodgeUntil, 0);

    const agile = make("agile", "bunny");
    const attacker = make("attacker", "cat");
    agile.speed = attacker.speed + 3;
    agile.focus = 8;
    const attackDuel = duel(agile, attacker);
    await round(attackDuel, "special2", "strike");
    assert.equal(agile.shield, 0, "an enemy attack consumes the dodge instead of giving free Shield");

    const panda = make("panda", "panda");
    const enemy = make("enemy", "cat");
    panda.focus = 8;
    const pandaDuel = duel(panda, enemy);
    await round(pandaDuel, "special", "focus");
    assert.ok(panda.shield > 0);
    assert.equal(panda.shieldBreakRefund, 2);
    const focusBeforeExpiry = panda.focus;
    // Round 1 created Shield. Rounds 2 and 3 must still protect the panda
    // until the END of round 3, when the Shield expires naturally.
    await round(pandaDuel, "focus", "focus");
    assert.ok(panda.shield > 0, "Shield must survive through the second round");
    assert.equal(panda.shieldExpiresRound, 3, "creation on round 1 expires at round-end 3");
    assert.equal(panda.shieldBreakRefund, 2, "the on-break Focus reward stays armed while Shield exists");
    await round(pandaDuel, "focus", "focus");
    assert.equal(panda.shield, 0, "Shield expires at the end of the third round even if unbroken");
    assert.equal(panda.shieldBreakRefund, 0, "expiration must never grant break-refund Focus");
    assert.equal(panda.focus, Math.min(FOCUS_CAP, focusBeforeExpiry + 6));

    const breakerPanda = make("breaker-panda", "panda");
    const breakerEnemy = make("breaker-enemy", "cat");
    breakerPanda.focus = 8;
    const breakerDuel = duel(breakerPanda, breakerEnemy);
    breakerDuel.roundSerial = 1;
    applyMove(breakerDuel, breakerPanda, breakerEnemy, "special");
    breakerEnemy.attack = 300;
    const refundStart = breakerPanda.focus;
    applyMove(breakerDuel, breakerEnemy, breakerPanda, "strike");
    assert.equal(breakerPanda.shield, 0);
    assert.equal(breakerPanda.focus, Math.min(FOCUS_CAP, refundStart + 2));

    // Real paired-skill combo: first create Shield, then strike with it.
    const combo = make("combo", "panda");
    const comboTarget = make("combo-target", "dog");
    combo.focus = 8;
    const comboDuel = duel(combo, comboTarget);
    comboDuel.roundSerial = 1;
    applyMove(comboDuel, combo, comboTarget, "special");
    assert.equal(combo.focus, 4);
    assert.equal(combo.shield, 9);
    comboDuel.roundSerial = 2;
    applyMove(comboDuel, combo, comboTarget, "special2");
    assert.equal(combo.focus, 0);
    assert.equal(combo.shield, 4);
    assert.ok(comboDuel.log.some(line => line.includes("Shield Slam")));

    const slammer = make("slammer", "panda");
    const slammerTarget = make("slammer-target", "cat");
    slammer.shield = 15;
    slammer.focus = 8;
    const slammerDuel = duel(slammer, slammerTarget);
    applyMove(slammerDuel, slammer, slammerTarget, "special2");
    assert.equal(slammer.shield, 10, "Shield-powered special expends Shield to prevent repetition");
    assert.ok(slammerDuel.log.some(line => line.includes("Shield Slam +5")));

    const exhausted = make("exhausted", "panda");
    const idle = make("idle", "cat");
    const guardDuel = duel(exhausted, idle);
    for (let i = 0; i < 3; i++) {
        applyMove(guardDuel, exhausted, idle, "guard");
    }
    assert.equal(exhausted.focus, 1, "repeated Guards cannot farm Focus");
    assert.ok(exhausted.shield <= SHIELD_CAP);

    console.log(`Paw Brawl 2.5 conditional tests passed: ${breeds} breeds, ${skillNames.size} specials, Speed ties, adaptive dodge, Shield Slam, broken/expired Shields and Guard fatigue.`);
} finally {
    Math.random = previousRandom;
}
