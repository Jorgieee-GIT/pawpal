import type { Express } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { auth } from "../auth.js";
import { pool } from "../db.js";
import { handle } from "../http.js";
import { publishLive } from "../live.js";
import { recordMissionEvent } from "../missions.js";

/*
 * DOCU: Register friend routes for this feature.
 * @param {Express} app - app value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function registerFriendRoutes(app: Express) {
    app.get("/api/friends", auth, handle(async (req, res) => {
        const q = await pool.query(
            `SELECT f.requester_id,f.recipient_id,f.status,f.created_at,u.username,u.id AS friend_id FROM friendships f JOIN users u ON u.id=CASE WHEN f.requester_id=$1 THEN f.recipient_id ELSE f.requester_id END WHERE f.requester_id=$1 OR f.recipient_id=$1 ORDER BY f.created_at DESC`,
            [req.userId]
        );
        res.json(q.rows);
    }));

    app.get("/api/users/search", auth, handle(async (req, res) => {
        const username = String(req.query.username || "")
            .trim()
            .toLowerCase();
        if (!/^[a-z0-9_]{3,24}$/.test(username)) {
            return void res.status(400).json({
                error: "Enter an exact username (3–24 characters)."
            });
        }
        const q = await pool.query(
            "SELECT id,username FROM users WHERE username=$1 AND id<>$2",
            [username, req.userId]
        );
        res.json({
            user: q.rows[0] || null
        });
    }));

    app.post("/api/friends/request", auth, handle(async (req, res) => {
        const username = String(req.body?.username || "").toLowerCase();
        const u = await pool.query("SELECT id FROM users WHERE username=$1 AND id<>$2", [
            username,
            req.userId
        ]);
        if (!u.rows[0]) {
            return void res.status(404).json({
                error: "Username not found."
            });
        }
        const id = u.rows[0].id;
        const exists = await pool.query(
            "SELECT status FROM friendships WHERE (requester_id=$1 AND recipient_id=$2) OR (requester_id=$2 AND recipient_id=$1)",
            [req.userId, id]
        );
        if (exists.rowCount) {
            return void res.status(409).json({
                error: "A request or friendship already exists."
            });
        }
        await pool.query(
            "INSERT INTO friendships(requester_id,recipient_id,status) VALUES($1,$2,$3)",
            [req.userId, id, "pending"]
        );
        publishLive([id, req.userId], "friend_request");
        res.json({
            message: "Friend request sent!"
        });
    }));

    app.post("/api/friends/:id/accept", auth, handle(async (req, res) => {
        const q = await pool.query(
            "UPDATE friendships SET status='accepted' WHERE requester_id=$1 AND recipient_id=$2 AND status='pending' RETURNING requester_id",
            [req.params.id, req.userId]
        );
        if (!q.rowCount) {
            return void res.status(404).json({
                error: "No incoming request."
            });
        }
        await recordMissionEvent(pool, req.userId, "friend");
        await recordMissionEvent(pool, req.params.id, "friend");
        publishLive([String(req.params.id), req.userId], "friend_accepted");
        res.json({
            message: "Friend added!"
        });
    }));

    app.delete("/api/friends/:id", auth, handle(async (req, res) => {
        await pool.query(
            "DELETE FROM friendships WHERE (requester_id=$1 AND recipient_id=$2) OR (requester_id=$2 AND recipient_id=$1)",
            [req.userId, req.params.id]
        );
        publishLive([String(req.params.id), req.userId], "friend_removed");
        res.json({
            message: "Friend removed."
        });
    }));

    app.post("/api/notes", auth, handle(async (req, res) => {
        const parsed = z
            .object({
                text: z.string().trim().max(20)
            })
            .safeParse(req.body);

        if (!parsed.success) {
            return void res.status(400).json({
                error: "Notes must be 20 characters or fewer."
            });
        }

        const value = parsed.data.text;
        const expiresAt = value ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

        await pool.query(
            `UPDATE users
    SET pet_note = $2,
        note_expires_at = $3
    WHERE id = $1`,
            [req.userId, value || null, expiresAt]
        );

        if (value) {
            await recordMissionEvent(pool, req.userId, "note");
        }
        res.json({
            message: value ? "Pet Note saved for 24 hours." : "Pet Note deleted."
        });
    }));

    app.delete("/api/notes", auth, handle(async (req, res) => {
        await pool.query("UPDATE users SET pet_note=NULL,note_expires_at=NULL WHERE id=$1", [
            req.userId
        ]);
        res.json({
            message: "Pet Note deleted."
        });
    }));

    app.post("/api/gifts", auth, handle(async (req, res) => {
        const id = req.body?.friendId;
        const amount = 25;
        const c = await pool.connect();
        try {
            await c.query("BEGIN");
            const f = await c.query(
                "SELECT 1 FROM friendships WHERE status='accepted' AND ((requester_id=$1 AND recipient_id=$2) OR (requester_id=$2 AND recipient_id=$1))",
                [req.userId, id]
            );
            if (!f.rowCount) {
                await c.query("ROLLBACK");
                return void res.status(403).json({
                    error: "Only friends can receive gifts."
                });
            }
            const sender = await c.query(
                "SELECT level FROM pets WHERE owner_id=$1 FOR UPDATE",
                [req.userId]
            );
            if (!sender.rows[0] || sender.rows[0].level < 10) {
                await c.query("ROLLBACK");
                return void res.status(403).json({
                    error: "Reach pet Level 10 before sending coin gifts."
                });
            }
            const sent = await c.query(
                "UPDATE pets SET coins=coins-$2 WHERE owner_id=$1 AND coins >= $2 RETURNING id",
                [req.userId, amount]
            );
            if (!sent.rowCount) {
                await c.query("ROLLBACK");
                return void res.status(400).json({
                    error: "Not enough coins."
                });
            }
            await c.query("UPDATE pets SET coins=coins+$2 WHERE owner_id=$1", [id, amount]);
            await c.query(
                "INSERT INTO gifts(id,sender_id,recipient_id,coins) VALUES($1,$2,$3,$4)",
                [randomUUID(), req.userId, id, amount]
            );
            await recordMissionEvent(c, req.userId, "gift");
            await c.query("COMMIT");
            publishLive([String(id), req.userId], "gift");
            res.json({
                message: "Sent a 25-coin gift!"
            });
        } catch (e) {
            await c.query("ROLLBACK");
            throw e;
        } finally {
            c.release();
        }
    }));
}
