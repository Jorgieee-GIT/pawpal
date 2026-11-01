export type MusicZone = "main" | "garden" | "kitchen" | "arcade" | "multiplayer";

export type MusicTrack = {
    title: string;
    filename: string;
    source: string | null;
    loudnessTrim: number;
};

// Each MP3 is normalized to approximately -18 LUFS during asset preparation.
// Keep a single shared music volume for all five game areas.
export const MUSIC_TRACKS: Record<MusicZone, MusicTrack> = {
    main: {
        title: "PawPal Theme",
        filename: "bgm_main.mp3",
        source: "/audio/bgm_main.mp3",
        loudnessTrim: 1
    },
    garden: {
        title: "Blooming Days",
        filename: "bgm_garden.mp3",
        source: "/audio/bgm_garden.mp3",
        loudnessTrim: 1
    },
    kitchen: {
        title: "Little Chef",
        filename: "bgm_kitchen.mp3",
        source: "/audio/bgm_kitchen.mp3",
        loudnessTrim: 1
    },
    arcade: {
        title: "Playtime!",
        filename: "bgm_arcade.mp3",
        source: "/audio/bgm_arcade.mp3",
        loudnessTrim: 1
    },
    multiplayer: {
        title: "Tiny Champions",
        filename: "bgm_multiplayer.mp3",
        source: "/audio/bgm_multiplayer.mp3",
        loudnessTrim: 1
    }
};

export type AudioPreferences = {
    musicVolume: number;
};

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
    musicVolume: 0
};

export function readAudioPreferences(): AudioPreferences {
    try {
        const saved = JSON.parse(localStorage.getItem("pawpal-audio-preferences") || "null");

        if (!saved || typeof saved !== "object") {
            return DEFAULT_AUDIO_PREFERENCES;
        }

        // Preserve the old music toggle: users who had music off stay muted.
        const savedVolume = typeof saved.musicVolume === "number" && Number.isFinite(saved.musicVolume)
            ? Math.max(0, Math.min(100, saved.musicVolume))
            : DEFAULT_AUDIO_PREFERENCES.musicVolume;

        return {
            musicVolume: saved.musicEnabled === false ? 0 : savedVolume
        };
    } catch {
        return DEFAULT_AUDIO_PREFERENCES;
    }
}

export function musicZoneForTab(tab: string, game: string | null): MusicZone {
    if (game) {
        return "arcade";
    }

    if (tab === "garden") {
        return "garden";
    }

    if (tab === "kitchen") {
        return "kitchen";
    }

    if (tab === "games") {
        return "arcade";
    }

    if (tab === "multiplayer") {
        return "multiplayer";
    }

    return "main";
}
