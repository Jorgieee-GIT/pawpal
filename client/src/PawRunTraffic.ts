/**
 * Paw Run's shared perspective geometry.
 *
 * The vehicle's front bumper is anchored to its lane at its current road depth.
 * Side-lane cars use manually tuned ±2-degree angles while retaining their
 * three-lane road positions and perspective growth.
 * Cars continue beyond the bottom of the canvas before they are discarded.
 */
export const ROAD_HORIZON = 93;
export const ROAD_BOTTOM = 340;
export const ROAD_CENTER = 320;
export const PLAYER_ROAD_Y = 307;

const ROAD_NEAR_HALF_WIDTH = 290;
const ROAD_FAR_HALF_WIDTH = 44;
const ROAD_HEIGHT = ROAD_BOTTOM - ROAD_HORIZON;
const PROJECTION_POWER = 1.75;

// Keep the original perspective curve; scale each vehicle equally at every depth.
export const VEHICLE_SIZE_MULTIPLIER = 1.75;

export function roadHalfWidth(y: number): number {
    // Deliberately don't clamp at the lower canvas edge. A vehicle must be able
    // to drive *past* the player and leave the scene, not freeze at y=340.
    const progress = Math.max(0, (y - ROAD_HORIZON) / ROAD_HEIGHT);
    return ROAD_FAR_HALF_WIDTH + progress * (ROAD_NEAR_HALF_WIDTH - ROAD_FAR_HALF_WIDTH);
}

export function laneX(lane: number, y: number): number {
    return ROAD_CENTER + (lane - 1) * roadHalfWidth(y) * (2 / 3);
}

export function roadY(depth: number): number {
    return ROAD_HORIZON + Math.pow(Math.max(0, depth), PROJECTION_POWER) * ROAD_HEIGHT;
}

export const PLAYER_PASS_DEPTH = Math.pow(
    (PLAYER_ROAD_Y - ROAD_HORIZON) / ROAD_HEIGHT,
    1 / PROJECTION_POWER
);

export function trafficProjection(lane: number, depth: number) {
    const y = roadY(depth);
    const laneWidth = roadHalfWidth(y) * (2 / 3);
    const baseWidth = Math.min(98, laneWidth * 0.44);
    const width = baseWidth * VEHICLE_SIZE_MULTIPLIER;
    const height = width * 1.18;

    return {
        x: laneX(lane, y),
        y,
        width,
        height,
        // Small manual tilt in degrees, matching the player's adjustments.
        // Positive is clockwise in canvas coordinates.
        angle: (
            lane === 0 ? -2 :
            lane === 1 ? 0 :
            2
        ) * (Math.PI / 180)
    };
}

export function trafficIsVisible(lane: number, depth: number): boolean {
    const vehicle = trafficProjection(lane, depth);
    // Once even the rotated roof is below the screen, safely remove the car.
    const roofY = vehicle.y - vehicle.height * Math.cos(vehicle.angle) -
        vehicle.width * Math.abs(Math.sin(vehicle.angle)) / 2;
    return roofY < ROAD_BOTTOM + 12;
}

/**
 * Build one row of Paw Run traffic. A double-car row always occupies exactly
 * two different lanes, leaving the third lane available for a safe dodge.
 * Pass a seeded random function during tests; gameplay uses Math.random.
 */
export function trafficRowLanes(random: () => number = Math.random): number[] {
    const firstLane = Math.min(2, Math.floor(random() * 3));
    const isDoubleRow = random() < 0.5;

    if (!isDoubleRow) return [firstLane];

    // The initially selected lane is left open. Both other lanes get cars.
    return [0, 1, 2].filter(lane => lane !== firstLane);
}
