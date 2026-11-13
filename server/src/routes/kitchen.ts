import type { Express } from "express";
import { auth } from "../auth.js";
import { pool } from "../db.js";
import { handle } from "../http.js";
import {
    cookingRating,
    findRecipeByIngredients,
    kitchenPrices,
    kitchenRecipes,
    knownRecipe,
    publicKitchenRecipes,
    readyMealPrices
} from "../kitchenCatalog.js";
import { publishLive } from "../live.js";
import { recordMissionEvent } from "../missions.js";
import { clamp } from "../petState.js";

/*
 * DOCU: Register kitchen routes for this feature.
 * @param {Express} app - app value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function registerKitchenRoutes(app: Express) {
    // Kitchen 3: recipe discovery is deterministic and all inventory changes are transactional.
    app.get("/api/kitchen", auth, handle(async (req, res) => {
        const q = await pool.query(
            "SELECT ingredients,meals,active_recipe,recipe_step,cooking_started_at,discovered_recipes,recipe_records,step_scores FROM pet_kitchens WHERE user_id=$1",
            [req.userId]
        );
        const kitchen = q.rows[0] || {
            ingredients: {},
            meals: {},
            active_recipe: null,
            recipe_step: 0,
            cooking_started_at: null,
            discovered_recipes: [],
            recipe_records: {},
            step_scores: []
        };
        const discovered = Array.isArray(kitchen.discovered_recipes)
            ? kitchen.discovered_recipes
            : [];
        res.json({
            kitchen,
            recipes: publicKitchenRecipes(discovered),
            prices: kitchenPrices,
            mealPrices: readyMealPrices
        });
    }));

    app.post("/api/kitchen", auth, handle(async (req, res) => {
        const action = String(req.body?.action || "");
        const item = String(req.body?.item || "");
        const quantity = Number(req.body?.quantity ?? 1);
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const petQ = await client.query(
                "SELECT id,coins,hunger,happiness,energy,xp,level FROM pets WHERE owner_id=$1 FOR UPDATE",
                [req.userId]
            );
            if (!petQ.rows[0]) {
                await client.query("ROLLBACK");
                return void res.status(404).json({
                    error: "Adopt a pet first."
                });
            }
            await client.query(
                "INSERT INTO pet_kitchens(user_id) VALUES($1) ON CONFLICT DO NOTHING",
                [req.userId]
            );
            const kitchenQ = await client.query(
                "SELECT * FROM pet_kitchens WHERE user_id=$1 FOR UPDATE",
                [req.userId]
            );
            const k = kitchenQ.rows[0];
            const ingredients: Record<string, number> = {
                ...k.ingredients
            };
            const meals: Record<string, number> = {
                ...k.meals
            };
            const discovered: string[] = Array.isArray(k.discovered_recipes)
                ? [...k.discovered_recipes]
                : [];
            const records: Record<
                string,
                {
                    cooked: number;
                    best: number;
                }
            > = {
                ...k.recipe_records
            };
            let scores: number[] = Array.isArray(k.step_scores) ? [...k.step_scores] : [];
            let active: string | null = k.active_recipe;
            let step = Number(k.recipe_step) || 0;
            let started = k.cooking_started_at;
            let message = "";
            let coinDelta = 0;
            let result: {
                recipeId: string;
                name: string;
                score: number;
                rating: string;
                firstTime: boolean;
            } | null = null;
            let stats: {
                hunger: number;
                happiness: number;
                energy: number;
                xp: number;
                level: number;
            } | null = null;
                        /*
             * DOCU: Handle fail behavior for this feature.
             * @param {string} error - Error details to handle or display
             *
             * Last Updated: 2026-11-13
             * Author: Jorge
             * Last Updated By: Jorge
             */
