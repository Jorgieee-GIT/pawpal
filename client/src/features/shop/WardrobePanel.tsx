import { LockKeyhole, Shirt } from "lucide-react";
import { OutfitWardrobe } from "./OutfitWardrobe";
import PetArt from "../../PetArt";
import SectionHeading from "../../SectionHeading";
import {
    addedBreedStore,
    breedFor,
    extraBreedStore,
    ITEM_LEVEL_REQUIREMENTS,
    wildSpeciesStore
} from "../../shopCatalog";
import type { Pet } from "../../types";

type Props = {
    pet: Pet;
    execute: (path: string, body?: unknown, method?: string) => Promise<any>;
    busy: boolean;
};

/*
 * DOCU: Render the wardrobe panel interface and provide its feature behavior.
 * @param {Props} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export default function WardrobePanel({ pet, execute, busy }: Props) {
    return (
        <section className="panel">
            <div className="eyebrow">YOUR COZY CLOSET</div>
            <SectionHeading title="Wardrobe" Icon={Shirt} />
            <OutfitWardrobe pet={pet} execute={execute} busy={busy} />
            <h3>Breeds, wildlife & prehistoric relatives</h3>
            <div className="shop-grid">
                {[...extraBreedStore, ...addedBreedStore, ...wildSpeciesStore]
                    .filter((item) => breedFor(pet.species, item[0]))
                    .sort(
                        (a, b) =>
                            (ITEM_LEVEL_REQUIREMENTS[a[0]] || 1) -
                                (ITEM_LEVEL_REQUIREMENTS[b[0]] || 1) || a[3] - b[3]
                    )
                    .map(([id, , , price]) => (
                        <div className={ "product " + (!pet.owned_breeds.includes(id) && pet.level < (ITEM_LEVEL_REQUIREMENTS[id] || 0) ? "paw-level-locked" : "")} key={id}>
                            <span>
                                <PetArt species={pet.species} breed={id} cosmetic="none" />
                            </span>
                            <b>{id.replaceAll("_", " ")}</b>
                            {wildSpeciesStore.some((item) => item[0] === id) && (
                                <small>
                                    {[
                                        "smilodon",
                                        "dire_wolf",
                                        "nuralagus",
                                        "short_faced_bear",
                                        "waitaha_penguin"
                                    ].includes(id)
                                        ? "Extinct relative"
                                        : "Wild relative / species"}
                                </small>
                            )}
                            <small>
                                {pet.owned_breeds.includes(id)
                                    ? "Unlocked ✓"
                                    : pet.level < (ITEM_LEVEL_REQUIREMENTS[id] || 0)
                                        ? `Unlocks at Level ${ITEM_LEVEL_REQUIREMENTS[id]}`
                                        : `${price} coins`}
                            </small>
                            {!pet.owned_breeds.includes(id) &&
                                pet.level < (ITEM_LEVEL_REQUIREMENTS[id] || 0) && (
                                    <div className="paw-level-overlay">
                                        <LockKeyhole size={20} />
                                        <b>Level {ITEM_LEVEL_REQUIREMENTS[id]}</b>
                                    </div>
                                )}
                            <button
                                disabled={
                                    busy ||
                                    (!pet.owned_breeds.includes(id) &&
                                        pet.level < (ITEM_LEVEL_REQUIREMENTS[id] || 0))
                                }
                                onClick={() =>
                                    void execute("/item", {
                                        item: id,
                                        mode: pet.owned_breeds.includes(id)
                                            ? pet.breed === id
                                                ? "unequip"
                                                : "equip"
                                            : "buy"
                                    })
                                }
                            >
                                {pet.breed === id
                                    ? "Use default"
                                    : pet.owned_breeds.includes(id)
                                        ? "Equip"
                                        : `Buy · ${price}  coins`}
                            </button>
                        </div>
                    ))}
            </div>
        </section>
    );
}
