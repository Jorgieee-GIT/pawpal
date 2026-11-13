import "./KitchenBase.css";
import "./KitchenRevamp.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    BookOpen,
    Check,
    ChefHat,
    Clock3,
    CookingPot,
    FlaskConical,
    Heart,
    LockKeyhole,
    PackageOpen,
    Plus,
    Minus,
    Search,
    Sparkles,
    Star,
    UtensilsCrossed,
    X,
    CircleHelp
} from "lucide-react";
import SectionHeading from "../../SectionHeading";
import { kitchenMarkerPhase, kitchenMarkerScore } from "./KitchenTiming";
import { randomChallenge, type KitchenChallenge } from "./KitchenChallenges";
import { KitchenDirectionArt, KITCHEN_ARROW_DIRECTIONS } from "./KitchenDirectionArt";
import { rhythmKeyDirection, rhythmSwipeDirection } from "./KitchenGesture";
import { FoodArt, KitchenToolArt, KitchenPrepArt, KitchenEffectArt } from "./KitchenArt";
import KitchenExtraGame, { type ExtraKitchenGame } from "./KitchenExtraGames";
import { KitchenExtraArt } from "./KitchenExtraArt";
import { newExtraKitchenChallenge } from "./KitchenExtraChallenges";
import { KitchenRoom, KitchenStationDialog, type KitchenStation } from "./KitchenRoom";
export { FoodArt, FOOD_ART_IDS } from "./KitchenArt";

