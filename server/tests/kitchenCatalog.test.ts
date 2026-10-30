import assert from 'node:assert/strict';
import {test} from 'node:test';
import {cookingRating, findRecipeByIngredients, kitchenPrices, kitchenRecipes, legacyRecipeIds, knownRecipe, publicKitchenRecipes, readyMealPrices, starterRecipes} from '../src/kitchenCatalog.js';

test('Twenty-one recipes with nine new originals; all have unique ingredient combinations', () => {
    assert.equal(Object.keys(kitchenRecipes).length,21);
    assert.equal(legacyRecipeIds.length,12);
    const combinations = new Set(Object.values(kitchenRecipes).map(recipe => Object.keys(recipe.ingredients).sort().join('|')));
    assert.equal(combinations.size,21);
    assert.equal(starterRecipes.length,6);
    for (const recipe of Object.values(kitchenRecipes)) {
        assert.ok(recipe.steps.length>=3);
        assert.ok(Object.entries(recipe.ingredients).every(([ingredient,amount]) => kitchenPrices[ingredient]>0 && amount>0));
    }
});

test('Discovery is deterministic, order independent and never driven by chance', () => {
    assert.equal(findRecipeByIngredients(['milk','berries','sugar']),'strawberry_milkshake');
    assert.equal(findRecipeByIngredients(['sugar','milk','berries']),'strawberry_milkshake');
    assert.equal(findRecipeByIngredients(['milk','berries','banana']),null);
    assert.equal(findRecipeByIngredients(['milk','berries','berries']),null);
});

test('Only known recipes expose ingredient names and cooking steps to clients', () => {
    const catalog = publicKitchenRecipes([]);
    assert.equal(catalog.berry_parfait.discovered,true);
    assert.equal(catalog.moon_cookies.discovered,false);
    assert.deepEqual(catalog.moon_cookies.ingredients,{});
    assert.deepEqual(catalog.moon_cookies.steps,[]);
    assert.equal(knownRecipe('moon_cookies',['moon_cookies']),true);
    assert.equal(publicKitchenRecipes(['moon_cookies']).moon_cookies.discovered,true);
});

test('Ready-made meals cost twice their ingredient value', () => {
    for (const [id,recipe] of Object.entries(kitchenRecipes)) {
        const cost = Object.entries(recipe.ingredients).reduce((sum,[ingredient,qty]) => sum+kitchenPrices[ingredient]*qty,0);
        assert.equal(readyMealPrices[id],cost*2);
    }
});

test('Cooking ratings are bounded by thresholds', () => {
    assert.equal(cookingRating(0),'Messy');
    assert.equal(cookingRating(49),'Messy');
    assert.equal(cookingRating(50),'Good');
    assert.equal(cookingRating(75),'Great');
    assert.equal(cookingRating(90),'Perfect');
});
