import { useEffect, type CSSProperties } from "react";
import {
    Check,
    Moon,
    Music2,
    Settings,
    Monitor,
    Sun,
    Volume2,
    X
} from "lucide-react";
import { SettingsArtwork, type AppearanceChoice } from "./SettingsArt";
import { MUSIC_TRACKS, type AudioPreferences, type MusicZone } from "./musicTracks";
import "./SettingsModal.css";

type SettingsModalProps = {
    open: boolean;
    onClose: () => void;
    appearance: AppearanceChoice;
    onAppearanceChange: (value: AppearanceChoice) => void;
    audio: AudioPreferences;
    onAudioChange: (value: AudioPreferences) => void;
    zone: MusicZone;
};

const APPEARANCE_OPTIONS: Array<{
    key: AppearanceChoice;
    title: string;
    description: string;
}> = [
    {
        key: "light",
        title: "Light",
        description: "Soft & sunny"
    },
    {
        key: "dark",
        title: "Dark",
        description: "Cozy evenings"
    },
    {
        key: "system",
        title: "System",
        description: "Follow device"
    }
];

export default function SettingsModal({
    open,
    onClose,
    appearance,
    onAppearanceChange,
    audio,
    onAudioChange,
    zone
}: SettingsModalProps) {
    useEffect(() => {
        if (!open) {
            return;
        }

        const priorOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
            }
        }

        window.addEventListener("keydown", handleEscape);

        return () => {
            document.body.style.overflow = priorOverflow;
            window.removeEventListener("keydown", handleEscape);
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    const readyTracks = Object.values(MUSIC_TRACKS).filter(track => Boolean(track.source)).length;

    return (
        <div
            className="paw-modal-backdrop paw-settings-backdrop"
            onMouseDown={event => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <section className="paw-modal paw-settings-modal" role="dialog" aria-modal="true" aria-labelledby="paw-settings-title">
                <div className="paw-modal-top paw-settings-header">
                    <div className="paw-settings-heading">
                        <span className="paw-settings-heading-icon" aria-hidden="true">
                            <Settings size={23} strokeWidth={1.8} />
                        </span>
                        <div>
                            <h2 id="paw-settings-title">Settings</h2>
                            <p>Make PawPal feel like your own little world.</p>
                        </div>
                    </div>
                    <button type="button" className="paw-modal-close" onClick={onClose} aria-label="Close Settings">
                        <X size={20} />
                    </button>
                </div>

                <section className="paw-settings-section" aria-labelledby="paw-settings-appearance-heading">
                    <div className="paw-settings-section-heading">
                        <div>
                            <h3 id="paw-settings-appearance-heading">Appearance</h3>
                            <span>Choose your favorite look.</span>
                        </div>
                        {appearance === "light" ? <Sun size={20} aria-hidden="true" /> : appearance === "dark" ? <Moon size={20} aria-hidden="true" /> : <Monitor size={20} aria-hidden="true" />}
                    </div>
                    <div className="paw-settings-appearance-grid" role="group" aria-label="Appearance theme">
                        {APPEARANCE_OPTIONS.map(option => (
                            <button
                                key={option.key}
                                type="button"
                                className={`paw-settings-appearance ${appearance === option.key ? "is-selected" : ""}`}
                                onClick={() => onAppearanceChange(option.key)}
                                aria-pressed={appearance === option.key}
                            >
                                <span className="paw-settings-appearance-art">
                                    <SettingsArtwork choice={option.key} />
                                </span>
                                <span className="paw-settings-appearance-label">
                                    <strong>{option.title}</strong>
                                    {appearance === option.key && <Check size={15} strokeWidth={2.5} aria-hidden="true" />}
                                </span>
                                <span className="paw-settings-appearance-caption">{option.description}</span>
                            </button>
                        ))}
                    </div>
                    <p className="paw-settings-hint">Appearance changes the website UI. Your pet's room atmosphere stays separate.</p>
                </section>

                <section className="paw-settings-section" aria-labelledby="paw-settings-music-heading">
                    <div className="paw-settings-section-heading">
                        <div>
                            <h3 id="paw-settings-music-heading">Background music</h3>
                            <span>Slide the paw to adjust the music. At 0%, music is off.</span>
                        </div>
                        <Music2 size={21} aria-hidden="true" />
                    </div>
                    <div className="paw-settings-volume">
                        <div className="paw-settings-volume-top">
                            <label htmlFor="paw-settings-volume-slider">
                                <Volume2 size={18} aria-hidden="true" /> Music volume
                            </label>
                            <output htmlFor="paw-settings-volume-slider">{audio.musicVolume}%</output>
                        </div>
                        <input
                            className="paw-settings-paw-slider"
                            style={{ "--paw-volume-progress": `${audio.musicVolume}%` } as CSSProperties}
                            aria-valuetext={`${audio.musicVolume}% music volume`}
                            id="paw-settings-volume-slider"
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={audio.musicVolume}
                            onChange={event => onAudioChange({
                                ...audio,
                                musicVolume: Number(event.target.value)
                            })}
                        />
                    </div>
                    <div className="paw-settings-now-playing">
                        <span className="paw-settings-round-icon" aria-hidden="true"><Music2 size={19} /></span>
                        <span>
                            <strong>{MUSIC_TRACKS[zone].title}</strong>
                            <small>{readyTracks === 0 ? "Music ready" : MUSIC_TRACKS[zone].source ? "Music for this area" : "Music unavailable"}</small>
                        </span>
                        <span className="paw-settings-track-status">{readyTracks}/5 tracks</span>
                    </div>
                    <p className="paw-settings-hint">Music pauses automatically when you leave this browser tab. All five tracks share one volume setting.</p>
                </section>
                <div className="paw-settings-footer">
                    <span>Preferences are saved on this device.</span>
                    <button type="button" className="paw-settings-done" onClick={onClose}>Done</button>
                </div>
            </section>
        </div>
    );
}
