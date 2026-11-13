import type { Express } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { auth } from "../auth.js";
import { pool } from "../db.js";
import { publicPetGarden } from "../gardenRules.js";
import { handle } from "../http.js";
import { publishLive } from "../live.js";
import { recordMissionEvent } from "../missions.js";
import { applyPetDecay, clamp, fields, mutate, wakePetForActivity } from "../petState.js";

/*
 * DOCU: Register pet routes for this feature.
 * @param {Express} app - app value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function registerPetRoutes(app: Express) {
    // UI interactions (including opening a game) use this idempotent wake action.
    app.post("/api/care/wake", auth, handle(async (req, res) => {
        await wakePetForActivity(String(req.userId));
        res.json({
            message: "Your pet is awake!"
        });
    }));

    app.get("/api/me", auth, handle(async (req, res) => {
        const c = await pool.connect();
        try {
            await c.query("BEGIN");
            const u = await c.query(
                "SELECT id,username,CASE WHEN note_expires_at>NOW() THEN pet_note ELSE NULL END AS pet_note,note_expires_at FROM users WHERE id=$1",
                [req.userId]
            );
            const q = await c.query(`SELECT ${fields} FROM pets WHERE owner_id=$1 FOR UPDATE`, [
                req.userId
            ]);
            let pet = q.rows[0] || null;
            if (pet) {
                applyPetDecay(pet);
                const result = await c.query(
                    `UPDATE pets SET hunger=$2,energy=$3,happiness=$4,cleanliness=$5,garden=$6::jsonb WHERE id=$1 RETURNING ${fields}`,
                    [
                        pet.id,
                        pet.hunger,
                        pet.energy,
                        pet.happiness,
                        pet.cleanliness,
                        JSON.stringify(pet.garden)
                    ]
                );
                pet = result.rows[0];
            }
            await c.query("COMMIT");
            res.json({
                user: u.rows[0],
                pet: publicPetGarden(pet)
            });
        } catch (e) {
            await c.query("ROLLBACK");
            throw e;
        } finally {
            c.release();
        }
    }));

    app.post("/api/adopt", auth, handle(async (req, res) => {
        const v = z
            .object({
                name: z.string().trim().min(1).max(24),
                species: z.enum([
                    "cat",
                    "dog",
                    "bunny",
                    "fox",
                    "hamster",
                    "panda",
                    "penguin",
                    "axolotl"
                ])
            })
            .safeParse(req.body);
        if (!v.success) {
            return void res.status(400).json({
                error: "Choose a species and a pet name."
            });
        }
        try {
            const q = await pool.query(
                `INSERT INTO pets(id,owner_id,name,species) VALUES($1,$2,$3,$4) RETURNING ${fields}`,
                [randomUUID(), req.userId, v.data.name, v.data.species]
            );
            res.status(201).json({
                pet: q.rows[0]
            });
        } catch (e: any) {
            if (e.code === "23505") {
                return void res.status(409).json({
                    error: "You can adopt only one pet."
                });
            }
            throw e;
        }
    }));

    // One-time migration of the old anonymous pet. Explicit ownership claim requires its UUID and an account with no pet.

    app.post("/api/claim", auth, handle(async (req, res) => {
        if (!z.string().uuid().safeParse(req.body?.petId).success) {
            return void res.status(400).json({
                error: "Invalid old pet ID."
            });
        }
        const q = await pool.query(
            `UPDATE pets SET owner_id=$1 WHERE id=$2 AND owner_id IS NULL AND NOT EXISTS(SELECT 1 FROM pets WHERE owner_id=$1) RETURNING ${fields}`,
            [req.userId, req.body.petId]
        );
        if (!q.rows[0]) {
            return void res.status(409).json({
                error: "Pet already claimed, missing, or account already has a pet."
            });
        }
        res.json({
            pet: publicPetGarden(q.rows[0])
        });
    }));

    // Atomic claim: a row lock prevents concurrent requests from claiming twice.

    // Daily Surprise resets at midnight in the Philippines (UTC+08:00).
    // A locked pet row and kitchen upsert make claims atomic and idempotent.
    app.post("/api/daily/claim", auth, handle(async (req, res) => {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const q = await client.query(
                "SELECT id,daily_claimed_at FROM pets WHERE owner_id=$1 FOR UPDATE",
                [req.userId]
            );
            if (!q.rows[0]) {
                await client.query("ROLLBACK");
                return void res.status(404).json({
                    error: "Adopt a pet first."
                });
            }
                        /*
             * DOCU: Handle manila day behavior for this feature.
             * @param {Date} date - date value used by this function
             *
             * Last Updated: 2026-11-13
             * Author: Jorge
             * Last Updated By: Jorge
             */
