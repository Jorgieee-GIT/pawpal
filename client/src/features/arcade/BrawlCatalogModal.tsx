import { useEffect, useRef, useState } from "react";
import { CircleHelp, Heart, Search, Shield, Sparkles, Swords, Users, X, Zap } from "lucide-react";

type CombatKit = {
    stats: {
        hp: number;
        attack: number;
        defense: number;
        speed: number;
    };
    special: {
        name: string;
        description: string;
        cost: number;
        cooldown: number;
    };
    specials?: Array<{
        name: string;
        description: string;
        cost: number;
        cooldown: number;
        trigger?: string;
        bonus?: string;
    }>;
    passive: {
        name: string;
        description: string;
    };
    progression: {
        unlockLevel: number;
        tier: string;
        grade: string;
    };
};

type CombatCatalog = {
    rules: {
        focusCap: number;
        shieldCap: number;
        roundSeconds: number;
        focusGain: number;
        strikeFocus: number;
        guardFocus: number;
        guardShield: number;
        repeatedGuardShield: number;
        basicShieldPiercePercent?: number;
        pressureStartsRound?: number;
        shieldDecayWhenNotGuarding?: number;
        maxRounds: number;
        shieldDurationRounds?: number;
    };
    kits: Record<string, Record<string, CombatKit>>;
};

type Props = {
    open: boolean;
    api: string;
    onClose: () => void;
};

const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase());

