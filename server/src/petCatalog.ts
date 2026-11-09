const species = ["cat", "dog", "bunny", "fox", "hamster", "panda", "penguin", "axolotl"];

export const catalog: Record<
    string,
    {
        price: number;
        type: string;
        level?: number;
    }
> = {
    eurasian_lynx: {
        price: 24000,
        type: "breed",
        level: 7
    },
    snow_leopard: {
        price: 30975,
        type: "breed",
        level: 16
    },
    smilodon: {
        price: 41825,
        type: "breed",
        level: 30
    },
    gray_wolf: {
        price: 24000,
        type: "breed",
        level: 7
    },
    african_wild_dog: {
        price: 30975,
        type: "breed",
        level: 16
    },
    dire_wolf: {
        price: 41825,
        type: "breed",
        level: 30
    },
    pygmy_rabbit: {
        price: 24000,
        type: "breed",
        level: 7
    },
    volcano_rabbit: {
        price: 30975,
        type: "breed",
        level: 16
    },
    nuralagus: {
        price: 41825,
        type: "breed",
        level: 30
    },
    kit_fox: {
        price: 24000,
        type: "breed",
        level: 7
    },
    swift_fox: {
        price: 30975,
        type: "breed",
        level: 16
    },
    island_fox: {
        price: 41825,
        type: "breed",
        level: 30
    },
    campbells_dwarf: {
        price: 24000,
        type: "breed",
        level: 7
    },
    european_hamster: {
        price: 30975,
        type: "breed",
        level: 16
    },
    brandts_hamster: {
        price: 41825,
        type: "breed",
        level: 30
    },
    grizzly_bear: {
        price: 24000,
        type: "breed",
        level: 7
    },
    polar_bear: {
        price: 30975,
        type: "breed",
        level: 16
    },
    short_faced_bear: {
        price: 41825,
        type: "breed",
        level: 30
    },
    african_penguin: {
        price: 24000,
        type: "breed",
        level: 7
    },
    king_penguin: {
        price: 30975,
        type: "breed",
        level: 16
    },
    waitaha_penguin: {
        price: 41825,
        type: "breed",
        level: 30
    },
    tiger_salamander: {
        price: 24000,
        type: "breed",
        level: 7
    },
    andersons_salamander: {
        price: 30975,
        type: "breed",
        level: 16
    },
    ambystoma_dumerilii: {
        price: 41825,
        type: "breed",
        level: 30
    },
    bow: {
        price: 420,
        type: "cosmetic"
    },
    cap: {
        price: 550,
        type: "cosmetic"
    },
    crown: {
        price: 2400,
        type: "cosmetic"
    },
    glasses: {
        price: 720,
        type: "cosmetic"
    },
    flower: {
        price: 460,
        type: "cosmetic"
    },
    scarf: {
        price: 790,
        type: "cosmetic"
    },
    halo: {
        price: 3000,
        type: "cosmetic"
    },
    party: {
        price: 850,
        type: "cosmetic"
    },
    pink: {
        price: 550,
        type: "color"
    },
    cream: {
        price: 450,
        type: "color"
    },
    gray: {
        price: 600,
        type: "color"
    },
    orange: {
        price: 650,
        type: "color"
    },
    black: {
        price: 650,
        type: "color"
    },
    lavender: {
        price: 950,
        type: "color"
    },
    mint: {
        price: 950,
        type: "color"
    },
    calico: {
        price: 8100,
        type: "breed"
    },
    tabby: {
        price: 7500,
        type: "breed"
    },
    tuxedo: {
        price: 8300,
        type: "breed"
    },
    spotted: {
        price: 7900,
        type: "breed"
    },
    fluffy: {
        price: 9300,
        type: "breed"
    },
    striped: {
        price: 8000,
        type: "breed"
    },
    cloud_sofa: {
        price: 2400,
        type: "furniture"
    },
    plant: {
        price: 580,
        type: "furniture"
    },
    lamp: {
        price: 950,
        type: "furniture"
    },
    bookshelf: {
        price: 1800,
        type: "furniture"
    },
    rug: {
        price: 950,
        type: "furniture"
    },
    cat_tree: {
        price: 2200,
        type: "furniture"
    },
    plush: {
        price: 750,
        type: "furniture"
    },
    golden: {
        price: 7500,
        type: "breed"
    },
    dalmatian: {
        price: 8100,
        type: "breed"
    },
    husky: {
        price: 8700,
        type: "breed"
    },
    corgi: {
        price: 9300,
        type: "breed"
    },
    lop: {
        price: 7500,
        type: "breed"
    },
    dutch: {
        price: 8100,
        type: "breed"
    },
    angora: {
        price: 8700,
        type: "breed"
    },
    red_fox: {
        price: 7500,
        type: "breed"
    },
    arctic_fox: {
        price: 8100,
        type: "breed"
    },
    fennec: {
        price: 8700,
        type: "breed"
    },
    silver_fox: {
        price: 9300,
        type: "breed"
    },
    syrian: {
        price: 7500,
        type: "breed"
    },
    dwarf: {
        price: 8100,
        type: "breed"
    },
    roborovski: {
        price: 8700,
        type: "breed"
    },
    banded: {
        price: 9300,
        type: "breed"
    },
    giant_panda: {
        price: 7500,
        type: "breed"
    },
    red_panda: {
        price: 8100,
        type: "breed"
    },
    snow_panda: {
        price: 8700,
        type: "breed"
    },
    baby_panda: {
        price: 9300,
        type: "breed"
    },
    emperor: {
        price: 7500,
        type: "breed"
    },
    adelie: {
        price: 8100,
        type: "breed"
    },
    gentoo: {
        price: 8700,
        type: "breed"
    },
    chinstrap: {
        price: 9300,
        type: "breed"
    },
    leucistic: {
        price: 7500,
        type: "breed"
    },
    wild_type: {
        price: 8100,
        type: "breed"
    },
    melanoid: {
        price: 8700,
        type: "breed"
    },
    golden_albino: {
        price: 9300,
        type: "breed"
    },
    star_clip: {
        price: 800,
        type: "cosmetic"
    },
    heart_shades: {
        price: 970,
        type: "cosmetic"
    },
    pearl_necklace: {
        price: 1140,
        type: "cosmetic"
    },
    moon_crown: {
        price: 1310,
        type: "cosmetic"
    },
    rainbow_scarf: {
        price: 1480,
        type: "cosmetic"
    },
    fish_clip: {
        price: 1250,
        type: "cosmetic"
    },
    yarn_hat: {
        price: 1700,
        type: "cosmetic"
    },
    bone_tag: {
        price: 1250,
        type: "cosmetic"
    },
    puppy_bandana: {
        price: 1700,
        type: "cosmetic"
    },
    carrot_clip: {
        price: 1250,
        type: "cosmetic"
    },
    clover_crown: {
        price: 1700,
        type: "cosmetic"
    },
    leaf_cape: {
        price: 1250,
        type: "cosmetic"
    },
    forest_crown: {
        price: 1700,
        type: "cosmetic"
    },
    seed_pouch: {
        price: 1250,
        type: "cosmetic"
    },
    cheek_bow: {
        price: 1700,
        type: "cosmetic"
    },
    bamboo_clip: {
        price: 1250,
        type: "cosmetic"
    },
    bamboo_hat: {
        price: 1700,
        type: "cosmetic"
    },
    sailor_hat: {
        price: 1250,
        type: "cosmetic"
    },
    ice_scarf: {
        price: 1700,
        type: "cosmetic"
    },
    bubble_crown: {
        price: 1250,
        type: "cosmetic"
    },
    coral_clip: {
        price: 1700,
        type: "cosmetic"
    },
    siamese: {
        price: 13500,
        type: "breed"
    },
    british_shorthair: {
        price: 14850,
        type: "breed"
    },
    maine_coon: {
        price: 16200,
        type: "breed"
    },
    beagle: {
        price: 13500,
        type: "breed"
    },
    shiba: {
        price: 14850,
        type: "breed"
    },
    border_collie: {
        price: 16200,
        type: "breed"
    },
    lionhead: {
        price: 13500,
        type: "breed"
    },
    rex: {
        price: 14850,
        type: "breed"
    },
    himalayan: {
        price: 16200,
        type: "breed"
    },
    cross_fox: {
        price: 13500,
        type: "breed"
    },
    marble_fox: {
        price: 14850,
        type: "breed"
    },
    bat_eared_fox: {
        price: 16200,
        type: "breed"
    },
    winter_white: {
        price: 13500,
        type: "breed"
    },
    chinese_hamster: {
        price: 14850,
        type: "breed"
    },
    teddy_bear: {
        price: 16200,
        type: "breed"
    },
    qinling_panda: {
        price: 13500,
        type: "breed"
    },
    brown_panda: {
        price: 14850,
        type: "breed"
    },
    red_panda_cub: {
        price: 16200,
        type: "breed"
    },
    rockhopper: {
        price: 13500,
        type: "breed"
    },
    little_blue: {
        price: 14850,
        type: "breed"
    },
    macaroni: {
        price: 16200,
        type: "breed"
    },
    copper: {
        price: 13500,
        type: "breed"
    },
    piebald: {
        price: 14850,
        type: "breed"
    },
    mosaic: {
        price: 16200,
        type: "breed"
    },
    blush: {
        price: 0,
        type: "theme"
    },
    lavender_room: {
        price: 2500,
        type: "theme"
    },
    mint_room: {
        price: 2500,
        type: "theme"
    },
    night_room: {
        price: 3500,
        type: "theme"
    }
};

