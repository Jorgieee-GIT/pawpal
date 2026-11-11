import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Express } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { pool } from "./db.js";
import { createRateLimiter, logSafeError } from "./security.js";

const RESET_LINK_MINUTES = 5;
const REQUEST_HOURS = 24;
// Explicitly configured URLs: never derive private reset-link hosts from a request's Host header.
// A local link works with Vite's /api proxy; a public link works after Vercel deployment.
const publicUrl = (process.env.PAWPAL_PUBLIC_URL || "https://pawpal-navy.vercel.app").replace(/\/+$/, "");
const localUrl = (process.env.PAWPAL_LOCAL_URL || "http://localhost:5173").replace(/\/+$/, "");
const passwordSchema = z.string().min(6).max(100);
const usernameSchema = z.string().regex(/^[a-zA-Z0-9_]{3,24}$/);
const resetTokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
const resetRequestLimit = createRateLimiter({
    max: 8,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests. Please try again later."
});
const resetLookupLimit = createRateLimiter({
    max: 120,
    windowMs: 15 * 60 * 1000,
    message: "Too many reset checks. Wait a few minutes and try again."
});
const resetCompletionLimit = createRateLimiter({
    max: 8,
    windowMs: 15 * 60 * 1000,
    message: "Too many password reset attempts. Try again in a few minutes."
});

function hash(value: string) {
    return createHash("sha256").update(value).digest("hex");
}

function generateSecret() {
    return randomBytes(32).toString("hex");
}

function resetLinks(rawToken: string) {
    // Both addresses use the same one-time token. Consuming either invalidates both.
    // URL fragments are not sent to the web host in the HTTP request.
    return {
        url: publicUrl + "/reset-password#" + rawToken, // Backwards compatibility
        productionUrl: publicUrl + "/reset-password#" + rawToken,
        localUrl: localUrl + "/reset-password#" + rawToken
    };
}

async function issueLink(client: any, userId: string, requestId: string | null = null) {
    // Replacing a link immediately revokes older unused links for this account.
    await client.query(
        "UPDATE password_reset_tokens SET consumed_at=NOW() WHERE user_id=$1 AND consumed_at IS NULL",
        [userId]
    );
    const secret = generateSecret();
    await client.query(
        `INSERT INTO password_reset_tokens (id,user_id,request_id,token_hash,expires_at)
         VALUES($1,$2,$3,$4,NOW() + INTERVAL '5 minutes')`,
        [randomUUID(), userId, requestId, hash(secret)]
    );
    return {
        ...resetLinks(secret),
        expiresAt: new Date(Date.now() + RESET_LINK_MINUTES * 60 * 1000).toISOString()
    };
}

