import { strict as assert } from "node:assert";
import { calculateArenaPayout, recordArenaFee } from "../src/arenaFees.js";

for (const entrants of [2, 4] as const) {
    for (const stake of [0, 1, 2, 3, 9, 10, 11, 19, 20, 25, 49, 50, 99, 100, 250, 1_000_000]) {
        const p = calculateArenaPayout(stake, entrants);
        assert.equal(p.grossPool, stake * entrants);
        assert.equal(p.winnerCount, entrants / 2);
        assert.equal(p.payoutPerWinner * p.winnerCount + p.fee, p.grossPool);
        assert.ok(p.fee <= p.grossPool * 0.05);
        assert.ok(Number.isInteger(p.payoutPerWinner));
        assert.ok(p.payoutPerWinner >= 0);
        if (stake === 0) { assert.equal(p.fee, 0); }
    }
}
assert.deepEqual(calculateArenaPayout(100, 2), { grossPool: 200, fee: 10, netPool: 190, payoutPerWinner: 190, winnerCount: 1 });
assert.deepEqual(calculateArenaPayout(100, 4), { grossPool: 400, fee: 20, netPool: 380, payoutPerWinner: 190, winnerCount: 2 });
assert.deepEqual(calculateArenaPayout(25, 4), { grossPool: 100, fee: 4, netPool: 96, payoutPerWinner: 48, winnerCount: 2 });
assert.equal(calculateArenaPayout(100, 2, 0).fee, 0, "Previously started Classic games remain fee-free");
assert.equal(calculateArenaPayout(100, 4, 0).payoutPerWinner, 200, "Previously created Duo rooms retain no fee");
assert.throws(() => calculateArenaPayout(100, 4, 6));
assert.throws(() => calculateArenaPayout(-1, 2));
assert.throws(() => calculateArenaPayout(1.5, 4));
console.log("Arena Fee payout tests passed: Classic and Duo stake/pool/fee distribution verified.");

// A ledger write is called with exact authoritative values; it must be in
// the caller's existing transaction, not a separate connection/commit.
async function auditInsertTest() {
    const calls: Array<{ sql: string; params?: unknown[] }> = [];
    const fakeClient = { query: async (sql: string, params?: unknown[]) => { calls.push({ sql, params }); return { rowCount: 1 }; } };
    const result = calculateArenaPayout(100, 4);
    await recordArenaFee(fakeClient, "duo_2v2", "01234567-89ab-cdef-0123-456789abcdef", result);
    assert.equal(calls.length, 1);
    assert.match(calls[0].sql, /INSERT INTO arena_fee_ledger/);
    assert.deepEqual(calls[0].params, ["duo_2v2", "01234567-89ab-cdef-0123-456789abcdef", 400, 20, 2, 190]);
    console.log("Arena Fee ledger insertion contract passed.");
}
void auditInsertTest().catch(error => { console.error(error); process.exitCode = 1; });
