/** One fresh, playable challenge is generated for each cooking preparation step. */
export type ExtraKitchenChallenge = {
    rolling: {
        ridges: number[];
        passes: number;
    };
    catch: {
        drops: Array<{
            kind: "good" | "bad";
            x: number;
            duration: number
        }>;
    };
    stove: {
        durations: number[];
        delays: number[];
    };
    seasoning: {
        targets: number[];
        starting: number[];
    };
};

function randomInteger(min: number, max: number, random: () => number): number {
    return min + Math.min(max - min, Math.floor(random() * (max - min + 1)));
}

export function newExtraKitchenChallenge(
    previous?: ExtraKitchenChallenge,
    random: () => number = Math.random
): ExtraKitchenChallenge {
    const different = (min: number, max: number, old?: number): number => {
        const options = Array.from({
            length: max - min + 1
        }, (_, index) => min + index)
            .filter(value => value !== old);
        return options[Math.min(options.length - 1, Math.floor(random() * options.length))];
    };

    const ridges = Array.from({
        length: 4
    }, (_, index) =>
        different(2, 5, previous?.rolling.ridges[index])
    );
    const kinds: Array<"good" | "bad"> = [
        "good", "good", "good", "good", "bad", "bad", "bad"
    ];
    for (let index = kinds.length - 1; index > 0; index--) {
        const position = randomInteger(0, index, random);
        const original = kinds[index];
        kinds[index] = kinds[position];
        kinds[position] = original;
    }
    const drops = kinds.map((kind, index) => {
        return {
            kind,
            x: different(14, 86, previous?.catch.drops[index]?.x),
            duration: different(1350, 1750, previous?.catch.drops[index]?.duration)
        };
    });
    const durations = Array.from({
        length: 3
    }, (_, index) =>
        different(3000, 4600, previous?.stove.durations[index])
    );
    const targets = Array.from({
        length: 3
    }, (_, index) =>
        different(1, 4, previous?.seasoning.targets[index])
    );
    const starting = targets.map(target => target >= 3 ? 0 : 4);

    return {
        rolling: {
            ridges,
            passes: ridges.reduce((sum, value) => sum + value, 0)
        },
        catch: {
            drops
        },
        stove: {
            durations,
            delays: [0, 350, 700]
        },
        seasoning: {
            targets,
            starting
        }
    };
}

export function rollingResult(ridges: number[], strokes: number): number {
    const remaining = ridges.reduce((sum, ridge) => sum + Math.max(0, ridge), 0);
    return Math.max(45, Math.min(100, Math.round(100 - remaining * 10 - Math.max(0, strokes - 22) * 0.6)));
}

export function catchResult(goodCaught: number, missed: number, badCaught: number): number {
    return Math.max(45, Math.min(100, 65 + goodCaught * 7 - missed * 9 - badCaught * 14));
}

export function stoveResult(scores: number[]): number {
    return Math.max(45, Math.min(100, Math.round(scores.reduce((sum, value) => sum + value, 0) / Math.max(1, scores.length))));
}

export function seasoningResult(values: number[], targets: number[]): number {
    const misses = targets.reduce((sum, target, index) => sum + Math.abs(target - values[index]), 0);
    return Math.max(45, 100 - misses * 13);
}
