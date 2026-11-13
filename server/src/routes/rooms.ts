import type { Express } from "express";
import { z } from "zod";
import { auth } from "../auth.js";
import { pool } from "../db.js";
import {
    DEFAULT_ROOM_FURNITURE,
    FURNITURE_BY_ROOM,
    FURNITURE_UNLOCK_LEVELS,
    initialLayout
} from "../furnitureCatalog.js";
import { handle } from "../http.js";
import { recordMissionEvent } from "../missions.js";

export function registerRoomRoutes(app: Express) {
    app.get("/api/furniture/catalog", auth, (_req, res) =>
        res.json({
            items: FURNITURE_BY_ROOM,
            defaults: DEFAULT_ROOM_FURNITURE
        })
    );

    app.post("/api/furniture", auth, handle(async (req, res) => {
        const parsed = z
            .object({
                room: z.enum(["living", "bedroom", "studio", "sports"]),
                action: z.enum(["buy", "place", "move", "store", "reset"]),
                item: z.string().min(1).max(60).optional(),
                x: z.number().min(5).max(95).optional(),
                y: z.number().min(20).max(85).optional()
            })
            .safeParse(req.body);
        if (!parsed.success) {
            return void res.status(400).json({
                error: "Invalid furniture action or coordinates."
            });
        }
        const { room, action, item, x, y } = parsed.data;
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const result = await client.query(
                "SELECT id,level,coins,owned_items,room_layouts,unlocked_rooms FROM pets WHERE owner_id=$1 FOR UPDATE",
                [req.userId]
            );
            if (!result.rows[0]) {
                await client.query("ROLLBACK");
                return void res.status(404).json({
                    error: "Adopt a pet first."
                });
            }
            const p = result.rows[0];
            if (!["living", "bedroom"].includes(room) && !p.unlocked_rooms.includes(room)) {
                await client.query("ROLLBACK");
                return void res.status(403).json({
                    error: "Unlock this room first."
                });
            }
            const layouts = {
                ...(p.room_layouts || {})
            };
            const entries: Array<{
                id: string;
                x: number;
                y: number;
            }> = Array.isArray(layouts[room]) ? layouts[room] : initialLayout(room);
            const owned: string[] = Array.isArray(p.owned_items) ? p.owned_items : [];
            const isDefault = (id: string) => DEFAULT_ROOM_FURNITURE[room].includes(id);
            const price = item ? FURNITURE_BY_ROOM[room][item] : undefined;
            let message = "Furniture updated.";
            if (action === "buy") {
                if (!item || price === undefined) {
                    await client.query("ROLLBACK");
                    return void res.status(400).json({
                        error: "Not sold in this room."
                    });
                }
                if (owned.includes(item)) {
                    await client.query("ROLLBACK");
                    return void res.status(409).json({
                        error: "Already owned."
                    });
                }
                if (p.level < (FURNITURE_UNLOCK_LEVELS[item] || 1)) {
                    await client.query("ROLLBACK");
                    return void res.status(403).json({
                        error: `Unlocks at Level ${FURNITURE_UNLOCK_LEVELS[item]}.`
                    });
                }
                if (p.coins < price) {
                    await client.query("ROLLBACK");
                    return void res.status(400).json({
                        error: "Not enough coins."
                    });
                }
                await client.query(
                    "UPDATE pets SET coins=coins-$2,owned_items=owned_items || $3::jsonb WHERE id=$1",
                    [p.id, price, JSON.stringify([item])]
                );
                message = "Furniture purchased!";
            } else if (action === "reset") {
                layouts[room] = initialLayout(room);
                message = "Default furniture restored.";
            } else {
                if (
                    !item ||
                    (!isDefault(item) && (!owned.includes(item) || price === undefined))
                ) {
                    await client.query("ROLLBACK");
                    return void res.status(403).json({
                        error: "Furniture is not available or not owned."
                    });
                }
                const idx = entries.findIndex((f) => f.id === item);
                if (action === "store") {
                    if (idx < 0) {
                        await client.query("ROLLBACK");
                        return void res.status(400).json({
                            error: "Furniture is not placed."
                        });
                    }
                    entries.splice(idx, 1);
                    message = "Furniture stored.";
                }
                if (action === "place") {
                    if (idx >= 0) {
                        await client.query("ROLLBACK");
                        return void res.status(409).json({
                            error: "Already placed."
                        });
                    }
                    entries.push({
                        id: item,
                        x: x ?? 50,
                        y: y ?? 62
                    });
                    message = "Furniture placed.";
                }
                if (action === "move") {
                    if (idx < 0 || x === undefined || y === undefined) {
                        await client.query("ROLLBACK");
                        return void res.status(400).json({
                            error: "Furniture is not placed or coordinates missing."
                        });
                    }
                    entries[idx] = {
                        id: item,
                        x,
                        y
                    };
                    message = "Furniture moved.";
                }
                layouts[room] = entries;
            }
            if (action !== "buy") {
                await client.query("UPDATE pets SET room_layouts=$2::jsonb WHERE id=$1", [
                    p.id,
                    JSON.stringify(layouts)
                ]);
            }
            if (action === "buy") {
                await recordMissionEvent(client, req.userId, "buy");
            }
            if (action === "place") {
                await recordMissionEvent(client, req.userId, "furniture");
            }
            await client.query("COMMIT");
            res.json({
                message
            });
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }));

    // Batch 9: server-authoritative room unlocking and selection.
    app.post("/api/rooms", auth, handle(async (req, res) => {
        const v = z
            .object({
                room: z.enum(["living", "bedroom", "studio", "sports"]),
                action: z.enum(["enter", "unlock"])
            })
            .safeParse(req.body);
        if (!v.success) {
            return void res.status(400).json({
                error: "Invalid room action."
            });
        }
        const { room, action } = v.data;
        const price = room === "studio" ? 5000 : room === "sports" ? 8000 : 0;
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const q = await client.query(
                "SELECT id,coins,unlocked_rooms FROM pets WHERE owner_id=$1 FOR UPDATE",
                [req.userId]
            );
            if (!q.rows[0]) {
                await client.query("ROLLBACK");
                return void res.status(404).json({
                    error: "Adopt a pet first."
                });
            }
            const pet = q.rows[0];
            const unlocked: Array<string> = Array.isArray(pet.unlocked_rooms)
                ? pet.unlocked_rooms
                : [];
            const owned = room === "living" || room === "bedroom" || unlocked.includes(room);
            if (action === "unlock" && !owned) {
                if (pet.coins < price) {
                    await client.query("ROLLBACK");
                    return void res.status(400).json({
                        error: `You need ${price.toLocaleString()} coins to unlock this room.`
                    });
                }
                await client.query(
                    "UPDATE pets SET coins=coins-$2,unlocked_rooms=unlocked_rooms || $3::jsonb,active_room=$4 WHERE id=$1",
                    [pet.id, price, JSON.stringify([room]), room]
                );
            } else if (action === "enter" && owned) {
                await client.query("UPDATE pets SET active_room=$2 WHERE id=$1", [
                    pet.id,
                    room
                ]);
            } else {
                await client.query("ROLLBACK");
                return void res.status(403).json({
                    error: "Unlock this room first."
                });
            }
            await recordMissionEvent(client, req.userId, "room");
            if (action === "unlock" && !owned) {
                await recordMissionEvent(client, req.userId, "buy");
            }
            await client.query("COMMIT");
            res.json({
                message:
                    action === "unlock" && !owned
                        ? "Room unlocked!"
                        : "Welcome to your " + room + "!"
            });
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    }));

    app.get("/api/room", auth, handle(async (req, res) => {
        const q = await pool.query(
            `SELECT p.id,p.name,p.species,p.color,p.breed,p.level,p.hunger,p.happiness,p.energy,p.cleanliness,p.equipped_cosmetic,p.equipped_outfit,u.username,u.id AS user_id,CASE WHEN u.note_expires_at>NOW() THEN u.pet_note ELSE NULL END AS pet_note,u.note_expires_at,COALESCE((p.garden->>'_sleeping')::boolean,false) AS sleeping FROM pets p JOIN users u ON u.id=p.owner_id WHERE p.owner_id=$1 OR EXISTS(SELECT 1 FROM friendships f WHERE f.status='accepted' AND ((f.requester_id=$1 AND f.recipient_id=p.owner_id) OR (f.recipient_id=$1 AND f.requester_id=p.owner_id)))`,
            [req.userId]
        );
        res.json(q.rows);
    }));
}