export const addedBreedsBySpecies: Record<string, string[]> = {
    cat: [
        "siamese",
        "british_shorthair",
        "maine_coon",
        "eurasian_lynx",
        "snow_leopard",
        "smilodon"
    ],
    dog: ["beagle", "shiba", "border_collie", "gray_wolf", "african_wild_dog", "dire_wolf"],
    bunny: ["lionhead", "rex", "himalayan", "pygmy_rabbit", "volcano_rabbit", "nuralagus"],
    fox: ["cross_fox", "marble_fox", "bat_eared_fox", "kit_fox", "swift_fox", "island_fox"],
    hamster: [
        "winter_white",
        "chinese_hamster",
        "teddy_bear",
        "campbells_dwarf",
        "european_hamster",
        "brandts_hamster"
    ],
    panda: [
        "qinling_panda",
        "brown_panda",
        "red_panda_cub",
        "grizzly_bear",
        "polar_bear",
        "short_faced_bear"
    ],
    penguin: [
        "rockhopper",
        "little_blue",
        "macaroni",
        "african_penguin",
        "king_penguin",
        "waitaha_penguin"
    ],
    axolotl: [
        "copper",
        "piebald",
        "mosaic",
        "tiger_salamander",
        "andersons_salamander",
        "ambystoma_dumerilii"
    ]
};

