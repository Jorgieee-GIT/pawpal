import type { Express, RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { pool } from "./db.js";

const DEFAULT_SETTINGS: Record<string, boolean | number> = {
    maintenance_mode: false,
    feature_arcade: true,
    feature_garden: true,
    feature_kitchen: true,
    feature_multiplayer: true,
    feature_missions: true,
    feature_pawclaw: true,
    feature_shop: true,
    arcade_reward_percent: 100,
    garden_reward_percent: 100,
    arcade_cooldown_seconds: 8,
    claw_cooldown_seconds: 15
};
let cachedSettings = { ...DEFAULT_SETTINGS };
let settingsExpiry = 0;

export async function gameSettings(): Promise<Record<string, boolean | number>> {
    if (Date.now() < settingsExpiry) {
        return cachedSettings;
    }
    const result = await pool.query("SELECT key,value FROM admin_game_settings");
    const next = { ...DEFAULT_SETTINGS };
    for (const row of result.rows) {
        if (row.key in next && (typeof row.value === "boolean" || typeof row.value === "number")) {
            next[row.key] = row.value;
        }
    }
    cachedSettings = next;
    settingsExpiry = Date.now() + 3000;
    return next;
}

export const enforceAdminGameSettings: RequestHandler = async (req, res, next) => {
    const path = req.path;
    if (path.startsWith("/admin/") || path.startsWith("/auth/") || path === "/health" ||
        path === "/db-health" || path.startsWith("/support/") || path.startsWith("/announcements") ||
        path === "/system/status" || path === "/live" || path === "/notifications" || path === "/me") {
        next();
        return;
    }
    try {
        const settings = await gameSettings();
        if (settings.maintenance_mode === true && req.method !== "GET") {
            res.status(503).json({ error: "PawPal is under maintenance. Please try again later." });
            return;
        }
        const features: Array<[string, boolean]> = [
            ["feature_multiplayer", path.startsWith("/multiplayer") || path.startsWith("/duo")],
            ["feature_garden", path.startsWith("/garden")],
            ["feature_kitchen", path.startsWith("/kitchen")],
            ["feature_pawclaw", path.startsWith("/claw")],
            ["feature_arcade", path === "/game"],
            ["feature_missions", path.startsWith("/missions") || path.startsWith("/achievement")],
            ["feature_shop", path.startsWith("/furniture") || path === "/item"]
        ];
        const disabled = features.find(([key, matches]) => matches && settings[key] === false);
        if (disabled) {
            res.status(503).json({ error: "This PawPal feature is temporarily disabled by the administrator." });
            return;
        }
        next();
    } catch (error) {
        console.error("Admin settings unavailable", error);
        res.status(503).json({ error: "Game settings are unavailable. Check the Admin Panel migration." });
    }
};

export async function writeAdminAudit(action: string, target: string | null, details: object = {}) {
    await pool.query("INSERT INTO admin_audit_logs(action,target,details) VALUES($1,$2,$3::jsonb)", [action, target, JSON.stringify(details)]);
}

export function logServerFailure(path: string, errorCode: unknown) {
    const code = typeof errorCode === "string" && /^[A-Z0-9_]{1,64}$/.test(errorCode) ? errorCode : "UNKNOWN";
    void pool.query("INSERT INTO admin_error_logs(path,error_code) VALUES($1,$2)", [path.slice(0, 160), code]).catch(() => {});
}

const lastPresenceWrite = new Map<string, number>();
export function updatePresence(userId: string) {
    const now = Date.now();
    if (now - (lastPresenceWrite.get(userId) || 0) < 25000) {
        return;
    }
    lastPresenceWrite.set(userId, now);
    void pool.query(`INSERT INTO admin_player_presence(user_id,last_seen_at) VALUES($1,NOW())
        ON CONFLICT(user_id) DO UPDATE SET last_seen_at=NOW()`, [userId]).catch(() => {});
    if (lastPresenceWrite.size > 3000) {
        for (const [id, time] of lastPresenceWrite) {
            if (now - time > 300000) lastPresenceWrite.delete(id);
        }
    }
}

const catchRoute = (fn: (req: any, res: any) => Promise<void>): RequestHandler => (req, res, next) => {
    Promise.resolve(fn(req, res)).catch(next);
};

export function registerAdminConsole(app: Express, adminAuth: RequestHandler, playerAuth: RequestHandler, notify: (ids: string[], type: string) => void) {
    app.get("/api/system/status", catchRoute(async (_req, res) => {
        const settings = await gameSettings();
        res.set("Cache-Control", "no-store").json({ maintenance: settings.maintenance_mode, features: Object.fromEntries(Object.entries(settings).filter(([key]) => key.startsWith("feature_"))) });
    }));

    app.get("/api/admin/dashboard", adminAuth, catchRoute(async (_req, res) => {
        const [players, pets, online, battles, coins, requests, reports, last] = await Promise.all([
            pool.query("SELECT COUNT(*)::int AS count FROM users"),
            pool.query("SELECT COUNT(*)::int AS count FROM pets"),
            pool.query("SELECT COUNT(*)::int AS count FROM admin_player_presence WHERE last_seen_at>NOW()-INTERVAL '60 seconds'"),
            pool.query("SELECT (SELECT COUNT(*) FROM multiplayer_challenges WHERE status='active')+(SELECT COUNT(*) FROM duo_rooms WHERE status='active') AS count"),
            pool.query("SELECT COALESCE(SUM(coins),0)::bigint AS total FROM pets"),
            pool.query("SELECT COUNT(*)::int AS count FROM password_reset_requests WHERE status='pending'"),
            pool.query("SELECT COUNT(*)::int AS count FROM player_reports WHERE status='open'"),
            pool.query("SELECT id,action,target,created_at FROM admin_audit_logs ORDER BY created_at DESC LIMIT 6")
        ]);
        res.json({ players: players.rows[0].count, pets: pets.rows[0].count, online: online.rows[0].count,
            activeBattles: Number(battles.rows[0].count), pawCoins: Number(coins.rows[0].total),
            passwordRequests: requests.rows[0].count, openReports: reports.rows[0].count, recent: last.rows });
    }));

    app.get("/api/admin/players/:id/profile", adminAuth, catchRoute(async (req, res) => {
        if (!z.string().uuid().safeParse(req.params.id).success) {
            res.status(400).json({ error: "Invalid player ID." });
            return;
        }
        const id = req.params.id;
        const [user, pet, records, achievements, friends, recent, presence, access] = await Promise.all([
            pool.query("SELECT id,username,created_at FROM users WHERE id=$1", [id]),
            pool.query(`SELECT id,name,species,breed,color,equipped_outfit,level,xp,coins,owned_items,owned_cosmetics,owned_breeds,unlocked_rooms,
                owned_colors,room_theme,active_room,garden,food,toys FROM pets WHERE owner_id=$1`, [id]),
            pool.query("SELECT game,best FROM game_records WHERE user_id=$1 ORDER BY game", [id]),
            pool.query("SELECT COUNT(*)::int AS count FROM achievements WHERE user_id=$1", [id]),
            pool.query("SELECT COUNT(*)::int AS count FROM friendships WHERE status='accepted' AND (requester_id=$1 OR recipient_id=$1)", [id]),
            pool.query("SELECT change_amount,source,created_at FROM admin_coin_events WHERE user_id=$1 ORDER BY id DESC LIMIT 20", [id]),
            pool.query("SELECT last_seen_at FROM admin_player_presence WHERE user_id=$1", [id]),
            pool.query("SELECT suspended,lucky_games_access,disabled_features FROM admin_user_access WHERE user_id=$1", [id])
        ]);
        if (!user.rowCount) {
            res.status(404).json({ error: "Player not found." });
            return;
        }
        res.json({ user: user.rows[0], pet: pet.rows[0] || null, records: records.rows,
            achievements: achievements.rows[0].count, friends: friends.rows[0].count,
            coinEvents: recent.rows, lastSeen: presence.rows[0]?.last_seen_at || null,
            access: access.rows[0] || { suspended: false, lucky_games_access: false, disabled_features: [] } });
    }));

    app.patch("/api/admin/players/:id/access", adminAuth, catchRoute(async (req, res) => {
        const id = z.string().uuid().safeParse(req.params.id);
        const schema = z.object({
            suspended: z.boolean(),
            luckyGamesAccess: z.boolean(),
            disabledFeatures: z.array(z.enum(["arcade", "garden", "kitchen", "multiplayer", "missions", "pawclaw", "shop"])).max(7)
        });
        const data = schema.safeParse(req.body);
        if (!id.success || !data.success) {
            res.status(400).json({ error: "Invalid player access controls." });
            return;
        }
        const existing = await pool.query("SELECT id FROM users WHERE id=$1", [id.data]);
        if (!existing.rowCount) {
            res.status(404).json({ error: "Account not found." });
            return;
        }
        await pool.query(`INSERT INTO admin_user_access(user_id,suspended,lucky_games_access,disabled_features)
            VALUES($1,$2,$3,$4::jsonb)
            ON CONFLICT(user_id) DO UPDATE SET suspended=EXCLUDED.suspended,
                lucky_games_access=EXCLUDED.lucky_games_access,
                disabled_features=EXCLUDED.disabled_features,updated_at=NOW()`,
            [id.data, data.data.suspended, data.data.luckyGamesAccess, JSON.stringify(data.data.disabledFeatures)]);
        await writeAdminAudit("player_access_changed", id.data, data.data);
        res.json({ success: true });
    }));

    app.post("/api/admin/players/:id/coins", adminAuth, catchRoute(async (req, res) => {
        const id = z.string().uuid().safeParse(req.params.id);
        const change = z.object({ amount: z.number().int().min(-10000).max(10000).refine(v => v !== 0), reason: z.string().trim().min(6).max(200) }).safeParse(req.body);
        if (!id.success || !change.success) {
            res.status(400).json({ error: "Enter a valid coin adjustment (-10,000 to +10,000) and a reason of at least 6 characters." });
            return;
        }
        const db = await pool.connect();
        try {
            await db.query("BEGIN");
            const updated = await db.query("UPDATE pets SET coins=coins+$2,updated_at=NOW() WHERE owner_id=$1 AND coins+$2>=0 RETURNING coins", [id.data, change.data.amount]);
            if (!updated.rowCount) {
                await db.query("ROLLBACK");
                res.status(409).json({ error: "Pet not found or the adjustment would create a negative balance." });
                return;
            }
            await db.query("INSERT INTO admin_coin_events(user_id,change_amount,source) VALUES($1,$2,$3)", [id.data, change.data.amount, "admin_adjustment"]);
            await db.query("INSERT INTO admin_audit_logs(action,target,details) VALUES('coins_adjusted',$1,$2::jsonb)", [id.data, JSON.stringify({ amount: change.data.amount, reason: change.data.reason })]);
            await db.query("COMMIT");
            notify([id.data], "pet_updated");
            res.json({ coins: updated.rows[0].coins });
        } catch (error) {
            await db.query("ROLLBACK").catch(() => {});
            throw error;
        } finally {
            db.release();
        }
    }));

    app.get("/api/admin/settings", adminAuth, catchRoute(async (_req, res) => {
        res.json({ settings: await gameSettings() });
    }));
    app.patch("/api/admin/settings", adminAuth, catchRoute(async (req, res) => {
        const input = z.object({ key: z.enum(Object.keys(DEFAULT_SETTINGS) as [string, ...string[]]), value: z.union([z.boolean(), z.number().int()]) }).safeParse(req.body);
        if (!input.success) {
            res.status(400).json({ error: "Invalid setting." });
            return;
        }
        const { key, value } = input.data;
        const isPercent = key.endsWith("_percent");
        const isCooldown = key.endsWith("_cooldown_seconds");
        const cooldownRange = key.startsWith("arcade") ? [8, 60] : [15, 120];
        if ((isPercent && (typeof value !== "number" || value < 50 || value > 150)) ||
            (isCooldown && (typeof value !== "number" || value < cooldownRange[0] || value > cooldownRange[1])) ||
            (!isPercent && !isCooldown && typeof value !== "boolean")) {
            res.status(400).json({ error: isPercent ? "Reward percentage must be 50–150." : isCooldown ?
                "Cooldown is outside the allowed range." : "Select enabled or disabled." });
            return;
        }
        await pool.query("UPDATE admin_game_settings SET value=$2::jsonb,updated_at=NOW() WHERE key=$1", [key, JSON.stringify(value)]);
        settingsExpiry = 0;
        await writeAdminAudit("setting_changed", key, { value });
        res.json({ settings: await gameSettings() });
    }));

    app.get("/api/admin/multiplayer-monitor", adminAuth, catchRoute(async (_req, res) => {
        const [classic, duo] = await Promise.all([
            pool.query(`SELECT c.id,c.status,c.wager,c.created_at,c.updated_at,ua.username AS challenger,ub.username AS opponent,
                uw.username AS winner FROM multiplayer_challenges c
                JOIN users ua ON ua.id=c.challenger_id JOIN users ub ON ub.id=c.challenged_id
                LEFT JOIN users uw ON uw.id=c.winner_id ORDER BY c.updated_at DESC LIMIT 40`),
            pool.query("SELECT id,code,status,wager,participants,winner_team,created_at,updated_at FROM duo_rooms ORDER BY updated_at DESC LIMIT 40")
        ]);
        res.json({ classic: classic.rows, duo: duo.rows });
    }));

    app.get("/api/admin/economy", adminAuth, catchRoute(async (_req, res) => {
        const [balances, fees, events, items, top] = await Promise.all([
            pool.query("SELECT COALESCE(SUM(coins),0)::bigint AS total,COALESCE(AVG(coins),0)::numeric(12,2) AS average,COALESCE(MAX(coins),0)::int AS largest FROM pets"),
            pool.query("SELECT COALESCE(SUM(fee_amount),0)::bigint AS collected,COUNT(*)::int AS matches FROM arena_fee_ledger"),
            pool.query(`SELECT COALESCE(SUM(change_amount) FILTER(WHERE change_amount>0),0)::bigint AS earned,
                COALESCE(-SUM(change_amount) FILTER(WHERE change_amount<0),0)::bigint AS spent,
                COUNT(*)::int AS events FROM admin_coin_events`),
            pool.query("SELECT COUNT(*)::int AS count FROM pets WHERE jsonb_array_length(owned_items)>1"),
            pool.query("SELECT u.username,p.coins,p.level FROM pets p JOIN users u ON u.id=p.owner_id ORDER BY p.coins DESC LIMIT 10")
        ]);
        res.json({ balances: balances.rows[0], arenaFees: fees.rows[0], tracked: events.rows[0],
            collectors: items.rows[0].count, top: top.rows });
    }));

    app.get("/api/admin/activity", adminAuth, catchRoute(async (_req, res) => {
        const [games, species, recent, active] = await Promise.all([
            pool.query("SELECT game,COUNT(*)::int AS players,MAX(best)::int AS best FROM game_records GROUP BY game ORDER BY players DESC LIMIT 15"),
            pool.query("SELECT species,COUNT(*)::int AS players FROM pets GROUP BY species ORDER BY players DESC"),
            pool.query("SELECT u.username,p.last_seen_at FROM admin_player_presence p JOIN users u ON u.id=p.user_id ORDER BY p.last_seen_at DESC LIMIT 25"),
            pool.query("SELECT COUNT(*)::int AS count FROM admin_player_presence WHERE last_seen_at>NOW()-INTERVAL '60 seconds'")
        ]);
        res.json({ games: games.rows, species: species.rows, recentPlayers: recent.rows, online: active.rows[0].count });
    }));

    app.get("/api/admin/announcements", adminAuth, catchRoute(async (_req, res) => {
        const q = await pool.query("SELECT * FROM admin_announcements ORDER BY created_at DESC LIMIT 50");
        res.json({ announcements: q.rows });
    }));
    app.post("/api/admin/announcements", adminAuth, catchRoute(async (req, res) => {
        const input = z.object({ title: z.string().trim().min(3).max(100), body: z.string().trim().min(5).max(1200),
            audience: z.enum(["all", "selected"]), usernames: z.array(z.string().trim().min(3).max(24)).max(30).default([]),
            hours: z.number().int().min(1).max(168), publishAt: z.string().datetime({ offset: true }).optional() }).safeParse(req.body);
        if (!input.success) {
            res.status(400).json({ error: "Enter a title, message, audience and validity (1–168 hours)." });
            return;
        }
        const x = input.data;
        const publishAt = x.publishAt ? new Date(x.publishAt) : new Date();
        if (publishAt.getTime() < Date.now() - 60000 || publishAt.getTime() > Date.now() + 30 * 86400000) {
            res.status(400).json({ error: "Schedule announcements within the next 30 days." });
            return;
        }
        let ids: string[] = [];
        if (x.audience === "selected") {
            if (!x.usernames.length) {
                res.status(400).json({ error: "Choose at least one username." });
                return;
            }
            const found = await pool.query("SELECT id,username FROM users WHERE LOWER(username)=ANY($1::text[])", [x.usernames.map(v => v.toLowerCase())]);
            if (found.rowCount !== new Set(x.usernames.map(v => v.toLowerCase())).size) {
                res.status(400).json({ error: "One or more usernames do not exist." });
                return;
            }
            ids = found.rows.map(row => String(row.id));
        }
        const id = randomUUID();
        await pool.query(`INSERT INTO admin_announcements(id,title,body,audience,recipients,publish_at,expires_at)
            VALUES($1,$2,$3,$4,$5::jsonb,$6::timestamptz,$6::timestamptz+($7::text || ' hours')::interval)`,
            [id, x.title, x.body, x.audience, JSON.stringify(ids), publishAt.toISOString(), x.hours]);
        await writeAdminAudit("announcement_sent", id, { audience: x.audience, recipients: ids.length });
        const notifyIds = x.audience === "selected" ? ids : (await pool.query("SELECT id FROM users LIMIT 5000")).rows.map(row => String(row.id));
        if (publishAt.getTime() <= Date.now()) {
            notify(notifyIds, "announcement");
        }
        res.status(201).json({ id, scheduled: publishAt.getTime() > Date.now() });
    }));
    app.post("/api/admin/announcements/:id/archive", adminAuth, catchRoute(async (req, res) => {
        if (!z.string().uuid().safeParse(req.params.id).success) {
            res.status(400).json({ error: "Invalid announcement ID." });
            return;
        }
        const q = await pool.query("UPDATE admin_announcements SET status='archived' WHERE id=$1 AND status='active' RETURNING id", [req.params.id]);
        if (!q.rowCount) {
            res.status(404).json({ error: "Announcement not found or already archived." });
            return;
        }
        await writeAdminAudit("announcement_archived", req.params.id);
        res.json({ success: true });
    }));

    app.get("/api/announcements", playerAuth, catchRoute(async (req: any, res) => {
        const q = await pool.query(`SELECT a.id,a.title,a.body,a.created_at,a.expires_at,
            (r.user_id IS NULL) AS unread FROM admin_announcements a
            LEFT JOIN admin_announcement_reads r ON r.announcement_id=a.id AND r.user_id=$1
            WHERE a.status='active' AND a.publish_at<=NOW() AND a.expires_at>NOW()
                AND (a.audience='all' OR a.recipients @> to_jsonb(ARRAY[$1::text]))
            ORDER BY a.created_at DESC LIMIT 10`, [req.userId]);
        res.json({ announcements: q.rows });
    }));
    app.post("/api/announcements/:id/read", playerAuth, catchRoute(async (req: any, res) => {
        if (!z.string().uuid().safeParse(req.params.id).success) {
            res.status(400).json({ error: "Invalid announcement." });
            return;
        }
        await pool.query(`INSERT INTO admin_announcement_reads(announcement_id,user_id)
            SELECT a.id,$2 FROM admin_announcements a WHERE a.id=$1 AND a.status='active'
            AND a.publish_at<=NOW() AND a.expires_at>NOW() AND (a.audience='all' OR a.recipients @> to_jsonb(ARRAY[$2::text]))
            ON CONFLICT DO NOTHING`, [req.params.id, req.userId]);
        res.json({ success: true });
    }));

    app.post("/api/support/report", playerAuth, catchRoute(async (req: any, res) => {
        const input = z.object({ category: z.enum(["bug", "player", "feedback", "other"]), description: z.string().trim().min(15).max(1000) }).safeParse(req.body);
        if (!input.success) {
            res.status(400).json({ error: "Choose a category and describe the issue in 15–1,000 characters." });
            return;
        }
        const recent = await pool.query("SELECT COUNT(*)::int AS count FROM player_reports WHERE user_id=$1 AND created_at>NOW()-INTERVAL '1 day'", [req.userId]);
        if (recent.rows[0].count >= 5) {
            res.status(429).json({ error: "You can send up to five reports each day." });
            return;
        }
        await pool.query("INSERT INTO player_reports(id,user_id,category,description) VALUES($1,$2,$3,$4)", [randomUUID(), req.userId, input.data.category, input.data.description]);
        res.status(201).json({ message: "Your report was sent to the PawPal administrator." });
    }));
    app.get("/api/admin/reports", adminAuth, catchRoute(async (_req, res) => {
        const q = await pool.query(`SELECT r.id,r.category,r.description,r.status,r.created_at,r.updated_at,u.username
            FROM player_reports r JOIN users u ON u.id=r.user_id ORDER BY r.created_at DESC LIMIT 100`);
        res.json({ reports: q.rows });
    }));
    app.patch("/api/admin/reports/:id", adminAuth, catchRoute(async (req, res) => {
        const id = z.string().uuid().safeParse(req.params.id);
        const body = z.object({ status: z.enum(["open", "reviewing", "resolved"]) }).safeParse(req.body);
        if (!id.success || !body.success) {
            res.status(400).json({ error: "Invalid report or status." });
            return;
        }
        const q = await pool.query("UPDATE player_reports SET status=$2,updated_at=NOW() WHERE id=$1 RETURNING id", [id.data, body.data.status]);
        if (!q.rowCount) {
            res.status(404).json({ error: "Report not found." });
            return;
        }
        await writeAdminAudit("report_status_changed", id.data, { status: body.data.status });
        res.json({ success: true });
    }));

    app.get("/api/admin/logs", adminAuth, catchRoute(async (_req, res) => {
        const [audit, errors] = await Promise.all([
            pool.query("SELECT id,action,target,details,created_at FROM admin_audit_logs ORDER BY id DESC LIMIT 80"),
            pool.query("SELECT id,path,error_code,created_at FROM admin_error_logs ORDER BY id DESC LIMIT 80")
        ]);
        res.json({ audit: audit.rows, errors: errors.rows });
    }));
}
