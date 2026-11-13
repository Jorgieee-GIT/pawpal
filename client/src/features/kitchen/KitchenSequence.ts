/** Generate a shuffled sequence for a cooking minigame. */
/*
 * DOCU: Handle random order behavior for this feature.
 * @param {number} length - length value used by this function
 * @param {readonly number[]} previous - previous value used by this function
 * @param {() => number} rng - rng value used by this function
 * @returns {number[]} - Result returned by this function.
 * @throws {Error} - Propagates an error when this operation cannot complete.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function randomOrder(length: number, previous?: readonly number[], rng: () => number = Math.random): number[] {
    if (!Number.isInteger(length) || length < 2) {
        throw new Error("At least two choices are required.");
    }
    const order = Array.from({
        length
    }, (_, index) => index);
    for (let i = length - 1; i > 0; i--) {
        const roll = rng();
        const j = Math.min(i, Math.max(0, Math.floor(roll * (i + 1))));
        [order[i], order[j]] = [order[j], order[i]];
    }
    // A fresh game should never reuse exactly the same immediately previous order.
    if (previous?.length === length && order.every((item, index) => item === previous[index])) {
        [order[0], order[1]] = [order[1], order[0]];
    }
    return order;
}