export const uniqueCosmeticsBySpecies: Record<string, string[]> = {
    cat: ["fish_clip", "yarn_hat"],
    dog: ["bone_tag", "puppy_bandana"],
    bunny: ["carrot_clip", "clover_crown"],
    fox: ["leaf_cape", "forest_crown"],
    hamster: ["seed_pouch", "cheek_bow"],
    panda: ["bamboo_clip", "bamboo_hat"],
    penguin: ["sailor_hat", "ice_scarf"],
    axolotl: ["bubble_crown", "coral_clip"]
};

export const breedsBySpecies: Record<string, string[]> = {
    cat: ["calico", "tabby", "tuxedo", "fluffy"],
    dog: ["golden", "dalmatian", "husky", "corgi"],
    bunny: ["lop", "dutch", "angora", "spotted"],
    fox: ["red_fox", "arctic_fox", "fennec", "silver_fox"],
    hamster: ["syrian", "dwarf", "roborovski", "banded"],
    panda: ["giant_panda", "red_panda", "snow_panda", "baby_panda"],
    penguin: ["emperor", "adelie", "gentoo", "chinstrap"],
    axolotl: ["leucistic", "wild_type", "melanoid", "golden_albino"]
};

// Append new breed IDs to addedBreedsBySpecies for their species.
// Every additional breed unlocks five levels after that species' previous breed.
// Existing levels never change when breeds are appended.
const BREED_LEVEL_INTERVAL = 5;

