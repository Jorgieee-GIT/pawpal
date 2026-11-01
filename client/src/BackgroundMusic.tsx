import { useEffect, useRef } from "react";
import { MUSIC_TRACKS, type AudioPreferences, type MusicZone } from "./musicTracks";

type Channel = {
    audio: HTMLAudioElement;
    track: MusicZone;
    mix: number;
    gain: number;
    frame: number | null;
    started: boolean;
};

type BackgroundMusicProps = {
    zone: MusicZone;
    preferences: AudioPreferences;
};

const FADE_DURATION = 800;

export default function BackgroundMusic({ zone, preferences }: BackgroundMusicProps) {
    const activeRef = useRef<Channel | null>(null);
    const allChannelsRef = useRef<Set<Channel>>(new Set());
    const preferencesRef = useRef(preferences);

    preferencesRef.current = preferences;

    function applyVolume(channel: Channel) {
        const prefs = preferencesRef.current;
        const hidden = document.visibilityState === "hidden";
        const level = prefs.musicVolume > 0 && !hidden ? channel.mix : 0;

        channel.audio.volume = Math.min(1, Math.max(0, level * prefs.musicVolume / 100 * channel.gain));
    }

    function dispose(channel: Channel) {
        if (channel.frame !== null) {
            cancelAnimationFrame(channel.frame);
            channel.frame = null;
        }

        channel.audio.pause();
        channel.audio.removeAttribute("src");
        channel.audio.load();
        allChannelsRef.current.delete(channel);

        if (activeRef.current === channel) {
            activeRef.current = null;
        }
    }

    function fade(channel: Channel, destination: number, done?: () => void) {
        if (channel.frame !== null) {
            cancelAnimationFrame(channel.frame);
            channel.frame = null;
        }

        const startingMix = channel.mix;
        const startingTime = performance.now();

        function update(time: number) {
            const progress = Math.min(1, (time - startingTime) / FADE_DURATION);
            const eased = progress * progress * (3 - 2 * progress);

            channel.mix = startingMix + (destination - startingMix) * eased;
            applyVolume(channel);

            if (progress < 1) {
                channel.frame = requestAnimationFrame(update);
            } else {
                channel.frame = null;
                done?.();
            }
        }

        channel.frame = requestAnimationFrame(update);
    }

    function startPlayback(channel: Channel) {
        if (!allChannelsRef.current.has(channel) || preferencesRef.current.musicVolume <= 0) {
            return;
        }

        if (document.visibilityState === "hidden") {
            return;
        }

        if (channel.started && !channel.audio.paused) {
            return;
        }

        void channel.audio.play().then(() => {
            if (!allChannelsRef.current.has(channel)) {
                return;
            }

            if (!channel.started) {
                channel.started = true;
                fade(channel, 1);
            }
        }).catch(() => {
            // Browsers can block playback until the next user gesture.
            // Keep the channel instead of losing music until Settings is toggled.
        });
    }

    useEffect(() => {
        const track = MUSIC_TRACKS[zone];
        const current = activeRef.current;

        if (preferences.musicVolume <= 0 || !track.source) {
            for (const channel of allChannelsRef.current) {
                fade(channel, 0, () => dispose(channel));
            }

            activeRef.current = null;
            return;
        }

        if (current && current.track === zone) {
            applyVolume(current);
            return;
        }

        for (const channel of allChannelsRef.current) {
            fade(channel, 0, () => dispose(channel));
        }

        const audio = new Audio(track.source);
        audio.loop = true;
        audio.preload = "auto";
        audio.volume = 0;

        const channel: Channel = {
            audio,
            track: zone,
            mix: 0,
            gain: track.loudnessTrim,
            frame: null,
            started: false
        };

        allChannelsRef.current.add(channel);
        activeRef.current = channel;

        if (document.visibilityState !== "hidden") {
            startPlayback(channel);
        } else {
            channel.mix = 1;
        }
    }, [zone, preferences.musicVolume > 0]);

    useEffect(() => {
        function syncVisibility() {
            const hidden = document.visibilityState === "hidden";

            for (const channel of allChannelsRef.current) {
                if (hidden) {
                    channel.audio.pause();
                } else if (preferencesRef.current.musicVolume > 0 && channel.audio.paused) {
                    startPlayback(channel);
                }

                applyVolume(channel);
            }
        }

        function resumeOnGesture() {
            if (preferencesRef.current.musicVolume <= 0) {
                return;
            }

            for (const channel of allChannelsRef.current) {
                if (channel.audio.paused) {
                    startPlayback(channel);
                }
            }
        }

        document.addEventListener("visibilitychange", syncVisibility);
        window.addEventListener("pointerdown", resumeOnGesture, { passive: true });
        window.addEventListener("keydown", resumeOnGesture);
        syncVisibility();

        return () => {
            document.removeEventListener("visibilitychange", syncVisibility);
            window.removeEventListener("pointerdown", resumeOnGesture);
            window.removeEventListener("keydown", resumeOnGesture);
        };
    }, [preferences.musicVolume]);

    useEffect(() => {
        return () => {
            for (const channel of allChannelsRef.current) {
                dispose(channel);
            }
        };
    }, []);

    return null;
}
