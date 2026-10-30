import {strict as assert} from 'node:assert';
import {FLOWER_RULES,GARDEN_SEED_PRICE,GARDEN_WATER_PRICE,GARDEN_GROWTH_MS,rollFlower,createGardenFlower,gardenHarvestReady,publicPetGarden,recordFlowerDiscovery} from '../src/gardenRules.js';

assert.equal(FLOWER_RULES.reduce((sum,flower)=>sum+flower.chance,0),100);
assert.equal(FLOWER_RULES.length,5);
assert.equal(GARDEN_SEED_PRICE,40);
assert.equal(GARDEN_WATER_PRICE,10);
const expectedReturn=FLOWER_RULES.reduce((sum,flower)=>sum+flower.chance/100*(flower.min+flower.max)/2,0);
assert.ok(Math.abs(expectedReturn-59.55)<1e-8);
for(let roll=0;roll<100;roll++)assert.ok(FLOWER_RULES.some(f=>f.rarity===rollFlower(roll).rarity));
for(const flower of FLOWER_RULES)assert.equal(Array.from({length:100},(_,n)=>rollFlower(n)).filter(f=>f.rarity===flower.rarity).length,flower.chance);
assert.throws(()=>rollFlower(100),RangeError);
assert.throws(()=>rollFlower(-1),RangeError);

const now=new Date('2026-10-30T02:00:00.000Z');
for(let i=0;i<100;i++){
    const flower=createGardenFlower(now);
    const kind=FLOWER_RULES.find(f=>f.rarity===flower.rarity);
    assert.ok(kind);
    assert.ok(flower.reward>=kind!.min&&flower.reward<=kind!.max);
    assert.ok(flower.variant>=0&&flower.variant<4);
    assert.equal(flower.planted_at,now.toISOString());
}
const planted={planted_at:now.toISOString(),watered_minutes:0};
assert.equal(gardenHarvestReady(planted,now.getTime()+GARDEN_GROWTH_MS-1),false);
assert.equal(gardenHarvestReady(planted,now.getTime()+GARDEN_GROWTH_MS),true);
assert.equal(gardenHarvestReady({...planted,watered_minutes:1},now.getTime()+GARDEN_GROWTH_MS-60000),true);
assert.equal(gardenHarvestReady({...planted,watered_minutes:1},now.getTime()+GARDEN_GROWTH_MS-60001),false);

const privatePet={id:'test',coins:123,garden:{seeds:3,plots:[{...planted,rarity:'Legendary',reward:555,variant:2},null],discoveries:{Common:{count:1,first_at:now.toISOString(),best_reward:50}}}};
const publicPet=publicPetGarden(privatePet)!;
assert.equal(publicPet.garden.plots[0].rarity,undefined);
assert.equal(publicPet.garden.plots[0].reward,undefined);
assert.equal(publicPet.garden.plots[0].variant,undefined);
assert.equal(publicPet.garden.plots[0].planted_at,planted.planted_at);
assert.equal(privatePet.garden.plots[0]!.rarity,'Legendary');
assert.equal(publicPet.garden.discoveries.Common.count,1);
assert.equal(recordFlowerDiscovery(privatePet.garden,'Legendary',555,now),true);
assert.equal(recordFlowerDiscovery(privatePet.garden,'Legendary',450,now),false);
assert.equal(privatePet.garden.discoveries.Legendary.count,2);
assert.equal(privatePet.garden.discoveries.Legendary.best_reward,555);
assert.equal(recordFlowerDiscovery(privatePet.garden,'Unknown',555,now),false);
console.log('Garden rules passed: weights, rewards, redaction, time gates, and discoveries.');
