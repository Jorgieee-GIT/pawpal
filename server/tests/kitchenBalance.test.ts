import assert from "node:assert/strict";
import { test } from "node:test";
import { kitchenRecipes, publicKitchenRecipes } from "../src/kitchenCatalog.js";

const extraGames = new Set(["roll", "catch", "stove", "season"]);

test("All four additional cooking games appear in relevant recipe preparation steps", () => {
    const seen = new Set<string>();

    for (const recipe of Object.values(kitchenRecipes)) {
        assert.ok(recipe.steps.length >= 3 && recipe.steps.length <= 5, recipe.name);

        for (const step of recipe.steps) {
            if (extraGames.has(step)) {
                seen.add(step);
            }
        }
    }

    assert.deepEqual(seen, extraGames);
});

test("All twenty-one meals have modest pet benefits and lower serving XP", () => {
    assert.equal(Object.keys(kitchenRecipes).length, 21);

    for (const recipe of Object.values(kitchenRecipes)) {
        assert.ok(recipe.hunger > 0 && recipe.hunger <= 28, recipe.name);
        assert.ok(recipe.happiness >= 0 && recipe.happiness <= 19, recipe.name);
        assert.ok(recipe.energy >= 0 && recipe.energy <= 9, recipe.name);
        assert.ok(recipe.xp > 0 && recipe.xp <= 27, recipe.name);
    }
});

test("Backend recipe benefits and steps are consistent with the public catalog", () => {
    const publicRecipes = publicKitchenRecipes(Object.keys(kitchenRecipes));

    for (const [id, recipe] of Object.entries(kitchenRecipes)) {
        const published = publicRecipes[id];
        assert.deepEqual(published.steps, recipe.steps);
        assert.equal(published.hunger, recipe.hunger);
        assert.equal(published.happiness, recipe.happiness);
        assert.equal(published.energy, recipe.energy);
        assert.equal(published.xp, recipe.xp);
    }
});
