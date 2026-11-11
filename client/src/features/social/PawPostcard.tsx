import { ENVELOPE_DESIGNS, EnvelopeArtwork } from "../../PawMailArt";
import PetArt from "../../PetArt";

export const ENVELOPE_COLORS = [
    ["blush", "Blush", "#ffe1eb"],
    ["rose", "Rose", "#f5bdcf"],
    ["peach", "Peach", "#ffdcc7"],
    ["apricot", "Apricot", "#ffe4b8"],
    ["butter", "Butter", "#fff2b8"],
    ["mint", "Mint", "#d9f4df"],
    ["sage", "Sage", "#d3e4ce"],
    ["aqua", "Aqua", "#d3f1f2"],
    ["sky", "Sky", "#d6eafa"],
    ["periwinkle", "Periwinkle", "#dcdfff"],
    ["lavender", "Lavender", "#e8dcfc"],
    ["lilac", "Lilac", "#efddf5"],
    ["cream", "Cream", "#fff5e6"],
    ["coral", "Coral", "#ffd2cb"],
    ["slate", "Twilight", "#ccd8e9"]
] as const;

export function PawPostcard({
    design,
    message,
    color = "blush",
    senderPet
}: {
    design: string;
    message: string;
    color?: string;
    senderPet?: {
        species: string;
        color: string;
        breed: string;
        equipped_cosmetic?: string;
        equipped_outfit?: any;
    } | null;
}) {
    const chosen = ENVELOPE_DESIGNS.find((d) => d.id === design) || ENVELOPE_DESIGNS[0];
    const shade = ENVELOPE_COLORS.find((c) => c[0] === color)?.[2] || ENVELOPE_COLORS[0][2];
    return (
        <div
            className={"paw-envelope paw-envelope-" + chosen.id}
            style={
                {
                    "--envelope-color": shade
                } as React.CSSProperties
            }
        >
            <div className="paw-envelope-top">
                <span className="paw-envelope-postmark">PAWPAL ✦ SPECIAL DELIVERY</span>
                <span className="paw-envelope-seal" title="Sender's pet wax seal">
                    {senderPet ? (
                        <PetArt
                            species={senderPet.species}
                            color={senderPet.color}
                            breed={senderPet.breed}
                            cosmetic={senderPet.equipped_cosmetic}
                            outfit={senderPet.equipped_outfit}
                        />
                    ) : (
                        <span>♡</span>
                    )}
                </span>
            </div>
            <div className="paw-envelope-illustration" aria-hidden="true">
                <EnvelopeArtwork design={chosen.id} />
            </div>
            <div className="paw-envelope-content">
                <small>{chosen.title}</small>
                <p>{message || "Your little letter will appear here…"}</p>
            </div>
        </div>
    );
}
