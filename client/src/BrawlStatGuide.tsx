import {
    AlertTriangle,
    ArrowDown,
    CheckCircle2,
    Droplets,
    Eye,
    HeartPulse,
    RotateCcw,
    Shield,
    ShieldCheck,
    Swords,
    Zap
} from "lucide-react";
import "./BrawlStatGuide.css";

// Keep these explanations aligned with the badges rendered by BrawlStatusBadges.
const effects = [
    { icon: Droplets, name: "Poison", sample: "−5 · 2 rounds", description: "Loses the shown HP at each round's end for the shown number of rounds. Poison bypasses Shield." },
    { icon: RotateCcw, name: "Counter", sample: "5", description: "Counter ready: returns the shown damage once when the pet is attacked." },
    { icon: Eye, name: "Dodge boost", sample: "+20%", description: "Adds a chance to avoid the next incoming attack. An increased chance is not a guaranteed dodge." },
    { icon: Swords, name: "Power charge", sample: "+5", description: "The next damaging attack receives the shown bonus damage." },
    { icon: AlertTriangle, name: "Stun", sample: "1 round", description: "Prevents the pet from choosing an action when the stun takes effect in the following round." },
    { icon: ShieldCheck, name: "Stun protection", sample: "1 round", description: "The pet cannot be stunned again while this protection is active." },
    { icon: Shield, name: "Shield", sample: "16 · 3 rounds", description: "Temporarily absorbs some damage. The amount and remaining rounds are displayed; some damage can pierce it." },
    { icon: Zap, name: "Shield-break refund", sample: "+2 Focus", description: "Restores the shown Focus only if the Shield breaks from damage before it expires." },
    { icon: ArrowDown, name: "Weakened", sample: "−5", description: "The next attack deals the shown amount less damage." },
    { icon: ShieldCheck, name: "Prepared dodge", sample: "10 Shield", description: "A conditional defense: if the enemy Guards or Focuses, it can turn into Shield instead." },
    { icon: Droplets, name: "Guard fatigue", sample: "1 / 2", description: "Repeated Guards give less Shield and Focus, then none, until the pet chooses another action." },
    { icon: ShieldCheck, name: "Cover cooldown", sample: "CD · 2 rounds", description: "Shows when Cover Teammate can be used again in Duo Clash." },
    { icon: HeartPulse, name: "Last Stand used", sample: "Used", description: "The pet's one-time Last Stand passive has already activated in this match." },
    { icon: CheckCircle2, name: "No effects", sample: "Clear", description: "There are currently no temporary status effects on this pet." }
];

export default function BrawlStatGuide() {
    return <section className="paw-brawl-stat-guide" aria-label="Combat status effect explanations">
        <p className="paw-brawl-effects-intro">These are the status icons beside each pet's HP, Shield and Focus. The small number in a badge's corner shows how many rounds remain; the larger number shows damage, protection or a bonus.</p>
        <div className="paw-brawl-stat-guide-grid">
            {effects.map(item => <div className="paw-brawl-stat-guide-entry" key={item.name}>
                <item.icon size={19} aria-hidden="true" />
                <div><b>{item.name}</b><small>{item.sample}</small><p>{item.description}</p></div>
            </div>)}
        </div>
        <small>Floating combat numbers show the effect applied to a pet when its action resolves. Breed skills and passives have their own separate Skills guide.</small>
    </section>;
}
