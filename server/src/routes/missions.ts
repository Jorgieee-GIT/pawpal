import type { Express } from "express";
import { z } from "zod";
import { auth } from "../auth.js";
import { pool } from "../db.js";
import { handle } from "../http.js";
import { publishLive } from "../live.js";
import { missionView } from "../missions.js";

/*
 * DOCU: Register mission routes for this feature.
 * @param {Express} app - app value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function registerMissionRoutes(app: Express) {
    app.get("/api/missions", auth, handle(async (req, res) => {
        res.json(await missionView(pool, req.userId));
    }));

    app.post("/api/missions/claim-all", auth, handle(async (req, res) => {
        const parsed = z
            .object({
                kind: z.enum(["daily", "weekly", "milestone"])
            })
            .safeParse(req.body);
        if (!parsed.success) {
            return void res.status(400).json({
                error: "Choose a mission group."
            });
        }
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const q = await client.query(
                "SELECT id,coins,xp,level FROM pets WHERE owner_id=$1 FOR UPDATE",
                [req.userId]
            );
            if (!q.rows[0]) {
                await client.query("ROLLBACK");
                return void res.status(404).json({
                    error: "Adopt a pet first."
                });
            }
            const view = await missionView(client, req.userId);
            const eligible = view.missions.filter(
                (m: any) => m.kind === parsed.data.kind && !m.claimed && m.progress >= m.target
            );
            let rewardCoins = 0,
                rewardXp = 0,
                claimed = 0;
            for (const m of eligible) {
                const ins = await client.query(
                    "INSERT INTO mission_claims(user_id,mission_id,period) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING mission_id",
                    [req.userId, m.id, m.period]
                );
                if (ins.rowCount) {
                    rewardCoins += m.coins;
                    rewardXp += m.xp;
                    claimed++;
                }
            }
            let xp = Number(q.rows[0].xp) + rewardXp,
                level = Number(q.rows[0].level);
            while (xp >= level * 100) {
                xp -= level * 100;
                level++;
                rewardCoins += 60;
            }
            if (claimed) {
                await client.query(
                    "UPDATE pets SET coins=coins+$2,xp=$3,level=$4,updated_at=NOW() WHERE owner_id=$1",
                    [req.userId, rewardCoins, xp, level]
                );
            }
            await client.query("COMMIT");
            if (claimed) {
                publishLive([String(req.userId)], "pet_updated");
            }
            res.json({
                message: claimed
                    ? `Claimed ${claimed} mission rewards! +${rewardCoins} coins and +${rewardXp} EXP.`
                    : "No completed unclaimed missions in this group.",
                claimed,
                coins: rewardCoins,
                xp: rewardXp
            });
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }));

    app.post("/api/missions/:id/claim", auth, handle(async (req, res) => {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const q = await client.query(
                "SELECT id,coins,xp,level FROM pets WHERE owner_id=$1 FOR UPDATE",
                [req.userId]
            );
            if (!q.rows[0]) {
                await client.query("ROLLBACK");
                return void res.status(404).json({
                    error: "Adopt a pet first."
                });
            }
            const view = await missionView(client, req.userId);
            const m = view.missions.find((x: any) => x.id === req.params.id);
            if (!m) {
                await client.query("ROLLBACK");
                return void res.status(404).json({
                    error: "Mission is not active."
                });
            }
            if (m.claimed || m.progress < m.target) {
                await client.query("ROLLBACK");
                return void res.status(409).json({
                    error: m.claimed ? "Already claimed." : "Mission not finished yet."
                });
            }
            const inserted = await client.query(
                "INSERT INTO mission_claims(user_id,mission_id,period) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING mission_id",
                [req.userId, m.id, m.period]
            );
            if (!inserted.rowCount) {
                await client.query("ROLLBACK");
                return void res.status(409).json({
                    error: "Already claimed."
                });
            }
            let xp = Number(q.rows[0].xp) + m.xp,
                level = Number(q.rows[0].level),
                coins = m.coins;
            while (xp >= level * 100) {
                xp -= level * 100;
                level++;
                coins += 60;
            }
            await client.query(
                "UPDATE pets SET coins=coins+$2,xp=$3,level=$4,updated_at=NOW() WHERE owner_id=$1",
                [req.userId, coins, xp, level]
            );
            await client.query("COMMIT");
            res.json({
                message: `Mission complete! +${m.coins} coins and +${m.xp} EXP.`,
                coins,
                xp,
                level
            });
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }));

    app.get("/api/achievements", auth, handle(async (req, res) => {
        const q = await pool.query("SELECT code FROM achievements WHERE user_id=$1", [
            req.userId
        ]);
        res.json(q.rows.map((x) => x.code));
    }));

    app.post("/api/achievements/claim-all", auth, handle(async (req, res) => {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const pet = await client.query("SELECT level,coins FROM pets WHERE owner_id=$1", [
                req.userId
            ]);
            if (!pet.rows.length) {
                await client.query("ROLLBACK");
                return void res.status(404).json({
                    error: "Pet not found."
                });
            }
            const friend = await client.query(
                "SELECT 1 FROM friendships WHERE status='accepted' AND (requester_id=$1 OR recipient_id=$1) LIMIT 1",
                [req.userId]
            );
            const ready: string[] = [];
            if (friend.rowCount) {
                ready.push("first_friend");
            }
            if (pet.rows[0].level >= 5) {
                ready.push("level_5");
            }
            if (pet.rows[0].coins >= 500) {
                ready.push("rich");
            }
            const claimed = await client.query(
                "INSERT INTO achievements(user_id,code) SELECT $1,unnest($2::text[]) ON CONFLICT DO NOTHING RETURNING code",
                [req.userId, ready]
            );
            await client.query("COMMIT");
            res.json({
                message: claimed.rowCount
                    ? `Claimed ${claimed.rowCount} achievement${claimed.rowCount === 1 ? "" : "s"}!`
                    : "No new achievements to claim.",
                claimed: claimed.rows.map((r: any) => r.code)
            });
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }));

    app.post("/api/achievement", auth, handle(async (req, res) => {
        const code = String(req.body?.code || "");
        const p = await pool.query("SELECT level,coins FROM pets WHERE owner_id=$1", [
            req.userId
        ]);
        const valid =
            (code === "first_friend" &&
                !!(
                    await pool.query(
                        "SELECT 1 FROM friendships WHERE status='accepted' AND (requester_id=$1 OR recipient_id=$1)",
                        [req.userId]
                    )
                ).rowCount) ||
            (code === "level_5" && p.rows[0]?.level >= 5) ||
            (code === "rich" && p.rows[0]?.coins >= 500);
        if (!valid) {
            return void res.status(400).json({
                error: "Achievement requirements not met."
            });
        }
        await pool.query(
            "INSERT INTO achievements(user_id,code) VALUES($1,$2) ON CONFLICT DO NOTHING",
            [req.userId, code]
        );
        res.json({
            message: "Achievement unlocked!"
        });
    }));
}