const fail = async (error: string) => {
                await client.query("ROLLBACK");
                res.status(400).json({
                    error
                });
            };
            if (action === "buy") {
                if (
                    !Object.hasOwn(kitchenPrices, item) ||
                    !Number.isSafeInteger(quantity) ||
                    quantity < 1 ||
                    quantity > 20
                ) {
                    return void (await fail(
                        "Choose an ingredient and a quantity from 1 to 20."
                    ));
                }
                const cost = kitchenPrices[item] * quantity;
                if (petQ.rows[0].coins < cost) {
                    return void (await fail("Not enough coins."));
                }
                coinDelta = -cost;
                ingredients[item] = (ingredients[item] || 0) + quantity;
                message = `Purchased ${quantity} ${item}!`;
            } else if (action === "buy_meal") {
                const recipe = kitchenRecipes[item];
                if (!recipe) {
                    return void (await fail("Unknown meal."));
                }
                if (!knownRecipe(item, discovered)) {
                    return void (await fail(
                        "Discover this recipe before buying a ready-made serving."
                    ));
                }
                if (quantity !== 1) {
                    return void (await fail("Buy one ready-made meal at a time."));
                }
                const cost = readyMealPrices[item];
                if (petQ.rows[0].coins < cost) {
                    return void (await fail("Not enough Paw Coins."));
                }
                coinDelta = -cost;
                meals[item] = (meals[item] || 0) + 1;
                message = `Bought ${recipe.name} for ${cost} Paw Coins! Ready in your pantry.`;
            } else if (action === "experiment") {
                if (active) {
                    return void (await fail("Finish your current meal before experimenting."));
                }
                const selected: unknown = req.body?.ingredients;
                if (
                    !Array.isArray(selected) ||
                    selected.length < 2 ||
                    selected.length > 4 ||
                    !selected.every(
                        (v) => typeof v === "string" && Object.hasOwn(kitchenPrices, v)
                    ) ||
                    new Set(selected).size !== selected.length
                ) {
                    return void (await fail("Select 2 to 4 different ingredients."));
                }
                const chosen = selected as string[];
                if (chosen.some((id) => (ingredients[id] || 0) < 1)) {
                    return void (await fail(
                        "You need at least one of each selected ingredient."
                    ));
                }
                const match = findRecipeByIngredients(chosen);
                if (match && knownRecipe(match, discovered)) {
                    message = `You already know ${kitchenRecipes[match].name}! Find it in your Recipe Book. No ingredients used.`;
                } else if (match) {
                    // Discovery uses exactly one unit of each selected ingredient, not the whole recipe cost.
                    for (const id of chosen) {
                        ingredients[id]--;
                    }
                    discovered.push(match);
                    message = `New recipe discovered: ${kitchenRecipes[match].name}! Added to your Recipe Book.`;
                    result = {
                        recipeId: match,
                        name: kitchenRecipes[match].name,
                        score: 0,
                        rating: "Discovery",
                        firstTime: true
                    };
                } else {
                    // A failed try consumes ONE ingredient, never the entire selected combination.
                    const spent = [...chosen].sort(
                        (a, b) => kitchenPrices[a] - kitchenPrices[b]
                    )[0];
                    ingredients[spent]--;
                    message = `Nothing quite came together. Used 1 ${spent}; the other ingredients were saved. Try a Recipe Book clue!`;
                }
            } else if (action === "start") {
                const recipe = kitchenRecipes[item];
                if (!recipe) {
                    return void (await fail("Unknown recipe."));
                }
                if (!knownRecipe(item, discovered)) {
                    return void (await fail(
                        "Discover this recipe in the Experiment Station first."
                    ));
                }
                if (active) {
                    return void (await fail("Finish your current recipe first."));
                }
                for (const [ingredient, amount] of Object.entries(recipe.ingredients)) {
                    if ((ingredients[ingredient] || 0) < amount) {
                        return void (await fail("Not enough ingredients for this recipe."));
                    }
                }
                for (const [ingredient, amount] of Object.entries(recipe.ingredients)) {
                    ingredients[ingredient] -= amount;
                }
                active = item;
                step = 0;
                scores = [];
                started = new Date();
                message = `Started ${recipe.name}!`;
            } else if (action === "step") {
                if (!active || !kitchenRecipes[active]) {
                    return void (await fail("Start a recipe first."));
                }
                const recipe = kitchenRecipes[active];
                const expected = recipe.steps[step];
                if (item !== expected) {
                    return void (await fail(
                        "Not quite! Choose the correct next cooking step."
                    ));
                }
                const score = Number(req.body?.score);
                if (!Number.isInteger(score) || score < 0 || score > 100) {
                    return void (await fail("Invalid cooking result."));
                }
                // Time limit reduces instant API completion; score is cosmetic, never a source of coins or XP.
                if (!started || Date.now() - new Date(started).getTime() < 2200) {
                    return void (await fail("Give this cooking step a little more time."));
                }
                scores.push(score);
                step++;
                started = new Date();
                message = `${expected} complete!`;
                if (step >= recipe.steps.length) {
                    meals[active] = (meals[active] || 0) + 1;
                    const average = Math.round(
                        scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length)
                    );
                    const prior = records[active] || {
                        cooked: 0,
                        best: 0
                    };
                    records[active] = {
                        cooked: Math.max(0, prior.cooked) + 1,
                        best: Math.max(prior.best || 0, average)
                    };
                    result = {
                        recipeId: active,
                        name: recipe.name,
                        score: average,
                        rating: cookingRating(average),
                        firstTime: prior.cooked === 0
                    };
                    message = `${recipe.name} is ready! ${cookingRating(average)} cooking · added to your pantry.`;
                    active = null;
                    step = 0;
                    scores = [];
                    started = null;
                }
            } else if (action === "serve") {
                const recipe = kitchenRecipes[item];
                if (!recipe || !(meals[item] > 0)) {
                    return void (await fail("Cook this meal before serving it."));
                }
                meals[item]--;
                const pet = petQ.rows[0];
                let xp = pet.xp + recipe.xp;
                let level = pet.level;
                let earnedCoins = 0;
                while (xp >= level * 100) {
                    xp -= level * 100;
                    level++;
                    earnedCoins += 60;
                }
                coinDelta = earnedCoins;
                stats = {
                    hunger: clamp(pet.hunger + recipe.hunger),
                    happiness: clamp(pet.happiness + recipe.happiness),
                    energy: clamp(pet.energy + recipe.energy),
                    xp,
                    level
                };
                message = `Served ${recipe.name}! +${recipe.xp} XP`;
            } else {
                return void (await fail("Unknown kitchen action."));
            }
            await client.query(
                `UPDATE pet_kitchens SET ingredients=$2::jsonb,meals=$3::jsonb,active_recipe=$4,recipe_step=$5,cooking_started_at=$6,discovered_recipes=$7::jsonb,recipe_records=$8::jsonb,step_scores=$9::jsonb WHERE user_id=$1`,
                [
                    req.userId,
                    JSON.stringify(ingredients),
                    JSON.stringify(meals),
                    active,
                    step,
                    started,
                    JSON.stringify(discovered),
                    JSON.stringify(records),
                    JSON.stringify(scores)
                ]
            );
            if (stats) {
                await client.query(
                    "UPDATE pets SET coins=coins+$2,hunger=$3,happiness=$4,energy=$5,xp=$6,level=$7,updated_at=NOW() WHERE owner_id=$1",
                    [
                        req.userId,
                        coinDelta,
                        stats.hunger,
                        stats.happiness,
                        stats.energy,
                        stats.xp,
                        stats.level
                    ]
                );
            } else if (coinDelta) {
                await client.query("UPDATE pets SET coins=coins+$2 WHERE owner_id=$1", [
                    req.userId,
                    coinDelta
                ]);
            }
            if (
                action === "buy" ||
                action === "buy_meal" ||
                action === "serve" ||
                (action === "step" && !active)
            ) {
                await recordMissionEvent(
                    client,
                    req.userId,
                    action === "buy"
                        ? "buy"
                        : action === "buy_meal"
                            ? "meal_buy"
                            : action === "serve"
                            ? "serve"
                            : "cook"
                );
                if (action === "buy_meal") {
                    await recordMissionEvent(client, req.userId, "buy");
                }
            }
            await client.query("COMMIT");
            publishLive([String(req.userId)], "kitchen_updated");
            const kitchen = {
                ingredients,
                meals,
                active_recipe: active,
                recipe_step: step,
                cooking_started_at: started,
                discovered_recipes: discovered,
                recipe_records: records,
                step_scores: scores
            };
            res.json({
                message,
                kitchen,
                recipes: publicKitchenRecipes(discovered),
                result
            });
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }));
}
