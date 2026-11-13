import { pool } from "./db.js";
import { publicPetGarden } from "./gardenRules.js";
import { publishLive, publishPetToFriends } from "./live.js";
import { recordMissionEvent } from "./missions.js";
import { catalog } from "./petCatalog.js";
import { logSafeError } from "./security.js";

export const fields =
    "id,owner_id,name,species,breed,color,owned_colors,owned_breeds,hunger,happiness,energy,cleanliness,coins,xp,level,food,toys,owned_cosmetics,equipped_cosmetic,equipped_outfit,room_theme,active_room,unlocked_rooms,room_layouts,owned_items,placed_items,garden,last_daily,daily_claimed_at,last_game_at,created_at,updated_at";

export const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// Keep the decay clock separate from updated_at: purchases, care actions and
// profile refreshes must not restart the countdown. Store fractional progress
// in the existing garden JSON so no database migration is necessary.
export function applyPetDecay(p: any) {
    const now = Date.now();
    const stored = Number(p.garden?._decay_at);
    const fallback = new Date(p.updated_at).getTime();
    const previous =
        Number.isFinite(stored) && stored > 0 ? stored : Number.isFinite(fallback) ? fallback : now;
    // Do not cap elapsed time: pets must change even after several offline days.
    const elapsed = Math.max(0, now - previous);
    const sleeping = !!p.garden?._sleeping;
    const rate = sleeping ? 0.75 : 1;
    const carry = {
        ...(p.garden?._decay_carry || {})
    };
    const take = (name: string, amount: number) => {
        const total = Math.max(0, Number(carry[name] || 0)) + amount;
        const whole = Math.floor(total);
        carry[name] = total - whole;
        return whole;
    };
    // All four stats advance against server elapsed time, regardless of whether
    // the browser was open. Fractional progress is preserved between requests.
    const tenMinuteSteps = elapsed / 600000;
    p.hunger = clamp(p.hunger - take("hunger", tenMinuteSteps * rate));
    p.happiness = clamp(p.happiness - take("happiness", (tenMinuteSteps * rate) / 2));
    p.cleanliness = clamp(p.cleanliness - take("cleanliness", (tenMinuteSteps * rate) / 2));
    // Awake: -1 Energy / 10 min. Sleeping: +5 Energy / minute,
    // meaning 0 -> 100 in exactly 20 minutes of accumulated sleep.
    p.energy = clamp(
        p.energy +
            (sleeping
                ? take("sleep_energy", (elapsed / 60000) * 5)
                : -take("awake_energy", tenMinuteSteps))
    );
    p.garden = {
        ...(p.garden || {}),
        _decay_at: now,
        _decay_carry: carry
    };
    return sleeping;
}

// Waking is idempotent. Complete elapsed sleep recovery first, then stop it.
// The row lock makes concurrent activities and sleep toggles consistent.
export async function wakePetForActivity(userId: string) {
    const client = await pool.connect();
    let changed = false;
    try {
        await client.query("BEGIN");
        const result = await client.query(
            `SELECT ${fields} FROM pets WHERE owner_id=$1 FOR UPDATE`,
            [userId]
        );
        const pet = result.rows[0];
        if (pet?.garden?._sleeping) {
            applyPetDecay(pet);
            pet.garden = {
                ...(pet.garden || {}),
                _sleeping: false
            };
            await client.query(
                `UPDATE pets SET hunger=$2,happiness=$3,energy=$4,cleanliness=$5,garden=$6::jsonb,updated_at=NOW() WHERE id=$1`,
                [
                    pet.id,
                    pet.hunger,
                    pet.happiness,
                    pet.energy,
                    pet.cleanliness,
                    JSON.stringify(pet.garden)
                ]
            );
            changed = true;
        }
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
    if (changed) {
        publishLive([userId], "pet_sleep_changed");
        void publishPetToFriends(userId, true).catch((error) => logSafeError("Pet broadcast failed", error));
    }
    return changed;
}

// Browsing, shopping, changing outfits, decorating, social actions, and claiming rewards
// do not interrupt naps. Only activities that require an awake pet wake it.
export function isWakeActivity(path: string, body: any, method: string) {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        return false;
    }
    if (path === "/care") {
        return ["feed", "play", "bathe", "scrub", "pet_stroke", "cuddle"].includes(
            String(body?.action || "")
        );
    }
    if (path === "/kitchen") {
        return body?.action === "serve";
    }
    if (path === "/game" || path === "/claw/play") {
        return true;
    }
    if (/^\/multiplayer\/challenges\/[^/]+\/move$/.test(path)) {
        return true;
    }
    if (/^\/multiplayer\/challenges\/[^/]+\/respond$/.test(path)) {
        return body?.action === "accept";
    }
    return false;
}

