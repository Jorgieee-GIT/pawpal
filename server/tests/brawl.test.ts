import assert from 'node:assert/strict';
import {BRAWL_RULES, BREED_LIST, FOCUS_CAP, SHIELD_CAP, guardShieldForStreak, getCombatKit, getPublicCombatCatalog} from '../src/brawlAbilities.js';
import type {Battle, Player} from '../src/multiplayer.js';

// Pure combat tests do not connect to a database; this is only for pg Pool construction.
process.env.DATABASE_URL ??= 'postgresql://unit:unit@127.0.0.1:5432/pawpal_test';
const {applyMove, makePlayer, resolveRound} = await import('../src/multiplayer.js');

const names = new Set<string>();
const passives = new Set<string>();
const mechanicSignatures = new Set<string>();
const costs = new Set<number>();
const kinds = new Set<string>();
const passiveKinds = new Set<string>();
let tested = 0;

function makeBattle(first: Player, second: Player): Battle {
    return {
        players: [first, second],
        turn: first.userId,
        turns: 0,
        turnExpiresAt: new Date(Date.now() + 30000).toISOString(),
        pendingMoves: {},
        log: []
    };
}

const originalRandom = Math.random;
try {
    // Avoid dodge RNG so these assertions exercise damage and secondary effects.
    Math.random = () => 0.99;
    for (const [species, breeds] of Object.entries(BREED_LIST)) {
        assert.equal(breeds.length, 11, `${species} catalog is incomplete`);
        for (const breed of breeds) {
            const kit = getCombatKit(species, breed);
            assert.ok(!names.has(kit.special.name), `duplicate special: ${kit.special.name}`);
            assert.ok(!passives.has(kit.passive.name), `duplicate passive: ${kit.passive.name}`);
            names.add(kit.special.name);
            passives.add(kit.passive.name);
            costs.add(kit.special.cost);
            kinds.add(kit.special.kind);
            passiveKinds.add(kit.passive.kind);
            assert.ok(kit.special.cost >= 3 && kit.special.cost <= 7);
            assert.ok(kit.special.cooldown >= 1 && kit.special.cooldown <= 3);
            assert.ok(kit.special.description.includes(`Costs ${kit.special.cost}/${FOCUS_CAP} Focus`));
            assert.ok(kit.passive.description.length > 10);
            const signature = `${kit.special.kind}-${kit.special.strength}-${kit.special.cost}-${kit.special.cooldown}`;
            assert.ok(!mechanicSignatures.has(signature), `duplicate special mechanics: ${species}/${breed}`);
            mechanicSignatures.add(signature);

            const rank = breeds.indexOf(breed);
            const bonus = kit.progression.bonus;
            assert.equal(kit.progression.rank, rank);
            assert.equal(kit.progression.unlockLevel, rank * 5);
            assert.equal(kit.progression.grade, ['Origin', 'Rookie', 'Rising', 'Adept', 'Veteran', 'Prime', 'Prestige', 'Elite', 'Mythic', 'Celestial', 'Apex'][rank]);
            assert.deepEqual(bonus, {hp: rank, attack: rank >= 5 ? 1 : 0, defense: rank >= 8 ? 1 : 0, speed: 0});
            const first = makePlayer('player-a', 'tester', {species, breed, name: 'Tester', color: 'classic'});
            const second = makePlayer('player-b', 'rival', {species: 'cat', breed: 'classic', name: 'Rival', color: 'classic'});
            assert.equal(first.progression?.tier, kit.progression.tier);
            assert.equal(first.maxHp, kit.stats.hp);
            assert.equal(first.special?.name, kit.special.name);
            assert.equal(first.passive?.name, kit.passive.name);
            first.focus = FOCUS_CAP;
            second.shield = 9;
            const battle = makeBattle(first, second);
            applyMove(battle, first, second, 'special');
            assert.equal(first.focus >= 0, true);
            assert.equal(first.focus <= FOCUS_CAP, true);
            assert.ok(first.cooldown >= 1);
            assert.ok(first.hp > 0 && first.hp <= first.maxHp);
            assert.ok(second.hp >= 0 && second.hp <= second.maxHp);
            assert.ok(first.shield <= SHIELD_CAP && second.shield <= SHIELD_CAP);
            assert.equal(battle.lastRoundEffects?.[0].moveName, kit.special.name);
            assert.equal(battle.lastRoundEffects?.[0].playersAfter?.[0].hp, first.hp);
            tested++;
        }
    }
    assert.equal(tested, 88);
    for (const [species, breeds] of Object.entries(BREED_LIST)) {
        // Each shop unlock gives an incremental progression advantage on top of species/style differences.
        const priorBonuses = breeds.map(breed => getCombatKit(species, breed).progression.bonus);
        for (let i = 1; i < priorBonuses.length; i++) {
            assert.ok(priorBonuses[i].hp > priorBonuses[i-1].hp);
            assert.ok(priorBonuses[i].attack >= priorBonuses[i-1].attack);
            assert.ok(priorBonuses[i].defense >= priorBonuses[i-1].defense);
            assert.ok(priorBonuses[i].speed >= priorBonuses[i-1].speed);
        }
        assert.deepEqual(priorBonuses.at(-1), {hp: 10, attack: 1, defense: 1, speed: 0});
    }
    assert.equal(getCombatKit('cat', 'classic').progression.tier, 'Starter');
    assert.equal(getCombatKit('cat', 'smilodon').progression.tier, 'Apex');
    assert.equal(names.size, 88);
    assert.equal(passives.size, 88);
    assert.equal(mechanicSignatures.size, 88);
    assert.deepEqual([...costs].sort(), [3, 4, 5, 6, 7]);
    assert.equal(kinds.size, 11);
    assert.equal(passiveKinds.size, 11);
    assert.equal(BRAWL_RULES.maxRounds, 18);
    assert.equal(getPublicCombatCatalog().kits.cat.calico.special.name, getCombatKit('cat', 'calico').special.name);

    const a = makePlayer('one', 'one', {species: 'cat', breed: 'classic', name: 'One', color: 'classic'});
    const b = makePlayer('two', 'two', {species: 'dog', breed: 'classic', name: 'Two', color: 'classic'});
    const genericBattle = makeBattle(a, b);
    assert.equal(BRAWL_RULES.strikeFocus, 0, 'Basic Paw Strike should not charge Focus');
    assert.equal(BRAWL_RULES.guardFocus, 0, 'Guard should not charge Focus');
    assert.equal(guardShieldForStreak(0), 14);
    assert.equal(guardShieldForStreak(1), 7);
    assert.equal(guardShieldForStreak(2), 0);
    assert.equal(guardShieldForStreak(99), 0);
    applyMove(genericBattle, a, b, 'strike');
    assert.equal(a.focus, 0, 'Paw Strike cannot create Focus without a breed passive');
    applyMove(genericBattle, a, b, 'guard');
    assert.equal(a.shield, 14, 'first Guard earns 14 Shield');
    assert.equal(a.guardStreak, 1);
    assert.equal(a.focus, 0, 'Guard cannot create Focus');
    applyMove(genericBattle, a, b, 'guard');
    assert.equal(a.shield, 21, 'second Guard earns only 7 Shield');
    applyMove(genericBattle, a, b, 'guard');
    assert.equal(a.shield, 21, 'third Guard should not gain Shield');
    assert.equal(a.guardStreak, 2, 'Guard fatigue caps at two steps');
    applyMove(genericBattle, a, b, 'focus');
    assert.equal(a.guardStreak, 0, 'different move resets Guard fatigue');
    assert.equal(a.focus, 3, 'Focus should generate 3 Focus');
    applyMove(genericBattle, a, b, 'guard');
    assert.equal(a.shield, 30, 'first Guard after reset should gain Shield up to cap');
    assert.equal(a.focus, 3, 'guard never charges Focus even with a full Shield');
    applyMove(genericBattle, a, b, 'focus');
    applyMove(genericBattle, a, b, 'focus');
    assert.equal(a.focus, 8, 'Focus should cap at 8');
    applyMove(genericBattle, a, b, 'strike');
    assert.equal(a.focus, 8, 'Paw Strike cannot exceed Focus cap');

    // Guardboost passive retains its identity while the anti-turtle rule applies.
    const boostedEntry = Object.entries(BREED_LIST).flatMap(([species, breeds]) => breeds.map(breed => ({species, breed})))
        .find(({species, breed}) => getCombatKit(species, breed).passive.kind === 'guardboost')!;
    const boosted = makePlayer('boosted', 'boosted', {...boostedEntry, name: 'Guard Pet', color: 'classic'});
    const boostedRival = makePlayer('boostedRival', 'rival', {species: 'cat', breed: 'classic', name: 'Opponent', color: 'classic'});
    const boostedBattle = makeBattle(boosted, boostedRival);
    const extraShield = boosted.passive!.strength + 3;
    assert.equal(guardShieldForStreak(0, boosted.passive), 14 + extraShield);
    assert.equal(guardShieldForStreak(1, boosted.passive), 7 + Math.ceil(extraShield / 2));
    assert.equal(guardShieldForStreak(2, boosted.passive), 0);
    applyMove(boostedBattle, boosted, boostedRival, 'guard');
    assert.equal(boosted.shield, 14 + extraShield);
    applyMove(boostedBattle, boosted, boostedRival, 'guard');
    assert.equal(boosted.shield, Math.min(30, 21 + extraShield + Math.ceil(extraShield / 2)));
    applyMove(boostedBattle, boosted, boostedRival, 'guard');
    assert.equal(boosted.shield, Math.min(30, 21 + extraShield + Math.ceil(extraShield / 2)));

    const strideEntry = Object.entries(BREED_LIST).flatMap(([species, breeds]) => breeds.map(breed => ({species, breed})))
        .find(({species, breed}) => getCombatKit(species, breed).passive.kind === 'stride')!;
    const stride = makePlayer('stride', 'stride', {...strideEntry, name: 'Striding Pet', color: 'classic'});
    const strideRival = makePlayer('strideRival', 'rival', {species: 'cat', breed: 'classic', name: 'Opponent', color: 'classic'});
    applyMove(makeBattle(stride, strideRival), stride, strideRival, 'strike');
    assert.equal(stride.focus, 1, 'Stride passive still earns its breed-specific Focus bonus');

    const sunderEntry = Object.entries(BREED_LIST).flatMap(([species, breeds]) => breeds.map(breed => ({species, breed})))
        .find(({species, breed}) => getCombatKit(species, breed).special.kind === 'sunder')!;
    const sunderPlayer = makePlayer('sunder', 'sunder', {...sunderEntry, name: 'Sunder', color: 'classic'});
    const shielded = makePlayer('shielded', 'shielded', {species: 'panda', breed: 'classic', name: 'Shielded', color: 'classic'});
    sunderPlayer.focus = 8;
    shielded.shield = 24;
    const dodgeBattle = makeBattle(sunderPlayer, shielded);
    Math.random = () => 0;
    applyMove(dodgeBattle, sunderPlayer, shielded, 'special');
    assert.equal(shielded.shield, 24, 'Dodging should protect Shield from Sunder');

    // The Focus thief cannot cancel an opponent's already locked special.
    Math.random = () => 0.99;
    const siphonEntry = Object.entries(BREED_LIST).flatMap(([species, breeds]) => breeds.map(breed => ({species, breed})))
        .find(({species, breed}) => getCombatKit(species, breed).special.kind === 'siphon')!;
    const thief = makePlayer('thief', 'thief', {...siphonEntry, name: 'Thief', color: 'classic'});
    const reserved = makePlayer('reserved', 'reserved', {species: 'dog', breed: 'classic', name: 'Reserved', color: 'classic'});
    thief.focus = FOCUS_CAP;
    reserved.focus = reserved.special!.cost;
    const reservedBattle = makeBattle(thief, reserved);
    reservedBattle.pendingMoves = {[reserved.userId]: 'special'};
    applyMove(reservedBattle, thief, reserved, 'special');
    assert.equal(reserved.focus, reserved.special!.cost, 'a locked special must keep its reserved Focus');

    // An empty round must not invent an action, and 18 skipped rounds must end.
    const skippedBattle = makeBattle(
        makePlayer('skip1', 'skip1', {species: 'cat', breed: 'classic', name: 'Skip One', color: 'classic'}),
        makePlayer('skip2', 'skip2', {species: 'panda', breed: 'classic', name: 'Skip Two', color: 'classic'})
    );
    const queries: string[] = [];
    const mockClient = {query: async (sql: string) => {queries.push(sql); return {rows: [], rowCount: 0};}};
    const mockRow = {id: 'test-battle', challenger_id: 'skip1', challenged_id: 'skip2', wager: 10};
    for (let round = 1; round <= 18; round++) {
        const result = await resolveRound(mockClient, mockRow, skippedBattle);
        assert.equal(result, round === 18 ? 'draw' : 'active');
        assert.equal(skippedBattle.roundSerial, round);
    }
    assert.equal(skippedBattle.turns, 0, 'no automatic actions on timeout');
    assert.equal(skippedBattle.players[0].focus, 0, 'skipping should not generate Focus');
    assert.ok(queries.some(query => query.includes("status='finished'")), 'battle must finish after 18 rounds');

    console.log(`Paw Brawl checks passed: ${tested} breed kits; ranked bonuses; 0-Focus standard attacks; 14/7/0 Guard fatigue; Guardboost/Stride passives; cooldowns; dodges; 18-round caps.`);
} finally {
    Math.random = originalRandom;
}
