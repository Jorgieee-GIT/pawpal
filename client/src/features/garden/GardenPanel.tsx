import "./GardenRevamp.css";
import { useEffect, useState, type CSSProperties } from "react";
import { BookOpen, Check, CircleHelp, Clock3, Coins, Droplets, Flower2, Leaf, LockKeyhole, Sparkles, X } from "lucide-react";
import { GARDEN_FLOWER_CATALOG, GardenIcon } from "./GardenArt";
import { GardenBedArt, GardenGrowthStage } from "./GardenBedArt";
import SectionHeading from "../../SectionHeading";

type Plot = {
    planted_at: string;
    watered_minutes: number
} | null;
type Discovery = {
    count: number;
    first_at: string;
    best_reward: number
};
type Garden = {
    seeds: number;
    flowers: number;
    watering_cans?: number;
    unlocked_plots?: number;
    planted_at?: string | null;
    watered_minutes?: number;
    plots?: Plot[];
    discoveries?: Record<string, Discovery>;
};
type Reveal = {
    rarity: string;
    name: string;
    reward: number;
    variant: number;
    plotIndex: number;
    newlyDiscovered: boolean
};
type Props = {
    garden: Garden;
    coins: number;
    busy: boolean;
    nowTick: number;
    onAction: (body: {
        action: string;
        plotIndex?: number;
        quantity?: number
    }) => Promise<any>;
};
const PLOT_PRICES = [750, 1500, 2500, 4000, 6000, 9000, 13000, 18000, 25000];
const GROWTH_TIME = 300000;
const PLOT_SCATTER = [
    { x: 2, y: 1, mobileX: 2, mobileY: 0 },
    { x: 28, y: 9, mobileX: 40, mobileY: 4 },
    { x: 54, y: 1, mobileX: 78, mobileY: 1 },
    { x: 80, y: 10, mobileX: 13, mobileY: 23 },
    { x: 10, y: 35, mobileX: 51, mobileY: 25 },
    { x: 36, y: 30, mobileX: 80, mobileY: 22 },
    { x: 62, y: 42, mobileX: 1, mobileY: 45 },
    { x: 82, y: 34, mobileX: 39, mobileY: 48 },
    { x: 2, y: 65, mobileX: 77, mobileY: 44 },
    { x: 28, y: 70, mobileX: 13, mobileY: 67 },
    { x: 56, y: 68, mobileX: 51, mobileY: 69 },
    { x: 82, y: 63, mobileX: 80, mobileY: 66 }
];
/*
 * DOCU: Handle plot position behavior for this feature.
 * @param {number} index - Position of the item in its collection
 * @returns {CSSProperties} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
const plotPosition = (index: number): CSSProperties => {
    const position = PLOT_SCATTER[index % PLOT_SCATTER.length];
    return {
        "--plot-x": `${position.x}%`,
        "--plot-y": `${position.y}%`,
        "--plot-mobile-x": `${position.mobileX}%`,
        "--plot-mobile-y": `${position.mobileY}%`
    } as CSSProperties;
};
const SEED_PRICE = 40;
const WATER_PRICE = 10;

/*
 * DOCU: Render the stock shop interface and provide its feature behavior.
 * @param {{
    kind: "seed" | "water";
    label: string;
    price: number;
    quantity: number;
    onQuantity: (value: number) => void;
    onBuy: () => void;
    busy: boolean;
    pending: boolean;
    coins: number
}} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function StockShop({ kind, label, price, quantity, onQuantity, onBuy, busy, pending, coins }: {
    kind: "seed" | "water";
    label: string;
    price: number;
    quantity: number;
    onQuantity: (value: number) => void;
    onBuy: () => void;
    busy: boolean;
    pending: boolean;
    coins: number
}) {
    return <div className="paw-garden-shop-card">
        <div className="paw-garden-shop-heading">
            <GardenIcon kind={kind} />
            <div>
                <strong>
                    {label}
                </strong>
                <small>
                    {price} coins each</small>
            </div>
        </div>
        <div className="paw-garden-shop-controls">
            <div className="paw-garden-qty" aria-label={`${label} quantity`}>
                <button type="button" disabled={quantity <= 1} onClick={() => onQuantity(Math.max(1, quantity - 1))} aria-label={`Decrease ${label}`}>−</button>
                <output>
                    {quantity}
                </output>
                <button type="button" disabled={quantity >= 99} onClick={() => onQuantity(Math.min(99, quantity + 1))} aria-label={`Increase ${label}`}>+</button>
            </div>
            <button type="button" className="paw-garden-shop-buy" data-operation-locked={busy && coins >= price * quantity ? "true" : undefined} data-pending={pending ? "true" : undefined} disabled={busy || coins < price * quantity} onClick={onBuy}>Buy · {(price * quantity).toLocaleString()} <Coins size={14} />
            </button>
        </div>
    </div>;
}

/*
 * DOCU: Render the garden panel interface and provide its feature behavior.
 * @param {Props} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export default function GardenPanel({ garden, coins, busy, nowTick, onAction }: Props) {
    const [seedQuantity, setSeedQuantity] = useState(1);
    const [waterQuantity, setWaterQuantity] = useState(1);
    const [guideOpen, setGuideOpen] = useState(false);
    const [guideTab, setGuideTab] = useState<"collection" | "odds">("collection");
    const [reveal, setReveal] = useState<Reveal | null>(null);
    const [pendingAction, setPendingAction] = useState<string | null>(null);
    const [gardenMode, setGardenMode] = useState<"plant" | "water" | null>(null);
    const [unlockPrompt, setUnlockPrompt] = useState(false);
    const [gardenNotice, setGardenNotice] = useState("");
    const unlocked = garden.unlocked_plots || 3;
    const discoveries = garden.discoveries || {};
    const foundCount = GARDEN_FLOWER_CATALOG.filter(flower => discoveries[flower.rarity]?.count > 0).length;
    const plotPrice = PLOT_PRICES[unlocked - 3];
    useEffect(() => {
        if (!gardenNotice) return;
        const timer = window.setTimeout(() => setGardenNotice(""), 2600);
        return () => window.clearTimeout(timer);
    }, [gardenNotice]);
        /*
     * DOCU: Handle plot at behavior for this feature.
     * @param {number} index - Position of the item in its collection
     * @returns {Plot} - Result returned by this function.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const plotAt = (index: number): Plot => garden.plots?.[index] || (index === 0 && garden.planted_at ? {
        planted_at: garden.planted_at,
        watered_minutes: garden.watered_minutes || 0
    } : null);
        /*
     * DOCU: Handle remaining for behavior for this feature.
     * @param {Plot} plot - plot value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const remainingFor = (plot: Plot) => plot ? Math.max(0, GROWTH_TIME - (nowTick - new Date(plot.planted_at).getTime()) - (plot.watered_minutes || 0) * 60000) : 0;
        /*
     * DOCU: Send a kitchen action to the server and apply the returned kitchen state.
     * @param {string} action - action value used by this function
     * @param {number} plotIndex - plotIndex value used by this function
     * @param {number} quantity - quantity value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const act = async (action: string, plotIndex?: number, quantity?: number) => {
        if (busy || pendingAction) {
            return;
        }
        setPendingAction(`${action}:${plotIndex ?? "shop"}`);
        try {
            const result = await onAction({
                action,
                ...(plotIndex === undefined ? {} : {
                    plotIndex
                }),
                ...(quantity === undefined ? {} : {
                    quantity
                })
            });
            if (!result) return;
            if (action === "harvest" && result?.gardenReveal) {
                setReveal(result.gardenReveal);
            }
            if (action === "unlock_plot") setUnlockPrompt(false);
        } finally {
            setPendingAction(null);
        }
    };
        /*
     * DOCU: Open guide for this feature.
     * @param {"collection" | "odds"} which - which value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const openGuide = (which: "collection" | "odds") => {
        setGuideTab(which);
        setGuideOpen(true);
    };
        /*
     * DOCU: Handle plot tap for this feature.
     * @param {number} index - Position of the item in its collection
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const handlePlotTap = (index: number) => {
        const plot = plotAt(index);
        const remaining = remainingFor(plot);
        if (plot && remaining === 0) {
            void act("harvest", index);
        } else if (!plot && gardenMode === "plant") {
            if (garden.seeds > 0) void act("plant", index);
            else setGardenNotice("No seeds left. Pick some up in the Garden shed.");
        } else if (plot && gardenMode === "water") {
            if ((garden.watering_cans || 0) > 0) void act("water", index);
            else setGardenNotice("No watering cans left. Pick some up in the Garden shed.");
        } else if (!plot) {
            setGardenNotice("Choose the seed button, then tap an empty spot.");
        } else if (gardenMode === "plant") {
            setGardenNotice("That spot is growing. Choose the watering can to tend it.");
        } else {
            setGardenNotice("Choose the watering can, then tap a growing spot.");
        }
    };

    return <section className="panel paw-garden-panel">
        <header className="paw-garden-header">
            <div className="paw-garden-header-copy">
                <div className="eyebrow">A LITTLE PATCH OF MAGIC</div>
                <SectionHeading title="Lucky Garden" Icon={Flower2} />
            </div>
            <div className="paw-garden-header-actions">
                <button type="button" onClick={() => openGuide("collection")}>
                    <CircleHelp size={18} /> Info
                </button>
            </div>
        </header>
        <div className="paw-garden-stock" aria-label="Garden supplies">
            <div>
                <GardenIcon kind="seed" />
                <span>
                    <strong>
                        {garden.seeds || 0}
                    </strong>
                    <small>Seeds</small>
                </span>
            </div>
            <div>
                <GardenIcon kind="water" />
                <span>
                    <strong>
                        {garden.watering_cans || 0}
                    </strong>
                    <small>Watering cans</small>
                </span>
            </div>
            <div>
                <GardenIcon kind="flower" rarity="Common" />
                <span>
                    <strong>
                        {garden.flowers || 0}
                    </strong>
                    <small>Harvested</small>
                </span>
            </div>
            <div>
                <BookOpen size={27} />
                <span>
                    <strong>
                        {foundCount}/5</strong>
                    <small>Discovered</small>
                </span>
            </div>
        </div>
        <div className="paw-garden-landscape">
            <div className="paw-garden-scenery" aria-hidden="true">
                <span className="paw-garden-sun" />
                <span className="paw-garden-cloud cloud-one" />
                <span className="paw-garden-cloud cloud-two" />
                <span className="paw-garden-hill hill-one" />
                <span className="paw-garden-hill hill-two" />
                <span className="paw-garden-fence" />
                <span className="paw-garden-butterfly">✿</span>
            </div>
            <div className="paw-garden-scene-title">
                <Leaf size={15} /> My flower beds <small>
                    {unlocked} of 12 unlocked</small>
            </div>
            <div className="paw-garden-bed-grid">
                {Array.from({
                    length: unlocked
                }, (_, index) => {
                    const plot = plotAt(index);
                    const remaining = remainingFor(plot);
                    const progress = plot ? 1 - remaining / GROWTH_TIME : 0;
                    const stage: GardenGrowthStage = !plot ? "empty" : remaining === 0 ? "ready" : progress < .22 ? "seed" : progress < .58 ? "sprout" : "bud";
                    return <button key={index} type="button" style={plotPosition(index)} className={`paw-garden-bed stage-${stage}`} aria-label={`Plot ${index + 1}: ${!plot ? "empty" : remaining === 0 ? "ready to harvest" : "growing"}`} onClick={() => handlePlotTap(index)}>
                        <GardenBedArt stage={stage} />
                        {plot && <span className={`paw-garden-plot-indicator ${remaining === 0 ? "is-ready" : "is-growing"}`} aria-hidden="true">
                            {remaining === 0 ? <Sparkles size={13} /> : <Clock3 size={12} />}
                        </span>}
                    </button>;
                })}
                {unlocked < 12 && <button type="button" style={plotPosition(unlocked)} className="paw-garden-bed paw-garden-locked-bed" aria-label={`Plot ${unlocked + 1}: locked, select to unlock for ${plotPrice} coins`} disabled={busy} onClick={() => setUnlockPrompt(true)}>
                    <GardenBedArt stage="locked" />
                    <LockKeyhole className="paw-garden-plot-lock" size={15} aria-hidden="true" />
                </button>}
                <div className="paw-garden-mode-tools" role="group" aria-label="Garden action mode">
                    <button type="button" className={gardenMode === "plant" ? "active" : ""} aria-label="Plant seeds" aria-pressed={gardenMode === "plant"} title="Choose a seed, then tap an empty plot" onClick={() => setGardenMode(gardenMode === "plant" ? null : "plant")}>
                        <Leaf size={14} /><span>Seed</span>
                    </button>
                    <button type="button" className={gardenMode === "water" ? "active" : ""} aria-label="Water plants" aria-pressed={gardenMode === "water"} title="Choose a watering can, then tap a growing plot" onClick={() => setGardenMode(gardenMode === "water" ? null : "water")}>
                        <Droplets size={14} /><span>Water</span>
                    </button>
                </div>
                {unlockPrompt && <div className="paw-garden-unlock-popover" role="dialog" aria-label={`Unlock plot ${unlocked + 1}`}>
                    <button type="button" className="paw-garden-unlock-dismiss" aria-label="Close unlock prompt" onClick={() => setUnlockPrompt(false)}><X size={16} /></button>
                    <strong>Unlock Plot {unlocked + 1}?</strong>
                    <span>{plotPrice.toLocaleString()} Paw Coins</span>
                    <div>
                        <button type="button" className="cancel" onClick={() => setUnlockPrompt(false)}>Cancel</button>
                        <button type="button" className="confirm" disabled={busy || coins < plotPrice} data-pending={pendingAction === "unlock_plot:shop" ? "true" : undefined} onClick={() => void act("unlock_plot")}>Unlock</button>
                    </div>
                </div>}
            </div>
            {gardenNotice && <div className="paw-garden-action-toast" role="status" aria-live="polite">
                <Check size={16} /> {gardenNotice}
            </div>}

        </div>
        <div className="paw-garden-supplies">
            <div className="paw-garden-supplies-intro">
                <h3>Garden shed</h3>
                <p>Watering speeds growth; it never changes flower odds.</p>
            </div>
            <div className="paw-garden-shop-grid">
                <StockShop
                    kind="seed"
                    label="Mystery seeds"
                    price={SEED_PRICE}
                    quantity={seedQuantity}
                    onQuantity={setSeedQuantity}
                    busy={busy}
                    pending={pendingAction === "seeds:shop"}
                    coins={coins}
                    onBuy={() => void act("seeds", undefined, seedQuantity)}
                />
                <StockShop
                    kind="water"
                    label="Watering cans"
                    price={WATER_PRICE}
                    quantity={waterQuantity}
                    onQuantity={setWaterQuantity}
                    busy={busy}
                    pending={pendingAction === "buy_water:shop"}
                    coins={coins}
                    onBuy={() => void act("buy_water", undefined, waterQuantity)}
                />
            </div>
        </div>

        {guideOpen && <div className="paw-modal-backdrop paw-garden-modal-backdrop" onMouseDown={event => {if (event.currentTarget ===event.target) {setGuideOpen(false)}}}>
            <section className="paw-modal paw-garden-guide-modal" role="dialog" aria-modal="true" aria-label="Garden flower guide">
                <div className="paw-modal-top">
                    <div>
                        <h2>Garden discoveries</h2>
                        <p className="paw-modal-subtitle">My little Flower Book</p>
                    </div>
                    <button className="paw-modal-close" type="button" aria-label="Close flower book" onClick={() => setGuideOpen(false)}>
                        <X size={18} />
                    </button>
                </div>
                <div className="paw-garden-guide-tabs">
                    <button type="button" className={guideTab === "collection" ? "active" : ""} onClick={() => setGuideTab("collection")}>
                        <BookOpen size={15} /> My collection ({foundCount}/5)</button>
                    <button type="button" className={guideTab === "odds" ? "active" : ""} onClick={() => setGuideTab("odds")}>
                        <Sparkles size={15} /> Odds & rewards</button>
                </div>
                <div className="paw-garden-discovery-grid">
                    {GARDEN_FLOWER_CATALOG.map(flower => {
                        const found = !!discoveries[flower.rarity]?.count;
                        return <article key={flower.rarity} className={`paw-garden-discovery ${!found && guideTab === "collection" ? "undiscovered" : ""}`}>
                            <div className="paw-garden-discovery-art">
                                {guideTab === "odds" || found ? <GardenIcon kind="flower" rarity={flower.rarity} stage={0} /> : <>
                                    <span className="paw-garden-mystery-flower">?</span>
                                    <LockKeyhole size={18} />
                                </>}
                            </div>
                            <div className="paw-garden-discovery-info">
                                <h3>
                                    {guideTab === "collection" && !found ? "Undiscovered bloom" : flower.name}
                                </h3>
                                <span className={`paw-garden-rarity rarity-${flower.rarity.toLowerCase()}`}>
                                    {flower.rarity}
                                </span>
                                {guideTab === "odds" ? <>
                                    <p>
                                        {flower.chance}% chance per seed</p>
                                    <strong>
                                        <Coins size={15} />
                                        {flower.min}–{flower.max} coins</strong>
                                </> : found ? <>
                                    <p>
                                        <Check size={14} /> Found {discoveries[flower.rarity].count} time{discoveries[flower.rarity].count === 1 ? "" : "s"}
                                    </p>
                                    <strong>
                                        <Coins size={15} /> Best: {discoveries[flower.rarity].best_reward}
                                    </strong>
                                </> : <p>Keep planting to discover it!</p>}
                            </div>
                        </article>;
                    })}
                </div>
                <p className="paw-garden-guide-note">Each seed costs 40 Paw Coins and takes five minutes to grow. Watering cans cost 10 coins and shorten growth by one minute. Rarity and payout are chosen by the server, then revealed only when you harvest.</p>
            </section>
        </div>}

        {reveal && <div className="paw-modal-backdrop paw-garden-modal-backdrop" onMouseDown={event => {if (event.target ===event.currentTarget) {setReveal(null)}}}>
            <section className={`paw-modal paw-garden-reveal rarity-${reveal.rarity.toLowerCase()}`} role="dialog" aria-modal="true" aria-label="Your harvested flower">
                <div className="paw-modal-top paw-garden-reveal-heading">
                    <div>
                        <h2>Flower revealed!</h2>
                        <p className="paw-modal-subtitle">Plot {reveal.plotIndex + 1} · Harvest reward</p>
                    </div>
                    <button type="button" className="paw-modal-close" aria-label="Close harvest result" onClick={() => setReveal(null)}>
                        <X size={19} />
                    </button>
                </div>
                <div className="paw-garden-reveal-stars" aria-hidden="true">✦ · ✧ · ✦</div>
                <div className="paw-garden-reveal-art">
                    <GardenIcon kind="flower" rarity={reveal.rarity} variant={reveal.variant} stage={0} />
                </div>
                <span className={`paw-garden-rarity rarity-${reveal.rarity.toLowerCase()}`}>
                    {reveal.rarity} harvest</span>
                <h2>
                    {reveal.name}
                </h2>
                {reveal.newlyDiscovered && <div className="paw-garden-first-find">
                    <BookOpen size={16} /> New discovery added to your Flower Book!</div>}
                <div className="paw-garden-reveal-reward">
                    <Coins size={24} />
                    <strong>+{reveal.reward.toLocaleString()} Paw Coins</strong>
                    <small>+15 XP</small>
                </div>
                <button type="button" className="paw-garden-reveal-close" onClick={() => setReveal(null)}>Lovely! <Check size={16} />
                </button>
                <button
                    type="button"
                    className="paw-garden-view-book"
                    onClick={() => {
                        setReveal(null);
                        openGuide("collection")
                    }}
                >View Flower Book</button>
            </section>
        </div>}
    </section>;
}
