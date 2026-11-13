export const species = ["cat", "dog", "bunny", "fox", "hamster", "panda", "penguin", "axolotl"];

export const ITEM_LEVEL_REQUIREMENTS: Record<string, number> = {
    crystal_circlet: 4,
    cherry_blossom_crown: 6,
    moonlit_veil: 8,
    dragon_horns: 10,
    aurora_halo: 12,
    butterfly_crown: 15,
    pirate_tricorn: 18,
    royal_diadem: 22,
    galaxy_antlers: 27,
    phoenix_plume: 35,
    cat_eye_frames: 4,
    starlight_specs: 6,
    pixel_shades: 8,
    rose_gold_glasses: 10,
    emerald_goggles: 12,
    snowflake_lenses: 15,
    cyber_visor: 18,
    nebula_shades: 22,
    royal_mask: 27,
    prismatic_monocle: 35,
    moon_choker: 4,
    emerald_pendant: 6,
    flower_garland: 8,
    silk_cravat: 10,
    pearl_choker: 12,
    sun_medallion: 15,
    frost_necklace: 18,
    royal_sash: 22,
    cosmic_locket: 27,
    phoenix_pendant: 35,
    strawberry_cardigan: 4,
    forest_cloak: 6,
    moonlight_kimono: 8,
    dragon_armor: 10,
    aurora_dress: 12,
    butterfly_cape: 15,
    pirate_coat: 18,
    royal_uniform: 22,
    galaxy_robe: 27,
    phoenix_armor: 35,
    eurasian_lynx: 33,
    snow_leopard: 42,
    smilodon: 50,
    gray_wolf: 33,
    african_wild_dog: 42,
    dire_wolf: 50,
    pygmy_rabbit: 33,
    volcano_rabbit: 42,
    nuralagus: 50,
    kit_fox: 33,
    swift_fox: 42,
    island_fox: 50,
    campbells_dwarf: 33,
    european_hamster: 42,
    brandts_hamster: 50,
    grizzly_bear: 33,
    polar_bear: 42,
    short_faced_bear: 50,
    african_penguin: 33,
    king_penguin: 42,
    waitaha_penguin: 50,
    tiger_salamander: 33,
    andersons_salamander: 42,
    ambystoma_dumerilii: 50,
    cloud_sofa: 5,
    moon_crown: 12,
    night_room: 8,
    maine_coon: 24,
    red_panda_cub: 24,
    witch_hat: 10,
    star_tiara: 20,
    calico: 1,
    tabby: 1,
    tuxedo: 1,
    fluffy: 5,
    siamese: 10,
    british_shorthair: 16,
    golden: 1,
    dalmatian: 1,
    husky: 1,
    corgi: 5,
    beagle: 10,
    shiba: 16,
    border_collie: 24,
    lop: 1,
    dutch: 1,
    angora: 1,
    spotted: 5,
    lionhead: 10,
    rex: 16,
    himalayan: 24,
    red_fox: 1,
    arctic_fox: 1,
    fennec: 1,
    silver_fox: 5,
    cross_fox: 10,
    marble_fox: 16,
    bat_eared_fox: 24,
    syrian: 1,
    dwarf: 1,
    roborovski: 1,
    banded: 5,
    winter_white: 10,
    chinese_hamster: 16,
    teddy_bear: 24,
    giant_panda: 1,
    red_panda: 1,
    snow_panda: 1,
    baby_panda: 5,
    qinling_panda: 10,
    brown_panda: 16,
    emperor: 1,
    adelie: 1,
    gentoo: 1,
    chinstrap: 5,
    rockhopper: 10,
    little_blue: 16,
    macaroni: 24,
    leucistic: 1,
    wild_type: 1,
    melanoid: 1,
    golden_albino: 5,
    copper: 10,
    piebald: 16,
    mosaic: 24,
    aurora_prism: 12,
    cosmic_nebula: 20,
    crystal_lagoon: 28,
    solar_eclipse: 36,
    celestial_opal: 45
};

