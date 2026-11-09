import bcrypt from "bcryptjs";
import type { Express } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { writeAdminAudit } from "../adminConsole.js";
import { adminAttempts, adminAuth, adminSecret } from "../auth.js";
import { pool } from "../db.js";
import { handle } from "../http.js";

export function registerAdminRoutes(app: Express) {
    app.post("/api/admin/login", handle(async (req, res) => {
        const ip = String(req.ip || req.socket.remoteAddress || "unknown");
        const state = adminAttempts.get(ip);
        if (state && state.until > Date.now() && state.count >= 5) {
            res.status(429).json({
                error: "Too many attempts. Try again in 15 minutes."
            });
            return;
        }
        const configuredName = process.env.ADMIN_USERNAME;
        const configuredHash = process.env.ADMIN_PASSWORD_HASH;
        if (!configuredName || !configuredHash) {
            res.status(503).json({
                error: "Admin access is not configured on this server."
            });
            return;
        }
        const name = String(req.body?.username || "");
        const pass = String(req.body?.password || "");
        const validPassword =
            pass.length <= 128 && (await bcrypt.compare(pass, configuredHash));
        if (name !== configuredName || !validPassword) {
            const nextCount = (state && state.until > Date.now() ? state.count : 0) + 1;
            adminAttempts.set(ip, {
                count: nextCount,
                until: Date.now() + 15 * 60 * 1000
            });
            res.status(401).json({
                error: "Invalid admin credentials."
            });
            return;
        }
        adminAttempts.delete(ip);
        res.json({
            token: jwt.sign(
                {
                    sub: configuredName,
                    role: "admin"
                },
                adminSecret,
                {
                    algorithm: "HS256",
                    expiresIn: "2h"
                }
            ),
            username: configuredName
        });
    }));

    app.get("/api/admin/develop-access", adminAuth, (_req, res) => {
        res.json({
            authorized: true
        });
    });

    app.get("/api/admin/overview", adminAuth, handle(async (_req, res) => {
        const [users, pets] = await Promise.all([
            pool.query("SELECT COUNT(*)::int AS count FROM users"),
            pool.query("SELECT COUNT(*)::int AS count FROM pets")
        ]);
        res.json({
            users: users.rows[0].count,
            pets: pets.rows[0].count
        });
    }));

    app.get("/api/admin/users", adminAuth, handle(async (req, res) => {
        const search = String(req.query.search || "")
            .trim()
            .toLowerCase()
            .slice(0, 40);
        const page = Math.min(
            1000,
            Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1)
        );
        const q = await pool.query(
            `SELECT u.id,u.username,u.created_at,p.id AS pet_id,p.name AS pet_name,p.species,p.level,p.coins
   FROM users u LEFT JOIN pets p ON p.owner_id=u.id
   WHERE ($1='' OR u.username ILIKE '%'||$1||'%')
   ORDER BY u.created_at DESC LIMIT 25 OFFSET $2`,
            [search, (page - 1) * 25]
        );
        res.json({
            users: q.rows,
            page
        });
    }));

    app.post("/api/admin/users/:id/reset-password", adminAuth, handle(async (req, res) => {
        if (!z.string().uuid().safeParse(req.params.id).success) {
            res.status(400).json({
                error: "Invalid user ID."
            });
            return;
        }
        const password = String(req.body?.newPassword || "");
        if (password.length < 6 || password.length > 100) {
            res.status(400).json({
                error: "New password must be 6–100 characters."
            });
            return;
        }
        const hash = await bcrypt.hash(password, 12);
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const q = await client.query(
                "UPDATE users SET password_hash=$1,auth_version=auth_version+1 WHERE id=$2 RETURNING id,username",
                [hash, req.params.id]
            );
            if (!q.rowCount) {
                await client.query("ROLLBACK");
                res.status(404).json({ error: "User not found." });
                return;
            }
            await client.query(
                "UPDATE password_reset_tokens SET consumed_at=NOW() WHERE user_id=$1 AND consumed_at IS NULL",
                [req.params.id]
            );
            await client.query(
                "UPDATE password_reset_requests SET status='completed',decided_at=NOW() WHERE user_id=$1 AND status IN ('pending','approved')",
                [req.params.id]
            );
            await client.query("COMMIT");
            console.info("[ADMIN] Password reset for user", q.rows[0].id);
            void writeAdminAudit("password_reset", String(q.rows[0].id)).catch(console.error);
            res.json({
                message:
                    "Password reset successfully. Share the new password securely with the account owner. Existing sessions were signed out."
            });
        } catch (error) {
            await client.query("ROLLBACK").catch(() => {});
            throw error;
        } finally {
            client.release();
        }
    }));
}
