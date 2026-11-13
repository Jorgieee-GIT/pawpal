import { CircleHelp, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type SectionHeadingProps = {
    title: string;
    Icon: LucideIcon;
    eyebrow?: string;
    actions?: ReactNode;
};

/*
 * DOCU: Render a tab heading with its icon, optional eyebrow, and optional actions.
 * @param {SectionHeadingProps} props - Title, icon, eyebrow, and tab-specific actions
 * @returns {ReactNode} - The shared tab header
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export default function SectionHeading({ title, Icon, eyebrow, actions }: SectionHeadingProps) {
    return <header className="paw-section-heading">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <div className="paw-section-heading-row">
            <h2 className="paw-section-title">
                {title}
                <Icon size={23} strokeWidth={2.2} aria-hidden="true" />
            </h2>
            {actions && <div className="paw-section-actions">{actions}</div>}
        </div>
    </header>;
}

/*
 * DOCU: Render the shared Info button used to open a tab's guide dialog.
 * @param {{ onClick: () => void }} props - Callback that opens the guide
 * @returns {ReactNode} - The Info button
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function SectionInfoButton({ onClick }: { onClick: () => void }) {
    return <button type="button" className="paw-section-info" aria-haspopup="dialog" onClick={onClick}>
        <CircleHelp size={18} aria-hidden="true" /> Info
    </button>;
}
