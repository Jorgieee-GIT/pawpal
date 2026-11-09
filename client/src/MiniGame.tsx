import { Clock3, Gamepad2, Star, Trophy, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
    MEMORY_HEARTS,
    MemoryHeart,
    PaintPalette,
    PAW_COLOR_PALETTE,
    TargetHeart
} from "./ArcadeArt";
import ArcadeCanvas from "./ArcadeCanvas";
import { PawIcon } from "./PawIcons";
import type { Pet } from "./types";

export const PAW_GAMES: Array<[string, string, string]> = [
    ["memory", "memory", "Memory Tiles"],
    ["dino", "cactus", "Cactus Jump"],
    ["runner", "runner", "Paw Run"],
    ["pattern", "heart", "Heart Color Match"],
    ["mole", "mole", "Whack-a-Mole"],
    ["claw", "plush", "Paw Claw"]
];

function ArcadeLives({ lives, maxLives }: { lives: number; maxLives: number }) {
    return (
        <span className="paw-arcade-hearts" aria-label={`${lives} of ${maxLives} lives remaining`}>
            {Array.from(
                {
                    length: maxLives
                },
                (_, index) => (
                    <span key={index} className={index < lives ? "mole-heart" : "mole-heart spent"}>
                        <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">
                            <path
                                d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"
                                fill={index < lives ? "#ed799d" : "none"}
                                stroke={index < lives ? "#ed799d" : "#c7b4c0"}
                                strokeWidth="2"
                            />
                        </svg>
                    </span>
                )
            )}
        </span>
    );
}

