/** PawPal Kitchen catalogue: the single server-authoritative source for recipes and discovery. */
export type KitchenRecipe = {
    name: string;
    ingredients: Record<string, number>;
    steps: string[];
    hunger: number;
    happiness: number;
    energy: number;
    xp: number;
    hint: string;
    tier: "starter" | "discovery";
};

export const kitchenRecipes: Record<string, KitchenRecipe> = {
    berry_parfait: {
        name: "Berry Parfait",
        ingredients: {
            berries: 2,
            milk: 1
        },
        steps: ["catch", "wash", "mix", "chill"],
        hunger: 12,
        happiness: 8,
        energy: 0,
        xp: 9,
        hint: "A creamy treat layered with bright red berries.",
        tier: "starter"
    },
    cloud_pancakes: {
        name: "Cloud Pancakes",
        ingredients: {
            flour: 2,
            milk: 1,
            berries: 1
        },
        steps: ["mix", "cook", "plate"],
        hunger: 19,
        happiness: 5,
        energy: 2,
        xp: 13,
        hint: "Fluffy golden rounds topped with berries.",
        tier: "starter"
    },
    cozy_soup: {
        name: "Cozy Soup",
        ingredients: {
            carrot: 2,
            milk: 1
        },
        steps: ["chop", "simmer", "season", "serve"],
        hunger: 17,
        happiness: 3,
        energy: 7,
        xp: 11,
        hint: "A warm bowl with orange vegetables and something creamy.",
        tier: "starter"
    },
    moon_cookies: {
        name: "Moon Cookies",
        ingredients: {
            flour: 2,
            berries: 1
        },
        steps: ["mix", "roll", "bake", "decorate"],
        hunger: 10,
        happiness: 12,
        energy: 0,
        xp: 14,
        hint: "A baked sweet combining flour and a bright red fruit.",
        tier: "discovery"
    },
    honey_toast: {
        name: "Honey Toast",
        ingredients: {
            bread: 2,
            honey: 1,
            butter: 1
        },
        steps: ["mix", "cook", "plate"],
        hunger: 17,
        happiness: 8,
        energy: 3,
        xp: 15,
        hint: "Warm bread, golden sweetness, and a buttery finish.",
        tier: "starter"
    },
    starry_omelet: {
        name: "Starry Omelet",
        ingredients: {
            egg: 2,
            cheese: 1,
            butter: 1
        },
        steps: ["mix", "stove", "serve"],
        hunger: 20,
        happiness: 6,
        energy: 5,
        xp: 17,
        hint: "A fluffy egg dish with melted cheese and butter.",
        tier: "starter"
    },
    peach_smoothie: {
        name: "Peach Smoothie",
        ingredients: {
            peach: 2,
            milk: 1,
            honey: 1
        },
        steps: ["wash", "mix", "chill"],
        hunger: 12,
        happiness: 12,
        energy: 4,
        xp: 16,
        hint: "A chilly drink made from a fuzzy fruit, milk, and honey.",
        tier: "discovery"
    },
    pumpkin_pie: {
        name: "Pumpkin Pie",
        ingredients: {
            pumpkin: 2,
            flour: 2,
            butter: 1
        },
        steps: ["chop", "roll", "mix", "bake", "decorate"],
        hunger: 23,
        happiness: 12,
        energy: 0,
        xp: 22,
        hint: "Autumn squash baked with flour and rich butter.",
        tier: "discovery"
    },
    garden_salad: {
        name: "Garden Salad",
        ingredients: {
            lettuce: 2,
            carrot: 1,
            tomato: 2
        },
        steps: ["catch", "wash", "chop", "mix", "plate"],
        hunger: 15,
        happiness: 7,
        energy: 8,
        xp: 19,
        hint: "Crunchy greens mixed with orange and red vegetables.",
        tier: "starter"
    },
    cheesy_pasta: {
        name: "Cheesy Pasta",
        ingredients: {
            pasta: 2,
            cheese: 2,
            tomato: 1
        },
        steps: ["chop", "stove", "mix", "serve"],
        hunger: 25,
        happiness: 9,
        energy: 4,
        xp: 22,
        hint: "Twisty pasta, tangy tomatoes, and cheese.",
        tier: "discovery"
    },
    starlight_cake: {
        name: "Starlight Cake",
        ingredients: {
            flour: 2,
            egg: 2,
            milk: 1,
            honey: 1
        },
        steps: ["mix", "bake", "chill", "decorate"],
        hunger: 24,
        happiness: 16,
        energy: 2,
        xp: 26,
        hint: "A celebration bake needing flour, eggs, milk, and honey.",
        tier: "discovery"
    },
    moonlight_ramen: {
        name: "Moonlight Ramen",
        ingredients: {
            noodles: 2,
            egg: 1,
            carrot: 1
        },
        steps: ["chop", "simmer", "stove", "serve"],
        hunger: 27,
        happiness: 10,
        energy: 6,
        xp: 25,
        hint: "A comforting noodle bowl with an egg and orange vegetable.",
        tier: "discovery"
    },
    strawberry_milkshake: {
        name: "Strawberry Milkshake",
        ingredients: {
            berries: 2,
            milk: 1,
            sugar: 1
        },
        steps: ["wash", "mix", "chill"],
        hunger: 11,
        happiness: 13,
        energy: 2,
        xp: 17,
        hint: "A creamy pink drink made with berries, milk, and something sweet.",
        tier: "discovery"
    },
    banana_crepes: {
        name: "Banana Crêpes",
        ingredients: {
            banana: 2,
            flour: 1,
            egg: 1
        },
        steps: ["mix", "roll", "cook", "plate"],
        hunger: 21,
        happiness: 12,
        energy: 4,
        xp: 19,
        hint: "Thin golden pancakes wrapped around a yellow fruit.",
        tier: "discovery"
    },
    tomato_bisque: {
        name: "Tomato Bisque",
        ingredients: {
            tomato: 2,
            milk: 1,
            butter: 1
        },
        steps: ["chop", "simmer", "season", "serve"],
        hunger: 18,
        happiness: 8,
        energy: 6,
        xp: 19,
        hint: "Silky red soup enriched with dairy and butter.",
        tier: "discovery"
    },
    cheese_biscuits: {
        name: "Cheese Biscuits",
        ingredients: {
            flour: 2,
            cheese: 1,
            butter: 1
        },
        steps: ["mix", "roll", "bake", "plate"],
        hunger: 20,
        happiness: 10,
        energy: 2,
        xp: 20,
        hint: "A flaky savory bake made with flour, cheese, and butter.",
        tier: "discovery"
    },
    berry_muffins: {
        name: "Berry Muffins",
        ingredients: {
            berries: 2,
            flour: 1,
            egg: 1,
            sugar: 1
        },
        steps: ["mix", "bake", "decorate"],
        hunger: 19,
        happiness: 13,
        energy: 1,
        xp: 22,
        hint: "Little sweet cakes full of berries, eggs, flour, and sugar.",
        tier: "discovery"
    },
    pumpkin_gnocchi: {
        name: "Pumpkin Gnocchi",
        ingredients: {
            pumpkin: 2,
            flour: 1,
            cheese: 1
        },
        steps: ["chop", "simmer", "season", "plate"],
        hunger: 23,
        happiness: 9,
        energy: 4,
        xp: 22,
        hint: "Soft orange dumplings, made with squash, flour, and cheese.",
        tier: "discovery"
    },
    honey_custard: {
        name: "Honey Custard",
        ingredients: {
            egg: 2,
            milk: 1,
            honey: 1,
            sugar: 1
        },
        steps: ["mix", "bake", "chill"],
        hunger: 15,
        happiness: 15,
        energy: 2,
        xp: 22,
        hint: "A silky golden dessert of eggs, milk, honey, and sugar.",
        tier: "discovery"
    },
    starlight_sundae: {
        name: "Starlight Sundae",
        ingredients: {
            banana: 1,
            berries: 1,
            milk: 1,
            cocoa: 1
        },
        steps: ["catch", "chill", "decorate", "plate"],
        hunger: 17,
        happiness: 19,
        energy: 4,
        xp: 26,
        hint: "A four-part frozen treat: yellow fruit, berries, milk, and chocolate.",
        tier: "discovery"
    },
    cocoa_brownies: {
        name: "Cocoa Brownies",
        ingredients: {
            cocoa: 2,
            flour: 1,
            egg: 1,
            sugar: 1
        },
        steps: ["mix", "bake", "decorate"],
        hunger: 19,
        happiness: 15,
        energy: 2,
        xp: 24,
        hint: "Rich chocolate squares baked with flour, eggs, and sugar.",
        tier: "discovery"
    }
};

