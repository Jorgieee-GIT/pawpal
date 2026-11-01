// Server-owned Paw Brawl catalog. The client and Develop gallery read these exact definitions from the API.
// Every breed has two distinct named specials, a chosen synergistic passive, and a measured unlock progression bonus.
export const FOCUS_CAP = 8;
export const SHIELD_CAP = 34;
// Distinct 1v1 archetypes: HP and defenses now show a real difference.
// Fast pets hit harder or dodge more; tanks live longer but are slower.
// The battle resolver and Shield / poison values were retuned alongside HP.
export const BRAWL_SPECIES_STATS: Record<string, [number, number, number, number]> = {
    cat: [153, 32, 12, 15],
    dog: [180, 31, 17, 10],
    bunny: [151, 32, 11, 18],
    fox: [151, 33, 11, 15],
    hamster: [170, 30, 15, 13],
    panda: [195, 27, 19, 9],
    penguin: [184, 28, 18, 11],
    axolotl: [172, 29, 14, 12]
};
export const BREED_LIST: Record<string, string[]> = {
    cat: [
        "classic",
        "calico",
        "tabby",
        "tuxedo",
        "fluffy",
        "siamese",
        "british_shorthair",
        "maine_coon",
        "eurasian_lynx",
        "snow_leopard",
        "smilodon"
    ],
    dog: [
        "classic",
        "golden",
        "dalmatian",
        "husky",
        "corgi",
        "beagle",
        "shiba",
        "border_collie",
        "gray_wolf",
        "african_wild_dog",
        "dire_wolf"
    ],
    bunny: [
        "classic",
        "lop",
        "dutch",
        "angora",
        "spotted",
        "lionhead",
        "rex",
        "himalayan",
        "pygmy_rabbit",
        "volcano_rabbit",
        "nuralagus"
    ],
    fox: [
        "classic",
        "red_fox",
        "arctic_fox",
        "fennec",
        "silver_fox",
        "cross_fox",
        "marble_fox",
        "bat_eared_fox",
        "kit_fox",
        "swift_fox",
        "island_fox"
    ],
    hamster: [
        "classic",
        "syrian",
        "dwarf",
        "roborovski",
        "banded",
        "winter_white",
        "chinese_hamster",
        "teddy_bear",
        "campbells_dwarf",
        "european_hamster",
        "brandts_hamster"
    ],
    panda: [
        "classic",
        "giant_panda",
        "red_panda",
        "snow_panda",
        "baby_panda",
        "qinling_panda",
        "brown_panda",
        "red_panda_cub",
        "grizzly_bear",
        "polar_bear",
        "short_faced_bear"
    ],
    penguin: [
        "classic",
        "emperor",
        "adelie",
        "gentoo",
        "chinstrap",
        "rockhopper",
        "little_blue",
        "macaroni",
        "african_penguin",
        "king_penguin",
        "waitaha_penguin"
    ],
    axolotl: [
        "classic",
        "leucistic",
        "wild_type",
        "melanoid",
        "golden_albino",
        "copper",
        "piebald",
        "mosaic",
        "tiger_salamander",
        "andersons_salamander",
        "ambystoma_dumerilii"
    ],
};
const SKILL_NAMES: Record<string, string[]> = {
    cat: [
        "Whisker Comet",
        "Calico Kaleidoscope",
        "Tabby Tempest",
        "Tuxedo Trickshot",
        "Cloudfur Embrace",
        "Siamese Echo Fang",
        "Velvet Crown Pounce",
        "Maine Thunderclap",
        "Lynx Frost Talon",
        "Snowdrift Ambush",
        "Sabertooth Eclipse"
    ],
    dog: [
        "Loyal Meteor",
        "Golden Sunrise Rush",
        "Dalmatian Spot Storm",
        "Husky Northern Howl",
        "Corgi Rocket Roll",
        "Beagle Scent Sprint",
        "Shiba Ember Leap",
        "Collie Wind Circuit",
        "Wolf Moonrend",
        "Savanna Pack Tactic",
        "Dire Fang Finale"
    ],
    bunny: [
        "Meadow Moonhop",
        "Lop-Ear Lullaby",
        "Dutch Clover Burst",
        "Angora Silk Spiral",
        "Spotted Springstep",
        "Lionheart Bloom",
        "Rex Velvet Charge",
        "Himalayan Snowbound",
        "Pygmy Lucky Bounce",
        "Volcano Cinder Kick",
        "Nuralagus Ancient Hop"
    ],
    fox: [
        "Twilight Tailspin",
        "Red Fox Firetrail",
        "Arctic Aurora Swipe",
        "Fennec Desert Flicker",
        "Silver Crescent Fang",
        "Crossfire Lunge",
        "Marble Mirage Step",
        "Bat-Ear Echo Snap",
        "Kit Fox Quickshadow",
        "Swift Fox Horizon Dash",
        "Island Fox Tidewhirl"
    ],
    hamster: [
        "Pocket Tornado",
        "Syrian Sunwheel",
        "Dwarf Seed Volley",
        "Robo Hyperdash",
        "Banded Stripe Crash",
        "Winter Snowball Spin",
        "Chinese Moonwhisk",
        "Teddy Plush Slam",
        "Campbell Cozy Surge",
        "European Burrowquake",
        "Brandt Canyon Blitz"
    ],
    panda: [
        "Bamboo Harmony Strike",
        "Giant Bamboo Quake",
        "Red Panda Ember Twirl",
        "Snow Panda Glacial Hug",
        "Baby Panda Giggle Bash",
        "Qinling Golden Grove",
        "Brown Panda Earthdrum",
        "Red Cub Maple Flip",
        "Grizzly Mountain Clash",
        "Polar Icebreaker",
        "Ancient Bear Avalanche"
    ],
    penguin: [
        "Pebble Tide Tackle",
        "Emperor Royal Glacier",
        "Adelie Snow Skip",
        "Gentoo Ocean Skim",
        "Chinstrap Chin-Charge",
        "Rockhopper Cliff Dive",
        "Little Blue Wavelet",
        "Macaroni Crest Crash",
        "African Coastal Splash",
        "King Penguin Crown Rush",
        "Waitaha Forgotten Frost"
    ],
    axolotl: [
        "Lagoon Glowstrike",
        "Leucistic Pearl Wave",
        "Wild Gill Whirlpool",
        "Melanoid Night Current",
        "Golden Albino Sunburst",
        "Copper Coral Spark",
        "Piebald Tide Mosaic",
        "Mosaic Prism Pulse",
        "Tiger Salamander Stripe Rush",
        "Anderson Lake Ripple",
        "Dumeril Deepwater Echo"
    ],
};
// Paw Brawl 2.2: 88 deliberately curated 1v1 kits. Later unlocks gain
// measured strength/utility rather than repeating a starter's weak move.
// All 176 named specials are active moves costing Focus; passives are separate.
export type SpecialKind = "adaptive_dodge" | "shield_bash" | "burst" | "mend" | "aegis" | "pierce" | "siphon" | "sunder" | "recoil" | "battery" | "sidestep" | "finisher" | "rally" | "stagger" | "venom" | "drain" | "riposte" | "cleanse" | "feint" | "tempo" | "bulwark" | "fortress" | "ambush" | "bloodrush" | "hex" | "rallyguard";
export type PassiveKind = "comeback" | "guardboost" | "focusheal" | "stride" | "lightfoot" | "thorns" | "laststand" | "quickreset" | "leech" | "steady" | "resolve";
export type BattleRole = "first" | "last";
export type RoleBonus = "quickhit" | "critical" | "breaker" | "spark" | "evasion" | "revenge" | "fortify" | "renew" | "counter" | "adaptive" | "refund" | "shieldstrike";
export type SkillTrigger = "faster" | "enemy_healthy" | "enemy_shielded" | "wounded" | "low_shield" | "low_focus" | "has_shield" | "shield_created";
export function getCombatOrderRole(actorSpeed: number, targetSpeed: number): BattleRole | "tied" {
    return actorSpeed > targetSpeed ? "first" : actorSpeed < targetSpeed ? "last" : "tied";
}
export type BattleSpecial = {
    trigger: SkillTrigger;
    bonus: RoleBonus;
    name: string;
    description: string;
    cost: number;
    cooldown: number;
    kind: SpecialKind;
    strength: number
};
export type BattlePassive = {
    name: string;
    description: string;
    kind: PassiveKind;
    strength: number
};
export type CombatStats = {
    hp: number;
    attack: number;
    defense: number;
    speed: number
};
export type BreedProgression = {
    rank: number;
    unlockLevel: number;
    tier: "Starter" | "Novice" | "Advanced" | "Elite" | "Apex";
    grade: string; // A breed's named unlock stage, not the account's level.
    bonus: CombatStats;
};
export type BattleKit = {
    special: BattleSpecial;
    specials: [BattleSpecial, BattleSpecial];
    passive: BattlePassive;
    stats: CombatStats;
    progression: BreedProgression
};
// Each row follows BREED_LIST order: [FIRST skill kind, LAST skill kind, passive].
// Individually chosen to complement that breed's stats/fantasy, not based on a hash.
const CURATED_KITS: Record<string, [SpecialKind, SpecialKind, PassiveKind][]> = {
    cat: [
        ["burst", "finisher", "comeback"],
        ["feint", "drain", "leech"],
        ["venom", "sidestep", "lightfoot"],
        ["ambush", "siphon", "quickreset"],
        ["pierce", "mend", "steady"],
        ["stagger", "hex", "resolve"],
        ["riposte", "fortress", "guardboost"],
        ["sunder", "riposte", "thorns"],
        ["ambush", "finisher", "stride"],
        ["stagger", "sidestep", "lightfoot"],
        ["bloodrush", "recoil", "comeback"]
    ],
    dog: [
        ["sunder", "aegis", "guardboost"],
        ["rallyguard", "cleanse", "focusheal"],
        ["feint", "riposte", "quickreset"],
        ["bloodrush", "sidestep", "stride"],
        ["ambush", "rally", "lightfoot"],
        ["siphon", "venom", "resolve"],
        ["tempo", "riposte", "thorns"],
        ["battery", "rally", "quickreset"],
        ["pierce", "drain", "leech"],
        ["ambush", "sunder", "stride"],
        ["sunder", "fortress", "thorns"]
    ],
    bunny: [
        ["tempo", "adaptive_dodge", "stride"],
        ["feint", "mend", "focusheal"],
        ["ambush", "siphon", "lightfoot"],
        ["stagger", "cleanse", "resolve"],
        ["tempo", "finisher", "comeback"],
        ["bloodrush", "riposte", "thorns"],
        ["pierce", "sidestep", "stride"],
        ["venom", "mend", "focusheal"],
        ["ambush", "siphon", "quickreset"],
        ["bloodrush", "recoil", "comeback"],
        ["sunder", "fortress", "laststand"]
    ],
    fox: [
        ["burst", "finisher", "comeback"],
        ["bloodrush", "venom", "leech"],
        ["feint", "cleanse", "resolve"],
        ["ambush", "sidestep", "lightfoot"],
        ["siphon", "riposte", "quickreset"],
        ["hex", "drain", "leech"],
        ["stagger", "rally", "quickreset"],
        ["battery", "siphon", "resolve"],
        ["ambush", "finisher", "stride"],
        ["tempo", "adaptive_dodge", "stride"],
        ["pierce", "venom", "comeback"]
    ],
    hamster: [
        ["recoil", "mend", "resolve"],
        ["riposte", "fortress", "guardboost"],
        ["feint", "sidestep", "lightfoot"],
        ["tempo", "siphon", "stride"],
        ["feint", "cleanse", "focusheal"],
        ["venom", "mend", "resolve"],
        ["battery", "rally", "quickreset"],
        ["rallyguard", "fortress", "steady"],
        ["bloodrush", "finisher", "comeback"],
        ["sunder", "riposte", "thorns"],
        ["recoil", "cleanse", "laststand"]
    ],
    panda: [
        ["riposte", "shield_bash", "guardboost"],
        ["riposte", "shield_bash", "thorns"],
        ["ambush", "adaptive_dodge", "lightfoot"],
        ["riposte", "shield_bash", "focusheal"],
        ["riposte", "shield_bash", "resolve"],
        ["aegis", "shield_bash", "steady"],
        ["riposte", "shield_bash", "guardboost"],
        ["tempo", "adaptive_dodge", "leech"],
        ["riposte", "shield_bash", "comeback"],
        ["riposte", "shield_bash", "laststand"],
        ["riposte", "shield_bash", "thorns"]
    ],
    penguin: [
        ["sunder", "aegis", "guardboost"],
        ["riposte", "fortress", "steady"],
        ["tempo", "sidestep", "lightfoot"],
        ["ambush", "drain", "leech"],
        ["feint", "riposte", "quickreset"],
        ["bloodrush", "recoil", "comeback"],
        ["battery", "mend", "focusheal"],
        ["venom", "cleanse", "resolve"],
        ["hex", "rally", "quickreset"],
        ["sunder", "bulwark", "thorns"],
        ["pierce", "fortress", "laststand"]
    ],
    axolotl: [
        ["battery", "mend", "focusheal"],
        ["venom", "cleanse", "resolve"],
        ["siphon", "drain", "leech"],
        ["hex", "sidestep", "lightfoot"],
        ["burst", "rally", "comeback"],
        ["pierce", "fortress", "steady"],
        ["feint", "mend", "focusheal"],
        ["stagger", "cleanse", "quickreset"],
        ["bloodrush", "drain", "leech"],
        ["battery", "rally", "resolve"],
        ["venom", "fortress", "laststand"]
    ]
};
const SECOND_SKILL_NAMES: Record<string, string[]> = {
    cat: ["Moonlit Pounce", "Patchwork Renewal", "Striped Shadowstep", "Midnight Pickpocket", "Cloudtail Recovery", "Echo Hex", "Royal Hearth", "Maine Counterclaw", "Lynx Final Hunt", "Snow Ghoststep", "Ancient Fang Frenzy"],
    dog: ["Faithful Barrier", "Golden Comfort", "Spotted Retaliation", "Northern Escape", "Corgi Victory Lap", "Scent of Venom", "Shiba Counterflash", "Collie Second Wind", "Moonpack Drain", "Savanna Barrierbreak", "Direwolf Ironheart"],
    bunny: ["Clover Vanish", "Lop Petal Mend", "Dutch Focus Heist", "Angora Recovery", "Spotted Last Dash", "Lionheart Counter", "Rex Shadow Bound", "Snowfield Healing", "Pygmy Foxglove Trick", "Volcanic Aftershock", "Ancient Burrow Fortress"],
    fox: ["Dusk Final Bite", "Ember Venom Trail", "Arctic Recovery", "Desert Ghoststep", "Silver Trick Reversal", "Crossfox Siphon Bite", "Prism Momentum", "Echo Focus Theft", "Kitfox Finishing Fang", "Swift Afterimage", "Island Ember Poison"],
    hamster: ["Pocket Bandage", "Sunwheel Fortress", "Seedling Dodge", "Robo Focus Swipe", "Stripe Purifier", "Winter Burrow Mend", "Whisker Momentum", "Teddy Citadel", "Campbell Final Sprint", "Burrow Counterstrike", "Canyon Survival"],
    panda: ["Bamboo Last Stand", "Giant Forest Citadel", "Maple Afterimage", "Snow Lotus Remedy", "Cub Bamboo Bastion", "Qinling Counterwall", "Brown Bear Stand", "Red Cub Vital Bite", "Grizzly Ironhide", "Polar Counterstorm", "Ancient Bear Fortress"],
    penguin: ["Pebble Icewall", "Emperor Frost Citadel", "Adelie Skating Escape", "Gentoo Lifetide", "Chinstrap Snap Counter", "Rockhopper Last Dive", "Little Blue Remedy", "Macaroni Purify", "African Wave Momentum", "King Crown Last Stand", "Waitaha Ice Fortress"],
    axolotl: ["Lagoon Renewal", "Pearl Purification", "Wild Gill Lifedrain", "Darkwater Slipstream", "Golden Reef Rally", "Copper Coral Fortress", "Piebald Pearl Heal", "Mosaic Clean Current", "Tiger Gill Drain", "Anderson Deep Current", "Ancient Dumeril Bastion"]
};
// Skills have independent, build-driven triggers. Slot 1 is NOT a "first-move"
// skill, and slot 2 is NOT a "last-move" skill. Both can reward high Speed,
// both can work at equal Speed, and neither requires a fixed move position.
const SKILL_TRIGGERS: Record<string, [[SkillTrigger, RoleBonus], [SkillTrigger, RoleBonus]]> = {
    cat: [["enemy_healthy", "critical"], ["wounded", "revenge"]],
    dog: [["enemy_shielded", "breaker"], ["low_shield", "fortify"]],
    bunny: [["faster", "quickhit"], ["faster", "adaptive"]],
    fox: [["enemy_healthy", "critical"], ["wounded", "revenge"]],
    hamster: [["low_focus", "spark"], ["has_shield", "counter"]],
    panda: [["shield_created", "refund"], ["has_shield", "shieldstrike"]],
    penguin: [["enemy_shielded", "breaker"], ["low_shield", "fortify"]],
    axolotl: [["low_focus", "spark"], ["wounded", "renew"]]
};
// Not every breed in a species shares its archetype. Skills must follow the
// actual stats and kit: red pandas are speedy, heavy rabbits are defensive.
const SKILL_TRIGGER_OVERRIDES: Record<string, Record<string, [[SkillTrigger, RoleBonus], [SkillTrigger, RoleBonus]]>> = {
    cat: { british_shorthair: [["enemy_shielded", "breaker"], ["low_shield", "fortify"]], maine_coon: [["enemy_shielded", "breaker"], ["has_shield", "counter"]] },
    dog: { husky: [["faster", "quickhit"], ["faster", "adaptive"]], corgi: [["faster", "quickhit"], ["faster", "adaptive"]], african_wild_dog: [["faster", "quickhit"], ["faster", "adaptive"]] },
    bunny: { nuralagus: [["enemy_shielded", "breaker"], ["low_shield", "fortify"]] },
    fox: { bat_eared_fox: [["low_focus", "spark"], ["wounded", "renew"]], swift_fox: [["faster", "quickhit"], ["faster", "adaptive"]] },
    hamster: { roborovski: [["faster", "quickhit"], ["faster", "adaptive"]], teddy_bear: [["enemy_shielded", "breaker"], ["low_shield", "fortify"]], european_hamster: [["enemy_shielded", "breaker"], ["has_shield", "counter"]] },
    panda: { red_panda: [["faster", "quickhit"], ["faster", "adaptive"]], red_panda_cub: [["faster", "quickhit"], ["faster", "adaptive"]], grizzly_bear: [["shield_created", "refund"], ["has_shield", "shieldstrike"]] },
    penguin: { gentoo: [["faster", "quickhit"], ["faster", "adaptive"]], rockhopper: [["enemy_healthy", "critical"], ["wounded", "revenge"]] },
    axolotl: { tiger_salamander: [["enemy_healthy", "critical"], ["wounded", "revenge"]] }
};
// [HP, Attack, Defense, Speed] applied in addition to the measured rank bonus.
// Breed identities create strengths AND weaknesses; upgrades cannot erase risk.
const BREED_STAT_PROFILES: Record<string, Record<string, [number, number, number, number]>> = {
    cat: { british_shorthair: [5, 0, 1, -2], maine_coon: [5, 0, 1, -2], smilodon: [0, 2, -1, -1] },
    dog: { husky: [-3, 0, 0, 2], corgi: [-2, 0, 0, 2], african_wild_dog: [-3, 0, 0, 2], dire_wolf: [5, 0, 1, -1] },
    bunny: { pygmy_rabbit: [-4, 0, 0, 2], nuralagus: [8, -1, 2, -5] },
    fox: { swift_fox: [-4, 0, -1, 3], bat_eared_fox: [-2, 0, 0, 1] },
    hamster: { roborovski: [-4, 0, 0, 3], teddy_bear: [5, 0, 1, -2], european_hamster: [4, 0, 1, -2] },
    panda: { red_panda: [-4, 0, 0, 3], red_panda_cub: [-3, 0, 0, 3], grizzly_bear: [6, 1, 1, -2] },
    penguin: { gentoo: [-2, 0, 0, 2], rockhopper: [-3, 1, 0, 2], king_penguin: [4, 0, 1, -2] },
    axolotl: { tiger_salamander: [-3, 2, -1, 1] }
};
const SPECIAL_COSTS: Record<SpecialKind, number> = {
    adaptive_dodge: 4, shield_bash: 4, burst: 4, mend: 4, aegis: 4, pierce: 4, siphon: 5,
    sunder: 4, recoil: 4, battery: 5, sidestep: 4,
    finisher: 4, rally: 4, stagger: 6, venom: 4,
    drain: 4, riposte: 4, cleanse: 4, feint: 4, tempo: 4, bulwark: 4, fortress: 5, ambush: 4, bloodrush: 5, hex: 5, rallyguard: 5
};
const SPECIAL_COOLDOWNS: Record<SpecialKind, number> = {
    adaptive_dodge: 3, shield_bash: 3, burst: 2, mend: 2, aegis: 3, pierce: 2, siphon: 3,
    sunder: 2, recoil: 2, battery: 3, sidestep: 2,
    finisher: 2, rally: 2, stagger: 4, venom: 3,
    drain: 3, riposte: 3, cleanse: 3, feint: 2, tempo: 2, bulwark: 2, fortress: 3, ambush: 3, bloodrush: 3, hex: 3, rallyguard: 3
};
const PASSIVE_TITLES: Record<PassiveKind, string> = {
    comeback: "Grit",
    guardboost: "Fortress",
    focusheal: "Serenity",
    stride: "Rhythm",
    lightfoot: "Reflex",
    thorns: "Retaliation",
    laststand: "Last Hope",
    quickreset: "Tempo",
    leech: "Vitality",
    steady: "Fortitude",
    resolve: "Resolve"
};
const pretty = (name: string) => name.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
export function getStyle(breed: string): number {
    let hash = 0;
    for (const char of breed) {
        hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    }
    return hash % 4;
}
// Use the same breed order as the shop's level gates: Classic at 0, then level 5, 10, ... 50.
// Later ranks have a noticeable but limited advantage; counterplay and move decisions still matter.
export function getBreedProgression(species: string, breed: string): BreedProgression {
    const breeds = BREED_LIST[species] || BREED_LIST.cat;
    const rank = Math.max(0, breeds.indexOf(breed));
    const grades = [
        "Origin",
        "Rookie",
        "Rising",
        "Adept",
        "Veteran",
        "Prime",
        "Prestige",
        "Elite",
        "Mythic",
        "Celestial",
        "Apex"
    ];
    const tier: BreedProgression["tier"] = rank === 0 ? "Starter"
        : rank <= 4 ? "Novice" : rank <= 7 ? "Advanced" : rank <= 9 ? "Elite" : "Apex";
    return {
        rank,
        unlockLevel: rank * 5,
        tier,
        grade: grades[rank] || "Origin",
        bonus: {
            hp: Math.ceil(rank * 1.5),
            attack: Math.floor(rank / 6),
            defense: Math.floor(rank / 8),
            speed: Math.floor(rank / 10)
        }
    };
}
export function getCombatKit(species: string, breed: string): BattleKit {
    const speciesIds = Object.keys(BREED_LIST);
    const speciesIndex = Math.max(0, speciesIds.indexOf(species));
    const speciesName = speciesIds[speciesIndex];
    const breeds = BREED_LIST[speciesName];
    const breedIndex = Math.max(0, breeds.indexOf(breed));
    const [baseHp, baseAttack, baseDefense, baseSpeed] = BRAWL_SPECIES_STATS[speciesName];
    const style = getStyle(breed);
    const progression = getBreedProgression(speciesName, breed);
    const profile = BREED_STAT_PROFILES[speciesName]?.[breed] || [0, 0, 0, 0];
    const stats: CombatStats = {
        hp: baseHp + [0, 4, 6, -6][style] + progression.bonus.hp + profile[0],
        attack: baseAttack + [1, -1, -1, 1][style] + progression.bonus.attack + profile[1],
        defense: baseDefense + (style === 2 ? 1 : 0) + progression.bonus.defense + profile[2],
        speed: baseSpeed + (style === 3 ? 2 : 0) + progression.bonus.speed + profile[3]
    };
    const [firstKind, lastKind, passiveKind] = CURATED_KITS[speciesName][breedIndex];
    const [firstCondition, secondCondition] = SKILL_TRIGGER_OVERRIDES[speciesName]?.[breed] || SKILL_TRIGGERS[speciesName];
    // Increasing power is intentionally gradual: rank 0 = strength 2,
    // rank 10 = strength 4. Costs and counterplay remain the same.
    const strength = 2 + Math.floor(breedIndex / 4);
    const passiveStrength = 2 + Math.floor(breedIndex / 5);
    const special: BattleSpecial = {
        name: SKILL_NAMES[speciesName][breedIndex],
        description: "",
        trigger: firstCondition[0], bonus: firstCondition[1],
        cost: SPECIAL_COSTS[firstKind],
        cooldown: SPECIAL_COOLDOWNS[firstKind],
        kind: firstKind,
        strength
    };
    const secondary: BattleSpecial = {
        name: SECOND_SKILL_NAMES[speciesName][breedIndex],
        description: "",
        trigger: secondCondition[0], bonus: secondCondition[1],
        cost: SPECIAL_COSTS[lastKind],
        cooldown: SPECIAL_COOLDOWNS[lastKind],
        kind: lastKind,
        strength
    };
    const passive = {
        name: `${pretty(speciesName)} ${breed === "classic" ? "Starter" : pretty(breed)} ${PASSIVE_TITLES[passiveKind]}`,
        description: "",
        kind: passiveKind,
        strength: passiveStrength
    };
    special.description = describeSpecial(special);
    secondary.description = describeSpecial(secondary);
    passive.description = describePassive(passive);
    return {
        special,
        specials: [special, secondary],
        passive,
        progression,
        stats
    };
}
// Friendly explanations are served by the API and reused everywhere: the
// battle buttons, the live help window, the complete roster and Develop tab.
// Keep numbers tied to the same strength values used by the combat resolver.
function describeSpecial(skill: BattleSpecial): string {
    const n = skill.strength;
    const effects: Record<SpecialKind, string> = {
        adaptive_dodge: "Your pet attacks and adds 3 damage. It also prepares a dodge for the next enemy attack (+20% chance to avoid it).",
        shield_bash: "Your pet attacks and adds 3 damage. If you have Shield, you can also hit harder using that Shield.",
        burst: `Your pet attacks and adds ${5 + n} extra damage. Nothing else is needed for this extra damage.`,
        mend: `Your pet attacks and heals itself for up to ${8 + n} HP. The healing still happens if the enemy dodges.`,
        aegis: `Your pet attacks and gains up to ${9 + n} Shield. You get the Shield even if the enemy dodges.`,
        pierce: `Your pet attacks and adds 3 damage. It also sends ${7 + n} more damage past enemy Shield, straight toward their HP.`,
        siphon: `Your pet attacks. If it hits, it takes up to ${Math.min(2, 1 + Math.floor(n / 3))} Focus from the enemy and gives it to you. It cannot steal Focus already needed for an enemy skill picked this round.`,
        sunder: `Your pet attacks. If it hits, it destroys up to ${9 + n} enemy Shield before calculating attack damage.`,
        recoil: `Your pet attacks with ${8 + n} extra damage, but it also loses 5 of its own HP. The recoil cannot knock out your pet.`,
        battery: `Your pet attacks with ${Math.floor(n / 2)} extra damage. If it hits, your pet gets up to 2 Focus back.`,
        sidestep: "Your pet attacks with 3 extra damage. It also gets +20% chance to dodge the next enemy attack.",
        finisher: `Your pet attacks. If the enemy has LESS than half its HP left, this attack deals ${6 + n} extra damage.`,
        rally: `Your pet attacks with 2 extra damage. It also stores +${3 + n} damage for its NEXT damaging attack. This stored bonus is used once.`,
        stagger: `Your pet attacks with ${Math.floor(n / 2)} extra damage. If it hits, the enemy misses its NEXT round. After being stunned, the enemy is protected from another stun for 3 rounds.`,
        venom: `Your pet attacks. If the attack hits, the enemy becomes poisoned. Poison takes ${5 + Math.floor((n - 2) / 2)} HP at the END of each round, for 2 rounds. Poison goes past Shield.`,
        drain: `Your pet attacks. If it removes enemy HP, your pet heals for up to ${7 + n} HP (but no more than 40% of the HP damage it caused).`,
        riposte: `Your pet attacks, gains up to ${7 + n} Shield, and prepares a counter. If the enemy hits it, it hits back for ${3 + n} damage once.`,
        cleanse: `Your pet attacks, heals itself for up to ${7 + n} HP, and removes any poison. The healing still works if the enemy dodges.`,
        feint: `Your pet attacks with ${2 + n} extra damage. If it hits, the enemy's next attack deals 5 less damage.`,
        tempo: `Your pet attacks with ${2 + n} extra damage. It is a straightforward attack without a second effect.`,
        bulwark: `Your pet attacks, gains up to ${9 + n} Shield, and heals up to 3 HP.`,
        fortress: `Your pet attacks, gains up to ${9 + n} Shield, and heals up to ${3 + Math.floor(n / 2)} HP.`,
        ambush: `Your pet attacks with ${3 + n} extra damage and prepares +20% chance to dodge the next enemy attack.`,
        bloodrush: `Your pet attacks. If the enemy has MORE than half its HP left, this attack adds ${6 + n} damage.`,
        hex: `Your pet attacks with ${2 + Math.floor(n / 2)} extra damage. If it hits, the enemy's next attack is 5 damage weaker and you steal up to 1 of its free Focus.`,
        rallyguard: `Your pet attacks with 1 extra damage, gains up to ${5 + n} Shield, and saves +${2 + n} damage for its NEXT damaging attack.`
    };
    const bonuses: Record<RoleBonus, string> = {
        quickhit: "add 3 more damage to this attack",
        critical: "you have a 25% chance to deal 8 MORE damage (a critical hit)",
        breaker: "break up to 5 additional enemy Shield before dealing damage, but only if your attack hits",
        spark: "get 1 Focus back (unless your Focus is full)",
        evasion: "prepare +20% dodge chance for the next enemy attack",
        revenge: "add 4 more attack damage",
        fortify: "gain up to 3 Shield",
        renew: "heal up to 4 HP",
        counter: "prepare a counter that deals 4 damage the next time an enemy attack hits you",
        adaptive: "prepare a dodge; if the enemy chose Guard or Focus instead of attacking, turn that unused dodge into up to 10 Shield",
        refund: "if this move gives you Shield and the enemy later destroys ALL of that Shield before it expires, gain up to 2 Focus back. Expiring Shield does NOT refund Focus",
        shieldstrike: "add 1 damage for every 3 Shield you currently have, up to +7 damage; if you gain extra damage, you spend up to 5 Shield"
    };
    const conditions: Record<SkillTrigger, string> = {
        faster: "your pet's Speed number is HIGHER than the enemy's (equal Speed does not count)",
        enemy_healthy: "the enemy has MORE than half of its HP",
        enemy_shielded: "the enemy currently has at least 1 Shield",
        wounded: "your pet has HALF its HP or less",
        low_shield: "your pet has 4 Shield or less",
        low_focus: "your pet has 3 Focus or less AFTER paying for this skill",
        has_shield: "your pet has at least 1 Shield BEFORE using this skill",
        shield_created: "this skill actually gives your pet Shield (not when Shield is already full)"
    };
    return `NORMAL EFFECT: ${effects[skill.kind]}\nEXTRA BONUS: If ${conditions[skill.trigger]}, ${bonuses[skill.bonus]}. Otherwise the normal effect still works.`;
}
function describePassive(passive: BattlePassive): string {
    const n = passive.strength;
    const descriptions: Record<PassiveKind, string> = {
        comeback: `When your pet has HALF its HP or less, all its damaging attacks add ${2 + n} more damage. `,
        guardboost: `When you Guard for the first time in a row, gain ${2 + n} EXTRA Shield. Guarding again in a row gets only about half that bonus. Repeated Guarding eventually gives nothing.`,
        focusheal: `Whenever you press Focus, your pet also heals up to ${n + 1} HP. This does not increase HP above maximum.`,
        stride: `Paw Strike gives 2 Focus instead of 1. If your Speed is higher than the enemy's, Paw Strike also adds ${3 + Math.max(0, n - 2)} damage. Equal Speed gets no bonus damage.`,
        lightfoot: `Your pet has ${n + 2}% MORE chance to dodge attacks without spending Focus. Dodge is random, so it will not work every time.`,
        thorns: `When your Shield blocks some attack damage, the attacker loses ${n + 1} HP. This reflected damage cannot knock out the attacker.`,
        laststand: `ONCE per match, when an enemy hit drops your pet to 35% HP or lower, gain up to ${5 + n} Shield. If the direct hit would knock your pet out, it survives at 1 HP. Poison and round-end damage can still knock it out.`,
        quickreset: `Your special skills become ready 1 action sooner (minimum 2-action cooldown). This does not shorten a stun skill's cooldown.`,
        leech: `When a normal Paw Strike hits and actually takes away enemy HP, your pet heals up to ${n} HP. It does not work if all damage is blocked or dodged.`,
        steady: `When an enemy special hits, your pet takes ${n + 1} LESS damage. It will still take at least 1 damage.`,
        resolve: `Whenever an enemy attack actually removes your pet's HP, your pet gets 1 Focus, up to the ${FOCUS_CAP}-Focus limit.`
    };
    return descriptions[passive.kind];
}
// Solo-battle counterplay: no Focus from an exhausted Guard, and even a basic
// attack bypasses a small fraction of Shield. No player can turtle forever.
export const BRAWL_RULES = {
    focusCap: FOCUS_CAP,
    shieldCap: SHIELD_CAP,
    roundSeconds: 30,
    maxRounds: 18,
    strikeFocus: 1,
    guardFocus: 1,
    repeatedGuardFocus: 0,
    exhaustedGuardFocus: 0,
    focusGain: 3,
    guardShield: 16,
    repeatedGuardShield: 8,
    exhaustedGuardShield: 0,
    basicShieldPiercePercent: 40,
    shieldDecayWhenNotGuarding: 0,
    shieldDurationRounds: 3,
    shieldBreakFocusReward: 2,
    pressureStartsRound: 11,
    pressureFirstDamage: 4,
    pressureGrowth: 3
};

export function guardShieldForStreak(streak: number, passive?: BattlePassive): number {
    const bonus = passive?.kind === "guardboost" ? passive.strength + 2 : 0;
    if (streak >= 2) {
        return BRAWL_RULES.exhaustedGuardShield;
    }
    if (streak === 1) {
        return BRAWL_RULES.repeatedGuardShield + Math.ceil(bonus / 2);
    }
    return BRAWL_RULES.guardShield + bonus;
}
export function getPublicCombatCatalog() {
    const kits: Record<string, Record<string, BattleKit>> = {};
    for (const [species, breeds] of Object.entries(BREED_LIST)) {
        kits[species] = {};
        for (const breed of breeds) {
            kits[species][breed] = getCombatKit(species, breed);
        }
    }
    return {
        rules: BRAWL_RULES,
        speciesStats: BRAWL_SPECIES_STATS,
        kits
    };
}