export const store = [
    ["bow", "bow", "cosmetic", 420],
    ["cap", "cap", "cosmetic", 550],
    ["crown", "crown", "cosmetic", 2400],
    ["glasses", "glasses", "cosmetic", 720],
    ["flower", "flower", "cosmetic", 460],
    ["scarf", "scarf", "cosmetic", 790],
    ["halo", "halo", "cosmetic", 3000],
    ["party", "party", "cosmetic", 850],
    ["pink", "pink", "color", 550],
    ["cream", "cream", "color", 450],
    ["gray", "gray", "color", 600],
    ["orange", "orange", "color", 650],
    ["black", "black", "color", 650],
    ["lavender", "lavender", "color", 950],
    ["mint", "mint", "color", 950],
    ["cloud_sofa", "sofa", "furniture", 2400],
    ["plant", "plant", "furniture", 580],
    ["lamp", "lamp", "furniture", 950],
    ["bookshelf", "books", "furniture", 1800],
    ["rug", "rug", "furniture", 950],
    ["cat_tree", "tree", "furniture", 2200],
    ["plush", "plush", "furniture", 750],
    ["blush", "♡", "theme", 0],
    ["lavender_room", "lavender", "theme", 2500],
    ["mint_room", "mint", "theme", 2500],
    ["night_room", "moon", "theme", 3500],
    ["strawberry_milk", "✿", "theme", 2100],
    ["lavender_dream", "✿", "theme", 2300],
    ["mint_garden", "✿", "theme", 2300],
    ["blueberry_sky", "✿", "theme", 2500],
    ["honey_cottage", "✿", "theme", 2700],
    ["peach_blossom", "✿", "theme", 2700],
    ["moonlight", "✿", "theme", 3300],
    ["sage_forest", "✿", "theme", 2900],
    ["aurora_prism", "✦", "theme", 5600],
    ["cosmic_nebula", "✦", "theme", 7400],
    ["crystal_lagoon", "✦", "theme", 9200],
    ["solar_eclipse", "✦", "theme", 11500],
    ["celestial_opal", "✦", "theme", 14500]
] as const;

const breedsBySpecies: Record<string, string[]> = {
    cat: ["calico", "tabby", "tuxedo", "fluffy"],
    dog: ["golden", "dalmatian", "husky", "corgi"],
    bunny: ["lop", "dutch", "angora", "spotted"],
    fox: ["red_fox", "arctic_fox", "fennec", "silver_fox"],
    hamster: ["syrian", "dwarf", "roborovski", "banded"],
    panda: ["giant_panda", "red_panda", "snow_panda", "baby_panda"],
    penguin: ["emperor", "adelie", "gentoo", "chinstrap"],
    axolotl: ["leucistic", "wild_type", "melanoid", "golden_albino"]
};

export const extraBreedStore = [
    ["calico", "paw", "breed", 7500],
    ["tabby", "paw", "breed", 8100],
    ["tuxedo", "paw", "breed", 8700],
    ["fluffy", "paw", "breed", 9300],
    ["golden", "paw", "breed", 7500],
    ["dalmatian", "paw", "breed", 8100],
    ["husky", "paw", "breed", 8700],
    ["corgi", "paw", "breed", 9300],
    ["lop", "paw", "breed", 7500],
    ["dutch", "paw", "breed", 8100],
    ["angora", "paw", "breed", 8700],
    ["spotted", "paw", "breed", 9300],
    ["red_fox", "paw", "breed", 7500],
    ["arctic_fox", "paw", "breed", 8100],
    ["fennec", "paw", "breed", 8700],
    ["silver_fox", "paw", "breed", 9300],
    ["syrian", "paw", "breed", 7500],
    ["dwarf", "paw", "breed", 8100],
    ["roborovski", "paw", "breed", 8700],
    ["banded", "paw", "breed", 9300],
    ["giant_panda", "paw", "breed", 7500],
    ["red_panda", "paw", "breed", 8100],
    ["snow_panda", "paw", "breed", 8700],
    ["baby_panda", "paw", "breed", 9300],
    ["emperor", "paw", "breed", 7500],
    ["adelie", "paw", "breed", 8100],
    ["gentoo", "paw", "breed", 8700],
    ["chinstrap", "paw", "breed", 9300],
    ["leucistic", "paw", "breed", 7500],
    ["wild_type", "paw", "breed", 8100],
    ["melanoid", "paw", "breed", 8700],
    ["golden_albino", "paw", "breed", 9300]
] as const;

