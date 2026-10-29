import assert from 'node:assert/strict';
import {pawMailCatalog, pawMailDesigns, canPurchaseEnvelope} from '../src/mailCatalog.js';

const expected = ['strawberry_picnic','moonlit_library','coral_kingdom','enchanted_greenhouse','cloud_palace','lantern_festival','crystal_cavern','aurora_fox','sunfire_phoenix','dreamscape'];
assert.equal(pawMailCatalog.length, 21);
assert.equal(new Set(pawMailDesigns).size, 21);
assert.equal(pawMailCatalog.filter(item => item.level > 1).length, 10);
assert.deepEqual(pawMailCatalog.slice(-10).map(item => item.id), expected);
assert.deepEqual(pawMailCatalog.slice(-10).map(item => item.level), [10,14,18,22,26,30,35,40,45,50]);
assert.deepEqual(pawMailCatalog.slice(-10).map(item => item.price), [5000,7000,9500,12000,14500,17000,20000,23500,27000,30000]);
assert.ok(pawMailCatalog.slice(-10).every((item, i, arr) => i === 0 || (item.price > arr[i-1].price && item.level > arr[i-1].level)));
for (const item of pawMailCatalog.slice(1)) {
    assert.equal(canPurchaseEnvelope(item.id,item.level,item.price),true);
    assert.equal(canPurchaseEnvelope(item.id,item.level-1,item.price),false);
    assert.equal(canPurchaseEnvelope(item.id,item.level,item.price-1),false);
    assert.equal(canPurchaseEnvelope(item.id,item.level,item.price,[item.id]),false);
}
assert.equal(pawMailCatalog[11].level, 10);
assert.equal(pawMailCatalog[11].price, 5000);
assert.equal(pawMailCatalog[20].level, 50);
assert.equal(pawMailCatalog[20].price, 30000);
assert.equal(canPurchaseEnvelope('classic',50,999999),false);
assert.equal(canPurchaseEnvelope('not_real',50,999999),false);
console.log('PawMail envelope catalog: 21 unique designs, 10 level gates, purchases validated.');
