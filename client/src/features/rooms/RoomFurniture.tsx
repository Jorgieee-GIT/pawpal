import { memo, useState } from "react";
export const FURNITURE: Record<string, {
    name: string,
    room: string,
    price: number,
    kind: string
}> = {
    living_sofa: {
        name: "Cloud Sofa",
        room: "living",
        price: 0,
        kind: "sofa"
    },
    living_table: {
        name: "Coffee Table",
        room: "living",
        price: 0,
        kind: "table"
    },
    living_rug: {
        name: "Rose Rug",
        room: "living",
        price: 0,
        kind: "rug"
    },
    living_lamp: {
        name: "Floor Lamp",
        room: "living",
        price: 0,
        kind: "lamp"
    },
    living_plant: {
        name: "Leafy Plant",
        room: "living",
        price: 0,
        kind: "plant"
    },
    bedroom_bed: {
        name: "Dream Bed",
        room: "bedroom",
        price: 0,
        kind: "bed"
    },
    bedroom_nightstand: {
        name: "Bedside Table",
        room: "bedroom",
        price: 0,
        kind: "table"
    },
    bedroom_wardrobe: {
        name: "Wardrobe",
        room: "bedroom",
        price: 0,
        kind: "wardrobe"
    },
    bedroom_nightlight: {
        name: "Moon Nightlight",
        room: "bedroom",
        price: 0,
        kind: "lamp"
    },
    bedroom_plush: {
        name: "Sleepy Plush",
        room: "bedroom",
        price: 0,
        kind: "plush"
    },
    studio_desk: {
        name: "Art Desk",
        room: "studio",
        price: 0,
        kind: "table"
    },
    studio_easel: {
        name: "Easel",
        room: "studio",
        price: 0,
        kind: "easel"
    },
    studio_bookshelf: {
        name: "Bookcase",
        room: "studio",
        price: 0,
        kind: "shelf"
    },
    studio_paint: {
        name: "Paint Station",
        room: "studio",
        price: 0,
        kind: "paint"
    },
    studio_stool: {
        name: "Artist Stool",
        room: "studio",
        price: 0,
        kind: "stool"
    },
    sports_mat: {
        name: "Yoga Mat",
        room: "sports",
        price: 0,
        kind: "mat"
    },
    sports_weights: {
        name: "Dumbbells",
        room: "sports",
        price: 0,
        kind: "weights"
    },
    sports_rack: {
        name: "Training Rack",
        room: "sports",
        price: 0,
        kind: "rack"
    },
    sports_bag: {
        name: "Punching Bag",
        room: "sports",
        price: 0,
        kind: "bag"
    },
    sports_water: {
        name: "Water Station",
        room: "sports",
        price: 0,
        kind: "water"
    },
    cloud_sofa: {
        name: "Cloud Sofa Deluxe",
        room: "living",
        price: 2400,
        kind: "sofa"
    },
    plant: {
        name: "Potted Fern",
        room: "living",
        price: 580,
        kind: "plant"
    },
    lamp: {
        name: "Blush Lamp",
        room: "living",
        price: 950,
        kind: "lamp"
    },
    bookshelf: {
        name: "Story Shelf",
        room: "living",
        price: 1800,
        kind: "shelf"
    },
    rug: {
        name: "Fluffy Rug",
        room: "living",
        price: 950,
        kind: "rug"
    },
    cat_tree: {
        name: "Climbing Tree",
        room: "living",
        price: 2200,
        kind: "tree"
    },
    plush: {
        name: "Cuddle Plush",
        room: "living",
        price: 750,
        kind: "plush"
    },
    velvet_armchair: {
        name: "Velvet Armchair",
        room: "living",
        price: 1700,
        kind: "chair"
    },
    tea_cart: {
        name: "Tea Cart",
        room: "living",
        price: 1300,
        kind: "table"
    },
    flower_vase: {
        name: "Flower Vase",
        room: "living",
        price: 720,
        kind: "plant"
    },
    record_player: {
        name: "Record Player",
        room: "living",
        price: 2300,
        kind: "music"
    },
    fireplace: {
        name: "Cozy Fireplace",
        room: "living",
        price: 3200,
        kind: "fire"
    },
    canopy_bed: {
        name: "Canopy Bed",
        room: "bedroom",
        price: 2800,
        kind: "bed"
    },
    moon_lamp: {
        name: "Moon Lamp",
        room: "bedroom",
        price: 850,
        kind: "lamp"
    },
    vanity: {
        name: "Vanity Mirror",
        room: "bedroom",
        price: 2100,
        kind: "vanity"
    },
    star_pillow: {
        name: "Star Pillow",
        room: "bedroom",
        price: 600,
        kind: "plush"
    },
    cloud_dresser: {
        name: "Cloud Dresser",
        room: "bedroom",
        price: 1700,
        kind: "wardrobe"
    },
    cozy_bench: {
        name: "Cozy Bench",
        room: "bedroom",
        price: 1100,
        kind: "chair"
    },
    drawing_table: {
        name: "Drawing Table",
        room: "studio",
        price: 2200,
        kind: "table"
    },
    canvas_stack: {
        name: "Canvas Stack",
        room: "studio",
        price: 780,
        kind: "easel"
    },
    paint_cart: {
        name: "Paint Cart",
        room: "studio",
        price: 1200,
        kind: "paint"
    },
    sculpture: {
        name: "Clay Sculpture",
        room: "studio",
        price: 1950,
        kind: "sculpture"
    },
    studio_lamp: {
        name: "Studio Lamp",
        room: "studio",
        price: 950,
        kind: "lamp"
    },
    craft_cabinet: {
        name: "Craft Cabinet",
        room: "studio",
        price: 1800,
        kind: "shelf"
    },
    treadmill: {
        name: "Treadmill",
        room: "sports",
        price: 2900,
        kind: "treadmill"
    },
    boxing_bag: {
        name: "Boxing Bag",
        room: "sports",
        price: 1800,
        kind: "bag"
    },
    fitness_ball: {
        name: "Fitness Ball",
        room: "sports",
        price: 850,
        kind: "ball"
    },
    medal_case: {
        name: "Medal Display",
        room: "sports",
        price: 1300,
        kind: "rack"
    },
    skipping_rope: {
        name: "Skipping Rope",
        room: "sports",
        price: 520,
        kind: "rope"
    },
    mini_bike: {
        name: "Mini Bike",
        room: "sports",
        price: 2400,
        kind: "bike"
    },
    sunset_painting: {
        name: "Sunset Painting",
        room: "living",
        price: 650,
        kind: "painting"
    },
    ocean_painting: {
        name: "Ocean Painting",
        room: "living",
        price: 795,
        kind: "painting"
    },
    rose_bouquet: {
        name: "Rose Bouquet",
        room: "living",
        price: 940,
        kind: "flowers"
    },
    tulip_bouquet: {
        name: "Tulip Bouquet",
        room: "living",
        price: 1085,
        kind: "flowers"
    },
    sage_monstera: {
        name: "Sage Monstera",
        room: "living",
        price: 1230,
        kind: "plant"
    },
    mint_pothos: {
        name: "Mint Pothos",
        room: "living",
        price: 1375,
        kind: "plant"
    },
    bubble_aquarium: {
        name: "Bubble Aquarium",
        room: "living",
        price: 1520,
        kind: "aquarium"
    },
    cuckoo_clock: {
        name: "Cuckoo Clock",
        room: "living",
        price: 1665,
        kind: "clock"
    },
    pastel_ottoman: {
        name: "Pastel Ottoman",
        room: "living",
        price: 1810,
        kind: "ottoman"
    },
    window_seat: {
        name: "Window Seat",
        room: "living",
        price: 1955,
        kind: "seat"
    },
    rainbow_mobile: {
        name: "Rainbow Mobile",
        room: "bedroom",
        price: 650,
        kind: "mobile"
    },
    starry_mobile: {
        name: "Starry Mobile",
        room: "bedroom",
        price: 795,
        kind: "mobile"
    },
    lavender_quilt: {
        name: "Lavender Quilt",
        room: "bedroom",
        price: 940,
        kind: "quilt"
    },
    peach_quilt: {
        name: "Peach Quilt",
        room: "bedroom",
        price: 1085,
        kind: "quilt"
    },
    bunny_slippers: {
        name: "Bunny Slippers",
        room: "bedroom",
        price: 1230,
        kind: "slippers"
    },
    bear_slippers: {
        name: "Bear Slippers",
        room: "bedroom",
        price: 1375,
        kind: "slippers"
    },
    heart_mirror: {
        name: "Heart Mirror",
        room: "bedroom",
        price: 1520,
        kind: "mirror"
    },
    jewelry_box: {
        name: "Jewelry Box",
        room: "bedroom",
        price: 1665,
        kind: "jewelry"
    },
    dreamcatcher: {
        name: "Dreamcatcher",
        room: "bedroom",
        price: 1810,
        kind: "dreamcatcher"
    },
    cloud_humidifier: {
        name: "Cloud Humidifier",
        room: "bedroom",
        price: 1955,
        kind: "humidifier"
    },
    sunflower_canvas: {
        name: "Sunflower Canvas",
        room: "studio",
        price: 650,
        kind: "painting"
    },
    mountain_canvas: {
        name: "Mountain Canvas",
        room: "studio",
        price: 795,
        kind: "painting"
    },
    ceramic_vase: {
        name: "Ceramic Vase",
        room: "studio",
        price: 940,
        kind: "ceramic"
    },
    clay_bowl: {
        name: "Clay Bowl",
        room: "studio",
        price: 1085,
        kind: "ceramic"
    },
    yarn_basket: {
        name: "Yarn Basket",
        room: "studio",
        price: 1230,
        kind: "yarn"
    },
    knitting_kit: {
        name: "Knitting Kit",
        room: "studio",
        price: 1375,
        kind: "yarn"
    },
    color_wheel: {
        name: "Color Wheel",
        room: "studio",
        price: 1520,
        kind: "wheel"
    },
    polaroid_wall: {
        name: "Polaroid Wall",
        room: "studio",
        price: 1665,
        kind: "photos"
    },
    calligraphy_set: {
        name: "Calligraphy Set",
        room: "studio",
        price: 1810,
        kind: "calligraphy"
    },
    mini_pottery_wheel: {
        name: "Pottery Wheel",
        room: "studio",
        price: 1955,
        kind: "pottery"
    },
    basketball_hoop: {
        name: "Basketball Hoop",
        room: "sports",
        price: 650,
        kind: "hoop"
    },
    soccer_goal: {
        name: "Soccer Goal",
        room: "sports",
        price: 795,
        kind: "goal"
    },
    tennis_racket: {
        name: "Tennis Racket",
        room: "sports",
        price: 940,
        kind: "racket"
    },
    badminton_racket: {
        name: "Badminton Racket",
        room: "sports",
        price: 1085,
        kind: "racket"
    },
    jumping_hurdle: {
        name: "Jumping Hurdle",
        room: "sports",
        price: 1230,
        kind: "hurdle"
    },
    balance_beam: {
        name: "Balance Beam",
        room: "sports",
        price: 1375,
        kind: "beam"
    },
    speed_ladder: {
        name: "Speed Ladder",
        room: "sports",
        price: 1520,
        kind: "ladder"
    },
    climbing_wall: {
        name: "Climbing Wall",
        room: "sports",
        price: 1665,
        kind: "climb"
    },
    kettlebell_set: {
        name: "Kettlebell Set",
        room: "sports",
        price: 1810,
        kind: "kettlebell"
    },
    sports_trophy: {
        name: "Sports Trophy",
        room: "sports",
        price: 1955,
        kind: "trophy"
    }
};
export const FURNITURE_UNLOCK_LEVELS: Record<string, number> = {
    sunset_painting: 3,
    ocean_painting: 5,
    rose_bouquet: 7,
    tulip_bouquet: 9,
    sage_monstera: 11,
    mint_pothos: 13,
    bubble_aquarium: 16,
    cuckoo_clock: 19,
    pastel_ottoman: 23,
    window_seat: 28,
    rainbow_mobile: 3,
    starry_mobile: 5,
    lavender_quilt: 7,
    peach_quilt: 9,
    bunny_slippers: 11,
    bear_slippers: 13,
    heart_mirror: 16,
    jewelry_box: 19,
    dreamcatcher: 23,
    cloud_humidifier: 28,
    sunflower_canvas: 3,
    mountain_canvas: 5,
    ceramic_vase: 7,
    clay_bowl: 9,
    yarn_basket: 11,
    knitting_kit: 13,
    color_wheel: 16,
    polaroid_wall: 19,
    calligraphy_set: 23,
    mini_pottery_wheel: 28,
    basketball_hoop: 3,
    soccer_goal: 5,
    tennis_racket: 7,
    badminton_racket: 9,
    jumping_hurdle: 11,
    balance_beam: 13,
    speed_ladder: 16,
    climbing_wall: 19,
    kettlebell_set: 23,
    sports_trophy: 28,
    cloud_sofa: 12,
    fireplace: 25,
    canopy_bed: 15,
    treadmill: 20,
    record_player: 18,
    mini_bike: 14,
    drawing_table: 10,
    cat_tree: 8
};
export const DEFAULTS: Record<string, string[]> = {
    living: ["living_sofa", "living_table", "living_rug", "living_lamp", "living_plant"],
    bedroom: ["bedroom_bed", "bedroom_nightstand", "bedroom_wardrobe", "bedroom_nightlight", "bedroom_plush"],
    studio: ["studio_desk", "studio_easel", "studio_bookshelf", "studio_paint", "studio_stool"],
    sports: ["sports_mat", "sports_weights", "sports_rack", "sports_bag", "sports_water"]
};
export type FurniturePlacement = {
    id: string,
    x: number,
    y: number
};
const POSITIONS = [[70, 61], [28, 60], [48, 78], [88, 38], [13, 45]];
/*
 * DOCU: Handle furniture layout behavior for this feature.
 * @param {string} room - room value used by this function
 * @param {Record<string, FurniturePlacement[]>} layouts - layouts value used by this function
 * @returns {FurniturePlacement[]} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function furnitureLayout(room: string, layouts?: Record<string, FurniturePlacement[]>): FurniturePlacement[] {
    return Array.isArray(layouts?.[room]) ? layouts![room] : DEFAULTS[room].map((id, i) => ({
        id,
        x: POSITIONS[i][0],
        y: POSITIONS[i][1]
    }));
}

// Each purchasable furnishing has its own illustrated silhouette, not a reused category icon.
const CUSTOM_FURNITURE = new Set(Object.keys(FURNITURE).filter(id => FURNITURE[id].price > 0));
const EXTRA_FURNITURE_IDS = new Set([
    "sunset_painting",
    "ocean_painting",
    "rose_bouquet",
    "tulip_bouquet",
    "sage_monstera",
    "mint_pothos",
    "bubble_aquarium",
    "cuckoo_clock",
    "pastel_ottoman",
    "window_seat",
    "rainbow_mobile",
    "starry_mobile",
    "lavender_quilt",
    "peach_quilt",
    "bunny_slippers",
    "bear_slippers",
    "heart_mirror",
    "jewelry_box",
    "dreamcatcher",
    "cloud_humidifier",
    "sunflower_canvas",
    "mountain_canvas",
    "ceramic_vase",
    "clay_bowl",
    "yarn_basket",
    "knitting_kit",
    "color_wheel",
    "polaroid_wall",
    "calligraphy_set",
    "mini_pottery_wheel",
    "basketball_hoop",
    "soccer_goal",
    "tennis_racket",
    "badminton_racket",
    "jumping_hurdle",
    "balance_beam",
    "speed_ladder",
    "climbing_wall",
    "kettlebell_set",
    "sports_trophy"
]);
/*
 * DOCU: Draw the individual SVG artwork for the expanded furniture catalog.
 * @param {{ id: string }} props - Catalog ID of the furnishing to draw
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function ExtraFurniture({ id }: {
    id: string
}) {
    const mint = "#a5d4b6", pink = "#edb3c9", lav = "#b3a2d5", gold = "#f2cb79", wood = "#b88d83", ink = "#786e8e", paper = "#fff0e8";
    const colors = [mint, pink, lav, gold, wood];
    const n = Array.from(id).reduce((a, c) => a + c.charCodeAt(0), 0);
    const c = colors[n % 5];
    /*
     * DOCU: Handle r behavior for this feature.
     * @param {number} x - x value used by this function
     * @param {number} y - y value used by this function
     * @param {number} w - w value used by this function
     * @param {number} h - h value used by this function
     * @param {unknown} fill - fill value used by this function
     * @param {unknown} rx - rx value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
    const r = (x: number, y: number, w: number, h: number, fill = c, rx = 6) => <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} stroke={ink} strokeWidth="3" />;
    /*
     * DOCU: Handle line behavior for this feature.
     * @param {string} d - d value used by this function
     * @param {unknown} color - color value used by this function
     * @param {unknown} w - w value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
    const line = (d: string, color = ink, w = 4) => <path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    /*
     * DOCU: Handle circ behavior for this feature.
     * @param {number} x - x value used by this function
     * @param {number} y - y value used by this function
     * @param {number} rad - rad value used by this function
     * @param {unknown} fill - fill value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
    const circ = (x: number, y: number, rad: number, fill = c) => <circle cx={x} cy={y} r={rad} fill={fill} stroke={ink} strokeWidth="2" />;
    if (id.includes("painting") || id.includes("canvas")) {
        return <>
            {r(12, 8, 96, 94, wood, 2)}
            {r(19, 15, 82, 80, id.includes("ocean") ? "#b4deeb" : "#f8d4cf", 1)}
            {circ(76, 34, 12, gold)}
            {id.includes("sunflower") ? <>
                {line("M59 88V42", mint, 5)}
                {Array.from({
                    length: 8
                }, (_, i) => <ellipse key={i} cx={59 + Math.cos(i * Math.PI / 4) * 15} cy={41 + Math.sin(i * Math.PI / 4) * 15} rx="9" ry="7" fill={gold} />)}
                {circ(59, 41, 8, wood)}
            </> : <path d={id.includes("ocean") ? "M19 68Q39 50 59 67T101 67V95H19Z" : id.includes("mountain") ? "M19 90L45 43L62 63L77 36L101 86V95H19Z" : "M19 85Q42 41 66 66T101 53V95H19Z"} fill={id.includes("ocean") ? "#73bbcc" : mint} />}
        </>;
    }
    if (id === "rose_bouquet" || id === "tulip_bouquet") {
        return <>
            {line("M56 84 32 36m28 47V24m4 60 23-48", "#78a98a", 4)}
            <path d="M58 63Q39 62 42 46Q56 49 58 63m6 5Q66 51 82 48Q83 63 64 68" fill={mint} />
            {[[32, 36], [60, 24], [87, 36]].map(([x, y]) => <g key={x} transform={`translate(${x} ${y})`}>
                {id === "rose_bouquet" ? <>
                    <path d="M0 12C-20 8-17-11-5-11Q0-16 6-11C21-12 21 8 0 12Z" fill={pink} stroke="#b37b99" strokeWidth="2" />
                    <path d="M-8 0Q-9-8 2-7Q12-5 6 2Q2 6-3 2" fill="none" stroke="#b37b99" strokeWidth="2" strokeLinecap="round" />
                </> : <path d="M-12-13-4-8 0-16l5 8 7-5v11q0 14-12 14T-12-2Z" fill={gold} stroke="#b78d65" strokeWidth="2" strokeLinejoin="round" />}
            </g>)}
            <path d="m31 66 29 9 29-9-15 35H46Z" fill={paper} stroke={wood} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M49 83q-11-10-8 1q2 5 19 2q17 3 19-2q3-11-8-1m-11 3-5 9m5-9 5 9" fill="none" stroke="#b6799f" strokeWidth="3" strokeLinecap="round" />
        </>;
    }
    if (id === "sage_monstera" || id === "mint_pothos") {
        return <>
            {line("M60 77V28m0 42-24-27m24 17 27-25", "#64957b", 3)}
            {id === "sage_monstera" ? [[33, 45, -38], [61, 30, 10], [86, 45, 42]].map(([x, y, angle]) => <g key={x} transform={`translate(${x} ${y}) rotate(${angle})`}>
                <path d="M0 23C-14 18-20 10-18 4l8 4-9-10q0-5 3-9l8 6-5-12Q0-29 13-17l-5 12 8-6q3 4 3 9l-9 10 8-4c2 6-4 14-18 19Z" fill="#88b49a" stroke="#648e77" strokeWidth="2" strokeLinejoin="round" />
                <path d="M0 19V-16" stroke="#c8e4cd" strokeWidth="2" strokeLinecap="round" />
            </g>) : <>
                {line("M61 73q26-4 32 14q4 12 13 13", "#64957b", 3)}
                {[[30, 36, -30], [60, 25, 12], [87, 35, 29], [96, 73, 35], [96, 86, -38]].map(([x, y, angle]) => <g key={y} transform={`translate(${x} ${y}) rotate(${angle})`}>
                    <path d="M0 14C-27-1-9-20 0-9C9-20 27-1 0 14Z" fill="#b4dab4" stroke="#6d9e83" strokeWidth="2" />
                    <path d="M0 10V-5" stroke="#f5efc8" strokeWidth="2" strokeLinecap="round" />
                </g>)}
            </>}
            <path d="M37 72h46l-6 30H43Z" fill={id === "sage_monstera" ? "#d6aab3" : lav} stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
            <rect x="34" y="70" width="52" height="8" rx="3" fill={paper} stroke={ink} strokeWidth="2.5" />
        </>;
    }
    if (id === "rainbow_mobile" || id === "starry_mobile") {
        return <>
            {line("M60 8v19M19 28q41 9 82 0", wood, 4)}
            {id === "rainbow_mobile" ? <>
                {line("M60 33v13m-37-14v28m74-28v28", lav, 2)}
                <path d="M34 79a26 26 0 0 1 52 0" fill="none" stroke={pink} strokeWidth="7" />
                <path d="M41 79a19 19 0 0 1 38 0" fill="none" stroke={gold} strokeWidth="6" />
                <path d="M48 79a12 12 0 0 1 24 0" fill="none" stroke={mint} strokeWidth="6" />
                <path d="M13 71q-3-8 5-9q2-8 10-4q5 2 4 7q8 4 2 10H17Zm73 0q-3-8 5-9q2-8 10-4q5 2 4 7q8 4 2 10H90Z" fill={paper} stroke={ink} strokeWidth="2" />
            </> : <>
                {line("M25 31v24m35-22v31m35-33v24", lav, 2)}
                {[25, 60, 95].map((x, i) => <path key={x} d="M0-12 4-4 13-3 7 4 8 12 0 8-8 12-7 4-13-3-4-4Z" transform={`translate(${x} ${i === 1 ? 76 : 62})`} fill={i === 1 ? gold : lav} stroke={ink} strokeWidth="2" strokeLinejoin="round" />)}
            </>}
        </>;
    }
    if (id.includes("quilt")) {
        const lavender = id === "lavender_quilt";
        return <>
            <path d="M17 56Q12 69 22 77Q42 91 65 96Q77 99 89 91L108 77Q114 71 107 64Z" fill={lavender ? lav : "#d99b92"} stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M15 56 34 35Q39 29 50 31L101 45Q113 49 106 59L91 78Q83 88 70 84L20 69Q10 65 15 56Z" fill={lavender ? "#cec0e5" : "#efb9aa"} stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="m20 57 18-19q4-4 11-2l48 13q7 2 3 8L85 76q-5 6-13 4L24 66q-8-3-4-9Z" fill="none" stroke={paper} strokeWidth="2" strokeDasharray="3 3" />
            <path d="m33 67 22-28m-4 34 22-29m-4 34 22-29M30 49l62 18m-70-9 64 18" fill="none" stroke={paper} strokeWidth="2" />
            <path d="m52 52 12 3-7 8-12-3Zm23 7 12 3-7 8-12-3Z" fill={lavender ? "#a88ecb" : "#ce8b90"} />
            <path d="M24 74q24 11 49 16q6 1 12-3" fill="none" stroke={paper} strokeWidth="2" strokeLinecap="round" />
        </>;
    }
    if (id.includes("slippers")) {
        return <>
            {[19, 69].map(x => <g key={x}>
                {r(x, 48, 34, 47, c, 17)}
                {id.includes("bunny") ? <>
                    {r(x + 4, 18, 9, 38, pink)}
                    {r(x + 22, 18, 9, 38, pink)}
                </> : <>
                    {circ(x + 7, 47, 9, wood)}
                    {circ(x + 28, 47, 9, wood)}
                </>}
                {circ(x + 12, 71, 2, ink)}
                {circ(x + 23, 71, 2, ink)}
            </g>)}
        </>;
    }
    if (id.includes("racket")) {
        const tennis = id === "tennis_racket";
        return <>
            <g transform="rotate(-24 53 58)" strokeLinejoin="round">
                <ellipse cx="53" cy="34" rx={tennis ? 24 : 18} ry={tennis ? 26 : 23} fill={paper} stroke={tennis ? "#bb83a6" : "#77a894"} strokeWidth="5" />
                {line(tennis ? "M39 14v40m9-44v47m10-47v47m9-43v40M34 22h38m-41 12h44M34 46h38" : "M44 16v36m9-40v43m9-39v36M39 24h28m-31 10h34M39 44h28", lav, 1.5)}
                {line(tennis ? "M40 58l13 16 13-16m-13 16v24" : "M53 58v40", ink, tennis ? 4 : 3)}
                {line("M53 86v14", wood, 8)}
            </g>
            {tennis ? <>
                {circ(95, 84, 9, "#d7df9a")}
                {line("M91 77q7 5 4 14", paper, 2)}
            </> : <>
                <path d="m85 78 18-7 7 15-18 4Z" fill={paper} stroke={ink} strokeWidth="2" />
                {line("m90 80 15-4m-12 9 14-5", lav, 1.5)}
                <path d="M85 78q-7 3-4 8q3 5 11 4Z" fill={pink} stroke={ink} strokeWidth="2" />
            </>}
        </>;
    }
    if (id.includes("yarn") || id.includes("knitting")) {
        return <>
            {r(14, 59, 92, 40, wood, 12)}
            {[35, 60, 85].map((x, i) => <g key={x}>
                {circ(x, 52 - i % 2 * 10, 17, colors[i])}
                {line(`M${x - 10} ${52 - i % 2 * 10}q20-15 20 5`, paper, 2)}
            </g>)}
            {id.includes("knitting") && line("M27 12l65 53", gold, 5)}
        </>;
    }
    if (id.includes("ceramic") || id.includes("clay")) {
        return <>
            {id.includes("vase") ? <path d="M45 16h30l-8 29q31 23 8 52H45Q22 68 53 45Z" fill={c} stroke={ink} strokeWidth="3" /> : <>
                <path d="M13 48q0 48 47 48t47-48Z" fill="#dba18b" stroke={ink} strokeWidth="3" />
                <ellipse cx="60" cy="48" rx="47" ry="13" fill="#f3c6ac" stroke={ink} strokeWidth="3" />
                <path d="M23 52q37-15 74 0" fill="none" stroke="#bd8b81" strokeWidth="2" />
            </>}
            {line("M36 67q24-16 48 0", gold, 5)}
        </>;
    }
    switch (id) {
        case "dreamcatcher": return <>
            {line("M60 5q-7 0-7 6t7 6q7 0 7-6t-7-6", wood, 2.5)}
            <circle cx="60" cy="46" r="29" fill="none" stroke="#b78093" strokeWidth="5" />
            <path d="M60 18 85 60 36 60 60 18m0 56L35 31h50L60 74M32 46h56M60 18v56" fill="none" stroke={lav} strokeWidth="1.7" strokeLinejoin="round" />
            {circ(60, 46, 4, gold)}
            {[[42, 69, 87], [60, 76, 92], [78, 69, 87]].map(([x, start, y]) => <g key={x}>
                {line(`M${x} ${start}v${y - start}`, wood, 2)}
                {circ(x, y - 3, 3, mint)}
                <path d="M0 0q-11 5-5 15q12-3 5-15Z" transform={`translate(${x} ${y})`} fill={pink} stroke={ink} strokeWidth="1.5" />
            </g>)}
        </>;
        case "bubble_aquarium": return <>
            {r(10, 20, 100, 78, "#b9e5e9", 12)}
            {[36, 83].map((x, i) => <g key={x}>
                <ellipse cx={x} cy={55 + i * 15} rx="14" ry="8" fill={i ? gold : pink} />
                <path d={`M${x - 12} ${55 + i * 15}l-12-8v16Z`} fill={i ? gold : pink} />
            </g>)}
            {[49, 67, 85].map((y, i) => <g key={y}>{circ(65 + i * 8, y - 15, 3, paper)}</g>)}
        </>;
        case "cuckoo_clock": return <>
            {r(28, 34, 64, 63, wood)}
            <path d="M19 37L60 6l41 31Z" fill={pink} stroke={ink} strokeWidth="3" />
            {circ(60, 64, 19, paper)}
            {line("M60 64V51m0 13 10 6")}
            <path d="M49 38V27q11-13 22 0v11Z" fill="#9d746e" stroke={ink} strokeWidth="2" />
            <path d="M54 34q0-8 7-8q4 0 6 4l6 2-6 3h-9Z" fill={gold} />
            {line("M60 97v11", gold)}
        </>;
        case "pastel_ottoman": return <>
            {r(16, 40, 88, 50, lav, 20)}
            {r(22, 35, 76, 36, pink, 18)}
            {line("M31 88v13M89 88v13", wood, 7)}
        </>;
        case "window_seat": return <>
            {r(18, 8, 84, 66, "#c6e7ec")}
            {line("M60 8v65M18 42h84", paper, 5)}
            {r(8, 73, 104, 21, wood)}
            {r(14, 68, 92, 17, pink, 8)}
            {r(19, 59, 25, 19, lav)}
        </>;
        case "heart_mirror": return <>
            {line("M60 77v24M37 101h46", wood, 6)}
            <path d="M60 28C29-5 5 30 60 78C115 30 91-5 60 28Z" fill="#bde4eb" stroke={pink} strokeWidth="7" />
        </>;
        case "jewelry_box": return <>
            {r(23, 16, 74, 48, lav, 8)}
            {r(29, 22, 62, 34, "#c4e1e7", 6)}
            {line("m43 45 16-16m4 15 8-8", paper, 2)}
            {r(13, 53, 94, 43, pink, 7)}
            {r(20, 54, 80, 14, "#a68bb2", 5)}
            {line("M30 60h60", paper, 2)}
            {r(52, 75, 16, 10, gold, 3)}
        </>;
        case "cloud_humidifier": return <>
            <path d="M27 95q-17 0-17-16q0-12 12-16q0-19 19-20q8-15 22-15q18 0 24 17q18 0 21 17q9 6 9 17q0 16-18 16Z" fill={paper} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
            {line("M53 21q-8-6 0-13m15 13q-7-6 1-13", "#88a9c2", 2.5)}
            {line("M47 39h25", lav, 2.5)}
            {circ(64, 78, 4, mint)}
        </>;
        case "color_wheel": return <>
            {Array.from({
                length: 8
            }, (_, i) => <path
                key={i}
                d={`M60 53L${60 + 40 * Math.cos(i * Math.PI / 4)} ${53 + 40 * Math.sin(i * Math.PI / 4)}A40 40 0 0 1 ${60 + 40 * Math.cos((i + 1) * Math.PI / 4)} ${53 + 40 * Math.sin((i + 1) * Math.PI / 4)}Z`}
                fill={["#f3afc5", "#efc987", "#d5e1a0", "#a4d8bd", "#9cd2e6", "#afa6dc", "#d6a3d5", "#e6a9ad"][i]}
            />)}
            {circ(60, 53, 12, paper)}
            {line("M60 93v13", wood, 5)}
        </>;
        case "polaroid_wall": return <>
            {[[13, 13], [49, 24], [77, 11]].map(([x, y], i) => <g key={i}>
                {r(x, y, 32, 45, paper, 2)}
                {r(x + 4, y + 4, 24, 27, colors[i], 1)}
                {circ(x + 15, y + 15, 6, gold)}
            </g>)}
        </>;
        case "calligraphy_set": return <>
            {r(11, 54, 98, 42, paper)}
            {line("M29 72h45M29 83h30", lav, 3)}
            {line("M82 16L55 77", wood, 6)}
            {circ(89, 87, 10, ink)}
        </>;
        case "mini_pottery_wheel": return <>
            {r(14, 72, 92, 26, lav, 7)}
            {r(23, 76, 18, 12, paper, 4)}
            {circ(89, 84, 4, mint)}
            <ellipse cx="60" cy="70" rx="44" ry="13" fill={paper} stroke={ink} strokeWidth="2.5" />
            <ellipse cx="60" cy="67" rx="32" ry="9" fill="#b3a2c5" stroke={ink} strokeWidth="2" />
            <path d="M42 38q4 24 18 24t18-24Z" fill="#d39f87" stroke={ink} strokeWidth="2.5" />
            <ellipse cx="60" cy="38" rx="18" ry="6" fill="#f2c4a6" stroke={ink} strokeWidth="2.5" />
        </>;
        case "basketball_hoop": return <>
            {r(24, 8, 72, 37, paper)}
            <rect x="43" y="23" width="34" height="17" rx="2" fill="none" stroke="#bb83a1" strokeWidth="2" />
            <path d="M40 51 49 80q11 7 22 0l9-29m-30 0 15 31m-5-31 9 24m1-24L55 82m5-31-9 24m-8-14q17 9 34 0m-30 9q13 8 26 0" fill="none" stroke={lav} strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="60" cy="50" rx="23" ry="6" fill="none" stroke="#c48a67" strokeWidth="4" />
        </>;
        case "soccer_goal": return <>
            <path d="M12 84V23h84l13 15v59H27Z" fill="#edf3e8" stroke="#a79ab6" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M24 37v51m13-52v58m14-58v58m14-58v58m14-58v58m14-58v58M22 49h86M22 62h86M22 75h86M22 88h86" fill="none" stroke="#c0adc9" strokeWidth="1.5" />
            {line("M12 84V23h84v61M12 23l15 14h82l-13-14M27 37v60h82V37M12 84l15 13m69-13 13 13", ink, 2.5)}
            {circ(57, 86, 13, paper)}
            <path d="m57 80 5 4-2 6h-6l-2-6Zm-10-1 4 2-1 6-5 1m22-9-4 2 1 6 5 1m-16 10 1-4h6l2 4" fill={ink} />
        </>;
        case "jumping_hurdle": return <>
            {line("M16 32h88", pink, 9)}
            {line("M29 32v67M91 32v67", wood, 6)}
            {line("M16 99h27M77 99h27", lav, 5)}
        </>;
        case "balance_beam": return <>
            {r(6, 44, 108, 16, pink)}
            {line("M28 60v39M92 60v39", wood, 7)}
            {r(17, 96, 26, 8, lav)}
            {r(77, 96, 26, 8, lav)}
        </>;
        case "speed_ladder": return <>
            {line("M23 12v91M97 12v91", lav, 6)}
            {line("M25 22h70m-70 18h70m-70 18h70m-70 18h70m-70 18h70", gold, 5)}
        </>;
        case "climbing_wall": return <>
            {r(17, 7, 86, 97, mint)}
            {[[35, 23], [69, 31], [48, 50], [83, 64], [31, 83], [65, 89]].map(([x, y], i) => <path key={i} d={`M${x - 8} ${y}l6-7 12 2 3 11-12 3Z`} fill={colors[i % 5]} stroke={ink} strokeWidth="2" />)}
        </>;
        case "kettlebell_set": return <>
            {[[35, 67, 18], [83, 72, 14]].map(([x, y, r], i) => <g key={i}>
                {circ(x, y, r, i ? mint : lav)}
                {line(`M${x - r / 2} ${y - r}v-13q${r / 2} -11 ${r} 0v13`, wood, 5)}
            </g>)}
        </>;
        case "sports_trophy": return <>
            <path d="M37 20h46v28q-2 27-23 27T37 48Z" fill={gold} stroke={ink} strokeWidth="3" />
            {line("M38 28H19q-4 27 20 27M82 28h19q4 27-20 27", gold, 6)}
            {line("M60 74v15", wood, 7)}
            {r(37, 87, 46, 14, wood)}
            {circ(60, 44, 9, paper)}
        </>;
    }
    return <>
        {circ(60, 55, 30, pink)}
    </>;
}

/*
 * DOCU: Draw the original shop furnishings or delegate to the expanded catalog artwork.
 * @param {{ id: string }} props - Catalog ID of the furnishing to draw
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function CustomFurniture({ id }: {
    id: string
}) {
    if (EXTRA_FURNITURE_IDS.has(id)) {
        return <ExtraFurniture id={id} />;
    }
    const wood = "#b88d83", pink = "#edb3c9", light = "#fff0e8", mint = "#9dcebb", lav = "#b3a2d5", dark = "#786e8e", gold = "#f2cb79";
    /*
     * DOCU: Handle rect behavior for this feature.
     * @param {number} x - x value used by this function
     * @param {number} y - y value used by this function
     * @param {number} w - w value used by this function
     * @param {number} h - h value used by this function
     * @param {string} fill - fill value used by this function
     * @param {unknown} rx - rx value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
    const rect = (x: number, y: number, w: number, h: number, fill: string, rx = 5) => <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} stroke={dark} strokeWidth="2.5" />;
    /*
     * DOCU: Handle line behavior for this feature.
     * @param {string} d - d value used by this function
     * @param {unknown} color - color value used by this function
     * @param {unknown} width - width value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
    const line = (d: string, color = dark, width = 4) => <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    /*
     * DOCU: Handle circle behavior for this feature.
     * @param {number} x - x value used by this function
     * @param {number} y - y value used by this function
     * @param {number} r - r value used by this function
     * @param {string} fill - fill value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
    const circle = (x: number, y: number, r: number, fill: string) => <circle cx={x} cy={y} r={r} fill={fill} stroke={dark} strokeWidth="2" />;
    switch (id) {
        case "cloud_sofa": return <>
            {rect(8, 45, 104, 47, lav, 19)}
            {[24, 45, 67, 89].map(x => <circle key={x} cx={x} cy="44" r="21" fill={light} />)}
            {rect(16, 71, 88, 21, pink, 12)}
            {line("M27 92v10M93 92v10", wood, 6)}
        </>;
        case "plant": return <>
            {line("M60 78Q52 32 20 34m40 44Q63 38 58 14m2 64Q80 33 104 38", "#6a9b7b", 3)}
            <path d="M20 34q8-8 19-3l-5 7 14-1-4 7 11 2-3 6 7 9q-9-1-15-8l-8 3 2-7-11-1 4-7Zm38-20q-11 9-10 19l7-3-5 12 8-3-3 12 6-3 1 13 6-13-4-6 6-3-6-8 5-4Zm46 24q-9-8-19-4l4 7-13-2 4 7-12 2 4 7-9 9 13-5 4 3 3-8 8 2-2-8 9-1-3-6Z" fill={mint} stroke="#6a9b7b" strokeWidth="2" strokeLinejoin="round" />
            <path d="M35 73h50l-7 29H42Z" fill={pink} stroke={dark} strokeWidth="2.5" strokeLinejoin="round" />
            {rect(32, 70, 56, 8, light, 3)}
        </>;
        case "lamp": return <>
            {line("M60 51v46M35 98h50", wood, 6)}
            <path d="M25 49L42 11h36l17 38Z" fill={pink} stroke={dark} strokeWidth="3" />
            {circle(60, 20, 7, gold)}
            {line("M43 56h34", gold, 4)}
        </>;
        case "bookshelf": return <>
            {rect(18, 10, 84, 94, wood)}
            {line("M23 38h74m-74 31h74", "#fff0e5", 5)}
            {[27, 40, 53, 68, 81].map((x, i) => <g key={x}>{rect(x, 15, 10, 19, [mint, lav, pink, gold, light][i], 2)}</g>)}
            {[30, 49, 67, 84].map((x, i) => <g key={x}>{rect(x, 44, 11, 20, [gold, pink, mint, lav][i], 2)}</g>)}
            {rect(32, 76, 54, 21, light, 2)}
        </>;
        case "rug": return <>
            <path d="M12 62Q8 49 25 43Q39 34 53 38Q67 34 85 40Q107 42 109 54Q119 65 104 73Q105 83 84 85Q68 92 54 87Q32 92 21 81Q6 80 12 62Z" fill={light} stroke="#b6819c" strokeWidth="2.5" />
            <ellipse cx="60" cy="63" rx="39" ry="18" fill={pink} />
            <path d="M25 63q9-7 19-1m3 11q9-6 18-1m5-15q9-5 17 0m-57 18 5-3m54 1 5-3" fill="none" stroke="#fff5f7" strokeWidth="2.5" strokeLinecap="round" />
        </>;
        case "cat_tree": return <>
            {line("M22 101h76", wood, 9)}
            {line("M43 97V26M84 97V53", wood, 11)}
            {rect(16, 19, 58, 13, mint, 7)}
            {rect(64, 45, 44, 12, pink, 7)}
            <path d="M29 24V10l9 4q7-3 15 0l9-4v14Z" fill={light} stroke={dark} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M41 24v-4q5-5 10 0v4" fill={lav} stroke={dark} strokeWidth="2" />
            {line("M40 61l6-4m-6 13 6-4m-6 13 6-4", light, 2)}
            {line("M83 57v16", gold, 3)}
            {circle(83, 77, 6, gold)}
        </>;
        case "plush": return <>
            <g stroke={dark} strokeWidth="2.5">
                <ellipse cx="60" cy="77" rx="28" ry="25" fill={pink} />
                <ellipse cx="32" cy="77" rx="10" ry="15" fill={pink} transform="rotate(24 32 77)" />
                <ellipse cx="88" cy="77" rx="10" ry="15" fill={pink} transform="rotate(-24 88 77)" />
                <ellipse cx="43" cy="95" rx="14" ry="10" fill={lav} />
                <ellipse cx="77" cy="95" rx="14" ry="10" fill={lav} />
                <circle cx="39" cy="24" r="12" fill={lav} />
                <circle cx="81" cy="24" r="12" fill={lav} />
                <ellipse cx="60" cy="45" rx="32" ry="27" fill={pink} />
            </g>
            <ellipse cx="60" cy="53" rx="13" ry="9" fill={light} />
            <path d="M48 43h1m22 0h1m-16 8 4 3 4-3m-4 3v3" fill="none" stroke={dark} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </>;
        case "velvet_armchair": return <>
            {rect(23, 16, 74, 80, lav, 28)}
            {rect(12, 57, 25, 35, pink, 10)}
            {rect(83, 57, 25, 35, pink, 10)}
            {rect(30, 66, 60, 25, light, 11)}
            {line("M32 92v9M89 92v9", wood, 6)}
        </>;
        case "tea_cart": return <>
            {rect(16, 42, 87, 11, gold, 3)}
            {rect(20, 73, 79, 10, wood, 3)}
            {line("M27 50v39M94 50v39", wood, 5)}
            {circle(29, 96, 9, dark)}
            {circle(90, 96, 9, dark)}
            {circle(46, 33, 13, light)}
            {line("M60 31q17-9 18 3q-1 12-17 6", pink, 4)}
            {line("M47 16q-7-8 0-13", lav, 3)}
        </>;
        case "flower_vase": return <>
            <path d="M46 54h28l-4 17q17 12 10 22q-4 8-20 8t-20-8q-7-10 10-22Z" fill={lav} stroke={dark} strokeWidth="2.5" strokeLinejoin="round" />
            {line("M60 53V23M60 48 35 34M60 41l25-16", "#75a991", 4)}
            {[[60, 23], [34, 33], [87, 26]].map(([x, y], i) => <g key={i}>
                {[0, 1, 2, 3, 4].map(j => <circle key={j} cx={x + Math.cos(j * 6.28 / 5) * 10} cy={y + Math.sin(j * 6.28 / 5) * 10} r="7" fill={pink} />)}
                {circle(x, y, 6, gold)}
            </g>)}
        </>;
        case "record_player": return <>
            {rect(13, 40, 94, 57, wood)}
            {circle(49, 66, 23, dark)}
            {circle(49, 66, 9, pink)}
            {line("M91 49l-20 22 7 6", gold, 5)}
            {rect(24, 91, 72, 7, light, 3)}
        </>;
        case "fireplace": return <>
            {rect(13, 9, 94, 95, wood)}
            {rect(23, 34, 74, 63, dark, 20)}
            <path d="M60 90Q32 71 51 48Q55 62 62 47Q90 73 60 90" fill={gold} />
            <path d="M60 91Q47 78 60 63Q75 79 60 91" fill={pink} />
            {rect(6, 8, 108, 14, light, 2)}
        </>;
        case "canopy_bed": return <>
            {line("M14 14v88m90-88v88", wood, 7)}
            {line("M14 14h90", wood, 6)}
            <path d="M16 18q16 28 29 0M76 18q12 28 27 0" fill={pink} stroke={lav} strokeWidth="3" />
            {rect(18, 54, 84, 40, lav, 7)}
            {rect(24, 61, 72, 28, light, 9)}
            {rect(29, 60, 26, 13, pink, 6)}
        </>;
        case "moon_lamp": return <>
            {line("M60 70v27M37 98h46", wood, 5)}
            <path d="M78 12A32 32 0 1 0 85 66A27 27 0 0 1 78 12Z" fill={gold} stroke={dark} strokeWidth="3" />
            {circle(48, 40, 3, light)}
        </>;
        case "vanity": return <>
            {rect(22, 68, 76, 29, pink)}
            {rect(37, 9, 47, 55, wood, 23)}
            {rect(43, 15, 35, 43, "#c9e6ef", 19)}
            {circle(61, 83, 4, gold)}
            {line("M34 97v7M88 97v7", wood, 5)}
        </>;
        case "star_pillow": return <>
            <path d="M60 9L73 40L106 44L82 65L88 99L60 82L32 99L38 65L14 44L47 40Z" fill={gold} stroke={pink} strokeWidth="5" />
            {circle(49, 57, 3, dark)}
            {circle(72, 57, 3, dark)}
            {line("M54 69q6 5 12 0")}
        </>;
        case "cloud_dresser": return <>
            {rect(17, 35, 86, 64, light, 11)}
            {line("M22 45h76m-76 21h76m-76 21h76", pink, 3)}
            {circle(60, 55, 3, gold)}
            {circle(60, 76, 3, gold)}
            {[27, 44, 60, 78, 94].map((x, i) => <circle key={i} cx={x} cy="33" r="16" fill={pink} />)}
        </>;
        case "cozy_bench": return <>
            {rect(15, 47, 90, 29, mint, 12)}
            {rect(17, 24, 86, 29, light, 14)}
            {line("M30 76v25M90 76v25", wood, 7)}
            {rect(39, 43, 42, 15, pink, 6)}
        </>;
        case "drawing_table": return <>
            {rect(9, 28, 102, 15, wood, 4)}
            {line("M25 43l-8 56M95 43l8 56", wood, 7)}
            <path d="M31 24L78 9L93 31L44 42Z" fill={light} stroke={dark} strokeWidth="2" />
            {line("M49 26l22-8", pink, 4)}
        </>;
        case "canvas_stack": return <>
            {[[15, 26], [29, 17], [44, 9]].map(([x, y], i) => <g key={i}>
                {rect(x, y, 60, 74, light, 2)}
                {line(`M${x + 10} ${y + 56}l16-19 14 11 9-24`, [mint, pink, lav][i], 4)}
            </g>)}
        </>;
        case "paint_cart": return <>
            {rect(16, 44, 88, 13, mint)}
            {rect(22, 73, 76, 10, wood)}
            {line("M30 56v36M91 56v36", wood, 5)}
            {circle(30, 98, 8, dark)}
            {circle(90, 98, 8, dark)}
            {[36, 57, 78].map((x, i) => <g key={i}>
                {rect(x - 8, 23, 16, 23, [pink, lav, gold][i])}
                {line(`M${x} 20v-9`, dark, 3)}
            </g>)}
        </>;
        case "sculpture": return <>
            {rect(28, 84, 64, 16, wood)}
            {rect(41, 66, 38, 18, light)}
            <path d="M60 12Q23 21 42 48Q53 57 44 70Q74 81 80 54Q99 28 60 12" fill={lav} stroke={dark} strokeWidth="3" />
            {circle(64, 39, 6, light)}
        </>;
        case "studio_lamp": return <>
            {line("M25 100h61M59 99V66L83 39", wood, 6)}
            {circle(59, 65, 7, gold)}
            <path d="M73 17h29l-3 29H78Z" fill={mint} stroke={dark} strokeWidth="3" />
            {line("M84 48l-10 18", gold, 4)}
        </>;
        case "craft_cabinet": return <>
            {rect(17, 11, 86, 90, mint)}
            {line("M60 15v82M21 57h78", wood, 4)}
            {[[40, 38], [80, 38], [40, 79], [80, 79]].map(([x, y], i) => <g key={i}>{circle(x, y, 4, [gold, pink, lav, light][i])}</g>)}
        </>;
        case "treadmill": return <>
            {line("M23 78L90 78L105 95H13Z", dark, 8)}
            {line("M91 76V23H70", lav, 7)}
            {rect(61, 17, 31, 17, light)}
            {line("M25 79h55", pink, 5)}
        </>;
        case "boxing_bag": return <>
            {line("M60 5v23", wood, 5)}
            {line("M43 28l17-17 17 17", dark, 3)}
            {rect(38, 28, 44, 68, pink, 20)}
            {line("M42 54h36", light, 5)}
            {circle(60, 72, 8, gold)}
        </>;
        case "fitness_ball": return <>
            {circle(60, 59, 43, mint)}
            <path d="M26 41q24 15 61-12M18 59q33 19 82-14M25 80q34 12 78-15M39 94q29 6 54-9" fill="none" stroke="#6da99a" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M33 29q9-8 19-9" fill="none" stroke={light} strokeWidth="4" strokeLinecap="round" />
        </>;
        case "medal_case": return <>
            {rect(15, 13, 90, 86, wood)}
            {[36, 60, 84].map((x, i) => <g key={i}>
                {line(`M${x - 8} 25l8 17 8-17`, [pink, mint, lav][i], 6)}
                {circle(x, 50, 10, gold)}
            </g>)}
            {line("M24 77h72", light, 4)}
        </>;
        case "skipping_rope": return <>
            {line("M26 31C12 106 110 107 94 31", pink, 8)}
            {rect(17, 10, 17, 30, mint, 6)}
            {rect(86, 10, 17, 30, mint, 6)}
        </>;
        case "mini_bike": return <>
            {circle(30, 78, 22, lav)}
            {circle(91, 78, 22, lav)}
            {line("M30 78l25-42 36 42H30l27-30M54 36h15M91 78l-11-46h14", pink, 5)}
            {line("M48 33h18", wood, 5)}
        </>;
        default: return <>
            {circle(60, 55, 30, pink)}
        </>;
    }
}

/*
 * DOCU: Draw the starter furnishings that need a distinct silhouette in their room.
 * @param {string} id - Catalog ID of the starter furnishing
 * @returns {JSX.Element | null} - Custom SVG artwork, or null when the existing category art fits
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function starterFurnitureArt(id: string) {
    switch (id) {
        case "living_sofa":
            return <g stroke="#a76c8c" strokeWidth="3" strokeLinejoin="round">
                <path d="M23 63V42Q23 25 38 25Q45 15 60 23Q75 15 82 25Q97 25 97 42V63Z" fill="#f1b5ce" />
                <path d="M24 86v12m72-12v12" stroke="#a57d72" strokeWidth="6" strokeLinecap="round" />
                <rect x="19" y="62" width="82" height="25" rx="9" fill="#ffe2e9" />
                <path d="M60 64v20" />
                <rect x="9" y="53" width="16" height="37" rx="8" fill="#d598b4" />
                <rect x="95" y="53" width="16" height="37" rx="8" fill="#d598b4" />
            </g>;
        case "living_table":
            return <g stroke="#a57d72" strokeWidth="3" strokeLinejoin="round">
                <path d="m27 69-4 24h8l7-24m44 0 7 24h8l-4-24" fill="#b78d7f" />
                <path d="M10 57v10q0 13 50 13t50-13V57Z" fill="#c69384" />
                <ellipse cx="60" cy="57" rx="50" ry="16" fill="#eac0a5" />
                <path d="M26 56q12-6 30-6" fill="none" stroke="#f8dcc5" strokeLinecap="round" />
            </g>;
        case "living_rug":
            return <g>
                <path d="M9 50l12 30q39 10 78 0l12-30q-51-13-102 0Z" fill="#e8acc1" stroke="#a87391" strokeWidth="3" strokeLinejoin="round" />
                <path d="M20 55q40-9 80 0l-8 18q-32 7-64 0Z" fill="#f7d2dd" stroke="#fff2ef" strokeWidth="2" strokeDasharray="4 3" />
                <path d="M26 82l2 7m8-5 2 7m9-6 1 7m11-6v7m12-8-1 7m11-8-2 7m11-9-2 7" fill="none" stroke="#bc809c" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M52 64q3-8 8-3q5-5 8 3q-1 4-8 7q-7-3-8-7Z" fill="#ca789d" />
            </g>;
        case "bedroom_nightstand":
            return <g stroke="#a57d72" strokeWidth="3" strokeLinejoin="round">
                <path d="M34 89v11m52-11v11" strokeWidth="6" strokeLinecap="round" />
                <rect x="26" y="35" width="68" height="57" rx="7" fill="#ddaa95" />
                <rect x="21" y="29" width="78" height="12" rx="4" fill="#f2c7af" />
                <rect x="33" y="48" width="54" height="15" rx="3" fill="#f4d1c2" />
                <rect x="33" y="69" width="54" height="15" rx="3" fill="#f4d1c2" />
                <path d="M56 55h8m-8 21h8" strokeLinecap="round" />
            </g>;
        case "bedroom_wardrobe":
            return <g stroke="#9d738b" strokeWidth="3" strokeLinejoin="round">
                <path d="M26 94v8m68-8v8" strokeWidth="6" strokeLinecap="round" />
                <rect x="17" y="10" width="86" height="86" rx="8" fill="#d4a2b9" />
                <rect x="24" y="17" width="32" height="68" rx="12" fill="#f4ccda" />
                <rect x="64" y="17" width="32" height="68" rx="12" fill="#f4ccda" />
                <path d="M48 49v11m24-11v11" stroke="#b78c60" strokeWidth="4" strokeLinecap="round" />
            </g>;
        case "bedroom_nightlight":
            return <g>
                <rect x="33" y="83" width="54" height="13" rx="6" fill="#d6add3" stroke="#9d7d96" strokeWidth="3" />
                <path d="M72 22A29 29 0 1 0 82 69A25 25 0 0 1 72 22Z" fill="#ffe8ac" stroke="#ad8b9b" strokeWidth="3" strokeLinejoin="round" />
                <path d="M88 28v12m-6-6h12M27 38v10m-5-5h10" stroke="#dfad77" strokeWidth="2.5" strokeLinecap="round" />
            </g>;
        case "bedroom_plush":
            return <g stroke="#9d738b" strokeWidth="2.5">
                <ellipse cx="60" cy="78" rx="33" ry="19" fill="#e9b7cd" />
                <ellipse cx="38" cy="45" rx="10" ry="23" fill="#f0c4d7" transform="rotate(-21 38 45)" />
                <ellipse cx="63" cy="40" rx="10" ry="23" fill="#f0c4d7" transform="rotate(12 63 40)" />
                <ellipse cx="49" cy="64" rx="24" ry="19" fill="#f0c4d7" />
                <path d="M36 64q4 4 8 0m8 0q4 4 8 0m-14 8q3 3 6 0" fill="none" strokeLinecap="round" />
                <ellipse cx="78" cy="83" rx="13" ry="8" fill="#f5d7e2" />
            </g>;
        case "studio_desk":
            return <g stroke="#a57d72" strokeWidth="3" strokeLinejoin="round">
                <path d="M22 62v38m73-38v38" strokeWidth="7" strokeLinecap="round" />
                <rect x="13" y="47" width="94" height="18" rx="4" fill="#e7bb9e" />
                <rect x="71" y="65" width="29" height="25" rx="3" fill="#dca995" />
                <path d="M80 76h10" strokeLinecap="round" />
                <path d="M28 43l16-18 30 8-14 14Z" fill="#fff4e9" />
                <path d="m43 38 17-6" stroke="#c489a6" strokeLinecap="round" />
            </g>;
        case "studio_bookshelf":
            return <g stroke="#a57d72" strokeWidth="3" strokeLinejoin="round">
                <rect x="18" y="13" width="84" height="87" rx="5" fill="#dfb098" />
                <path d="M23 54h74m-74 33h74" />
                <path d="M29 49V27h10v22m5 0V22h11v27m15 0 8-22 9 3-7 19" fill="#b7d7c5" />
                <path d="M32 83V63h13v20m6 0V58h12v25m7 0V66h16v17" fill="#d5bfe6" />
            </g>;
        case "studio_paint":
            return <g stroke="#a57d72" strokeWidth="3" strokeLinejoin="round">
                <path d="M24 67v31m72-31v31" strokeWidth="7" strokeLinecap="round" />
                <rect x="13" y="59" width="94" height="13" rx="4" fill="#dfb098" />
                <path d="M29 39h21l-3 20H32Z" fill="#d9c3e9" />
                <path d="m36 39-5-15m12 15 7-21" strokeLinecap="round" />
                <path d="M58 48q0-12 18-12q20 0 20 10q0 7-12 7q-9 0-9 6q-17 0-17-11Z" fill="#fff2e8" />
                <path d="M67 47h1m8-5h1m8 2h1" stroke="#bd83a5" strokeWidth="4" strokeLinecap="round" />
            </g>;
        case "studio_stool":
            return <g stroke="#a57d72" strokeWidth="3" strokeLinejoin="round">
                <path d="m43 60-9 37h8l11-37m14 0 11 37h8l-9-37M45 82h30" fill="#c39382" />
                <path d="M26 52v9q0 11 34 11t34-11v-9Z" fill="#cf9bb5" />
                <ellipse cx="60" cy="52" rx="34" ry="12" fill="#efbbcf" />
            </g>;
        case "sports_mat":
            return <g>
                <path d="M12 80 39 47h59l10 33q1 5-4 5H16q-5 0-4-5Z" fill="#94c6b6" stroke="#649e90" strokeWidth="3" strokeLinejoin="round" />
                <path d="M20 76h79M28 67h68M36 57h57" stroke="#c7e6d8" strokeWidth="2" strokeLinecap="round" />
                <path d="M39 47q-8 0-8-8t8-8h55q8 0 8 8t-8 8Z" fill="#b0d9ca" stroke="#649e90" strokeWidth="3" />
                <path d="M94 47a8 8 0 1 1 8-8q0 4-4 4t-4-4" fill="none" stroke="#649e90" strokeWidth="2" strokeLinecap="round" />
            </g>;
        case "sports_weights":
            return <g stroke="#796b91" strokeWidth="3" strokeLinejoin="round">
                <path d="m28 56 61-15m-61 38 61-15" strokeWidth="7" strokeLinecap="round" />
                <path d="m18 44 14-4 8 9-1 15-14 4-9-9Zm61-15 14-4 8 9-1 15-14 4-9-9ZM18 67l14-4 8 9-1 15-14 4-9-9Zm61-15 14-4 8 9-1 15-14 4-9-9Z" fill="#b9a9d8" />
            </g>;
        case "sports_rack":
            return <g stroke="#806c91" strokeWidth="3" strokeLinejoin="round">
                <path d="M19 99 32 24h56l13 75M26 68h68m-61-24h54" fill="none" strokeWidth="6" strokeLinecap="round" />
                <path d="M39 38h42m-46 23h50m-55 22h60" strokeWidth="4" strokeLinecap="round" />
                <path d="M39 33v10m42-10v10M35 55v12m50-12v12M30 76v14m60-14v14" stroke="#bb94bb" strokeWidth="9" strokeLinecap="round" />
            </g>;
        case "sports_bag":
            return <g stroke="#946981" strokeWidth="3" strokeLinejoin="round">
                <path d="M59 12v9L44 34m15-13 15 13" fill="none" strokeLinecap="round" />
                <rect x="38" y="32" width="43" height="65" rx="17" fill="#bfa6cf" />
                <path d="M39 53h41m-41 24h41" stroke="#e9cee6" strokeWidth="4" />
                <path d="M47 42v43" stroke="#a587b7" strokeLinecap="round" />
            </g>;
        case "sports_water":
            return <g stroke="#7e8d9f" strokeWidth="3" strokeLinejoin="round">
                <rect x="43" y="13" width="34" height="37" rx="12" fill="#bce4eb" />
                <path d="M45 29q7-4 15 0t15 0v12H45Z" fill="#90cbd9" stroke="none" />
                <rect x="35" y="49" width="50" height="50" rx="7" fill="#f4e5ef" />
                <rect x="43" y="62" width="34" height="23" rx="4" fill="#b4a5c9" />
                <path d="M56 72h8l-2 10h-4Z" fill="#fff7ef" strokeWidth="2" />
                <path d="M51 56h1m16 0h1" strokeWidth="4" strokeLinecap="round" />
            </g>;
        default:
            return null;
    }
}

/*
 * DOCU: Render the SVG for a catalog furnishing, using category artwork when an item has no custom drawing.
 * @param {{ kind: string, itemId?: string }} props - Furniture category and optional catalog ID
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function FurnitureArtBase({ kind, itemId }: {
    kind: string;
    itemId?: string
}) {
    if (itemId && CUSTOM_FURNITURE.has(itemId)) {
        return <svg viewBox="0 0 120 110" width="100%" height="100%" role="img" aria-label={FURNITURE[itemId]?.name || "Furniture"}>
            <CustomFurniture id={itemId} />
        </svg>;
    }
    const starterArt = itemId ? starterFurnitureArt(itemId) : null;
    return <svg viewBox="0 0 120 110" width="100%" height="100%" aria-hidden="true" style={{
        overflow: "visible"
    }}>
        {kind !== "rug" && kind !== "mat" && <ellipse cx="60" cy="101" rx="48" ry="6" fill="#856879" opacity=".15" />}
        {starterArt ?? <>
            {kind === "sofa" ? <>
                <rect x="10" y="37" width="100" height="60" rx="19" fill="#bb849f" />
                <rect x="17" y="14" width="86" height="61" rx="19" fill="#f1b5ce" stroke="#a76c8c" strokeWidth="3" />
                <rect x="20" y="65" width="80" height="27" rx="12" fill="#ffe2e9" />
            </> : null}
            {kind === "bed" ? <>
                <rect x="8" y="25" width="104" height="70" rx="12" fill="#b78eaf" />
                <rect x="13" y="32" width="94" height="55" rx="9" fill="#f2bfd5" />
                <rect x="18" y="37" width="35" height="24" rx="9" fill="#fff6fa" />
                <rect x="57" y="37" width="35" height="24" rx="9" fill="#fff6fa" />
                <path d="M14 74h92" stroke="#b47a9a" strokeWidth="3" />
            </> : null}
            {["table", "stool", "chair"].includes(kind) ? <>
                <rect x="15" y="41" width="90" height="22" rx="11" fill="#dfac91" stroke="#a57d72" strokeWidth="3" />
                <path d="M31 62v35M89 62v35" stroke="#a57d72" strokeWidth="8" strokeLinecap="round" />
                {kind === "chair" && <rect x="18" y="11" width="84" height="38" rx="16" fill="#efbbcf" />}
            </> : null}
            {["lamp", "water"].includes(kind) ? <>
                <path d="M60 42v52M35 96h50" stroke="#9d7d96" strokeWidth="7" strokeLinecap="round" />
                <path d="M32 43L44 8h32l12 35z" fill="#ffe5ad" stroke="#ad8b9b" strokeWidth="3" />
            </> : null}
            {["plant", "tree"].includes(kind) ? <>
                <path d="M36 73Q10 37 32 17Q56 26 57 69Q55 8 81 9Q102 40 64 74Q91 38 105 56Q95 78 64 83" fill="#9bcbb1" stroke="#5b987e" strokeWidth="3" />
                <path d="M30 76h60l-10 27H40z" fill="#d8a2a7" stroke="#9d737f" strokeWidth="3" />
            </> : null}
            {["shelf", "wardrobe", "rack", "vanity"].includes(kind) ? <>
                <rect x="19" y="10" width="82" height="92" rx="7" fill="#e2b5a3" stroke="#a77e7a" strokeWidth="4" />
                <path d="M22 48h76M60 11v90" stroke="#a77e7a" strokeWidth="4" />
                {kind === "vanity" ? <ellipse cx="60" cy="35" rx="22" ry="20" fill="#bce3eb" /> : <>
                    <rect x="30" y="19" width="12" height="25" fill="#b6d3bd" />
                    <rect x="70" y="59" width="17" height="30" fill="#c5b4dd" />
                </>}
            </> : null}
            {["rug", "mat"].includes(kind) ? <>
                <ellipse cx="60" cy="61" rx="55" ry="34" fill={kind === "mat" ? "#9fcbbb" : "#f4c3d6"} stroke="#b37b9c" strokeWidth="4" />
                <ellipse cx="60" cy="61" rx="37" ry="21" fill="none" stroke="#fff5fa" strokeWidth="3" />
            </> : null}
            {["plush", "ball"].includes(kind) ? <>
                <circle cx="60" cy="63" r="37" fill="#f1bcd3" stroke="#bd8aa3" strokeWidth="3" />
                {kind === "plush" && <>
                    <circle cx="33" cy="28" r="14" fill="#f1bcd3" />
                    <circle cx="87" cy="28" r="14" fill="#f1bcd3" />
                    <circle cx="48" cy="61" r="3" fill="#80586f" />
                    <circle cx="72" cy="61" r="3" fill="#80586f" />
                    <path d="M54 72q6 7 12 0" fill="none" stroke="#80586f" strokeWidth="3" />
                </>}
            </> : null}
            {["easel", "paint", "sculpture", "music", "fire"].includes(kind) ? <>
                <path d="M60 15L20 100M60 15l40 85" stroke="#b28b80" strokeWidth="7" />
                <rect x="25" y="21" width="70" height="62" rx="5" fill="#fff5e9" stroke="#bd8d9c" strokeWidth="4" />
                <circle cx="53" cy="48" r="14" fill="#a8cfbe" />
                <path d="M40 66q20-30 40 0" stroke="#e4a6b9" strokeWidth="8" fill="none" />
            </> : null}
            {["weights", "bag", "treadmill", "rope", "bike"].includes(kind) ? <>
                <rect x="17" y="52" width="86" height="13" rx="6" fill="#c1b2d6" />
                <path d="M18 37v42M102 37v42" stroke="#7d709d" strokeWidth="14" strokeLinecap="round" />
                <path d="M60 15v30" stroke="#a99ac3" strokeWidth="5" />
            </> : null}
        </>}
    </svg>;
}
/*
 * DOCU: Render the room furniture interface and provide its feature behavior.
 * @param {{
    room: string,
    layout: FurniturePlacement[],
    editing: boolean,
    onMove: (id: string, x: number, y: number) => void,
    onSelect: (id: string) => void,
    selected: string | null
}} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function RoomFurniture({ room, layout, editing, onMove, onSelect, selected }: {
    room: string,
    layout: FurniturePlacement[],
    editing: boolean,
    onMove: (id: string, x: number, y: number) => void,
    onSelect: (id: string) => void,
    selected: string | null
}) {
    const [drag, setDrag] = useState<{
        id: string,
        x: number,
        y: number
    } | null>(null);
    return <div className={"room-furniture-layer " + (editing ? "editing" : "")}>
        {layout.filter(f => FURNITURE[f.id]?.room === room).map(f => {
            const current = drag?.id === f.id ? drag : f;
            return <div key={f.id} className={"room-furniture-piece " + (selected ===f.id ? "selected" : "")} style={{left:current.x + "%",top:current.y + "%"}} title={FURNITURE[f.id].name} onPointerDown={e => {if (!editing) {return;} e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); onSelect(f.id); setDrag({id:f.id,x:f.x,y:f.y})}} onPointerMove={e => {if (!editing || drag?.id !==f.id) {return;} const bounds =e.currentTarget.parentElement!.getBoundingClientRect(); setDrag({id:f.id,x:Math.min(95,Math.max(5,(e.clientX - bounds.left) / bounds.width * 100)),y:Math.min(85,Math.max(20,(e.clientY - bounds.top) / bounds.height * 100))})}} onPointerUp={() => {if (drag?.id ===f.id) {onMove(f.id,Math.round(drag.x),Math.round(drag.y)); setDrag(null)}}}>
                <FurnitureArt kind={FURNITURE[f.id].kind} itemId={f.id} />
                {editing && <small>
                    {FURNITURE[f.id].name}
                </small>}
            </div>
        })}
    </div>;
}

// Cache unchanged SVG furniture trees; each itemId retains its own unique artwork.
export const FurnitureArt = memo(FurnitureArtBase);