const addedBreedsBySpecies: Record<string, string[]> = {
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

// Append new breed IDs to addedBreedsBySpecies for their species.
// Every additional breed unlocks five levels after that species' previous breed.
// Existing levels never change when breeds are appended.
const BREED_LEVEL_INTERVAL = 5;

const BREED_UNLOCK_LEVELS: Record<string, number> = {};

for (const speciesId of Object.keys(breedsBySpecies)) {
    const orderedBreeds = [
        ...breedsBySpecies[speciesId],
        ...(addedBreedsBySpecies[speciesId] || [])
    ];
    orderedBreeds.forEach((breedId, index) => {
        const requiredLevel = (index + 1) * BREED_LEVEL_INTERVAL;
        BREED_UNLOCK_LEVELS[breedId] = requiredLevel;
        ITEM_LEVEL_REQUIREMENTS[breedId] = requiredLevel;
    });
}

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

export const addedCosmeticStore = [
    ["star_clip", "✦", "cosmetic", 800],
    ["heart_shades", "✦", "cosmetic", 970],
    ["pearl_necklace", "✦", "cosmetic", 1140],
    ["moon_crown", "✦", "cosmetic", 1310],
    ["rainbow_scarf", "✦", "cosmetic", 1480],
    ["fish_clip", "✦", "cosmetic", 1250],
    ["yarn_hat", "✦", "cosmetic", 1700],
    ["bone_tag", "✦", "cosmetic", 1250],
    ["puppy_bandana", "✦", "cosmetic", 1700],
    ["carrot_clip", "✦", "cosmetic", 1250],
    ["clover_crown", "✦", "cosmetic", 1700],
    ["leaf_cape", "✦", "cosmetic", 1250],
    ["forest_crown", "✦", "cosmetic", 1700],
    ["seed_pouch", "✦", "cosmetic", 1250],
    ["cheek_bow", "✦", "cosmetic", 1700],
    ["bamboo_clip", "✦", "cosmetic", 1250],
    ["bamboo_hat", "✦", "cosmetic", 1700],
    ["sailor_hat", "✦", "cosmetic", 1250],
    ["ice_scarf", "✦", "cosmetic", 1700],
    ["bubble_crown", "✦", "cosmetic", 1250],
    ["coral_clip", "✦", "cosmetic", 1700]
] as const;

export const addedBreedStore = [
    ["siamese", "paw", "breed", 13500],
    ["british_shorthair", "paw", "breed", 14850],
    ["maine_coon", "paw", "breed", 16200],
    ["beagle", "paw", "breed", 13500],
    ["shiba", "paw", "breed", 14850],
    ["border_collie", "paw", "breed", 16200],
    ["lionhead", "paw", "breed", 13500],
    ["rex", "paw", "breed", 14850],
    ["himalayan", "paw", "breed", 16200],
    ["cross_fox", "paw", "breed", 13500],
    ["marble_fox", "paw", "breed", 14850],
    ["bat_eared_fox", "paw", "breed", 16200],
    ["winter_white", "paw", "breed", 13500],
    ["chinese_hamster", "paw", "breed", 14850],
    ["teddy_bear", "paw", "breed", 16200],
    ["qinling_panda", "paw", "breed", 13500],
    ["brown_panda", "paw", "breed", 14850],
    ["red_panda_cub", "paw", "breed", 16200],
    ["rockhopper", "paw", "breed", 13500],
    ["little_blue", "paw", "breed", 14850],
    ["macaroni", "paw", "breed", 16200],
    ["copper", "paw", "breed", 13500],
    ["piebald", "paw", "breed", 14850],
    ["mosaic", "paw", "breed", 16200]
] as const;

export const wildSpeciesStore = [
    ["eurasian_lynx", "paw", "breed", 24000],
    ["snow_leopard", "paw", "breed", 30975],
    ["smilodon", "paw", "breed", 41825],
    ["gray_wolf", "paw", "breed", 24000],
    ["african_wild_dog", "paw", "breed", 30975],
    ["dire_wolf", "paw", "breed", 41825],
    ["pygmy_rabbit", "paw", "breed", 24000],
    ["volcano_rabbit", "paw", "breed", 30975],
    ["nuralagus", "paw", "breed", 41825],
    ["kit_fox", "paw", "breed", 24000],
    ["swift_fox", "paw", "breed", 30975],
    ["island_fox", "paw", "breed", 41825],
    ["campbells_dwarf", "paw", "breed", 24000],
    ["european_hamster", "paw", "breed", 30975],
    ["brandts_hamster", "paw", "breed", 41825],
    ["grizzly_bear", "paw", "breed", 24000],
    ["polar_bear", "paw", "breed", 30975],
    ["short_faced_bear", "paw", "breed", 41825],
    ["african_penguin", "paw", "breed", 24000],
    ["king_penguin", "paw", "breed", 30975],
    ["waitaha_penguin", "paw", "breed", 41825],
    ["tiger_salamander", "paw", "breed", 24000],
    ["andersons_salamander", "paw", "breed", 30975],
    ["ambystoma_dumerilii", "paw", "breed", 41825]
] as const;

/*
 * DOCU: Handle breed for behavior for this feature.
 * @param {string} species - species value used by this function
 * @param {string} breed - breed value used by this function
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export const breedFor = (species: string, breed: string) =>
    [...(breedsBySpecies[species] || []), ...(addedBreedsBySpecies[species] || [])].includes(
        breed
    ) || breed === "classic";

export const themes: Record<string, [string, string, string]> = {
    blush: ["#ffeaf0", "#f6d5cc", "#bc6482"],
    lavender_room: ["#f0e9ff", "#e3d5ed", "#8966b1"],
    mint_room: ["#e9faf0", "#d2eadc", "#4d9275"],
    night_room: ["#dcd6ed", "#b7a5c8", "#655383"],
    strawberry_milk: ["#ffe1eb", "#f4c2cb", "#c95379"],
    lavender_dream: ["#eee4ff", "#d6c4ed", "#7753ad"],
    mint_garden: ["#dff9ed", "#bde7d3", "#34866f"],
    blueberry_sky: ["#e3edff", "#b9cdec", "#5579bc"],
    honey_cottage: ["#fff2ce", "#e8cd96", "#aa7631"],
    peach_blossom: ["#ffe8dd", "#f4c6b8", "#c77460"],
    moonlight: ["#dce0f5", "#a7acd5", "#4e588d"],
    sage_forest: ["#e6eee0", "#c0d3b4", "#617f56"],
    aurora_prism: ["#e9e5fa", "#cfc8ed", "#8b7bbf"],
    cosmic_nebula: ["#e7e4f5", "#c9c1e3", "#8272af"],
    crystal_lagoon: ["#ddf2ef", "#b6dcd8", "#4d9c9a"],
    solar_eclipse: ["#f9e7d8", "#e9c6b6", "#c48a77"],
    celestial_opal: ["#f5e9f2", "#e3d2e9", "#a87fae"]
};

export const roomThemeNames: Record<string, string> = {
    blush: "Cozy Blush",
    lavender_room: "Lavender Room",
    mint_room: "Mint Room",
    night_room: "Night Room",
    strawberry_milk: "Strawberry Milk",
    lavender_dream: "Lavender Dream",
    mint_garden: "Mint Garden",
    blueberry_sky: "Blueberry Sky",
    honey_cottage: "Honey Cottage",
    peach_blossom: "Peach Blossom",
    moonlight: "Moonlight",
    sage_forest: "Sage Forest",
    aurora_prism: "Aurora Prism",
    cosmic_nebula: "Cosmic Nebula",
    crystal_lagoon: "Crystal Lagoon",
    solar_eclipse: "Solar Eclipse",
    celestial_opal: "Celestial Opal"
};