type Recipe = {
    name: string;
    ingredients: Record<string, number>;
    steps: string[];
    hunger: number;
    happiness: number;
    energy: number;
    xp: number;
    hint: string;
    tier: "starter" | "discovery";
    ingredientCount: number;
    discovered: boolean;
};
type RecipeRecord = {
    cooked: number;
    best: number
};
type KitchenState = {
    ingredients: Record<string, number>;
    meals: Record<string, number>;
    active_recipe: string | null;
    recipe_step: number;
    cooking_started_at: string | null;
    discovered_recipes: string[];
    recipe_records: Record<string, RecipeRecord>;
    step_scores: number[];
};
type KitchenResult = {
    recipeId: string;
    name: string;
    score: number;
    rating: string;
    firstTime: boolean
};
type Game = "chop" | "flip" | "bake" | "decorate" | "boil" | "pour" | "plate" | "rhythm" | "wash" | ExtraKitchenGame;
const stepNames: Record<string, string> = {
    wash: "Ingredient Washing",
    mix: "Rhythm Mixing",
    chill: "Perfect Pour",
    cook: "Pancake Flip",
    plate: "Plate Puzzle",
    chop: "Precision Chopping",
    simmer: "Boiling Point",
    serve: "Plate Puzzle",
    bake: "Perfect Baking",
    decorate: "Cake Decorating",
    roll: "Dough Rolling",
    catch: "Ingredient Catch",
    stove: "Stove Rush",
    season: "Seasoning Challenge"
};
const gameAssets: Record<Game, {
    tool: string;
    prep: string;
    effect: string;
    instruction: string
}> = {
    chop: {
        tool: "cutting_board",
        prep: "carrot_sliced",
        effect: "twinkle",
        instruction: "Tap CHOP as the marker enters the pink target. Land three cuts."
    },
    flip: {
        tool: "skillet",
        prep: "pancake_golden",
        effect: "twinkle",
        instruction: "Time your flip when the marker is in the golden zone."
    },
    bake: {
        tool: "oven",
        prep: "oven_baked",
        effect: "steam",
        instruction: "Adjust the oven toward this round’s target. The ideal range changes each time."
    },
    decorate: {
        tool: "frosting_bag",
        prep: "cake_frosted",
        effect: "frosting_drop",
        instruction: "Follow the frosting order shown below. It changes each round."
    },
    boil: {
        tool: "stove_pot",
        prep: "soup_simmer",
        effect: "bubbles",
        instruction: "Take the food off the heat at the ideal doneness."
    },
    pour: {
        tool: "measuring_cup",
        prep: "smoothie_poured",
        effect: "twinkle",
        instruction: "Hold POUR and release at this round’s marked fill line."
    },
    plate: {
        tool: "serving_plate",
        prep: "plated_meal",
        effect: "twinkle",
        instruction: "Follow the plating order shown below. It changes each round."
    },
    rhythm: {
        tool: "whisk",
        prep: "batter_bowl",
        effect: "flour_dust",
        instruction: "Follow the shuffled arrows: use your keyboard arrow keys or swipe anywhere on a touchscreen."
    },
    wash: {
        tool: "mixing_bowl",
        prep: "berries_washed",
        effect: "bubbles",
        instruction: "Follow the random rinse directions. Swipe anywhere on mobile, or use arrow keys."
    },
    roll: {
        tool: "cutting_board",
        prep: "batter_bowl",
        effect: "flour_dust",
        instruction: "Drag the rolling pin across the raised dough strips until each is smooth, or tap Roll lane."
    },
    catch: {
        tool: "mixing_bowl",
        prep: "berries_washed",
        effect: "twinkle",
        instruction: "Move the basket to catch fresh ingredients and avoid spoiled ones. Drag, touch, or use arrows."
    },
    stove: {
        tool: "skillet",
        prep: "pancake_golden",
        effect: "steam",
        instruction: "Watch three pans at once. Tap each pan when its bar enters the green cooking zone."
    },
    season: {
        tool: "mixing_bowl",
        prep: "soup_simmer",
        effect: "twinkle",
        instruction: "Use the clues to adjust Sweet, Salty and Zesty. The ideal balance changes each time."
    }
};
/*
 * DOCU: Handle game for step behavior for this feature.
 * @param {string} step - step value used by this function
 * @returns {Game} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function gameForStep(step: string): Game {
    if (step === "roll" || step === "catch" || step === "stove" || step === "season") {
        return step;
    }
    if (step === "chop") {
        return "chop";
    }
    if (step === "cook") {
        return "flip";
    }
    if (step === "bake") {
        return "bake";
    }
    if (step === "decorate") {
        return "decorate";
    }
    if (step === "simmer") {
        return "boil";
    }
    if (step === "chill") {
        return "pour";
    }
    if (step === "plate" || step === "serve") {
        return "plate";
    }
    if (step === "wash") {
        return "wash";
    }
    return "rhythm";
}
/*
 * DOCU: Format an identifier as a readable title.
 * @param {string} value - value value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
const titleCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());
/*
 * DOCU: Keep a numeric value within its allowed minimum and maximum.
 * @param {number} value - value value used by this function
 * @param {number} min - min value used by this function
 * @param {number} max - max value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
/*
 * DOCU: Format rating for this feature.
 * @param {number} score - score value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
const formatRating = (score: number) => score >= 90 ? "Perfect!" : score >= 75 ? "Great!" : score >= 50 ? "Good" : "Messy, but edible!";

/*
 * DOCU: Render the kitchen interface and provide its feature behavior.
 * @param {{
    token: string;
    api: string;
    onPetChange: () => Promise<void>;
    onToast: (message: string) => void
}} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export default function Kitchen({ token, api, onPetChange, onToast }: {
    token: string;
    api: string;
    onPetChange: () => Promise<void>;
    onToast: (message: string) => void
}) {
    const [kitchen, setKitchen] = useState<KitchenState | null>(null);
    const [recipes, setRecipes] = useState<Record<string, Recipe>>({});
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [mealPrices, setMealPrices] = useState<Record<string, number>>({});
    const [busy, setBusy] = useState(false);
    const [shelf, setShelf] = useState<KitchenStation | null>(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "discovered" | "mystery">("all");
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [selected, setSelected] = useState<string[]>([]);
    const [result, setResult] = useState<KitchenResult | null>(null);
    const [gameOpen, setGameOpen] = useState(false);
    const [guideOpen, setGuideOpen] = useState(false);
    const [extraChallenge, setExtraChallenge] = useState(newExtraKitchenChallenge);
    const [extraRound, setExtraRound] = useState(0);
    const [clock, setClock] = useState(0);
    const [challenge, setChallenge] = useState<KitchenChallenge>(() => randomChallenge());
    const [heat, setHeat] = useState(155);
    const [pourFill, setPourFill] = useState(0);
    const [pourHeld, setPourHeld] = useState(false);
    const [hits, setHits] = useState(0);
    const [mistakes, setMistakes] = useState(0);
    const [feedback, setFeedback] = useState("");
    const gameStarted = useRef(Date.now());
    // The timing marker is animated at the browser's refresh rate, independently
    // of the 100 ms gameplay timer. Input is scored from the exact current phase.
    const timingStarted = useRef(0);
    const timingPointer = useRef<HTMLDivElement | null>(null);
    const hitCount = useRef(0);
    const mistakeCount = useRef(0);
    const totalTimingScore = useRef(0);
    const pending = useRef(false);
    const holdRef = useRef(false);
    const pourRef = useRef(0);
    const heatRef = useRef(155);
    const inZoneTicks = useRef(0);
    const gameTick = useRef(0);
    const finishTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const load = useCallback(async () => {
        try {
            const response = await fetch(api + "/api/kitchen", {
                headers: {
                    Authorization: "Bearer " + token
                }
            });
            const data = await response.json();
            if (!response.ok) {
                throw Error(data.error || "Unable to load Kitchen.");
            }
            setKitchen(data.kitchen);
            setRecipes(data.recipes || {});
            setPrices(data.prices || {});
            setMealPrices(data.mealPrices || {});
        } catch (error) {
            onToast(error instanceof Error ? error.message : "Kitchen unavailable.");
        }
    }, [api, token, onToast]);
    useEffect(() => {
        void load();
    }, [load]);
    useEffect(() => () => {
        if (finishTimeout.current) {
            clearTimeout(finishTimeout.current);

        }
    }, []);

    const active = kitchen?.active_recipe || null;
    const current = active ? recipes[active] : null;
    const step = current?.steps[kitchen?.recipe_step || 0] || "mix";
    const game: Game = gameForStep(step);
    const assets = gameAssets[game];
        /*
     * DOCU: Handle timing phase behavior for this feature.
     * @param {number} at - at value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const timingPhase = (at: number) => {
        const duration = game === "flip" ? challenge.flipSpeed : game === "boil" ? challenge.boilSpeed : challenge.chopSpeed;
        const elapsed = Math.max(0, at - timingStarted.current);
        return kitchenMarkerPhase(elapsed, duration);
    };
        /*
     * DOCU: Handle progress score behavior for this feature.
     * @param {number} target - target value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const progressScore = (target: number) => {
        // Read the same time source used to draw the marker rather than a stale
        // React render (which previously lagged a tap by up to 100 ms).
        const phase = timingPhase(performance.now());
        return kitchenMarkerScore(phase, target);
    };
    const pantryCount = Object.values(kitchen?.meals || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);

        /*
     * DOCU: Reset local cooking game state before a new step begins.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
function resetGame() {
        gameStarted.current = Date.now();
        timingStarted.current = performance.now();
        gameTick.current = 0;
        hitCount.current = 0;
        mistakeCount.current = 0;
        totalTimingScore.current = 0;
        inZoneTicks.current = 0;
        holdRef.current = false;
        pourRef.current = 0;
        const next = randomChallenge(challenge);
        setExtraChallenge(previous => newExtraKitchenChallenge(previous));
        setExtraRound(previous => previous + 1);
        setChallenge(next);
        heatRef.current = next.ovenStart;
        setClock(0);
        setHeat(next.ovenStart);
        setPourFill(0);
        setPourHeld(false);
        setHits(0);
        setMistakes(0);
        setFeedback("");
        // Generate a new target or pattern for every preparation step and replay.
        pending.current = false;
    }

        /*
     * DOCU: Send a kitchen action to the server and apply the returned kitchen state.
     * @param {string} action - action value used by this function
     * @param {string} item - Item being handled
     * @param {unknown} quantity - quantity value used by this function
     * @param {Record<string, unknown>} extras - extras value used by this function
     * @throws {Error} - Propagates an error when this operation cannot complete.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
async function act(action: string, item: string, quantity = 1, extras: Record<string, unknown> = {}) {
        if (busy) {
            return;
        }
        setBusy(true);
        try {
            const response = await fetch(api + "/api/kitchen", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                },
                body: JSON.stringify({
                    action,
                    item,
                    quantity,
                    ...extras
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw Error(data.error || "Kitchen action failed.");
            }
            setKitchen(data.kitchen);
            if (data.recipes) {
                setRecipes(data.recipes);
            }
            if (data.result) {
                setResult(data.result);
            }
            onToast(data.message);
            if (action === "experiment" && data.result) {
                setSelected([]);
                setShelf("recipes");
            }
            if (action === "start") {
                resetGame();
                setGameOpen(true);
            }
            if (action === "step") {
                if (data.kitchen.active_recipe) {
                    resetGame();
                } else {
                    setGameOpen(false);
                }
            }
            await onPetChange();
        } catch (error) {
            pending.current = false;
            if (action === "step") {
                resetGame();
            }
            setFeedback(error instanceof Error ? error.message : "Please try again.");
            onToast(error instanceof Error ? error.message : "Kitchen action failed.");
        } finally {
            setBusy(false);
        }
    }

        /*
     * DOCU: Submit the cooking score and advance or finish the recipe step.
     * @param {number} score - score value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
function finishStep(score: number) {
        if (pending.current || busy || !active || !gameOpen) {
            return;
        }
        pending.current = true;
        const elapsed = Date.now() - gameStarted.current;
                /*
         * DOCU: Submit the current state for this feature.
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const submit = () => {
            void act("step", step, 1, {
                score: clamp(Math.round(score), 0, 100)
            });
        };
        // Give the server its minimum genuine play interval. Cosmetic scores never award coins.
        if (elapsed < 2350) {
            setFeedback("Finishing touches…");
            finishTimeout.current = setTimeout(submit, 2350 - elapsed);
        } else {
            submit();
        }
    }

    useEffect(() => {
        if (!active || !gameOpen || !["chop", "flip", "boil"].includes(game)) {
            return;
        }
        let frame = 0;
        const pointer = timingPointer.current;
        const track = pointer?.parentElement;
        let travel = track && pointer ? Math.max(0, track.clientWidth - pointer.offsetWidth) : 0;
        const observer = track && typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(() => {
                travel = pointer ? Math.max(0, track.clientWidth - pointer.offsetWidth) : 0;
            }) : null;
        if (track) {
            observer?.observe(track);
        }
                /*
         * DOCU: Animate the current state for this feature.
         * @param {number} now - now value used by this function
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const animate = (now: number) => {
            // Transform is composited on the GPU; no layout or React re-render
            // is needed for each animation frame, even on slower phones.
            if (pointer && !pending.current && !busy) {
                pointer.style.transform = `translate3d(${timingPhase(now) / 100 * travel}px, 0, 0)`;
            }
            if (!pending.current && !busy) {
                frame = requestAnimationFrame(animate);
            }
        };
        frame = requestAnimationFrame(animate);
        return () => {
            cancelAnimationFrame(frame);
            observer?.disconnect();
        };
    }, [active, gameOpen, game, busy, kitchen?.recipe_step]);

    useEffect(() => {
        if (!active || !gameOpen || busy || pending.current) {
            return;
        }
        const timer = window.setInterval(() => {
            const elapsed = Date.now() - gameStarted.current;
            if (game === "bake") {
                setClock(elapsed);
            }
            if (game === "flip" && elapsed >= 1800) {
                setClock(previous => previous < 1800 ? elapsed : previous);
            }
            gameTick.current++;
            if (game === "pour" && holdRef.current) {
                pourRef.current = clamp(pourRef.current + 2.3, 0, 100);
                setPourFill(pourRef.current);
            }
            if (game === "bake" && elapsed >= 2200) {
                if (Math.abs(heatRef.current - challenge.ovenTarget) <= 10) {
                    inZoneTicks.current++;
                }
                if (elapsed >= 7200) {
                    const baked = Math.round(45 + 55 * inZoneTicks.current / Math.max(1, gameTick.current - 22));
                    finishStep(baked);
                }
            }
        }, 100);
        return () => clearInterval(timer);
    }, [active, gameOpen, busy, game, kitchen?.recipe_step]);

        /*
     * DOCU: Handle hit behavior for this feature.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
function hit() {
        if (busy || pending.current) {
            return;
        }
        const score = progressScore(challenge.chopTargets[Math.min(hitCount.current, 2)]);
        hitCount.current++;
        totalTimingScore.current += score;
        setHits(hitCount.current);
        setFeedback(score >= 88 ? "Perfect timing!" : score >= 65 ? "Nice!" : "A little off, keep going!");
        if (hitCount.current >= 3) {
            finishStep(clamp(totalTimingScore.current / 3 - mistakeCount.current * 3, 40, 100));
        }
    }
        /*
     * DOCU: Tap sequence for this feature.
     * @param {number} index - Position of the item in its collection
     * @param {number[]} expected - expected value used by this function
     * @param {string} label - label value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
function tapSequence(index: number, expected: number[], label: string) {
        if (busy || pending.current) {
            return;
        }
        if (index !== expected[hitCount.current]) {
            mistakeCount.current++;
            setMistakes(mistakeCount.current);
            setFeedback("Not quite — check the order above!");
            return;
        }
        hitCount.current++;
        setHits(hitCount.current);
        setFeedback(`${label} ${hitCount.current}/${expected.length} ✓`);
        if (hitCount.current >= expected.length) {
            finishStep(clamp(100 - mistakeCount.current * 12, 50, 100));
        }
    }
    // Listen across the full window so both Rhythm Mixing and Washing accept
    // swipes outside the modal. Listeners are removed when the step closes.
    useEffect(() => {
        if (!active || !gameOpen || (game !== "rhythm" && game !== "wash") || busy) {
            return;
        }
        let touchStart: {
            identifier: number;
            x: number;
            y: number
        } | null = null;
        const expected = game === "rhythm" ? challenge.rhythm : challenge.wash;
        const label = game === "rhythm" ? "Whisk" : "Rinse";

                /*
         * DOCU: Handle on key down behavior for this feature.
         * @param {KeyboardEvent} event - User or browser event that triggered this operation
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const onKeyDown = (event: KeyboardEvent) => {
            const direction = rhythmKeyDirection(event.key);
            if (direction === null) {
                return;
            }
            event.preventDefault(); // Arrow keys should not scroll the game underneath.
            if (event.repeat || pending.current) {
                return;
            }
            tapSequence(direction, expected, label);
        };
                /*
         * DOCU: Handle on touch start behavior for this feature.
         * @param {TouchEvent} event - User or browser event that triggered this operation
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const onTouchStart = (event: TouchEvent) => {
            if (event.touches.length !== 1 || pending.current) {
                touchStart = null;
                return;
            }
            const touch = event.touches[0];
            touchStart = {
                identifier: touch.identifier,
                x: touch.clientX,
                y: touch.clientY
            };
        };
                /*
         * DOCU: Handle on touch move behavior for this feature.
         * @param {TouchEvent} event - User or browser event that triggered this operation
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const onTouchMove = (event: TouchEvent) => {
            if (!touchStart || pending.current) {
                return;
            }
            const touch = Array.from(event.touches).find(item => item.identifier === touchStart?.identifier);
            if (!touch) {
                return;
            }
            // Stop browser scrolling only when the gesture is becoming a swipe.
            if (Math.hypot(touch.clientX - touchStart.x, touch.clientY - touchStart.y) > 12 && event.cancelable) {
                event.preventDefault();
            }
        };
                /*
         * DOCU: Handle on touch end behavior for this feature.
         * @param {TouchEvent} event - User or browser event that triggered this operation
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const onTouchEnd = (event: TouchEvent) => {
            if (!touchStart || pending.current) {
                touchStart = null;
                return;
            }
            const touch = Array.from(event.changedTouches).find(item => item.identifier === touchStart?.identifier);
            if (!touch) {
                return;
            }
            const direction = rhythmSwipeDirection(touch.clientX - touchStart.x, touch.clientY - touchStart.y);
            touchStart = null;
            if (direction !== null) {
                if (event.cancelable) {
                    event.preventDefault();
                }
                tapSequence(direction, expected, label);
            }
        };
                /*
         * DOCU: Handle on touch cancel behavior for this feature.
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const onTouchCancel = () => {
            touchStart = null;
        };

        window.addEventListener("keydown", onKeyDown, true);
        window.addEventListener("touchstart", onTouchStart, {
            passive: true
        });
        window.addEventListener("touchmove", onTouchMove, {
            passive: false
        });
        window.addEventListener("touchend", onTouchEnd, {
            passive: false
        });
        window.addEventListener("touchcancel", onTouchCancel);
        return () => {
            window.removeEventListener("keydown", onKeyDown, true);
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onTouchEnd);
            window.removeEventListener("touchcancel", onTouchCancel);
        };
    }, [active, gameOpen, game, busy, challenge.rhythm, challenge.wash, kitchen?.recipe_step]);

        /*
     * DOCU: Handle release pour behavior for this feature.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
function releasePour() {
        if (!holdRef.current || busy || pending.current) {
            return;
        }
        holdRef.current = false;
        setPourHeld(false);
        const distance = Math.abs(pourRef.current - challenge.pourTarget);
        if (pourRef.current < challenge.pourTarget - 30) {
            setFeedback("A little more! Hold POUR longer and try again.");
            pourRef.current = 0;
            setPourFill(0);
            return;
        }
        setFeedback(distance <= 9 ? "Perfect pour!" : "Nice try!");
        finishStep(clamp(100 - distance * 1.3, 45, 100));
    }
        /*
     * DOCU: Change heat for this feature.
     * @param {number} delta - delta value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
function changeHeat(delta: number) {
        heatRef.current = clamp(heatRef.current + delta, 110, 240);
        setHeat(heatRef.current);
    }

    return <section className="panel paw-kitchen kitchen-revamp">
        <div className="eyebrow">PAWPAL COOKING CLUB</div>
        <div className="k4-title-row">
            <SectionHeading title="Kitchen" Icon={CookingPot} />
            <button type="button" className="k4-info-button" onClick={() => setGuideOpen(true)}>
                <CircleHelp size={18} /> Info
            </button>
        </div>
        {active && current && <div className="k3-active-bar">
            <div className="k3-active-art">
                <FoodArt id={active} />
            </div>
            <div>
                <b>
                    {current.name} is in progress</b>
                <small>Step {(kitchen?.recipe_step || 0) + 1} of {current.steps.length} · {stepNames[step]}
                </small>
            </div>
            <button className="primary" type="button" onClick={() => {
                resetGame();
                setGameOpen(true)
            }}>Continue cooking</button>
        </div>}
        <KitchenRoom onOpen={setShelf} pantryCount={pantryCount} />

        {shelf && !gameOpen && !result && !guideOpen &&
        <KitchenStationDialog station={shelf} onDismiss={() => setShelf(null)}>
        {shelf === "recipes" && <>
            <div className="k3-filters">
                <div className="k3-search">
                    <Search size={17} />
                    <input aria-label="Search recipes" placeholder="Search recipes" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="k3-filter-buttons">
                    {([["all", "All"], ["discovered", "Known"], ["mystery", "Mystery"]] as const).map(([id, label]) => <button type="button" className={filter === id ? "active" : ""} key={id} onClick={() => setFilter(id)}>
                        {label}
                    </button>)}
                </div>
            </div>
            <div className="k3-recipe-grid">
                {Object.entries(recipes).filter(([, r]) => (filter === "all" || (filter === "discovered" ? r.discovered : !r.discovered)) && (r.discovered ? (r.name + " " + r.hint).toLowerCase().includes(search.toLowerCase()) : ("mystery " + r.hint).toLowerCase().includes(search.toLowerCase()))).map(([id, recipe]) => <article className={"k3-recipe " + (!recipe.discovered ? "locked" : "")} key={id}>
                    <div className="k3-recipe-art">
                        {recipe.discovered ? <FoodArt id={id} /> : <>
                            <div className="k3-mystery-silhouette">
                                <FoodArt id={id} />
                            </div>
                            <LockKeyhole className="k3-recipe-lock" size={21} />
                        </>}
                    </div>
                    <div className="k3-recipe-details">
                        <div className="k3-title-row">
                            <b>
                                {recipe.discovered ? recipe.name : "??? Mystery Recipe"}
                            </b>
                            {recipe.tier === "starter" && <small className="k3-starter-chip">Starter</small>}
                        </div>
                        {recipe.discovered ? <>
                            <div className="k3-ingredients-list">
                                {Object.entries(recipe.ingredients).map(([ingredient, needed]) => <span key={ingredient} className={(kitchen?.ingredients[ingredient] || 0) >= needed ? "available" : "missing"} title={`${titleCase(ingredient)}: ${kitchen?.ingredients[ingredient] || 0}/${needed}`}>
                                    <span>
                                        <FoodArt id={ingredient} />
                                    </span>
                                    {titleCase(ingredient)} {kitchen?.ingredients[ingredient] || 0}/{needed}
                                </span>)}
                            </div>
                            <div className="k3-benefits">
                                {recipe.hunger > 0 && <span>
                                    <Heart size={12} /> +{recipe.hunger} Fullness</span>}
                                {recipe.happiness > 0 && <span>+{recipe.happiness} Happy</span>}
                                {recipe.energy > 0 && <span>+{recipe.energy} Energy</span>}
                            </div>
                        </> : <div className="k3-clue">
                            <Sparkles size={14} />
                            <span>
                                {recipe.hint}
                            </span>
                            <small>
                                {recipe.ingredientCount} ingredient types</small>
                        </div>}
                        {recipe.discovered && <small className="k3-record">Cooked {kitchen?.recipe_records?.[id]?.cooked || 0} times{(kitchen?.recipe_records?.[id]?.cooked || 0) > 0 && ` · Best ${kitchen?.recipe_records?.[id]?.best || 0}/100`}
                        </small>}
                        <div className="k3-recipe-buttons">
                            {recipe.discovered ? <>
                                <button type="button" className="primary" disabled={busy || !!active || !kitchen || Object.entries(recipe.ingredients).some(([ing, n]) => (kitchen.ingredients[ing] || 0) < n)} onClick={() => void act("start", id)}>
                                    <ChefHat size={15} /> Cook</button>
                                <button type="button" className="secondary" disabled={busy} onClick={() => void act("buy_meal", id)}>Buy · {(mealPrices[id] || 0).toLocaleString()}
                                </button>
                            </> : <button className="secondary" type="button" onClick={() => setShelf("experiment")}>
                                <FlaskConical size={15} /> Try to discover</button>}
                        </div>
                    </div>
                </article>)}
            </div>
        </>}

        {shelf === "experiment" && <>
            <div className="k3-experiment-layout">
                <div className="k3-experiment-bench">
                    <div className="k3-bench-art">
                        <KitchenToolArt id="mixing_bowl" />
                        <KitchenEffectArt id="twinkle" />
                    </div>
                    <h4>Your mixing bowl</h4>
                    <div className="k3-selected">
                        {selected.length ? selected.map(id => <button type="button" key={id} title={`Remove ${id}`} onClick={() => setSelected(p => p.filter(i => i !== id))}>
                            <FoodArt id={id} />
                            <span>
                                {titleCase(id)}
                            </span>
                            <X size={13} />
                        </button>) : <p>Choose ingredients from below to begin.</p>}
                    </div>
                    <p className="k3-experiment-disclaimer">A new match uses one of each selected ingredient. An unsuccessful mix uses only one ingredient. A known recipe uses none.</p>
                    <button
                        type="button"
                        className="primary k3-experiment-action"
                        disabled={busy || !!active || selected.length < 2}
                        onClick={() => void act("experiment", "", 1, {
                            ingredients: selected
                        })}
                    >
                        <FlaskConical size={17} /> Experiment with {selected.length} ingredients</button>
                    <div className="k3-experiment-small-actions">
                        <button type="button" className="secondary" onClick={() => setSelected([])}>Clear bowl</button>
                        <button type="button" className="secondary" onClick={() => setShelf("ingredients")}>Get ingredients</button>
                    </div>
                </div>
                <div className="k3-experiment-pantry">
                    <h4>Pick your ingredients</h4>
                    <div className="k3-ingredient-choices">
                        {Object.keys(prices).map(id => <button type="button" key={id} aria-pressed={selected.includes(id)} className={selected.includes(id) ? "selected" : ""} disabled={busy || ((kitchen?.ingredients[id] || 0) < 1 && !selected.includes(id)) || (!selected.includes(id) && selected.length >= 4)} onClick={() => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])}>
                            <span className="k3-choice-art">
                                <FoodArt id={id} />
                            </span>
                            <b>
                                {titleCase(id)}
                            </b>
                            <small>Owned {kitchen?.ingredients[id] || 0}
                            </small>
                            {selected.includes(id) && <Check className="k3-choice-check" size={15} />}
                        </button>)}
                    </div>
                </div>
            </div>
            <h4 className="k3-hint-title">
                <BookOpen size={17} /> Mystery recipe clues</h4>
            <div className="k3-hints">
                {Object.entries(recipes).filter(([, r]) => !r.discovered).map(([id, r]) => <div key={id}>
                    <LockKeyhole size={15} />
                    <p>
                        {r.hint}
                    </p>
                    <small>
                        {r.ingredientCount} ingredient types</small>
                </div>)}
            </div>
        </>}

        {shelf === "ingredients" && <>
            <div className="k3-market-grid">
                {Object.entries(prices).map(([id, price]) => <article className="k3-market-card" key={id}>
                    <div className="k3-market-art">
                        <FoodArt id={id} />
                    </div>
                    <div className="k3-market-copy">
                        <b>
                            {titleCase(id)}
                        </b>
                        <small>Owned: {kitchen?.ingredients[id] || 0}
                        </small>
                        <span>
                            {price} coins each</span>
                    </div>
                    <div className="k3-market-buy">
                        <div className="k3-qty">
                            <button
                                type="button"
                                aria-label={`Decrease ${id}`}
                                onClick={() => setQuantities(q => ({
                                    ...q,
                                    [id]: Math.max(1, (q[id] || 1) - 1)
                                }))}
                            >
                                <Minus size={13} />
                            </button>
                            <span>
                                {quantities[id] || 1}
                            </span>
                            <button
                                type="button"
                                aria-label={`Increase ${id}`}
                                onClick={() => setQuantities(q => ({
                                    ...q,
                                    [id]: Math.min(20, (q[id] || 1) + 1)
                                }))}
                            >
                                <Plus size={13} />
                            </button>
                        </div>
                        <button type="button" className="primary" disabled={busy} onClick={() => void act("buy", id, quantities[id] || 1)}>Buy · {price * (quantities[id] || 1)}
                        </button>
                    </div>
                </article>)}
            </div>
        </>}

        {shelf === "pantry" && <>
            <div className="k3-pantry-grid">
                {Object.entries(kitchen?.meals || {}).filter(([, quantity]) => quantity > 0).map(([id, quantity]) => <article className="k3-pantry-card" key={id}>
                    <div className="k3-pantry-art">
                        <FoodArt id={id} />
                    </div>
                    <div>
                        <b>
                            {recipes[id]?.discovered ? recipes[id].name : titleCase(id)}
                        </b>
                        <small>
                            {quantity} ready · +{recipes[id]?.xp || 0} XP when served</small>
                    </div>
                    <button className="primary" type="button" disabled={busy} onClick={() => void act("serve", id)}>
                        <UtensilsCrossed size={15} /> Serve</button>
                </article>)}
            </div>
            {pantryCount === 0 && <div className="k3-empty">
                <PackageOpen size={27} />
                <h4>Your pantry is empty</h4>
                <p>Cook a meal or buy a ready-made one from your Recipe Book.</p>
                <button type="button" className="secondary" onClick={() => setShelf("recipes")}>Browse recipes</button>
            </div>}
        </>}
        </KitchenStationDialog>}

        {active && current && gameOpen && <div className="kitchen-game-overlay" onMouseDown={event => {if (game !== "rhythm" && game !== "wash" && event.target ===event.currentTarget) {setGameOpen(false)}}}>
            <div className="kitchen-game-modal k3-game-modal" role="dialog" aria-modal="true" aria-label={`Cooking ${current.name}`}>
                <div className="kitchen-game-head">
                    <div className="kitchen-game-art">
                        <FoodArt id={active} />
                    </div>
                    <div>
                        <small>NOW COOKING</small>
                        <h3>
                            {current.name}
                        </h3>
                        <p>Step {(kitchen?.recipe_step || 0) + 1} of {current.steps.length} · {stepNames[step]}
                        </p>
                    </div>
                    <button className="kitchen-game-close paw-modal-close" aria-label="Close cooking game" type="button" onClick={() => setGameOpen(false)}>
                        <X size={20} />
                    </button>
                </div>
                <div className="kitchen-game-steps">
                    {current.steps.map((name, i) => <span key={i} title={stepNames[name] || name} className={i < (kitchen?.recipe_step || 0) ? "done" : i === (kitchen?.recipe_step || 0) ? "current" : ""}>
                        {i + 1}
                    </span>)}
                </div>
                <p className="kitchen-game-instructions">
                    {assets.instruction}
                </p>
                {["roll", "catch", "stove", "season"].includes(game) ? (
                    <KitchenExtraGame
                        key={`${active}-${kitchen?.recipe_step}-${extraRound}`}
                        game={game as ExtraKitchenGame}
                        challenge={extraChallenge}
                        disabled={busy || pending.current}
                        onComplete={finishStep}
                    />
                ) : <>
                    <div className={`k3-game-stage k3-game-${game}`}>
                        <div className="k3-game-prop">
                            <KitchenToolArt id={assets.tool} />
                            {game === "chop" && <span className="k3-chopping-knife">
                                <KitchenToolArt id="knife" />
                            </span>}
                        </div>
                        <div className="k3-game-food">
                            <KitchenPrepArt id={game === "flip" && clock < 1800 ? "pancake_raw" : game === "bake" && clock < 3500 ? "oven_raw" : assets.prep} />
                        </div>
                        <div className="k3-game-effect">
                            <KitchenEffectArt id={assets.effect} />
                        </div>
                        {["chop", "flip", "boil"].includes(game) && <div className="k3-timing">
                            <div className="k3-timing-zone" style={{
                                left: `${(game === "chop" ? challenge.chopTargets[Math.min(hits, 2)] : game === "flip" ? challenge.flipTarget : challenge.boilTarget) - 10}%`
                            }} />
                            <div className="k3-timing-pointer" ref={timingPointer} />
                        </div>}
                        {game === "bake" && <div className="k3-oven-status">
                            <span>
                                {heat}°C</span>
                            <small>Ideal: {challenge.ovenTarget - 10}–{challenge.ovenTarget + 10}°C</small>
                            <div className="k3-oven-track">
                                <div className="k3-oven-ideal" style={{
                                    left: `${(challenge.ovenTarget - 10 - 110) / 130 * 100}%`,
                                    width: `${20 / 130 * 100}%`
                                }} />
                                <div className="k3-oven-fill" style={{
                                    width: `${clamp((heat - 110) / 130 * 100, 0, 100)}%`
                                }} />
                            </div>
                            <small>
                                {Math.max(0, Math.ceil((7200 - clock) / 1000))}s remaining</small>
                        </div>}
                        {game === "pour" && <>
                            <span className="k3-pour-readout">Target {challenge.pourTarget}%</span>
                            <div className="k3-pour-track">
                                <div className="k3-pour-target" style={{
                                    top: `${100 - challenge.pourTarget}%`
                                }} />
                                <div style={{
                                    height: `${pourFill}%`
                                }} />
                            </div>
                        </>}
                        {(game === "decorate" || game === "plate") && <div className="k3-stage-sequence">
                            <span>Next: {hits >= 3 ? "All set!" : (game === "decorate" ? challenge.decorate : challenge.plate)[hits] + 1}
                            </span>
                            <span>
                                {hits}/3 placed</span>
                        </div>}
                    </div>
                    <div className="k3-game-actions">
                        {game === "chop" && <>
                            <button type="button" className="primary" disabled={busy || pending.current} onClick={hit}>Chop! <span>
                                {hits}/3</span>
                            </button>
                        </>}
                        {game === "flip" && <button type="button" className="primary" disabled={busy || pending.current} onClick={() => finishStep(progressScore(challenge.flipTarget))}>Flip pancake!</button>}
                        {game === "boil" && <button type="button" className="primary" disabled={busy || pending.current} onClick={() => finishStep(progressScore(challenge.boilTarget))}>Remove from heat!</button>}
                        {game === "bake" && <div className="k3-bake-controls">
                            <button type="button" aria-label="Decrease oven temperature" onClick={() => changeHeat(-5)}>
                                <Minus size={17} /> Cooler</button>
                            <button type="button" aria-label="Increase oven temperature" onClick={() => changeHeat(5)}>
                                <Plus size={17} /> Hotter</button>
                        </div>}
                        {game === "pour" && <button
                            type="button"
                            className={"primary k3-pour-button " + (pourHeld ? "holding" : "")}
                            onPointerDown={e => {
                                e.currentTarget.setPointerCapture(e.pointerId);
                                holdRef.current = true;
                                setPourHeld(true);
                            }}
                            onPointerUp={releasePour}
                            onPointerCancel={releasePour}
                            onKeyDown={e => {
                                if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                                    e.preventDefault();
                                    holdRef.current = true;
                                    setPourHeld(true);
                                }
                            }}
                            onKeyUp={e => {
                                if (e.key === " " || e.key === "Enter") {
                                    e.preventDefault();
                                    releasePour();
                                }
                            }}
                            disabled={busy || pending.current}
                        >
                            {pourHeld ? "Release at the line" : "Hold to pour"} · {Math.round(pourFill)}%</button>}
                        {game === "decorate" && <div className="k3-order-controls">
                            <p>Frosting order: {challenge.decorate.map(number => number + 1).join(" → ")}
                            </p>
                            <div>
                                {["Rose", "Star", "Heart"].map((label, i) => <button type="button" key={i} disabled={busy || pending.current} onClick={() => tapSequence(i, challenge.decorate, "Frosting")}>
                                    <KitchenEffectArt id={i === 1 ? "twinkle" : i === 2 ? "frosting_drop" : "flour_dust"} />
                                    <span>
                                        {i + 1}. {label}
                                    </span>
                                </button>)}
                            </div>
                        </div>}
                        {game === "plate" && <div className="k3-order-controls">
                            <p>Plating order: {challenge.plate.map(number => number + 1).join(" → ")}
                            </p>
                            <div>
                                {["Main", "Garnish", "Side"].map((label, i) => <button type="button" key={i} disabled={busy || pending.current} onClick={() => tapSequence(i, challenge.plate, "Plating")}>
                                    <KitchenPrepArt id={i === 0 ? "pancake_golden" : i === 1 ? "carrot_sliced" : "tomato_sliced"} />
                                    <span>
                                        {i + 1}. {label}
                                    </span>
                                </button>)}
                            </div>
                        </div>}
                        {game === "rhythm" && <div className="k3-rhythm" aria-label="Rhythm mixing arrow sequence">
                            <div className="k3-rhythm-sequence" aria-live="off">
                                {challenge.rhythm.map((index, i) => <span key={i} className={"k3-rhythm-arrow " + (i < hits ? "completed" : i === hits ? "next" : "")} aria-label={`${i + 1}: ${KITCHEN_ARROW_DIRECTIONS[index]}`}>
                                    <KitchenDirectionArt direction={index} />
                                </span>)}
                            </div>
                            <p className="k3-rhythm-desktop-hint">Use your keyboard arrow keys · {hits}/{challenge.rhythm.length}
                            </p>
                            <p className="k3-rhythm-touch-hint">Swipe anywhere on the screen · {hits}/{challenge.rhythm.length}
                            </p>
                        </div>}
                        {game === "wash" && <div className="k3-wash-pattern">
                            <div className="k3-rhythm-sequence" aria-label="Random rinse direction sequence">
                                {challenge.wash.map((index, i) => <span key={i} className={"k3-rhythm-arrow " + (i < hits ? "completed" : i === hits ? "next" : "")} aria-label={`${i + 1}: ${KITCHEN_ARROW_DIRECTIONS[index]}`}>
                                    <KitchenDirectionArt direction={index} />
                                </span>)}
                            </div>
                            <p className="k3-rhythm-desktop-hint">Use arrow keys to rinse · {hits}/{challenge.wash.length}
                            </p>
                            <p className="k3-rhythm-touch-hint">Swipe anywhere to rinse · {hits}/{challenge.wash.length}
                            </p>
                            <div className="k3-wash-fallback" aria-label="On-screen rinse direction buttons">
                                {[0, 1, 2, 3].map(index => <button type="button" key={index} aria-label={`Rinse ${KITCHEN_ARROW_DIRECTIONS[index]}`} disabled={busy || pending.current} onClick={() => tapSequence(index, challenge.wash, "Rinse")}>
                                    <KitchenDirectionArt direction={index} />
                                </button>)}
                            </div>
                        </div>}
                    </div>
                </>}
                <div className="k3-game-bottom">
                    <span className="k3-feedback" aria-live="polite">
                        {feedback || (game === "bake" ? "Adjust the oven using the buttons." : "Take your time and enjoy cooking!")}
                    </span>
                    {mistakes > 0 && <span className="k3-mistakes">
                        {mistakes} retries</span>}
                </div>
            </div>
        </div>}
        {guideOpen && (
            <div className="kitchen-game-overlay" onMouseDown={event => {if (event.target ===event.currentTarget) {setGuideOpen(false);}}}>
                <section className="k4-info-modal" role="dialog" aria-modal="true" aria-label="Kitchen minigame information">
                    <header className="k4-info-heading">
                        <div>
                            <h2>How to play each minigame</h2>
                            <p className="paw-modal-subtitle">Cooking club guide</p>
                        </div>
                        <button type="button" aria-label="Close Kitchen guide" onClick={() => setGuideOpen(false)}>
                            <X size={20} />
                        </button>
                    </header>
                    <div className="k4-info-list">
                        {([
                            [
                                "chop",
                                "Precision Chopping",
                                "Tap Chop when the moving marker crosses the changing target. Land three cuts."
                            ],
                            ["flip", "Pancake Flip", "Tap Flip as the marker enters the randomly placed golden zone."],
                            ["bake", "Perfect Baking", "Adjust the oven toward the changing ideal temperature. Keep it within ±10°C."],
                            ["decorate", "Cake Decorating", "Tap Rose, Star and Heart in the displayed randomized order."],
                            ["boil", "Boiling Point", "Remove from heat when the sliding marker reaches the target."],
                            ["pour", "Perfect Pour", "Hold to pour and release near the changing marked fill level."],
                            ["plate", "Plate Puzzle", "Tap Main, Garnish and Side in the displayed randomized order."],
                            [
                                "rhythm",
                                "Rhythm Mixing",
                                "Use arrow keys on desktop or swipe anywhere on mobile to match the shuffled arrows."
                            ],
                            ["wash", "Ingredient Washing", "Follow the changing rinse directions with arrow keys or swipes anywhere."],
                            ["roll", "Dough Rolling", "Drag the rolling pin across the four uneven strips until all dough is smooth."],
                            ["catch", "Ingredient Catch", "Move the basket to catch fresh ingredients and avoid the spoiled ones."],
                            ["stove", "Stove Rush", "Watch three animated pans and tap each one when its progress reaches green."],
                            ["season", "Seasoning Challenge", "Adjust three flavor levels to match the new clues, then serve your mix."]
                        ] as const).map(([id, title, description]) => (
                            <article className="k4-info-item" key={id}>
                                <div className="k4-info-art">
                                    {id === "roll" ? <KitchenExtraArt id="rolling_pin" /> :
                                        id === "catch" ? <KitchenExtraArt id="catch_basket" /> :
                                            id === "stove" ? <KitchenExtraArt id="stove_pan" /> :
                                                id === "season" ? <KitchenExtraArt id="seasoning_bowl" /> :
                                                    <KitchenToolArt id={gameAssets[id].tool} />}
                                </div>
                                <div>
                                    <b>
                                        {title}
                                    </b>
                                    <p>
                                        {description}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                    <p className="k4-info-note">Every round generates a fresh challenge. All completed meals are edible regardless of cooking quality.</p>
                </section>
            </div>
        )}
        {result && <div className="kitchen-game-overlay">
            <div className="k3-result" role="dialog" aria-modal="true" aria-label="Kitchen result">
                <div className="paw-modal-top paw-kitchen-result-header">
                    <div>
                        <h2>Cooking result</h2>
                        <p className="paw-modal-subtitle">A little something for your companion</p>
                    </div>
                    <button type="button" className="kitchen-game-close paw-modal-close" aria-label="Close result" onClick={() => setResult(null)}>
                        <X size={20} />
                    </button>
                </div>
                <div className="k3-result-art">
                    <FoodArt id={result.recipeId} />
                    <div className="k3-result-sparkle">
                        <KitchenEffectArt id="twinkle" />
                    </div>
                </div>
                <small>
                    <Sparkles size={15} /> {result.rating === "Discovery" ? "NEW RECIPE DISCOVERED" : "COOKING COMPLETE"}
                </small>
                <h2>
                    {result.name}
                </h2>
                {result.rating === "Discovery" ? <p>Added permanently to your Recipe Book. You can cook it whenever you have the ingredients!</p> : <>
                    <strong className="k3-rating">
                        {formatRating(result.score)}
                    </strong>
                    <span className="k3-rating-score">
                        {result.score}/100 cooking score</span>
                    <p>
                        {result.firstTime ? "First time cooked! Recorded in your recipe journal." : "Your personal best is saved in your Recipe Book."} All meals restore the same pet stats regardless of quality.</p>
                </>}
                <button
                    type="button"
                    className="primary"
                    onClick={() => {
                        setResult(null);
                        setShelf(result.rating === "Discovery" ? "recipes" : "pantry");
                    }}
                >Continue</button>
            </div>
        </div>}
    </section>;
}
