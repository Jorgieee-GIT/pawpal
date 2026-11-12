import "dotenv/config";
import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { addedBreedsBySpecies, breedsBySpecies, catalog, uniqueCosmeticsBySpecies } from "./petCatalog.js";
import { FURNITURE_BY_ROOM } from "./furnitureCatalog.js";
import { kitchenPrices, kitchenRecipes } from "./kitchenCatalog.js";
import { pawMailDesigns } from "./mailCatalog.js";
import { pool } from "./db.js";

const sandboxNames = ["pawpal_test1", "pawpal_test2"] as const;
const species = ["cat", "dog"] as const;
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const enableToken = "PAWPAL_ENABLE_SANDBOX_SEED";

function assertLocalSandboxTarget() {
    if (process.env[enableToken] !== "YES" || !process.argv.includes("--seed-local-sandbox")) {
        throw new Error(`Refusing to seed. Set ${enableToken}=YES and pass --seed-local-sandbox explicitly.`);
    }
    if (process.env.NODE_ENV === "production") {
        throw new Error("Sandbox accounts can only be seeded outside production.");
    }
    const url = new URL(process.env.DATABASE_URL || "");
    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
        throw new Error("Sandbox seeding requires a PostgreSQL URL.");
    }
    if (!localHosts.has(url.hostname.toLowerCase())) {
        throw new Error("Refusing to seed a non-local database. Use a local QA PostgreSQL database only.");
    }
}

