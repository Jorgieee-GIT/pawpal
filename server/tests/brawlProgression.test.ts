import assert from "node:assert/strict";
import { BREED_LIST, FOCUS_CAP, SHIELD_CAP, getCombatKit, getCombatOrderRole } from "../src/brawlAbilities.js";

const names = new Set<string>();
const pairs = new Set<string>();
let totalBreeds = 0;

for (const [species, breeds] of Object.entries(BREED_LIST)) {
    assert.equal(breeds.length, 11, `${species} must have eleven playable breeds`);
    let priorHpProgression = -1;
    let priorSpecialStrength = -1;

    for (const [rank, breed] of breeds.entries()) {
        const kit = getCombatKit(species, breed);
        assert.equal(kit.progression.rank, rank);
        assert.equal(kit.progression.unlockLevel, rank * 5);
        assert.ok(kit.progression.bonus.hp > priorHpProgression);
        assert.ok(kit.specials[0].strength >= priorSpecialStrength);
        assert.ok(kit.specials.every(skill => skill.trigger && skill.bonus));
        assert.notEqual(kit.specials[0].kind, kit.specials[1].kind);
        assert.ok(kit.stats.hp > 80 && kit.stats.attack > 0 && kit.stats.defense > 0 && kit.stats.speed > 0);
        assert.ok(kit.passive.description.length > 30);

        for (const skill of kit.specials) {
            assert.ok(skill.cost >= 4 && skill.cost <= FOCUS_CAP);
            assert.ok(skill.cooldown >= 2);
            assert.ok(skill.description.includes("NORMAL EFFECT:") && skill.description.includes("EXTRA BONUS:") && !skill.description.includes("COST:"));
            assert.ok(!names.has(skill.name), `${species} ${breed}: duplicate skill ${skill.name}`);
            names.add(skill.name);
        }
        pairs.add(`${kit.specials[0].kind}/${kit.specials[1].kind}`);
        priorHpProgression = kit.progression.bonus.hp;
        priorSpecialStrength = kit.specials[0].strength;
        totalBreeds++;
    }
}
assert.equal(totalBreeds, 88);
assert.equal(names.size, 176);
assert.ok(pairs.size >= 50, "the roster needs diverse combinations, not reskinned copies");
assert.equal(FOCUS_CAP, 8);
assert.equal(SHIELD_CAP, 34);
assert.equal(getCombatOrderRole(18, 18), "tied");
assert.equal(getCombatKit("dog", "dire_wolf").specials[1].name, "Direwolf Ironheart");
assert.equal(getCombatKit("panda", "red_panda").specials[0].bonus, "quickhit");
assert.equal(getCombatKit("bunny", "nuralagus").specials[1].bonus, "fortify");

console.log(`Paw Brawl 2.5 progression checks passed: ${totalBreeds} kits, ${names.size} unique names, ${pairs.size} different skill pairs.`);
