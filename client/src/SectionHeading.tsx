import type {LucideIcon} from 'lucide-react';

export default function SectionHeading({title,Icon}:{title:string;Icon:LucideIcon}) {
    return <h2 className="paw-section-title">{title}<Icon size={23} strokeWidth={2.2} aria-hidden="true"/></h2>;
}
