import { randomUUID } from "node:crypto";
import { pool } from "./db.js";

// Live updates use authenticated Server-Sent Events and PostgreSQL LISTEN/NOTIFY.
// This works across multiple Node processes connected to the same PostgreSQL database.
export const liveClients = new Map<string, Set<any>>();

const liveInstanceId = randomUUID();

function writeLive(userId: string, type: string) {
    for (const res of liveClients.get(userId) || []) {
        if (!res.writableEnded && !res.destroyed) {
            try {
                res.write(`event: update\ndata: ${JSON.stringify({ type })}\n\n`);
            } catch (error) {
                console.warn("Live stream was already disconnected", error);
            }
        }
    }
}

export function publishLive(userIds: string[], type: string) {
    const unique = [...new Set(userIds.filter(Boolean))];
    for (const id of unique) {
        // Deliver immediately to users connected to this process. Postgres is
        // still used to reach clients attached to another Render instance.
        writeLive(id, type);
        const payload = JSON.stringify({
            userId: id,
            type,
            at: Date.now(),
            origin: liveInstanceId
        });
        void pool
            .query("SELECT pg_notify($1,$2)", ["pawpal_live", payload])
            .catch((e) => console.error("Live notification failed", e));
    }
}

// Avoid notifying friends on every scrub stroke, while keeping appearance and sleep immediate.
const lastFriendPetBroadcast = new Map<string, number>();

export async function publishPetToFriends(userId: string, immediate = false) {
    const now = Date.now();
    if (!immediate && now - (lastFriendPetBroadcast.get(userId) || 0) < 2500) {
        return;
    }
    lastFriendPetBroadcast.set(userId, now);
    const friends = await pool.query(
        "SELECT CASE WHEN requester_id=$1 THEN recipient_id ELSE requester_id END AS friend_id FROM friendships WHERE status='accepted' AND (requester_id=$1 OR recipient_id=$1)",
        [userId]
    );
    publishLive(
        friends.rows.map((row: any) => String(row.friend_id)),
        "friend_pet_updated"
    );
}

export async function subscribeLive() {
    const client = await pool.connect();
    client.on("notification", (message) => {
        if (message.channel !== "pawpal_live" || !message.payload) {
            return;
        }
        try {
            const event = JSON.parse(message.payload);
            // The sending instance already delivered its local event directly.
            if (
                event.origin !== liveInstanceId &&
                typeof event.userId === "string" &&
                typeof event.type === "string"
            ) {
                writeLive(event.userId, event.type);
            }
        } catch (e) {
            console.error("Live event parse error", e);
        }
    });
    client.on("error", (e) => console.error("Live database listener error", e));
    client.on("end", () => {
        console.warn("Live database listener disconnected");
        setTimeout(() => void subscribeLive().catch(console.error), 2000);
    });
    await client.query("LISTEN pawpal_live");
}

export function startLiveUpdates() {
    void subscribeLive().catch((e) => {
        console.error("Live listener unavailable", e);
        setTimeout(() => void subscribeLive().catch(console.error), 3000);
    });
}
