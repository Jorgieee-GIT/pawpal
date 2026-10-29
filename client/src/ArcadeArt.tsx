import type { ReactNode } from 'react';

/** Artwork shared by the arcade canvas and its on-screen jump instruction. */
export const arcadeSpriteSrc = (document: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(document)}`;

const svgDocument = (content: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 118" width="100" height="118">${content}</svg>`;

const cactusStem = (fill: string, x: number, y: number, width: number, height: number) => `
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${width / 2}" fill="${fill}" stroke="#548b70" stroke-width="3" />
    <path d="M${x + width * 0.34} ${y + 8}V${y + height - 9}" stroke="#c4e7bd" stroke-width="3" stroke-linecap="round" opacity=".85" />
`;

const cactusSpikes = (points: Array<[number, number, number]>) => points.map(([x, y, direction]) => `
    <path d="M${x} ${y}l${direction * 8} -5l${-direction * 3} 10Z" fill="#f6e8bb" stroke="#548b70" stroke-width="1.3" stroke-linejoin="round" />
`).join('');

export const CACTUS_ART = [
    svgDocument(`
        <ellipse cx="51" cy="110" rx="38" ry="6" fill="#9cbaa2" opacity=".45" />
        ${cactusStem('#82c7a0', 39, 18, 24, 90)}
        <path d="M42 77H30Q22 77 22 67V50" fill="none" stroke="#548b70" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M60 64H71Q79 64 79 55V39" fill="none" stroke="#548b70" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M42 77H30Q22 77 22 67V50M60 64H71Q79 64 79 55V39" fill="none" stroke="#8fd3a9" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
        ${cactusSpikes([[39, 37, -1], [63, 30, 1], [39, 57, -1], [63, 83, 1], [22, 55, -1], [79, 47, 1]])}
        <path d="M46 25l5 -12l5 12" fill="#f7e8b5" stroke="#548b70" stroke-width="2" />
    `),
    svgDocument(`
        <ellipse cx="50" cy="110" rx="43" ry="6" fill="#9cbaa2" opacity=".45" />
        ${cactusStem('#87caaa', 20, 41, 23, 68)}
        ${cactusStem('#75bea0', 57, 11, 24, 98)}
        <path d="M22 72H14Q10 72 10 62V52M79 68H87Q91 68 91 57V47" fill="none" stroke="#548b70" stroke-width="13" stroke-linecap="round" />
        <path d="M22 72H14Q10 72 10 62V52M79 68H87Q91 68 91 57V47" fill="none" stroke="#9ed6b6" stroke-width="8" stroke-linecap="round" />
        ${cactusSpikes([[20, 53, -1], [43, 63, 1], [57, 31, -1], [81, 38, 1], [57, 80, -1], [81, 91, 1]])}
    `),
    svgDocument(`
        <ellipse cx="51" cy="111" rx="40" ry="6" fill="#9cbaa2" opacity=".45" />
        ${cactusStem('#86c5a0', 32, 34, 36, 76)}
        <path d="M35 82H23Q16 82 16 72V58M66 68H78Q85 68 85 58V50" fill="none" stroke="#548b70" stroke-width="14" stroke-linecap="round" />
        <path d="M35 82H23Q16 82 16 72V58M66 68H78Q85 68 85 58V50" fill="none" stroke="#9dd9b0" stroke-width="9" stroke-linecap="round" />
        ${cactusSpikes([[32, 52, -1], [68, 46, 1], [32, 75, -1], [68, 92, 1], [16, 63, -1], [85, 56, 1]])}
        <path d="M38 36Q32 22 43 20L50 10L57 20Q69 23 62 36" fill="#f5b5cf" stroke="#b47c97" stroke-width="2" />
        <circle cx="49" cy="26" r="5" fill="#ffe8a2" />
    `)
];

const vehicleDocument = (body: string) => svgDocument(`
    <ellipse cx="50" cy="111" rx="36" ry="6" fill="#76657e" opacity=".22" />
    ${body}
`);

