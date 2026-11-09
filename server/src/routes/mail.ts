import type { Express } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { auth } from "../auth.js";
import { pool } from "../db.js";
import { handle } from "../http.js";
import { publishLive } from "../live.js";
import { pawMailCatalog, pawMailDesigns } from "../mailCatalog.js";
import { recordMissionEvent } from "../missions.js";

export function registerMailRoutes(app: Express) {
    // Personalized PawMail envelopes: ownership and coin purchases enforced server-side.
    const pawMailColors = [
        "blush",
        "rose",
        "peach",
        "apricot",
        "butter",
        "mint",
        "sage",
        "aqua",
        "sky",
        "periwinkle",
        "lavender",
        "lilac",
        "cream",
        "coral",
        "slate"
    ] as const;

    app.get("/api/mail/designs", auth, handle(async (req, res) => {
        const r = await pool.query("SELECT design FROM paw_mail_envelopes WHERE user_id=$1", [
            req.userId
        ]);
        res.json({
            owned: ["classic", ...r.rows.map((x) => x.design)],
            catalog: pawMailCatalog
        });
    }));

    app.post("/api/mail/designs/buy", auth, handle(async (req, res) => {
        const parsed = z
            .object({
                design: z
                    .string()
                    .refine((value) =>
                        pawMailDesigns.includes(value as (typeof pawMailDesigns)[number])
                    )
            })
            .safeParse(req.body);
        if (!parsed.success || parsed.data.design === "classic") {
            return void res.status(400).json({
                error: "Choose a premium envelope design."
            });
        }
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const pet = await client.query(
                "SELECT coins,level FROM pets WHERE owner_id=$1 FOR UPDATE",
                [req.userId]
            );
            if (!pet.rowCount) {
                await client.query("ROLLBACK");
                return void res.status(404).json({
                    error: "Adopt a pet first."
                });
            }
            const owned = await client.query(
                "SELECT 1 FROM paw_mail_envelopes WHERE user_id=$1 AND design=$2",
                [req.userId, parsed.data.design]
            );
            if (owned.rowCount) {
                await client.query("ROLLBACK");
                return void res.status(409).json({
                    error: "You already own this design."
                });
            }
            const design = pawMailCatalog.find((item) => item.id === parsed.data.design)!;
            if (pet.rows[0].level < design.level) {
                await client.query("ROLLBACK");
                return void res.status(403).json({
                    error: `Reach Pet Level ${design.level} to unlock ${design.title}.`
                });
            }
            if (pet.rows[0].coins < design.price) {
                await client.query("ROLLBACK");
                return void res.status(400).json({
                    error: `You need ${design.price.toLocaleString()} coins.`
                });
            }
            await client.query("UPDATE pets SET coins=coins-$1 WHERE owner_id=$2", [
                design.price,
                req.userId
            ]);
            await client.query("INSERT INTO paw_mail_envelopes(user_id,design) VALUES($1,$2)", [
                req.userId,
                parsed.data.design
            ]);
            await client.query("COMMIT");
            res.json({
                message: "Envelope design unlocked!"
            });
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }));

    app.get("/api/mail", auth, handle(async (req, res) => {
        const result = await pool.query(
            `SELECT m.id,m.sender_id,m.design,m.color,m.message,m.created_at,m.expires_at,m.read_at,u.username AS sender_username,
  CASE WHEN p.id IS NULL THEN NULL ELSE json_build_object('species',p.species,'color',p.color,'breed',p.breed,'equipped_cosmetic',p.equipped_cosmetic,'equipped_outfit',p.equipped_outfit) END AS sender_pet
  FROM paw_mail m JOIN users u ON u.id=m.sender_id LEFT JOIN pets p ON p.owner_id=m.sender_id
  WHERE m.recipient_id=$1 AND m.expires_at>NOW() ORDER BY m.created_at DESC LIMIT 60`,
            [req.userId]
        );
        res.json(result.rows);
    }));

    app.get("/api/mail/sent", auth, handle(async (req, res) => {
        const result = await pool.query(
            `SELECT m.id,m.sender_id,m.design,m.color,m.message,m.created_at,m.expires_at,m.read_at,
  u.username AS recipient_username,
  CASE WHEN p.id IS NULL THEN NULL ELSE json_build_object('species',p.species,'color',p.color,'breed',p.breed,'equipped_cosmetic',p.equipped_cosmetic,'equipped_outfit',p.equipped_outfit) END AS sender_pet
  FROM paw_mail m JOIN users u ON u.id=m.recipient_id LEFT JOIN pets p ON p.owner_id=m.sender_id
  WHERE m.sender_id=$1 AND m.expires_at>NOW() ORDER BY m.created_at DESC LIMIT 60`,
            [req.userId]
        );
        res.json(result.rows);
    }));

    app.post("/api/mail", auth, handle(async (req, res) => {
        const parsed = z
            .object({
                friendId: z.string().uuid(),
                design: z
                    .string()
                    .refine((value) =>
                        pawMailDesigns.includes(value as (typeof pawMailDesigns)[number])
                    ),
                color: z.enum(pawMailColors),
                message: z.string().trim().min(1).max(100)
            })
            .safeParse(req.body);
        if (!parsed.success) {
            return void res.status(400).json({
                error: "Choose a friend, envelope, color, and a message (1–100 characters)."
            });
        }
        if (parsed.data.friendId === req.userId) {
            return void res.status(400).json({
                error: "You cannot mail yourself."
            });
        }
        const friendship = await pool.query(
            `SELECT 1 FROM friendships WHERE status='accepted' AND
 ((requester_id=$1 AND recipient_id=$2) OR (requester_id=$2 AND recipient_id=$1))`,
            [req.userId, parsed.data.friendId]
        );
        if (!friendship.rowCount) {
            return void res.status(403).json({
                error: "You can only send PawMail to friends."
            });
        }
        if (parsed.data.design !== "classic") {
            const owned = await pool.query(
                "SELECT 1 FROM paw_mail_envelopes WHERE user_id=$1 AND design=$2",
                [req.userId, parsed.data.design]
            );
            if (!owned.rowCount) {
                return void res.status(403).json({
                    error: "Buy this envelope design first."
                });
            }
        }
        await pool.query(
            `INSERT INTO paw_mail(id,sender_id,recipient_id,design,color,message,expires_at)
 VALUES($1,$2,$3,$4,$5,$6,NOW()+INTERVAL '24 hours')`,
            [
                randomUUID(),
                req.userId,
                parsed.data.friendId,
                parsed.data.design,
                parsed.data.color,
                parsed.data.message
            ]
        );
        await recordMissionEvent(pool, req.userId, "mail");
        publishLive([parsed.data.friendId, req.userId], "mail");
        res.status(201).json({
            message: "Your personalized PawMail was sent!"
        });
    }));

    app.patch("/api/mail/:id/read", auth, handle(async (req, res) => {
        const result = await pool.query(
            "UPDATE paw_mail SET read_at=COALESCE(read_at,NOW()) WHERE id=$1 AND recipient_id=$2 AND expires_at>NOW() RETURNING id",
            [req.params.id, req.userId]
        );
        if (!result.rowCount) {
            return void res.status(404).json({
                error: "Postcard not found or expired."
            });
        }
        res.json({
            message: "Postcard opened!"
        });
    }));

    app.delete("/api/mail/:id", auth, handle(async (req, res) => {
        const result = await pool.query(
            "DELETE FROM paw_mail WHERE id=$1 AND recipient_id=$2 RETURNING id",
            [req.params.id, req.userId]
        );
        if (!result.rowCount) {
            return void res.status(404).json({
                error: "Postcard not found."
            });
        }
        res.json({
            message: "Postcard removed."
        });
    }));
}