export function MiniGame({
    kind,
    pet,
    onQuit,
    onFinish
}: {
    kind: string;
    pet: Pet;
    onQuit: () => void;
    onFinish: (score: number) => Promise<boolean>;
}) {
    const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(1);
    const [sequence, setSequence] = useState<number[]>([]);
    const [input, setInput] = useState(0);
    const [show, setShow] = useState(true);
    const [heart, setHeart] = useState(0);
    const [lane, setLane] = useState(1);
    const [jump, setJump] = useState(false);
    const [obstacle, setObstacle] = useState<
        {
            x: number;
            lane: number;
            kind: string;
        }[]
    >([]);
    const [ticks, setTicks] = useState(0);
    const [time, setTime] = useState(30);
    const [target, setTarget] = useState(0);
    const keys = useRef<Record<string, boolean>>({});
    const state = useRef({
        phase: "ready",
        kind,
        lane: 1,
        jump: false,
        obstacle: [] as {
            x: number;
            lane: number;
            kind: string;
        }[],
        level: 1,
        ticks: 0
    });
    const [claiming, setClaiming] = useState(false);
    const [rewardError, setRewardError] = useState(false);
    const claimRef = useRef(false);
    const palette = PAW_COLOR_PALETTE;
    const [colors, setColors] = useState(() => palette.slice(0, 8));
    const count = Math.min(8, 3 + Math.floor((level - 1) / 5));
    async function claimRound(replay: boolean) {
        if (claimRef.current) {
            return;
        }
        claimRef.current = true;
        setClaiming(true);
        setRewardError(false);
        try {
            const rewarded = await onFinish(score);
            if (rewarded) {
                if (replay) {
                    reset();
                } else {
                    onQuit();
                }
            } else {
                setRewardError(true);
            }
        } catch {
            setRewardError(true);
        } finally {
            claimRef.current = false;
            setClaiming(false);
        }
    }
    const closeGame = () => {
        if (phase === "over") {
            void claimRound(false);
        } else {
            onQuit();
        }
    };
    function reset() {
        setColors(palette.slice(0, 8));
        setScore(0);
        setLevel(1);
        setLives(kind === "memory" || kind === "pattern" ? 3 : 1);
        setTime(30);
        setInput(0);
        setSequence([Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)]);
        setShow(true);
        setHeart(Math.floor(Math.random() * 3));
        setLane(1);
        setJump(false);
        setObstacle([]);
        setTicks(0);
        setTarget(0);
        setPhase("playing");
    }
    useEffect(() => {
        state.current = {
            phase,
            kind,
            lane,
            jump,
            obstacle,
            level,
            ticks
        };
    }, [phase, kind, lane, jump, obstacle, level, ticks]);
    useEffect(() => {
        if (phase !== "playing" || kind !== "memory") {
            return;
        }
        setShow(true);
        const t = setTimeout(() => setShow(false), Math.max(1000, 2500 - level * 85));
        return () => clearTimeout(t);
    }, [sequence, phase, kind, level]);
    useEffect(() => {
        if (phase !== "playing" || kind !== "pattern") {
            return;
        }
        const t = setInterval(
            () =>
                setTime((x) => {
                    if (x <= 1) {
                        setPhase("over");
                        return 0;
                    }
                    return x - 1;
                }),
            1000
        );
        return () => clearInterval(t);
    }, [phase, kind]);

    function memoryPress(n: number) {
        if (show) {
            return;
        }
        if (sequence[input] !== n) {
            setLives((x) => {
                if (x <= 1) {
                    setPhase("over");
                }
                return Math.max(0, x - 1);
            });
            setInput(0);
            setShow(true);
            setSequence((x) => [...x]);
            return;
        }
        if (input + 1 === sequence.length) {
            setScore((x) => x + 20 + level * 4);
            setLevel((x) => x + 1);
            setInput(0);
            setSequence((x) => [...x, Math.floor(Math.random() * 4)]);
        } else {
            setInput((x) => x + 1);
        }
    }
    function colorPress(n: number) {
        if (n !== heart) {
            setLives((x) => {
                if (x <= 1) {
                    setPhase("over");
                }
                return Math.max(0, x - 1);
            });
            return;
        }
        setScore((x) => x + 15 + level * 3);
        setLevel((x) => x + 1);
        if ((level + 1) % 5 === 0 && level + 1 >= 20) {
            const shuffled = [...palette];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            setColors(shuffled.slice(0, 8));
        }
        setTime((x) => Math.min(30, x + 3));
        const nextCount = Math.min(8, 3 + Math.floor(level / 5));
        setHeart(Math.floor(Math.random() * nextCount));
    }
    const labels: {
        [key: string]: string;
    } = {
        memory: "Memory Tiles",
        pattern: "Heart Color Match",
        dino: "Cactus Jump",
        runner: "Paw Run"
    };
    return (
        <div className="overlay">
            <div className="game-modal arcade-modal">
                <header className="paw-arcade-modal-header">
                    <div className="paw-arcade-heading">
                        <h2>
                            <Gamepad2 size={23} aria-hidden="true" />
                            <span>{labels[kind]}</span>
                        </h2>
                        <p className="paw-modal-subtitle">Play with your pet</p>
                    </div>
                    <button
                        className="paw-arcade-exit"
                        type="button"
                        aria-label="Close game"
                        title="Close game"
                        disabled={claiming}
                        onClick={closeGame}
                    >
                        <X size={20} />
                    </button>
                </header>
                {phase === "ready" ? (
                    <div className="game-center">
                        <div className="huge">
                            <PawIcon name={kind} size={68} />
                        </div>
                        <p>
                            {kind === "dino"
                                ? "Tap or press Space to jump over incoming cacti. Survive as speed increases."
                                : kind === "runner"
                                  ? "Swipe left or right, or use arrow keys to dodge obstacles."
                                  : kind === "memory"
                                    ? "Remember the hearts in order. The sequence gets longer after every round."
                                    : "Match the big heart with the correct paint color."}
                        </p>
                        <button className="primary" onClick={reset}>
                            Start game
                        </button>
                    </div>
                ) : phase === "over" ? (
                    <div className="game-center">
                        <div className="huge">
                            <Trophy size={62} aria-hidden="true" />
                        </div>
                        <h2>Game over</h2>
                        <h3>
                            {score} points · Level {level}
                        </h3>
                        {rewardError && (
                            <p className="paw-arcade-reward-error" role="alert">
                                Reward wasn't saved. Try again to claim it.
                            </p>
                        )}
                        <div className="actions centered paw-game-over-actions">
                            <button
                                className="primary"
                                disabled={claiming}
                                onClick={() => void claimRound(true)}
                            >
                                {claiming ? "Collecting reward..." : "Retry"}
                            </button>
                            <button
                                className="secondary"
                                disabled={claiming}
                                onClick={() => void claimRound(false)}
                            >
                                Collect coins & quit
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mole-hud paw-arcade-hud">
                            <span className="paw-hud-score">
                                <Star size={18} aria-hidden="true" fill="#f4ce7b" color="#aa8192" />{" "}
                                {score} points
                            </span>
                            <span className="paw-hud-round">Level {level}</span>
                            <ArcadeLives
                                lives={lives}
                                maxLives={kind === "memory" || kind === "pattern" ? 3 : 1}
                            />
                            {kind === "pattern" && (
                                <span className="paw-hud-clock">
                                    <Clock3 size={16} aria-hidden="true" /> {time}s
                                </span>
                            )}
                        </div>
                        {kind === "memory" ? (
                            <>
                                <p className="paw-memory-instruction">
                                    {show
                                        ? "Watch the hearts in order!"
                                        : `Your turn! ${input}/${sequence.length}`}
                                </p>
                                <div
                                    className="paw-memory-sequence"
                                    aria-label={
                                        show
                                            ? `Memorize ${sequence.length} colored hearts in order`
                                            : "Sequence hidden; repeat it using the four hearts below"
                                    }
                                >
                                    {show ? (
                                        sequence.map((index, position) => (
                                            <span
                                                className="paw-memory-sequence-heart"
                                                key={`${position}-${index}`}
                                            >
                                                <MemoryHeart index={index} size={34} />
                                            </span>
                                        ))
                                    ) : (
                                        <span className="paw-memory-hidden">
                                            Repeat the pattern below
                                        </span>
                                    )}
                                </div>
                                <div className="memory-board paw-memory-board">
                                    {MEMORY_HEARTS.map((entry, i) => (
                                        <button
                                            key={i}
                                            disabled={show}
                                            onClick={() => memoryPress(i)}
                                            aria-label={`${entry.label} heart`}
                                        >
                                            <MemoryHeart index={i} size={38} />
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : kind === "pattern" ? (
                            <>
                                <p className="paw-color-match-prompt">Match this heart!</p>
                                <div className="target-heart">
                                    <TargetHeart color={colors[heart]} />
                                </div>
                                <div className="heart-choices paw-palette-choices">
                                    {colors.slice(0, count).map((c, i) => (
                                        <button
                                            key={i}
                                            onClick={() => colorPress(i)}
                                            aria-label={`Choose paint palette ${i + 1}`}
                                            className="paw-palette-choice"
                                            type="button"
                                        >
                                            <PaintPalette color={c} />
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <ArcadeCanvas
                                    species={
                                        window.localStorage.getItem("pawpal-arcade-species") ||
                                        "cat"
                                    }
                                    kind={kind as "dino" | "runner"}
                                    onScore={(points) => {
                                        setScore(points);
                                        setLevel(1 + Math.floor(points / 120));
                                    }}
                                    onGameOver={() => setPhase("over")}
                                />
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