export const kitchenPrices: Record<string, number> = {
    berries: 24,
    milk: 20,
    flour: 18,
    carrot: 16,
    bread: 22,
    honey: 35,
    butter: 26,
    egg: 30,
    cheese: 38,
    peach: 32,
    pumpkin: 28,
    lettuce: 18,
    tomato: 23,
    pasta: 34,
    noodles: 36,
    banana: 25,
    sugar: 17,
    cocoa: 33
};

export const starterRecipes = Object.entries(kitchenRecipes)
    .filter(([, recipe]) => recipe.tier === "starter")
    .map(([id]) => id);

export const legacyRecipeIds = Object.keys(kitchenRecipes).slice(0, 12);

export const readyMealPrices: Record<string, number> = Object.fromEntries(
    Object.entries(kitchenRecipes).map(([id, recipe]) => [
        id,
        2 * Object.entries(recipe.ingredients).reduce((total, [ingredient, amount]) => total + kitchenPrices[ingredient] * amount, 0)
    ])
);

/** Exact ingredient *types* matter for discovery, but their order and stack sizes do not. */
/*
 * DOCU: Find recipe by ingredients for this feature.
 * @param {string[]} items - items value used by this function
 * @returns {string | null} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function findRecipeByIngredients(items: string[]): string | null {
    if (new Set(items).size !== items.length) {
        return null;
    }
    const chosen = [...new Set(items)].sort().join("|");
    for (const [id, recipe] of Object.entries(kitchenRecipes)) {
        if (Object.keys(recipe.ingredients).sort().join("|") === chosen) {
            return id;
        }
    }
    return null;
}

/*
 * DOCU: Handle known recipe behavior for this feature.
 * @param {string} id - Identifier of the record or item being handled
 * @param {string[]} discovered - discovered value used by this function
 * @returns {boolean} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function knownRecipe(id: string, discovered: string[]): boolean {
    return starterRecipes.includes(id) || discovered.includes(id);
}

/*
 * DOCU: Build the kitchen recipe catalog returned to the client.
 * @param {string[]} discovered - discovered value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function publicKitchenRecipes(discovered: string[]) {
    return Object.fromEntries(Object.entries(kitchenRecipes).map(([id, recipe]) => [
        id,
        {
            name: knownRecipe(id, discovered) ? recipe.name : "??? Mystery Recipe",
            ingredients: knownRecipe(id, discovered) ? recipe.ingredients : {},
            steps: knownRecipe(id, discovered) ? recipe.steps : [],
            hunger: recipe.hunger,
            happiness: recipe.happiness,
            energy: recipe.energy,
            xp: recipe.xp,
            hint: recipe.hint,
            tier: recipe.tier,
            ingredientCount: Object.keys(recipe.ingredients).length,
            discovered: knownRecipe(id, discovered)
        }
    ]));
}

/*
 * DOCU: Handle cooking rating behavior for this feature.
 * @param {number} score - score value used by this function
 * @returns {"Perfect" | "Great" | "Good" | "Messy"} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function cookingRating(score: number): "Perfect" | "Great" | "Good" | "Messy" {
    return score >= 90 ? "Perfect" : score >= 75 ? "Great" : score >= 50 ? "Good" : "Messy";
}
