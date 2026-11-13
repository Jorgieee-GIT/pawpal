import type { LucideIcon } from "lucide-react";

/*
 * DOCU: Render the section heading interface and provide its feature behavior.
 * @param {{
    title: string;
    Icon: LucideIcon
}} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export default function SectionHeading({ title, Icon }: {
    title: string;
    Icon: LucideIcon
}) {
    return <h2 className="paw-section-title">
        {title}
        <Icon size={23} strokeWidth={2.2} aria-hidden="true" />
    </h2>;
}
