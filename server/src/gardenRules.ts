import {randomInt} from 'node:crypto';

// Keep the odds and payouts together so the server, tests, and player guide agree.
export const FLOWER_RULES = [
    {rarity:'Wilted',name:'Faded Bloom',chance:10,min:20,max:30},
    {rarity:'Common',name:'Blush Daisy',chance:55,min:37,max:50},
    {rarity:'Uncommon',name:'Lavender Blossom',chance:25,min:55,max:80},
    {rarity:'Rare',name:'Crystal Petal',chance:9,min:100,max:150},
    {rarity:'Legendary',name:'Golden Starflower',chance:1,min:400,max:600}
] as const;

export const GARDEN_SEED_PRICE = 40;
export const GARDEN_WATER_PRICE = 10;
export const GARDEN_GROWTH_MS = 5 * 60 * 1000;

export function rollFlower(roll = randomInt(100)) {
    if (!Number.isInteger(roll) || roll < 0 || roll >= 100) throw new RangeError('Garden roll must be 0–99.');
    let cumulative = 0;
    for (const flower of FLOWER_RULES) {
        cumulative += flower.chance;
        if (roll < cumulative) return flower;
    }
    throw new Error('Garden rarity weights must sum to 100.');
}

export function createGardenFlower(now = new Date()) {
    const flower = rollFlower();
    return {
        planted_at: now.toISOString(),
        watered_minutes: 0,
        rarity: flower.rarity,
        reward: randomInt(flower.min, flower.max + 1),
        variant: randomInt(4)
    };
}

export function gardenHarvestReady(plot: {planted_at:string;watered_minutes?:number}, at = Date.now()) {
    const planted = new Date(plot.planted_at).getTime();
    return Number.isFinite(planted) && at - planted + Math.min(5,Math.max(0,Number(plot.watered_minutes)||0))*60000 >= GARDEN_GROWTH_MS;
}

// Unrevealed flower attributes must not be sent to browsers via any pet endpoint.
export function publicPetGarden<T extends {garden?:any} | null>(pet: T): T {
    if (!pet || !pet.garden) return pet;
    const garden = pet.garden;
    return {
        ...pet,
        garden: {
            ...garden,
            plots: Array.isArray(garden.plots)
                ? garden.plots.map((plot:any) => plot?.planted_at
                    ? {planted_at:plot.planted_at,watered_minutes:plot.watered_minutes||0}
                    : null)
                : garden.plots
        }
    } as T;
}

export type GardenDiscovery = {count:number;first_at:string;best_reward:number};

export function recordFlowerDiscovery(garden:any, rarity:string, reward:number, now = new Date()) {
    if (!FLOWER_RULES.some(flower => flower.rarity === rarity)) return false;
    const discoveries:Record<string,GardenDiscovery> = garden.discoveries && typeof garden.discoveries === 'object'
        ? {...garden.discoveries} : {};
    const previous = discoveries[rarity];
    discoveries[rarity] = {
        count: Math.max(0,Number(previous?.count)||0) + 1,
        first_at: previous?.first_at || now.toISOString(),
        best_reward: Math.max(Number(previous?.best_reward)||0,reward)
    };
    garden.discoveries = discoveries;
    return !previous;
}
