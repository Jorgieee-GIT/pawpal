import {
    Bath,
    BrainCircuit,
    CookingPot,
    Crown,
    Flower2,
    Gamepad2,
    Glasses,
    Heart,
    House,
    Moon,
    Rabbit,
    Shirt,
    ShoppingBag,
    Sparkles,
    Sprout,
    Swords,
    Trophy,
    Users,
    Utensils
} from "lucide-react";

const PAW_ICONS: Record<
    string,
    React.ComponentType<{
        size?: number;
        strokeWidth?: number;
        className?: string;
    }>
> = {
    home: House,
    friends: Users,
    shop: ShoppingBag,
    wardrobe: Shirt,
    games: Gamepad2,
    multiplayer: Swords,
    garden: Flower2,
    kitchen: CookingPot,
    missions: Trophy,
    memory: BrainCircuit,
    dino: Sprout,
    runner: Rabbit,
    pattern: Heart,
    mole: Gamepad2,
    feed: Utensils,
    play: Gamepad2,
    sleep: Moon,
    bathe: Bath,
    cuddle: Heart
};

/*
 * DOCU: Render the paw icon interface and provide its feature behavior.
 * @param {{ name: string; size?: number }} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function PawIcon({ name, size = 19 }: { name: string; size?: number }) {
    const Component = PAW_ICONS[name] || Sparkles;
    return <Component size={size} strokeWidth={2.2} className="paw-svg-icon" />;
}

/*
 * DOCU: Render the paw slot icon interface and provide its feature behavior.
 * @param {{ slot: string }} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function PawSlotIcon({ slot }: { slot: string }) {
    const Icon =
        slot === "head" ? Crown : slot === "eyes" ? Glasses : slot === "neck" ? Heart : Shirt;
    return <Icon size={16} aria-hidden="true" />;
}