export async function mutate(req: any, res: any, fn: (p: any) => string | Promise<string>) {
    const c = await pool.connect();
    try {
        await c.query("BEGIN");
        const q = await c.query(`SELECT ${fields} FROM pets WHERE owner_id=$1 FOR UPDATE`, [
            req.userId
        ]);
        if (!q.rows[0]) {
            await c.query("ROLLBACK");
            return void res.status(404).json({
                error: "Adopt a pet first."
            });
        }
        const p = q.rows[0];
        const previousCoinBalance = Number(p.coins);
        const wasSleepingAtRequest = applyPetDecay(p);
        p._wasSleepingAtRequest = wasSleepingAtRequest;
        const message = await fn(p);
        const action = String(req.body?.action || "");
        const metric =
            req.path === "/api/care"
                ? (
                      {
                          feed: "feed",
                          play: "play",
                          sleep: "sleep",
                          bathe: "bathe",
                          scrub: "bathe",
                          pet_stroke: "cuddle",
                          cuddle: "cuddle",
                          food: "buy",
                          toy: "buy"
                      } as Record<string, string>
                  )[action]
                : req.path === "/api/garden"
                  ? (
                        {
                            plant: "plant",
                            harvest: "harvest",
                            water: "water",
                            seeds: "buy",
                            buy_water: "buy"
                        } as Record<string, string>
                    )[action]
                  : req.path === "/api/item" && req.body?.mode === "buy"
                    ? "buy"
                    : req.path === "/api/item" &&
                        req.body?.mode === "equip" &&
                        catalog[req.body?.item]?.type === "theme"
                      ? "atmosphere"
                      : req.path === "/api/item" && req.body?.mode === "equip"
                        ? "outfit"
                        : null;
        const failed =
            /^(Buy |Too tired|Not enough|Already |Unknown |Choose |This |That |Unlock |Unlocks |Plant |Your flower|Not ready|All twelve|You need |Please use|Incorrect |Item removed|Look updated)/.test(
                message
            );
        if (metric && !failed) {
            await recordMissionEvent(c, req.userId, metric);
        }
        while (p.xp >= p.level * 100) {
            p.xp -= p.level * 100;
            p.level++;
            p.coins += 60;
        }
        const out = await c.query(
            `UPDATE pets SET hunger=$2,happiness=$3,energy=$4,cleanliness=$5,coins=$6,xp=$7,level=$8,food=$9,toys=$10,owned_cosmetics=$11::jsonb,equipped_cosmetic=$12,owned_colors=$13::jsonb,color=$14,owned_breeds=$15::jsonb,breed=$16,room_theme=$17,owned_items=$18::jsonb,placed_items=$19::jsonb,garden=$20::jsonb,last_daily=$21,last_game_at=$22,equipped_outfit=$23::jsonb,updated_at=NOW() WHERE id=$1 RETURNING ${fields}`,
            [
                p.id,
                p.hunger,
                p.happiness,
                p.energy,
                p.cleanliness,
                p.coins,
                p.xp,
                p.level,
                p.food,
                p.toys,
                JSON.stringify(p.owned_cosmetics),
                p.equipped_cosmetic,
                JSON.stringify(p.owned_colors),
                p.color,
                JSON.stringify(p.owned_breeds),
                p.breed,
                p.room_theme,
                JSON.stringify(p.owned_items),
                JSON.stringify(p.placed_items),
                JSON.stringify(p.garden),
                p.last_daily,
                p.last_game_at,
                JSON.stringify(
                    p.equipped_outfit || {
                        head: null,
                        eyes: null,
                        neck: null,
                        clothes: null
                    }
                )
            ]
        );
        if (Number(p.coins) !== previousCoinBalance) {
            await c.query(
                "INSERT INTO admin_coin_events(user_id,change_amount,source) VALUES($1,$2,$3)",
                [req.userId, Number(p.coins) - previousCoinBalance, req.path + ":" + action]
            );
        }
        await c.query("COMMIT");
        if (req.path === "/api/care" && action === "sleep_toggle") {
            const friends = await pool.query(
                "SELECT CASE WHEN requester_id=$1 THEN recipient_id ELSE requester_id END AS friend_id FROM friendships WHERE status='accepted' AND (requester_id=$1 OR recipient_id=$1)",
                [req.userId]
            );
            publishLive(
                [String(req.userId), ...friends.rows.map((r: any) => String(r.friend_id))],
                "pet_sleep_changed"
            );
        }
        publishLive([String(req.userId)], "pet_updated");
        if (
            req.path === "/api/item" ||
            (req.path === "/api/care" &&
                ["sleep_toggle", "scrub", "pet_stroke", "feed", "play", "bathe", "cuddle"].includes(
                    action
                ))
        ) {
            void publishPetToFriends(
                String(req.userId),
                action === "sleep_toggle" || req.path === "/api/item"
            ).catch((error) => logSafeError("Pet update broadcast failed", error));
        }
        res.json({
            pet: publicPetGarden(out.rows[0]),
            message,
            ...(req.gardenReveal
                ? {
                      gardenReveal: req.gardenReveal
                  }
                : {})
        });
    } catch (e) {
        await c.query("ROLLBACK");
        throw e;
    } finally {
        c.release();
    }
}
