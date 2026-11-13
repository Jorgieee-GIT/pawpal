import { useEffect, useState, type CSSProperties } from "react";
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
import type { AudioPreferences } from "./musicTracks";
import "./SettingsModal.css";

type SettingsModalProps = {
    open: boolean;
    onClose: () => void;
    appearance: AppearanceChoice;
    onAppearanceChange: (value: AppearanceChoice) => void;
    audio: AudioPreferences;
    onAudioChange: (value: AudioPreferences) => void;
    canReport: boolean;
    onSendReport: (category: "bug" | "player" | "feedback" | "other", description: string) => Promise<void>;
    onOpenPolicy: (page: "privacy" | "terms") => void;
};

const APPEARANCE_OPTIONS: Array<{
    key: AppearanceChoice;
    title: string;
}> = [
    {
        key: "light",
        title: "Light"
    },
    {
        key: "dark",
        title: "Dark"
    },
    {
        key: "system",
        title: "System"
    }
];

export default function SettingsModal({
    open,
    onClose,
    appearance,
    onAppearanceChange,
    audio,
    onAudioChange,
    onSendReport,
    canReport,
    onOpenPolicy
}: SettingsModalProps) {
    const [reportCategory, setReportCategory] = useState<"bug" | "player" | "feedback" | "other">("bug");
    const [reportDescription, setReportDescription] = useState("");
    const [reportBusy, setReportBusy] = useState(false);
    const [reportMessage, setReportMessage] = useState("");
    async function submitReport(event: React.FormEvent) {
        event.preventDefault();
        setReportBusy(true);
        setReportMessage("");
        try {
            await onSendReport(reportCategory, reportDescription.trim());
            setReportDescription("");
            setReportMessage("Your report was sent to the PawPal administrator.");
        } catch (error) {
            setReportMessage((error as Error).message);
        } finally {
            setReportBusy(false);
        }
    }
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
                            </button>
                        ))}
                    </div>
                </section>

                <section className="paw-settings-section" aria-labelledby="paw-settings-music-heading">
                    <div className="paw-settings-section-heading">
                        <div>
                            <h3 id="paw-settings-music-heading">Background music</h3>
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
                </section>
                {canReport && <section className="paw-settings-section" aria-labelledby="paw-settings-report-heading">
                    <div className="paw-settings-section-heading">
                        <div><h3 id="paw-settings-report-heading">Report an issue</h3></div>
                    </div>
                    <form className="paw-settings-report" onSubmit={submitReport}>
                        <label>Category
                            <select value={reportCategory} onChange={e => setReportCategory(e.target.value as typeof reportCategory)}>
                                <option value="bug">Bug or technical issue</option>
                                <option value="player">Player concern</option>
                                <option value="feedback">Feedback</option>
                                <option value="other">Other</option>
                            </select>
                        </label>
                        <label>Describe what happened
                            <textarea minLength={15} maxLength={1000} required rows={3} value={reportDescription}
                                onChange={e => setReportDescription(e.target.value)} placeholder="What went wrong?" />
                        </label>
                        {reportMessage && <p role="status" className="paw-settings-report-message">{reportMessage}</p>}
                        <button type="submit" disabled={reportBusy || reportDescription.trim().length < 15}>
                            {reportBusy ? "Sending..." : "Send report"}
                        </button>
                    </form>
                </section>}
                <div className="paw-settings-footer">
                    <div className="paw-settings-legal"><button type="button" onClick={() => onOpenPolicy("terms")}>Terms of Service</button><button type="button" onClick={() => onOpenPolicy("privacy")}>Privacy Policy</button></div>
                </div>
            </section>
        </div>
    );
}
