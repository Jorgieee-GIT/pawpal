import assert from "node:assert/strict";
import {
    BRAWL_RULES,
    BREED_LIST,
    FOCUS_CAP,
    SHIELD_CAP,
    guardShieldForStreak,
    getCombatKit,
    getCombatOrderRole,
    getPublicCombatCatalog
} from "../src/brawlAbilities.js";
import type { Battle, Player } from "../src/multiplayer.js";

process.env.DATABASE_URL ??= "postgresql://unit:unit@127.0.0.1:5432/pawpal_test";
const { applyMove, makePlayer, resolveRound } = await import("../src/multiplayer.js");

function player(id: string, species = "cat", breed = "classic"): Player {
    return makePlayer(id, id, { species, breed, name: id, color: "classic" });
}
function battle(first: Player, second: Player): Battle {
    return {
        players: [first, second], turn: first.userId, turns: 0,
        turnExpiresAt: new Date(Date.now() + 30000).toISOString(),
        pendingMoves: {}, log: [], roundSerial: 0
    };
}
const fakeDb = {
    query: async () => ({ rows: [], rowCount: 0 })
};
function row(first: Player, second: Player) {
    return { id: "simulation", challenger_id: first.userId, challenged_id: second.userId, wager: 5 };
}
const priorRandom = Math.random;
try {
    Math.random = () => 0.99; // deterministic hits, except when tests explicitly change this
    const catalog = getPublicCombatCatalog();
    const skills = new Set<string>();
    const passives = new Set<string>();
    const kinds = new Set<string>();
    const allSkillNames = new Set<string>();
    let total = 0;
    for (const [species, breeds] of Object.entries(BREED_LIST)) {
        assert.equal(breeds.length, 11);
        for (const [rank, breed] of breeds.entries()) {
            const kit = getCombatKit(species, breed);
            assert.ok(!skills.has(kit.special.name));
            assert.ok(!passives.has(kit.passive.name));
            skills.add(kit.special.name);
            passives.add(kit.passive.name);
            kinds.add(kit.special.kind);
            assert.equal(kit.specials.length, 2);
            assert.ok(kit.specials.every(skill => skill.trigger && skill.bonus));
            assert.ok(kit.specials.every(skill => !skill.description.includes("FIRST-move")));
            kinds.add(kit.specials[1].kind);
            assert.notEqual(kit.specials[0].kind, kit.specials[1].kind);
            for (const skill of kit.specials) {
                assert.ok(!allSkillNames.has(skill.name), `Duplicate special: ${skill.name}`);
                allSkillNames.add(skill.name);
                assert.ok(skill.cost >= 3 && skill.cost <= 6);
                assert.ok(skill.cooldown >= 2);
                assert.ok(skill.description.includes("NORMAL EFFECT:") && skill.description.includes("EXTRA BONUS:"));
            }
            assert.ok(kit.special.cost >= 4 && kit.special.cost <= 6);
            assert.ok(kit.special.cooldown >= 2);
            assert.ok(kit.special.description.includes("NORMAL EFFECT:"));
            assert.ok(kit.passive.description.length > 20);
            assert.equal(kit.progression.rank, rank);
            assert.equal(kit.progression.unlockLevel, rank * 5);
            assert.ok(kit.stats.hp > 80);
            assert.equal(catalog.kits[species][breed].special.name, kit.special.name);
            const one = player(`attacker-${total}`, species, breed);
            const two = player(`defender-${total}`, "panda", "classic");
            one.focus = FOCUS_CAP;
            applyMove(battle(one, two), one, two, "special");
            assert.ok(one.focus >= 0 && one.focus <= FOCUS_CAP);
            assert.ok(one.shield >= 0 && one.shield <= SHIELD_CAP);
            assert.ok(two.shield >= 0 && two.shield <= SHIELD_CAP);
            assert.ok(one.hp > 0 && one.hp <= one.maxHp);
            assert.ok(two.hp >= 0 && two.hp <= two.maxHp);
            assert.ok(one.cooldown >= 2, "special must not be immediately reusable");
            total++;
        }
    }
    assert.equal(total, 88);
    assert.equal(allSkillNames.size, 176, "Each breed must have TWO individually named paid abilities");
    assert.ok(kinds.size >= 13, "skill families must include multiple counterplay styles");

    // Both specials spend Focus. Individual cooldowns and the Focus cap prevent
    // repeats; chaining two different specials is legal when affordable.
    for (const [species, breeds] of Object.entries(BREED_LIST)) {
        for (const breed of breeds) {
            const kit = getCombatKit(species, breed);
            const fighter = player("paired", species, breed);
            const opponent = player("dummy", "panda", "classic");
            const duel = battle(fighter, opponent);
            fighter.focus = 8;
            const special = kit.specials[1];
            applyMove(duel, fighter, opponent, "special2");
            assert.ok(fighter.focus >= 8 - special.cost && fighter.focus <= FOCUS_CAP);
            assert.ok((fighter.cooldowns?.[1] || 0) >= 2);
            assert.equal(fighter.specialLockout, 0);
            if (fighter.focus >= kit.specials[0].cost) {
                applyMove(duel, fighter, opponent, "special");
                assert.equal(fighter.specialLockout, 0);
            }
        }
    }
    const bunny = player("bunny", "bunny", "classic");
    const panda = player("panda", "panda", "classic");
    bunny.focus = 8;
    panda.focus = 8;
    assert.equal(bunny.specials?.[0].kind, "tempo");
    assert.equal(panda.specials?.[1].kind, "shield_bash");
    bunny.speed = 40;
    panda.speed = 5;
    panda.shield = 12;
    panda.shieldExpiresRound = 2;
    applyMove(battle(bunny, panda), panda, bunny, "special2");
    assert.equal(panda.shield, 7, "Panda's Shield Slam spends five existing Shield");

    // A position bonus is earned by STRICT Speed. Stable user-ID tie order
    // must not give two identical bunnies a hidden first-move advantage.
    assert.equal(getCombatOrderRole(18, 18), "tied");
    assert.equal(getCombatOrderRole(19, 18), "first");
    assert.equal(getCombatOrderRole(17, 18), "last");
    const tieBunny = player("tie-bunny", "bunny", "classic");
    const tieOpponent = player("tie-opponent", "bunny", "classic");
    tieBunny.focus = 8;
    const tiedDuel = battle(tieBunny, tieOpponent);
    applyMove(tiedDuel, tieBunny, tieOpponent, "special");
    assert.ok(!tiedDuel.log.join(" ").includes("speed +3 damage"));
    const fasterBunny = player("faster-bunny", "bunny", "classic");
    const slowerBunny = player("slower-bunny", "bunny", "classic");
    fasterBunny.speed += 1;
    fasterBunny.focus = 8;
    const fasterDuel = battle(fasterBunny, slowerBunny);
    applyMove(fasterDuel, fasterBunny, slowerBunny, "special");
    assert.ok(fasterDuel.log.join(" ").includes("speed +3 damage"));
    assert.equal(tieOpponent.maxHp - tieOpponent.hp + 3, slowerBunny.maxHp - slowerBunny.hp);
    // Panda specials are NOT restricted to first/last. Shield Slam works on
    // an equal-Speed matchup so long as the panda has Shield to spend.
    const pandaTie = player("panda-tie", "panda", "classic");
    const pandaEqual = player("panda-equal", "panda", "classic");
    pandaTie.focus = 8;
    pandaTie.shield = 15;
    applyMove(battle(pandaTie, pandaEqual), pandaTie, pandaEqual, "special2");
    assert.equal(pandaTie.shield, 10, "equal-Speed pandas still use Shield Slam");
    // Attack-heavy kits use a chance-based critical when faster (not always).
    const critCat = player("crit-cat", "cat", "classic");
    const critPanda = player("crit-panda", "panda", "classic");
    critCat.focus = 8;
    const critDuel = battle(critCat, critPanda);
    Math.random = () => 0.10; // <25% crit, but > defensive dodge chance
    applyMove(critDuel, critCat, critPanda, "special");
    assert.ok(critDuel.log.join(" ").includes("critical +8"));
    Math.random = () => 0.99;
    const normalCat = player("normal-cat", "cat", "classic");
    const normalPanda = player("normal-panda", "panda", "classic");
    normalCat.focus = 8;
    const normalDuel = battle(normalCat, normalPanda);
    applyMove(normalDuel, normalCat, normalPanda, "special");
    assert.ok(!normalDuel.log.join(" ").includes("critical +8"));

    // The expensive final Dire Wolf unlock must have a real defensive upgrade,
    // not the old underpowered 4-Shield attack.
    const dire = player("dire-wolf", "dog", "dire_wolf");
    const earlyDog = player("early-dog", "dog", "classic");
    assert.ok(dire.maxHp > earlyDog.maxHp);
    assert.equal(dire.specials?.[1].name, "Direwolf Ironheart");
    assert.equal(dire.specials?.[1].kind, "fortress");
    dire.hp -= 20;
    dire.focus = 8;
    dire.speed = 1;
    const direOpponent = player("dire-rival", "cat", "classic");
    applyMove(battle(dire, direOpponent), dire, direOpponent, "special2");
    assert.equal(dire.shield, 16, "Apex Ironheart gains 13 Shield +3 when Shield was low");
    assert.equal(dire.hp, dire.maxHp - 15, "Ironheart heals 5 HP");
    assert.equal(dire.focus, 3, "Ironheart costs 5 Focus");

    // Position bonuses reflect notable breed identity, not blindly species.
    const redPanda = getCombatKit("panda", "red_panda");
    const giantPanda = getCombatKit("panda", "giant_panda");
    assert.equal(redPanda.specials[0].bonus, "quickhit");
    assert.equal(redPanda.specials[1].bonus, "adaptive");
    assert.ok(redPanda.stats.speed > giantPanda.stats.speed);
    const nuralagus = getCombatKit("bunny", "nuralagus");
    assert.equal(nuralagus.specials[1].bonus, "fortify");
    assert.ok(nuralagus.stats.speed < getCombatKit("bunny", "classic").stats.speed);
    assert.ok(nuralagus.stats.hp > getCombatKit("bunny", "classic").stats.hp);

    // All newly curated active skill families must resolve their distinct
    // effects and never provide a free Focus regeneration exploit.
    const ambusher = player("ambusher", "cat", "tuxedo");
    const ambushTarget = player("ambush-target", "dog", "classic");
    ambusher.focus = 8;
    applyMove(battle(ambusher, ambushTarget), ambusher, ambushTarget, "special");
    assert.equal(ambusher.evadeCharges, 1, "Ambush prepares evasion");

    const hexer = player("hexer", "fox", "cross_fox");
    const hexTarget = player("hex-target", "panda", "classic");
    hexer.focus = 8;
    hexTarget.focus = 3;
    applyMove(battle(hexer, hexTarget), hexer, hexTarget, "special");
    assert.equal(hexTarget.weakenedRounds, 1, "Hex weakens next attack");
    assert.equal(hexTarget.focus, 2, "Hex steals only 1 Focus");

    const poisonous = player("poisoner", "axolotl", "ambystoma_dumerilii");
    const poisoned = player("poisoned", "dog", "classic");
    poisonous.focus = 8;
    applyMove(battle(poisonous, poisoned), poisonous, poisoned, "special");
    assert.equal(poisoned.poisonRounds, 2);
    assert.equal(poisoned.poisonDamage, 6, "Apex poison is more potent than starter poison");

    const lastStandKit = Object.entries(BREED_LIST).flatMap(([species, breeds]) => breeds.map(breed => ({ species, breed })))
        .find(({ species, breed }) => getCombatKit(species, breed).passive.kind === "laststand")!;
    const survivor = player("survivor", lastStandKit.species, lastStandKit.breed);
    const brutal = player("brutal", "dog", "classic");
    brutal.attack = 500;
    applyMove(battle(brutal, survivor), brutal, survivor, "strike");
    assert.equal(survivor.hp, 1, "Last Stand prevents one lethal direct hit");
    assert.equal(survivor.lastStandUsed, true);
    applyMove(battle(brutal, survivor), brutal, survivor, "strike");
    assert.equal(survivor.hp, 0, "Last Stand cannot prevent a second lethal hit");

    // Guard fatigue does not give infinite Focus, or even Focus when Shield is full.
    const tank = player("tank");
    const rival = player("rival", "dog");
    const duel = battle(tank, rival);
    assert.equal(FOCUS_CAP, 8);
    assert.equal(SHIELD_CAP, 34);
    assert.equal(BRAWL_RULES.guardShield, 16);
    assert.equal(BRAWL_RULES.repeatedGuardShield, 8);
    assert.equal(guardShieldForStreak(2), 0);
    applyMove(duel, tank, rival, "guard");
    assert.equal(tank.shield, 16);
    assert.equal(tank.focus, 1);
    applyMove(duel, tank, rival, "guard");
    assert.equal(tank.shield, 24);
    assert.equal(tank.focus, 1, "second Guard must not earn Focus");
    applyMove(duel, tank, rival, "guard");
    assert.equal(tank.shield, 24);
    assert.equal(tank.focus, 1, "repeated Guard must be totally exhausted");
    applyMove(duel, tank, rival, "focus");
    assert.equal(tank.focus, 4);
    assert.equal(tank.shield, 24, "Shields have a fixed three-round lifetime, no movement tax");
    applyMove(duel, tank, rival, "guard");
    assert.equal(tank.focus, 5);
    tank.shield = SHIELD_CAP;
    applyMove(duel, tank, rival, "focus");
    const before = tank.focus;
    applyMove(duel, tank, rival, "guard");
    assert.equal(tank.focus, before, "capped Shield cannot be exploited for Guard Focus");

    // Even ordinary attacks must do HP damage through Shield.
    rival.shield = SHIELD_CAP;
    const rivalHp = rival.hp;
    applyMove(duel, tank, rival, "strike");
    assert.ok(rival.hp < rivalHp);
    assert.ok(rival.shield < SHIELD_CAP);

    // Stride: Focus, speed and the matching fast skill are complementary.
    const stridePair = Object.entries(BREED_LIST).flatMap(([species, breeds]) => breeds.map(breed => ({ species, breed })))
        .find(({ species, breed }) => getCombatKit(species, breed).passive.kind === "stride")!;
    const fast = player("fast", stridePair.species, stridePair.breed);
    const slow = player("slow", "panda");
    fast.speed = 40;
    slow.speed = 3;
    const hp = slow.hp;
    applyMove(battle(fast, slow), fast, slow, "strike");
    assert.equal(fast.focus, 2);
    assert.ok(hp - slow.hp > 0);

    // First-in-order stun cannot cancel an already submitted move this round.
    const staggerPair = Object.entries(BREED_LIST).flatMap(([species, breeds]) => breeds.map(breed => ({ species, breed })))
        .find(({ species, breed }) => getCombatKit(species, breed).special.kind === "stagger")!;
    const stunner = player("stunner", staggerPair.species, staggerPair.breed);
    const victim = player("victim", "dog");
    stunner.speed = 40;
    victim.speed = 4;
    stunner.focus = 8;
    const stunBattle = battle(stunner, victim);
    stunBattle.pendingMoves = { stunner: "special", victim: "strike" };
    await resolveRound(fakeDb, row(stunner, victim), stunBattle);
    assert.equal(stunBattle.turns, 2, "locked opponent move must resolve normally");
    assert.equal(victim.stunnedRounds, 1, "stun must apply NEXT round only");
    const turnsBefore = stunBattle.turns;
    stunBattle.pendingMoves = { stunner: "focus" };
    await resolveRound(fakeDb, row(stunner, victim), stunBattle);
    assert.equal(stunBattle.turns, turnsBefore + 2);
    assert.equal(victim.stunnedRounds, 0);
    assert.equal(victim.stunImmunity, 3);
    assert.ok(stunBattle.log.some(line => line.includes("misses this round")));

    // Focus theft respects a locked special, preserving simultaneous move integrity.
    const siphonPair = Object.entries(BREED_LIST).flatMap(([species, breeds]) => breeds.map(breed => ({ species, breed })))
        .find(({ species, breed }) => getCombatKit(species, breed).special.kind === "siphon")!;
    const thief = player("thief", siphonPair.species, siphonPair.breed);
    const reserved = player("reserved", "cat");
    thief.focus = 8;
    reserved.focus = reserved.special!.cost;
    const lockedBattle = battle(thief, reserved);
    lockedBattle.pendingMoves = { reserved: "special" };
    applyMove(lockedBattle, thief, reserved, "special");
    assert.equal(reserved.focus, reserved.special!.cost);

    // Posion damages HP through armor and burns out; cooldown and reserved
    // resources stay within bounds for all 88 archetypes.
    const venomPair = Object.entries(BREED_LIST).flatMap(([species, breeds]) => breeds.map(breed => ({ species, breed })))
        .find(({ species, breed }) => getCombatKit(species, breed).special.kind === "venom")!;
    const v = player("venom", venomPair.species, venomPair.breed);
    const target = player("target", "panda");
    v.focus = 8;
    target.shield = 24;
    const poisonBattle = battle(v, target);
    poisonBattle.pendingMoves = { venom: "special", target: "guard" };
    await resolveRound(fakeDb, row(v, target), poisonBattle);
    assert.equal(target.poisonRounds, 1);
    const poisonedHp = target.hp;
    const pendingPoisonDamage = target.poisonDamage || 5;
    poisonBattle.pendingMoves = { venom: "guard", target: "guard" };
    await resolveRound(fakeDb, row(v, target), poisonBattle);
    assert.equal(target.poisonRounds, 0);
    assert.equal(target.hp, poisonedHp - pendingPoisonDamage);

    // Overtime must ensure turtling cannot continue without HP loss.
    const t1 = player("t1");
    const t2 = player("t2", "panda");
    const overtime = battle(t1, t2);
    for (let i = 0; i < 11; i++) {
        overtime.pendingMoves = {};
        await resolveRound(fakeDb, row(t1, t2), overtime);
    }
    assert.equal(t1.hp, t1.maxHp - BRAWL_RULES.pressureFirstDamage);
    assert.equal(t2.hp, t2.maxHp - BRAWL_RULES.pressureFirstDamage);
    console.log(`Paw Brawl 2.5 checks passed: ${total} breed kits, ${allSkillNames.size} paid specials, ${kinds.size} special families, shield fatigue, poison, stun immunity, move locks, Focus safety and overtime.`);
} finally {
    Math.random = priorRandom;
}
