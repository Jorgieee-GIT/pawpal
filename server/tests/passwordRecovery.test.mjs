// Run: npm run build && node tests/passwordRecovery.test.mjs
// In-memory route smoke tests. Real Neon concurrency should also be tested before launch.
import assert from "node:assert/strict";
import express from "express";

process.env.DATABASE_URL ||= "postgres://placeholder:placeholder@localhost:5432/pawpal_test";
const { pool } = await import("../dist/db.js");
const { registerPasswordRecovery } = await import("../dist/passwordRecovery.js");

const users = new Map([
    ["alice", { id: "11111111-1111-4111-8111-111111111111", username: "alice", auth_version: 0 }],
    ["bob", { id: "22222222-2222-4222-8222-222222222222", username: "bob", auth_version: 0 }]
]);
const requests = new Map();
const tokens = [];
function response(rows = []) { return { rows, rowCount: rows.length }; }
function isValidToken(t) { return !t.consumed_at && new Date(t.expires_at).getTime() > Date.now(); }
async function query(sql, args = []) {
    const statement = sql.replace(/\s+/g, " ").trim().toLowerCase();
    if (statement === "begin" || statement === "commit" || statement === "rollback") return response();
    if (statement.startsWith("insert into admin_audit_logs")) {
        return response();
    }
    if (statement.includes("select id from users where username=$1")) return response([...users.values()].filter(u => u.username === args[0]).map(u => ({ id: u.id })));
    if (statement.includes("from password_reset_requests where user_id=$1") && statement.includes("interval '2 minutes'")) return response([...requests.values()].filter(r => r.user_id === args[0] && Date.now() - new Date(r.created_at).getTime() < 120000).map(r => ({ id: r.id })));
    if (statement.startsWith("update password_reset_requests set status='expired'")) { for (const r of requests.values()) if (r.user_id === args[0] && r.status === "pending") r.status = "expired"; return response(); }
    if (statement.startsWith("insert into password_reset_requests")) { requests.set(args[0], { id: args[0], user_id: args[1], request_key_hash: args[2], status: "pending", created_at: new Date().toISOString(), decided_at: null }); return response(); }
    if (statement.startsWith("select status,created_at from password_reset_requests")) return response([...requests.values()].filter(r => r.id === args[0] && r.request_key_hash === args[1]));
    if (statement.startsWith("select r.id,r.status,r.created_at")) return response([...requests.values()].map(r => ({ ...r, username: [...users.values()].find(u => u.id === r.user_id)?.username, link_expires_at: null })));
    if (statement.startsWith("select user_id,status,created_at from password_reset_requests")) return response([...requests.values()].filter(r => r.id === args[0]));
    if (statement.startsWith("update password_reset_tokens set consumed_at=now()")) { for (const t of tokens) if (t.user_id === args[0] && !t.consumed_at) t.consumed_at = new Date().toISOString(); return response(); }
    if (statement.startsWith("insert into password_reset_tokens")) { tokens.push({ id: args[0], user_id: args[1], request_id: args[2], token_hash: args[3], expires_at: new Date(Date.now() + 300000).toISOString(), consumed_at: null }); return response(); }
    if (statement.startsWith("update password_reset_requests set status=$1")) { const r = requests.get(args[1]); r.status = args[0]; r.decided_at = new Date().toISOString(); return response(); }
    if (statement.startsWith("select u.username from password_reset_tokens")) return response(tokens.filter(t => t.token_hash === args[0] && isValidToken(t)).map(t => ({ username: [...users.values()].find(u => u.id === t.user_id)?.username })));
    if (statement.startsWith("select user_id from password_reset_tokens")) return response(tokens.filter(t => t.token_hash === args[0] && isValidToken(t)).map(t => ({ user_id: t.user_id })));
    if (statement.startsWith("update users set password_hash=$1,auth_version=auth_version+1")) { const u = [...users.values()].find(u => u.id === args[1]); u.password_hash = args[0]; u.auth_version += 1; return response(); }
    if (statement.startsWith("update password_reset_requests set status='completed'")) { for (const r of requests.values()) if (r.user_id === args[0] && ["pending", "approved"].includes(r.status)) r.status = "completed"; return response(); }
    if (statement.startsWith("select username from users where id=$1")) return response([...users.values()].filter(u => u.id === args[0]).map(u => ({ username: u.username })));
    if (statement.startsWith("update password_reset_requests set status='approved'")) { for (const r of requests.values()) if (r.user_id === args[0] && r.status === "pending") r.status = "approved"; return response(); }
    throw new Error("Test SQL not mocked: " + statement.slice(0, 140));
}
pool.query = query;
pool.connect = async () => ({ query, release() {} });
const app = express();
app.use(express.json());
registerPasswordRecovery(app, (_req, _res, next) => next());
const server = app.listen(0, "127.0.0.1");
await new Promise(resolve => server.once("listening", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
async function post(path, body) {
    const response = await fetch(origin + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return { code: response.status, data: await response.json() };
}
try {
    const unknown = await post("/api/auth/password-reset/request", { username: "nonexistent" });
    assert.equal(unknown.code, 202);
    assert.equal(requests.size, 0);
    const issued = await post("/api/auth/password-reset/request", { username: "alice" });
    assert.equal(issued.code, 202);
    assert.equal(requests.size, 1);
    const status = await post("/api/auth/password-reset/request-status", { requestId: issued.data.requestId, requestKey: issued.data.requestKey });
    assert.equal(status.data.status, "pending");
    const inbox = await (await fetch(origin + "/api/admin/password-reset/requests")).json();
    assert.equal(inbox.requests.filter(r => r.status === "pending").length, 1);
    const approve = await post(`/api/admin/password-reset/requests/${issued.data.requestId}/decision`, { decision: "approve" });
    assert.equal(approve.code, 200);
    assert.equal((await post(`/api/admin/password-reset/requests/${issued.data.requestId}/decision`, { decision: "approve" })).code, 409);
    assert.match(approve.data.url, /^https:\/\/.*\/reset-password#[0-9a-f]{64}$/);
    const rawToken = approve.data.url.split("#")[1];
    assert.equal((await post("/api/auth/password-reset/verify", { token: rawToken })).data.valid, true);
    assert.equal((await post("/api/auth/password-reset/request-status", { requestId: issued.data.requestId, requestKey: issued.data.requestKey })).data.status, "approved");
    const invalid = await post("/api/auth/password-reset/complete", { token: rawToken, newPassword: "short" });
    assert.equal(invalid.code, 400);
    const complete = await post("/api/auth/password-reset/complete", { token: rawToken, newPassword: "sixsix" });
    assert.equal(complete.code, 200);
    assert.equal(users.get("alice").auth_version, 1);
    assert.equal((await post("/api/auth/password-reset/verify", { token: rawToken })).data.valid, false);
    assert.equal((await post("/api/auth/password-reset/complete", { token: rawToken, newPassword: "SecondPassword123!" })).code, 410);
    assert.equal((await post("/api/auth/password-reset/request-status", { requestId: issued.data.requestId, requestKey: issued.data.requestKey })).data.status, "completed");
    const direct = await post(`/api/admin/users/${users.get("alice").id}/reset-link`, {});
    assert.equal(direct.code, 200);
    assert.notEqual(direct.data.url, approve.data.url);
    assert.equal((await post("/api/auth/password-reset/verify", { token: direct.data.url.split("#")[1] })).data.valid, true);
    const replacement = await post(`/api/admin/users/${users.get("alice").id}/reset-link`, {});
    assert.equal(replacement.code, 200);
    assert.equal((await post("/api/auth/password-reset/verify", { token: direct.data.url.split("#")[1] })).data.valid, false);
    const replacementHash = (await import("node:crypto")).createHash("sha256").update(replacement.data.url.split("#")[1]).digest("hex");
    tokens.find(t => t.token_hash === replacementHash).expires_at = new Date(Date.now() - 1000).toISOString();
    assert.equal((await post("/api/auth/password-reset/verify", { token: replacement.data.url.split("#")[1] })).data.valid, false);
    assert.equal((await post("/api/auth/password-reset/complete", { token: replacement.data.url.split("#")[1], newPassword: "NewSecurePassword123" })).code, 410);
    const bob = await post("/api/auth/password-reset/request", { username: "bob" });
    const reject = await post(`/api/admin/password-reset/requests/${bob.data.requestId}/decision`, { decision: "reject" });
    assert.equal(reject.code, 200);
    assert.equal((await post("/api/auth/password-reset/request-status", { requestId: bob.data.requestId, requestKey: bob.data.requestKey })).data.status, "rejected");
    console.log("Password recovery route tests passed: enumeration protection, pending/approval/rejection, replacement, expiry, single-use, and session revocation.");
} finally {
    await new Promise(resolve => server.close(resolve));
}
