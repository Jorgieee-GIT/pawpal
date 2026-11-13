/** Keyboard and swipe input use the same direction IDs as Rhythm Mixing: left, up, right, down. */
/*
 * DOCU: Handle rhythm key direction behavior for this feature.
 * @param {string} key - key value used by this function
 * @returns {number | null} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function rhythmKeyDirection(key: string): number | null {
    switch (key) {
        case "ArrowLeft": return 0;
        case "ArrowUp": return 1;
        case "ArrowRight": return 2;
        case "ArrowDown": return 3;
        default: return null;
    }
}

/** Ignore tiny movements and ambiguous diagonal gestures. */
/*
 * DOCU: Handle rhythm swipe direction behavior for this feature.
 * @param {number} dx - dx value used by this function
 * @param {number} dy - dy value used by this function
 * @param {unknown} minDistance - minDistance value used by this function
 * @returns {number | null} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function rhythmSwipeDirection(dx: number, dy: number, minDistance = 42): number | null {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
        return null;
    }
    const x = Math.abs(dx);
    const y = Math.abs(dy);
    if (Math.max(x, y) < minDistance) {
        return null;
    }
    if (x > y * 1.15) {
        return dx < 0 ? 0 : 2;
    }
    if (y > x * 1.15) {
        return dy < 0 ? 1 : 3;
    }
    return null;
}