export default function BrawlCatalogModal({ open, api, onClose }: Props) {
    const [catalog, setCatalog] = useState<CombatCatalog | null>(null);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [species, setSpecies] = useState("all");
    const closeRef = useRef<HTMLButtonElement>(null);
    const closeCallback = useRef(onClose);
    closeCallback.current = onClose;

    useEffect(() => {
        if (!open) {
            return;
        }
        const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        closeRef.current?.focus();
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                closeCallback.current();
            }
        };
        window.addEventListener("keydown", onEscape);
        return () => {
            window.removeEventListener("keydown", onEscape);
            previous?.focus();
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }
        const controller = new AbortController();
        setError("");
        fetch(`${api}/api/multiplayer/rules`, { signal: controller.signal })
            .then(async response => {
                if (!response.ok) {
                    throw Error("Could not load the Paw Brawl guide.");
                }
                return await response.json() as CombatCatalog;
            })
            .then(result => {
                if (!controller.signal.aborted) {
                    setCatalog(result);
                }
            })
            .catch((reason: unknown) => {
                if (!controller.signal.aborted) {
                    setError(reason instanceof Error ? reason.message : "Could not load pet abilities.");
                }
            });
        return () => controller.abort();
    }, [api, open]);

    if (!open) {
        return null;
    }

    const speciesNames = catalog ? Object.keys(catalog.kits) : [];
    const term = search.trim().toLowerCase();
    const shownGroups = catalog ? Object.entries(catalog.kits)
        .filter(([name]) => species === "all" || name === species || !!term)
        .map(([name, breeds]) => ({
            name,
            breeds: Object.entries(breeds).filter(([breed, kit]) => {
                if (!term) {
                    return true;
                }
                return [name, label(breed), ...(kit.specials || [kit.special]).flatMap(skill => [skill.name, skill.description]),
                    kit.passive.name, kit.passive.description].join(" ").toLowerCase().includes(term);
            })
        }))
        .filter(group => group.breeds.length > 0) : [];
    const totalBreeds = catalog ? Object.values(catalog.kits).reduce((count, group) => count + Object.keys(group).length, 0) : 0;

    return <div className="paw-multi-dialog-backdrop paw-brawl-catalog-backdrop" onMouseDown={event => {
        if (event.target === event.currentTarget) {
            closeCallback.current();
        }
    }}>
        <section className="paw-multi-dialog paw-brawl-catalog-dialog" role="dialog" aria-modal="true" aria-labelledby="paw-brawl-catalog-title" aria-describedby="paw-brawl-catalog-subtitle">
            <div className="paw-multi-dialog-header">
                <div>
                    <h3 id="paw-brawl-catalog-title"><CircleHelp size={21} /> Paw Brawl Guide</h3>
                    <p className="paw-modal-subtitle" id="paw-brawl-catalog-subtitle">Every breed's two Focus specials and passive</p>
                </div>
                <button ref={closeRef} className="paw-multi-dialog-close" type="button" aria-label="Close Paw Brawl guide" onClick={() => closeCallback.current()}><X size={19} /></button>
            </div>
            <div className="paw-brawl-catalog-scroll">
                {error && !catalog ? <p className="paw-brawl-catalog-error" role="alert">{error}</p> : null}
                {!catalog && !error ? <p className="paw-brawl-catalog-loading" role="status">Loading server-defined pet abilities…</p> : null}
                {catalog && <>
                    <div className="paw-brawl-duo-guide" aria-label="Paw Brawl battle modes">
                        <h4><Users size={17}/> Choose your battle mode</h4>
                        <p><b>Classic 1v1:</b> Challenge one friend using the original battle, 30-second action timer, and original Paw Brawl rules.</p>
                        <p><b>Duo Clash 2v2:</b> Four friends, two teams, one permanent pet each. Everyone chooses secretly during a 40-second timer. Pick which enemy to attack; the pets act by Speed after all moves are locked.</p>
                        <p><b>Cover:</b> Protect your teammate. Half of their direct HP damage goes to you for this round. Free, 2-round cooldown. Poison and stun are not transferred.</p>
                        <p><b>Second Chance:</b> Revive a teammate knocked out the previous round. Costs 6 Focus, once per team, restores 20% HP, and is unavailable from round 11.</p>
                        <p><b>Support skills:</b> Some healing and Shield specials can target a teammate, giving 75% of their normal support strength. Both players keep their own Focus, Shield, HP and cooldowns.</p>
                        <p><b>Wagers:</b> Optional 0–100 Paw Coins per player. All four players accept by clicking Ready; all coins are reserved only when the match starts. Winners receive twice their stake; draws and invalid matches refund everyone.</p>
                        <p><b>Reconnect:</b> An interrupted match pauses briefly, with a 45-second reconnect grace. Two missed turns or leaving deliberately can forfeit the match for your team.</p>
                    </div>
                    <p className="paw-brawl-catalog-intro">Every pet has 2 special attacks and 1 passive. A special uses Focus (your energy). Its NORMAL EFFECT works when you use the move. Its EXTRA BONUS works only if the condition below is true. For example, a faster bunny adds damage, while a panda can turn its Shield into attack power. You can still use both skills even when the extra condition is not met.</p>
                    <div className="paw-brawl-guide-moves" aria-label="Easy battle vocabulary">
                        <div><Heart size={19} /><b>HP and Shield</b><small>HP is health: at 0 you lose. Shield blocks some damage but doesn't stop all of it. Shield goes away after {catalog.rules.shieldDurationRounds ?? 3} rounds, including the round it was created.</small></div>
                        <div><Zap size={19} /><b>Focus</b><small>Focus is energy for special moves. Paw Strike gives +1; the Focus move gives +3. You can hold at most {catalog.rules.focusCap}.</small></div>
                        <div><Shield size={19} /><b>Counter and Dodge</b><small>Counter 5 means "hit the attacker back for 5 damage." Dodge +20% means a better chance to avoid the next attack, not a guaranteed miss.</small></div>
                        <div><Sparkles size={19} /><b>Poison and Stun</b><small>Poison 5 for 2 rounds takes 5 HP each round and ignores Shield. Stun makes the enemy miss its next round, then gives it temporary stun protection.</small></div>
                    </div>
                    <div className="paw-brawl-guide-moves" aria-label="Basic battle actions">
                        <div><Swords size={19} /><b>Attack</b><small>Deal damage, pierce {catalog.rules.basicShieldPiercePercent ?? 40}% of Shield, and gain +{catalog.rules.strikeFocus} Focus (+1 extra with Stride).</small></div>
                        <div><Shield size={19} /><b>Guard</b><small>First Guard: +{catalog.rules.guardShield} Shield and +1 Focus. Second: +{catalog.rules.repeatedGuardShield} Shield, no Focus. Further Guards: neither. Shield expires after {catalog.rules.shieldDurationRounds ?? 3} rounds if it is not broken first. Breaking an ability-primed Shield can refund Focus.</small></div>
                        <div><Zap size={19} /><b>Focus</b><small>Gain {catalog.rules.focusGain} Focus (max {catalog.rules.focusCap}).</small></div>
                        <div><Sparkles size={19} /><b>2 Specials</b><small>Both cost Focus and have separate cooldowns; they can combo if you can afford both. Each ability has its own conditional bonus: for example, faster bunnies deal more damage and defensive pandas build Shield for Shield-powered attacks. Counters, critical hits, healing, poison and stuns have cooldowns. Pressure damage starts round {catalog.rules.pressureStartsRound ?? 11}.</small></div>
                    </div>
                    <p className="paw-brawl-catalog-count">{speciesNames.length} pet species · {totalBreeds} breeds · {totalBreeds * 2} named Focus specials · {catalog.rules.roundSeconds}-second turns · {catalog.rules.maxRounds} rounds maximum</p>
                    <div className="paw-brawl-catalog-controls">
                        <label className="paw-brawl-catalog-search">
                            <Search size={18} />
                            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search pets or skills" aria-label="Search pet breeds or abilities" />
                        </label>
                        <div className="paw-brawl-species-tabs" aria-label="Filter by pet species">
                            <button type="button" aria-pressed={species === "all"} className={species === "all" ? "active" : ""} onClick={() => { setSpecies("all"); setSearch(""); }}>All pets</button>
                            {speciesNames.map(name => <button type="button" key={name} className={species === name ? "active" : ""} aria-pressed={species === name} onClick={() => { setSpecies(name); setSearch(""); }}>{label(name)}</button>)}
                        </div>
                    </div>
                    {shownGroups.length ? shownGroups.map(group => <section className="paw-brawl-species-group" key={group.name} aria-label={`${label(group.name)} breeds`}>
                        <h4>{label(group.name)} <small>{group.breeds.length} breeds</small></h4>
                        <div className="paw-brawl-kits-grid">
                            {group.breeds.map(([breed, kit]) => <article className="paw-brawl-kit-card" key={`${group.name}-${breed}`}>
                                <div className="paw-brawl-kit-heading">
                                    <b>{label(breed)}</b>
                                    <small>{kit.progression.grade} · {kit.progression.unlockLevel ? `Level ${kit.progression.unlockLevel}` : "Starter"}</small>
                                </div>
                                <div className="paw-brawl-kit-stats">
                                    <span><Heart size={13} /> HP {kit.stats.hp}</span>
                                    <span><Swords size={13} /> ATK {kit.stats.attack}</span>
                                    <span><Shield size={13} /> DEF {kit.stats.defense}</span>
                                    <span><Zap size={13} /> SPD {kit.stats.speed}</span>
                                </div>
                                {(kit.specials || [kit.special]).map((skill, skillIndex) => <div className="paw-brawl-kit-ability" key={skill.name}>
                                    <b><Sparkles size={15} /> {skillIndex === 0 ? "Special 1" : "Special 2"}: {skill.name}</b>
                                    <small>{skill.cost} Focus, {skill.cooldown} rounds</small>
                                    <p>{skill.description}</p>
                                </div>)}
                                <div className="paw-brawl-kit-ability passive">
                                    <b><Shield size={15} /> {kit.passive.name}</b>
                                    <p>{kit.passive.description}</p>
                                </div>
                            </article>)}
                        </div>
                    </section>) : <p className="paw-brawl-catalog-empty">No pets or skills matched your search.</p>}
                </>}
            </div>
        </section>
    </div>;
}