export const VEHICLE_ART = [
    // Bubblegum city car: narrow silhouette, rounded bonnet and circular lamps.
    vehicleDocument(`
        <rect x="18" y="35" width="64" height="70" rx="20" fill="#e99ab5" stroke="#926d88" stroke-width="3.5" />
        <path d="M29 38Q30 19 50 19Q70 19 71 38V47H29Z" fill="#cfe8ed" stroke="#926d88" stroke-width="3" />
        <path d="M29 60H71" stroke="#f7c7d7" stroke-width="4" />
        <rect x="24" y="68" width="52" height="17" rx="7" fill="#f7c6d8" />
        <circle cx="28" cy="95" r="6" fill="#fff1ba" stroke="#926d88" stroke-width="2" />
        <circle cx="72" cy="95" r="6" fill="#fff1ba" stroke="#926d88" stroke-width="2" />
        <rect x="36" y="98" width="28" height="7" rx="3" fill="#fff6fb" />
    `),
    // Mint delivery van: square roof, cargo roof rack and rectangular windscreen.
    vehicleDocument(`
        <rect x="16" y="16" width="68" height="91" rx="10" fill="#89cdbb" stroke="#5f9088" stroke-width="3.5" />
        <rect x="23" y="25" width="54" height="32" rx="5" fill="#c8ebef" stroke="#5f9088" stroke-width="3" />
        <path d="M49 25V57M23 66H77" stroke="#5f9088" stroke-width="3" />
        <rect x="28" y="72" width="44" height="18" rx="4" fill="#c0e6d2" />
        <rect x="23" y="94" width="17" height="8" rx="3" fill="#ffe7a7" />
        <rect x="60" y="94" width="17" height="8" rx="3" fill="#ffe7a7" />
        <rect x="33" y="7" width="34" height="7" rx="3" fill="#6e9d91" />
    `),
    // Lavender sport coupe: low curved hood and bold racing stripe.
    vehicleDocument(`
        <path d="M18 95L21 49Q23 32 35 26H65Q77 32 79 49L82 95Q82 105 72 105H28Q18 105 18 95Z" fill="#b6a4e4" stroke="#7d73a6" stroke-width="3.5" />
        <path d="M30 46L35 31H65L70 46Z" fill="#daf0f5" stroke="#7d73a6" stroke-width="2.5" />
        <path d="M48 52V94" stroke="#fff8e8" stroke-width="8" stroke-linecap="round" />
        <path d="M18 68H82" stroke="#dbcdf5" stroke-width="3" />
        <path d="M23 93H36M64 93H77" stroke="#fff3c5" stroke-width="8" stroke-linecap="round" />
        <rect x="40" y="98" width="20" height="6" rx="2" fill="#f9e8f8" />
    `),
    // Honey taxi: roof sign, side mirrors and broad bumper.
    vehicleDocument(`
        <rect x="19" y="31" width="62" height="75" rx="14" fill="#f2c477" stroke="#a48260" stroke-width="3.5" />
        <path d="M28 45Q28 24 50 24Q72 24 72 45V55H28Z" fill="#d6ecf5" stroke="#a48260" stroke-width="3" />
        <rect x="34" y="12" width="32" height="14" rx="5" fill="#fff6d9" stroke="#a48260" stroke-width="2.5" />
        <path d="M40 19H60" stroke="#b28b5e" stroke-width="2.5" />
        <rect x="12" y="58" width="9" height="14" rx="3" fill="#a48260" />
        <rect x="79" y="58" width="9" height="14" rx="3" fill="#a48260" />
        <path d="M32 74H68" stroke="#fff4cf" stroke-width="9" stroke-linecap="round" />
        <rect x="24" y="94" width="17" height="8" rx="3" fill="#fff3cf" />
        <rect x="59" y="94" width="17" height="8" rx="3" fill="#fff3cf" />
    `),
    // Sky-blue mini bus: tall body, luggage rail and four windows.
    vehicleDocument(`
        <rect x="15" y="15" width="70" height="92" rx="12" fill="#91bde0" stroke="#6586a4" stroke-width="3.5" />
        <rect x="22" y="27" width="56" height="36" rx="6" fill="#d8eff4" stroke="#6586a4" stroke-width="3" />
        <path d="M41 28V62M60 28V62" stroke="#91bde0" stroke-width="3" />
        <path d="M26 75H74" stroke="#b6d9ed" stroke-width="7" stroke-linecap="round" />
        <circle cx="28" cy="97" r="7" fill="#fff2be" stroke="#6586a4" stroke-width="2" />
        <circle cx="72" cy="97" r="7" fill="#fff2be" stroke="#6586a4" stroke-width="2" />
        <rect x="35" y="7" width="30" height="5" rx="2.5" fill="#6586a4" />
    `)
];

