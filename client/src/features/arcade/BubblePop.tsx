import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Coins, Gamepad2, RotateCcw, Shuffle, X } from "lucide-react";
import { BubblePopIcon } from "./ArcadeArt";
import "./BubblePop.css";

type CandyColor = "pink" | "mint" | "lilac" | "sky" | "gold";
type Power = "stripe-h" | "stripe-v" | "wrapped" | "color";
type Candy = { id: number; color: CandyColor; power?: Power };
type MatchRun = { cells: number[]; direction: "h" | "v" };
const SIDE = 9;
const LEVEL_COUNT = 99;
const PROGRESS_KEY = "pawpal-bubble-pop-unlocked-level";
const SWAP_MS = 360;
const FALL_MS = 500;
const COLORS: CandyColor[] = ["pink", "mint", "lilac", "sky", "gold"];
const BUBBLE_COLOR_NAMES: Record<CandyColor, string> = {
    pink: "pink",
    mint: "green",
    lilac: "purple",
    sky: "blue",
    gold: "gold"
};
type GoalKind = "score" | "collect" | "powers" | "chain";
type LevelGoal =
    | { kind: "score"; target: number }
    | { kind: "collect"; target: number; color: CandyColor }
    | { kind: "powers"; target: number }
    | { kind: "chain"; target: number };
type BubbleLevel = { number: number; moves: number; goal: LevelGoal };
const GOAL_PATTERN: GoalKind[] = ["score", "collect", "score", "powers", "collect", "score", "chain", "collect", "powers", "score", "collect", "chain"];

function makeLevel(number: number): BubbleLevel {
    const kind = GOAL_PATTERN[(number - 1) % GOAL_PATTERN.length];
    const moves = Math.max(23, 32 - Math.floor((number - 1) / 16));
    let goal: LevelGoal;
    if (kind === "score") goal = { kind, target: 900 + Math.floor((number - 1) / 3) * 100 };
    else if (kind === "collect") goal = {
        kind,
        color: COLORS[(Math.floor((number - 1) / GOAL_PATTERN.length) + number - 1) % COLORS.length],
        target: 12 + Math.floor((number - 1) / 7)
    };
    else if (kind === "powers") goal = { kind, target: 1 + Math.floor((number - 1) / 38) };
    else goal = { kind, target: 2 };
    return { number, moves, goal };
}

const LEVELS = Array.from({ length: LEVEL_COUNT }, (_, index) => makeLevel(index + 1));

function readUnlockedLevel(): number {
    try {
        const saved = Number(window.localStorage.getItem(PROGRESS_KEY));
        return Number.isFinite(saved) ? Math.max(1, Math.min(LEVEL_COUNT, Math.floor(saved))) : 1;
    } catch {
        return 1;
    }
}

function goalLabel(goal: LevelGoal): string {
    if (goal.kind === "score") return `Score ${goal.target.toLocaleString()} points`;
    if (goal.kind === "collect") return `Collect ${goal.target} ${BUBBLE_COLOR_NAMES[goal.color]} bubbles`;
    if (goal.kind === "powers") return `Activate ${goal.target} power ${goal.target === 1 ? "bubble" : "bubbles"}`;
    return `Make a ${goal.target}-wave chain`;
}

function goalProgress(goal: LevelGoal, score: number, collected: number, powers: number, chain: number): number {
    if (goal.kind === "score") return score;
    if (goal.kind === "collect") return collected;
    if (goal.kind === "powers") return powers;
    return chain;
}

function goalComplete(goal: LevelGoal, score: number, collected: number, powers: number, chain: number): boolean {
    return goalProgress(goal, score, collected, powers, chain) >= goal.target;
}

const wait = (ms: number) => new Promise<void>((resolve) =>
    window.setTimeout(resolve, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms)
);

function emptyBoard(): Array<Candy | null> {
    return Array(SIDE * SIDE).fill(null);
}

