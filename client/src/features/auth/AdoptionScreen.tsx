import type { Dispatch, SetStateAction } from "react";
import PetArt from "../../PetArt";
import { species } from "../../shopCatalog";

type Props = {
    oldPetId: string | null;
    execute: (path: string, body?: unknown, method?: string) => Promise<any>;
    choice: string;
    setChoice: Dispatch<SetStateAction<string>>;
    petName: string;
    setPetName: Dispatch<SetStateAction<string>>;
    adoptionAcknowledged: boolean;
    setAdoptionAcknowledged: Dispatch<SetStateAction<boolean>>;
    busy: boolean;
};

export default function AdoptionScreen({
    oldPetId,
    execute,
    choice,
    setChoice,
    petName,
    setPetName,
    adoptionAcknowledged,
    setAdoptionAcknowledged,
    busy
}: Props) {
    return (
        <div className="adopt-card">
            <div className="eyebrow">ONE FOREVER COMPANION</div>
            <h1>Choose your best friend ♡</h1>
            <p>
                Each account can adopt one pet. Friends' pets will join your living room
                automatically.
            </p>
            {oldPetId && (
                <button
                    className="secondary"
                    onClick={() =>
                        void execute("/claim", {
                            petId: oldPetId
                        })
                    }
                >
                    Restore my pet from the old PawPal version
                </button>
            )}
            <div className="species-grid">
                {species.map((s) => (
                    <button
                        key={s}
                        className={choice === s ? "chosen" : ""}
                        onClick={() => setChoice(s)}
                    >
                        <span className="paw-adoption-pet-art">
                            <PetArt species={s} />
                        </span>
                        <b>{s}</b>
                    </button>
                ))}
            </div>
            <input
                value={petName}
                maxLength={24}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Your pet's name"
            />
            <div className="adoption-warning">
                <strong>Permanent pet choice</strong>
                <p>
                    Your pet species cannot be changed after adoption. You can still customize its
                    breed, color and accessories.
                </p>
                <label className="adoption-check-row">
                    <input
                        type="checkbox"
                        checked={adoptionAcknowledged}
                        onChange={(e) => setAdoptionAcknowledged(e.target.checked)}
                    />
                    <span>I understand that this species choice is permanent.</span>
                </label>
            </div>
            <button
                disabled={busy || !petName.trim() || !adoptionAcknowledged}
                className="primary"
                onClick={() => {
                    if (window.confirm("Adopt this " + choice + " permanently?")) {
                        void execute("/adopt", {
                            name: petName,
                            species: choice
                        });
                    }
                }}
            >
                Adopt{" "}
                <span className="paw-adopt-inline-pet">
                    <PetArt species={choice} />
                </span>{" "}
                {choice} →
            </button>
        </div>
    );
}
