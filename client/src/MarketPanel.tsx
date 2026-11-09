import { LockKeyhole, ShoppingBag } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { FURNITURE, FURNITURE_UNLOCK_LEVELS, FurnitureArt, furnitureLayout } from "./RoomFurniture";
import SectionHeading from "./SectionHeading";
import type { Pet } from "./types";

type Props = {
    marketRoom: string;
    setMarketRoom: Dispatch<SetStateAction<string>>;
    pet: Pet;
    busy: boolean;
    execute: (path: string, body?: unknown, method?: string) => Promise<any>;
};

export default function MarketPanel({ marketRoom, setMarketRoom, pet, busy, execute }: Props) {
    return (
        <section className="panel">
            <div className="eyebrow">COLLECT & CUSTOMIZE</div>
            <SectionHeading title="Market" Icon={ShoppingBag} />
            <div className="paw-market-furniture">
                <h3>Furniture Shop</h3>
                <div
                    className="paw-market-tabs-scroll"
                    role="region"
                    aria-label="Furniture rooms"
                    tabIndex={0}
                >
                    <div className="paw-market-tabs">
                        {(
                            [
                                ["living", "Living Room"],
                                ["bedroom", "Bedroom"],
                                ["studio", "Creative Studio"],
                                ["sports", "Sports Room"]
                            ] as const
                        ).map(([id, label]) => (
                            <button
                                key={id}
                                className={marketRoom === id ? "active" : ""}
                                onClick={(e) => {
                                    setMarketRoom(id);
                                    e.currentTarget.scrollIntoView({
                                        behavior: "smooth",
                                        block: "nearest",
                                        inline: "nearest"
                                    });
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="shop-grid">
                    {Object.entries(FURNITURE)
                        .filter(([id, f]) => f.room === marketRoom && f.price > 0)
                        .sort(
                            ([idA], [idB]) =>
                                (FURNITURE_UNLOCK_LEVELS[idA] || 1) -
                                    (FURNITURE_UNLOCK_LEVELS[idB] || 1) ||
                                FURNITURE[idA].price - FURNITURE[idB].price
                        )
                        .map(([id, f]) => {
                            const owned = pet.owned_items.includes(id);
                            const placed = furnitureLayout(marketRoom, pet.room_layouts).some(
                                (p) => p.id === id
                            );
                            const unlocked =
                                ["living", "bedroom"].includes(marketRoom) ||
                                (pet.unlocked_rooms || []).includes(marketRoom);
                            const requiredLevel = FURNITURE_UNLOCK_LEVELS[id] || 1;
                            const locked = !owned && pet.level < requiredLevel;
                            return (
                                <div
                                    className={"product " + (locked ? "paw-level-locked" : "")}
                                    key={id}
                                >
                                    <span className="paw-furniture-market-art">
                                        <FurnitureArt kind={f.kind} itemId={id} />
                                    </span>
                                    <b>{f.name}</b>
                                    <small>
                                        {owned
                                            ? "Owned ✓"
                                            : locked
                                              ? `Unlocks at Level ${requiredLevel}`
                                              : f.price.toLocaleString() + " coins"}
                                    </small>
                                    {locked && (
                                        <div className="paw-level-overlay">
                                            <LockKeyhole size={17} />
                                            <b>Level {requiredLevel}</b>
                                        </div>
                                    )}
                                    <button
                                        disabled={busy || locked || (!unlocked && owned)}
                                        onClick={() =>
                                            void execute("/furniture", {
                                                room: marketRoom,
                                                action: owned
                                                    ? placed
                                                        ? "store"
                                                        : "place"
                                                    : "buy",
                                                item: id
                                            })
                                        }
                                    >
                                        {owned
                                            ? placed
                                                ? "Store"
                                                : "Place in room"
                                            : locked
                                              ? "Locked"
                                              : "Buy · " + f.price.toLocaleString() + " coins"}
                                    </button>
                                </div>
                            );
                        })}
                </div>
            </div>
        </section>
    );
}
