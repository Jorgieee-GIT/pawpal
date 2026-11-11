import { Check, LockKeyhole } from "lucide-react";
import { useState } from "react";
import type { OutfitSlot } from "../../outfitCatalog";
import { COSMETIC_SLOTS, NEW_COSMETICS, normalizeOutfit, SLOT_NAMES } from "../../outfitCatalog";
import { PawSlotIcon } from "../../PawIcons";
import PetArt from "../../PetArt";
import {
    addedCosmeticStore,
    ITEM_LEVEL_REQUIREMENTS,
    store,
    uniqueCosmeticsBySpecies
} from "../../shopCatalog";
import type { Pet } from "../../types";

export function OutfitWardrobe({
    pet,
    execute,
    busy
}: {
    pet: Pet;
    execute: (path: string, body?: unknown, method?: string) => Promise<any>;
    busy: boolean;
}) {
    const [section, setSection] = useState<"outfit" | "shop">("outfit");
    const [slot, setSlot] = useState<OutfitSlot>("head");
    const [tryOn, setTryOn] = useState<string | null>(null);
    const current = normalizeOutfit(pet.equipped_outfit);
    const preview = {
        ...current,
        ...(tryOn
            ? {
                  [COSMETIC_SLOTS[tryOn]]: tryOn
              }
            : {})
    };
    const base = [...store, ...addedCosmeticStore]
        .filter((item) => item[2] === "cosmetic")
        .map(([id, , , price]) => ({
            id,
            slot: COSMETIC_SLOTS[id],
            price
        }));
    const available = [...base, ...NEW_COSMETICS]
        .filter(
            (x) =>
                x.slot === slot &&
                (!Object.values(uniqueCosmeticsBySpecies).some((list) => list.includes(x.id)) ||
                    uniqueCosmeticsBySpecies[pet.species]?.includes(x.id))
        )
        .sort(
            (a, b) =>
                (ITEM_LEVEL_REQUIREMENTS[a.id] || 1) - (ITEM_LEVEL_REQUIREMENTS[b.id] || 1) ||
                a.price - b.price
        );
    const own = (id: string) => pet.owned_cosmetics.includes(id);
    const change = (id: string, mode: string) => {
        setTryOn(null);
        void execute("/item", {
            item: id,
            mode,
            slot: COSMETIC_SLOTS[id]
        });
    };
    return (
        <div className="v8-wardrobe">
            <div className="v8-preview">
                <div className="v8-pet">
                    <PetArt
                        species={pet.species}
                        breed={pet.breed}
                        color={pet.color}
                        outfit={preview}
                        cosmetic="none"
                    />
                </div>
                <div>
                    <h3>{pet.name}'s outfit</h3>
                    {tryOn && (
                        <span className="v8-try">
                            Previewing {tryOn.replaceAll("_", " ")} · not equipped
                        </span>
                    )}
                </div>
            </div>
            <div className="paw-wardrobe-toolbar">
                <div className="v8-tabs">
                    <button
                        className={section === "outfit" ? "selected" : ""}
                        onClick={() => {
                            setSection("outfit");
                            setTryOn(null);
                        }}
                    >
                        Owned
                    </button>
                    <button
                        className={section === "shop" ? "selected" : ""}
                        onClick={() => setSection("shop")}
                    >
                        Shop
                    </button>
                </div>
                <div className="v8-slots">
                    {SLOT_NAMES.map((s) => (
                        <button
                            key={s}
                            className={slot === s ? "selected" : ""}
                            onClick={() => {
                                setSlot(s);
                                setTryOn(null);
                            }}
                        >
                            <b>
                                {<PawSlotIcon slot={s} />} {s}
                            </b>
                        </button>
                    ))}
                </div>
            </div>
            {section === "outfit" ? (
                <div className="v8-owned">
                    <h3>{slot[0].toUpperCase() + slot.slice(1)} accessories</h3>
                    <div className="v8-collection">
                        {available.filter((x) => own(x.id)).length === 0 ? (
                            <p className="paw-wardrobe-empty">
                                You don't own any {slot} items yet.
                            </p>
                        ) : (
                            available
                                .filter((x) => own(x.id))
                                .map((x) => (
                                    <div className="v8-item" key={x.id}>
                                        <div className="v8-item-art">
                                            <PetArt
                                                species={pet.species}
                                                breed={pet.breed}
                                                outfit={{
                                                    ...current,
                                                    [slot]: x.id
                                                }}
                                                cosmetic="none"
                                            />
                                        </div>
                                        <b>{x.id.replaceAll("_", " ")}</b>
                                        <button
                                            className={
                                                current[slot] === x.id
                                                    ? "paw-wardrobe-unequip"
                                                    : "paw-wardrobe-equip"
                                            }
                                            disabled={busy}
                                            onClick={() =>
                                                change(
                                                    x.id,
                                                    current[slot] === x.id ? "unequip" : "equip"
                                                )
                                            }
                                        >
                                            {current[slot] === x.id ? "Unequip" : "Equip"}
                                        </button>
                                    </div>
                                ))
                        )}
                    </div>
                    {current[slot] && (
                        <button
                            className="secondary"
                            disabled={busy}
                            onClick={() => change(current[slot]!, "unequip")}
                        >
                            Remove {slot} accessory
                        </button>
                    )}
                </div>
            ) : (
                <div>
                    <h3>Shop · {slot}</h3>
                    <div className="v8-collection">
                        {available
                            .filter((x) => !own(x.id))
                            .map((x) => (
                                <div
                                    className={
                                        "v8-item " +
                                        (current[slot] === x.id ? "paw-cosmetic-equipped " : "") +
                                        (!own(x.id) &&
                                        pet.level < (ITEM_LEVEL_REQUIREMENTS[x.id] || 0)
                                            ? "paw-level-locked"
                                            : "")
                                    }
                                    key={x.id}
                                >
                                    <div className="v8-item-art">
                                        <PetArt
                                            species={pet.species}
                                            breed={pet.breed}
                                            outfit={{
                                                ...current,
                                                [slot]: x.id
                                            }}
                                            cosmetic="none"
                                        />
                                    </div>
                                    {current[slot] === x.id && (
                                        <span className="paw-equipped-badge">
                                            <Check size={13} /> Equipped
                                        </span>
                                    )}
                                    <b>{x.id.replaceAll("_", " ")}</b>
                                    <small
                                        className={
                                            current[slot] === x.id ? "paw-equipped-label" : ""
                                        }
                                    >
                                        {!own(x.id) &&
                                        pet.level < (ITEM_LEVEL_REQUIREMENTS[x.id] || 0) ? (
                                            `Unlocks at Level ${ITEM_LEVEL_REQUIREMENTS[x.id]}`
                                        ) : current[slot] === x.id ? (
                                            <>
                                                <Check size={14} aria-hidden="true" /> Equipped
                                            </>
                                        ) : own(x.id) ? (
                                            "Owned"
                                        ) : (
                                            `${x.price} coins`
                                        )}
                                    </small>
                                    {!own(x.id) &&
                                        pet.level < (ITEM_LEVEL_REQUIREMENTS[x.id] || 0) && (
                                            <div className="paw-level-overlay">
                                                <LockKeyhole size={16} /> Level{" "}
                                                {ITEM_LEVEL_REQUIREMENTS[x.id]}
                                            </div>
                                        )}
                                    <div className="v8-actions">
                                        <button
                                            className="secondary"
                                            disabled={busy}
                                            onClick={() => setTryOn(x.id)}
                                        >
                                            Try on
                                        </button>
                                        <button
                                            className="paw-wardrobe-market-buy"
                                            disabled={
                                                busy ||
                                                pet.level < (ITEM_LEVEL_REQUIREMENTS[x.id] || 0)
                                            }
                                            onClick={() => change(x.id, "buy")}
                                        >
                                            {pet.level < (ITEM_LEVEL_REQUIREMENTS[x.id] || 0)
                                                ? "Locked"
                                                : `Buy · ${x.price.toLocaleString()} coins`}
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