export const BREED_UNLOCK_LEVELS: Record<string, number> = {};

for (const speciesId of Object.keys(breedsBySpecies)) {
    const orderedBreeds = [
        ...breedsBySpecies[speciesId],
        ...(addedBreedsBySpecies[speciesId] || [])
    ];
    orderedBreeds.forEach((breedId, index) => {
        const requiredLevel = (index + 1) * BREED_LEVEL_INTERVAL;
        BREED_UNLOCK_LEVELS[breedId] = requiredLevel;
    });
}

for (const [breedId, level] of Object.entries(BREED_UNLOCK_LEVELS)) {
    if (catalog[breedId]) {
        catalog[breedId].level = level;
    }
}

export const COSMETIC_SLOTS: Record<string, string> = {
    bow: "head",
    cap: "head",
    crown: "head",
    flower: "head",
    halo: "head",
    party: "head",
    star_clip: "head",
    moon_crown: "head",
    fish_clip: "head",
    yarn_hat: "head",
    carrot_clip: "head",
    clover_crown: "head",
    forest_crown: "head",
    cheek_bow: "head",
    bamboo_clip: "head",
    bamboo_hat: "head",
    sailor_hat: "head",
    bubble_crown: "head",
    coral_clip: "head",
    glasses: "eyes",
    heart_shades: "eyes",
    scarf: "neck",
    pearl_necklace: "neck",
    rainbow_scarf: "neck",
    bone_tag: "neck",
    puppy_bandana: "neck",
    seed_pouch: "neck",
    ice_scarf: "neck",
    leaf_cape: "clothes",
    rose_beret: "head",
    straw_hat: "head",
    cloud_beanie: "head",
    star_tiara: "head",
    witch_hat: "head",
    sunflower_crown: "head",
    sleep_cap: "head",
    winter_earmuffs: "head",
    round_specs: "eyes",
    blue_goggles: "eyes",
    sleep_mask: "eyes",
    monocle: "eyes",
    butterfly_glasses: "eyes",
    aviators: "eyes",
    heart_collar: "neck",
    gold_chain: "neck",
    bow_tie: "neck",
    cherry_necklace: "neck",
    star_pendant: "neck",
    cozy_muffler: "neck",
    bell_collar: "neck",
    pink_hoodie: "clothes",
    denim_overalls: "clothes",
    flower_dress: "clothes",
    raincoat: "clothes",
    sailor_top: "clothes",
    striped_sweater: "clothes",
    royal_cape: "clothes",
    cloud_pajamas: "clothes",
    autumn_vest: "clothes",
    starry_jacket: "clothes",
    crystal_circlet: "head",
    cherry_blossom_crown: "head",
    moonlit_veil: "head",
    dragon_horns: "head",
    aurora_halo: "head",
    butterfly_crown: "head",
    pirate_tricorn: "head",
    royal_diadem: "head",
    galaxy_antlers: "head",
    phoenix_plume: "head",
    cat_eye_frames: "eyes",
    starlight_specs: "eyes",
    pixel_shades: "eyes",
    rose_gold_glasses: "eyes",
    emerald_goggles: "eyes",
    snowflake_lenses: "eyes",
    cyber_visor: "eyes",
    nebula_shades: "eyes",
    royal_mask: "eyes",
    prismatic_monocle: "eyes",
    moon_choker: "neck",
    emerald_pendant: "neck",
    flower_garland: "neck",
    silk_cravat: "neck",
    pearl_choker: "neck",
    sun_medallion: "neck",
    frost_necklace: "neck",
    royal_sash: "neck",
    cosmic_locket: "neck",
    phoenix_pendant: "neck",
    strawberry_cardigan: "clothes",
    forest_cloak: "clothes",
    moonlight_kimono: "clothes",
    dragon_armor: "clothes",
    aurora_dress: "clothes",
    butterfly_cape: "clothes",
    pirate_coat: "clothes",
    royal_uniform: "clothes",
    galaxy_robe: "clothes",
    phoenix_armor: "clothes"
};