function getRuns(board: Array<Candy | null>): MatchRun[] {
    const runs: MatchRun[] = [];
    for (let row = 0; row < SIDE; row++) {
        let start = 0;
        while (start < SIDE) {
            const candy = board[row * SIDE + start];
            let end = start + 1;
            while (candy && candy.power !== "color" && end < SIDE && board[row * SIDE + end]?.power !== "color" && board[row * SIDE + end]?.color === candy.color) end++;
            if (candy && candy.power !== "color" && end - start >= 3) {
                runs.push({ cells: Array.from({ length: end - start }, (_, offset) => row * SIDE + start + offset), direction: "h" });
            }
            start = end;
        }
    }
    for (let column = 0; column < SIDE; column++) {
        let start = 0;
        while (start < SIDE) {
            const candy = board[start * SIDE + column];
            let end = start + 1;
            while (candy && candy.power !== "color" && end < SIDE && board[end * SIDE + column]?.power !== "color" && board[end * SIDE + column]?.color === candy.color) end++;
            if (candy && candy.power !== "color" && end - start >= 3) {
                runs.push({ cells: Array.from({ length: end - start }, (_, offset) => (start + offset) * SIDE + column), direction: "v" });
            }
            start = end;
        }
    }
    return runs;
}

function swap<T>(items: T[], a: number, b: number): T[] {
    const swapped = [...items];
    [swapped[a], swapped[b]] = [swapped[b], swapped[a]];
    return swapped;
}

function hasPossibleMove(board: Array<Candy | null>): boolean {
    for (let index = 0; index < board.length; index++) {
        const row = Math.floor(index / SIDE);
        const column = index % SIDE;
        for (const next of [column < SIDE - 1 ? index + 1 : -1, row < SIDE - 1 ? index + SIDE : -1]) {
            if (next < 0 || !board[index] || !board[next]) continue;
            const firstPower = board[index]?.power, secondPower = board[next]?.power;
            if (firstPower === "color" || secondPower === "color" || (firstPower && secondPower)) return true;
            if (getRuns(swap(board, index, next)).some((run) => run.cells.includes(index) || run.cells.includes(next))) return true;
        }
    }
    return false;
}

function chooseFormation(runs: MatchRun[], board: Array<Candy | null>, preferred?: number) {
    const horizontal = new Set(runs.filter((run) => run.direction === "h").flatMap((run) => run.cells));
    const vertical = new Set(runs.filter((run) => run.direction === "v").flatMap((run) => run.cells));
    const crossing = [...horizontal].find((cell) => vertical.has(cell));
    const longest = [...runs].sort((a, b) => b.cells.length - a.cells.length)[0];
    let power: Power | undefined;
    if (longest?.cells.length >= 5) power = "color";
    else if (crossing !== undefined) power = "wrapped";
    else if (longest?.cells.length === 4) power = longest.direction === "h" ? "stripe-h" : "stripe-v";
    if (!power) return null;
    const cells = power === "wrapped" && crossing !== undefined
        ? runs.filter((run) => run.cells.includes(crossing)).flatMap((run) => run.cells)
        : longest.cells;
    const candidates = [preferred, power === "wrapped" ? crossing : cells[Math.floor(cells.length / 2)], ...cells];
    const pivot = candidates.find((cell) => cell !== undefined && cells.includes(cell) && !board[cell]?.power);
    if (pivot === undefined) return null;
    return { pivot, power };
}

