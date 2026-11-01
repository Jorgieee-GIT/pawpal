/**
 * Paw Brawl Arena Fee: at most 5% of the gross pool, rounded DOWN to
 * a multiple of the number of winners. Every winner receives equal
 * whole-number Paw Coins; no coin is created by rounding.
 * Draws and voids bypass this calculator entirely and refund stakes.
 */
export const ARENA_FEE_PERCENT = 5;

export function calculateArenaPayout(wager: number, entrants: 2 | 4, feePercent = ARENA_FEE_PERCENT): {
    grossPool: number;
    fee: number;
    netPool: number;
    payoutPerWinner: number;
    winnerCount: number;
} {
    if (!Number.isSafeInteger(wager) || wager < 0) {
        throw new Error("Arena wager must be a nonnegative whole number.");
    }
    if (!Number.isSafeInteger(feePercent) || feePercent < 0 || feePercent > ARENA_FEE_PERCENT) {
        throw new Error("Arena Fee percentage is invalid.");
    }
    const winnerCount = entrants / 2;
    const grossPool = wager * entrants;
    if (!Number.isSafeInteger(grossPool)) {
        throw new Error("Arena prize pool is too large.");
    }
    const fee = Math.floor((grossPool * feePercent / 100) / winnerCount) * winnerCount;
    const netPool = grossPool - fee;
    return { grossPool, fee, netPool, payoutPerWinner: netPool / winnerCount, winnerCount };
}

/** Call in the SAME database transaction as both winner payouts and status update. */
export async function recordArenaFee(
    client: { query: (sql: string, params?: unknown[]) => Promise<any> },
    mode: "classic_1v1" | "duo_2v2",
    matchId: string,
    payout: ReturnType<typeof calculateArenaPayout>
): Promise<void> {
    // PK(mode,match_id) is an additional guard; row-level match locking and
    // finished-state checks prevent duplicate payouts themselves.
    await client.query(
        `INSERT INTO arena_fee_ledger (mode,match_id,gross_pool,fee_amount,winning_players,payout_per_winner)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [mode, matchId, payout.grossPool, payout.fee, payout.winnerCount, payout.payoutPerWinner]
    );
}
