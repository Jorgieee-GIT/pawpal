import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import "./BrawlGuideModal.css";

type Props = {
    title: string;
    subtitle?: string;
    children: ReactNode;
    onClose: () => void;
};

/** One consistent multiplayer information modal for Classic and Duo Clash. */
/*
 * DOCU: Render the brawl guide modal interface and provide its feature behavior.
 * @param {Props} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export default function BrawlGuideModal({ title, subtitle, children, onClose }: Props) {
    const headingId = useId();
    const closeRef = useRef<HTMLButtonElement | null>(null);
    const lastFocus = useRef<HTMLElement | null>(null);

    useEffect(() => {
        lastFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        closeRef.current?.focus();
        return () => {
            if (lastFocus.current?.isConnected) {
                lastFocus.current.focus();
            }
        };
    }, []);

    return <div className="paw-brawl-guide-overlay" onMouseDown={event => {if (event.target ===event.currentTarget) {onClose();}}}>
        <section
            className="paw-multi-dialog paw-brawl-guide-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            onKeyDown={event => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    onClose();
                }
            }}
        >
            <div className="paw-multi-dialog-header paw-brawl-guide-header">
                <div>
                    <h3 id={headingId}>{title}</h3>
                    {subtitle && <p className="paw-modal-subtitle">{subtitle}</p>}
                </div>
                <button ref={closeRef} type="button" className="paw-multi-dialog-close" aria-label={`Close ${title.toLowerCase()}`} onClick={onClose}>
                    <X size={19}/>
                </button>
            </div>
            <div className="paw-multi-dialog-body paw-brawl-guide-body">
                {children}
            </div>
        </section>
    </div>;
}
