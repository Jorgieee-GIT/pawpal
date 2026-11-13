/** Shared by the animation frame and the input handler to prevent stale scores. */
/*
 * DOCU: Handle kitchen marker phase behavior for this feature.
 * @param {number} elapsedMs - elapsedMs value used by this function
 * @param {number} durationMs - durationMs value used by this function
 * @returns {number} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function kitchenMarkerPhase(elapsedMs: number, durationMs: number): number {
    const elapsed = Math.max(0, elapsedMs);
    return Math.abs(((elapsed / durationMs) % 2) - 1) * 100;
}

/*
 * DOCU: Handle kitchen marker score behavior for this feature.
 * @param {number} phase - phase value used by this function
 * @param {unknown} target - target value used by this function
 * @returns {number} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function kitchenMarkerScore(phase: number, target = 50): number {
    return Math.max(35, Math.min(100, Math.round(100 - Math.abs(phase - target) * 1.6)));
}
