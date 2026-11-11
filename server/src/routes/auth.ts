import bcrypt from "bcryptjs";
import type { Express } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { register, token } from "../auth.js";
import { pool } from "../db.js";
import { handle } from "../http.js";
import { createRateLimiter } from "../security.js";

const registrationLimit = createRateLimiter({
    max: 20,
    windowMs: 60 * 60 * 1000,
    message: "Too many account creation attempts. Try again later."
});
const loginLimit = createRateLimiter({
    max: 20,
    windowMs: 15 * 60 * 1000,
    message: "Too many sign-in attempts. Try again in a few minutes."
});
const loginInput = z.object({
    identity: z.string().regex(/^[a-zA-Z0-9_]{3,24}$/),
    password: z.string().min(1).max(100)
});

export function registerAuthRoutes(app: Express) {
    app.post("/api/auth/register", registrationLimit, handle(async (req, res) => {
        const v = register.safeParse(req.body);
        if (!v.success) {
            return void res.status(400).json({
                error: "Username must be 3–24 letters, numbers or underscores. Password must be at least 6 characters."
            });
        }
        const { username, password } = v.data;
        const hash = await bcrypt.hash(password, 12);
        try {
            const q = await pool.query(
                "INSERT INTO users(id,username,password_hash) VALUES($1,$2,$3) RETURNING id,username",
                [randomUUID(), username.toLowerCase(), hash]
            );
            res.status(201).json({
                token: token(q.rows[0].id, Number(q.rows[0].auth_version || 0)),
                user: q.rows[0]
            });
        } catch (e: any) {
            if (e.code === "23505") {
                return void res.status(409).json({
                    error: "That username is already taken."
                });
            }
            throw e;
        }
    }));

    app.post("/api/auth/login", loginLimit, handle(async (req, res) => {
        const parsed = loginInput.safeParse(req.body);
        if (!parsed.success) {
            return void res.status(400).json({
                error: "Enter a valid username and password."
            });
        }
        const { identity, password } = parsed.data;
        const q = await pool.query("SELECT * FROM users WHERE username=$1", [
            String(identity || "").toLowerCase()
        ]);
        if (
            !q.rows[0] ||
            !(await bcrypt.compare(String(password || ""), q.rows[0].password_hash))
        ) {
            return void res.status(401).json({
                error: "Incorrect username or password."
            });
        }
        const access = await pool.query(
            "SELECT suspended FROM admin_user_access WHERE user_id=$1",
            [q.rows[0].id]
        );
        if (access.rows[0]?.suspended) {
            return void res.status(403).json({
                error: "This PawPal account is temporarily suspended. Contact the administrator."
            });
        }
        res.json({
            token: token(q.rows[0].id, Number(q.rows[0].auth_version || 0)),
            user: {
                id: q.rows[0].id,
                username: q.rows[0].username
            }
        });
    }));
}
