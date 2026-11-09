// Batch 10: room-specific furniture inventory and authoritative placement.
export const FURNITURE_BY_ROOM: Record<string, Record<string, number>> = {
    living: {
        cloud_sofa: 2400,
        plant: 580,
        lamp: 950,
        bookshelf: 1800,
        rug: 950,
        cat_tree: 2200,
        plush: 750,
        velvet_armchair: 1700,
        tea_cart: 1300,
        flower_vase: 720,
        record_player: 2300,
        fireplace: 3200,
        sunset_painting: 650,
        ocean_painting: 795,
        rose_bouquet: 940,
        tulip_bouquet: 1085,
        sage_monstera: 1230,
        mint_pothos: 1375,
        bubble_aquarium: 1520,
        cuckoo_clock: 1665,
        pastel_ottoman: 1810,
        window_seat: 1955
    },
    bedroom: {
        canopy_bed: 2800,
        moon_lamp: 850,
        vanity: 2100,
        star_pillow: 600,
        cloud_dresser: 1700,
        cozy_bench: 1100,
        rainbow_mobile: 650,
        starry_mobile: 795,
        lavender_quilt: 940,
        peach_quilt: 1085,
        bunny_slippers: 1230,
        bear_slippers: 1375,
        heart_mirror: 1520,
        jewelry_box: 1665,
        dreamcatcher: 1810,
        cloud_humidifier: 1955
    },
    studio: {
        drawing_table: 2200,
        canvas_stack: 780,
        paint_cart: 1200,
        sculpture: 1950,
        studio_lamp: 950,
        craft_cabinet: 1800,
        sunflower_canvas: 650,
        mountain_canvas: 795,
        ceramic_vase: 940,
        clay_bowl: 1085,
        yarn_basket: 1230,
        knitting_kit: 1375,
        color_wheel: 1520,
        polaroid_wall: 1665,
        calligraphy_set: 1810,
        mini_pottery_wheel: 1955
    },
    sports: {
        treadmill: 2900,
        boxing_bag: 1800,
        fitness_ball: 850,
        medal_case: 1300,
        skipping_rope: 520,
        mini_bike: 2400,
        basketball_hoop: 650,
        soccer_goal: 795,
        tennis_racket: 940,
        badminton_racket: 1085,
        jumping_hurdle: 1230,
        balance_beam: 1375,
        speed_ladder: 1520,
        climbing_wall: 1665,
        kettlebell_set: 1810,
        sports_trophy: 1955
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

export const DEFAULT_ROOM_FURNITURE: Record<string, string[]> = {
    living: ["living_sofa", "living_table", "living_rug", "living_lamp", "living_plant"],
    bedroom: [
        "bedroom_bed",
        "bedroom_nightstand",
        "bedroom_wardrobe",
        "bedroom_nightlight",
        "bedroom_plush"
    ],
    studio: ["studio_desk", "studio_easel", "studio_bookshelf", "studio_paint", "studio_stool"],
    sports: ["sports_mat", "sports_weights", "sports_rack", "sports_bag", "sports_water"]
};

const DEFAULT_POSITIONS: [
    [number, number],
    [number, number],
    [number, number],
    [number, number],
    [number, number]
] = [
    [70, 61],
    [28, 60],
    [48, 78],
    [88, 38],
    [13, 45]
];

export function initialLayout(room: string) {
    return DEFAULT_ROOM_FURNITURE[room].map((id, i) => ({
        id,
        x: DEFAULT_POSITIONS[i][0],
        y: DEFAULT_POSITIONS[i][1]
    }));
}
