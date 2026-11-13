import type { ReactNode } from "react";

/** Original, reusable 96px SVG illustrations. Every ID is rendered in Develop → Kitchen. */
export const EXTRA_KITCHEN_ART_IDS = [
    "rolling_pin",
    "uneven_dough",
    "smooth_dough",
    "rolling_flour",
    "catch_basket",
    "fresh_ingredient",
    "spoiled_ingredient",
    "falling_sparkle",
    "stove_burner",
    "stove_pan",
    "stove_flame",
    "seasoning_bowl",
    "sweet_shaker",
    "salty_shaker",
    "zesty_shaker",
    "seasoning_sparkle"
] as const;

export type ExtraKitchenArtId = typeof EXTRA_KITCHEN_ART_IDS[number];

/*
 * DOCU: Render the kitchen extra art interface and provide its feature behavior.
 * @param {{
    id: ExtraKitchenArtId
}} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function KitchenExtraArt({ id }: {
    id: ExtraKitchenArtId
}) {
    const artwork: Record<ExtraKitchenArtId, ReactNode> = {
        rolling_pin: (
            <>
                <path d="M26 38L69 57" stroke="#8f6475" strokeWidth="14" strokeLinecap="round" />
                <path d="M28 39L68 56" stroke="#dbaf7a" strokeWidth="20" strokeLinecap="round" />
                <path d="M35 41L62 52" stroke="#f5d59e" strokeWidth="12" strokeLinecap="round" />
                <path d="M17 34L27 39M69 57L81 62" stroke="#a27769" strokeWidth="8" strokeLinecap="round" />
                <path d="M36 40L63 52" stroke="#fff0c9" strokeWidth="2" strokeLinecap="round" />
            </>
        ),
        uneven_dough: (
            <>
                <path d="M21 32Q38 17 56 28Q73 23 80 43Q85 62 69 70Q50 82 29 69Q13 58 21 32Z" fill="#efcd9d" stroke="#bd925f" strokeWidth="3" />
                <path d="M24 44Q36 27 48 42Q61 30 74 48M32 60Q47 48 65 64" fill="none" stroke="#d6aa73" strokeWidth="7" strokeLinecap="round" />
                <path d="M36 30L40 26M65 58L70 55" stroke="#fff2cc" strokeWidth="3" strokeLinecap="round" />
            </>
        ),
        smooth_dough: (
            <>
                <ellipse cx="48" cy="54" rx="37" ry="27" fill="#efd09b" stroke="#be9665" strokeWidth="3" />
                <ellipse cx="46" cy="49" rx="30" ry="20" fill="#ffe5b4" />
                <path d="M30 39Q45 31 59 40" stroke="#fff2d6" strokeWidth="4" fill="none" strokeLinecap="round" />
            </>
        ),
        rolling_flour: (
            <>
                {[[20, 30, 4], [39, 21, 3], [72, 35, 5], [81, 61, 3], [29, 72, 5], [59, 78, 3]].map(([x, y, r], index) => (
                    <circle key={index} cx={x} cy={y} r={r} fill="#fff8e8" stroke="#ecd9c4" strokeWidth="1.4" />
                ))}
                <path d="M48 29L51 37L59 40L51 44L48 52L45 44L37 40L45 37Z" fill="#f6d7a1" />
            </>
        ),
        catch_basket: (
            <>
                <path d="M17 39Q25 79 48 80Q72 79 80 39Z" fill="#dcad79" stroke="#956d60" strokeWidth="3" />
                <path d="M22 43L74 70M27 61L70 42M35 76L75 51M19 51L62 77" stroke="#f3d29c" strokeWidth="4" />
                <ellipse cx="48" cy="39" rx="33" ry="8" fill="#f8d4a4" stroke="#956d60" strokeWidth="3" />
                <path d="M26 40Q20 12 48 12Q76 12 70 40" fill="none" stroke="#ac7b60" strokeWidth="6" />
            </>
        ),
        fresh_ingredient: (
            <>
                <path
                    d="M47 29L43 16M47 29Q29 14 23 24Q27 37 47 29M47 29Q61 12 70 24Q67 37 47 29"
                    fill="#8ec1a1"
                    stroke="#5e9a7b"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <path d="M48 32Q21 21 21 53Q21 81 48 79Q75 81 75 53Q75 24 48 32Z" fill="#ed8ca0" stroke="#b95c7a" strokeWidth="3" />
                <circle cx="38" cy="47" r="5" fill="#ffd8d7" opacity=".8" />
            </>
        ),
        spoiled_ingredient: (
            <>
                <path
                    d="M20 59Q10 41 25 35Q25 16 43 25Q55 12 66 28Q87 27 80 50Q88 71 66 74Q50 88 34 76Q14 77 20 59Z"
                    fill="#b0a2aa"
                    stroke="#837884"
                    strokeWidth="3"
                />
                <path d="M31 45L39 53M39 45L31 53M59 45L67 53M67 45L59 53" stroke="#7f667a" strokeWidth="3" strokeLinecap="round" />
                <path d="M37 66Q48 56 59 66" fill="none" stroke="#7f667a" strokeWidth="3" strokeLinecap="round" />
            </>
        ),
        falling_sparkle: (
            <>
                {[[48, 28, 14], [22, 60, 8], [75, 65, 9]].map(([x, y, r], index) => (
                    <path
                        key={index}
                        d={`M${x} ${y - r}L${x + r * .25} ${y - r * .25}L${x + r} ${y}L${x + r * .25} ${y + r * .25}L${x} ${y + r}L${x - r * .25} ${y + r * .25}L${x - r} ${y}L${x - r * .25} ${y - r * .25}Z`}
                        fill="#ffe2a5"
                        stroke="#e8b96b"
                        strokeWidth="1"
                    />
                ))}
            </>
        ),
        stove_burner: (
            <>
                <ellipse cx="48" cy="61" rx="37" ry="22" fill="#cfbbc9" stroke="#9e879c" strokeWidth="3" />
                <ellipse cx="48" cy="56" rx="25" ry="14" fill="#554e65" stroke="#897b91" strokeWidth="5" />
                <path d="M27 51L69 64M28 64L69 50" stroke="#d9cad7" strokeWidth="4" strokeLinecap="round" />
            </>
        ),
        stove_pan: (
            <>
                <ellipse cx="40" cy="56" rx="29" ry="20" fill="#a69eae" stroke="#806f89" strokeWidth="3" />
                <ellipse cx="40" cy="51" rx="22" ry="13" fill="#6f6478" />
                <path d="M66 53L89 37" stroke="#b17a68" strokeWidth="10" strokeLinecap="round" />
                <ellipse cx="40" cy="51" rx="15" ry="8" fill="#edc584" />
                <path d="M31 50Q43 42 50 51" stroke="#fff1be" strokeWidth="3" fill="none" />
            </>
        ),
        stove_flame: (
            <>
                <path
                    d="M48 10Q62 31 58 43Q79 34 74 55Q70 82 48 83Q25 83 22 59Q21 41 37 31Q35 47 45 49Q43 31 48 10Z"
                    fill="#f6aa75"
                    stroke="#dc8b77"
                    strokeWidth="2.5"
                />
                <path d="M50 40Q62 57 59 65Q57 77 47 77Q36 77 35 64Q34 52 45 47L46 56Z" fill="#ffe7a2" />
            </>
        ),
        seasoning_bowl: (
            <>
                <path d="M13 46Q20 82 48 82Q75 82 83 46Z" fill="#edb7c9" stroke="#af809d" strokeWidth="3" />
                <ellipse cx="48" cy="45" rx="35" ry="13" fill="#f8d2a3" stroke="#af809d" strokeWidth="3" />
                <path d="M27 44Q48 31 69 44" stroke="#fff0c6" strokeWidth="5" fill="none" />
                <circle cx="35" cy="45" r="4" fill="#e88ca8" />
                <circle cx="58" cy="48" r="4" fill="#94b984" />
            </>
        ),
        sweet_shaker: (
            <>
                <rect x="32" y="29" width="33" height="48" rx="8" fill="#f2c3d8" stroke="#b77e9f" strokeWidth="2.5" />
                <rect x="36" y="18" width="25" height="15" rx="5" fill="#e7d9ec" stroke="#a98da9" strokeWidth="2" />
                <path d="M48 39L51 46L59 47L53 53L55 61L48 57L41 61L43 53L37 47L45 46Z" fill="#fff2c8" />
            </>
        ),
        salty_shaker: (
            <>
                <rect x="32" y="29" width="33" height="48" rx="8" fill="#c4dce5" stroke="#80a8ba" strokeWidth="2.5" />
                <rect x="36" y="18" width="25" height="15" rx="5" fill="#e7d9ec" stroke="#a98da9" strokeWidth="2" />
                <path d="M40 51H57" stroke="#fff9ed" strokeWidth="8" strokeLinecap="round" />
            </>
        ),
        zesty_shaker: (
            <>
                <rect x="32" y="29" width="33" height="48" rx="8" fill="#e2dfb1" stroke="#aba967" strokeWidth="2.5" />
                <rect x="36" y="18" width="25" height="15" rx="5" fill="#e7d9ec" stroke="#a98da9" strokeWidth="2" />
                <circle cx="49" cy="53" r="12" fill="#fff0b2" stroke="#cab667" strokeWidth="2" />
                <path d="M49 41V65M37 53H61" stroke="#cab667" strokeWidth="2" />
            </>
        ),
        seasoning_sparkle: (
            <>
                <path d="M48 11L53 33L75 39L53 45L48 70L42 46L21 39L43 32Z" fill="#ffe7ab" stroke="#e9b976" strokeWidth="2" />
                <circle cx="18" cy="69" r="5" fill="#f7bad4" />
                <circle cx="76" cy="70" r="5" fill="#b4d9d1" />
            </>
        )
    };

    return (
        <svg role="img" aria-label={id.replaceAll("_", " ")} viewBox="0 0 96 96" width="100%" height="100%">
            <ellipse cx="48" cy="88" rx="34" ry="4" fill="#806475" opacity=".1" />
            {artwork[id]}
        </svg>
    );
}
