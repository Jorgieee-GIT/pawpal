import "./KitchenRoom.css";
import { X } from "lucide-react";
import { useLayoutEffect, useRef, type ReactNode } from "react";

const stations = {
    recipes: "Recipe Book",
    experiment: "Experiment Station",
    ingredients: "Ingredient Market",
    pantry: "Pantry"
};

export type KitchenStation = keyof typeof stations;

/*
 * DOCU: Render the station art interface and provide its feature behavior.
 * @param {{ station: KitchenStation }} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function StationArt({ station }: { station: KitchenStation }) {
    if (station === "pantry") {
        return <svg viewBox="0 0 142 222" aria-hidden="true">
            <g stroke="#795464" strokeWidth="3" strokeLinejoin="round">
                <path d="M18 11h106l10 12v174l-10 11H18L8 197V23Z" fill="#b67e86" />
                <path d="M8 23h126v8H8zM8 193h126v9H8z" fill="#f8c7b0" />
                <path d="M18 33h106v157H18z" fill="#d69a94" />
                <path d="M25 42h43v108H25zm49 0h43v108H74z" fill="#f6cbb7" />
                <path d="M32 50h29v48H32zm49 0h29v48H81z" fill="#a9c6bc" />
                <path d="M32 105h29v36H32zm49 0h29v36H81z" fill="#eab39d" />
                <path d="M25 157h92v25H25z" fill="#f6cbb7" />
                <path d="M59 115v10m24-10v10m-21 45h18" strokeLinecap="round" />
                <path d="M38 89V72h9v17m4 0V65h6v24m29 0V72h17v17" fill="#fcdfad" strokeWidth="2" />
                <path d="M17 203v10h11v-10m86 0v10h11v-10" fill="#9d6a79" />
            </g>
        </svg>;
    }
    return <svg viewBox="0 0 150 105" aria-hidden="true">
        <ellipse cx="75" cy="90" rx="61" ry="8" fill="#533347" opacity=".19" />
        <g stroke="#795464" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
            {station === "recipes" && <>
                <path d="M12 47l58-22 68 18-9 44-57 5-59-15Z" fill="#b86c88" />
                <path d="M15 43q31-16 59-3 25-17 61-5l-9 45q-29-7-53 6-25-13-55-13Z" fill="#fff0cc" />
                <path d="M74 40l-1 46M25 50q17-6 33-1m-32 11q17-5 33 0m30-9q16-8 32-5m-34 15q17-8 32-5" fill="none" />
                <path d="M102 37l-4 35 7-5 5 5 5-36" fill="#df8ca3" />
            </>}
            {station === "experiment" && <>
                <path d="M18 50q7 43 56 43t58-43" fill="#d68fad" />
                <ellipse cx="75" cy="49" rx="57" ry="16" fill="#ffe6df" />
                <ellipse cx="75" cy="53" rx="44" ry="8" fill="#e6a976" stroke="none" />
                <path d="M82 51l29-36q7-9 14-5 6 5 0 11L91 54" fill="#f5c497" />
                <path d="M36 68q13 14 30 15" fill="none" stroke="#ffecf1" />
            </>}
            {station === "ingredients" && <>
                <path d="M97 56l21 32H44l18-32" fill="#b77e8c" />
                <rect x="24" y="15" width="103" height="64" rx="11" fill="#78677f" />
                <rect x="32" y="23" width="87" height="48" rx="5" fill="#e3f4ec" />
                <path d="M56 35h8l6 21h25l5-16H66" fill="none" />
                <circle cx="75" cy="62" r="2" fill="#795464" /><circle cx="91" cy="62" r="2" fill="#795464" />
            </>}
        </g>
    </svg>;
}

/*
 * DOCU: Render the kitchen room interface and provide its feature behavior.
 * @param {{
    onOpen: (station: KitchenStation) => void;
    pantryCount: number;
}} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function KitchenRoom({ onOpen, pantryCount }: {
    onOpen: (station: KitchenStation) => void;
    pantryCount: number;
}) {
    return <div className="kitchen-room-shell">
    <div className="kitchen-room" aria-label="Kitchen stations" role="group">
        <div className="kitchen-room-window" aria-hidden="true" />
        <svg className="kitchen-room-utensils" viewBox="0 0 120 82" aria-hidden="true">
            <g stroke="#795464" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="8" width="108" height="9" rx="4" fill="#f9cbb3" />
                <path d="M28 17v26m31-26v25m31-25v37" fill="none" />
                <path d="M28 41c-19 0-17 30 0 30s19-30 0-30Z" fill="#eab68d" />
                <path d="M50 41h18v25H50zm6 6v12m6-12v12" fill="#a9c6bc" />
                <path d="M80 53h22c0 22-22 22-22 0Z" fill="#da98b0" />
            </g>
        </svg>
        <div className="kitchen-room-counter" aria-hidden="true" />
        <div className="kitchen-room-floor" aria-hidden="true" />
        <div className="kitchen-room-island" aria-hidden="true" />
        {(Object.keys(stations) as KitchenStation[]).map(station =>
            <button key={station} className={`kitchen-room-station kitchen-room-station--${station}`} type="button" aria-haspopup="dialog" onClick={() => onOpen(station)}>
                <StationArt station={station} />
                <span>{station === "experiment" ? "Experiment" : station === "ingredients" ? "Market" : stations[station]}
                    {station === "pantry" && pantryCount > 0 && <small>{pantryCount}</small>}
                </span>
            </button>
        )}
    </div>
    </div>;
}

/*
 * DOCU: Render the kitchen station dialog interface and provide its feature behavior.
 * @param {{
    station: KitchenStation;
    onDismiss: () => void;
    children: ReactNode;
}} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function KitchenStationDialog({ station, onDismiss, children }: {
    station: KitchenStation;
    onDismiss: () => void;
    children: ReactNode;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    useLayoutEffect(() => {
        const dialog = dialogRef.current;
        dialog?.showModal();
        return () => dialog?.close();
    }, []);

    useLayoutEffect(() => {
        if (contentRef.current) contentRef.current.scrollTop = 0;
        closeRef.current?.focus();
    }, [station]);

    return <dialog ref={dialogRef} className="kitchen-station-dialog" aria-labelledby="kitchen-station-title" onCancel={event => { event.preventDefault(); onDismiss(); }} onClick={event => { if (event.target === event.currentTarget) onDismiss(); }}>
        <div className="kitchen-station-dialog-frame">
            <header className="paw-modal-top kitchen-station-dialog-header">
                <div>
                    <h2 id="kitchen-station-title">{stations[station]}</h2>
                </div>
                <button ref={closeRef} type="button" aria-label="Close kitchen station" className="paw-modal-close" onClick={onDismiss}><X size={18} aria-hidden="true" /></button>
            </header>
            <div className="kitchen-station-dialog-content" ref={contentRef}>{children}</div>
        </div>
    </dialog>;
}