async function main() {
    assertLocalSandboxTarget();
    const credentials = sandboxNames.map(username => ({ username, password: randomBytes(18).toString("base64url") }));
    const allFurniture = [...new Set([
        ...Object.values(FURNITURE_BY_ROOM).flatMap(room => Object.keys(room)),
        ...Object.entries(catalog)
            .filter(([, item]) => item.type === "furniture" || item.type === "theme")
            .map(([id]) => id)
    ])];
    const allColors = Object.entries(catalog).filter(([, item]) => item.type === "color").map(([id]) => id);
    const foodStock = Object.fromEntries(Object.keys(kitchenPrices).map(id => [id, 999]));
    const mealStock = Object.fromEntries(Object.keys(kitchenRecipes).map(id => [id, 99]));
    const metrics = [
        "feed", "play", "sleep", "bathe", "cuddle", "arcade", "claw", "plant", "harvest", "water",
        "cook", "serve", "buy", "meal_buy", "mail", "outfit", "atmosphere", "furniture", "room",
        "memory", "dino", "runner", "pattern", "mole", "brawl", "gift", "note", "daily_surprise", "friend"
    ];

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const seeded: Array<{ id: string; username: string }> = [];
        for (let index = 0; index < credentials.length; index++) {
            const account = credentials[index];
            const userId = randomUUID();
            const passwordHash = await bcrypt.hash(account.password, 12);
            const user = await client.query(
                `INSERT INTO users(id,username,email,password_hash)
                 VALUES($1,$2,NULL,$3)
                 ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash,auth_version=users.auth_version+1
                 RETURNING id`,
                [userId, account.username, passwordHash]
            );
            const id = String(user.rows[0].id);
            await client.query(
                `INSERT INTO admin_user_access(user_id,suspended,lucky_games_access,disabled_features)
                 VALUES($1,false,true,'[]'::jsonb)
                 ON CONFLICT(user_id) DO UPDATE SET suspended=false,lucky_games_access=true,disabled_features='[]'::jsonb`,
                [id]
            );
            const petSpecies = species[index];
            const petBreeds = ["classic", ...(breedsBySpecies[petSpecies] || []), ...(addedBreedsBySpecies[petSpecies] || [])];
            const ownedCosmetics = ["none", ...Object.entries(catalog)
                .filter(([cosmeticId, item]) => item.type === "cosmetic" &&
                    !(Object.values(uniqueCosmeticsBySpecies).flat().includes(cosmeticId)) &&
                    !uniqueCosmeticsBySpecies[petSpecies]?.includes(cosmeticId))
                .map(([cosmeticId]) => cosmeticId), ...(uniqueCosmeticsBySpecies[petSpecies] || [])];
            const ownedColors = ["classic", ...allColors];
            const ownedItems = ["basic_sofa", ...allFurniture];
            const petId = randomUUID();
            await client.query(
                `INSERT INTO pets(id,owner_id,name,species,breed,color,owned_colors,owned_breeds,owned_cosmetics,
                    owned_items,placed_items,unlocked_rooms,active_room,room_theme,coins,xp,level,food,toys,hunger,happiness,
                    energy,cleanliness,affection,garden)
                 VALUES($1,$2,$3,$4,'classic','classic',$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,
                    '["basic_sofa"]'::jsonb,'["living","bedroom","studio","sports"]'::jsonb,'living','blush',
                    1000000000,0,50,999,999,100,100,100,100,100,'{"seeds":999,"flowers":999,"planted_at":null}'::jsonb)
                 ON CONFLICT(owner_id) WHERE owner_id IS NOT NULL DO UPDATE SET
                    name=EXCLUDED.name,species=EXCLUDED.species,breed='classic',color='classic',
                    owned_colors=EXCLUDED.owned_colors,owned_breeds=EXCLUDED.owned_breeds,
                    owned_cosmetics=EXCLUDED.owned_cosmetics,owned_items=EXCLUDED.owned_items,
                    unlocked_rooms=EXCLUDED.unlocked_rooms,active_room='living',room_theme='blush',
                    coins=1000000000,xp=0,level=50,food=999,toys=999,hunger=100,happiness=100,
                    energy=100,cleanliness=100,affection=100,garden=EXCLUDED.garden,updated_at=NOW()`,
                [petId, id, `Test Pet ${index + 1}`, petSpecies, JSON.stringify(ownedColors), JSON.stringify(petBreeds),
                    JSON.stringify(ownedCosmetics), JSON.stringify(ownedItems)]
            );
            await client.query(
                `INSERT INTO pet_kitchens(user_id,ingredients,meals,active_recipe,recipe_step,cooking_started_at,
                    discovered_recipes,recipe_records,step_scores)
                 VALUES($1,$2::jsonb,$3::jsonb,NULL,0,NULL,$4::jsonb,'{}'::jsonb,'{}'::jsonb)
                 ON CONFLICT(user_id) DO UPDATE SET ingredients=EXCLUDED.ingredients,meals=EXCLUDED.meals,
                    active_recipe=NULL,recipe_step=0,cooking_started_at=NULL,
                    discovered_recipes=EXCLUDED.discovered_recipes,recipe_records='{}'::jsonb,step_scores='{}'::jsonb`,
                [id, JSON.stringify(foodStock), JSON.stringify(mealStock), JSON.stringify(Object.keys(kitchenRecipes))]
            );
            await client.query("DELETE FROM paw_mail_envelopes WHERE user_id=$1", [id]);
            await client.query(
                `INSERT INTO paw_mail_envelopes(user_id,design) SELECT $1,UNNEST($2::text[])
                 ON CONFLICT DO NOTHING`,
                [id, pawMailDesigns]
            );
            await client.query("DELETE FROM mission_events WHERE user_id=$1", [id]);
            await client.query("DELETE FROM mission_claims WHERE user_id=$1", [id]);
            await client.query(
                `INSERT INTO mission_events(user_id,metric,amount)
                 SELECT $1,m.metric,100 FROM UNNEST($2::text[]) AS m(metric)`,
                [id, metrics]
            );
            await client.query(
                `INSERT INTO achievements(user_id,code) VALUES($1,'level_5'),($1,'rich'),($1,'first_friend')
                 ON CONFLICT DO NOTHING`, [id]
            );
            seeded.push({ id, username: account.username });
        }
        await client.query(
            "DELETE FROM friendships WHERE requester_id=ANY($1::uuid[]) OR recipient_id=ANY($1::uuid[])",
            [seeded.map(account => account.id)]
        );
        await client.query(
            `INSERT INTO friendships(requester_id,recipient_id,status)
             VALUES($1,$2,'accepted') ON CONFLICT(requester_id,recipient_id) DO UPDATE SET status='accepted'`,
            [seeded[0].id, seeded[1].id]
        );
        await client.query("COMMIT");
        console.log("Created local PawPal multiplayer sandbox accounts:");
        credentials.forEach(account => console.log(`${account.username} / ${account.password}`));
        console.log("Both accounts are accepted friends with level 50 pets, complete inventories, high coin balances, and completed mission progress.");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : "Sandbox seeding failed.");
    process.exitCode = 1;
});
