import jwt from "jsonwebtoken";
import { z } from "zod";
import { updatePresence } from "./adminConsole.js";
import { pool } from "./db.js";

const secret = process.env.JWT_SECRET || "LOCAL_DEVELOPMENT_ONLY_CHANGE_THIS_SECRET";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw Error("Set JWT_SECRET in production");
}

export const token = (id: string, version = 0) =>
    jwt.sign(
        {
            sub: id,
            ver: version
        },
        secret,
        {
            expiresIn: "14d"
        }
    );

// Check the session version so password resets invalidate all old logins.
export async function auth(req: any, res: any, next: any) {
    try {
        const raw = String(req.headers.authorization || "").replace(/^Bearer /, "");
        const data = jwt.verify(raw, secret, { algorithms: ["HS256"] }) as {
            sub: string;
            ver?: number;
        };
        if (!z.string().uuid().safeParse(data.sub).success) {
            throw Error("Invalid account");
        }
        const account = await pool.query(
            `SELECT u.auth_version,COALESCE(a.suspended,false) AS suspended,
            COALESCE(a.disabled_features,'[]'::jsonb) AS disabled_features
            FROM users u LEFT JOIN admin_user_access a ON a.user_id=u.id WHERE u.id=$1`,
            [data.sub]
        );
        if (!account.rowCount || Number(account.rows[0].auth_version) !== (data.ver ?? 0)) {
            throw Error("Session revoked");
        }
        if (account.rows[0].suspended) {
            res.status(403).json({
                error: "This PawPal account is temporarily suspended. Contact the administrator."
            });
            return;
        }
        const action = String(req.path);
        const feature =
            action.startsWith("/api/multiplayer") || action.startsWith("/api/duo")
                ? "multiplayer"
                : action.startsWith("/api/garden")
                  ? "garden"
                  : action.startsWith("/api/kitchen")
                    ? "kitchen"
                    : action.startsWith("/api/claw")
                      ? "pawclaw"
                      : action === "/api/game"
                        ? "arcade"
                        : action.startsWith("/api/missions") ||
                            action.startsWith("/api/achievement")
                          ? "missions"
                          : action.startsWith("/api/furniture") || action === "/api/item"
                            ? "shop"
                            : "";
        if (
            feature &&
            Array.isArray(account.rows[0].disabled_features) &&
            account.rows[0].disabled_features.includes(feature)
        ) {
            res.status(403).json({
                error: "Your administrator has restricted access to this PawPal feature."
            });
            return;
        }
        req.userId = data.sub;
        updatePresence(String(data.sub));
        next();
    } catch {
        res.status(401).json({ error: "Please sign in again." });
    }
}

export const register = z.object({
    username: z.string().regex(/^[a-zA-Z0-9_]{3,24}$/),
    password: z.string().min(6).max(100)
});

// Admin access is a separate credential, never a role users can grant themselves.
// Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH in the server environment.
export const adminSecret = secret + ":pawpal-admin-v1";

export const adminAttempts = new Map<
    string,
    {
        count: number;
        until: number;
    }
>();

export function adminAuth(req: any, res: any, next: any) {
    try {
        const raw = String(req.headers.authorization || "").replace(/^Bearer /, "");
        const data = jwt.verify(raw, adminSecret, {
            algorithms: ["HS256"]
        }) as {
            role?: string;
            sub?: string;
        };
        if (data.role !== "admin" || data.sub !== process.env.ADMIN_USERNAME) {
            throw Error("Not admin");
        }
        next();
    } catch {
        res.status(401).json({
            error: "Admin session expired. Sign in again."
        });
    }
}