export function registerPasswordRecovery(app: Express, adminAuth: any) {
    // This endpoint is always generic: usernames must not be enumerable.
    app.post("/api/auth/password-reset/request", resetRequestLimit, async (req, res) => {
        const requestId = randomUUID();
        const requestSecret = generateSecret();
        const generic = {
            message: "Request received. Please wait for an admin's decision. If the username exists, an admin can review it.",
            requestId,
            requestKey: requestSecret
        };
        res.setHeader("Cache-Control", "no-store");
        const username = String(req.body?.username || "").trim().toLowerCase();
        if (!usernameSchema.safeParse(username).success) {
            res.status(400).json({ error: "Enter a valid username (3–24 letters, numbers or underscores)." });
            return;
        }
        try {
            const found = await pool.query("SELECT id FROM users WHERE username=$1", [username]);
            if (found.rows.length) {
                const id = String(found.rows[0].id);
                // Cooldown and one pending request per user keep the admin inbox manageable.
                const recent = await pool.query(
                    `SELECT id FROM password_reset_requests WHERE user_id=$1
                     AND created_at > NOW() - INTERVAL '2 minutes' LIMIT 1`,
                    [id]
                );
                if (!recent.rowCount) {
                    await pool.query(
                        "UPDATE password_reset_requests SET status='expired' WHERE user_id=$1 AND status='pending'",
                        [id]
                    );
                    await pool.query(
                        `INSERT INTO password_reset_requests (id,user_id,request_key_hash)
                         VALUES($1,$2,$3)`,
                        [requestId, id, hash(requestSecret)]
                    );
                }
            }
            res.status(202).json(generic);
        } catch (error) {
            logSafeError("Password request failed", error);
            res.status(503).json({ error: "Could not submit the request. Please try again later." });
        }
    });

    app.post("/api/auth/password-reset/request-status", resetLookupLimit, async (req, res) => {
        res.setHeader("Cache-Control", "no-store");
        const id = z.string().uuid().safeParse(req.body?.requestId);
        const key = resetTokenSchema.safeParse(req.body?.requestKey);
        if (!id.success || !key.success) {
            res.status(400).json({ error: "Invalid request details." });
            return;
        }
        try {
            const result = await pool.query(
                `SELECT status,created_at FROM password_reset_requests
                 WHERE id=$1 AND request_key_hash=$2`,
                [id.data, hash(key.data)]
            );
            const row = result.rows[0];
            const expired = row && row.status === "pending" &&
                Date.now() - new Date(row.created_at).getTime() > REQUEST_HOURS * 60 * 60 * 1000;
            res.json({ status: expired ? "expired" : row?.status || "pending" });
        } catch {
            res.status(503).json({ error: "Could not check request status." });
        }
    });

    app.post("/api/auth/password-reset/verify", resetLookupLimit, async (req, res) => {
        res.setHeader("Cache-Control", "no-store");
        const parsed = resetTokenSchema.safeParse(req.body?.token);
        if (!parsed.success) {
            res.status(400).json({ valid: false });
            return;
        }
        try {
            const result = await pool.query(
                `SELECT u.username FROM password_reset_tokens t
                 JOIN users u ON u.id=t.user_id
                 WHERE t.token_hash=$1 AND t.consumed_at IS NULL AND t.expires_at>NOW()`,
                [hash(parsed.data)]
            );
            res.json({ valid: Boolean(result.rowCount), username: result.rows[0]?.username || null });
        } catch {
            res.status(503).json({ error: "Cannot verify the reset link right now." });
        }
    });

    app.post("/api/auth/password-reset/complete", resetCompletionLimit, async (req, res) => {
        res.setHeader("Cache-Control", "no-store");
        const parsedToken = resetTokenSchema.safeParse(req.body?.token);
        const parsedPassword = passwordSchema.safeParse(req.body?.newPassword);
        if (!parsedToken.success || !parsedPassword.success) {
            res.status(400).json({ error: "Invalid link or password. Use 6–100 characters." });
            return;
        }
        const passwordHash = await bcrypt.hash(parsedPassword.data, 12);
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            // The lock makes a concurrent second use wait until the first has consumed the link.
            const result = await client.query(
                `SELECT user_id FROM password_reset_tokens
                 WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>NOW() FOR UPDATE`,
                [hash(parsedToken.data)]
            );
            if (!result.rowCount) {
                await client.query("ROLLBACK");
                res.status(410).json({ error: "This link has expired or was already used. Ask the admin for a new one." });
                return;
            }
            const userId = String(result.rows[0].user_id);
            await client.query(
                "UPDATE users SET password_hash=$1,auth_version=auth_version+1 WHERE id=$2",
                [passwordHash, userId]
            );
            await client.query(
                "UPDATE password_reset_tokens SET consumed_at=NOW() WHERE user_id=$1 AND consumed_at IS NULL",
                [userId]
            );
            await client.query(
                `UPDATE password_reset_requests SET status='completed',decided_at=NOW()
                 WHERE user_id=$1 AND status IN ('pending','approved')`,
                [userId]
            );
            await client.query("COMMIT");
            res.json({ message: "Your password was changed. You can now log in with your new password." });
        } catch (error) {
            await client.query("ROLLBACK").catch(() => {});
            logSafeError("Reset completion failed", error);
            res.status(503).json({ error: "Password reset is temporarily unavailable. Try again." });
        } finally {
            client.release();
        }
    });

    app.get("/api/admin/password-reset/requests", adminAuth, async (_req, res) => {
        res.setHeader("Cache-Control", "no-store");
        try {
            const result = await pool.query(
                `SELECT r.id,r.status,r.created_at,r.decided_at,u.username,
                        (SELECT t.expires_at FROM password_reset_tokens t
                         WHERE t.request_id=r.id ORDER BY t.created_at DESC LIMIT 1) AS link_expires_at
                 FROM password_reset_requests r JOIN users u ON u.id=r.user_id
                 ORDER BY CASE WHEN r.status='pending' AND r.created_at > NOW()-INTERVAL '24 hours' THEN 0 ELSE 1 END,
                          r.created_at DESC LIMIT 100`
            );
            res.json({ requests: result.rows.map((row: any) => ({
                ...row,
                status: row.status === "pending" &&
                    Date.now() - new Date(row.created_at).getTime() > REQUEST_HOURS * 60 * 60 * 1000
                    ? "expired" : row.status
            })) });
        } catch (error) {
            logSafeError("Admin reset inbox failed", error);
            res.status(503).json({ error: "Could not load password requests. Check the migration." });
        }
    });

    app.post("/api/admin/password-reset/requests/:id/decision", adminAuth, async (req, res) => {
        const id = z.string().uuid().safeParse(req.params.id);
        const decision = z.enum(["approve", "reject"]).safeParse(req.body?.decision);
        if (!id.success || !decision.success) {
            res.status(400).json({ error: "Invalid request or decision." });
            return;
        }
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const q = await client.query(
                `SELECT user_id,status,created_at FROM password_reset_requests
                 WHERE id=$1 FOR UPDATE`,
                [id.data]
            );
            const row = q.rows[0];
            if (!row || row.status !== "pending" ||
                Date.now() - new Date(row.created_at).getTime() > REQUEST_HOURS * 60 * 60 * 1000) {
                await client.query("ROLLBACK");
                res.status(409).json({ error: "This request has already been decided or expired." });
                return;
            }
            const approved = decision.data === "approve";
            const link = approved ? await issueLink(client, String(row.user_id), id.data) : null;
            await client.query(
                "UPDATE password_reset_requests SET status=$1,decided_at=NOW() WHERE id=$2",
                [approved ? "approved" : "rejected", id.data]
            );
            await client.query("INSERT INTO admin_audit_logs(action,target,details) VALUES($1,$2,$3::jsonb)",
                ["password_request_decision", String(row.user_id), JSON.stringify({ decision: decision.data })]);
            await client.query("COMMIT");
            res.setHeader("Cache-Control", "no-store");
            res.json({
                message: approved ? "Approved. Privately share the reset link with the verified owner." : "Request rejected.",
                ...(link || {})
            });
        } catch (error) {
            await client.query("ROLLBACK").catch(() => {});
            logSafeError("Reset approval failed", error);
            res.status(503).json({ error: "Could not process this request." });
        } finally {
            client.release();
        }
    });

    app.post("/api/admin/users/:id/reset-link", adminAuth, async (req, res) => {
        const id = z.string().uuid().safeParse(req.params.id);
        if (!id.success) {
            res.status(400).json({ error: "Invalid user ID." });
            return;
        }
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const user = await client.query("SELECT username FROM users WHERE id=$1 FOR UPDATE", [id.data]);
            if (!user.rowCount) {
                await client.query("ROLLBACK");
                res.status(404).json({ error: "Player not found." });
                return;
            }
            const link = await issueLink(client, id.data);
            await client.query(
                "UPDATE password_reset_requests SET status='approved',decided_at=NOW() WHERE user_id=$1 AND status='pending'",
                [id.data]
            );
            await client.query("INSERT INTO admin_audit_logs(action,target,details) VALUES('password_link_created',$1,'{}'::jsonb)", [id.data]);
            await client.query("COMMIT");
            res.setHeader("Cache-Control", "no-store");
            res.json({ username: user.rows[0].username, ...link });
        } catch (error) {
            await client.query("ROLLBACK").catch(() => {});
            logSafeError("Reset link creation failed", error);
            res.status(503).json({ error: "Could not create a reset link." });
        } finally {
            client.release();
        }
    });
}