export function JumpGuide(): ReactNode {
    return (
        <svg viewBox="0 0 176 70" className="paw-jump-guide-svg" role="img" aria-label="Jump over the spiky cactus">
            <path d="M10 55H169" stroke="#b4cba9" strokeWidth="3" strokeLinecap="round" />
            <g transform="translate(112 21) scale(.42)">
                <path d="M44 98V16Q44 7 54 7Q64 7 64 16V98M44 74H24Q14 74 14 64V48M64 61H79Q87 61 87 50V38" fill="none" stroke="#60967c" strokeWidth="17" strokeLinecap="round" />
                <path d="M44 98V16Q44 7 54 7Q64 7 64 16V98M44 74H24Q14 74 14 64V48M64 61H79Q87 61 87 50V38" fill="none" stroke="#9bd6ac" strokeWidth="10" strokeLinecap="round" />
                <path d="M43 28l-8 -5M64 34l8 -5M44 56l-7 -5M64 72l8 -5" stroke="#f6e1ad" strokeWidth="4" strokeLinecap="round" />
            </g>
            <path d="M19 43Q59 -14 108 25" fill="none" stroke="#c080a6" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="6 6" />
            <path d="M99 13l12 13l-18 1" fill="none" stroke="#c080a6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M24 33l5 -8l5 8" fill="#f5b4cf" stroke="#a27492" strokeWidth="2" />
            <circle cx="30" cy="35" r="8" fill="#f6c6d6" stroke="#a27492" strokeWidth="2" />
            <circle cx="33" cy="34" r="1.5" fill="#765a75" />
            <text x="79" y="65" fill="#9b6e8a" fontSize="10" fontWeight="800" textAnchor="middle">JUMP!</text>
        </svg>
    );
}


