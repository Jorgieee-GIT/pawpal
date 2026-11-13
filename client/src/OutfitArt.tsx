import type { ReactNode } from "react";
import type { Outfit } from "./outfitCatalog";

const outline = { stroke: "#76586e", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const cream = "#fff1dd";
const gold = "#f1c46e";
const rose = "#eb9fbc";
const berry = "#b7678b";
const lilac = "#b7a3df";
const plum = "#716087";
const mint = "#a4d1b7";
const leaf = "#689981";
const sky = "#a8d1e7";
const denim = "#739bc3";

type Motif = "star" | "heart" | "moon" | "gem" | "flower" | "leaf" | "butterfly" | "snow" | "cloud" | "flame";
const motifs: Record<Motif, string> = {
    star: "M0-10 3-3 10-2 5 3 6 10 0 6-6 10-5 3-10-2-3-3Z",
    heart: "M0 9C-19-2-8-15 0-7C8-15 19-2 0 9Z",
    moon: "M4-10A10 10 0 1 0 10 5A9 9 0 0 1 4-10Z",
    gem: "M0-12 9-3 6 7 0 12-6 7-9-3Z",
    flower: "M0-5C-9-16-15-4-7 0C-18 6-7 15 0 7C7 15 18 6 7 0C15-4 9-16 0-5Z",
    leaf: "M-8 8Q-14-8 9-11Q15 7-8 8Z",
    butterfly: "M0 0C-2-17-20-14-13-3C-21 4-9 13 0 5C9 13 21 4 13-3C20-14 2-17 0 0Z",
    snow: "M0-11V11M-10-6 10 6m-20 0L10-6M-3-8l3 3 3-3m-6 16 3-3 3 3M-9-2l4-1-1-4m15 9-4 1 1 4m-15-5 4 1-1 4m15-9-4-1 1-4",
    cloud: "M-13 5Q-16-2-9-3Q-8-12-1-9Q5-13 9-5Q17-4 14 4Q13 8 7 8H-8Q-12 8-13 5Z",
    flame: "M0-12Q10-7 5-2Q12-3 11 4Q9 11 0 12Q-13 10-10 1Q-7 4-6 0Q-3-5 0-12Z"
};

/*
 * DOCU: Place a decorative motif at a specific point on an accessory or garment.
 * @param {Motif} kind - Shape to draw
 * @param {number} x - Horizontal center in pet coordinates
 * @param {number} y - Vertical center in pet coordinates
 * @param {string} fill - Main color of the motif
 * @param {number} size - Scale relative to the motif's original size
 * @returns {ReactNode} - The positioned SVG motif
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function motif(kind: Motif, x: number, y: number, fill: string, size = 1) {
    return <g transform={`translate(${x} ${y}) scale(${size})`}>
        <path d={motifs[kind]} fill={kind === "snow" ? "none" : fill} stroke={kind === "snow" ? fill : "#76586e"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        {kind === "flower" && <circle r="3.2" fill={gold} />}
        {kind === "butterfly" && <path d="M0-3V6" stroke="#76586e" strokeWidth="2" strokeLinecap="round" />}
        {kind === "leaf" && <path d="m-8 8 13-14" stroke={cream} strokeWidth="1.4" />}
        {kind === "gem" && <path d="M0-9-3-2 0 8 4-2Z" fill={cream} opacity=".58" />}
    </g>;
}

/*
 * DOCU: Draw the head accessory for a catalog ID in the pet's forehead area.
 * @param {string | null} id - Equipped head item ID
 * @returns {ReactNode} - Headwear artwork
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function headArt(id: string | null): ReactNode {
    switch (id) {
        case "bow": return <g transform="translate(105 36) rotate(12)">
            <path d="M0-2Q-11-15-22-11L-24 7Q-17 15 0 5Q17 15 24 7L22-11Q11-15 0-2Z" fill={rose} {...outline} />
            <path d="M-17-5-4 1m21-6L4 1" stroke={berry} strokeWidth="2" />
            <rect x="-5" y="-5" width="10" height="12" rx="4" fill={cream} {...outline} />
        </g>;
        case "cap": return <>
            <path d="M36 43Q37 12 63 10Q91 5 104 26L108 42Z" fill={sky} {...outline} />
            <path d="M65 11q-13 12-12 30m12-30q20 7 24 28" fill="none" stroke={denim} strokeWidth="2" />
            <path d="M52 42q50-8 75 8q-32 12-75-3Z" fill={denim} {...outline} />
            <path d="M53 29h12" stroke={cream} strokeWidth="3" strokeLinecap="round" />
        </>;
        case "crown": return <>
            <path d="m37 19 23 9 15-21 15 21 23-9-8 24H45Z" fill={gold} {...outline} />
            <path d="M45 39h60" stroke={cream} strokeWidth="3" />
            {motif("gem", 75, 31, rose, .62)}
        </>;
        case "flower": return <>
            <path d="M91 49q9-15 25-14q-5 15-25 14Z" fill={mint} {...outline} />
            {motif("flower", 109, 34, rose, 1.25)}
        </>;
        case "halo": return <>
            <ellipse cx="75" cy="11" rx="32" ry="7" fill="none" stroke="#bc9359" strokeWidth="6" />
            <ellipse cx="75" cy="10" rx="31" ry="6" fill="none" stroke="#ffe49c" strokeWidth="3" />
            {motif("star", 113, 19, gold, .34)}
        </>;
        case "party": return <>
            <path d="M50 40 68 10 96 38q-18 9-46 2Z" fill={lilac} {...outline} />
            <path d="m58 27 25 3m-28 5 36 1" stroke={cream} strokeWidth="3" />
            <circle cx="67" cy="9" r="5" fill={rose} {...outline} />
        </>;
        case "star_clip": return <>
            <path d="m96 43 27 5" stroke={berry} strokeWidth="5" strokeLinecap="round" />
            {motif("star", 107, 38, gold, 1.15)}
        </>;
        case "moon_crown": return <>
            <path d="m38 30 18-1 19-12 19 12 18 1-6 13H44Z" fill={plum} {...outline} />
            <path d="M47 37h56" stroke={lilac} strokeWidth="2" />
            {motif("moon", 75, 23, gold, 1.25)}
        </>;
        case "fish_clip": return <g transform="translate(108 40) rotate(12)">
            <path d="M-11 0-21-7v14l10-7Q2-14 14 0Q2 14-11 0Z" fill={sky} {...outline} />
            <path d="M0-7q-4 7 0 14" stroke={denim} strokeWidth="2" fill="none" />
            <circle cx="8" cy="-2" r="2" fill={plum} />
        </g>;
        case "yarn_hat": return <>
            <circle cx="75" cy="11" r="8" fill={cream} {...outline} />
            <path d="M38 39Q39 16 75 15Q110 16 112 39Z" fill={rose} {...outline} />
            <path d="M54 22q-6 6-7 16m20-19-3 20m18-20 3 20m11-17q7 6 8 16" fill="none" stroke={berry} strokeWidth="2" />
            <rect x="34" y="36" width="82" height="10" rx="4" fill="#f7c6d9" {...outline} />
        </>;
        case "carrot_clip": return <g transform="translate(109 36) rotate(31)">
            <path d="M0-6q-12-8-7-12m7 12q0-12 8-13m-8 13q11-6 12-3" fill="none" stroke={leaf} strokeWidth="3" strokeLinecap="round" />
            <path d="M-8-6Q0-12 8-6L2 16Q0 20-3 15Z" fill="#eda067" {...outline} />
            <path d="m-4 1 6 2m-4 4 4 2" stroke={cream} strokeWidth="1.5" />
        </g>;
        case "clover_crown": return <>
            <path d="M37 39q38-14 76 0" fill="none" stroke={leaf} strokeWidth="5" />
            {[46, 65, 85, 104].map((x, index) => <g key={x} transform={`translate(${x} ${index % 2 ? 29 : 32})`}>
                <path d="M0 5C-18 3-9-10-3-5C-5-16 9-16 7-5C17-11 18 5 0 5Z" fill={mint} {...outline} />
                <path d="M0 2v9" stroke={leaf} strokeWidth="2" />
            </g>)}
        </>;
        case "forest_crown": return <>
            <path d="M35 39q40-16 80 0" fill="none" stroke="#a5816a" strokeWidth="6" />
            {motif("leaf", 47, 29, leaf, .8)}
            {motif("leaf", 65, 24, mint, .9)}
            {motif("leaf", 87, 26, leaf, .9)}
            {motif("leaf", 105, 31, mint, .75)}
            <circle cx="74" cy="32" r="3.5" fill={rose} />
            <circle cx="79" cy="36" r="3.5" fill={rose} />
        </>;
        case "cheek_bow": return <g transform="translate(113 95) rotate(-13)">
            <path d="M0 1-17-7l2 16L0 5 17 9l-2-16Z" fill={rose} {...outline} />
            <path d="m0 4-8 10 8-2 5 5 2-12" fill={berry} {...outline} />
            <circle cy="2" r="4" fill={cream} {...outline} />
        </g>;
        case "bamboo_clip": return <g transform="translate(111 38) rotate(-30)">
            <rect x="-6" y="-16" width="12" height="31" rx="4" fill={mint} {...outline} />
            <path d="M-6-6H6M-6 5H6M-2-13v24" fill="none" stroke={leaf} strokeWidth="1.8" />
            <path d="M4-9q12-5 13-14Q5-22 4-9Z" fill={leaf} {...outline} />
        </g>;
        case "bamboo_hat": return <>
            <path d="M22 39Q46 22 75 11Q102 20 128 39Q75 54 22 39Z" fill="#c2d2a4" {...outline} />
            <path d="M33 40q42 9 84 0M48 40l27-25 27 25M64 43l11-28 11 28" fill="none" stroke={leaf} strokeWidth="2" />
            <path d="M41 34q34 7 68 0" fill="none" stroke={cream} strokeWidth="2" />
        </>;
        case "sailor_hat": return <>
            <path d="M44 35Q38 12 75 15Q112 12 106 35L111 44Q75 49 39 44Z" fill={cream} {...outline} />
            <path d="M43 36q32 5 64 0l4 8q-36 5-72 0Z" fill={denim} {...outline} />
            <path d="M75 20v12m-5-8h10m-12 3q2 6 7 6t7-6" fill="none" stroke={denim} strokeWidth="2" strokeLinecap="round" />
        </>;
        case "bubble_crown": return <>
            <path d="M37 39q38-13 76 0" fill="none" stroke={denim} strokeWidth="3" />
            {[[44, 32, 8], [58, 24, 9], [75, 19, 13], [92, 24, 9], [106, 32, 8]].map(([x, y, radius]) => <g key={x}>
                <circle cx={x} cy={y} r={radius} fill={sky} fillOpacity=".64" stroke={denim} strokeWidth="2" />
                <circle cx={x - radius / 3} cy={y - radius / 3} r={radius / 4} fill={cream} />
            </g>)}
        </>;
        case "coral_clip": return <g transform="translate(109 39)">
            <path d="M-11 11 13 14" stroke={plum} strokeWidth="4" strokeLinecap="round" />
            <path d="M0 11V-14M0 1-9-5l-2-8M0-4l9-7m-9 16 11-4 4-6" fill="none" stroke="#cf7f8e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="-8" cy="8" r="3" fill={cream} />
        </g>;
        case "rose_beret": return <>
            <path d="M36 37Q30 23 52 16Q75 3 101 15Q119 24 111 37Q78 48 36 37Z" fill="#cc7a9b" {...outline} />
            <path d="M38 37q40 9 72 0m-33-24 4-7" fill="none" stroke="#975979" strokeWidth="3" strokeLinecap="round" />
            {motif("flower", 94, 28, rose, .68)}
        </>;
        case "straw_hat": return <>
            <path d="M41 35 47 18Q75 5 103 18l6 17" fill="#e6c391" {...outline} />
            <ellipse cx="75" cy="37" rx="55" ry="10" fill="#f0d3a4" {...outline} />
            <path d="M44 29q31 6 62 0l3 7q-34 7-68 0Z" fill={rose} {...outline} />
            <path d="M32 39q43 10 86 0" fill="none" stroke="#ba9568" strokeWidth="1.5" strokeDasharray="3 3" />
        </>;
        case "cloud_beanie": return <>
            <path d="M36 39Q33 24 48 20Q48 10 62 12Q75 0 87 12Q100 9 105 20Q119 24 114 39Z" fill="#d3c5eb" {...outline} />
            <rect x="33" y="36" width="84" height="11" rx="5" fill={cream} {...outline} />
            {motif("cloud", 75, 28, cream, .85)}
        </>;
        case "star_tiara": return <>
            <path d="M38 41q17 0 21-12q9 7 16-7q7 14 16 7q4 12 21 12Q75 47 38 41Z" fill={gold} {...outline} />
            {motif("star", 75, 19, cream, .96)}
            {motif("star", 51, 32, rose, .38)}
            {motif("star", 99, 32, rose, .38)}
        </>;
        case "witch_hat": return <>
            <ellipse cx="75" cy="43" rx="52" ry="8" fill={plum} {...outline} />
            <path d="M42 41C53 31 55 18 66 11Q76 4 95 4Q80 10 84 17Q90 27 108 41Q75 48 42 41Z" fill={plum} {...outline} />
            <path d="M49 33Q75 40 100 33L108 41Q75 48 42 41Z" fill={lilac} {...outline} />
            <rect x="69" y="34" width="12" height="10" rx="2" fill={plum} stroke={gold} strokeWidth="2.5" />
        </>;
        case "sunflower_crown": return <>
            <path d="M35 41q40-16 80 0" stroke={leaf} strokeWidth="5" fill="none" />
            {[45, 65, 85, 105].map((x, i) => <g key={x}>
                {motif("flower", x, i === 0 || i === 3 ? 35 : 28, gold, .77)}
                <circle cx={x} cy={i === 0 || i === 3 ? 35 : 28} r="3.5" fill="#986d54" />
            </g>)}
        </>;
        case "sleep_cap": return <>
            <path d="M43 39Q44 12 74 9Q102 5 115 23l10 13-10 5-15-14 7 12Z" fill="#8e8bc9" {...outline} />
            <path d="M43 37q32 8 64 0l3 9q-35 9-70 0Z" fill="#d9d4ed" {...outline} />
            <circle cx="124" cy="38" r="6" fill={cream} {...outline} />
            {motif("star", 75, 24, gold, .52)}
        </>;
        case "winter_earmuffs": return <>
            <path d="M31 51C32 23 49 12 75 12S118 23 119 51" fill="none" stroke={plum} strokeWidth="8" strokeLinecap="round" />
            <path d="M31 51C32 23 49 12 75 12S118 23 119 51" fill="none" stroke={lilac} strokeWidth="4.5" strokeLinecap="round" />
            <path d="M31 43v10m88-10v10" fill="none" stroke={plum} strokeWidth="5" strokeLinecap="round" />
            {[31, 119].map((x, index) => <g key={x} transform={`translate(${x} 51) rotate(${index === 0 ? 14 : -14})`}>
                <path d="M0-15C5-17 10-12 10-7C14-4 14 3 11 7C11 12 6 16 1 15C-4 17-10 13-11 8C-15 4-14-3-11-7C-11-12-5-16 0-15Z" fill="#e5bde3" {...outline} />
                <ellipse cy="1" rx="7" ry="10" fill="#fae4ee" />
                <path d="M-4-4q3-4 6-3" fill="none" stroke={cream} strokeWidth="2" strokeLinecap="round" />
            </g>)}
        </>;
        case "crystal_circlet": return <>
            <path d="M35 46Q75 22 115 46L111 51Q75 32 39 51Z" fill="#cfa86e" {...outline} />
            <path d="M39 47Q75 27 111 47" fill="none" stroke="#ffe4a2" strokeWidth="2.1" strokeLinecap="round" />
            <path d="M43 42l8-11 9 4m30 0 9-4 8 11" fill="none" stroke="#cfa86e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {motif("gem", 51, 36, sky, .62)}
            {motif("gem", 75, 27, lilac, 1.03)}
            {motif("gem", 99, 36, sky, .62)}
            <path d="m68 34 7 6 7-6" fill="none" stroke="#a77b53" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>;
        case "cherry_blossom_crown": return <>
            <path d="M34 38q42-13 83 0" fill="none" stroke="#a98472" strokeWidth="4" />
            {[43, 60, 76, 93, 108].map((x, i) => <g key={x}>{motif("flower", x, i % 2 ? 25 : 31, i % 2 ? rose : "#f8d4df", .73)}</g>)}
        </>;
        case "moonlit_veil": return <>
            <path d="M75 24C50 21 32 37 28 57C23 78 27 96 14 117Q24 112 33 120Q42 125 50 112C40 100 37 83 41 64C45 43 61 32 75 32C90 32 106 43 110 64C114 83 111 103 101 118Q112 125 120 119Q128 113 139 119C125 98 130 76 124 57C119 37 101 21 75 24Z" fill="#c7b5ea" fillOpacity=".52" stroke="#927eb2" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M57 32C26 53 39 90 24 114m69-82c30 21 18 58 35 84M43 53q-9 21-7 40m74-40q9 21 8 40" fill="none" stroke="#faf0ff" strokeWidth="1.8" strokeLinecap="round" opacity=".8" />
            <path d="M19 115q8-3 16 3t12-4m57 4q8 4 15-1t15 0" fill="none" stroke="#fff1eb" strokeWidth="2" strokeDasharray="2 3" strokeLinecap="round" />
            <path d="M45 39q30-26 60 0" fill="none" stroke={plum} strokeWidth="3.5" strokeLinecap="round" />
            {motif("moon", 75, 27, cream, .87)}
            {motif("star", 32, 84, cream, .32)}
            {motif("star", 120, 92, cream, .35)}
        </>;
        case "dragon_horns": return <>
            <path d="M45 44Q22 33 24 10q8 13 28 14q8 4 10 14m43 6q23-11 21-34q-8 13-28 14q-8 4-10 14" fill="#dfad7f" {...outline} />
            <path d="m34 27 4-6m6 13 4-8m68 1-4-6m-6 13-4-8" stroke={berry} strokeWidth="2" />
            <path d="m60 39 15-13 15 13-15 6Z" fill={mint} {...outline} />
        </>;
        case "aurora_halo": {
            const backRim = "M36 16C43 6 55 5 66 8C80 12 89 3 102 7C109 9 114 11 114 15";
            const frontRim = "C110 24 97 27 85 24C70 20 63 31 49 26C42 24 37 21 36 16";
            const ring = backRim + frontRim;
            return <>
                <path d={ring + "Z"} fill="none" stroke="#756b93" strokeWidth="6.6" strokeLinejoin="round" />
                <path d={ring + "Z"} fill="none" stroke={sky} strokeWidth="4" strokeLinejoin="round" />
                <path d={"M114 15" + frontRim} fill="none" stroke={mint} strokeWidth="4" strokeLinecap="round" />
                <path d="M44 11q8-4 17-2" fill="none" stroke={cream} strokeWidth="1.5" strokeLinecap="round" />
                {motif("star", 30, 22, cream, .36)}
                {motif("star", 121, 14, rose, .42)}
            </>;
        }
        case "butterfly_crown": return <>
            <path d="M36 43q39-18 78 0" fill="none" stroke={leaf} strokeWidth="3" />
            {motif("butterfly", 47, 33, sky, .67)}
            {motif("butterfly", 75, 23, rose, 1)}
            {motif("butterfly", 103, 33, lilac, .67)}
        </>;
        case "pirate_tricorn": return <>
            <path d="M27 53 23 41q14 5 32-11l20-15 20 15q18 16 32 11l-4 12Q75 34 27 53Z" fill="#51475e" {...outline} />
            <path d="M28 46q17 2 31-12l16-12 16 12q14 14 31 12" fill="none" stroke={gold} strokeWidth="2.8" strokeLinecap="round" />
            <path d="M70 34q0-5 5-5t5 5l-2 4h-6Z" fill={cream} />
            <path d="m71 39 8 3m0-3-8 3" stroke={cream} strokeWidth="1.4" strokeLinecap="round" />
        </>;
        case "royal_diadem": return <>
            <path d="M42 47 40 35l18 1 17-19 17 19 18-1-2 12Q75 35 42 47Z" fill="#e7ab62" {...outline} />
            <path d="M47 42q28-9 56 0" fill="none" stroke={cream} strokeWidth="2" strokeLinecap="round" />
            {motif("gem", 75, 30, "#bd6f9e", .8)}
            <circle cx="54" cy="39" r="2.7" fill={sky} />
            <circle cx="96" cy="39" r="2.7" fill={sky} />
        </>;
        case "galaxy_antlers": return <>
            <path d="M49 41 36 30 26 20 24 9m12 21 1-16m-8 9-10 2m82 16 13-11 10-10 2-11m-12 21-1-16m8 9 10 2" fill="none" stroke={plum} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M41 38q34-11 68 0" fill="none" stroke={denim} strokeWidth="5" />
            {motif("star", 75, 27, gold, .72)}
            {motif("star", 29, 10, sky, .34)}
            {motif("star", 121, 10, sky, .34)}
        </>;
        case "phoenix_plume": return <>
            <path d="M65 41Q41 22 59 11q-1 11 10 13Q66 10 83 5q-3 10 6 14l9-7q10 21-21 30Z" fill="#e8916f" {...outline} />
            <path d="M75 37q-11-11 7-23q-3 8 8 8q-5 9-15 15Z" fill={gold} />
            <path d="M49 41q26-8 52 0" fill="none" stroke={berry} strokeWidth="5" strokeLinecap="round" />
        </>;
        default: return null;
    }
}

/*
 * DOCU: Draw a pair of fitted lenses with a bridge and short temple arms.
 * @param {string} shape - Left lens path in pet coordinates
 * @param {string} color - Lens tint
 * @param {string} frame - Frame and bridge color
 * @param {number} opacity - Transparency of the lenses
 * @returns {ReactNode} - Mirrored SVG lenses and frames
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function pairedLenses(shape: string, color: string, frame: string, opacity = .42) {
    return <g stroke={frame} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="m34 71-9-4m91 4 9-4M70 73q5-5 10 0" fill="none" />
        <path d={shape} fill={color} fillOpacity={opacity} />
        <path d={shape} transform="translate(150 0) scale(-1 1)" fill={color} fillOpacity={opacity} />
        <path d="m41 73 6-5m45 5 6-5" stroke="#fff9f3" strokeWidth="2" opacity=".76" />
    </g>;
}

/*
 * DOCU: Select a distinct frame, mask, goggle, or lens shape for the equipped eyewear.
 * @param {string | null} id - Equipped eyewear ID
 * @returns {ReactNode} - Artwork aligned to the pet's eyes
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function eyeArt(id: string | null): ReactNode {
    const rectangular = "M38 63h27q5 0 5 6v11q0 8-8 8H44q-10 0-10-9V69q0-6 4-6Z";
    const round = "M34 75a20 16 0 1 0 40 0a20 16 0 1 0-40 0Z";
    const heart = "M34 68q10-12 19-1q9-11 19 1q-2 14-19 23Q36 82 34 68Z";
    const catEye = "M32 61q21 7 38 5q4 11-6 19q-22 8-32-24Z";
    switch (id) {
        case "glasses": return pairedLenses(rectangular, "#c7e3e9", "#624d69", .16);
        case "heart_shades": return pairedLenses(heart, "#df91bc", "#8f557c", .86);
        case "round_specs": return pairedLenses(round, "#e4d7ef", "#9173a0", .24);
        case "blue_goggles": return <>
            <path d="M27 72q4-3 11-2m74 0q7-1 11 2" fill="none" stroke={denim} strokeWidth="4.5" strokeLinecap="round" />
            <path d="M68 74q7-7 14 0" fill="none" stroke="#507797" strokeWidth="5" strokeLinecap="round" />
            {[55, 95].map(x => <g key={x}>
                <ellipse cx={x} cy="75" rx="14" ry="10.5" fill="#c6ecf3" fillOpacity=".23" />
                <ellipse cx={x} cy="75" rx="15" ry="11.5" fill="none" stroke="#507797" strokeWidth="5.5" />
                <ellipse cx={x} cy="75" rx="15" ry="11.5" fill="none" stroke={denim} strokeWidth="3" />
                <path d={`M${x - 8} 72q2-3 5-4m-6 8 1-2`} fill="none" stroke="#fff8ef" strokeWidth="1.6" strokeLinecap="round" />
            </g>)}
        </>;
        case "sleep_mask": return <>
            <path d="M24 73h102" stroke={lilac} strokeWidth="7" strokeLinecap="round" />
            <path d="M36 62Q52 54 75 64Q98 54 114 62q8 15-3 24q-15 10-36-2q-21 12-36 2q-11-9-3-24Z" fill={plum} {...outline} />
            <path d="M45 74q8 9 17 0m26 0q9 9 17 0" fill="none" stroke={cream} strokeWidth="2.5" strokeLinecap="round" />
            {motif("moon", 75, 73, gold, .44)}
        </>;
        case "monocle": return <>
            <path d="M110 84c13 5 16 16 7 25q-6 7-14 4" fill="none" stroke="#866451" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M110 84c13 5 16 16 7 25q-6 7-14 4" fill="none" stroke="#f4ce86" strokeWidth="2" strokeDasharray="2.2 2.8" strokeLinecap="round" />
            <circle cx="95" cy="75" r="16.5" fill="#e5f0f2" fillOpacity=".18" stroke="#866451" strokeWidth="4.5" />
            <circle cx="95" cy="75" r="16.5" fill="none" stroke="#e5b869" strokeWidth="2.5" />
            <path d="M83 66a15 15 0 0 1 13-6m-10 13 5-7m-6 12 2-2" fill="none" stroke={cream} strokeWidth="1.6" strokeLinecap="round" />
            <rect x="109" y="81" width="7" height="6" rx="2.2" fill={gold} stroke="#866451" strokeWidth="1.6" transform="rotate(24 112.5 84)" />
            <circle cx="103" cy="113" r="2.5" fill={gold} stroke="#866451" strokeWidth="1.4" />
        </>;
        case "butterfly_glasses": return pairedLenses("M34 62q19-9 30 8q9 6 4 13q-8 8-16 3q-16-5-18-24Z", rose, berry, .58);
        case "aviators": return <>
            {pairedLenses("M33 64q21-4 38 0q2 14-9 24q-16 5-25-10Z", "#8795b4", "#78657d", .72)}
            <path d="M67 64h16" fill="none" stroke="#78657d" strokeWidth="2.5" />
        </>;
        case "cat_eye_frames": return pairedLenses(catEye, "#e3b0d5", "#a04c7b", .28);
        case "starlight_specs": return <>
            {pairedLenses("m53 58 6 10 13 2-9 9 2 11-12-5-11 5 2-11-9-9 12-2Z", lilac, "#8471b2", .46)}
            {motif("star", 31, 59, gold, .34)}
            {motif("star", 119, 60, gold, .34)}
        </>;
        case "pixel_shades": return pairedLenses("M32 63h40v12h-6v7h-7v6H44v-6h-7v-7h-5Z", "#6e658a", "#50465e", .92);
        case "rose_gold_glasses": return <>
            {pairedLenses("M34 68q5-9 18-9q14 0 20 11l-4 13q-14 10-29 0Z", "#f2c0b7", "#bd806f", .25)}
            <circle cx="34" cy="65" r="2.5" fill={gold} />
            <circle cx="116" cy="65" r="2.5" fill={gold} />
        </>;
        case "emerald_goggles": return <>
            <path d="M24 73h102" stroke={leaf} strokeWidth="8" strokeLinecap="round" />
            {pairedLenses("m35 63 13-5 18 5 6 12-8 13H43l-10-12Z", "#92d4bd", "#548778", .68)}
            <path d="M41 82h12m44 0h12" stroke={cream} strokeWidth="2" />
        </>;
        case "snowflake_lenses": return <>
            {pairedLenses("m37 66 14-8 15 5 7 12-7 11-15 5-14-8-5-8Z", "#b9e1f4", "#86a8c8", .37)}
            {motif("snow", 40, 60, "#77a5c8", .53)}
            {motif("snow", 110, 60, "#77a5c8", .53)}
        </>;
        case "cyber_visor": return <>
            <path d="M28 64q46-11 94 0l-6 24-24 4-17-7-17 7-24-4Z" fill="#66668f" {...outline} />
            <path d="m34 71 21-4 20 3 20-3 21 4" fill="none" stroke="#a3e4d3" strokeWidth="4" strokeLinecap="round" />
            <path d="M39 79h12m49 0h12" stroke={lilac} strokeWidth="2" />
        </>;
        case "nebula_shades": return <>
            {pairedLenses("M33 64q17-9 34 0q9 8 2 18q-11 11-29 3Z", "#7770a6", plum, .94)}
            <path d="M38 80q16-13 29-8m17 8q16-13 29-8" fill="none" stroke="#dfa8d9" strokeWidth="3" />
            {motif("star", 62, 67, cream, .28)}
            {motif("star", 97, 81, cream, .28)}
        </>;
        case "royal_mask": return <g>
            <path d="M26 62 39 47l17 12 19 5 19-5 17-12 13 15-10 27q-19 12-39-3q-20 15-39 3Z M40 72q10-10 23 0q-9 12-20 7Zm47 0q13-10 23 0l-3 7q-11 5-20-7Z" fill={plum} fillRule="evenodd" stroke={gold} strokeWidth="2.5" strokeLinejoin="round" />
            {motif("gem", 75, 64, rose, .54)}
        </g>;
        case "prismatic_monocle": return <>
            <path d="M113 85q15 7 9 21q-4 10-13 10" fill="none" stroke={plum} strokeWidth="2.8" strokeLinecap="round" />
            <path d="M113 85q15 7 9 21q-4 10-13 10" fill="none" stroke={lilac} strokeWidth="1.5" strokeDasharray="2 3" strokeLinecap="round" />
            <path d="M95 53 110 58 117 68V82L109 92 95 97 81 92 73 82V68L80 58Z" fill="#dbeff6" fillOpacity=".23" stroke={plum} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="m95 53 15 5 7 10-6 2-5-7-11-4Z" fill={rose} />
            <path d="M117 68V82l-8 10-4-5 6-7V70Z" fill={sky} />
            <path d="m109 92-14 5-14-5 4-5 10 4 10-4Z" fill={lilac} />
            <path d="M81 92 73 82V68l7-10 4 5-5 7v10l6 7Z" fill={mint} />
            <path d="m80 58 15-5v6l-11 4Z" fill={gold} />
            <path d="m95 59 11 4 5 7v10l-6 7-10 4-10-4-6-7V70l5-7Z" fill="none" stroke="#fff1ed" strokeWidth="1.1" strokeLinejoin="round" />
            <path d="m85 73 5-6m-6 11 2-2m16 9 4-4" fill="none" stroke="#fffaf4" strokeWidth="1.8" strokeLinecap="round" />
            {motif("gem", 109, 115, rose, .36)}
        </>;
        default: return null;
    }
}

/*
 * DOCU: Draw the fitted neckline of a collar or scarf.
 * @param {string} color - Fabric or leather color
 * @param {number} width - Width of the band
 * @returns {ReactNode} - Curved band with an outlined edge
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function neckBand(color: string, width = 6) {
    return <>
        <path d="M42 111q33 18 66 0" fill="none" stroke="#76586e" strokeWidth={width + 2} strokeLinecap="round" />
        <path d="M42 111q33 18 66 0" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
    </>;
}

/*
 * DOCU: Draw a scarf with a folded front band and a short tail.
 * @param {string} color - Main scarf color
 * @param {string} trim - Accent color on the fold and tail
 * @param {ReactNode} detail - Optional fabric pattern
 * @returns {ReactNode} - The fitted scarf artwork
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function scarfArt(color: string, trim: string, detail?: ReactNode) {
    return <>
        <path d="M93 119q14-3 17-8l12 29-15 5Z" fill={trim} {...outline} />
        <path d="M40 108q35 16 70 0l-5 15q-30 13-60 0Z" fill={color} {...outline} />
        <path d="M47 115q27 12 55 0m6 21 9-3" fill="none" stroke={cream} strokeWidth="2" />
        {detail}
    </>;
}

/*
 * DOCU: Select the pendant, scarf, collar, or other artwork worn at the neckline.
 * @param {string | null} id - Equipped neck accessory ID
 * @returns {ReactNode} - Neck accessory artwork
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function neckArt(id: string | null): ReactNode {
    switch (id) {
        case "scarf": return scarfArt(lilac, "#9b82c4");
        case "pearl_necklace": return <>
            {neckBand("#d4b39e", 2)}
            {[43, 53, 64, 75, 86, 97, 107].map((x, i) => <circle key={x} cx={x} cy={120 - Math.abs(3 - i) * 2.6} r={i === 3 ? 6 : 4.4} fill={cream} stroke="#c29aae" strokeWidth="1.4" />)}
        </>;
        case "rainbow_scarf": return scarfArt(rose, sky, <>
            <path d="M46 119q29 12 58 0" fill="none" stroke={gold} strokeWidth="2.5" />
            <path d="M50 123q25 10 50 0" fill="none" stroke={mint} strokeWidth="2.5" />
            <path d="m107 130 9-3m-7 8 9-3" stroke={lilac} strokeWidth="2" />
        </>);
        case "bone_tag": return <>
            {neckBand("#bd8b84")}
            <path d="M69 128q-8-7-12-1q-4 7 4 8q-2 8 5 8q4 0 6-5h7q2 5 6 5q7 0 5-8q8-1 4-8q-4-6-12 1Z" fill={cream} {...outline} />
            <path d="M72 133h8" stroke={gold} strokeWidth="2" />
        </>;
        case "puppy_bandana": return <>
            <path d="M40 110q35 10 70 0l-11 15-24 19-24-19Z" fill="#dc8196" {...outline} />
            <path d="m51 119 24 17 24-17" fill="none" stroke={cream} strokeWidth="2" strokeDasharray="3 3" />
            {motif("heart", 75, 125, cream, .42)}
        </>;
        case "seed_pouch": return <>
            {neckBand("#af8274", 4)}
            <path d="M65 122q10-5 20 0l4 13q-2 9-14 9t-14-9Z" fill="#dfb88c" {...outline} />
            <path d="M65 122h20m-10 0 4-5m-4 5-5-5" stroke="#9d705f" strokeWidth="2" strokeLinecap="round" />
            {motif("leaf", 75, 133, mint, .58)}
        </>;
        case "ice_scarf": return scarfArt("#9bd2e8", "#79b7d3", motif("snow", 100, 117, cream, .52));
        case "heart_collar": return <>
            {neckBand("#c7779e", 8)}
            {motif("heart", 75, 130, rose, .9)}
            <path d="m69 127 4-3" stroke={cream} strokeWidth="2" strokeLinecap="round" />
        </>;
        case "gold_chain": return <>
            {neckBand("#a58061", 2)}
            {[45, 55, 65, 75, 85, 95, 105].map((x, i) => <ellipse key={x} cx={x} cy={126 - Math.abs(3 - i) * 3.5} rx="6" ry="3.5" fill="none" stroke={gold} strokeWidth="2.6" transform={`rotate(${(3 - i) * 10} ${x} ${126 - Math.abs(3 - i) * 3.5})`} />)}
        </>;
        case "bow_tie": return <>
            {neckBand(plum, 4)}
            <path d="m75 122-24-8 3 18 21-6 21 6 3-18Z" fill="#aa83c5" {...outline} />
            <path d="m57 119 12 4m24-4-12 4" stroke={cream} strokeWidth="1.5" />
            <rect x="69" y="118" width="12" height="11" rx="4" fill={lilac} {...outline} />
        </>;
        case "cherry_necklace": return <>
            {neckBand("#b6a287", 3)}
            <path d="M75 123q0 9-8 11m8-11q0 9 8 11" fill="none" stroke={leaf} strokeWidth="2.5" />
            {motif("leaf", 80, 123, mint, .34)}
            <circle cx="67" cy="136" r="6" fill="#d87291" {...outline} />
            <circle cx="83" cy="136" r="6" fill="#dc809c" {...outline} />
            <path d="M65 133h1m15 0h1" stroke={cream} strokeWidth="2" strokeLinecap="round" />
        </>;
        case "star_pendant": return <>
            {neckBand("#9c86bb", 3)}
            {motif("star", 75, 133, gold, .98)}
        </>;
        case "cozy_muffler": return scarfArt("#bf8caa", "#a36d90", <>
            <path d="m53 114 2 13m10-10 1 13m10-12v13m10-13-1 12m10-14-2 11m12 10 3 8m4-11 3 9" fill="none" stroke="#e9bfd4" strokeWidth="2" />
        </>);
        case "bell_collar": return <>
            {neckBand(leaf, 7)}
            <path d="M65 137q4-3 4-8q0-6 6-6t6 6q0 5 4 8Z" fill={gold} {...outline} />
            <path d="M67 137h16m-10 4q2 4 4 0" fill="none" stroke="#9f735d" strokeWidth="2" strokeLinecap="round" />
        </>;
        case "moon_choker": return <>
            {neckBand(plum, 5)}
            {motif("moon", 75, 130, cream, .92)}
        </>;
        case "emerald_pendant": return <>
            {neckBand("#c7a476", 3)}
            {motif("gem", 75, 132, "#71b593", 1.02)}
        </>;
        case "flower_garland": return <>
            {neckBand(leaf, 4)}
            {[45, 60, 75, 90, 105].map((x, i) => <g key={x}>{motif("flower", x, 126 - Math.abs(2 - i) * 4, i % 2 ? cream : rose, .64)}</g>)}
        </>;
        case "silk_cravat": return <>
            <path d="M45 108q30 13 60 0l-7 10-16 9 7 12-12-5-15 8 4-16-15-8Z" fill={cream} {...outline} />
            <path d="m60 118 15 6 15-6m-15 6-5 12" fill="none" stroke="#bb92b3" strokeWidth="2" />
        </>;
        case "pearl_choker": return <>
            {neckBand("#b795c4", 6)}
            {[45, 55, 65, 75, 85, 95, 105].map((x, i) => <circle key={x} cx={x} cy={120 - Math.abs(3 - i) * 2.2} r="3.6" fill="#fff3ec" stroke="#b991ae" strokeWidth="1" />)}
            {motif("gem", 75, 129, sky, .48)}
        </>;
        case "sun_medallion": return <>
            {neckBand("#b99172", 3)}
            <path d="m75 121 4 5 6-1-1 6 5 4-6 3v6l-6-2-5 5-3-6-6-1 3-5-4-5 6-2 1-6Z" fill={gold} {...outline} />
            <circle cx="75" cy="135" r="5" fill="#f8da91" stroke="#b5805b" strokeWidth="1.6" />
        </>;
        case "frost_necklace": return <>
            {neckBand("#8fbad8", 3)}
            {motif("gem", 55, 121, "#b0dced", .44)}
            {motif("snow", 75, 132, "#7fb1d0", 1)}
            {motif("gem", 95, 121, "#b0dced", .44)}
        </>;
        case "royal_sash": return <>
            <path d="M48 108 62 113q20 20 39 22l-13 10q-23-6-44-29Z" fill="#a67bbb" {...outline} />
            <path d="M49 111q19 22 44 27" fill="none" stroke={gold} strokeWidth="2.5" />
            {motif("star", 78, 131, gold, .56)}
        </>;
        case "cosmic_locket": return <>
            {neckBand("#8271a9", 3)}
            <ellipse cx="75" cy="132" rx="10" ry="12" fill="#706496" stroke={gold} strokeWidth="2.2" />
            <path d="M69 134q6-10 12-3q-3 9-8 5" fill="none" stroke={sky} strokeWidth="1.7" />
            <circle cx="79" cy="127" r="1.8" fill={cream} />
        </>;
        case "phoenix_pendant": return <>
            {neckBand("#bd8c72", 3)}
            {motif("flame", 75, 132, "#e99b78", .99)}
            <path d="M75 139q-6-4 1-10q-1 4 4 4q0 4-5 6Z" fill={gold} />
        </>;
        default: return null;
    }
}

/*
 * DOCU: Draw a fitted garment base and its front details in the pet's torso area.
 * @param {string} shape - Outline of the garment
 * @param {string} fill - Main fabric or armor color
 * @param {ReactNode} detail - Seams, trim, or details unique to the garment
 * @returns {ReactNode} - The garment silhouette and details
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function garment(shape: string, fill: string, detail: ReactNode) {
    return <>
        <path d={shape} fill={fill} {...outline} />
        {detail}
    </>;
}

/*
 * DOCU: Fit sleeves to the sides of the pet's round torso with short, tucked cuffs.
 * @param {string} fill - Main fabric color
 * @param {ReactNode} detail - Front details for the specific garment
 * @returns {ReactNode} - Fitted garment artwork with curved sleeve seams
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function sleevedGarment(fill: string, detail: ReactNode) {
    const shape = "M49 102Q75 97 101 102C108 108 111 115 110 122C108 136 94 141 75 142C56 141 42 136 40 122C39 115 42 108 49 102Z";
    return garment(shape, fill, <>
        <path d="M44 122q3 3 6 3m56-3q-3 3-6 3M50 119q-2 4-2 9m52-9q2 4 2 9" fill="none" stroke="#76586e" strokeWidth="1.7" strokeLinecap="round" opacity=".65" />
        {detail}
    </>);
}

/*
 * DOCU: Draw the equipped clothing with its own cut and material details.
 * @param {string | null} id - Equipped clothes ID
 * @returns {ReactNode} - Artwork fitted behind the pet's head
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function clothesArt(id: string | null): ReactNode {
    const fitted = "M43 105Q75 97 107 105Q118 116 113 132Q105 145 75 145Q45 145 37 132Q32 116 43 105Z";
    const cape = "M43 103Q75 94 107 103Q131 113 137 137Q121 145 103 138Q75 152 47 138Q29 145 13 137Q19 113 43 103Z";
    const dress = "M47 102h56l-3 17 20 19q-9 7-22 6q-12 6-23 0q-11 6-23 0q-13 1-22-6l20-19Z";
    switch (id) {
        case "leaf_cape": return garment("M44 105Q21 111 14 137q16-4 33-3q9 11 28 13q19-2 28-13q17-1 33 3q-7-26-30-32Z", leaf, <>
            <path d="M75 105v41m0-13L53 121m22 17 25-16m-48 12-18-7m64 7 18-7" fill="none" stroke="#cce3bc" strokeWidth="2.5" strokeLinecap="round" />
        </>);
        case "pink_hoodie": return sleevedGarment("#e5a0bc", <>
            <path d="M45 107q30 23 60 0M63 119l-3 11m26-11 4 11" fill="none" stroke="#f8d7e6" strokeWidth="3" strokeLinecap="round" />
            <path d="m62 132-5 6q18 6 36 0l-5-6Z" fill="#c97c9e" {...outline} />
        </>);
        case "denim_overalls": return garment(fitted, sky, <>
            <path d="M48 105h11l4 20h24l4-20h11l-4 22 7 13q-30 9-60 0l7-13Z" fill={denim} {...outline} />
            <path d="M66 129h18v8l-9 3-9-3Z" fill="#a7c7dd" stroke="#547797" strokeWidth="1.6" />
            <circle cx="58" cy="125" r="3.2" fill={gold} />
            <circle cx="92" cy="125" r="3.2" fill={gold} />
        </>);
        case "flower_dress": return garment(dress, "#edb6ce", <>
            <path d="M48 122q27 7 54 0" fill="none" stroke={berry} strokeWidth="3" />
            <path d="M48 136q27 7 54 0" fill="none" stroke={cream} strokeWidth="2" strokeDasharray="2 3" />
            {motif("flower", 57, 133, cream, .53)}
            {motif("flower", 75, 137, rose, .53)}
            {motif("flower", 94, 133, cream, .53)}
        </>);
        case "raincoat": return sleevedGarment("#ecca73", <>
            <path d="M43 112q32 18 64 0m-31 9v20" fill="none" stroke="#a87c59" strokeWidth="2.5" />
            <path d="M82 125h1m-1 7h1m-1 7h1" stroke={cream} strokeWidth="3.5" strokeLinecap="round" />
            <path d="m52 128 12 3-2 6-12-3Z" fill={cream} opacity=".68" />
        </>);
        case "sailor_top": return sleevedGarment("#a8c9e1", <>
            <path d="M45 107q30 20 60 0l-13 18-17 7-17-7Z" fill={cream} {...outline} />
            <path d="m58 121 17 8 17-8m-47 16q30 8 60 0" fill="none" stroke={denim} strokeWidth="2.5" />
            <path d="m75 127-6 10 6-2 6 2Z" fill={rose} {...outline} />
        </>);
        case "striped_sweater": return sleevedGarment("#b592c9", <>
            <path d="M49 123q26 9 52 0m-53 8q27 10 54 0" fill="none" stroke="#f8dbe7" strokeWidth="3.5" />
            <path d="M52 137v4m9-3v4m9-3v4m10-4v4m10-5v4m9-5v4" stroke={plum} strokeWidth="1.5" />
        </>);
        case "royal_cape": return garment(cape, "#8b79b7", <>
            <path d="M22 135q16-6 23-16m83 16q-16-6-23-16M47 135q28 13 56 0" fill="none" stroke={gold} strokeWidth="3" />
            <path d="M62 119q13 9 26 0" fill="none" stroke={cream} strokeWidth="4" />
            {motif("gem", 75, 131, gold, .66)}
        </>);
        case "cloud_pajamas": return sleevedGarment("#b9d4ec", <>
            <path d="M75 116v27" stroke={denim} strokeWidth="2" />
            <path d="M77 124h2m-2 6h2m-2 6h2" stroke={cream} strokeWidth="3" strokeLinecap="round" />
            {motif("cloud", 54, 128, cream, .52)}
            {motif("cloud", 96, 134, "#e7e3f4", .57)}
        </>);
        case "autumn_vest": return garment("M45 104 58 102l17 20 17-20 13 2q0 9 10 16l-7 21q-33 9-66 0l-7-21q10-7 10-16Z", "#ba896a", <>
            <path d="M57 107l18 20 18-20m-18 20v17" fill="none" stroke={cream} strokeWidth="2.7" />
            <path d="M52 131h12m22 0h12" stroke="#8c665a" strokeWidth="2.5" />
            <circle cx="79" cy="135" r="2.5" fill={gold} />
        </>);
        case "starry_jacket": return sleevedGarment("#7b77ad", <>
            <path d="M75 116v26M45 135l12-6m48 6-12-6" fill="none" stroke={lilac} strokeWidth="3" />
            {motif("star", 53, 123, gold, .52)}
            {motif("star", 98, 130, cream, .4)}
        </>);
        case "strawberry_cardigan": return sleevedGarment("#d995a9", <>
            <path d="M75 118v26m-25-26 4 21m46-21-4 21" fill="none" stroke="#f6c9d5" strokeWidth="2.8" />
            <path d="M77 124h1m-1 7h1m-1 7h1" stroke={cream} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M53 130q-1-6 6-6t6 6q-6 13-12 0Zm32 0q-1-6 6-6t6 6q-6 13-12 0Z" fill="#c96c8a" {...outline} />
            <path d="m55 125 4 2 4-2m24 0 4 2 4-2" stroke={leaf} strokeWidth="2.5" />
        </>);
        case "forest_cloak": return garment(cape, "#628b7b", <>
            <path d="M23 134q14-4 23-13m81 13q-14-4-23-13M48 135q27 11 54 0" fill="none" stroke={mint} strokeWidth="2" strokeDasharray="3 3" />
            {motif("leaf", 75, 127, "#c7d69f", .87)}
        </>);
        case "moonlight_kimono": return sleevedGarment("#9a91c5", <>
            <path d="M49 110l33 30m19-30-29 27" stroke={cream} strokeWidth="5" />
            <path d="M46 130q29 8 58 0l-2 7q-27 8-54 0Z" fill={plum} {...outline} />
            {motif("moon", 75, 135, gold, .52)}
        </>);
        case "dragon_armor": return garment(fitted, "#6b978b", <>
            <path d="m40 118 16-6 9 10 10-7 10 7 9-10 16 6-8 20-27 8-27-8Z" fill="#9bc2a4" {...outline} />
            <path d="m47 125 9 8 9-8 10 10 10-10 9 8 9-8m-44 12 7 5 9-6 9 6 7-5" fill="none" stroke="#628678" strokeWidth="2.5" />
            {motif("gem", 75, 126, gold, .44)}
        </>);
        case "aurora_dress": return garment(dress, "#b8c6e9", <>
            <path d="M36 136q24-1 35-9q19-11 43 10M45 141q20 0 30-8q13-7 30 7" fill="none" stroke={mint} strokeWidth="4" />
            <path d="M54 123q21 7 42 0" fill="none" stroke={rose} strokeWidth="3" />
            {motif("star", 89, 138, cream, .41)}
        </>);
        case "butterfly_cape": return <>
            <path d="M75 119Q35 92 21 111Q14 123 42 133Q21 145 44 146Q60 145 75 132Q90 145 106 146Q129 145 108 133Q136 123 129 111Q115 92 75 119Z" fill="#cb9acb" {...outline} />
            <path d="M29 115q18 2 35 14m57-14q-18 2-35 14m-38 8 15-7m39 7-15-7" fill="none" stroke="#f2d3e9" strokeWidth="2.6" />
            <path d="M67 124q8-7 16 0l-3 17H70Z" fill={plum} {...outline} />
        </>;
        case "pirate_coat": return sleevedGarment("#72637d", <>
            <path d="m51 116 13 10-6 15m41-25-13 10 6 15" fill="none" stroke={gold} strokeWidth="3" />
            <path d="M49 135q26 5 52 0" fill="none" stroke="#4e415a" strokeWidth="5" />
            <rect x="69" y="131" width="12" height="10" rx="2" fill="none" stroke={gold} strokeWidth="2.6" />
        </>);
        case "royal_uniform": return sleevedGarment("#816aa4", <>
            <path d="M41 119q4-4 11-5m57 5q-4-4-11-5" fill="none" stroke={gold} strokeWidth="5" strokeLinecap="round" />
            <path d="m58 120 35 20m-29-21 33 18" stroke="#e1a4c6" strokeWidth="3" />
            <path d="M60 135h1m-1 6h1m27-13h1" stroke={gold} strokeWidth="4" strokeLinecap="round" />
        </>);
        case "galaxy_robe": return garment(cape, "#74699f", <>
            <path d="M29 135q19-15 41-8q30 10 48-4" fill="none" stroke="#ad95ce" strokeWidth="4" />
            {motif("moon", 75, 134, sky, .7)}
            {motif("star", 39, 132, cream, .36)}
            {motif("star", 109, 134, gold, .39)}
        </>);
        case "phoenix_armor": return garment(fitted, "#a96571", <>
            <path d="m39 118 20 3 16 13 16-13 20-3-12 19-24 10-24-10Z" fill="#df9e78" {...outline} />
            <path d="m45 123 16 5 14 14 14-14 16-5m-54 12 11 2m37-2-11 2" fill="none" stroke={gold} strokeWidth="2.5" />
            {motif("flame", 75, 130, "#ffe1a2", .65)}
        </>);
        default: return null;
    }
}

type OutfitArtworkProps = { outfit: Outfit } & (
    { layer: "body"; bareTorso: ReactNode } |
    { layer: "front" }
);

/*
 * DOCU: Use clothing as the torso silhouette when equipped and draw accessories in front of the face.
 * @param {OutfitArtworkProps} props - Equipped items, the drawing layer, and bare torso artwork for the body layer
 * @returns {ReactNode} - The SVG group for that layer, or null if it has no items
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function OutfitArtwork(props: OutfitArtworkProps) {
    const { outfit } = props;
    if (props.layer === "body") {
        const clothing = clothesArt(outfit.clothes);
        return clothing ? <g className="pawpal-outfit">{clothing}</g> : props.bareTorso;
    }
    if (!outfit.head && !outfit.eyes && !outfit.neck) {
        return null;
    }
    return <g className="pawpal-outfit">
        {neckArt(outfit.neck)}
        {eyeArt(outfit.eyes)}
        {headArt(outfit.head)}
    </g>;
}
