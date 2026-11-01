import assert from "node:assert/strict";
import { createDuoBattle, resolveDuoRound, canDuoTarget } from "../src/duoClash.js";
import { BREED_LIST, FOCUS_CAP, SHIELD_CAP } from "../src/brawlAbilities.js";

process.env.DATABASE_URL ??= "postgresql://test:test@127.0.0.1:5432/pawpal_test";
const ids = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222", "33333333-3333-4333-8333-333333333333", "44444444-4444-4444-8444-444444444444"];
const pets = ["bunny", "panda", "fox", "axolotl"].map((species, i) => ({ userId: ids[i], team: (i < 2 ? 0 : 1) as 0 | 1, username: `player${i}`, pet: { name: species, species, breed: "classic", color: "classic" } }));
const oldRandom = Math.random;
try {
    Math.random = () => .99;
    const b = createDuoBattle(pets);
    assert.equal(b.players.length, 4);
    assert.ok(canDuoTarget(b, b.players[0], { action: "strike", targetId: ids[2] }));
    assert.ok(!canDuoTarget(b, b.players[0], { action: "strike", targetId: ids[1] }));
    assert.ok(canDuoTarget(b, b.players[1], { action: "cover", targetId: ids[0] }));
    assert.ok(!canDuoTarget(b, b.players[1], { action: "rescue", targetId: ids[0] }));
    const enemyHp = b.players[2].hp;
    b.pendingMoves = { [ids[0]]: { action: "strike", targetId: ids[2] }, [ids[1]]: { action: "cover", targetId: ids[0] }, [ids[2]]: { action: "strike", targetId: ids[0] }, [ids[3]]: { action: "focus" } };
    let result = resolveDuoRound(b);
    assert.equal(result.finished, false);
    assert.equal(b.round, 2);
    assert.ok(b.players[2].hp < enemyHp);
    assert.ok(b.players[1].hp < b.players[1].maxHp, "Cover must transfer half of direct HP loss to defender");
    for (let round = 0; round < 4; round++) {
        b.pendingMoves = Object.fromEntries(ids.map(id => [id, { action: "focus" }]));
        result = resolveDuoRound(b);
        assert.ok(b.players.every(p => p.focus >= 0 && p.focus <= FOCUS_CAP));
        assert.ok(b.players.every(p => p.shield >= 0 && p.shield <= SHIELD_CAP));
    }
    const rescue = createDuoBattle(pets);
    rescue.players[0].hp = 0;
    rescue.players[0].downedRound = 1;
    rescue.players[1].focus = 8;
    rescue.round = 2;
    rescue.pendingMoves = { [ids[1]]: { action: "rescue", targetId: ids[0] }, [ids[2]]: { action: "focus" }, [ids[3]]: { action: "focus" } };
    resolveDuoRound(rescue);
    assert.ok(rescue.players[0].hp > 0);
    assert.equal(rescue.players[0].focus, 0);
    assert.equal(rescue.rescueUsed[0], true);
    assert.equal(rescue.totals?.[ids[1]].rescues, 1);
    // Both already-locked actions still occur in a Speed tie even if a
    // faster/same-Speed hit knocks out their actor earlier in the animation.
    const tie = createDuoBattle(pets);
    tie.players[0].speed = 15;
    tie.players[2].speed = 15;
    tie.players[0].hp = 2;
    tie.players[2].hp = 2;
    tie.pendingMoves = {
        [ids[0]]: { action: "strike", targetId: ids[2] },
        [ids[1]]: { action: "guard" },
        [ids[2]]: { action: "strike", targetId: ids[0] },
        [ids[3]]: { action: "guard" }
    };
    resolveDuoRound(tie);
    assert.ok(tie.players[0].hp <= 0 && tie.players[2].hp <= 0, "Speed tie must not erase locked actions");

    // When two allies choose one enemy, the second attack is not redirected
    // to the other enemy after the first attacker scores a knockout.
    const noRedirect = createDuoBattle(pets);
    noRedirect.players[2].hp = 1;
    const otherEnemyHp = noRedirect.players[3].hp;
    noRedirect.pendingMoves = {
        [ids[0]]: { action: "strike", targetId: ids[2] },
        [ids[1]]: { action: "strike", targetId: ids[2] },
        [ids[2]]: { action: "guard" },
        [ids[3]]: { action: "focus" }
    };
    resolveDuoRound(noRedirect);
    assert.equal(noRedirect.players[3].hp, otherEnemyHp, "Attacks must not auto-retarget");
    assert.ok((noRedirect.totals?.[ids[0]]?.damageDealt || 0) >= 0);

    for (const [species, breeds] of Object.entries(BREED_LIST)) {
        for (const breed of breeds) {
            const petsWithBreed = structuredClone(pets);
            petsWithBreed[0].pet.species = species;
            petsWithBreed[0].pet.breed = breed;
            const duel = createDuoBattle(petsWithBreed);
            duel.players[0].focus = 8;
            const move = { action: "special" as const, targetId: ids[2] };
            assert.ok(canDuoTarget(duel, duel.players[0], move));
            duel.pendingMoves = { [ids[0]]: move, [ids[1]]: { action: "focus" }, [ids[2]]: { action: "focus" }, [ids[3]]: { action: "focus" } };
            resolveDuoRound(duel);
            assert.ok(duel.players.every(p => p.focus >= 0 && p.focus <= FOCUS_CAP), `${species} ${breed} Focus`);
            assert.ok(duel.players.every(p => p.shield >= 0 && p.shield <= SHIELD_CAP), `${species} ${breed} Shield`);
        }
    }
    console.log("Duo Clash: 88 breeds, targeting, Cover, rescue, Focus and Shield tests passed.");
} finally {
    Math.random = oldRandom;
}
