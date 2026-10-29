// Server-owned Paw Brawl catalog. The client and Develop gallery read these exact definitions from the API.
// Every breed has its own named special/passive and a small, predictable unlock-progression bonus.
export const FOCUS_CAP = 8;
export const SHIELD_CAP = 30;
export const BRAWL_SPECIES_STATS: Record<string, [number, number, number, number]> = {
    cat: [94, 20, 9, 15], dog: [106, 18, 12, 10], bunny: [90, 19, 8, 18],
    fox: [96, 20, 9, 15], hamster: [98, 18, 11, 13], panda: [110, 17, 13, 9],
    penguin: [102, 18, 12, 11], axolotl: [100, 19, 10, 12]
};
export const BREED_LIST: Record<string, string[]> = {
    cat: ['classic', 'calico', 'tabby', 'tuxedo', 'fluffy', 'siamese', 'british_shorthair', 'maine_coon', 'eurasian_lynx', 'snow_leopard', 'smilodon'],
    dog: ['classic', 'golden', 'dalmatian', 'husky', 'corgi', 'beagle', 'shiba', 'border_collie', 'gray_wolf', 'african_wild_dog', 'dire_wolf'],
    bunny: ['classic', 'lop', 'dutch', 'angora', 'spotted', 'lionhead', 'rex', 'himalayan', 'pygmy_rabbit', 'volcano_rabbit', 'nuralagus'],
    fox: ['classic', 'red_fox', 'arctic_fox', 'fennec', 'silver_fox', 'cross_fox', 'marble_fox', 'bat_eared_fox', 'kit_fox', 'swift_fox', 'island_fox'],
    hamster: ['classic', 'syrian', 'dwarf', 'roborovski', 'banded', 'winter_white', 'chinese_hamster', 'teddy_bear', 'campbells_dwarf', 'european_hamster', 'brandts_hamster'],
    panda: ['classic', 'giant_panda', 'red_panda', 'snow_panda', 'baby_panda', 'qinling_panda', 'brown_panda', 'red_panda_cub', 'grizzly_bear', 'polar_bear', 'short_faced_bear'],
    penguin: ['classic', 'emperor', 'adelie', 'gentoo', 'chinstrap', 'rockhopper', 'little_blue', 'macaroni', 'african_penguin', 'king_penguin', 'waitaha_penguin'],
    axolotl: ['classic', 'leucistic', 'wild_type', 'melanoid', 'golden_albino', 'copper', 'piebald', 'mosaic', 'tiger_salamander', 'andersons_salamander', 'ambystoma_dumerilii'],
};
const SKILL_NAMES: Record<string, string[]> = {
    cat: ['Whisker Comet', 'Calico Kaleidoscope', 'Tabby Tempest', 'Tuxedo Trickshot', 'Cloudfur Embrace', 'Siamese Echo Fang', 'Velvet Crown Pounce', 'Maine Thunderclap', 'Lynx Frost Talon', 'Snowdrift Ambush', 'Sabertooth Eclipse'],
    dog: ['Loyal Meteor', 'Golden Sunrise Rush', 'Dalmatian Spot Storm', 'Husky Northern Howl', 'Corgi Rocket Roll', 'Beagle Scent Sprint', 'Shiba Ember Leap', 'Collie Wind Circuit', 'Wolf Moonrend', 'Savanna Pack Tactic', 'Dire Fang Finale'],
    bunny: ['Meadow Moonhop', 'Lop-Ear Lullaby', 'Dutch Clover Burst', 'Angora Silk Spiral', 'Spotted Springstep', 'Lionheart Bloom', 'Rex Velvet Charge', 'Himalayan Snowbound', 'Pygmy Lucky Bounce', 'Volcano Cinder Kick', 'Nuralagus Ancient Hop'],
    fox: ['Twilight Tailspin', 'Red Fox Firetrail', 'Arctic Aurora Swipe', 'Fennec Desert Flicker', 'Silver Crescent Fang', 'Crossfire Lunge', 'Marble Mirage Step', 'Bat-Ear Echo Snap', 'Kit Fox Quickshadow', 'Swift Fox Horizon Dash', 'Island Fox Tidewhirl'],
    hamster: ['Pocket Tornado', 'Syrian Sunwheel', 'Dwarf Seed Volley', 'Robo Hyperdash', 'Banded Stripe Crash', 'Winter Snowball Spin', 'Chinese Moonwhisk', 'Teddy Plush Slam', 'Campbell Cozy Surge', 'European Burrowquake', 'Brandt Canyon Blitz'],
    panda: ['Bamboo Harmony Strike', 'Giant Bamboo Quake', 'Red Panda Ember Twirl', 'Snow Panda Glacial Hug', 'Baby Panda Giggle Bash', 'Qinling Golden Grove', 'Brown Panda Earthdrum', 'Red Cub Maple Flip', 'Grizzly Mountain Clash', 'Polar Icebreaker', 'Ancient Bear Avalanche'],
    penguin: ['Pebble Tide Tackle', 'Emperor Royal Glacier', 'Adelie Snow Skip', 'Gentoo Ocean Skim', 'Chinstrap Chin-Charge', 'Rockhopper Cliff Dive', 'Little Blue Wavelet', 'Macaroni Crest Crash', 'African Coastal Splash', 'King Penguin Crown Rush', 'Waitaha Forgotten Frost'],
    axolotl: ['Lagoon Glowstrike', 'Leucistic Pearl Wave', 'Wild Gill Whirlpool', 'Melanoid Night Current', 'Golden Albino Sunburst', 'Copper Coral Spark', 'Piebald Tide Mosaic', 'Mosaic Prism Pulse', 'Tiger Salamander Stripe Rush', 'Anderson Lake Ripple', 'Dumeril Deepwater Echo'],
};
export type SpecialKind = 'burst' | 'mend' | 'aegis' | 'pierce' | 'siphon' | 'sunder' | 'recoil' | 'battery' | 'sidestep' | 'finisher' | 'rally';
export type PassiveKind = 'comeback' | 'guardboost' | 'focusheal' | 'stride' | 'lightfoot' | 'thorns' | 'laststand' | 'quickreset' | 'leech' | 'steady' | 'resolve';
export type BattleSpecial = {name: string; description: string; cost: number; cooldown: number; kind: SpecialKind; strength: number};
export type BattlePassive = {name: string; description: string; kind: PassiveKind; strength: number};
export type CombatStats = {hp: number; attack: number; defense: number; speed: number};
export type BreedProgression = {
    rank: number;
    unlockLevel: number;
    tier: 'Starter' | 'Novice' | 'Advanced' | 'Elite' | 'Apex';
    grade: string; // A breed's named unlock stage, not the account's level.
    bonus: CombatStats;
};
export type BattleKit = {special: BattleSpecial; passive: BattlePassive; stats: CombatStats; progression: BreedProgression};
const SPECIAL_KINDS: SpecialKind[] = ['burst','mend','aegis','pierce','siphon','sunder','recoil','battery','sidestep','finisher','rally'];
const PASSIVE_KINDS: PassiveKind[] = ['comeback','guardboost','focusheal','stride','lightfoot','thorns','laststand','quickreset','leech','steady','resolve'];
const PASSIVE_TITLES: Record<PassiveKind, string> = {comeback:'Grit',guardboost:'Fortress',focusheal:'Serenity',stride:'Rhythm',lightfoot:'Reflex',thorns:'Retaliation',laststand:'Last Hope',quickreset:'Tempo',leech:'Vitality',steady:'Fortitude',resolve:'Resolve'};
const pretty = (name: string) => name.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
export function getStyle(breed: string): number {
    let hash = 0;
    for (const char of breed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return hash % 4;
}
// Use the same breed order as the shop's level gates: Classic at 0, then level 5, 10, ... 50.
// Bonuses are deliberately modest; abilities, matchups and move decisions still matter more.
export function getBreedProgression(species: string, breed: string): BreedProgression {
    const breeds = BREED_LIST[species] || BREED_LIST.cat;
    const rank = Math.max(0, breeds.indexOf(breed));
    const grades = ['Origin', 'Rookie', 'Rising', 'Adept', 'Veteran', 'Prime', 'Prestige', 'Elite', 'Mythic', 'Celestial', 'Apex'];
    const tier: BreedProgression['tier'] = rank === 0 ? 'Starter'
        : rank <= 4 ? 'Novice' : rank <= 7 ? 'Advanced' : rank <= 9 ? 'Elite' : 'Apex';
    return {
        rank,
        unlockLevel: rank * 5,
        tier,
        grade: grades[rank] || 'Origin',
        bonus: {
            hp: rank,
            attack: rank >= 5 ? 1 : 0,
            defense: rank >= 8 ? 1 : 0,
            speed: 0
        }
    };
}
export function getCombatKit(species: string, breed: string): BattleKit {
    const speciesIds = Object.keys(BREED_LIST);
    const speciesIndex = Math.max(0, speciesIds.indexOf(species));
    const speciesName = speciesIds[speciesIndex];
    const breeds = BREED_LIST[speciesName];
    const breedIndex = Math.max(0, breeds.indexOf(breed));
    const kind = SPECIAL_KINDS[(breedIndex + speciesIndex * 3) % SPECIAL_KINDS.length];
    const passiveKind = PASSIVE_KINDS[(breedIndex * 3 + speciesIndex * 2) % PASSIVE_KINDS.length];
    const cost = 3 + ((breedIndex * 2 + speciesIndex * 3) % 5);
    const cooldown = 1 + ((breedIndex + speciesIndex) % 3);
    const strength = 2 + ((speciesIndex * 3 + breedIndex * 5) % 4) + Math.floor((cost - 3) / 2);
    const passiveStrength = 2 + ((speciesIndex + breedIndex * 3) % 4);
    const [baseHp, baseAttack, baseDefense, baseSpeed] = BRAWL_SPECIES_STATS[speciesName];
    const style = getStyle(breed);
    const progression = getBreedProgression(speciesName, breed);
    const special = {
        name: SKILL_NAMES[speciesName][breedIndex], description: "", cost, cooldown, kind, strength
    };
    const passive = {
        name: `${pretty(speciesName)} ${breed === "classic" ? "Starter" : pretty(breed)} ${PASSIVE_TITLES[passiveKind]}`,
        description: "", kind: passiveKind, strength: passiveStrength
    };
    special.description = describeSpecial(special);
    passive.description = describePassive(passive);
    return {
        special, passive, progression, stats: {
            hp: baseHp + [0, 4, 6, -6][style] + progression.bonus.hp,
            attack: baseAttack + [1, -1, -1, 1][style] + progression.bonus.attack,
            defense: baseDefense + (style === 2 ? 1 : 0) + progression.bonus.defense,
            speed: baseSpeed + (style === 3 ? 2 : 0) + progression.bonus.speed
        }
    };
}
function describeSpecial(skill: BattleSpecial): string {
    const n = skill.strength;
    const descriptions: Record<SpecialKind, string> = {
        burst: `A heavy attack dealing +${4 + n} extra damage.`,
        mend: `Attack and heal ${4 + skill.cost + Math.floor(n / 2)} HP, even if the attack is dodged.`,
        aegis: `Attack and gain ${5 + skill.cost + Math.floor(n / 2)} Shield, even if the attack is dodged (max ${SHIELD_CAP}).`,
        pierce: `Attack for +${2 + n} damage and bypass up to ${n + 3} points of enemy Shield.`,
        siphon: `Attack for +${Math.floor(n / 2) + 1} damage and steal up to ${Math.min(2, n - 1)} enemy Focus on hit.`,
        sunder: `Attack for +${2 + Math.floor(n / 2)} damage; shatter up to ${8 + n * 2} enemy Shield on hit.`,
        recoil: `Overwhelm with +${9 + n} damage; take ${2 + n} recoil HP (cannot knock yourself out).`,
        battery: `Attack for +2 damage and recover ${Math.min(3, n)} Focus on hit.`,
        sidestep: `Attack for +${2 + n} damage and prepare a swift dodge (+20% chance against the next incoming attack).`,
        finisher: `Attack; gain +${7 + n} damage when the enemy has 50% HP or less.`,
        rally: `Attack for +3 damage and empower your next damaging move by +${2 + n} damage.`
    };
    return `${descriptions[skill.kind]} Costs ${skill.cost}/${FOCUS_CAP} Focus; ${skill.cooldown}-action cooldown.`;
}
function describePassive(passive: BattlePassive): string {
    const n = passive.strength;
    const descriptions: Record<PassiveKind, string> = {
        comeback: `All damaging moves deal +${3 + Math.floor(n / 2)} damage when HP is at most 50%.`,
        guardboost: `Guard gains +${n + 3} additional Shield.`,
        focusheal: `Focus restores ${n + 2} HP.`,
        stride: `Paw Strike grants +1 Focus, even though normal strikes do not charge Focus.`,
        lightfoot: `Dodge chance increases by ${n}% (maximum 20% before buffs).`,
        thorns: `Reflect ${n + 2} HP damage when Shield blocks a hit (cannot KO attacker).`,
        laststand: `Once per battle, if you survive a hit at 35% HP or lower, gain ${6 + n * 2} Shield.`,
        quickreset: `Your special has a 1-action shorter cooldown (minimum 1).`,
        leech: `Paw Strike heals ${n + 1} HP when it lands.`,
        steady: `Take ${n + 1} less damage from enemy specials.`,
        resolve: `Gain 1 Focus whenever an enemy hit deals HP damage.`
    };
    return descriptions[passive.kind];
}
// Standard moves never generate Focus except Focus itself. Breed-specific passives
// and specials may still grant Focus as part of their unique mechanics.
// Guard fatigue prevents permanent Shield stacking: 14, 7, then 0 for successive
// Guards. Any other chosen move resets the chain.
export const BRAWL_RULES = {focusCap: FOCUS_CAP, shieldCap: SHIELD_CAP, roundSeconds: 30, maxRounds: 18,
    strikeFocus: 0, guardFocus: 0, focusGain: 3, guardShield: 14, repeatedGuardShield: 7, exhaustedGuardShield: 0};

export function guardShieldForStreak(streak: number, passive?: BattlePassive): number {
    const bonus = passive?.kind === 'guardboost' ? passive.strength + 3 : 0;
    if (streak >= 2) return BRAWL_RULES.exhaustedGuardShield;
    if (streak === 1) return BRAWL_RULES.repeatedGuardShield + Math.ceil(bonus / 2);
    return BRAWL_RULES.guardShield + bonus;
}
export function getPublicCombatCatalog() {
    const kits: Record<string, Record<string, BattleKit>> = {};
    for (const [species, breeds] of Object.entries(BREED_LIST)) {
        kits[species] = {};
        for (const breed of breeds) kits[species][breed] = getCombatKit(species, breed);
    }
    return {rules: BRAWL_RULES, speciesStats: BRAWL_SPECIES_STATS, kits};
}