const manilaDay = (date: Date) =>
                new Date(date.getTime() + 8 * 3600000).toISOString().slice(0, 10);
            const today = manilaDay(new Date());
            const previous = q.rows[0].daily_claimed_at;
            const nextMidnight = new Date(
                Date.parse(today + "T16:00:00Z") + 86400000
            ).toISOString();
            if (previous && manilaDay(new Date(previous)) === today) {
                await client.query("ROLLBACK");
                return void res.status(429).json({
                    error: "Daily Surprise already claimed today.",
                    nextClaimAt: nextMidnight
                });
            }
            const updated = await client.query(
                `UPDATE pets SET daily_claimed_at=NOW(),last_daily=CURRENT_DATE,coins=coins+120,food=food+2,updated_at=NOW() WHERE id=$1 RETURNING ${fields}`,
                [q.rows[0].id]
            );
            await client.query(
                `INSERT INTO pet_kitchens(user_id,meals) VALUES($1,jsonb_build_object('berry_parfait',5)) ON CONFLICT(user_id) DO UPDATE SET meals=jsonb_set(COALESCE(pet_kitchens.meals,'{}'::jsonb),'{berry_parfait}',to_jsonb(COALESCE((pet_kitchens.meals->>'berry_parfait')::int,0)+5),true)`,
                [req.userId]
            );
            await recordMissionEvent(client, req.userId, "daily_surprise");
            await client.query("COMMIT");
            publishLive([String(req.userId)], "daily_reward");
            res.json({
                pet: publicPetGarden(updated.rows[0]),
                message: "Daily Surprise: +120 coins, +2 regular meals, and +5 Berry Parfaits!",
                nextClaimAt: nextMidnight
            });
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }));

    app.post("/api/care", auth, handle(async (req, res) => mutate(req, res, (p) => {
        const action = req.body?.action;
        let msg = "";
        switch (action) {
            case "feed":
                if (p.food < 1) {
                    return "Buy food first.";
                }
                p.food--;
                p.hunger = clamp(p.hunger + 28);
                p.xp += 12;
                msg = "Yummy lunch!";
                break;
            case "play":
                if (p.energy < 12) {
                    return "Too tired to play.";
                }
                p.energy = clamp(p.energy - 12);
                p.happiness = clamp(p.happiness + 24);
                p.coins += 12;
                p.xp += 18;
                msg = "Playtime! +12 coins";
                break;
            case "sleep_toggle": {
                const wasSleeping = !!p._wasSleepingAtRequest;
                const shouldSleep =
                    !wasSleeping; /* Starting a nap at full energy needs one point of headroom, otherwise the next stats refresh immediately auto-wakes the pet. */
                if (shouldSleep && p.energy >= 100) {
                    p.energy = 99;
                }
                p.garden = {
                    ...(p.garden || {}),
                    _sleeping: shouldSleep
                };
                msg = shouldSleep
                    ? "Sweet dreams! Your pet is resting."
                    : "Your pet is awake!";
                break;
            }
            case "sleep":
                p.energy = clamp(p.energy + 36);
                p.xp += 8;
                msg = "Sweet dreams!";
                break;
            case "scrub": {
                const last = Number(p.garden?._last_scrub_at || 0);
                const now = Date.now();
                if (now - last < 900) {
                    return "Keep scrubbing!";
                }
                p.garden = {
                    ...(p.garden || {}),
                    _last_scrub_at: now
                };
                p.cleanliness = clamp(p.cleanliness + 5);
                msg = "Bath time!";
                break;
            }
            case "bathe":
                p.cleanliness = clamp(p.cleanliness + 40);
                p.xp += 10;
                msg = "Squeaky clean!";
                break;
            case "pet_stroke": {
                const now = Date.now();
                const last = Number(p.garden?._last_pet_stroke_at || 0);
                if (now - last < 900) {
                    return "Keep petting gently!";
                }
                p.garden = {
                    ...(p.garden || {}),
                    _last_pet_stroke_at: now
                };
                p.happiness = clamp(p.happiness + 2);
                msg = "Your pet loves the cuddles!";
                break;
            }
            case "cuddle":
                p.happiness = clamp(p.happiness + 10);
                p.xp += 8;
                msg = "Best friends forever!";
                break;
            case "daily":
                return "Please use the dedicated Daily Surprise claim button.";
            case "food":
                if (p.coins < 150) {
                    return "Not enough coins.";
                }
                p.coins -= 150;
                p.food += 3;
                msg = "3 meals added!";
                break;
            case "toy":
                if (p.coins < 350) {
                    return "Not enough coins.";
                }
                p.coins -= 350;
                p.toys++;
                msg = "A new toy!";
                break;
            default:
                return "Unknown action.";
        }
        return msg;
    })));
}
