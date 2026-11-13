import type { Express } from "express";
import { gameSettings } from "../adminConsole.js";
import { auth } from "../auth.js";
import {
    createGardenFlower,
    FLOWER_RULES,
    GARDEN_GROWTH_MS,
    GARDEN_SEED_PRICE,
    GARDEN_WATER_PRICE,
    gardenHarvestReady,
    recordFlowerDiscovery
} from "../gardenRules.js";
import { handle } from "../http.js";
import { clamp, mutate } from "../petState.js";

/*
 * DOCU: Register garden routes for this feature.
 * @param {Express} app - app value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function registerGardenRoutes(app: Express) {
    // Each plot has its own server-timed growth and its own saved rarity.

    const plotPrices = [0, 0, 0, 750, 1500, 2500, 4000, 6000, 9000, 13000, 18000, 25000];

    // Flower chances and rewards are defined in gardenRules.ts.

        /*
     * DOCU: Handle garden state behavior for this feature.
     * @param {any} raw - raw value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
function gardenState(raw: any) {
        const g = raw || {};
        g.seeds = Number(g.seeds) || 0;
        g.flowers = Number(g.flowers) || 0;
        g.watering_cans = Number(g.watering_cans) || 0;
        g.unlocked_plots = Math.min(12, Math.max(3, Number(g.unlocked_plots) || 3));
        g.plots = Array.isArray(g.plots) ? g.plots.slice(0, 12) : [];
        if (g.planted_at && !g.plots.some((x: any) => x?.planted_at)) {
            g.plots[0] = {
                planted_at: g.planted_at,
                watered_minutes: Number(g.watered_minutes) || 0,
                rarity: "Common",
                reward: 50,
                variant: 0
            };
        }
        while (g.plots.length < g.unlocked_plots) {
            g.plots.push(null);
        }
        delete g.planted_at;
        delete g.watered_minutes;
        return g;
    }

    app.post("/api/garden", auth, handle(async (req, res) => {
        (req as any).gardenRewardMultiplier = (await gameSettings()).garden_reward_percent;
        await mutate(req, res, (p) => {
            const g = gardenState(p.garden);
            const action = String(req.body?.action || "");
            const qty = Number(req.body?.quantity ?? 1);
            const idx = Number(req.body?.plotIndex ?? 0);
            const validPlot = Number.isInteger(idx) && idx >= 0 && idx < g.unlocked_plots;

            if (["seeds", "buy_water"].includes(action)) {
                if (!Number.isSafeInteger(qty) || qty < 1 || qty > 99) {
                    return "Choose a quantity from 1 to 99.";
                }
                const cost =
                    qty * (action === "seeds" ? GARDEN_SEED_PRICE : GARDEN_WATER_PRICE);
                if (p.coins < cost) {
                    return "Not enough coins.";
                }
                p.coins -= cost;
                if (action === "seeds") {
                    g.seeds += qty;
                } else {
                    g.watering_cans += qty;
                }
                p.garden = g;
                return `Purchased ${qty} ${action === "seeds" ? "seeds" : "watering cans"}!`;
            }

            if (action === "unlock_plot") {
                if (g.unlocked_plots >= 12) {
                    return "All twelve plots are unlocked.";
                }
                const cost = plotPrices[g.unlocked_plots];
                if (p.coins < cost) {
                    return `You need ${cost} coins to unlock this plot.`;
                }
                p.coins -= cost;
                g.unlocked_plots++;
                g.plots.push(null);
                p.garden = g;
                return `Plot ${g.unlocked_plots} unlocked!`;
            }

            if (!validPlot) {
                return "Choose an unlocked garden plot.";
            }

            const plot = g.plots[idx];

            if (action === "plant") {
                if (plot?.planted_at) {
                    return "This plot already has a flower.";
                }
                if (g.seeds < 1) {
                    return "Buy more seeds.";
                }
                g.seeds--;
                const flower = createGardenFlower();
                // Fix the payout at planting time. Later admin changes cannot alter growing flowers.
                const multiplier = Number((req as any).gardenRewardMultiplier ?? 100) / 100;
                flower.reward = Math.max(0, Math.floor(Number(flower.reward) * multiplier));
                g.plots[idx] = flower;
                p.garden = g;
                p.energy = clamp(p.energy - 2);
                p.cleanliness = clamp(p.cleanliness - 3);
                return `Seed planted in plot ${idx + 1}!`;
            }

            if (action === "water") {
                if (!plot?.planted_at) {
                    return "Plant a flower in this plot first.";
                }
                if (g.watering_cans < 1) {
                    return "Buy a watering can first.";
                }
                const remaining =
                    GARDEN_GROWTH_MS -
                    (Date.now() - new Date(plot.planted_at).getTime()) -
                    (plot.watered_minutes || 0) * 60000;
                if (remaining <= 0) {
                    return "Your flower is ready!";
                }
                g.watering_cans--;
                plot.watered_minutes = Math.min(5, (plot.watered_minutes || 0) + 1);
                p.garden = g;
                p.energy = clamp(p.energy - 2);
                p.cleanliness = clamp(p.cleanliness - 2);
                return `Plot ${idx + 1} watered! One minute removed.`;
            }

            if (action === "harvest") {
                if (!plot?.planted_at) {
                    return "Plant a flower first.";
                }
                if (!gardenHarvestReady(plot)) {
                    return "Not ready to harvest.";
                }
                const rarity = String(plot.rarity || "Common");
                const flower =
                    FLOWER_RULES.find((item) => item.rarity === rarity) || FLOWER_RULES[1];
                const reward = Number.isFinite(Number(plot.reward)) ? Number(plot.reward) : 50;
                const newlyDiscovered = recordFlowerDiscovery(g, flower.rarity, reward);
                req.gardenReveal = {
                    rarity: flower.rarity,
                    name: flower.name,
                    reward,
                    variant: Number(plot.variant) || 0,
                    plotIndex: idx,
                    newlyDiscovered
                };
                g.plots[idx] = null;
                g.flowers++;
                p.coins += reward;
                p.xp += 15;
                p.garden = g;
                p.energy = clamp(p.energy - 3);
                p.cleanliness = clamp(p.cleanliness - 4);
                return `${rarity} flower harvested! +${reward} coins and +15 EXP.`;
            }

            return "Unknown garden action.";
        });
    }));
}
