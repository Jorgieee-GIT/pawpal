/** Shared by the animation frame and the input handler to prevent stale scores. */
export function kitchenMarkerPhase(elapsedMs: number, durationMs: number): number {
    const elapsed = Math.max(0, elapsedMs);
    return Math.abs(((elapsed / durationMs) % 2) - 1) * 100;
}

export function kitchenMarkerScore(phase: number, target = 50): number {
    return Math.max(35, Math.min(100, Math.round(100 - Math.abs(phase - target) * 1.6)));
}
