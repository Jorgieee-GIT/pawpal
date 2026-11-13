import { ArrowRight } from "lucide-react";

export const KITCHEN_ARROW_DIRECTIONS = ["left", "up", "right", "down"] as const;

/** Exactly one vector arrow, rotated for four directions so stroke weight never changes. */
/*
 * DOCU: Render the kitchen direction art interface and provide its feature behavior.
 * @param {{
    direction: number
}} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function KitchenDirectionArt({ direction }: {
    direction: number
}) {
    const rotation = [180, -90, 0, 90][direction] ?? 0;
    return <ArrowRight aria-hidden="true" size={25} strokeWidth={2.7} style={{
        transform: `rotate(${rotation}deg)`
    }} />;
}
