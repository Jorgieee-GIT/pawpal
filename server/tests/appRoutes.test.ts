import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import jwt from "jsonwebtoken";

// Exercise the real application wiring with an in-memory database boundary.
process.env.DATABASE_URL = "postgres://placeholder:placeholder@localhost:5432/pawpal_test";
process.env.JWT_SECRET = "pawpal-route-regression-test-secret";
const { pool } = await import("../src/db.js");
const { createApp } = await import("../src/app.js");
const userId = "11111111-1111-4111-8111-111111111111";
const token = jwt.sign({ sub: userId, ver: 0 }, process.env.JWT_SECRET);
let server: Server;
let origin: string;
let connections = 0;
const queries: string[] = [];

function result(rows: unknown[] = []) {
    return { rows, rowCount: rows.length };
}

async function query(sql: string) {
    queries.push(sql);
    if (sql.includes("FROM admin_game_settings")) {
        return result();
    }
    if (sql.includes("SELECT u.auth_version")) {
        return result([{ auth_version: 0, suspended: false, disabled_features: [] }]);
    }
    if (sql.includes("admin_player_presence")) {
        return result();
    }
    if (sql.includes("FROM pets WHERE owner_id")) {
        return result();
    }
    if (sql.includes("FROM pet_kitchens") || sql.includes("FROM game_records")) {
        return result();
    }
    if (["BEGIN", "COMMIT", "ROLLBACK"].includes(sql)) {
        return result();
    }
    throw new Error("Unexpected database query in route smoke test: " + sql);
}

before(async () => {
    pool.query = query as typeof pool.query;
    pool.connect = (async () => {
        connections++;
        return { query, release() {} };
    }) as typeof pool.connect;

    const app = createApp();
    assert.equal(connections, 0, "Constructing the app must not start the database listener");
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    origin = `http://127.0.0.1:${address.port}`;
});

after(async () => {
    if (server) {
        await new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve()))
        );
    }
    await pool.end();
});

test("Public health and auth validation remain reachable", async () => {
    const health = await fetch(origin + "/api/health");
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true });

    const register = await fetch(origin + "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "!", password: "short" })
    });
    assert.equal(register.status, 400);
    assert.match((await register.json()).error, /Username/);
});

test("Extracted player routes are registered and still require authentication", async () => {
    const routes = [
        ["GET", "/api/me"],
        ["POST", "/api/adopt"],
        ["POST", "/api/claim"],
        ["POST", "/api/care/wake"],
        ["POST", "/api/care"],
        ["POST", "/api/daily/claim"],
        ["GET", "/api/catalog"],
        ["POST", "/api/item"],
        ["GET", "/api/furniture/catalog"],
        ["POST", "/api/furniture"],
        ["POST", "/api/rooms"],
        ["GET", "/api/room"],
        ["GET", "/api/live"],
        ["GET", "/api/notifications"],
        ["POST", "/api/notifications/seen"],
        ["GET", "/api/friends"],
        ["GET", "/api/users/search"],
        ["POST", "/api/friends/request"],
        ["POST", `/api/friends/${userId}/accept`],
        ["DELETE", `/api/friends/${userId}`],
        ["POST", "/api/notes"],
        ["DELETE", "/api/notes"],
        ["POST", "/api/gifts"],
        ["GET", "/api/mail/designs"],
        ["POST", "/api/mail/designs/buy"],
        ["GET", "/api/mail"],
        ["GET", "/api/mail/sent"],
        ["POST", "/api/mail"],
        ["PATCH", `/api/mail/${userId}/read`],
        ["DELETE", `/api/mail/${userId}`],
        ["POST", "/api/garden"],
        ["POST", "/api/claw/play"],
        ["POST", "/api/game"],
        ["GET", "/api/records"],
        ["GET", "/api/kitchen"],
        ["POST", "/api/kitchen"],
        ["GET", "/api/missions"],
        ["POST", "/api/missions/claim-all"],
        ["POST", "/api/missions/test/claim"],
        ["GET", "/api/achievements"],
        ["POST", "/api/achievements/claim-all"],
        ["POST", "/api/achievement"]
    ];
    for (const [method, path] of routes) {
        const response = await fetch(origin + path, { method });
        assert.equal(response.status, 401, `${method} ${path}`);
        assert.equal((await response.json()).error, "Please sign in again.");
    }
});

test("Admin routes retain their separate authentication boundary", async () => {
    for (const path of [
        "/api/admin/develop-access",
        "/api/admin/overview",
        "/api/admin/users",
        "/api/admin/dashboard"
    ]) {
        const response = await fetch(origin + path, {
            headers: { Authorization: "Bearer " + token }
        });
        assert.equal(response.status, 401, path);
        assert.match((await response.json()).error, /Admin session expired/);
    }
});

test("Authenticated catalogs and kitchen defaults work through the extracted modules", async () => {
    const get = (path: string) =>
        fetch(origin + path, {
            headers: { Authorization: "Bearer " + token }
        });
    const catalog = await get("/api/catalog");
    assert.equal(catalog.status, 200);
    const items = await catalog.json();
    assert.equal(items.bow.type, "cosmetic");
    assert.equal(items.calico.level, 5, "Catalog initialization must run before requests");

    const furniture = await get("/api/furniture/catalog");
    assert.equal(furniture.status, 200);
    assert.ok((await furniture.json()).defaults.living.includes("living_sofa"));

    const kitchen = await get("/api/kitchen");
    assert.equal(kitchen.status, 200);
    const data = await kitchen.json();
    assert.deepEqual(data.kitchen.meals, {});
    assert.equal(data.kitchen.active_recipe, null);
    assert.ok(data.recipes.berry_parfait);

    const records = await get("/api/records");
    assert.equal(records.status, 200);
    assert.deepEqual(await records.json(), []);
});

test("Care still applies wake middleware before the transactional pet mutation", async () => {
    queries.length = 0;
    const response = await fetch(origin + "/api/care", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "feed" })
    });
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error, "Adopt a pet first.");
    assert.equal(queries.filter((sql) => sql === "BEGIN").length, 2);
    assert.ok(queries.includes("COMMIT"));
    assert.ok(queries.includes("ROLLBACK"));
});

test("Unknown API routes still return a JSON 404", async () => {
    const response = await fetch(origin + "/api/not-a-route");
    assert.equal(response.status, 404);
    assert.match(response.headers.get("content-type") || "", /application\/json/);
    assert.match((await response.json()).error, /API endpoint not found/);
});
