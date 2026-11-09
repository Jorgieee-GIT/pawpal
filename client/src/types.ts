import type { Outfit } from "./outfitCatalog";

export type User = {
    id: string;
    username: string;
    pet_note?: string | null;
    note_expires_at?: string | null;
};

export type MealData = {
    meals: Record<string, number>;
    recipes: Record<
        string,
        {
            name: string;
            hunger: number;
            happiness: number;
            energy: number;
            xp: number;
        }
    >;
};

export type ApiRequest = (path: string, method?: string, body?: unknown) => Promise<any>;
export type ExecuteAction = (path: string, body?: unknown, method?: string) => Promise<any>;

export type Pet = {
    id: string;
    name: string;
    species: string;
    color: string;
    breed: string;
    level: number;
    xp: number;
    coins: number;
    hunger: number;
    happiness: number;
    energy: number;
    cleanliness: number;
    affection: number;
    food: number;
    toys: number;
    owned_cosmetics: string[];
    equipped_cosmetic: string;
    equipped_outfit: Outfit;
    owned_colors: string[];
    owned_breeds: string[];
    room_theme: string;
    active_room?: string;
    unlocked_rooms?: string[];
    room_layouts?: Record<
        string,
        {
            id: string;
            x: number;
            y: number;
        }[]
    >;
    owned_items: string[];
    placed_items: string[];
    garden: {
        seeds: number;
        flowers: number;
        planted_at?: string | null;
        watering_cans?: number;
        watered_minutes?: number;
        unlocked_plots?: number;
        plots?: ({
            planted_at: string;
            watered_minutes: number;
        } | null)[];
        discoveries?: Record<
            string,
            {
                count: number;
                first_at: string;
                best_reward: number;
            }
        >;
        _sleeping?: boolean;
    };
    last_daily: string | null;
    daily_claimed_at: string | null;
};

export type PawNotification = {
    kind: string;
    actor: string;
    event_id: string;
    created_at: string;
    unread: boolean;
    game_name?: string | null;
    wager?: number | null;
    title?: string;
    body?: string;
};

export type PawMail = {
    id: string;
    sender_id: string;
    sender_username: string;
    design: string;
    message: string;
    color?: string;
    sender_pet?: any;
    created_at: string;
    expires_at: string;
    read_at: string | null;
    recipient_username?: string;
};

export type RoomPet = {
    id: string;
    name: string;
    species: string;
    color: string;
    breed: string;
    level: number;
    hunger: number;
    happiness: number;
    energy: number;
    cleanliness: number;
    affection: number;
    equipped_cosmetic: string;
    equipped_outfit: Outfit;
    username: string;
    user_id: string;
    pet_note?: string | null;
    note_expires_at?: string | null;
    sleeping?: boolean;
};

export type Friend = {
    requester_id: string;
    recipient_id: string;
    friend_id: string;
    username: string;
    status: string;
    created_at: string;
};
