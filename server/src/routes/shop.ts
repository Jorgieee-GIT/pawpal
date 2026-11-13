import type { Express } from "express";
import { auth } from "../auth.js";
import { handle } from "../http.js";
import {
    addedBreedsBySpecies,
    BREED_UNLOCK_LEVELS,
    breedsBySpecies,
    catalog,
    COSMETIC_SLOTS,
    uniqueCosmeticsBySpecies
} from "../petCatalog.js";
import { mutate } from "../petState.js";

/*
 * DOCU: Register shop routes for this feature.
 * @param {Express} app - app value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function registerShopRoutes(app: Express) {
    app.post("/api/item", auth, handle(async (req, res) => mutate(req, res, (p) => {
        const { item, mode } = req.body || {};
        const product = catalog[item];
        if (!product) {
            return "Unknown item.";
        }
        if (
            product.type === "cosmetic" &&
            (mode === "buy" || mode === "equip") &&
            Object.values(uniqueCosmeticsBySpecies).some((items) => items.includes(item)) &&
            !uniqueCosmeticsBySpecies[p.species]?.includes(item)
        ) {
            return "This accessory belongs to another species.";
        }
        if (
            product.type === "breed" &&
            (mode === "buy" || mode === "equip") &&
            ![
                ...(breedsBySpecies[p.species] || []),
                ...(addedBreedsBySpecies[p.species] || [])
            ].includes(item)
        ) {
            return "That breed is not available for your pet species.";
        }
        const owned =
            product.type === "cosmetic"
                ? p.owned_cosmetics
                : product.type === "color"
                    ? p.owned_colors
                    : product.type === "breed"
                    ? p.owned_breeds
                    : p.owned_items;
        if (mode === "buy") {
            const requiredLevel =
                product.type === "breed" ? BREED_UNLOCK_LEVELS[item] : product.level;
            if (requiredLevel && p.level < requiredLevel) {
                return `Unlocks at Level ${requiredLevel}.`;
            }
            if (owned.includes(item)) {
                return "Already owned.";
            }
            if (p.coins < product.price) {
                return "Not enough coins.";
            }
            p.coins -= product.price;
            owned.push(item);
            if (product.type === "theme") {
                p.room_theme = item;
                return "Room theme unlocked and applied!";
            }
            if (product.type === "breed") {
                p.breed = item;
                p.color = "classic";
                return "New breed unlocked and equipped!";
            }
            return "New item unlocked!";
        }
        if (mode === "unequip" && owned.includes(item)) {
            if (product.type === "cosmetic") {
                const slot = COSMETIC_SLOTS[item];
                if (slot) {
                    p.equipped_outfit = {
                        ...(p.equipped_outfit || {}),
                        [slot]: null
                    };
                }
                if (p.equipped_cosmetic === item) {
                    p.equipped_cosmetic = "none";
                }
            } else if (product.type === "color" && p.color === item) {
                p.color = "classic";
            } else if (product.type === "breed" && p.breed === item) {
                p.breed = "classic";
            } else if (product.type === "theme" && p.room_theme === item) {
                p.room_theme = "blush";
            } else if (product.type === "furniture") {
                p.placed_items = p.placed_items.filter((x: string) => x !== item);
            }
            return "Item removed!";
        }
        if (item === "blush" && mode === "equip") {
            p.room_theme = "blush";
            return "Cozy Blush room equipped!";
        }
        if (mode === "equip" && owned.includes(item)) {
            if (product.type === "cosmetic") {
                const slot = COSMETIC_SLOTS[item];
                if (!slot) {
                    return "Unknown accessory slot.";
                }
                if (req.body?.slot && req.body.slot !== slot) {
                    return "Incorrect accessory slot.";
                }
                p.equipped_outfit = {
                    ...(p.equipped_outfit || {}),
                    [slot]: item
                };
                p.equipped_cosmetic = "none";
            } else if (product.type === "color") {
                p.color = item;
            } else if (product.type === "breed") {
                p.breed = item;
                p.color = "classic";
            } else if (product.type === "theme") {
                p.room_theme = item;
            } else if (product.type === "furniture") {
                p.placed_items = p.placed_items.includes(item)
                    ? p.placed_items.filter((x: string) => x !== item)
                    : [...p.placed_items, item];
            }
            return "Look updated!";
        }
        if (mode === "equip" && item === "none" && product.type === "cosmetic") {
            p.equipped_cosmetic = "none";
            return "Accessory removed.";
        }
        return "Unlock this item first.";
    })));

    app.get("/api/catalog", auth, (_q, r) => r.json(catalog));
}