/** Exact roadside SVG documents used by Paw Run and the administrator art gallery. */
const buildingDocument = (content: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 140" width="110" height="140">${content}</svg>`;

export const BUILDING_ART = [
    // Cream townhouse: scalloped pink roof and bay windows.
    buildingDocument(`
        <path d="M8 46L55 10L102 46" fill="#eeb4c7" stroke="#9d8095" stroke-width="4" stroke-linejoin="round" />
        <rect x="14" y="43" width="82" height="90" rx="7" fill="#fff1d9" stroke="#a9959d" stroke-width="4" />
        <path d="M10 48L55 13L100 48" fill="none" stroke="#f6cddd" stroke-width="10" stroke-linejoin="round" />
        <rect x="24" y="58" width="24" height="28" rx="7" fill="#b9e3ed" stroke="#bfa1ab" stroke-width="3" />
        <rect x="62" y="58" width="24" height="28" rx="7" fill="#b9e3ed" stroke="#bfa1ab" stroke-width="3" />
        <path d="M36 58V86M74 58V86" stroke="#fffdfb" stroke-width="3" />
        <rect x="42" y="95" width="27" height="38" rx="9" fill="#c995b7" stroke="#9d8095" stroke-width="3" />
        <circle cx="62" cy="116" r="2.5" fill="#fff6e9" />
        <path d="M9 133H101" stroke="#b7a4a8" stroke-width="4" />
    `),
    // Mint corner shop: striped awning and large display windows.
    buildingDocument(`
        <rect x="12" y="29" width="86" height="105" rx="9" fill="#d7f0e2" stroke="#8daa9d" stroke-width="4" />
        <rect x="20" y="13" width="70" height="26" rx="9" fill="#f5d7e8" stroke="#8daa9d" stroke-width="3" />
        <path d="M32 19H78" stroke="#986f88" stroke-width="4" stroke-linecap="round" />
        <rect x="21" y="48" width="68" height="44" rx="5" fill="#bfe6f0" stroke="#8daa9d" stroke-width="3" />
        <path d="M21 50H89L85 70Q77 81 68 70Q58 81 49 70Q39 81 30 70Q21 81 17 70Z" fill="#ffe9bd" stroke="#b49a87" stroke-width="3" />
        <path d="M35 51L34 75M61 51L62 75M79 51L81 73" stroke="#efb0be" stroke-width="6" />
        <rect x="38" y="99" width="34" height="35" rx="4" fill="#f7d5c5" stroke="#8daa9d" stroke-width="3" />
        <circle cx="65" cy="115" r="2.5" fill="#a58d7b" />
    `),
    // Lavender apartment: distinct levels and flower boxes.
    buildingDocument(`
        <rect x="18" y="7" width="74" height="127" rx="10" fill="#e4d8f5" stroke="#9b92b5" stroke-width="4" />
        <rect x="29" y="20" width="22" height="23" rx="4" fill="#b6dfec" stroke="#a69cb6" stroke-width="2.5" />
        <rect x="59" y="20" width="22" height="23" rx="4" fill="#b6dfec" stroke="#a69cb6" stroke-width="2.5" />
        <rect x="29" y="57" width="22" height="23" rx="4" fill="#b6dfec" stroke="#a69cb6" stroke-width="2.5" />
        <rect x="59" y="57" width="22" height="23" rx="4" fill="#b6dfec" stroke="#a69cb6" stroke-width="2.5" />
        <path d="M24 45H55M55 82H86" stroke="#b49bc0" stroke-width="5" stroke-linecap="round" />
        <circle cx="35" cy="46" r="5" fill="#d9a7b7" /><circle cx="42" cy="46" r="5" fill="#f5d69c" />
        <circle cx="68" cy="83" r="5" fill="#a4cfae" /><circle cx="76" cy="83" r="5" fill="#d9a7b7" />
        <rect x="43" y="96" width="25" height="38" rx="6" fill="#b8a1c7" stroke="#9b92b5" stroke-width="3" />
    `),
    // Peach cafe: arched door, roof and outdoor counter.
    buildingDocument(`
        <path d="M10 38Q55 -4 100 38V47H10Z" fill="#f4b0a4" stroke="#ad8e89" stroke-width="4" />
        <rect x="16" y="42" width="78" height="92" rx="7" fill="#fce7d7" stroke="#ad8e89" stroke-width="4" />
        <rect x="27" y="52" width="57" height="19" rx="8" fill="#fff9ec" stroke="#d4aea7" stroke-width="2" />
        <path d="M37 60H74" stroke="#b97f86" stroke-width="3.5" stroke-linecap="round" />
        <path d="M38 133V97A17 17 0 0 1 72 97V133" fill="#b1d7da" stroke="#ad8e89" stroke-width="3" />
        <path d="M55 80V133" stroke="#f5f3eb" stroke-width="3" />
        <rect x="20" y="79" width="13" height="24" rx="4" fill="#c0e2cd" stroke="#ad8e89" stroke-width="2" />
        <rect x="78" y="79" width="13" height="24" rx="4" fill="#c0e2cd" stroke="#ad8e89" stroke-width="2" />
    `)
];

/** Real Memory Tiles artwork used on the game buttons and in the developer gallery. */
/** Complete selection used by the client Heart Color Match game. */
export const PAW_COLOR_PALETTE = [
    '#f18eae', '#b99be8', '#f6c467', '#91cdb3',
    '#8ac6ec', '#e99f7c', '#a2b77b', '#df8dd5',
    '#e77f95', '#78b6c5', '#c3a15e', '#8b9ed9',
    '#ce8dba', '#83b78b', '#db997a', '#a3a0ca'
] as const;

export const MEMORY_HEARTS = [
    { label: 'Pink', color: '#ed91b7' },
    { label: 'Lavender', color: '#b29ade' },
    { label: 'Honey', color: '#efc86e' },
    { label: 'Mint', color: '#90cbaa' }
] as const;

export function MemoryHeart({ index, size = 38 }: { index: number; size?: number }) {
    const entry = MEMORY_HEARTS[index] || MEMORY_HEARTS[0];
    return (
        <svg viewBox="0 0 48 48" width={size} height={size} aria-label={`${entry.label} heart`} role="img">
            <path d="M24 41C9 30 4 23 4 15a11 11 0 0 1 20-6 11 11 0 0 1 20 6c0 8-5 15-20 26Z" fill={entry.color} stroke="#886d80" strokeWidth="2.5" />
        </svg>
    );
}

/** The same illustrated paint palette shown for each Heart Color Match answer. */
export function PaintPalette({ color, size = 65 }: { color: string; size?: number }) {
    return (
        <svg viewBox="0 0 94 90" width={size} height={size} aria-label={`Paint palette ${color}`} role="img">
            <path d="M47 7C22 7 8 25 8 48C8 69 26 83 47 83C58 83 65 77 65 69C65 62 55 60 55 51C55 44 64 41 71 42C83 43 87 35 82 24C76 13 61 7 47 7Z" fill="#fff5e8" stroke="#ad879c" strokeWidth="3" />
            <circle cx="27" cy="33" r="7" fill="#f1c2d5" />
            <circle cx="45" cy="23" r="7" fill="#c7b7e7" />
            <circle cx="65" cy="30" r="7" fill="#f7dca6" />
            <circle cx="18" cy="65" r="6" fill="#b7dfd0" />
            <circle cx="45" cy="53" r="19" fill={color} stroke="#886d80" strokeWidth="3" />
            <path d="M36 53h18M45 44v18" stroke="#fff" strokeOpacity=".55" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

export function TargetHeart({ color }: { color: string }) {
    return (
        <svg viewBox="0 0 100 92" width="116" height="108" aria-label="Target heart" role="img">
            <path d="M50 84 C30 65 3 47 6 26 C9 3 37 0 50 19 C63 0 91 3 94 26 C97 47 70 65 50 84" fill={color} stroke="#fff" strokeWidth="3" />
        </svg>
    );
}


/** Shared actual Paw Claw grabber artwork, including the developer preview. */
export function ClawGrabberArt() {
    return (
        <svg className="paw-claw-grabber" role="img" aria-label="Mechanical claw" viewBox="0 0 90 95">
            <rect x="31" y="2" width="28" height="27" rx="9" fill="#d9a0bd" stroke="#866b88" strokeWidth="4" />
            <circle cx="45" cy="15" r="6" fill="#fff3f8" />
            <path d="M34 27 C18 30 10 45 12 61 L24 78 L33 68 L26 57 Q25 48 38 41 M56 27 C72 30 80 45 78 61 L66 78 L57 68 L64 57 Q65 48 52 41" fill="#e9c5d6" stroke="#866b88" strokeWidth="5" strokeLinejoin="round" />
            <path d="M34 30L40 45 M56 30L50 45" stroke="#866b88" strokeWidth="4" />
        </svg>
    );
}

export function MoleGameIcon(){return <svg viewBox="0 0 36 36" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 28c1-5 5-7 12-7s11 2 12 7"/><path d="M8 28h20"/><path d="M11 21v-4c0-6 3-9 7-9s7 3 7 9v4"/><path d="M11 11 8 7c-2-3 3-6 6-3l3 5M25 11l3-4c2-3-3-6-6-3l-3 5"/><circle cx="14.5" cy="15" r=".9" fill="currentColor" stroke="none"/><circle cx="21.5" cy="15" r=".9" fill="currentColor" stroke="none"/><path d="m16 19 2 1 2-1"/><path d="M4 21 2 19M32 21l2-2"/></svg>}

/** Same Paw Claw SVG used on the player game-selection card. */
export function ClawMenuIcon() {
    return <svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" role="img" aria-label="Paw Claw menu icon">
        <path d="M4 4h26M17 4v11m-7 0 3 9 4-4 4 4 3-9"/>
        <path d="M7 29h20M9 25v4m16-4v4"/>
    </svg>;
}
