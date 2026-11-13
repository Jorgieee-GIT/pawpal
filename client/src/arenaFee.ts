// Matches server/src/arenaFees.ts. Server is always authoritative for payouts.
export const ARENA_FEE_PERCENT = 5;

/*
 * DOCU: Arena payout for this feature.
 * @param {number} wager - wager value used by this function
 * @param {2 | 4} entrants - entrants value used by this function
 * @param {unknown} feePercent - feePercent value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function arenaPayout(wager: number, entrants: 2 | 4, feePercent = ARENA_FEE_PERCENT) {
    const grossPool = wager * entrants;
    const winnerCount = entrants / 2;
    const fee = Math.floor((grossPool * feePercent / 100) / winnerCount) * winnerCount;
    const netPool = grossPool - fee;
    return { grossPool, fee, netPool, payoutPerWinner: netPool / winnerCount, winnerCount };
}
