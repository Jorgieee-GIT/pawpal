import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Check, Minus, Plus, Sparkles } from "lucide-react";
import { KitchenExtraArt } from "./KitchenExtraArt";
import {
    catchResult,
    rollingResult,
    seasoningResult,
    stoveResult,
    type ExtraKitchenChallenge
} from "./KitchenExtraChallenges";

export type ExtraKitchenGame = "roll" | "catch" | "stove" | "season";

type Props = {
    game: ExtraKitchenGame;
    challenge: ExtraKitchenChallenge;
    disabled: boolean;
    onComplete: (score: number) => void;
};

/*
 * DOCU: Render the rolling game interface and provide its feature behavior.
 * @param {Omit<Props, "game">} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function RollingGame({ challenge, disabled, onComplete }: Omit<Props, "game">) {
    const [ridges, setRidges] = useState<number[]>([...challenge.rolling.ridges]);
    const [selected, setSelected] = useState(0);
    const ridgesRef = useRef([...challenge.rolling.ridges]);
    const strokesRef = useRef(0);
    const lastPoint = useRef<{
        x: number;
        y: number
    } | null>(null);
    const rollerRef = useRef<HTMLDivElement | null>(null);
    const completed = useRef(false);

        /*
     * DOCU: Roll lane for this feature.
     * @param {number} lane - lane value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
function rollLane(lane: number) {
        if (disabled || completed.current || ridgesRef.current[lane] <= 0) {
            return;
        }
        ridgesRef.current = ridgesRef.current.map((value, index) =>
            index === lane ? Math.max(0, value - 1) : value
        );
        strokesRef.current++;
        setRidges([...ridgesRef.current]);
        setSelected(lane);

        if (ridgesRef.current.every(value => value === 0)) {
            completed.current = true;
            onComplete(rollingResult(ridgesRef.current, strokesRef.current));
        }
    }

        /*
     * DOCU: Handle pointer down behavior for this feature.
     * @param {PointerEvent<HTMLDivElement>} event - User or browser event that triggered this operation
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
function pointerDown(event: PointerEvent<HTMLDivElement>) {
        if (disabled) {
            return;
        }
        event.currentTarget.setPointerCapture(event.pointerId);
        lastPoint.current = {
            x: event.clientX,
            y: event.clientY
        };
        pointerMove(event);
    }

        /*
     * DOCU: Handle pointer move behavior for this feature.
     * @param {PointerEvent<HTMLDivElement>} event - User or browser event that triggered this operation
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
function pointerMove(event: PointerEvent<HTMLDivElement>) {
        if (disabled) {
            return;
        }
        const rect = event.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
        const lane = Math.min(3, Math.floor(y * 4));

        if (rollerRef.current) {
            rollerRef.current.style.transform = `translate3d(${x * 95}%, ${y * 95}%, 0) rotate(-20deg)`;
        }
        if (!lastPoint.current) {
            return;
        }
        const distance = Math.hypot(event.clientX - lastPoint.current.x, event.clientY - lastPoint.current.y);
        if (distance >= 28) {
            rollLane(lane);
            lastPoint.current = {
                x: event.clientX,
                y: event.clientY
            };
        }
    }

    const remaining = ridges.reduce((sum, value) => sum + value, 0);

    return (
        <div className="k4-game">
            <div className="k4-rolling-board" role="group" aria-label="Roll each dough ridge smooth by dragging the rolling pin" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={() => {lastPoint.current =null;}} onPointerCancel={() => {lastPoint.current =null;}}>
                <span className="k4-board-flour">
                    <KitchenExtraArt id="rolling_flour" />
                </span>
                {ridges.map((ridge, index) => (
                    <div className={`k4-dough-lane ${ridge === 0 ? "smooth" : ""} ${selected === index ? "selected" : ""}`} key={index}>
                        <div className="k4-dough-rise" style={{
                            height: `${8 + ridge * 4}px`
                        }} />
                        <span>
                            {ridge === 0 ? "Smooth ✓" : `${ridge} passes`}
                        </span>
                    </div>
                ))}
                <div className="k4-rolling-pin" ref={rollerRef} aria-hidden="true">
                    <KitchenExtraArt id="rolling_pin" />
                </div>
            </div>
            <div className="k4-progress-row">
                <span>Roll the raised strips until smooth</span>
                <strong>
                    {remaining} passes left</strong>
            </div>
            <div className="k4-lane-buttons" aria-label="Accessible alternatives to dragging the rolling pin">
                {ridges.map((ridge, index) => (
                    <button type="button" key={index} disabled={disabled || ridge === 0} onClick={() => rollLane(index)}>
                        {ridge === 0 ? <Check size={15} /> : `Roll ${index + 1}`}
                    </button>
                ))}
            </div>
        </div>
    );
}

/*
 * DOCU: Render the catch game interface and provide its feature behavior.
 * @param {Omit<Props, "game">} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function CatchGame({ challenge, disabled, onComplete }: Omit<Props, "game">) {
    const [index, setIndex] = useState(0);
    const [caught, setCaught] = useState(0);
    const [bad, setBad] = useState(0);
    const [missed, setMissed] = useState(0);
    const basketPosition = useRef(50);
    const basketRef = useRef<HTMLDivElement | null>(null);
    const stageRef = useRef<HTMLDivElement | null>(null);
    const itemRef = useRef<HTMLDivElement | null>(null);
    const caughtRef = useRef(0);
    const badRef = useRef(0);
    const missedRef = useRef(0);
    const finished = useRef(false);
    const drop = challenge.catch.drops[index];

        /*
     * DOCU: Move basket for this feature.
     * @param {number} percent - percent value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
function moveBasket(percent: number) {
        basketPosition.current = Math.max(12, Math.min(88, percent));
        if (basketRef.current) {
            basketRef.current.style.left = `${basketPosition.current}%`;
        }
    }

    useEffect(() => {
        if (disabled || !drop || finished.current) {
            return;
        }
        let animation = 0;
        let started = 0;
                /*
         * DOCU: Animate the current state for this feature.
         * @param {number} now - now value used by this function
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const animate = (now: number) => {
            if (started === 0) {
                started = now;
            }
            const progress = Math.min(1, (now - started) / drop.duration);
            if (itemRef.current) {
                itemRef.current.style.transform = `translate3d(-50%, ${progress * Math.max(100, (stageRef.current?.clientHeight || 194) - 62)}px, 0) rotate(${progress * 160}deg)`;
            }
            if (progress < 1) {
                animation = requestAnimationFrame(animate);
                return;
            }
            const inBasket = Math.abs(basketPosition.current - drop.x) <= 17;
            if (inBasket && drop.kind === "good") {
                caughtRef.current++;
                setCaught(caughtRef.current);
            } else if (inBasket && drop.kind === "bad") {
                badRef.current++;
                setBad(badRef.current);
            } else if (!inBasket && drop.kind === "good") {
                missedRef.current++;
                setMissed(missedRef.current);
            }
            if (index === challenge.catch.drops.length - 1) {
                finished.current = true;
                onComplete(catchResult(caughtRef.current, missedRef.current, badRef.current));
            } else {
                setIndex(index + 1);
            }
        };
        animation = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animation);
    }, [index, disabled, challenge.catch.drops, drop, onComplete]);

    useEffect(() => {
        if (disabled) {
            return;
        }
                /*
         * DOCU: Handle on key behavior for this feature.
         * @param {KeyboardEvent} event - User or browser event that triggered this operation
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const onKey = (event: KeyboardEvent) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                moveBasket(basketPosition.current + (event.key === "ArrowLeft" ? -11 : 11));
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [disabled]);

    return (
        <div className="k4-game">
            <div className="k4-catch-stage" ref={stageRef} role="group" aria-label="Move the basket under falling fresh ingredients, avoiding spoiled ingredients" onPointerMove={event => {const rect =event.currentTarget.getBoundingClientRect(); moveBasket((event.clientX - rect.left) / rect.width * 100);}} onPointerDown={event => {event.currentTarget.setPointerCapture(event.pointerId); const rect =event.currentTarget.getBoundingClientRect(); moveBasket((event.clientX - rect.left) / rect.width * 100);}}>
                <div className="k4-catch-guide">
                    <span>
                        <KitchenExtraArt id="fresh_ingredient" /> Catch fresh</span>
                    <span>
                        <KitchenExtraArt id="spoiled_ingredient" /> Avoid spoiled</span>
                </div>
                {drop && (
                    <div className="k4-falling-item" key={index} ref={itemRef} style={{left: `${drop.x}%`}}>
                        <KitchenExtraArt id={drop.kind === "good" ? "fresh_ingredient" : "spoiled_ingredient"} />
                    </div>
                )}
                <div className="k4-catch-basket" ref={basketRef}>
                    <KitchenExtraArt id="catch_basket" />
                </div>
            </div>
            <div className="k4-progress-row">
                <span>Drop {Math.min(index + 1, challenge.catch.drops.length)} / {challenge.catch.drops.length}
                </span>
                <strong>Fresh {caught} · Missed {missed} · Spoiled {bad}
                </strong>
            </div>
            <div className="k4-catch-controls">
                <button type="button" disabled={disabled} onClick={() => moveBasket(basketPosition.current - 12)}>← Left</button>
                <button type="button" disabled={disabled} onClick={() => moveBasket(basketPosition.current + 12)}>Right →</button>
            </div>
        </div>
    );
}

/*
 * DOCU: Render the stove game interface and provide its feature behavior.
 * @param {Omit<Props, "game">} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function StoveGame({ challenge, disabled, onComplete }: Omit<Props, "game">) {
    const [finished, setFinished] = useState<boolean[]>([false, false, false]);
    const finishedRef = useRef([false, false, false]);
    const scoresRef = useRef<number[]>([0, 0, 0]);
    const bars = useRef<Array<HTMLSpanElement | null>>([]);
    const started = useRef(0);
    const completeRef = useRef(false);

        /*
     * DOCU: Finish pan for this feature.
     * @param {number} index - Position of the item in its collection
     * @param {number} progress - progress value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
function finishPan(index: number, progress: number) {
        if (finishedRef.current[index] || completeRef.current || disabled || progress < 0) {
            return;
        }
        const diff = Math.abs(progress - 84);
        scoresRef.current[index] = progress >= 108 ? 45 : Math.max(45, Math.round(100 - diff * 2.2));
        finishedRef.current = finishedRef.current.map((value, idx) => idx === index ? true : value);
        setFinished([...finishedRef.current]);
        if (finishedRef.current.every(Boolean)) {
            completeRef.current = true;
            onComplete(stoveResult(scoresRef.current));
        }
    }

    useEffect(() => {
        if (disabled || completeRef.current) {
            return;
        }
        let animation = 0;
                /*
         * DOCU: Draw the current state for this feature.
         * @param {number} now - now value used by this function
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const draw = (now: number) => {
            if (!started.current) {
                started.current = now;
            }
            const elapsed = now - started.current;
            challenge.stove.durations.forEach((duration, index) => {
                if (finishedRef.current[index]) {
                    return;
                }
                const progress = (elapsed - challenge.stove.delays[index]) / duration * 100;
                if (bars.current[index]) {
                    bars.current[index]!.style.transform = `scaleX(${Math.max(0, Math.min(1, progress / 100))})`;
                }
                if (progress >= 113) {
                    finishPan(index, progress);
                }
            });
            if (!completeRef.current) {
                animation = requestAnimationFrame(draw);
            }
        };
        animation = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animation);
    }, [disabled, challenge.stove.durations, challenge.stove.delays]);

    return (
        <div className="k4-game">
            <div className="k4-stove-station">
                {[0, 1, 2].map(index => (
                    <button
                        type="button"
                        className={`k4-pan ${finished[index] ? "done" : ""}`}
                        key={index}
                        disabled={disabled || finished[index]}
                        onClick={() => {
                            if (!started.current) {
                                return;
                            }
                            const progress = (performance.now() - started.current - challenge.stove.delays[index]) / challenge.stove.durations[index] * 100;
                            finishPan(index, progress);
                        }}
                    >
                        <span className="k4-pan-flame">
                            <KitchenExtraArt id="stove_flame" />
                        </span>
                        <span className="k4-pan-art">
                            <KitchenExtraArt id="stove_pan" />
                        </span>
                        <b>
                            {finished[index] ? "Served ✓" : `Pan ${index + 1}`}
                        </b>
                        <span className="k4-pan-meter">
                            <span className="k4-pan-perfect" />
                            <span className="k4-pan-fill" ref={element => {
                                bars.current[index] = element;
                            }} />
                        </span>
                    </button>
                ))}
            </div>
            <div className="k4-progress-row">
                <span>Tap each pan as its meter reaches the green zone</span>
                <strong>
                    {finished.filter(Boolean).length}/3 served</strong>
            </div>
        </div>
    );
}

const flavorNames = ["Sweet", "Salty", "Zesty"] as const;
const flavorArts = ["sweet_shaker", "salty_shaker", "zesty_shaker"] as const;
const flavorClues = ["None", "Light", "Balanced", "Bold", "Extra bold"] as const;

/*
 * DOCU: Render the seasoning game interface and provide its feature behavior.
 * @param {Omit<Props, "game">} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function SeasoningGame({ challenge, disabled, onComplete }: Omit<Props, "game">) {
    const [values, setValues] = useState([...challenge.seasoning.starting]);
    const [shaking, setShaking] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const targets = challenge.seasoning.targets;

        /*
     * DOCU: Adjust the current state for this feature.
     * @param {number} index - Position of the item in its collection
     * @param {number} change - change value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
function adjust(index: number, change: number) {
        if (disabled || submitted) {
            return;
        }
        setValues(current => current.map((value, position) =>
            position === index ? Math.min(4, Math.max(0, value + change)) : value
        ));
        setShaking(index);
    }

    return (
        <div className="k4-game">
            <div className="k4-seasoning-stage">
                <div className={`k4-seasoning-bowl ${shaking !== null ? "shaking" : ""}`}>
                    <KitchenExtraArt id="seasoning_bowl" />
                    <span>
                        <KitchenExtraArt id="seasoning_sparkle" />
                    </span>
                </div>
                <p>Match the flavor clues, then serve your mix.</p>
            </div>
            <div className="k4-seasoning-controls">
                {flavorNames.map((name, index) => (
                    <div className="k4-seasoning-row" key={name}>
                        <span className="k4-seasoning-icon">
                            <KitchenExtraArt id={flavorArts[index]} />
                        </span>
                        <span className="k4-seasoning-label">
                            <b>
                                {name}
                            </b>
                            <small>Clue: {flavorClues[targets[index]]}
                            </small>
                        </span>
                        <button type="button" aria-label={`Less ${name}`} disabled={disabled || submitted || values[index] === 0} onClick={() => adjust(index, -1)}>
                            <Minus size={16} />
                        </button>
                        <output aria-label={`${name} amount`}>
                            {values[index]}
                        </output>
                        <button type="button" aria-label={`More ${name}`} disabled={disabled || submitted || values[index] === 4} onClick={() => adjust(index, 1)}>
                            <Plus size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <button
                type="button"
                className="primary k4-seasoning-submit"
                disabled={disabled || submitted}
                onClick={() => {
                    setSubmitted(true);
                    onComplete(seasoningResult(values, targets));
                }}
            >
                <Sparkles size={17} /> Finish seasoning
            </button>
        </div>
    );
}

/*
 * DOCU: Render the kitchen extra game interface and provide its feature behavior.
 * @param {Props} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export default function KitchenExtraGame({ game, challenge, disabled, onComplete }: Props) {
    if (game === "roll") {
        return <RollingGame challenge={challenge} disabled={disabled} onComplete={onComplete} />;
    }
    if (game === "catch") {
        return <CatchGame challenge={challenge} disabled={disabled} onComplete={onComplete} />;
    }
    if (game === "stove") {
        return <StoveGame challenge={challenge} disabled={disabled} onComplete={onComplete} />;
    }
    return <SeasoningGame challenge={challenge} disabled={disabled} onComplete={onComplete} />;
}
