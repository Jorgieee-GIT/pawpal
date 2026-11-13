import { randomOrder } from "./KitchenSequence";

export type KitchenChallenge = {
    chopTargets: number[];
    chopSpeed: number;
    flipTarget: number;
    flipSpeed: number;
    boilTarget: number;
    boilSpeed: number;
    ovenTarget: number;
    ovenStart: number;
    pourTarget: number;
    decorate: number[];
    plate: number[];
    rhythm: number[];
    wash: number[];
};

/** All targets are visible and solvable; only the challenge changes, not meal rewards. */
/*
 * DOCU: Handle random challenge behavior for this feature.
 * @param {KitchenChallenge} previous - previous value used by this function
 * @param {() => number} random - random value used by this function
 * @returns {KitchenChallenge} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function randomChallenge(previous?: KitchenChallenge, random: () => number = Math.random): KitchenChallenge {
        /*
     * DOCU: Pick the current state for this feature.
     * @param {number[]} options - options value used by this function
     * @param {number} previousValue - previousValue value used by this function
     * @returns {number} - Result returned by this function.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const pick = (options: number[], previousValue?: number): number => {
        const choices = options.filter(value => value !== previousValue);
        const pool = choices.length ? choices : options;
        return pool[Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))];
    };
        /*
     * DOCU: Handle range behavior for this feature.
     * @param {number} first - first value used by this function
     * @param {number} last - last value used by this function
     * @param {number} step - step value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const range = (first: number, last: number, step: number) =>
        Array.from({
            length: Math.floor((last - first) / step) + 1
        }, (_, index) => first + index * step);
    const targets = range(20, 80, 5);
    const chopTargets: number[] = [];
    for (let index = 0; index < 3; index++) {
        chopTargets.push(pick(targets, index === 0 ? previous?.chopTargets[0] : chopTargets[index - 1]));
    }
        /*
     * DOCU: Handle sequence behavior for this feature.
     * @param {number} minLength - minLength value used by this function
     * @param {number} maxLength - maxLength value used by this function
     * @param {number[]} previousOrder - previousOrder value used by this function
     * @returns {number[]} - Result returned by this function.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const sequence = (minLength: number, maxLength: number, previousOrder?: number[]): number[] => {
        const length = pick(range(minLength, maxLength, 1), previousOrder?.length);
        const result: number[] = [];
        for (let index = 0; index < length; index++) {
            result.push(pick([0, 1, 2, 3], result[index - 1]));
        }
        if (previousOrder?.length === result.length && result.every((value, index) => value === previousOrder[index])) {
            result[0] = (result[0] + 1) % 4;
            if (result[0] === result[1]) {
                result[0] = (result[0] + 1) % 4;
            }
        }
        return result;
    };
    const ovenTarget = pick(range(155, 205, 5), previous?.ovenTarget);
    const ovenStart = Math.max(110, Math.min(240, ovenTarget + pick([-35, -30, -25, 25, 30, 35])));

    return {
        chopTargets,
        chopSpeed: pick(range(900, 1300, 50), previous?.chopSpeed),
        flipTarget: pick(targets, previous?.flipTarget),
        flipSpeed: pick(range(700, 1050, 50), previous?.flipSpeed),
        boilTarget: pick(targets, previous?.boilTarget),
        boilSpeed: pick(range(850, 1350, 50), previous?.boilSpeed),
        ovenTarget,
        ovenStart,
        pourTarget: pick(range(55, 85, 5), previous?.pourTarget),
        decorate: randomOrder(3, previous?.decorate, random),
        plate: randomOrder(3, previous?.plate, random),
        rhythm: sequence(5, 7, previous?.rhythm),
        wash: sequence(4, 6, previous?.wash)
    };
}
