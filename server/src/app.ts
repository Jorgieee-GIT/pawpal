import cors from "cors";
import "dotenv/config";
import express from "express";
import {
    enforceAdminGameSettings,
    logServerFailure,
    registerAdminConsole
} from "./adminConsole.js";
import { adminAuth, auth } from "./auth.js";
import { registerDuoClash } from "./duoClash.js";
import { publishLive } from "./live.js";
import { registerMultiplayer } from "./multiplayer.js";
import { registerPasswordRecovery } from "./passwordRecovery.js";
import { isWakeActivity, wakePetForActivity } from "./petState.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerArcadeRoutes } from "./routes/arcade.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerFriendRoutes } from "./routes/friends.js";
import { registerGardenRoutes } from "./routes/garden.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerKitchenRoutes } from "./routes/kitchen.js";
import { registerLiveRoutes } from "./routes/live.js";
import { registerMailRoutes } from "./routes/mail.js";
import { registerMissionRoutes } from "./routes/missions.js";
import { registerNotificationRoutes } from "./routes/notifications.js";
import { registerPetRoutes } from "./routes/pets.js";
import { registerRoomRoutes } from "./routes/rooms.js";
import { registerShopRoutes } from "./routes/shop.js";
import { logSafeError } from "./security.js";

/*
 * DOCU: Create app for this feature.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function createApp() {
    const app = express();
    app.disable("x-powered-by");
    app.use((_req: any, res: any, next: any) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "DENY");
        res.setHeader("Referrer-Policy", "no-referrer");
        next();
    });
    app.use(express.json({
        limit: "24kb"
    }));

    app.use(cors({
        origin: [
            "http://localhost:5173",
            "https://pawpal-navy.vercel.app",
            /^https:\/\/pawpal-[a-z0-9-]+\.vercel\.app$/
        ],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"]
    }));

    app.use("/api", enforceAdminGameSettings);
    registerAdminRoutes(app);
    registerPasswordRecovery(app, adminAuth);
    registerAdminConsole(app, adminAuth, auth, publishLive);
    registerHealthRoutes(app);
    registerAuthRoutes(app);
    app.use("/api", (req: any, res: any, next: any) => {
        if (!isWakeActivity(req.path, req.body, req.method)) {
            return next();
        }
        auth(req, res, () => {
            Promise.resolve(wakePetForActivity(String(req.userId)))
                .then(() => next())
                .catch(next);
        });
    });

    registerPetRoutes(app);
    registerShopRoutes(app);
    registerRoomRoutes(app);
    registerLiveRoutes(app);
    registerNotificationRoutes(app);
    registerFriendRoutes(app);
    registerMailRoutes(app);
    registerGardenRoutes(app);
    registerArcadeRoutes(app);
    registerKitchenRoutes(app);
    registerMissionRoutes(app);
    registerMultiplayer(app, auth, publishLive);
    registerDuoClash(app, auth, publishLive);
    // Unknown API paths must return JSON so the frontend can distinguish a missing
    // backend deployment from an HTML page served by the hosting provider.
    app.use("/api", (req: any, res: any) => {
        res.status(404).json({
            error: "API endpoint not found. Check that Render is running the latest PawPal backend."
        });
    });

    // Centralized error capture. Log error codes only, never private request data.
    app.use((error: any, req: any, res: any, _next: any) => {
        logSafeError("API request failed", error);
        logServerFailure(String(req.path || "unknown"), error?.code);
        if (!res.headersSent) {
            if (error?.code === "42P01" || error?.code === "42703") {
                res.status(503).json({
                    error: "The PawPal database schema is not up to date. Apply the required Neon migrations, including 017 and 018."
                });
            } else {
                res.status(500).json({
                    error: "The server could not complete this request. Check the Render logs."
                });
            }
        }
    });
    return app;
}