const NEW_COSMETICS = {
    rose_beret: {
        price: 900,
        type: "cosmetic"
    },
    straw_hat: {
        price: 1100,
        type: "cosmetic"
    },
    cloud_beanie: {
        price: 950,
        type: "cosmetic"
    },
    star_tiara: {
        price: 1850,
        type: "cosmetic"
    },
    witch_hat: {
        price: 1550,
        type: "cosmetic"
    },
    sunflower_crown: {
        price: 1400,
        type: "cosmetic"
    },
    sleep_cap: {
        price: 820,
        type: "cosmetic"
    },
    winter_earmuffs: {
        price: 970,
        type: "cosmetic"
    },
    round_specs: {
        price: 850,
        type: "cosmetic"
    },
    blue_goggles: {
        price: 1350,
        type: "cosmetic"
    },
    sleep_mask: {
        price: 700,
        type: "cosmetic"
    },
    monocle: {
        price: 1250,
        type: "cosmetic"
    },
    butterfly_glasses: {
        price: 1350,
        type: "cosmetic"
    },
    aviators: {
        price: 1750,
        type: "cosmetic"
    },
    heart_collar: {
        price: 800,
        type: "cosmetic"
    },
    gold_chain: {
        price: 1900,
        type: "cosmetic"
    },
    bow_tie: {
        price: 650,
        type: "cosmetic"
    },
    cherry_necklace: {
        price: 990,
        type: "cosmetic"
    },
    star_pendant: {
        price: 1050,
        type: "cosmetic"
    },
    cozy_muffler: {
        price: 1250,
        type: "cosmetic"
    },
    bell_collar: {
        price: 850,
        type: "cosmetic"
    },
    pink_hoodie: {
        price: 1650,
        type: "cosmetic"
    },
    denim_overalls: {
        price: 1850,
        type: "cosmetic"
    },
    flower_dress: {
        price: 1750,
        type: "cosmetic"
    },
    raincoat: {
        price: 2100,
        type: "cosmetic"
    },
    sailor_top: {
        price: 1500,
        type: "cosmetic"
    },
    striped_sweater: {
        price: 1400,
        type: "cosmetic"
    },
    royal_cape: {
        price: 2850,
        type: "cosmetic"
    },
    cloud_pajamas: {
        price: 1200,
        type: "cosmetic"
    },
    autumn_vest: {
        price: 1350,
        type: "cosmetic"
    },
    starry_jacket: {
        price: 2300,
        type: "cosmetic"
    },
    crystal_circlet: {
        price: 1100,
        type: "cosmetic",
        level: 4
    },
    cherry_blossom_crown: {
        price: 1580,
        type: "cosmetic",
        level: 6
    },
    moonlit_veil: {
        price: 2060,
        type: "cosmetic",
        level: 8
    },
    dragon_horns: {
        price: 2540,
        type: "cosmetic",
        level: 10
    },
    aurora_halo: {
        price: 3020,
        type: "cosmetic",
        level: 12
    },
    butterfly_crown: {
        price: 3500,
        type: "cosmetic",
        level: 15
    },
    pirate_tricorn: {
        price: 3980,
        type: "cosmetic",
        level: 18
    },
    royal_diadem: {
        price: 4460,
        type: "cosmetic",
        level: 22
    },
    galaxy_antlers: {
        price: 4940,
        type: "cosmetic",
        level: 27
    },
    phoenix_plume: {
        price: 5420,
        type: "cosmetic",
        level: 35
    },
    cat_eye_frames: {
        price: 1100,
        type: "cosmetic",
        level: 4
    },
    starlight_specs: {
        price: 1580,
        type: "cosmetic",
        level: 6
    },
    pixel_shades: {
        price: 2060,
        type: "cosmetic",
        level: 8
    },
    rose_gold_glasses: {
        price: 2540,
        type: "cosmetic",
        level: 10
    },
    emerald_goggles: {
        price: 3020,
        type: "cosmetic",
        level: 12
    },
    snowflake_lenses: {
        price: 3500,
        type: "cosmetic",
        level: 15
    },
    cyber_visor: {
        price: 3980,
        type: "cosmetic",
        level: 18
    },
    nebula_shades: {
        price: 4460,
        type: "cosmetic",
        level: 22
    },
    royal_mask: {
        price: 4940,
        type: "cosmetic",
        level: 27
    },
    prismatic_monocle: {
        price: 5420,
        type: "cosmetic",
        level: 35
    },
    moon_choker: {
        price: 1100,
        type: "cosmetic",
        level: 4
    },
    emerald_pendant: {
        price: 1580,
        type: "cosmetic",
        level: 6
    },
    flower_garland: {
        price: 2060,
        type: "cosmetic",
        level: 8
    },
    silk_cravat: {
        price: 2540,
        type: "cosmetic",
        level: 10
    },
    pearl_choker: {
        price: 3020,
        type: "cosmetic",
        level: 12
    },
    sun_medallion: {
        price: 3500,
        type: "cosmetic",
        level: 15
    },
    frost_necklace: {
        price: 3980,
        type: "cosmetic",
        level: 18
    },
    royal_sash: {
        price: 4460,
        type: "cosmetic",
        level: 22
    },
    cosmic_locket: {
        price: 4940,
        type: "cosmetic",
        level: 27
    },
    phoenix_pendant: {
        price: 5420,
        type: "cosmetic",
        level: 35
    },
    strawberry_cardigan: {
        price: 1100,
        type: "cosmetic",
        level: 4
    },
    forest_cloak: {
        price: 1580,
        type: "cosmetic",
        level: 6
    },
    moonlight_kimono: {
        price: 2060,
        type: "cosmetic",
        level: 8
    },
    dragon_armor: {
        price: 2540,
        type: "cosmetic",
        level: 10
    },
    aurora_dress: {
        price: 3020,
        type: "cosmetic",
        level: 12
    },
    butterfly_cape: {
        price: 3500,
        type: "cosmetic",
        level: 15
    },
    pirate_coat: {
        price: 3980,
        type: "cosmetic",
        level: 18
    },
    royal_uniform: {
        price: 4460,
        type: "cosmetic",
        level: 22
    },
    galaxy_robe: {
        price: 4940,
        type: "cosmetic",
        level: 27
    },
    phoenix_armor: {
        price: 5420,
        type: "cosmetic",
        level: 35
    }
};

