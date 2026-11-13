import type { Express } from "express";
import { updatePresence } from "../adminConsole.js";
import { auth } from "../auth.js";
import { liveClients } from "../live.js";

/*
 * DOCU: Register live routes for this feature.
 * @param {Express} app - app value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function registerLiveRoutes(app: Express) {
    app.get("/api/live", auth, (req: any, res: any) => {
        const userId = String(req.userId);
        res.status(200).set({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no"
        });
        res.flushHeaders();
        res.write("event: ready\ndata: {}\n\n");
        updatePresence(userId);
        let sockets = liveClients.get(userId);
        if (!sockets) {
            sockets = new Set();
            liveClients.set(userId, sockets);
        }
        sockets.add(res);
        const keepAlive = setInterval(() => {
            if (!res.writableEnded && !res.destroyed) {
                res.write(": heartbeat\n\n");
                updatePresence(userId);
            }
        }, 15000);
        req.on("close", () => {
            clearInterval(keepAlive);
            sockets!.delete(res);
            if (!sockets!.size) {
                liveClients.delete(userId);
            }
        });
    });
}
