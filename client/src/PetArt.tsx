import { memo } from "react";
import { COSMETIC_SLOTS, EMPTY_OUTFIT, normalizeOutfit, type Outfit } from "./outfitCatalog";
import { OutfitArtwork } from "./OutfitArt";
import type { ReactNode } from "react";

type Props = {
    species: string;
    color?: string;
    breed?: string;
    cosmetic?: string;
    outfit?: Outfit;
    sleeping?: boolean
};
const ink = "#765e69";
const palette: Record<string, [string, string, string]> = {
    cat: ["#edab69", "#fff0d5", "#a77553"],
    dog: ["#dfae77", "#fff0dc", "#a57857"],
    bunny: ["#f7e4dd", "#fff8f1", "#d2a9b1"],
    fox: ["#e99758", "#fff5e7", "#a96a52"],
    hamster: ["#e8b77d", "#fff2de", "#bb8d69"],
    panda: ["#fff9f0", "#504c56", "#b9b5b9"],
    penguin: ["#505866", "#fff8ef", "#f0aa5b"],
    axolotl: ["#f2afc6", "#ffe4ef", "#d78aa8"]
};
/*
 * DOCU: Handle fur behavior for this feature.
 * @param {string} sp - sp value used by this function
 * @param {string} b - b value used by this function
 * @returns {[string, string, string]} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
const fur = (sp: string, b: string): [string, string, string] => {
    const wildColors: Record<string, [string, string, string]> = {
        eurasian_lynx: ["#bd986e", "#f6dfbc", "#604c43"],
        snow_leopard: ["#dce1e5", "#fcfaf3", "#6e7580"],
        smilodon: ["#bf9a76", "#f4dbb5", "#654c43"],
        gray_wolf: ["#9ba4aa", "#e7e9e6", "#616875"],
        african_wild_dog: ["#bd9d71", "#3d3940", "#f3dfb7"],
        dire_wolf: ["#77737a", "#c8c1ba", "#49454f"],
        pygmy_rabbit: ["#9f8b76", "#e5d3c1", "#65564b"],
        volcano_rabbit: ["#a68d77", "#ead8bd", "#6d5b51"],
        nuralagus: ["#b0a08a", "#f1dfc5", "#776c5e"],
        kit_fox: ["#dfba8d", "#fff1d8", "#b58b65"],
        swift_fox: ["#b2a08e", "#f4e3d3", "#867668"],
        island_fox: ["#9b8170", "#f4e1c4", "#63584f"],
        campbells_dwarf: ["#c1a17c", "#f5e5ce", "#86694f"],
        european_hamster: ["#b68c60", "#f8e7ce", "#594a41"],
        brandts_hamster: ["#b1a18a", "#f3e4d0", "#776c5d"],
        grizzly_bear: ["#54433b", "#cda88d", "#39333a"],
        polar_bear: ["#f7f8f4", "#e8f2f5", "#b1bfc9"],
        short_faced_bear: ["#856956", "#d4b49a", "#51443f"],
        african_penguin: ["#44464c", "#fff8ef", "#f1a7ad"],
        king_penguin: ["#4d505d", "#fff6e5", "#f0bd69"],
        waitaha_penguin: ["#555c68", "#e5e8e7", "#a6b8bf"],
        tiger_salamander: ["#66634e", "#d2bb77", "#353b36"],
        andersons_salamander: ["#a67d78", "#edb5a3", "#785958"],
        ambystoma_dumerilii: ["#786d6d", "#c2a3a0", "#4f4b54"]
    };
    if (wildColors[b]) {
        return wildColors[b];
    }
    const defaults = palette[sp] || palette.cat;
    const overrides: Record<string, [string, string, string]> = {
        calico: ["#fff2df", "#e9a66d", "#655765"],
        tabby: ["#d7a073", "#fff0d9", "#956d55"],
        tuxedo: ["#55505b", "#fff9f2", "#413c48"],
        fluffy: ["#f3d7b4", "#fff4e7", "#ba927a"],
        golden: ["#e6b56d", "#fff1d5", "#b87f4e"],
        dalmatian: ["#f7f5f0", "#474653", "#8b8990"],
        husky: ["#b6bdc8", "#fff8ef", "#686f80"],
        corgi: ["#e5a36a", "#fff4e5", "#b87a51"],
        lop: ["#d4aa8d", "#f8e5d8", "#ab8578"],
        dutch: ["#fff9f2", "#8e8589", "#bdadb1"],
        angora: ["#fff7ee", "#f2d5dc", "#d9b8c3"],
        spotted: ["#f5e6d4", "#bd9988", "#a37b72"],
        red_fox: ["#e99758", "#fff5e7", "#a96a52"],
        arctic_fox: ["#f7f8ff", "#e4eafa", "#b8bfce"],
        fennec: ["#eed4a5", "#fff7e8", "#b99c79"],
        silver_fox: ["#8a8d9c", "#f5f2f1", "#575866"],
        syrian: ["#e0a46d", "#fff6e5", "#a76b4b"],
        dwarf: ["#c9b9ac", "#f5e7dd", "#93867d"],
        roborovski: ["#f1d3a1", "#fffaf0", "#b98a65"],
        banded: ["#b28a70", "#fff7ed", "#8a685b"],
        giant_panda: ["#fff9f0", "#504c56", "#b9b5b9"],
        red_panda: ["#c8794f", "#fff0d9", "#824c43"],
        snow_panda: ["#f8faff", "#a7b6ca", "#8796ad"],
        baby_panda: ["#fff4ee", "#5e5364", "#c6a8b8"],
        emperor: ["#323c4b", "#fff6eb", "#f6bc5c"],
        adelie: ["#373b49", "#fffaf4", "#e89c62"],
        gentoo: ["#686a80", "#fff8ee", "#ee9c63"],
        chinstrap: ["#353944", "#fff9f0", "#d98f58"],
        leucistic: ["#f3b4ce", "#ffe9f0", "#d68faa"],
        wild_type: ["#858d71", "#c7c6a0", "#636d59"],
        melanoid: ["#565260", "#918593", "#45424e"],
        golden_albino: ["#f3d37c", "#fff3b7", "#c5a255"]
    };
    const additional: Record<string, [string, string, string]> = {
        siamese: ["#f6e5c9", "#765d61", "#9e7875"],
        british_shorthair: ["#aab6c8", "#e6e9ef", "#737f91"],
        maine_coon: ["#bb8c6c", "#f7e5cd", "#765944"],
        beagle: ["#c58e57", "#fff9ed", "#54463d"],
        shiba: ["#d89559", "#fff0d6", "#9b6544"],
        border_collie: ["#4e4b55", "#fff9f1", "#68606b"],
        lionhead: ["#efcfaa", "#fff4e5", "#c49c79"],
        rex: ["#b6a2aa", "#f5e8e9", "#89727d"],
        himalayan: ["#f5ede0", "#82737d", "#aa98a0"],
        cross_fox: ["#b8784d", "#3e3a45", "#e5b27b"],
        marble_fox: ["#f7f1e9", "#d3a2b2", "#aa8995"],
        bat_eared_fox: ["#cfad86", "#fff4df", "#8d765f"],
        winter_white: ["#f7f6f3", "#c6c5cf", "#a7a2b2"],
        chinese_hamster: ["#bca48d", "#f7eadb", "#8e7769"],
        teddy_bear: ["#d7a56d", "#fff0d6", "#a77852"],
        qinling_panda: ["#e9d2ad", "#8d6855", "#b69a7f"],
        brown_panda: ["#d0a87e", "#6e5149", "#9a7865"],
        red_panda_cub: ["#df976c", "#fff0d9", "#91584a"],
        rockhopper: ["#343745", "#fff6ec", "#f4b24c"],
        little_blue: ["#729bb8", "#f8f8f3", "#e7a768"],
        macaroni: ["#46435d", "#fff5ea", "#f4c256"],
        copper: ["#d5a47d", "#f5dcc8", "#ad7a66"],
        piebald: ["#f5d6d6", "#8e7688", "#d59baa"],
        mosaic: ["#a1a28b", "#f2c8cf", "#6f7b75"]
    };
    return additional[b] || overrides[b] || defaults;
};

// Breed-specific markings supplement the original artwork; they never replace its silhouette.
// Every one of the 80 named breeds has an explicit signature in this table.
const breedSignatures: Record<string, [string, string, string]> = {
    "calico": ["patches", "#d68b54", "#55515e"],
    "tabby": ["stripes", "#8d6048", "#f8dfbc"],
    "tuxedo": ["bib", "#fffaf4", "#b8b1b9"],
    "fluffy": ["ruff", "#fff1d9", "#d9ad88"],
    "siamese": ["mask", "#715760", "#e6c6b0"],
    "british_shorthair": ["cheeks", "#879bb5", "#f6e6e9"],
    "maine_coon": ["tufts", "#775a47", "#ead1a7"],
    "eurasian_lynx": ["spots", "#5d4c42", "#f6dbad"],
    "snow_leopard": ["rosettes", "#707988", "#f9faf9"],
    "smilodon": ["sabre", "#fff8de", "#8b6851"],
    "golden": ["ruff", "#fff0c9", "#c78d5e"],
    "dalmatian": ["spots", "#444451", "#e9e6e1"],
    "husky": ["mask", "#626d80", "#f7f7f3"],
    "corgi": ["blaze", "#fff3d7", "#ba764b"],
    "beagle": ["patches", "#55453e", "#f9e9ce"],
    "shiba": ["cheeks", "#f8e4c9", "#ac734d"],
    "border_collie": ["blaze", "#fff9ed", "#5c535e"],
    "gray_wolf": ["ruff", "#e3e7e8", "#64717d"],
    "african_wild_dog": ["patches", "#473e3a", "#e8c18d"],
    "dire_wolf": ["mask", "#46424d", "#b9ac9e"],
    "lop": ["cheeks", "#fff0e6", "#aa7d74"],
    "dutch": ["blaze", "#fffaf2", "#8e8589"],
    "angora": ["ruff", "#fffaf6", "#e9c4d0"],
    "spotted": ["spots", "#b78c7a", "#f4d9c5"],
    "lionhead": ["mane", "#e8b982", "#fff2d5"],
    "rex": ["whiskers", "#8b707d", "#f3e4ea"],
    "himalayan": ["mask", "#85727a", "#f8e9dd"],
    "pygmy_rabbit": ["cheeks", "#e8d8c5", "#746454"],
    "volcano_rabbit": ["mask", "#69554a", "#dfc7ad"],
    "nuralagus": ["tufts", "#78685a", "#f2dfc6"],
    "red_fox": ["blaze", "#fff5e8", "#a9694e"],
    "arctic_fox": ["cheeks", "#d5e4f6", "#ffffff"],
    "fennec": ["ears", "#ffe8c3", "#ba926a"],
    "silver_fox": ["mask", "#4c4b5d", "#e8e6f0"],
    "cross_fox": ["cross", "#433e45", "#f1c18f"],
    "marble_fox": ["patches", "#c99cb1", "#f9f5ec"],
    "bat_eared_fox": ["ears", "#d78e91", "#fff0d3"],
    "kit_fox": ["blaze", "#fff6df", "#ac8265"],
    "swift_fox": ["cheeks", "#fff2e3", "#8a776c"],
    "island_fox": ["mask", "#62534c", "#ead6bb"],
    "syrian": ["blaze", "#fff5e3", "#b27f57"],
    "dwarf": ["stripe", "#756a67", "#f5e9e3"],
    "roborovski": ["brows", "#fff9ec", "#b88e64"],
    "banded": ["belt", "#fffaf1", "#8d6c59"],
    "winter_white": ["snow", "#e4e8f5", "#b0aebd"],
    "chinese_hamster": ["stripe", "#665d5b", "#f8ecdf"],
    "teddy_bear": ["ruff", "#fff0d6", "#b67e50"],
    "campbells_dwarf": ["stripe", "#6b5547", "#f4e0c3"],
    "european_hamster": ["mask", "#403a3b", "#fff1d6"],
    "brandts_hamster": ["brows", "#fff6df", "#69584d"],
    "giant_panda": ["bib", "#f9f8f2", "#4f4a53"],
    "red_panda": ["mask", "#fff3d9", "#925341"],
    "snow_panda": ["snow", "#dcebf9", "#8fa9c7"],
    "baby_panda": ["cheeks", "#f2c4d1", "#6a5265"],
    "qinling_panda": ["bib", "#f9e3be", "#805f4f"],
    "brown_panda": ["mask", "#6a4e45", "#ead0ad"],
    "red_panda_cub": ["cheeks", "#fff2d9", "#a9614b"],
    "grizzly_bear": ["ruff", "#cda386", "#483a35"],
    "polar_bear": ["snow", "#e4f3f8", "#b7cedb"],
    "short_faced_bear": ["brows", "#473b36", "#d3b399"],
    "emperor": ["collar", "#ffca6b", "#f8f0dd"],
    "adelie": ["eyering", "#fffdf7", "#5c6272"],
    "gentoo": ["headband", "#f9faf4", "#737988"],
    "chinstrap": ["chinstrap", "#353942", "#fff8ec"],
    "rockhopper": ["crest", "#f8c34d", "#494a59"],
    "little_blue": ["cheeks", "#9bc4db", "#f8faf8"],
    "macaroni": ["crown", "#f8d05a", "#565061"],
    "african_penguin": ["spots", "#373c45", "#eaa5b0"],
    "king_penguin": ["collar", "#f1a94d", "#fff1ce"],
    "waitaha_penguin": ["headband", "#cbd9e4", "#6d8292"],
    "leucistic": ["freckles", "#dc8ca8", "#fff1f4"],
    "wild_type": ["spots", "#586750", "#d8d2a3"],
    "melanoid": ["freckles", "#b5a3bd", "#4b4653"],
    "golden_albino": ["sparkles", "#fff7cd", "#c29d4c"],
    "copper": ["freckles", "#a76f5e", "#f6d8c5"],
    "piebald": ["patches", "#947a8e", "#fff0ec"],
    "mosaic": ["patches", "#667e76", "#edc1c8"],
    "tiger_salamander": ["stripes", "#eac778", "#41463b"],
    "andersons_salamander": ["cheeks", "#edb6a5", "#89655e"],
    "ambystoma_dumerilii": ["spots", "#bba09a", "#514e59"],
};

/*
 * DOCU: Render the breed signature interface and provide its feature behavior.
 * @param {{
    breed: string
}} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function BreedSignature({ breed }: {
    breed: string
}) {
    const signature = breedSignatures[breed];
    if (!signature) {
        return null;
    }
    const [kind, primary, contrast] = signature;
    const spots = [[40, 59, 8], [111, 92, 7], [100, 49, 5], [46, 104, 6]];
    switch (kind) {
        case "patches":
            return <g fill={primary} opacity=".95">
                <path d="M27 62Q30 40 53 43L62 61 50 78 29 75Z" />
                <path d="M94 94q24-13 30 8l-12 18-20-9Z" />
                <ellipse cx="98" cy="43" rx="9" ry="5" fill={contrast} />
            </g>;
        case "spots":
            return <g fill={primary}>
                {spots.map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx={r} ry={r * .7} transform={`rotate(${i * 27} ${x} ${y})`} />)}
            </g>;
        case "rosettes":
            return <g fill="none" stroke={primary} strokeWidth="3.6" strokeLinecap="round">
                {spots.map(([x, y, r], i) => <path key={i} d={`M${x - r} ${y - 2}q-${r / 2} -${r} ${r} -${r}q${r} 0 ${r} ${r}m-3 4q-${r} ${r / 2} -${r * 1.7} 0`} />)}
            </g>;
        case "stripes":
            return <g stroke={primary} strokeWidth="5" strokeLinecap="round" fill="none">
                <path d="M52 39l-7 18M75 35v20M98 39l7 18M34 82l14 6M116 82l-14 6" />
                <path d="M65 43l-2 9M87 43l2 9" stroke={contrast} strokeWidth="2" />
            </g>;
        case "stripe":
            return <g fill="none" strokeLinecap="round">
                <path d="M75 34Q66 55 75 66M75 107v20" stroke={primary} strokeWidth="8" />
                <path d="M75 35v26" stroke={contrast} strokeWidth="2.5" />
            </g>;
        case "belt":
            return <g>
                <path d="M39 105q36 19 72 0l-4 15q-32 13-64 0Z" fill={primary} />
                <path d="M45 111q30 12 60 0" stroke={contrast} strokeWidth="3" fill="none" />
            </g>;
        case "mask":
            return <g>
                <path d="M31 66Q37 43 58 53L75 65 92 53Q113 43 119 66L111 86 91 81 75 73 59 81 39 86Z" fill={primary} />
                <path d="M58 51Q75 60 92 51" fill="none" stroke={contrast} strokeWidth="3" />
            </g>;
        case "blaze":
            return <g>
                <path d="M67 34q8 8 16 0l-3 25-5 16-5-16Z" fill={primary} />
                <path d="M58 107q17 8 34 0" stroke={contrast} strokeWidth="4" strokeLinecap="round" fill="none" />
            </g>;
        case "bib":
            return <g>
                <path d="M57 102Q75 113 93 102L102 127Q75 143 48 127Z" fill={primary} />
                <path d="M60 116q15 8 30 0" fill="none" stroke={contrast} strokeWidth="3" />
            </g>;
        case "ruff":
            return <g>
                <path
                    d="M31 100l-11 8 17 4-6 14 18-6 10 15 16-9 16 9 10-15 18 6-6-14 17-4-11-8"
                    fill={primary}
                    stroke={contrast}
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
                <path d="M49 116q26 12 52 0" stroke={contrast} strokeWidth="3" fill="none" />
            </g>;
        case "mane":
            return <g>
                <path
                    d="M26 65 15 55 29 47 23 33 43 38 52 23 67 35 83 25 96 38 117 31 118 47 136 55 124 67"
                    fill="none"
                    stroke={primary}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path d="M27 69q-7 18 0 30m96-30q7 18 0 30" fill="none" stroke={contrast} strokeWidth="5" strokeLinecap="round" />
            </g>;
        case "tufts":
            return <g>
                <path d="M30 53 19 24 42 39 49 19 59 41M120 53l11-29-23 15-7-20-10 22" fill={primary} stroke={contrast} strokeWidth="2" strokeLinejoin="round" />
            </g>;
        case "ears":
            return <g>
                <path d="M20 47 12 11 47 34M130 47l8-36-35 23" fill={primary} stroke={contrast} strokeWidth="2" />
                <path d="M22 36 18 22 33 33m95 3 4-14-15 11" fill={contrast} />
            </g>;
        case "cheeks":
            return <g>
                <ellipse cx="37" cy="92" rx="13" ry="9" fill={primary} />
                <ellipse cx="113" cy="92" rx="13" ry="9" fill={primary} />
                <path d="M32 92l10-3m66 3 10-3" stroke={contrast} strokeWidth="2" strokeLinecap="round" />
            </g>;
        case "brows":
            return <g fill="none" strokeLinecap="round">
                <path d="M40 58q14-9 27-2m16 0q13-7 27 2" stroke={primary} strokeWidth="8" />
                <path d="M45 52l7-3m46 0 7 3" stroke={contrast} strokeWidth="3" />
            </g>;
        case "whiskers":
            return <g fill="none" stroke={primary} strokeWidth="2.5" strokeLinecap="round">
                <path d="M35 95 15 90m20 11-19 5m99-11 20-5m-20 11 19 5" />
                <circle cx="48" cy="96" r="3" fill={contrast} />
                <circle cx="102" cy="96" r="3" fill={contrast} />
            </g>;
        case "cross":
            return <g fill="none" stroke={primary} strokeWidth="9" strokeLinecap="round">
                <path d="M75 38v24M38 57q37 13 74 0" />
                <path d="M53 40q22 9 44 0" stroke={contrast} strokeWidth="3" />
            </g>;
        case "snow":
            return <g fill={primary} opacity=".95">
                <path d="M47 42l3 6 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z" />
                <path d="M106 86l2 5 6 1-4 4 1 6-5-3-5 3 1-6-4-4 6-1Z" />
                <ellipse cx="41" cy="94" rx="9" ry="6" fill={contrast} />
            </g>;
        case "eyering":
            return <g fill="none" stroke={primary} strokeWidth="4">
                <ellipse cx="55" cy="74" rx="14" ry="15" />
                <ellipse cx="95" cy="74" rx="14" ry="15" />
            </g>;
        case "headband":
            return <g>
                <path d="M35 51q40-22 80 0" fill="none" stroke={primary} strokeWidth="12" strokeLinecap="round" />
                <path d="M46 45q29-12 58 0" fill="none" stroke={contrast} strokeWidth="3" />
            </g>;
        case "chinstrap":
            return <g>
                <path d="M40 89q35 35 70 0" fill="none" stroke={primary} strokeWidth="6" />
                <path d="M51 99q24 19 48 0" fill="none" stroke={contrast} strokeWidth="2" />
            </g>;
        case "collar":
            return <g>
                <path d="M39 55q9-14 20-10l-10 26-11 12Zm72 0q-9-14-20-10l10 26 11 12Z" fill={primary} />
                <path d="M45 64l7-13m53 13-7-13" stroke={contrast} strokeWidth="3" />
            </g>;
        case "crest":
            return <g>
                <path d="M44 45Q16 17 10 33L38 48M106 45q28-28 34-12l-28 15" fill="none" stroke={primary} strokeWidth="10" strokeLinecap="round" />
                <path d="M44 40q-12-17-19-15m81 15q12-17 19-15" fill="none" stroke={contrast} strokeWidth="3" />
            </g>;
        case "crown":
            return <g>
                <path d="M34 47Q24 16 10 24l27 29M116 47q10-31 24-23l-27 29" fill="none" stroke={primary} strokeWidth="11" strokeLinecap="round" />
                <path d="M49 40q26-15 52 0" fill="none" stroke={contrast} strokeWidth="4" />
            </g>;
        case "freckles":
            return <g fill={primary}>
                {[37, 45, 52, 98, 105, 113].map((x, i) => <circle key={x} cx={x} cy={89 + (i % 3) * 5} r={i % 2 ? 2.5 : 3.5} />)}
            </g>;
        case "sparkles":
            return <g fill={primary}>
                <path d="M44 55l4 10 10 4-10 4-4 10-4-10-10-4 10-4ZM107 90l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
                <circle cx="104" cy="51" r="3" fill={contrast} />
            </g>;
        case "sabre":
            return <g>
                <path d="M54 99l6 29 8-27m15-2 7 29 8-30" fill={primary} stroke={contrast} strokeWidth="2" />
                <path d="M48 113q27 9 54 0" fill="none" stroke={contrast} strokeWidth="3" />
            </g>;
        default:
            return null;
    }
}

/*
 * DOCU: Draw the pet and its outfit, including older saves with a single equipped accessory.
 * @param {Props} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function PetArt({ species: sp, breed = "classic", cosmetic = "none", outfit, sleeping = false }: Props) {
    const [main, secondary, accent] = fur(sp, breed);
    const line = {
        stroke: ink,
        strokeWidth: 2.7,
        strokeLinejoin: "round" as const
    };
        /*
     * DOCU: Handle ear behavior for this feature.
     * @param {number} x - x value used by this function
     * @param {number} y - y value used by this function
     * @param {number} rx - rx value used by this function
     * @param {number} ry - ry value used by this function
     * @param {unknown} fill - fill value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const ear = (x: number, y: number, rx: number, ry: number, fill = main) => <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={fill} {...line} />;
    const isRed = sp === "panda" && (breed === "red_panda" || breed === "red_panda_cub");
    let ears: ReactNode = null;
    if (sp === "cat" || isRed) {
        ears = <>
            <path d="M31 59 24 13 64 44Z M119 59 126 13 86 44Z" fill={main} {...line} />
            <path d="M34 43 31 27 49 43Z M116 43 119 27 101 43Z" fill="#f3bac2" />
        </>;
    }
    if (sp === "fox") {
        ears = <>
            <path d="M25 66 13 5 62 42Z M125 66 137 5 88 42Z" fill={main} {...line} />
            <path d="M31 47 24 20 47 42Z M119 47 126 20 103 42Z" fill={breed === "arctic_fox" ? "#d9dfea" : "#edb2a5"} />
            <path d="M24 56 14 42 39 48M126 56l10-14-25 6" fill={accent} {...line} />
        </>;
    }
    if (sp === "dog") {
        ears = breed === "husky" ? <>
            <path d="M29 56 26 14 59 43Z M121 56 124 14 91 43Z" fill={main} {...line} />
        </> : <>
            {ear(27, 67, 16, breed === "corgi" ? 21 : 30, accent)}
            {ear(123, 67, 16, breed === "corgi" ? 21 : 30, accent)}
        </>;
    }
    if (sp === "bunny") {
        ears = <>
            {ear(50, 39, 13, breed === "lop" ? 31 : 35)}
            {ear(100, 39, 13, breed === "lop" ? 31 : 35)}
            <ellipse cx="50" cy="39" rx="6" ry="23" fill="#e9abb9" />
            <ellipse cx="100" cy="39" rx="6" ry="23" fill="#e9abb9" />
        </>;
    }
    if (sp === "hamster") {
        ears = <>
            {ear(38, 42, 19, 19)}
            {ear(112, 42, 19, 19)}
            <circle cx="38" cy="42" r="10" fill="#f1bac3" />
            <circle cx="112" cy="42" r="10" fill="#f1bac3" />
        </>;
    }
    if (sp === "panda" && !isRed) {
        ears = <>
            {ear(37, 35, 18, 18, secondary)}
            {ear(113, 35, 18, 18, secondary)}
        </>;
    }
    if (sp === "axolotl") {
        ears = <g stroke={accent} strokeWidth="11" strokeLinecap="round">
            <path d="M30 57 8 37M27 70 5 69M120 57l22-20m-19 33 22-1" />
        </g>;
    }
    const markings: ReactNode = sp === "cat" && breed === "calico" ? <>
        <path d="M31 55q6-21 27-19l4 20-16 9Z" fill="#e8a166" />
        <path d="M91 37q25 0 29 22l-20 8-13-15Z" fill="#5d5967" />
    </> : sp === "cat" && breed === "tabby" ? <path d="M58 37l-4 14m21-17v16m17-13 4 14" stroke={accent} strokeWidth="6" strokeLinecap="round" /> : sp === "cat" && breed === "tuxedo" ? <path d="M54 39q21 16 42 0l-7 54-14 20-14-20Z" fill={secondary} /> : sp === "dog" && breed === "dalmatian" ? <>
        <ellipse cx="42" cy="53" rx="12" ry="9" fill={secondary} />
        <ellipse cx="107" cy="89" rx="10" ry="12" fill={secondary} />
    </> : sp === "dog" && breed === "husky" ? <path d="M31 65q16-23 33-13l11 15 11-15q17-10 33 13l-20 12-24-10-24 10Z" fill={secondary} /> : sp === "bunny" && breed === "dutch" ? <path d="M29 67q9-28 34-25l12 27-12 15-33-2Z M121 67q-9-28-34-25L75 69l12 15 33-2Z" fill={secondary} /> : sp === "bunny" && breed === "spotted" ? <>
        <ellipse cx="42" cy="55" rx="12" ry="9" fill={secondary} />
        <ellipse cx="106" cy="92" rx="10" ry="9" fill={secondary} />
    </> : sp === "hamster" && breed === "banded" ? <path d="M35 92q40 18 80 0l-6 25H41Z" fill={secondary} /> : null;
    const wildMarkings: ReactNode = breed === "smilodon" ? <>
        <path d="M53 99l5 29 9-27M85 99l7 29 6-30" fill="#fff9e7" stroke="#6b605b" strokeWidth="2" />
    </> : breed === "eurasian_lynx" ? <>
        <path d="M25 39l-4-24 15 15M125 39l4-24-15 15" fill="#51453d" />
        {[39, 105].map(x => <circle key={x} cx={x} cy="77" r="5" fill="#594c42" />)}
    </> : breed === "snow_leopard" ? <>
        {[[41, 65], [104, 65], [55, 94], [94, 98]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" fill="none" stroke="#717984" strokeWidth="4" />)}
    </> : breed === "dire_wolf" ? <>
        <path d="M34 48l-8-28 28 20M116 48l8-28-28 20" fill="#4b4950" />
        <path d="M45 78q30-17 60 0" fill="none" stroke="#4b4950" strokeWidth="9" />
    </> : breed === "gray_wolf" ? <path d="M30 52L23 18l35 25M120 52l7-34-35 25" fill="#858f96" stroke="#545a63" strokeWidth="3" /> : breed === "african_wild_dog" ? <>
        <path d="M29 55L9 22l47 19M121 55l20-33-47 19" fill="#493c35" />
        {[[45, 75], [106, 85], [79, 44]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="12" ry="9" fill={i % 2 ? "#d4ae79" : "#51443f"} />)}
    </> : breed === "nuralagus" ? <>
        <ellipse cx="45" cy="32" rx="15" ry="23" fill="#99836f" />
        <ellipse cx="105" cy="32" rx="15" ry="23" fill="#99836f" />
    </> : breed === "volcano_rabbit" ? <path d="M42 38l-7-21 18 10M108 38l7-21-18 10" fill="#725e4f" /> : breed === "pygmy_rabbit" ? <>
        <ellipse cx="42" cy="89" rx="12" ry="9" fill="#e7d8c4" />
        <ellipse cx="108" cy="89" rx="12" ry="9" fill="#e7d8c4" />
    </> : breed === "kit_fox" ? <path d="M20 51L9 4l49 34M130 51l11-47-49 34" fill="#e9bc8e" stroke="#9e8067" strokeWidth="2" /> : breed === "swift_fox" ? <path d="M33 78q42 25 84 0" fill="none" stroke="#eee0ce" strokeWidth="9" /> : breed === "island_fox" ? <path d="M33 48q42-24 84 0" fill="none" stroke="#695c55" strokeWidth="11" /> : breed === "european_hamster" ? <>
        <ellipse cx="36" cy="90" rx="14" ry="19" fill="#423c39" />
        <ellipse cx="114" cy="90" rx="14" ry="19" fill="#423c39" />
    </> : breed === "brandts_hamster" ? <path d="M32 75q43 30 86 0" fill="none" stroke="#74695d" strokeWidth="8" /> : breed === "campbells_dwarf" ? <path d="M75 37v45" stroke="#746653" strokeWidth="8" /> : breed === "grizzly_bear" ? <path d="M55 101q20 21 40 0" fill="none" stroke="#e5bd92" strokeWidth="12" /> : breed === "polar_bear" ? <>
        <ellipse cx="45" cy="73" rx="12" ry="15" fill="#e4ebf0" />
        <ellipse cx="105" cy="73" rx="12" ry="15" fill="#e4ebf0" />
    </> : breed === "short_faced_bear" ? <path d="M43 79q32-10 64 0" fill="none" stroke="#51443f" strokeWidth="9" /> : breed === "african_penguin" ? <>
        <ellipse cx="75" cy="86" rx="34" ry="37" fill="none" stroke="#383e45" strokeWidth="6" />
        <circle cx="43" cy="61" r="5" fill="#e8a7a9" />
        <circle cx="107" cy="61" r="5" fill="#e8a7a9" />
    </> : breed === "king_penguin" ? <>
        <path d="M37 57q-4-19 10-20M113 57q4-19-10-20" fill="none" stroke="#e7ac61" strokeWidth="10" />
    </> : breed === "waitaha_penguin" ? <path d="M46 54q29-17 58 0" fill="none" stroke="#c4d2da" strokeWidth="9" /> : breed === "tiger_salamander" ? <>
        {[[40, 59], [105, 61], [46, 92], [105, 96]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="10" ry="7" fill="#e6c276" />)}
    </> : breed === "andersons_salamander" ? <path d="M38 79q37-20 74 0" fill="none" stroke="#e5a79b" strokeWidth="8" /> : breed === "ambystoma_dumerilii" ? <>
        {[[43, 67], [106, 67], [75, 44]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" fill="#b49a97" />)}
    </> : null;
    const extraMarkings: ReactNode = breed === "siamese" ? <>
        <ellipse cx="75" cy="85" rx="26" ry="29" fill={secondary} opacity=".78" />
        <ellipse cx="75" cy="95" rx="12" ry="10" fill={main} />
    </> : breed === "beagle" ? <>
        <ellipse cx="43" cy="69" rx="16" ry="20" fill={accent} />
        <path d="M54 41q20 13 42 0" stroke={secondary} strokeWidth="8" />
    </> : breed === "border_collie" ? <path d="M65 36q10 8 20 0l-3 48-7 20-7-20Z" fill={secondary} /> : breed === "shiba" ? <path d="M43 83q32 28 64 0l-15 24H58Z" fill={secondary} /> : breed === "lionhead" ? <>
        <path d="M26 70q-15-36 21-43m56 0q36 7 21 43" fill="none" stroke={accent} strokeWidth="12" strokeLinecap="round" />
    </> : breed === "himalayan" ? <ellipse cx="75" cy="90" rx="21" ry="20" fill={secondary} /> : breed === "cross_fox" ? <path d="M27 65q48 13 96 0" stroke={secondary} strokeWidth="12" opacity=".8" /> : breed === "marble_fox" ? <path d="M47 44q28 20 56 0" stroke={secondary} strokeWidth="10" /> : breed === "teddy_bear" ? <>
        <circle cx="38" cy="89" r="14" fill={secondary} />
        <circle cx="112" cy="89" r="14" fill={secondary} />
    </> : breed === "winter_white" ? <path d="M34 83q41 27 82 0" fill="none" stroke={secondary} strokeWidth="10" /> : breed === "qinling_panda" || breed === "brown_panda" ? <ellipse cx="75" cy="105" rx="27" ry="11" fill={secondary} /> : breed === "rockhopper" || breed === "macaroni" ? <>
        <path d="M36 46q-17-19-21-7m99 7q17-19 21-7" fill="none" stroke="#f2c454" strokeWidth="9" strokeLinecap="round" />
    </> : breed === "piebald" ? <>
        <circle cx="47" cy="52" r="13" fill={secondary} />
        <circle cx="107" cy="99" r="11" fill={secondary} />
    </> : breed === "mosaic" ? <path d="M75 34q40 10 46 43l-42 5Z" fill={secondary} /> : null;
    const eyes = sleeping ? <g fill="none" stroke="#443c49" strokeWidth="3.5" strokeLinecap="round">
        <path d="M46 74q9 9 18 0M86 74q9 9 18 0" />
    </g> : sp === "panda" && !isRed ? <>
        <ellipse cx="53" cy="72" rx="17" ry="20" fill={secondary} />
        <ellipse cx="97" cy="72" rx="17" ry="20" fill={secondary} />
        <circle cx="55" cy="72" r="5" fill="white" />
        <circle cx="95" cy="72" r="5" fill="white" />
        <circle cx="55" cy="73" r="3" fill="#373340" />
        <circle cx="95" cy="73" r="3" fill="#373340" />
    </> : <>
        <ellipse cx="55" cy="75" rx="5" ry="7" fill="#443c49" />
        <ellipse cx="95" cy="75" rx="5" ry="7" fill="#443c49" />
        <circle cx="57" cy="72" r="1.6" fill="white" />
        <circle cx="97" cy="72" r="1.6" fill="white" />
    </>;
    const mouth = sp === "penguin" ? <path d="M67 88 75 101 83 88Z" fill={accent} /> : sp === "dog" ? <>
        <ellipse cx="75" cy="95" rx="22" ry="16" fill={secondary} />
        <ellipse cx="75" cy="88" rx="8" ry="5" fill="#4e4350" />
        <path d="M75 93q-6 11-13 3m13-3q6 11 13 3" fill="none" stroke={ink} strokeWidth="2" />
    </> : sp === "bunny" ? <>
        <path d="M69 91 75 95 81 91Z" fill="#c88399" />
        <path d="M75 95v8m0 0q-6 6-12 0m12 0q6 6 12 0" fill="none" stroke={ink} strokeWidth="2" />
    </> : sp === "fox" || isRed ? <>
        <path d="M35 91 75 114 115 91 94 103 75 114 56 103Z" fill={secondary} />
        <path d="M69 89 75 96 81 89Z" fill="#514552" />
    </> : sp === "hamster" ? <>
        <ellipse cx="45" cy="94" rx="19" ry="15" fill={secondary} />
        <ellipse cx="105" cy="94" rx="19" ry="15" fill={secondary} />
        <ellipse cx="75" cy="92" rx="6" ry="4" fill="#cf8799" />
    </> : <path d="M69 92q6 8 12 0" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />;
    const cosmeticSlot = Object.hasOwn(COSMETIC_SLOTS, cosmetic) ? COSMETIC_SLOTS[cosmetic] : undefined;
    const worn = outfit ? normalizeOutfit(outfit) : cosmeticSlot ? { ...EMPTY_OUTFIT, [cosmeticSlot]: cosmetic } : EMPTY_OUTFIT;
    const wornNames = Object.values(worn).filter(Boolean).join(", ").replaceAll("_", " ");
    return <svg viewBox="0 0 150 150" className="pet-svg" role="img" aria-label={`${breed === "classic" ? "classic" : breed.replaceAll("_", " ")} ${sp} wearing ${wornNames || "no accessory"}`}>
        <ellipse cx="75" cy="140" rx="43" ry="6" fill="#78525f" opacity=".12" />
        {sp === "fox" ? <g>
            <path d="M105 119Q151 123 141 60Q131 85 110 91Q137 85 129 105Z" fill={main} {...line} />
            <path d="M133 85Q143 64 141 60Q147 99 129 108L118 107Z" fill={secondary} />
        </g> : isRed ? <path d="M104 113q39-7 30-42-4 24-29 21" fill={main} {...line} /> : null}
        <OutfitArtwork outfit={worn} layer="body" bareTorso={<ellipse cx="75" cy="113" rx="38" ry="27" fill={main} {...line} />} />
        {sp === "penguin" ? <>
            <ellipse cx="35" cy="108" rx="12" ry="23" fill={main} transform="rotate(24 35 108)" />
            <ellipse cx="115" cy="108" rx="12" ry="23" fill={main} transform="rotate(-24 115 108)" />
        </> : null}
        {ears}
        <ellipse cx="75" cy="76" rx={sp === "hamster" ? 54 : 50} ry="44" fill={main} {...line} />
        {sp === "penguin" ? <ellipse cx="75" cy="85" rx="35" ry="37" fill={secondary} /> : null}
        {markings}
        {extraMarkings}
        {wildMarkings}
        <BreedSignature breed={breed} />
        {sp === "fox" ? <g>
            <path
                d="M26 71Q33 83 18 89L38 94 28 106Q50 104 75 118Q100 104 122 106L112 94 132 89Q117 83 124 71Q105 82 96 89L75 104 54 89Q45 82 26 71Z"
                fill={secondary}
                {...line}
            />
            <path d="M45 87Q56 78 66 84M84 84Q94 78 105 87" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M60 101 75 112 90 101" fill="none" stroke={accent} strokeWidth="2" />
        </g> : null}
        {eyes}
        {mouth}
        {sp === "cat" ? <path d="M35 91H13m22 7H15m100-7h22m-22 7h20" stroke={ink} strokeWidth="2" /> : null}
        {sp === "axolotl" ? <path d="M48 96q27 15 54 0" stroke={ink} strokeWidth="2" fill="none" /> : null}
        <OutfitArtwork outfit={worn} layer="front" />
    </svg>;
}

export default memo(PetArt);