Object.assign(catalog, NEW_COSMETICS);

// Batch 8: additional collectible room themes, validated by the existing item route.
Object.assign(catalog, {
    strawberry_milk: {
        price: 2100,
        type: "theme"
    },
    lavender_dream: {
        price: 2300,
        type: "theme"
    },
    mint_garden: {
        price: 2300,
        type: "theme"
    },
    blueberry_sky: {
        price: 2500,
        type: "theme"
    },
    honey_cottage: {
        price: 2700,
        type: "theme"
    },
    peach_blossom: {
        price: 2700,
        type: "theme"
    },
    moonlight: {
        price: 3300,
        type: "theme"
    },
    sage_forest: {
        price: 2900,
        type: "theme"
    },
    aurora_prism: {
        price: 5600,
        type: "theme",
        level: 12
    },
    cosmic_nebula: {
        price: 7400,
        type: "theme",
        level: 20
    },
    crystal_lagoon: {
        price: 9200,
        type: "theme",
        level: 28
    },
    solar_eclipse: {
        price: 11500,
        type: "theme",
        level: 36
    },
    celestial_opal: {
        price: 14500,
        type: "theme",
        level: 45
    }
});

for (const [id, level] of Object.entries({
    cloud_sofa: 5,
    moon_crown: 12,
    night_room: 8,
    maine_coon: 15,
    red_panda_cub: 18,
    witch_hat: 10,
    star_tiara: 20
})) {
    if (catalog[id]) {
        catalog[id].level = level;
    }
}
