import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type MatchExitConfirmationProps = {
    gameName: string;
    description: string;
    busy: boolean;
    error?: string;
    onCancel: () => void;
    onForfeit: () => void;
};

/** Reusable exit guard for an active multiplayer match. The server determines the result. */
export default function MatchExitConfirmation({
    gameName,
    description,
    busy,
    error,
    onCancel,
    onForfeit
}: MatchExitConfirmationProps) {
    const confirmRef = useRef<HTMLButtonElement | null>(null);
    useEffect(() => { confirmRef.current?.focus(); }, []);
    // Portal escapes the fixed-height battle window and its clipping/stacking context.
    return createPortal(
        <div
            className="paw-brawl-confirm-backdrop"
            role="presentation"
            onMouseDown={event => {
                if (event.target === event.currentTarget && !busy) {
                    onCancel();
                }
            }}
        >
            <section
                className="paw-brawl-confirm-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="paw-match-exit-title"
                aria-describedby="paw-match-exit-description"
            >
                <div className="paw-modal-top paw-match-confirm-heading">
                    <div>
                        <h3 id="paw-match-exit-title">Forfeit {gameName}?</h3>
                        <p className="paw-modal-subtitle">This will immediately end your match.</p>
                    </div>
                    <button
                        type="button"
                        className="paw-modal-close"
                        aria-label="Keep playing"
                        onClick={onCancel}
                        disabled={busy}
                    >
                        <X size={19} />
                    </button>
                </div>
                <p id="paw-match-exit-description">{description}</p>
                {error && <p className="paw-brawl-confirm-error" role="alert">{error}</p>}
                <div className="paw-brawl-confirm-actions">
                    <button type="button" onClick={onCancel} disabled={busy}>
                        Keep playing
                    </button>
                    <button ref={confirmRef} type="button" className="is-danger" disabled={busy} onClick={onForfeit}>
                        {busy ? "Forfeiting…" : "Yes, forfeit"}
                    </button>
                </div>
            </section>
        </div>,
        document.body
    );
}
