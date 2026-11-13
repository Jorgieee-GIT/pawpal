import { logServerFailure } from "./adminConsole.js";
import { logSafeError } from "./security.js";

/*
 * DOCU: Handle the current state for this feature.
 * @param {(req: any, res: any) => Promise<void>} fn - fn value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export const handle = (fn: (req: any, res: any) => Promise<void>) => (req: any, res: any) =>
    Promise.resolve(fn(req, res)).catch((e: any) => {
        logSafeError("API route failed", e);
        logServerFailure(String(req.path || "unknown"), e?.code);
        if (!res.headersSent) {
            res.status(500).json({
                error: "Server error. Check the backend terminal."
            });
        }
    });
