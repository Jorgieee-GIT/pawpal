import type { Express } from "express";
import { pool } from "../db.js";
import { logSafeError } from "../security.js";

/*
 * DOCU: Register health routes for this feature.
 * @param {Express} app - app value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
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
