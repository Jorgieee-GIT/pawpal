import type { Express } from "express";
import { pool } from "../db.js";
import { logSafeError } from "../security.js";

export function registerHealthRoutes(app: Express) {
    app.get("/api/health", (_q, r) =>
        r.json({
            ok: true
        })
    );

    // Temporary diagnostic endpoint: confirms database connectivity and users table.

    app.get("/api/db-health", async (_req, res) => {
        try {
            const result = await pool.query("SELECT to_regclass('public.users') AS users_table");

            res.json({
                databaseConnected: true,

                usersTableExists: result.rows[0].users_table !== null
            });
        } catch (error) {
            logSafeError("Database health check failed", error);

            res.status(500).json({
                databaseConnected: false,

                message: "Database connection failed. Check Render logs."
            });
        }
    });
}
