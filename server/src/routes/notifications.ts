import type { Express } from "express";
import { z } from "zod";
import { auth } from "../auth.js";
import { pool } from "../db.js";
import { handle } from "../http.js";

export function registerNotificationRoutes(app: Express) {
    // Batch 39: bounded notification feed. Derive from existing tables, no unbounded notification storage.
    async function getNotificationFeed(userId: string) {
        const result = await pool.query(
            `
  SELECT feed.kind, feed.actor, feed.event_id, feed.created_at,
         (feed.unread AND seen.user_id IS NULL) AS unread, feed.game_name, feed.wager FROM (
   SELECT 'friend_request' AS kind, u.username AS actor, f.requester_id::text AS event_id,
          f.created_at, true AS unread, NULL::text AS game_name, NULL::integer AS wager
   FROM friendships f JOIN users u ON u.id=f.requester_id
   WHERE f.recipient_id=$1 AND f.status='pending'
   UNION ALL
   SELECT 'friend_accepted', u.username, f.recipient_id::text, f.created_at, false, NULL::text, NULL::integer
   FROM friendships f JOIN users u ON u.id=f.recipient_id
   WHERE f.requester_id=$1 AND f.status='accepted'
   UNION ALL
   SELECT 'mail', u.username, m.id::text, m.created_at, (m.read_at IS NULL), NULL::text, NULL::integer
   FROM paw_mail m JOIN users u ON u.id=m.sender_id
   WHERE m.recipient_id=$1 AND m.expires_at>NOW()
   UNION ALL
   SELECT 'multiplayer_challenge', u.username, c.id::text, c.created_at, true, 'Paw Brawl', c.wager
   FROM multiplayer_challenges c JOIN users u ON u.id=c.challenger_id
   WHERE c.challenged_id=$1 AND c.status='pending' AND c.expires_at>NOW()
   UNION ALL
   SELECT 'multiplayer_result', u.username, c.id::text, c.updated_at, false, 'Paw Brawl', c.wager
   FROM multiplayer_challenges c JOIN users u ON u.id=CASE WHEN c.challenger_id=$1 THEN c.challenged_id ELSE c.challenger_id END
   WHERE (c.challenger_id=$1 OR c.challenged_id=$1) AND c.status='finished'
   UNION ALL
   SELECT 'duo_invite', u.username, i.id::text, i.created_at, true, 'Duo Clash 2v2', r.wager
   FROM duo_invites i JOIN users u ON u.id=i.inviter_id JOIN duo_rooms r ON r.id=i.room_id
   WHERE i.recipient_id=$1 AND i.expires_at>NOW() AND r.status='lobby'
     AND NOT (r.participants @> jsonb_build_array(jsonb_build_object('userId', $1::text)))
  ) feed LEFT JOIN player_notification_seen seen
      ON seen.user_id=$1 AND seen.kind=feed.kind AND seen.event_id=feed.event_id
      AND seen.event_created_at=feed.created_at
  ORDER BY feed.created_at DESC LIMIT 5`,
            [userId]
        );
        const adminNotices = await pool.query(
            `SELECT a.id::text AS event_id, 'announcement' AS kind,
        'PawPal Admin' AS actor,a.created_at, (rr.user_id IS NULL AND seen.user_id IS NULL) AS unread,
        NULL::text AS game_name,NULL::integer AS wager,a.title,a.body
        FROM admin_announcements a
        LEFT JOIN admin_announcement_reads rr ON rr.announcement_id=a.id AND rr.user_id=$1
        LEFT JOIN player_notification_seen seen ON seen.user_id=$1 AND seen.kind='announcement' AND seen.event_id=a.id::text
            AND seen.event_created_at=a.created_at
        WHERE a.status='active' AND a.publish_at<=NOW() AND a.expires_at>NOW()
        AND (a.audience='all' OR a.recipients @> to_jsonb(ARRAY[$1::text]))
        ORDER BY a.created_at DESC LIMIT 5`,
            [userId]
        );
        const feed = [...result.rows, ...adminNotices.rows]
            .sort(
                (a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            .slice(0, 5);
        return feed;
    }

    app.get("/api/notifications", auth, handle(async (req, res) => {
        res.json(await getNotificationFeed(req.userId));
    }));

    // Notification viewing is separate from accepting an invitation or reading PawMail.
    // Only items visible in this user's own feed may be marked as seen.
    app.post("/api/notifications/seen", auth, handle(async (req, res) => {
        const input = z
            .object({
                items: z
                    .array(
                        z.object({
                            kind: z.string().min(1).max(50),
                            event_id: z.string().min(1).max(100),
                            created_at: z.string().min(1).max(50)
                        })
                    )
                    .max(10)
            })
            .safeParse(req.body);
        if (!input.success) {
            res.status(400).json({ error: "Invalid notifications." });
            return;
        }
        const feed = await getNotificationFeed(req.userId);
        const seen = feed
            .filter((item) =>
                input.data.items.some(
                    (viewed) =>
                        viewed.kind === item.kind &&
                        viewed.event_id === item.event_id &&
                        Date.parse(viewed.created_at) === new Date(item.created_at).getTime()
                )
            )
            .map((item) => ({
                kind: item.kind,
                event_id: item.event_id,
                event_created_at: new Date(item.created_at).toISOString()
            }));
        if (seen.length) {
            await pool.query(
                `INSERT INTO player_notification_seen(user_id,kind,event_id,event_created_at)
            SELECT $1, incoming.kind, incoming.event_id, incoming.event_created_at
            FROM jsonb_to_recordset($2::jsonb) AS incoming(kind text,event_id text,event_created_at timestamptz)
            ON CONFLICT DO NOTHING`,
                [req.userId, JSON.stringify(seen)]
            );
            const announcementIds = seen
                .filter((item) => item.kind === "announcement")
                .map((item) => item.event_id);
            if (announcementIds.length) {
                // Keep the older announcement-only read endpoint consistent too.
                await pool.query(
                    `INSERT INTO admin_announcement_reads(announcement_id,user_id)
                SELECT id,$1 FROM admin_announcements WHERE id=ANY($2::uuid[])
                ON CONFLICT DO NOTHING`,
                    [req.userId, announcementIds]
                );
            }
        }
        res.json({ success: true, seen: seen.length });
    }));
}
