import type { Express } from "express";
import { z } from "zod";
import { gameSettings } from "../adminConsole.js";
import { auth } from "../auth.js";
import { pool } from "../db.js";
import { handle } from "../http.js";
import { recordMissionEvent } from "../missions.js";
import { addedBreedsBySpecies, breedsBySpecies, catalog } from "../petCatalog.js";
import { clamp, mutate } from "../petState.js";

/*
 * DOCU: Register arcade routes for this feature.
 * @param {Express} app - app value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function registerArcadeRoutes(app: Express) {
    // Paw Claw: prize selection is always server-side, never trusted from the browser.
    app.post("/api/claw/play", auth, handle(async (req, res) => {
        const clawCooldownMs = Number((await gameSettings()).claw_cooldown_seconds) * 1000;
        const result: any = {};
        await mutate(
            req,
            {
                json: (x: any) => Object.assign(result, x),
                status: () => ({
                    json: () => {}
                })
            },
            (p) => {
                if (
                    p.last_game_at &&
                    Date.now() - new Date(p.last_game_at).getTime() < clawCooldownMs
                ) {
                    return `Wait ${Math.ceil((clawCooldownMs - (Date.now() - new Date(p.last_game_at).getTime())) / 1000)} seconds before playing Paw Claw again.`;
                }
                p.last_game_at = new Date().toISOString();
                p.energy = clamp(p.energy - 5);
                p.cleanliness = clamp(p.cleanliness - 4);
                const roll = Math.random() * 100;
                if (roll < 56) {
                    const amount = 15 + Math.floor(Math.random() * 6);
                    p.coins += amount;
                    return `Paw Claw prize: +${amount} coins!`;
                }
                if (roll < 72) {
                    const amount = 25 + Math.floor(Math.random() * 26);
                    p.coins += amount;
                    return `Paw Claw prize: +${amount} coins!`;
                }
                if (roll < 76.8) {
                    const amount = 65 + Math.floor(Math.random() * 16);
                    p.coins += amount;
                    return `Paw Claw prize: +${amount} coins!`;
                }
                if (roll < 79.2) {
                    const themes = Object.keys(catalog).filter(
                        (id) =>
                            catalog[id].type === "theme" &&
                            id !== "blush" &&
                            !p.owned_items.includes(id)
                    );
                    if (themes.length) {
                        const theme = themes[Math.floor(Math.random() * themes.length)];
                        p.owned_items.push(theme);
                        return `Paw Claw prize: ${theme.replace(/_/g, " ")} atmosphere unlocked!`;
                    }
                    p.coins += 75;
                    return "All atmospheres owned! +75 bonus coins!";
                }
                if (roll >= 80) {
                    return "The claw slipped! No prize this time.";
                }
                const speciesBreeds = [
                    ...(breedsBySpecies[p.species] || []),
                    ...(addedBreedsBySpecies[p.species] || [])
                ];
                const fifth = speciesBreeds[4];
                if (fifth && !p.owned_breeds.includes(fifth)) {
                    p.owned_breeds.push(fifth);
                    return `JACKPOT! ${fifth.replace(/_/g, " ")} breed unlocked!`;
                }
                p.coins += 100;
                return "Breed already owned! +100 bonus coins!";
            }
        );
        if (!result.pet) {
            return void res.status(500).json({
                error: "Prize could not be claimed."
            });
        }
        if (!String(result.message || "").startsWith("Wait ")) {
            await recordMissionEvent(pool, req.userId, "claw");
        }
        res.json(result);
    }));

    app.post("/api/game", auth, handle(async (req, res) => {
        const v = z
            .object({
                game: z.enum(["memory", "dino", "runner", "pattern", "mole", "bubble"]),
                score: z.number().int().min(0).max(100000)
            })
            .safeParse(req.body);
        if (!v.success) {
            return void res.status(400).json({
                error: "Invalid score."
            });
        }
        const arcadeSettings = await gameSettings();
        const arcadeRewardMultiplier = Number(arcadeSettings.arcade_reward_percent) / 100;
        const arcadeCooldownMs = Number(arcadeSettings.arcade_cooldown_seconds) * 1000;
        const result: any = {};
        await mutate(
            req,
            {
                json: (x: any) => Object.assign(result, x),
                status: () => ({
                    json: () => {}
                })
            },
            (p) => {
                if (
                    p.last_game_at &&
                    Date.now() - new Date(p.last_game_at).getTime() < arcadeCooldownMs
                ) {
                    return `Wait ${Math.ceil((arcadeCooldownMs - (Date.now() - new Date(p.last_game_at).getTime())) / 1000)} seconds between rewards.`;
                }
                p.last_game_at = new Date().toISOString();
                const reward = Math.max(
                    0,
                    Math.floor(
                        Math.min(75, 10 + Math.floor(v.data.score / 3)) * arcadeRewardMultiplier
                    )
                );
                p.coins += reward;
                p.xp += Math.min(40, 5 + Math.floor(v.data.score / 8));
                p.happiness = clamp(p.happiness + 8);
                p.energy = clamp(p.energy - 7);
                p.cleanliness = clamp(p.cleanliness - 5);
                return `Arcade reward: +${reward} coins!`;
            }
        );
        if (result.pet && !String(result.message || "").startsWith("Wait ")) {
            await Promise.all([
                recordMissionEvent(pool, req.userId, "arcade"),
                recordMissionEvent(pool, req.userId, v.data.game)
            ]);
        }
        if (result.pet) {
            await pool.query(
                "INSERT INTO game_records(user_id,game,best) VALUES($1,$2,$3) ON CONFLICT(user_id,game) DO UPDATE SET best=GREATEST(game_records.best,EXCLUDED.best)",
                [req.userId, v.data.game, v.data.score]
            );
        }
        res.json(result);
    }));

    app.get("/api/records", auth, handle(async (req, res) => {
        const q = await pool.query("SELECT game,best FROM game_records WHERE user_id=$1", [
            req.userId
        ]);
        res.json(q.rows);
    }));
}
