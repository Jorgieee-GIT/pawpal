export type MusicZone = "main" | "garden" | "kitchen" | "arcade" | "multiplayer";

export type MusicTrack = {
    title: string;
    filename: string;
    source: string | null;
    loudnessTrim: number;
};

// Each track is normalized to approximately -18 LUFS and encoded as 64 kbps AAC
// during asset preparation. Keep a single shared music volume for all five game areas.
export const MUSIC_TRACKS: Record<MusicZone, MusicTrack> = {
    main: {
        title: "PawPal Theme",
        filename: "bgm_main.m4a",
        source: "/audio/bgm_main.m4a",
        loudnessTrim: 1
    },
    garden: {
        title: "Blooming Days",
        filename: "bgm_garden.m4a",
        source: "/audio/bgm_garden.m4a",
        loudnessTrim: 1
    },
    kitchen: {
        title: "Little Chef",
        filename: "bgm_kitchen.m4a",
        source: "/audio/bgm_kitchen.m4a",
        loudnessTrim: 1
    },
    arcade: {
        title: "Playtime!",
        filename: "bgm_arcade.m4a",
        source: "/audio/bgm_arcade.m4a",
        loudnessTrim: 1
    },
    multiplayer: {
        title: "Tiny Champions",
        filename: "bgm_multiplayer.m4a",
        source: "/audio/bgm_multiplayer.m4a",
        loudnessTrim: 1
    }
};

export type AudioPreferences = {
    musicVolume: number;
};

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
    musicVolume: 0
};

/*
 * DOCU: Read audio preferences for this feature.
 * @returns {AudioPreferences} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function readAudioPreferences(): AudioPreferences {
    try {
        const saved = JSON.parse(localStorage.getItem("pawpal-audio-preferences") || "null");

        if (!saved || typeof saved !== "object") {
            return DEFAULT_AUDIO_PREFERENCES;
        }

        // Preserve the old music toggle: users who had music off stay muted.
        const savedVolume =
            typeof saved.musicVolume === "number" && Number.isFinite(saved.musicVolume)
                ? Math.max(0, Math.min(100, saved.musicVolume))
                : DEFAULT_AUDIO_PREFERENCES.musicVolume;

        return {
            musicVolume: saved.musicEnabled === false ? 0 : savedVolume
        };
    } catch {
        return DEFAULT_AUDIO_PREFERENCES;
    }
}

/*
 * DOCU: Handle music zone for tab behavior for this feature.
 * @param {string} tab - tab value used by this function
 * @param {string | null} game - game value used by this function
 * @returns {MusicZone} - Result returned by this function.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
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
