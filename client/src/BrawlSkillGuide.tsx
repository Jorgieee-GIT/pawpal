import { Shield, Sparkles, Zap } from "lucide-react";
import "./BrawlSkillGuide.css";

type Skill = { name: string; description: string; cost: number; cooldown: number };
type SkillPet = {
    userId: string;
    username: string;
    petName: string;
    species: string;
    breed: string;
    specials?: Skill[];
    special?: Skill;
    passive?: { name?: string; description?: string };
};

export default function BrawlSkillGuide({ pets }: { pets: SkillPet[] }) {
    return <section className="paw-brawl-skill-guide" aria-label="Breed skill and passive explanations">
        <p className="paw-brawl-skill-intro">Every pet uses its own permanent breed's special skills. Each special consumes Focus and has its own cooldown; passive traits work separately.</p>
        <div className="paw-brawl-skill-guide-grid">
            {pets.map(pet => {
                const specials = pet.specials?.length ? pet.specials : pet.special ? [pet.special] : [];
                return <article className="paw-brawl-skill-guide-pet" key={pet.userId}>
                    <header><b>{pet.petName}</b><small>@{pet.username} · {pet.species} · {pet.breed.replaceAll("_", " ")}</small></header>
                    {specials.map((skill, index) => <div className="paw-brawl-skill-guide-move" key={`${index}-${skill.name}`}>
                        <div className="paw-brawl-skill-guide-name"><Sparkles size={16}/><b>Special {index + 1}: {skill.name}</b></div>
                        <p>{skill.description}</p>
                        <small><Zap size={12}/> {skill.cost} Focus · {skill.cooldown} rounds cooldown</small>
                    </div>)}
                    {specials.length === 0 && <p className="paw-brawl-skill-guide-empty">Special skill details are not available for this pet yet.</p>}
                    {pet.passive?.name && <div className="paw-brawl-skill-guide-move">
                        <div className="paw-brawl-skill-guide-name"><Shield size={16}/><b>Passive: {pet.passive.name}</b></div>
                        <p>{pet.passive.description || "This breed has a passive trait."}</p>
                    </div>}
                </article>;
            })}
        </div>
    </section>;
}