function getColorBombColor(board: Array<Candy | null>): CandyColor {
    const counts = new Map<CandyColor, number>();
    board.forEach((candy) => {
        if (candy && candy.power !== "color") counts.set(candy.color, (counts.get(candy.color) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "pink";
}

type PowerCombo = { board: Array<Candy | null>; clear: Set<number>; consumed: Set<number>; converted: boolean };
type PowerEffect = { kind: "row" | "column" | "burst" | "prism" | "spark"; cell: number; origin: number; span: number };
type PowerDisplay = { effects: PowerEffect[]; swallowed: Map<number, number> };

function combinePowers(board: Array<Candy | null>, from: number, to: number): PowerCombo | null {
    const first = board[from], second = board[to];
    if (!first || !second) return null;
    const bombCell = first.power === "color" ? from : second.power === "color" ? to : null;
    const clear = new Set([from, to]);
    const consumed = new Set([from, to]);
    if (bombCell !== null) {
        const partnerCell = bombCell === from ? to : from;
        const partner = bombCell === from ? second : first;
        if (partner.power === "color") {
            board.forEach((tile, cell) => { if (tile) clear.add(cell); });
            return { board, clear, consumed, converted: false };
        }
        consumed.delete(partnerCell);
        const next = board.map((tile, cell) => {
            if (!tile || tile.power === "color" || tile.color !== partner.color) return tile;
            clear.add(cell);
            if (!partner.power) return tile;
            const power = partner.power === "wrapped" ? "wrapped"
                : cell === partnerCell ? partner.power
                    : Math.random() < .5 ? "stripe-h" : "stripe-v";
            return { ...tile, power } satisfies Candy;
        });
        return { board: next, clear, consumed, converted: Boolean(partner.power) };
    }
    if (!first.power || !second.power) return null;

    const wrappedCount = Number(first.power === "wrapped") + Number(second.power === "wrapped");
    const centerRow = Math.floor(to / SIDE), centerColumn = to % SIDE;
    board.forEach((tile, cell) => {
        if (!tile) return;
        const rowsAway = Math.abs(Math.floor(cell / SIDE) - centerRow);
        const columnsAway = Math.abs(cell % SIDE - centerColumn);
        const hit = wrappedCount === 2
            ? rowsAway <= 2 && columnsAway <= 2
            : rowsAway <= wrappedCount || columnsAway <= wrappedCount;
        if (hit) clear.add(cell);
    });
    return { board, clear, consumed, converted: false };
}

export default function BubblePop({ onQuit, onFinish }: {
    onQuit: () => void;
    onFinish: (score: number) => Promise<boolean>;
}) {
    const idCounter = useRef(0);
    const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
    const [board, setBoard] = useState<Array<Candy | null>>(emptyBoard);
    const [clearing, setClearing] = useState<number[]>([]);
    const [powerDisplay, setPowerDisplay] = useState<PowerDisplay | null>(null);
    const [fallOffsets, setFallOffsets] = useState(() => new Map<number, number>());
    const [fallCycle, setFallCycle] = useState(0);
    const [unlockedLevel, setUnlockedLevel] = useState(readUnlockedLevel);
    const [currentLevel, setCurrentLevel] = useState(readUnlockedLevel);
    const [score, setScore] = useState(0);
    const [moves, setMoves] = useState(LEVELS[0].moves);
    const [collected, setCollected] = useState(0);
    const [powersActivated, setPowersActivated] = useState(0);
    const [combo, setCombo] = useState(0);
    const [bestCombo, setBestCombo] = useState(0);
    const [shuffleUsed, setShuffleUsed] = useState(false);
    const [won, setWon] = useState(false);
    const [message, setMessage] = useState("Drag a bubble onto a neighbor to swap.");
    const [claiming, setClaiming] = useState(false);
    const [rewardError, setRewardError] = useState(false);
    const scoreRef = useRef(0);
    const movesRef = useRef(LEVELS[0].moves);
    const collectedRef = useRef(0);
    const powersActivatedRef = useRef(0);
    const comboRef = useRef(0);
    const makeCandy = (color?: CandyColor, power?: Power): Candy => {
        return { id: ++idCounter.current, color: color ?? COLORS[Math.floor(Math.random() * COLORS.length)], power };
    };
    const busy = useRef(false);
    const claimRef = useRef(false);
    const dragRef = useRef<{ from: number; pointerId: number; startX: number; startY: number } | null>(null);
    const boardRef = useRef<HTMLDivElement>(null);

    function makeStartingBoard(): Array<Candy | null> {
        for (let attempt = 0; attempt < 300; attempt++) {
            const candidate = emptyBoard();
            for (let index = 0; index < candidate.length; index++) {
                const choices = [...COLORS].sort(() => Math.random() - 0.5);
                const color = choices.find((choice) => {
                    const row = Math.floor(index / SIDE);
                    const column = index % SIDE;
                    const formsHorizontal = column >= 2 && candidate[index - 1]?.color === choice && candidate[index - 2]?.color === choice;
                    const formsVertical = row >= 2 && candidate[index - SIDE]?.color === choice && candidate[index - SIDE * 2]?.color === choice;
                    return !formsHorizontal && !formsVertical;
                });
                candidate[index] = makeCandy(color);
            }
            if (hasPossibleMove(candidate)) return candidate;
        }
        return emptyBoard().map(() => makeCandy());
    }

    function finishRound(didWin: boolean) {
        if (didWin && currentLevel < LEVEL_COUNT && currentLevel >= unlockedLevel) {
            const nextUnlocked = currentLevel + 1;
            setUnlockedLevel(nextUnlocked);
            try { window.localStorage.setItem(PROGRESS_KEY, String(nextUnlocked)); } catch { /* Progress remains unlocked for this session. */ }
        }
        setWon(didWin);
        setPhase("over");
    }

    useEffect(() => () => { busy.current = false; }, []);

    function start(levelNumber = currentLevel) {
        const selectedLevel = LEVELS[levelNumber - 1];
        setCurrentLevel(levelNumber);
        scoreRef.current = 0;
        movesRef.current = selectedLevel.moves;
        collectedRef.current = 0;
        powersActivatedRef.current = 0;
        comboRef.current = 0;
        setScore(0);
        setMoves(selectedLevel.moves);
        setCollected(0);
        setPowersActivated(0);
        setCombo(0);
        setBestCombo(0);
        setShuffleUsed(false);
        dragRef.current = null;
        setClearing([]);
        setPowerDisplay(null);
        setFallOffsets(new Map());
        setBoard(makeStartingBoard());
        setWon(false);
        setMessage("Drag a bubble onto a neighbor to swap.");
        setRewardError(false);
        setPhase("playing");
    }

    function gravityAndRefill(current: Array<Candy | null>) {
        const next = emptyBoard();
        const fallOffsets = new Map<number, number>();
        for (let column = 0; column < SIDE; column++) {
            const candies: Array<{ candy: Candy; row: number }> = [];
            for (let row = SIDE - 1; row >= 0; row--) {
                const candy = current[row * SIDE + column];
                if (candy) candies.push({ candy, row });
            }
            const vacancies = SIDE - candies.length;
            while (candies.length < SIDE) {
                const candy = makeCandy();
                candies.push({ candy, row: -1 });
            }
            candies.reverse().forEach(({ candy, row: previousRow }, row) => {
                next[row * SIDE + column] = candy;
                const rowsDropped = previousRow < 0 ? vacancies : row - previousRow;
                if (rowsDropped > 0) fallOffsets.set(candy.id, rowsDropped);
            });
        }
        return { board: next, fallOffsets };
    }

    async function resolveBoard(initial: Array<Candy | null>, from: number, to: number, combo: PowerCombo | null) {
        let working = initial;
        const activeGoal = LEVELS[currentLevel - 1].goal;
        let cascadeCount = 0;
        let cascadeScore = 0;
        while (cascadeCount < 30) {
            const opening = cascadeCount === 0;
            const openingCombo = opening ? combo : null;
            const runs = openingCombo ? [] : getRuns(working).filter(
                (run) => !opening || run.cells.includes(from) || run.cells.includes(to)
            );
            if (!runs.length && !openingCombo) break;
            const formation = chooseFormation(runs, working, opening ? to : undefined);
            const clear = new Set(openingCombo?.clear ?? runs.flatMap((run) => run.cells));
            if (formation) clear.delete(formation.pivot);
            const queue = [...clear];
            const activated = new Set(openingCombo?.consumed);
            const effects = new Map<string, PowerEffect>();
            function showEffect(kind: PowerEffect["kind"], cell: number, span = 1, origin = cell) {
                if (kind === "row") cell -= cell % SIDE;
                if (kind === "column") cell %= SIDE;
                effects.set(`${kind}-${cell}`, { kind, cell, origin, span });
            }

            if (openingCombo) {
                const powers = [working[from]?.power, working[to]?.power];
                if (powers.includes("color")) {
                    const origin = working[to]?.power === "color" ? to : from;
                    for (const cell of openingCombo.clear) showEffect("spark", cell, 1, origin);
                    for (const cell of [from, to]) {
                        if (working[cell]?.power === "color") showEffect("prism", cell, 3);
                    }
                } else if (powers.every((power) => power === "wrapped")) {
                    showEffect("burst", to, 5);
                } else {
                    const radius = powers.includes("wrapped") ? 1 : 0;
                    if (radius) showEffect("burst", to, 3);
                    const row = Math.floor(to / SIDE), column = to % SIDE;
                    for (let offset = -radius; offset <= radius; offset++) {
                        if (row + offset >= 0 && row + offset < SIDE) showEffect("row", (row + offset) * SIDE + column);
                        if (column + offset >= 0 && column + offset < SIDE) showEffect("column", row * SIDE + column + offset);
                    }
                }
            }

            while (queue.length) {
                const index = queue.pop()!;
                if (activated.has(index)) continue;
                activated.add(index);
                const candy = working[index];
                if (!candy?.power || (formation && index === formation.pivot)) continue;
                const add = (cell: number) => {
                    if (cell >= 0 && cell < working.length && cell !== formation?.pivot && working[cell] && !clear.has(cell)) {
                        clear.add(cell);
                        queue.push(cell);
                    }
                };
                if (candy.power === "stripe-h") {
                    showEffect("row", index);
                    const row = Math.floor(index / SIDE);
                    for (let column = 0; column < SIDE; column++) add(row * SIDE + column);
                } else if (candy.power === "stripe-v") {
                    showEffect("column", index);
                    const column = index % SIDE;
                    for (let row = 0; row < SIDE; row++) add(row * SIDE + column);
                } else if (candy.power === "wrapped") {
                    showEffect("burst", index, 3);
                    const row = Math.floor(index / SIDE), column = index % SIDE;
                    for (let r = Math.max(0, row - 1); r <= Math.min(SIDE - 1, row + 1); r++) {
                        for (let c = Math.max(0, column - 1); c <= Math.min(SIDE - 1, column + 1); c++) add(r * SIDE + c);
                    }
                } else {
                    showEffect("prism", index, 3);
                    const targetColor = getColorBombColor(working);
                    working.forEach((tile, cell) => {
                        if (tile?.power !== "color" && tile?.color === targetColor && cell !== formation?.pivot) {
                            showEffect("spark", cell, 1, index);
                            add(cell);
                        }
                    });
                }
            }

            const removed = [...clear].filter((index) => working[index]);
            if (!removed.length) break;
            if (activeGoal.kind === "collect") {
                collectedRef.current += removed.filter((index) => working[index]?.color === activeGoal.color).length;
                setCollected(collectedRef.current);
            }
            powersActivatedRef.current += removed.filter((index) => Boolean(working[index]?.power)).length;
            setPowersActivated(powersActivatedRef.current);
            const visibleEffects = [...effects.values()];
            const swallowed = new Map<number, number>();
            for (const effect of visibleEffects) {
                if (effect.kind !== "burst") continue;
                const radius = (effect.span - 1) / 2;
                for (const cell of removed) {
                    const dx = cell % SIDE - effect.cell % SIDE;
                    const dy = Math.floor(cell / SIDE) - Math.floor(effect.cell / SIDE);
                    if (Math.abs(dx) <= radius && Math.abs(dy) <= radius && !swallowed.has(cell)) {
                        swallowed.set(cell, effect.cell);
                    }
                }
            }
            setPowerDisplay(visibleEffects.length ? { effects: visibleEffects, swallowed } : null);
            setClearing(removed);
            await wait(visibleEffects.length ? 720 : 360);
            working = working.map((candy, index) => clear.has(index) ? null : candy);
            if (formation) working[formation.pivot] = makeCandy(working[formation.pivot]?.color || initial[formation.pivot]?.color, formation.power);
            const gained = removed.length * 10 + (formation ? 60 : 0) + (cascadeCount ? 40 * cascadeCount : 0);
            cascadeScore += gained;
            scoreRef.current += gained;
            setScore(scoreRef.current);
            const refilled = gravityAndRefill(working);
            working = refilled.board;
            setFallCycle((cycle) => cycle + 1);
            setFallOffsets(refilled.fallOffsets);
            setBoard(working);
            setClearing([]);
            setPowerDisplay(null);
            await wait(FALL_MS + 20);
            cascadeCount++;
        }
        comboRef.current = cascadeCount;
        setCombo(cascadeCount);
        setBestCombo((best) => Math.max(best, cascadeCount));
        if (goalComplete(activeGoal, scoreRef.current, collectedRef.current, powersActivatedRef.current, cascadeCount)) finishRound(true);
        else if (movesRef.current <= 0) finishRound(false);
        else if (!hasPossibleMove(working)) {
            working = remix(working);
            setBoard(working);
            setMessage("No swaps left — the board shuffled itself!");
        }
        else if (cascadeCount > 1) setMessage(`${cascadeCount}-wave chain reaction · +${cascadeScore} points!`);
        else if (cascadeCount === 1) setMessage(`Nice match · +${cascadeScore} points!`);
        setFallOffsets(new Map());
    }

    async function makeMove(from: number, to: number) {
        if (busy.current || phase !== "playing") return;
        busy.current = true;
        const moved = swap(board, from, to);
        const combo = combinePowers(moved, from, to);
        try {
            setBoard(moved);
            await wait(SWAP_MS + 20);
            if (!combo && !getRuns(moved).some((run) => run.cells.includes(from) || run.cells.includes(to))) {
                setBoard(board);
                await wait(SWAP_MS + 20);
                setMessage("That swap doesn't make a match. Try another move.");
                return;
            }

            movesRef.current -= 1;
            setMoves(movesRef.current);
            if (combo?.converted) {
                setBoard(combo.board);
                setMessage("Color bomb combo! Matching bubbles gained powers.");
                await wait(300);
            }
            await resolveBoard(combo?.board ?? moved, from, to, combo);
        } finally {
            busy.current = false;
        }
    }

    function beginDrag(index: number, event: ReactPointerEvent<HTMLButtonElement>) {
        if (phase !== "playing" || busy.current || event.button !== 0) return;
        event.preventDefault();
        dragRef.current = {
            from: index,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY
        };
        boardRef.current?.setPointerCapture(event.pointerId);
    }

    function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
        const active = dragRef.current;
        if (!active || active.pointerId !== event.pointerId) return;
        const dx = event.clientX - active.startX;
        const dy = event.clientY - active.startY;
        const boardWidth = boardRef.current?.getBoundingClientRect().width || 360;
        const threshold = Math.max(12, boardWidth * .025);
        let target = -1;
        if (Math.max(Math.abs(dx), Math.abs(dy)) >= threshold) {
            const row = Math.floor(active.from / SIDE);
            const column = active.from % SIDE;
            if (Math.abs(dx) > Math.abs(dy)) {
                target = dx < 0 ? (column > 0 ? active.from - 1 : -1) : (column < SIDE - 1 ? active.from + 1 : -1);
            } else {
                target = dy < 0 ? (row > 0 ? active.from - SIDE : -1) : (row < SIDE - 1 ? active.from + SIDE : -1);
            }
        }
        dragRef.current = null;
        if (target >= 0) void makeMove(active.from, target);
    }

    function cancelDrag() {
        dragRef.current = null;
    }

    function keyMove(index: number, event: ReactKeyboardEvent<HTMLButtonElement>) {
        if (phase !== "playing" || busy.current) return;
        const row = Math.floor(index / SIDE), column = index % SIDE;
        const target = event.key === "ArrowUp" && row > 0 ? index - SIDE
            : event.key === "ArrowDown" && row < SIDE - 1 ? index + SIDE
                : event.key === "ArrowLeft" && column > 0 ? index - 1
                    : event.key === "ArrowRight" && column < SIDE - 1 ? index + 1
                        : -1;
        if (target >= 0) {
            event.preventDefault();
            void makeMove(index, target);
        }
    }

    function remix(source: Array<Candy | null>): Array<Candy | null> {
        const occupied = source.map((candy, index) => candy ? index : -1).filter((index) => index >= 0);
        const candies = source.filter((candy): candy is Candy => Boolean(candy));
        for (let attempt = 0; attempt < 100; attempt++) {
            const shuffled = [...candies];
            for (let index = shuffled.length - 1; index > 0; index--) {
                const other = Math.floor(Math.random() * (index + 1));
                [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
            }
            const candidate = emptyBoard();
            occupied.forEach((cell, index) => { candidate[cell] = shuffled[index]; });
            if (!getRuns(candidate).length && hasPossibleMove(candidate)) return candidate;
        }
        return source;
    }

    function shuffleBoard() {
        if (busy.current || phase !== "playing") return;
        if (shuffleUsed) return;
        setBoard(remix(board));
        setShuffleUsed(true);
        setMessage("Board shuffled! Find a fresh match.");
    }

    async function claimRound(action: "retry" | "next" | "quit") {
        if (claimRef.current) return;
        claimRef.current = true;
        setClaiming(true);
        setRewardError(false);
        try {
            if (await onFinish(scoreRef.current)) {
                if (action === "retry") start(currentLevel);
                else if (action === "next" && currentLevel < LEVEL_COUNT) start(currentLevel + 1);
                else onQuit();
            } else setRewardError(true);
        } catch {
            setRewardError(true);
        } finally {
            claimRef.current = false;
            setClaiming(false);
        }
    }

    function closeGame() {
        if (phase === "over") void claimRound("quit");
        else if (!busy.current) onQuit();
    }

    const activeLevel = LEVELS[currentLevel - 1];
    const objectiveProgress = goalProgress(activeLevel.goal, score, collected, powersActivated, bestCombo);
    const progress = Math.min(100, Math.round((objectiveProgress / activeLevel.goal.target) * 100));
    const displayedProgress = activeLevel.goal.kind === "score" ? objectiveProgress.toLocaleString() : objectiveProgress;
    // Keep existing buttons in DOM order so React does not move one node during a swap.
    const tiles = board.flatMap((candy, index) => candy ? [{ candy, index }] : [])
        .sort((first, second) => first.candy.id - second.candy.id);

    return <div className="overlay">
        <section className="game-modal arcade-modal bubble-pop-modal" aria-label="Bubble Pop match three game">
            <header className="paw-arcade-modal-header">
                <div className="paw-arcade-heading">
                    <h2><Gamepad2 size={23} aria-hidden="true" /><span>Bubble Pop</span></h2>
                    <p className="paw-modal-subtitle">Play with your pet</p>
                </div>
                <button className="paw-arcade-exit" type="button" aria-label="Close game" title="Close game" disabled={claiming || busy.current} onClick={closeGame}><X size={20} /></button>
            </header>

            {phase === "ready" ? <div className="game-center bubble-pop-intro">
                <div className="huge bubble-pop-start-art"><BubblePopIcon /></div>
                <p>Match three or more bubbles, make power-ups, and clear each level’s goal.</p>
                <div className="bubble-level-picker">
                    <div className="bubble-level-picker-heading">
                        <span>Choose level</span>
                        <small>{unlockedLevel} / {LEVEL_COUNT} unlocked</small>
                    </div>
                    <div className="bubble-level-stepper">
                        <button type="button" aria-label="Previous level" title="Previous level" disabled={currentLevel <= 1} onClick={() => setCurrentLevel((level) => Math.max(1, level - 1))}><ChevronLeft size={19} /></button>
                        <div className="bubble-level-current"><small>LEVEL</small><strong>{String(currentLevel).padStart(2, "0")}</strong></div>
                        <button type="button" aria-label="Next level" title="Next level" disabled={currentLevel >= unlockedLevel} onClick={() => setCurrentLevel((level) => Math.min(unlockedLevel, level + 1))}><ChevronRight size={19} /></button>
                    </div>
                    <input
                        className="bubble-level-range"
                        type="range"
                        min={1}
                        max={unlockedLevel}
                        step={1}
                        value={currentLevel}
                        aria-label="Choose Bubble Pop level"
                        aria-valuetext={`Level ${currentLevel}: ${goalLabel(activeLevel.goal)}`}
                        style={{ "--level-progress": `${unlockedLevel > 1 ? ((currentLevel - 1) / (unlockedLevel - 1)) * 100 : 0}%` } as CSSProperties}
                        onChange={(event) => setCurrentLevel(Number(event.target.value))}
                    />
                    <p className="bubble-level-goal">{goalLabel(activeLevel.goal)} <span>·</span> {activeLevel.moves} moves</p>
                </div>
                <button className="primary" onClick={() => start(currentLevel)}>Start game</button>
            </div> : phase === "over" ? <div className="game-center bubble-pop-intro">
                <h2>{won ? currentLevel === LEVEL_COUNT ? "Campaign complete!" : `Level ${currentLevel} cleared!` : `Level ${currentLevel} — try again`}</h2>
                <h3>{goalLabel(activeLevel.goal)} · {displayedProgress} / {activeLevel.goal.target.toLocaleString()} · Best chain {bestCombo}</h3>
                <p>{won ? currentLevel === LEVEL_COUNT ? "You cleared all 99 levels!" : `Level ${currentLevel + 1} is unlocked.` : "Make special bubbles and plan each move around the level goal."}</p>
                {rewardError && <p className="paw-arcade-reward-error" role="alert">Reward wasn't saved. Try again to claim it.</p>}
                <div className={`bubble-level-actions ${won ? "is-won" : "is-lost"}`}>
                    {won && currentLevel < LEVEL_COUNT && <button className="bubble-level-action bubble-level-action-next" disabled={claiming} onClick={() => void claimRound("next")}>
                        <ArrowRight size={18} aria-hidden="true" /><span><strong>{claiming ? "Collecting reward..." : "Next level"}</strong><small>Level {currentLevel + 1}</small></span>
                    </button>}
                    <button className={`bubble-level-action ${won && currentLevel < LEVEL_COUNT ? "bubble-level-action-replay" : "bubble-level-action-next"}`} disabled={claiming} onClick={() => void claimRound("retry")}>
                        <RotateCcw size={17} aria-hidden="true" /><span><strong>{claiming ? "Collecting reward..." : "Play again"}</strong><small>Replay level {currentLevel}</small></span>
                    </button>
                    <button className="bubble-level-action bubble-level-action-quit" disabled={claiming} onClick={() => void claimRound("quit")}>
                        <Coins size={17} aria-hidden="true" /><span><strong>Collect coins</strong><small>Leave Bubble Pop</small></span>
                    </button>
                </div>
            </div> : <>
                <div className="paw-arcade-hud bubble-pop-hud">
                    <span>Level {currentLevel} / {LEVEL_COUNT}</span>
                    <span>Score {score.toLocaleString()}</span>
                    <span>{displayedProgress} / {activeLevel.goal.target.toLocaleString()}</span>
                    <span>{moves} moves</span>
                </div>
                <p className="bubble-level-goal">{goalLabel(activeLevel.goal)}</p>
                <div className="bubble-pop-progress" aria-label={`${progress}% of level goal`}><span style={{ width: `${progress}%` }} /></div>
                <div
                    ref={boardRef}
                    className="bubble-match-board"
                    style={{ "--bubble-move-duration": `${fallOffsets.size ? FALL_MS : SWAP_MS}ms` } as CSSProperties}
                    role="grid"
                    aria-label="9 by 9 bubble board. Swipe from a bubble toward a neighbor to swap."
                    onPointerUp={endDrag}
                    onPointerCancel={cancelDrag}
                >
                    {tiles.map(({ candy, index }) => {
                        const row = Math.floor(index / SIDE), column = index % SIDE;
                        const entryRows = fallOffsets.get(candy.id);
                        const swallowCenter = powerDisplay?.swallowed.get(index);
                        const classNames = [
                            "bubble-match-tile",
                            `bubble-${candy.color}`,
                            candy.power ? `bubble-power-${candy.power}` : "",
                            clearing.includes(index) ? "clearing" : "",
                            entryRows !== undefined ? "falling" : ""
                        ].filter(Boolean).join(" ");
                        return <button
                            key={entryRows === undefined ? candy.id : `${candy.id}-fall-${fallCycle}`}
                            type="button"
                            role="gridcell"
                            data-candy-index={index}
                            data-swallowed={swallowCenter !== undefined ? "" : undefined}
                            aria-label={candy.power === "color" ? "Rainbow color bomb" : `${BUBBLE_COLOR_NAMES[candy.color]} bubble${candy.power ? `, ${candy.power.replace("-", " ")} power` : ""}`}
                            className={classNames}
                            style={{
                                transform: `translate3d(${column * 100}%, ${row * 100}%, 0)`,
                                "--bubble-entry-offset": entryRows === undefined ? undefined : `${-entryRows * 100}%`,
                                "--swallow-x": swallowCenter === undefined ? undefined : `${(swallowCenter % SIDE - column) * 100}%`,
                                "--swallow-y": swallowCenter === undefined ? undefined : `${(Math.floor(swallowCenter / SIDE) - row) * 100}%`
                            } as CSSProperties}
                            onPointerDown={(event) => beginDrag(index, event)}
                            onKeyDown={(event) => keyMove(index, event)}
                        />;
                    })}
                    <div className="bubble-power-effects" aria-hidden="true">
                        {powerDisplay?.effects.map(({ kind, cell, origin, span }) => (
                            <span
                                key={`${kind}-${cell}`}
                                className={`bubble-effect bubble-effect-${kind}`}
                                style={{
                                    "--effect-x": `${(cell % SIDE + .5) * 100 / SIDE}%`,
                                    "--effect-y": `${(Math.floor(cell / SIDE) + .5) * 100 / SIDE}%`,
                                    "--effect-size": `${span * 100 / SIDE}%`,
                                    "--beam-origin": `${((kind === "row" ? origin % SIDE : Math.floor(origin / SIDE)) + .5) * 100 / SIDE}%`,
                                    "--spark-delay": `${Math.hypot(cell % SIDE - origin % SIDE, Math.floor(cell / SIDE) - Math.floor(origin / SIDE)) * 16}ms`
                                } as CSSProperties}
                            />
                        ))}
                    </div>
                </div>
                <div className="bubble-pop-tools">
                    <button className="secondary bubble-pop-shuffle" type="button" title={shuffleUsed ? "Shuffle already used" : "One free shuffle"} aria-label={shuffleUsed ? "Shuffle already used" : "Shuffle bubbles once"} disabled={shuffleUsed} onClick={shuffleBoard}><Shuffle size={16} /> {shuffleUsed ? "Used" : "Shuffle"}</button>
                    <p className="bubble-pop-hint" aria-live="polite">{message}</p>
                </div>
                <p className="bubble-pop-rules">4 in a row: stripe · 5: color pop · T/L: burst</p>
                <p className="bubble-pop-rules">Stripe + burst clears three rows and columns. Color pop + power turns matching bubbles into that power.</p>
            </>}
        </section>
    </div>;
}
