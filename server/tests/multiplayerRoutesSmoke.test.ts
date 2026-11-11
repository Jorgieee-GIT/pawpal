/**
 * Server-route smoke tests using a tiny transactional PostgreSQL stand-in.
 * Verify the actual create/join and forfeit HTTP handlers. These do NOT replace
 * live Neon tests, but catch regressions like using input.data after z.parse().
 */
import assert from "node:assert/strict";
import express from "express";

process.env.DATABASE_URL ??= "postgres://placeholder:placeholder@localhost:5432/pawpal_test";
const { pool } = await import("../src/db.js");
const { registerDuoClash, createDuoBattle } = await import("../src/duoClash.js");
const { registerMultiplayer } = await import("../src/multiplayer.js");

const ids = [
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
    "33333333-3333-4333-8333-333333333333",
    "44444444-4444-4444-8444-444444444444"
];
const outsiderId = "55555555-5555-4555-8555-555555555555";
const roomId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const challengeId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
let room: any;
let classic: any;
let duoPayouts = 0;
let classicPayouts = 0;
let duoFees = 0;
let classicFees = 0;
const accountIds = new Set(ids);
const query = async (sql: string, args: any[] = []): Promise<any> => {
    const q = sql.replace(/\s+/g, " ").trim();
    if (/^(BEGIN|COMMIT|ROLLBACK|SELECT pg_advisory_xact_lock)/.test(q)) { return { rows: [], rowCount: 0 }; }
    if (q.includes("FROM multiplayer_challenges") && q.includes("WHERE status IN")) { return { rows: [], rowCount: 0 }; }
    if (q.includes("FROM duo_rooms") && q.includes("status IN") && q.includes("participants @>")) { return { rows: [], rowCount: 0 }; }
    if (q.startsWith("SELECT level FROM pets")) { return { rows: [{ level: 14 }], rowCount: 1 }; }
    if (q.startsWith("SELECT username FROM users")) { return { rows: [{ username: "test-pet" }], rowCount: 1 }; }
    if (q.startsWith("INSERT INTO duo_rooms")) {
        room = { id: args[0], code: args[1], host_id: args[2], wager: args[3], participants: JSON.parse(args[4]), status: "lobby", battle: null, arena_fee_percent: 5, winner_team: null, created_at: new Date().toISOString() };
        return { rows: [room], rowCount: 1 };
    }
    if (q.startsWith("SELECT * FROM duo_rooms WHERE code")) { return { rows: room?.code === args[0] ? [room] : [], rowCount: room?.code === args[0] ? 1 : 0 }; }
    if (q.startsWith("SELECT * FROM duo_rooms WHERE id")) { return { rows: room?.id === args[0] ? [room] : [], rowCount: room?.id === args[0] ? 1 : 0 }; }
    if (q.startsWith("UPDATE duo_rooms SET battle=")) { room.battle = JSON.parse(args[1]); return { rowCount: 1, rows: [] }; }
    if (q.startsWith("UPDATE duo_rooms SET participants=")) { room.participants = JSON.parse(args[1]); return { rowCount: 1, rows: [] }; }
    if (q.startsWith("UPDATE duo_rooms SET status=")) { room.status = args[1]; room.battle = JSON.parse(args[2]); room.winner_team = args[3]; return { rowCount: 1, rows: [] }; }
    if (q.startsWith("UPDATE pets SET coins=coins+")) {
        assert.ok(accountIds.has(args[0]), "payout must go to a participant");
        if (room?.status === "active" && args[1] === 47) { duoPayouts++; }
        else { classicPayouts++; }
        return { rowCount: 1, rows: [] };
    }
    if (q.startsWith("INSERT INTO arena_fee_ledger")) {
        if (args[0] === "duo_2v2") { duoFees++; }
        else if (args[0] === "classic_1v1") { classicFees++; }
        return { rowCount: 1, rows: [] };
    }
    if (q.startsWith("INSERT INTO duo_records") || q.startsWith("INSERT INTO mission_events")) { return { rowCount: 1, rows: [] }; }
    if (q.startsWith("SELECT * FROM multiplayer_challenges WHERE id=")) { return { rows: classic?.id === args[0] ? [classic] : [], rowCount: classic?.id === args[0] ? 1 : 0 }; }
    if (q.startsWith("UPDATE multiplayer_challenges SET battle=")) { classic.battle = JSON.parse(args[1]); return { rowCount: 1, rows: [] }; }
    if (q.startsWith("UPDATE multiplayer_challenges SET status='finished'")) { classic.status = "finished"; classic.winner_id = args[1]; return { rowCount: 1, rows: [] }; }
    throw Error(`Unmocked SQL: ${q.slice(0, 140)}`);
};
// The tests replace query() only within this standalone process. No actual DB is contacted.
(pool as any).connect = async () => ({ query, release: () => {} });
(pool as any).query = query;
const app = express();
app.use(express.json());
const auth = (req: any, _res: any, next: any) => { req.userId = req.get("x-test-user") || ids[0]; next(); };
registerDuoClash(app, auth, () => {});
registerMultiplayer(app, auth, () => {});
const server = app.listen(0);
try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const base = `http://127.0.0.1:${address.port}`;
    const post = async (path: string, user: string, body: object) => {
        const response = await fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json", "x-test-user": user }, body: JSON.stringify(body) });
        return { status: response.status, json: await response.json() };
    };
    const created = await post("/api/multiplayer/duo/create", ids[0], { wager: 25 });
    assert.equal(created.status, 200, JSON.stringify(created.json));
    assert.equal(created.json.room.wager, 25);
    assert.match(created.json.room.code, /^PAW-[A-F0-9]{8}$/);
    const joined = await post("/api/multiplayer/duo/join", ids[1], { code: room.code, team: 0 });
    assert.equal(joined.status, 200, JSON.stringify(joined.json));
    assert.equal(room.participants.length, 2);
    // Simulate an already-started, fully funded match; test payouts are only once.
    room.id = roomId;
    room.status = "active";
    room.participants = ids.map((userId, i) => ({ userId, team: i < 2 ? 0 : 1, ready: true, lastSeen: new Date().toISOString() }));
    room.battle = createDuoBattle(ids.map((userId, i) => ({ userId, team: i < 2 ? 0 : 1, username: `test${i}`, pet: { name: "Cat", species: "cat", breed: "classic", color: "classic" } })));
    const outsiderDuoMove = await post(`/api/multiplayer/duo/${roomId}/move`, outsiderId, { action: "strike", targetId: ids[2] });
    assert.equal(outsiderDuoMove.status, 400);
    assert.match(outsiderDuoMove.json.error, /participant/i);
    assert.equal(room.battle.pendingMoves[outsiderId], undefined, "an outsider cannot submit a Duo Clash move");
    const outsiderDuoForfeit = await post(`/api/multiplayer/duo/${roomId}/forfeit`, outsiderId, {});
    assert.equal(outsiderDuoForfeit.status, 400);
    assert.match(outsiderDuoForfeit.json.error, /not in this match/i);
    const duoMove = await post(`/api/multiplayer/duo/${roomId}/move`, ids[0], { action: "strike", targetId: ids[2] });
    assert.equal(duoMove.status, 200, JSON.stringify(duoMove.json));
    assert.equal(room.battle.pendingMoves[ids[0]].action, "strike");
    // 25*4=100, fee 4, each winner 48.
    const firstDuo = await post(`/api/multiplayer/duo/${roomId}/forfeit`, ids[0], {});
    assert.equal(firstDuo.status, 200, JSON.stringify(firstDuo.json));
    assert.equal(room.status, "finished");
    assert.equal(duoFees, 1);
    const duoBeforeRetry = duoPayouts + classicPayouts;
    const secondDuo = await post(`/api/multiplayer/duo/${roomId}/forfeit`, ids[0], {});
    assert.equal(secondDuo.status, 200, JSON.stringify(secondDuo.json));
    assert.equal(duoPayouts + classicPayouts, duoBeforeRetry);
    assert.equal(duoFees, 1);

    classic = {
        id: challengeId, challenger_id: ids[0], challenged_id: ids[1], status: "active", wager: 100, arena_fee_percent: 5,
        battle: { players: [
            { ...room.battle.players[0], userId: ids[0] },
            { ...room.battle.players[2], userId: ids[1] }
        ], turn: ids[0], turns: 0, pendingMoves: {}, turnExpiresAt: new Date(Date.now() + 30000).toISOString(), log: [] }
    };
    const outsiderClassicMove = await post(`/api/multiplayer/challenges/${challengeId}/move`, outsiderId, { action: "guard" });
    assert.equal(outsiderClassicMove.status, 404);
    assert.match(outsiderClassicMove.json.error, /Battle not found/i);
    assert.deepEqual(classic.battle.pendingMoves, {}, "an outsider cannot submit a Classic move");
    const outsiderClassicForfeit = await post(`/api/multiplayer/challenges/${challengeId}/forfeit`, outsiderId, {});
    assert.equal(outsiderClassicForfeit.status, 409);
    assert.match(outsiderClassicForfeit.json.error, /aren't a participant/i);
    const classicMove = await post(`/api/multiplayer/challenges/${challengeId}/move`, ids[0], { action: "guard" });
    assert.equal(classicMove.status, 200, JSON.stringify(classicMove.json));
    assert.equal(classic.battle.pendingMoves[ids[0]], "guard");
    const firstClassic = await post(`/api/multiplayer/challenges/${challengeId}/forfeit`, ids[0], {});
    assert.equal(firstClassic.status, 200, JSON.stringify(firstClassic.json));
    assert.equal(classic.status, "finished");
    assert.equal(classicFees, 1);
    const classicBeforeRetry = classicPayouts;
    const secondClassic = await post(`/api/multiplayer/challenges/${challengeId}/forfeit`, ids[0], {});
    assert.equal(secondClassic.status, 200, JSON.stringify(secondClassic.json));
    assert.equal(classicPayouts, classicBeforeRetry);
    assert.equal(classicFees, 1);
    console.log("Multiplayer HTTP routes: wagered room create/join, Classic/Duo moves and idempotent forfeits passed.");
} finally {
    server.close();
}
