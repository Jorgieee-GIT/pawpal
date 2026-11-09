import { logServerFailure } from "./adminConsole.js";

export const handle = (fn: (req: any, res: any) => Promise<void>) => (req: any, res: any) =>
    Promise.resolve(fn(req, res)).catch((e: any) => {
        console.error(e);
        logServerFailure(String(req.path || "unknown"), e?.code);
        if (!res.headersSent) {
            res.status(500).json({
                error: "Server error. Check the backend terminal."
            });
        }
    });
