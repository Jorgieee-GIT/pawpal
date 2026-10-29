import {GardenIcon, GARDEN_FLOWER_CATALOG} from './GardenArt';
import RoomArchitecture from './RoomArchitecture';
import {useEffect, useRef, useState} from 'react';
import {ArrowLeft, Eye, LockKeyhole, LogOut, ShieldCheck, BrainCircuit, Sprout, Rabbit, Heart, RefreshCw} from 'lucide-react';
import PetArt from './PetArt';
import {DEFAULTS, FURNITURE, FurnitureArt, RoomFurniture, furnitureLayout} from './RoomFurniture';
import {FoodArt, FOOD_ART_IDS} from './Kitchen';
import {COSMETIC_SLOTS, SLOT_NAMES, type OutfitSlot} from './outfitCatalog';
import {MoleArt} from './WhackAMole';
import {ENVELOPE_DESIGNS, EnvelopeArtwork} from './PawMailArt';
import { BUILDING_ART, CACTUS_ART, VEHICLE_ART, ClawGrabberArt, JumpGuide, MEMORY_HEARTS, MemoryHeart, PaintPalette, TargetHeart, PAW_COLOR_PALETTE, MoleGameIcon, ClawMenuIcon, arcadeSpriteSrc } from './ArcadeArt';
import './Develop.css';
import './AdminShared.css';

const API = import.meta.env.VITE_API_URL || '';
const SPECIES = ['cat', 'dog', 'bunny', 'fox', 'hamster', 'panda', 'penguin', 'axolotl'];
const ROOMS = ['all', 'living', 'bedroom', 'studio', 'sports'];
const BREEDS: Record<string, string[]> = {"cat": ["calico", "tabby", "tuxedo", "fluffy"], "dog": ["golden", "dalmatian", "husky", "corgi"], "bunny": ["lop", "dutch", "angora", "spotted"], "fox": ["red_fox", "arctic_fox", "fennec", "silver_fox"], "hamster": ["syrian", "dwarf", "roborovski", "banded"], "panda": ["giant_panda", "red_panda", "snow_panda", "baby_panda"], "penguin": ["emperor", "adelie", "gentoo", "chinstrap"], "axolotl": ["leucistic", "wild_type", "melanoid", "golden_albino"]};
const UNLOCKABLE_BREEDS: Record<string, string[]> = {
    cat: ['siamese', 'british_shorthair', 'maine_coon', 'eurasian_lynx', 'snow_leopard', 'smilodon'],
    dog: ['beagle', 'shiba', 'border_collie', 'gray_wolf', 'african_wild_dog', 'dire_wolf'],
    bunny: ['lionhead', 'rex', 'himalayan', 'pygmy_rabbit', 'volcano_rabbit', 'nuralagus'],
    fox: ['cross_fox', 'marble_fox', 'bat_eared_fox', 'kit_fox', 'swift_fox', 'island_fox'],
    hamster: ['winter_white', 'chinese_hamster', 'teddy_bear', 'campbells_dwarf', 'european_hamster', 'brandts_hamster'],
    panda: ['qinling_panda', 'brown_panda', 'red_panda_cub', 'grizzly_bear', 'polar_bear', 'short_faced_bear'],
    penguin: ['rockhopper', 'little_blue', 'macaroni', 'african_penguin', 'king_penguin', 'waitaha_penguin'],
    axolotl: ['copper', 'piebald', 'mosaic', 'tiger_salamander', 'andersons_salamander', 'ambystoma_dumerilii']
};
const ROOM_THEMES: Record<string, [string, string, string]> = {blush:['#ffeaf0','#f6d5cc','#bc6482'],lavender_room:['#f0e9ff','#e3d5ed','#8966b1'],mint_room:['#e9faf0','#d2eadc','#4d9275'],night_room:['#dcd6ed','#b7a5c8','#655383'],strawberry_milk:['#ffe1eb','#f4c2cb','#c95379'],lavender_dream:['#eee4ff','#d6c4ed','#7753ad'],mint_garden:['#dff9ed','#bde7d3','#34866f'],blueberry_sky:['#e3edff','#b9cdec','#5579bc'],honey_cottage:['#fff2ce','#e8cd96','#aa7631'],peach_blossom:['#ffe8dd','#f4c6b8','#c77460'],moonlight:['#dce0f5','#a7acd5','#4e588d'],sage_forest:['#e6eee0','#c0d3b4','#617f56'],aurora_prism:['#e9e5fa','#cfc8ed','#8b7bbf'],cosmic_nebula:['#e7e4f5','#c9c1e3','#8272af'],crystal_lagoon:['#ddf2ef','#b6dcd8','#4d9c9a'],solar_eclipse:['#f9e7d8','#e9c6b6','#c48a77'],celestial_opal:['#f5e9f2','#e3d2e9','#a87fae']};
const ROOM_THEME_NAMES: Record<string, string> = {blush:'Cozy Blush',lavender_room:'Lavender Room',mint_room:'Mint Room',night_room:'Night Room',strawberry_milk:'Strawberry Milk',lavender_dream:'Lavender Dream',mint_garden:'Mint Garden',blueberry_sky:'Blueberry Sky',honey_cottage:'Honey Cottage',peach_blossom:'Peach Blossom',moonlight:'Moonlight',sage_forest:'Sage Forest',aurora_prism:'Aurora Prism',cosmic_nebula:'Cosmic Nebula',crystal_lagoon:'Crystal Lagoon',solar_eclipse:'Solar Eclipse',celestial_opal:'Celestial Opal'};

type BrawlKitPreview = {
    special: {name: string; description: string; cost: number; cooldown: number; kind: string; strength: number};
    passive: {name: string; description: string; kind: string; strength: number};
    stats: {hp: number; attack: number; defense: number; speed: number};
    progression: {rank: number; unlockLevel: number; tier: string; grade: string; bonus: {hp: number; attack: number; defense: number; speed: number}};
};
type BrawlCatalog = {
    rules: {focusCap: number; shieldCap: number; roundSeconds: number; maxRounds: number; strikeFocus: number; guardFocus: number; focusGain: number; guardShield: number; repeatedGuardShield: number; exhaustedGuardShield: number};
    speciesStats: Record<string, [number, number, number, number]>;
    kits: Record<string, Record<string, BrawlKitPreview>>;
};
const ACCESSORIES = Object.entries(COSMETIC_SLOTS);
const GARDEN_VARIANTS = [0, 1, 2, 3] as const;
const PET_COLORS = ['classic', 'pink', 'cream', 'gray', 'orange', 'black', 'lavender', 'mint'] as const;
const titleCase = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

export default function Develop() {
    const [token, setToken] = useState(() => sessionStorage.getItem('pawpal-admin-token') || '');
    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(Boolean(token));
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [section, setSection] = useState<'species' | 'breeds' | 'accessories' | 'furniture' | 'atmosphere' | 'food' | 'arcade' | 'combat' | 'garden' | 'pawmail'>('species');
    const [room, setRoom] = useState('all');
    const [atmosphereRoom, setAtmosphereRoom] = useState('living');
    const [atmosphereTheme, setAtmosphereTheme] = useState('blush');
    const [filter, setFilter] = useState('');
    const [mailSearch, setMailSearch] = useState('');
    const [mailGroup, setMailGroup] = useState<'all' | 'starter' | 'unlockable'>('all');
    const [previewSpecies, setPreviewSpecies] = useState('cat');
    const [brawlCatalog, setBrawlCatalog] = useState<BrawlCatalog | null>(null);
    const [brawlRulesError, setBrawlRulesError] = useState('');
    const [brawlRulesLoading, setBrawlRulesLoading] = useState(false);
    const [brawlRulesRefresh, setBrawlRulesRefresh] = useState(0);

    const [previewColor, setPreviewColor] = useState('classic');
    const [accessorySlot, setAccessorySlot] = useState('all');
    const galleryRef = useRef<HTMLElement>(null);
    const [svgHealth, setSvgHealth] = useState<{checked: number; issues: number}>({checked: 0, issues: 0});
    const [checkVersion, setCheckVersion] = useState(0);

    // The server powers both live battles and this read-only ability reference.
    // There is no duplicate list of skills/passives in the Develop frontend.
    useEffect(() => {
        if (!authorized || section !== 'combat') return;
        const controller = new AbortController();
        setBrawlRulesLoading(true);
        setBrawlRulesError('');
        fetch(`${API}/api/multiplayer/rules`, {signal: controller.signal})
            .then(async response => {
                if (!response.ok) throw new Error(`Server returned ${response.status}`);
                return await response.json() as BrawlCatalog;
            })
            .then(catalog => {
                if (!catalog?.kits || !catalog.rules || !catalog.speciesStats) throw new Error('Invalid battle rules response.');
                setBrawlCatalog(catalog);
            })
            .catch(error => {
                if (!controller.signal.aborted) {
                    setBrawlCatalog(null);
                    setBrawlRulesError(error instanceof Error ? error.message : 'Could not load battle rules.');
                }
            })
            .finally(() => {if (!controller.signal.aborted) setBrawlRulesLoading(false)});
        return () => controller.abort();
    }, [authorized, section, brawlRulesRefresh]);

    // Read-only DOM sanity test of the *actual rendered* gallery illustrations.
    // Helps catch missing SVG markup, zero-size elements and failed SVG image loads.
    // This is not a pixel-by-pixel visual test: inspect artwork with your eyes too.
    useEffect(() => {
        if (!authorized) return;
        const gallery = galleryRef.current;
        if (!gallery) return;
        const runCheck = () => {
            let checked = 0;
            let issues = 0;
            gallery.querySelectorAll<HTMLElement>(
                '.develop-pet-art, .develop-furniture-art, .develop-combat-art, .develop-garden-art, .develop-mail-art'
            ).forEach(holder => {
                checked++;
                const svg = holder.querySelector('svg');
                const image = holder.querySelector('img');
                const shape = svg?.querySelector('path, circle, ellipse, rect, polygon, polyline, line, text, image, use');
                const rect = (svg || image)?.getBoundingClientRect();
                const hasSize = !!rect && rect.width > 1 && rect.height > 1;
                const hasSvgMarkup = !!svg && !!shape && (
                    !!svg.getAttribute('viewBox') || (!!svg.getAttribute('width') && !!svg.getAttribute('height'))
                );
                const hasSvgImage = !!image && image.src.startsWith('data:image/svg+xml') &&
                    (!image.complete || image.naturalWidth > 0);
                const invalid = !hasSize || !(hasSvgMarkup || hasSvgImage);
                const card = holder.closest<HTMLElement>('.develop-tile, .develop-garden-card, .develop-combat-card, .develop-mail-card');
                card?.classList.toggle('develop-svg-issue', invalid);
                if (invalid) issues++;
            });
            setSvgHealth(previous => previous.checked === checked && previous.issues === issues
                ? previous : {checked, issues});
        };
        const frame = window.requestAnimationFrame(runCheck);
        // Data-URI SVGs used by the arcade decode asynchronously on some browsers.
        const retry = window.setTimeout(runCheck, 350);
        gallery.addEventListener('load', runCheck, true);
        gallery.addEventListener('error', runCheck, true);
        return () => {
            window.cancelAnimationFrame(frame);
            window.clearTimeout(retry);
            gallery.removeEventListener('load', runCheck, true);
            gallery.removeEventListener('error', runCheck, true);
        };
    }, [authorized, section, room, atmosphereRoom, atmosphereTheme, previewSpecies, previewColor, accessorySlot, filter, mailSearch, mailGroup, checkVersion]);

    useEffect(() => {
        let active = true;
        if (!token) {
            setAuthorized(false);
            setChecking(false);
            return;
        }
        setChecking(true);
        fetch(API + '/api/admin/develop-access', {
            headers: {Authorization: 'Bearer ' + token}
        }).then(response => {
            if (!response.ok) throw new Error('Admin session expired. Sign in again.');
            if (active) {
                setAuthorized(true);
                setError('');
            }
        }).catch((reason: Error) => {
            if (!active) return;
            sessionStorage.removeItem('pawpal-admin-token');
            setToken('');
            setAuthorized(false);
            setError(reason.message);
        }).finally(() => {
            if (active) setChecking(false);
        });
        return () => { active = false; };
    }, [token]);

    async function signIn(event: React.FormEvent) {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
            const response = await fetch(API + '/api/admin/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, password})
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Admin login failed.');
            sessionStorage.setItem('pawpal-admin-token', result.token);
            setPassword('');
            setToken(result.token);
        } catch (reason) {
            setError((reason as Error).message);
        } finally {
            setBusy(false);
        }
    }

    function signOut() {
        sessionStorage.removeItem('pawpal-admin-token');
        setToken('');
        setAuthorized(false);
    }

    const furniture = Object.entries(FURNITURE).filter(([id, item]) =>
        (room === 'all' || item.room === room) &&
        (item.name + ' ' + id).toLowerCase().includes(filter.toLowerCase())
    );

    return <div className="develop-page">
        <header className="develop-header paw-admin-header">
            <div className="develop-brand"><span className="paw-admin-brand-icon"><ShieldCheck size={22}/></span><span><b>PawPal Admin</b><small>Administration workspace</small></span></div>
            <div className="develop-header-actions">
                {authorized && <span className="paw-admin-welcome">Welcome, Jorge Jose</span>}
                <a href="/admin"><ArrowLeft size={16}/> Admin dashboard</a>
                {authorized && <button type="button" onClick={signOut}><LogOut size={16}/> Sign out</button>}
            </div>
        </header>
        {checking ? <main className="develop-message"><LockKeyhole size={30}/><h2>Verifying administrator session…</h2></main> : !authorized ?
            <main className="develop-login">
                <LockKeyhole size={34}/>
                <h1>Administrator access required</h1>
                <p>Sign in with the same administrator credentials used for /admin. Regular player accounts cannot access this gallery.</p>
                <form onSubmit={signIn}>
                    <label>Admin username<input required autoComplete="username" value={username} onChange={event => setUsername(event.target.value)}/></label>
                    <label>Admin password<input required type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)}/></label>
                    <button disabled={busy}>{busy ? 'Signing in…' : 'Unlock gallery'}</button>
                </form>
                {error && <p role="alert" className="develop-error">{error}</p>}
            </main> :
            <main className="develop-content" ref={galleryRef}>
                <div className="develop-intro paw-admin-intro"><div><span className="paw-admin-eyebrow">DEVELOPER GALLERY</span><h1>Artwork inspection</h1><p>These are the real in-game SVG components. Nothing here adopts a pet, buys furniture, or changes player data.</p></div></div>
                <div className={`develop-svg-health ${svgHealth.issues ? 'has-issues' : ''}`} role="status" aria-live="polite">
                    <div><b>SVG preview health</b><span>{svgHealth.checked} artwork previews inspected · {svgHealth.issues ? `${svgHealth.issues} need attention` : 'No basic SVG markup or loading problems detected'}</span></div>
                    <button type="button" onClick={() => setCheckVersion(value => value + 1)}><RefreshCw size={15}/> Recheck</button>
                </div>
                <p className="develop-hint">Each preview below renders the same artwork component (or SVG data document) as the player website. A red outline flags a missing/failed SVG or zero-size preview. This automated check cannot detect every visual defect, so inspect the previews as well.</p>
                <div className="develop-tabs" role="group" aria-label="Gallery section">
                    {([
                        ['species', 'Species'],
                        ['breeds', 'All breeds'],
                        ['accessories', 'Outfits & accessories'],
                        ['furniture', 'Furniture'],
                        ['atmosphere', 'Atmosphere'],
                        ['food', 'Food & ingredients'],
                        ['garden', 'Garden'],
                        ['arcade', 'Arcade artwork'],
                        ['pawmail', 'PawMail'],
                        ['combat', 'Battle abilities']
                    ] as const).map(([id, label]) => (
                        <button key={id} type="button" className={section === id ? 'active' : ''} onClick={() => setSection(id)}>{label}</button>
                    ))}
                </div>
                {section === 'garden' && <section className="develop-garden">
                    <p className="develop-hint">All five garden flowers below use the exact same SVG component as the player Garden and Flower Info catalog. This gallery is read-only; rewards and growth rules are controlled by the backend.</p>
                    <h2>Flower artwork, rarity and harvest rewards</h2>
                    <div className="develop-garden-grid">
                        {GARDEN_FLOWER_CATALOG.map(flower => <article className={`develop-garden-card develop-garden-${flower.rarity.toLowerCase()}`} key={flower.rarity}>
                            <div className="develop-garden-art"><GardenIcon kind="flower" rarity={flower.rarity} stage={0}/></div>
                            <h3>{flower.name}</h3>
                            <span className="develop-garden-rarity">{flower.rarity}</span>
                            <div className="develop-garden-meta"><b>{flower.min}–{flower.max} Paw Coins</b><small>Harvest reward</small></div>
                            <small>{flower.chance}% chance per planted seed</small>
                        </article>)}
                    </div>
                    <h2>Every in-game flower variant (0–3)</h2>
                    <p className="develop-hint">The server randomly selects one of four variants at planting. The player Garden passes the same rarity and variant properties shown below.</p>
                    <div className="develop-garden-grid">
                        {GARDEN_FLOWER_CATALOG.flatMap(flower => GARDEN_VARIANTS.map(variant =>
                            <article className={`develop-garden-card develop-garden-${flower.rarity.toLowerCase()}`} key={`${flower.rarity}-${variant}`}>
                                <div className="develop-garden-art"><GardenIcon kind="flower" rarity={flower.rarity} variant={variant} stage={0}/></div>
                                <h3>{flower.name}</h3>
                                <small>{flower.rarity} · Variant {variant + 1}</small>
                            </article>
                        ))}
                    </div>
                    <h2>Other garden SVGs</h2>
                    <div className="develop-garden-grid develop-garden-utilities">
                        {([['seed', 'Seed packet'], ['water', 'Watering can'], ['soil', 'Empty plot']] as const).map(([kind, label]) => <article className="develop-garden-card" key={kind}>
                            <div className="develop-garden-art"><GardenIcon kind={kind}/></div>
                            <h3>{label}</h3>
                            <small>Original artwork used in the player Garden</small>
                        </article>)}
                    </div>
                    <h2>Growth-stage SVG preview</h2>
                    <div className="develop-garden-grid develop-garden-utilities">
                        {([['Blooming', 0], ['Growing', .45], ['Sprout', .85]] as const).map(([label, stage]) => <article className="develop-garden-card" key={label}>
                            <div className="develop-garden-art"><GardenIcon kind="flower" rarity="Common" stage={stage}/></div>
                            <h3>{label}</h3>
                            <small>Actual Common SVG · growth value {stage}</small>
                        </article>)}
                    </div>
                </section>}
                {section === 'combat' && <section className="develop-combat">
                    <p className="develop-hint">This gallery loads the <b>same live battle definitions</b> used by the Express server. Each of PawPal's 88 species/breed combinations has its own named special skill and passive. Later unlocks receive modest, increasing stat bonuses; early breeds stay competitive through their own skills and passives.</p>
                    <div className="develop-filters">
                        <button type="button" onClick={() => setBrawlRulesRefresh(value => value + 1)} disabled={brawlRulesLoading}>Refresh server battle rules</button>
                        {brawlCatalog && <small>Live rules · {Object.values(brawlCatalog.kits).reduce((total, breeds) => total + Object.keys(breeds).length, 0)} breed kits · {brawlCatalog.rules.focusCap} max Focus</small>}
                    </div>
                    {brawlRulesLoading && <p className="develop-hint">Loading the current Paw Brawl rules…</p>}
                    {brawlRulesError && <p className="develop-hint" role="alert">Could not load the live battle abilities: {brawlRulesError}. Confirm the backend is updated and running, then click Refresh. No placeholder skills are shown.</p>}
                    {brawlCatalog && <>
                        <h2>Species base stats</h2>
                        <div className="develop-combat-grid">{SPECIES.map(species => {
                            const [hp, attack, defense, speed] = brawlCatalog.speciesStats[species];
                            return <article key={species} className="develop-combat-card">
                                <div className="develop-combat-art"><PetArt species={species} color={previewColor}/></div><h3>{titleCase(species)}</h3>
                                <div className="develop-combat-stats"><span>HP {hp}</span><span>ATK {attack}</span><span>DEF {defense}</span><span>SPD {speed}</span></div>
                                <small>Dodge {Math.round(Math.min(.15, Math.max(.03, speed * .006)) * 100)}% before passives.</small>
                            </article>;
                        })}</div>
                        <h2>Breed specials & passives</h2>
                        <div className="develop-filters"><label>Choose species<select value={previewSpecies} onChange={event => setPreviewSpecies(event.target.value)}>{SPECIES.map(name => <option key={name} value={name}>{titleCase(name)}</option>)}</select></label></div>
                        <div className="develop-combat-grid">{Object.entries(brawlCatalog.kits[previewSpecies] || {}).map(([breed, combat]) => <article key={breed} className="develop-combat-card">
                            <div className="develop-combat-art"><PetArt species={previewSpecies} breed={breed} color={previewColor}/></div>
                            <h3>{titleCase(breed)}</h3>
                            <p><b>Breed Grade: {combat.progression.grade} · {combat.progression.tier} category</b><small>{combat.progression.rank === 0 ? 'Classic starter' : `Unlocks at player level ${combat.progression.unlockLevel}`} · Progression bonus: +{combat.progression.bonus.hp} HP · +{combat.progression.bonus.attack} ATK · +{combat.progression.bonus.defense} DEF · +{combat.progression.bonus.speed} SPD</small></p>
                            <div className="develop-combat-stats"><span>HP {combat.stats.hp}</span><span>ATK {combat.stats.attack}</span><span>DEF {combat.stats.defense}</span><span>SPD {combat.stats.speed}</span></div>
                            <div className="develop-combat-stats"><span>Special cost {combat.special.cost} Focus</span><span>Cooldown {Math.max(1, combat.special.cooldown - (combat.passive.kind === 'quickreset' ? 1 : 0))} actions</span></div>
                            <p><b>Special: {combat.special.name}</b><small>{combat.special.description}</small></p>
                            <p><b>Passive: {combat.passive.name}</b><small>{combat.passive.description}</small></p>
                            <small>Dodge {Math.round(Math.min(.15, Math.max(.03, combat.stats.speed * .006)) * 100)}% base</small>
                        </article>)}</div>
                        <h2>Breed progression & balance</h2>
                        <div className="develop-combat-moves">
                            <p><b>Shop-aligned progression:</b> Grades run from Origin through Rookie, Rising, Adept, Veteran, Prime, Prestige, Elite, Mythic, Celestial, and Apex. These are breed grades, not player levels; unlock requirements still use account levels 5, 10, 15, …, 50. Higher ranks gradually gain up to +10 HP, +1 ATK and +1 DEF (no extra SPD); their unique special and passive are unchanged.</p>
                            <p><b>Fair competition:</b> The stat edge is deliberately small. A well-played starter can still win using dodge chances, Guard/Focus choices, unique abilities and the 18-round limit. No automatic winning or rank-based damage multiplier.</p>
                        </div>
                        <h2>Shared battle moves</h2>
                        <div className="develop-combat-moves">
                            <p><b>Focus / stamina:</b> {brawlCatalog.rules.focusCap} maximum. All breed specials cost 3–7 Focus, depending on the breed. Special cooldowns are counted in actions.</p>
                            <p><b>Paw Strike:</b> base damage = max(8, ATK + 7 − floor(opponent DEF / 2)). No standard Focus gain; the Stride passive is an exception.</p>
                            <p><b>Guard fatigue:</b> first consecutive Guard gains up to {brawlCatalog.rules.guardShield} Shield, second up to {brawlCatalog.rules.repeatedGuardShield}, third and later {brawlCatalog.rules.exhaustedGuardShield}. Switching to any other move resets the chain. Guardboost passives add extra Shield on the first two Guards. Maximum {brawlCatalog.rules.shieldCap} Shield; guarding does not give Focus.</p>
                            <p><b>Focus:</b> +{brawlCatalog.rules.focusGain} Focus (unless capped). Focus is the normal way to charge specials; breed passives/specials can grant bonus Focus.</p>
                            <p><b>Combat:</b> both players pick secretly. Faster pets resolve first. After both choose or the {brawlCatalog.rules.roundSeconds}-second timer expires, only selected moves resolve; missing selections are skipped. Maximum {brawlCatalog.rules.maxRounds} rounds.</p>
                        </div>
                    </>}
                </section>}
                {section === 'atmosphere' && <section className="develop-atmosphere">
                    <p className="develop-hint">Preview all {Object.keys(ROOM_THEME_NAMES).length} room atmospheres with the starter furniture supplied to new accounts. This is a read-only preview; even locked themes can be inspected here.</p>
                    <div className="develop-filters">
                        <label>Room
                            <select value={atmosphereRoom} onChange={event => setAtmosphereRoom(event.target.value)}>
                                {ROOMS.filter(id => id !== 'all').map(id => <option key={id} value={id}>{titleCase(id === 'living' ? 'living_room' : id === 'studio' ? 'creative_studio' : id === 'sports' ? 'sports_room' : id)}</option>)}
                            </select>
                        </label>
                        <label>Atmosphere
                            <select value={atmosphereTheme} onChange={event => setAtmosphereTheme(event.target.value)}>
                                {Object.entries(ROOM_THEME_NAMES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                            </select>
                        </label>
                    </div>
                    <div className={'develop-room-scene living-room paw-themed-room paw-theme-' + atmosphereTheme + ' paw-room-' + atmosphereRoom}
                        style={{'--wall': ROOM_THEMES[atmosphereTheme][0], '--floor': ROOM_THEMES[atmosphereTheme][1], '--room-accent': ROOM_THEMES[atmosphereTheme][2]} as React.CSSProperties}>
                        <div className="window" aria-hidden="true"/>
                        <div className="wall-art" aria-hidden="true">♡</div>
                        <RoomArchitecture room={atmosphereRoom}/><RoomFurniture room={atmosphereRoom} layout={furnitureLayout(atmosphereRoom)} editing={false} selected={null} onSelect={() => {}} onMove={() => {}}/>
                    </div>
                    <div className="develop-atmosphere-name"><b>{ROOM_THEME_NAMES[atmosphereTheme]}</b><span>{titleCase(atmosphereRoom)} · Default starter furniture</span></div>
                    <div className="develop-theme-list" aria-label="Choose an atmosphere">
                        {Object.entries(ROOM_THEME_NAMES).map(([id, name]) => <button key={id} type="button" className={atmosphereTheme === id ? 'selected' : ''} onClick={() => setAtmosphereTheme(id)}>
                            <span className="develop-theme-colors" style={{background: `linear-gradient(155deg, ${ROOM_THEMES[id][0]} 55%, ${ROOM_THEMES[id][1]} 55%)`, borderColor: ROOM_THEMES[id][2]}}/>
                            <span>{name}</span>
                        </button>)}
                    </div>
                </section>}
                {section === 'species' && <>
                    <div className="develop-filters"><label>Fur color<select value={previewColor} onChange={event => setPreviewColor(event.target.value)}>{PET_COLORS.map(color => <option key={color} value={color}>{titleCase(color)}</option>)}</select></label></div>
                    <p className="develop-hint">All eight species, rendered using the real in-game pet component and selected in-game fur color.</p>
                    <div className="develop-grid develop-pets">
                        {SPECIES.map(name => <article key={name} className="develop-tile">
                            <div className="develop-pet-art"><PetArt species={name} color={previewColor}/></div>
                            <b>{titleCase(name)}</b><small>Classic appearance</small>
                        </article>)}
                    </div>
                </>}
                {section === 'breeds' && <>
                    <div className="develop-filters"><label>Species
                        <select value={previewSpecies} onChange={event => setPreviewSpecies(event.target.value)}>
                            {SPECIES.map(name => <option key={name} value={name}>{titleCase(name)}</option>)}
                        </select>
                    </label></div>
                    <div className="develop-filters"><label>Fur color<select value={previewColor} onChange={event => setPreviewColor(event.target.value)}>{PET_COLORS.map(color => <option key={color} value={color}>{titleCase(color)}</option>)}</select></label></div>
                    <p className="develop-hint">Compare all 11 appearances for {titleCase(previewSpecies)} side by side. Each named breed now has distinct markings, facial details, or silhouette accents in addition to its fur palette. Previewing does not unlock or adopt anything.</p>
                    <div className="develop-grid develop-pets">
                        {['classic', ...BREEDS[previewSpecies], ...UNLOCKABLE_BREEDS[previewSpecies]].map(breed => <article key={breed} className="develop-tile">
                            <div className="develop-pet-art"><PetArt species={previewSpecies} breed={breed} color={previewColor}/></div>
                            <b>{titleCase(breed)}</b><small>{breed === 'classic' ? 'Free · Default' : `Unlocks at Level ${(['classic', ...BREEDS[previewSpecies], ...UNLOCKABLE_BREEDS[previewSpecies]].indexOf(breed)) * 5}`}</small>
                        </article>)}
                    </div>
                </>}
                {section === 'accessories' && <>
                    <div className="develop-filters">
                        <label>Preview on species<select value={previewSpecies} onChange={event => setPreviewSpecies(event.target.value)}>
                            {SPECIES.map(name => <option key={name} value={name}>{titleCase(name)}</option>)}
                        </select></label>
                        <label>Fur color<select value={previewColor} onChange={event => setPreviewColor(event.target.value)}>{PET_COLORS.map(color => <option key={color} value={color}>{titleCase(color)}</option>)}</select></label>
                        <label>Slot<select value={accessorySlot} onChange={event => setAccessorySlot(event.target.value)}>
                            <option value="all">All slots</option>
                            {SLOT_NAMES.map(slot => <option key={slot} value={slot}>{titleCase(slot)}</option>)}
                        </select></label>
                        <label>Search<input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Accessory name"/></label>
                    </div>
                    <p className="develop-hint">Preview each real wardrobe item equipped on a pet. Some items are species-specific; these previews use the selected species.</p>
                    <div className="develop-grid develop-pets">
                        {ACCESSORIES.filter(([id, slot]) => (accessorySlot === 'all' || slot === accessorySlot) && id.includes(filter.toLowerCase())).map(([id, slot]) => {
                            const outfit = {head: null, eyes: null, neck: null, clothes: null} as Record<OutfitSlot, string | null>;
                            outfit[slot] = id;
                            return <article key={id} className="develop-tile">
                                <div className="develop-pet-art"><PetArt species={previewSpecies} color={previewColor} cosmetic="none" outfit={outfit}/></div>
                                <b>{titleCase(id)}</b><small>{titleCase(slot)} · {id}</small>
                            </article>;
                        })}
                    </div>
                </>}
                {section === 'furniture' && <>
                    <div className="develop-filters"><label>Room<select value={room} onChange={event => setRoom(event.target.value)}>
                        {ROOMS.map(value => <option key={value} value={value}>{titleCase(value)}</option>)}
                    </select></label><label>Find furniture<input value={filter} placeholder="Search name or ID" onChange={event => setFilter(event.target.value)}/></label></div>
                    <p className="develop-hint">Showing {furniture.length} unique furniture entries. Every item uses its original in-game artwork.</p>
                    <div className="develop-grid develop-furniture">
                        {furniture.map(([id, item]) => <article key={id} className="develop-tile">
                            <div className="develop-furniture-art"><FurnitureArt kind={item.kind} itemId={id}/></div>
                            <b>{item.name}</b><small>{item.room} · {id}</small>
                        </article>)}
                    </div>
                </>}
                {section === 'food' && <>
                    <p className="develop-hint">Kitchen ingredients and prepared dishes using the exact FoodArt component.</p>
                    <div className="develop-grid develop-furniture">
                        {FOOD_ART_IDS.map(id => <article key={id} className="develop-tile">
                            <div className="develop-furniture-art"><FoodArt id={id}/></div>
                            <b>{titleCase(id)}</b><small>{id}</small>
                        </article>)}
                    </div>
                </>}
                {section === 'pawmail' && <section className="develop-mail">
                    <div className="develop-mail-heading">
                        <div>
                            <span className="paw-admin-eyebrow">LETTER COLLECTION</span>
                            <h2>PawMail envelope artwork</h2>
                            <p className="develop-hint">All {ENVELOPE_DESIGNS.length} in-game envelopes, including the 10 level-unlockable designs. These previews use the exact same SVGs and themed backgrounds as PawMail. Browsing here does not unlock or buy anything.</p>
                        </div>
                        <span className="develop-mail-total">{ENVELOPE_DESIGNS.length} designs</span>
                    </div>
                    <div className="develop-mail-filters">
                        <label htmlFor="develop-mail-search">Find envelope
                            <input id="develop-mail-search" type="search" value={mailSearch} onChange={event => setMailSearch(event.target.value)} placeholder="Search name or design ID"/>
                        </label>
                        <label htmlFor="develop-mail-group">Collection
                            <select id="develop-mail-group" value={mailGroup} onChange={event => setMailGroup(event.target.value as 'all' | 'starter' | 'unlockable')}>
                                <option value="all">All designs</option>
                                <option value="starter">Level 1 designs</option>
                                <option value="unlockable">Level unlockables</option>
                            </select>
                        </label>
                    </div>
                    <div className="develop-mail-grid">
                        {ENVELOPE_DESIGNS.filter(design =>
                            (mailGroup === 'all' || (mailGroup === 'starter' ? design.level === 1 : design.level > 1)) &&
                            `${design.title} ${design.id}`.toLowerCase().includes(mailSearch.trim().toLowerCase())
                        ).map(design => <article className="develop-mail-card" key={design.id}>
                            <div className={`develop-mail-art pawmail-collection-art paw-envelope-${design.id}`}>
                                <EnvelopeArtwork design={design.id}/>
                            </div>
                            <div className="develop-mail-card-details">
                                <b>{design.title}</b>
                                <small>{design.id}</small>
                                <div className="develop-mail-meta">
                                    <span>{design.level > 1 ? `Unlock: Level ${design.level}` : 'Available: Level 1'}</span>
                                    <span>{design.price === 0 ? 'Free' : `${design.price.toLocaleString()} Paw Coins`}</span>
                                </div>
                            </div>
                        </article>)}
                    </div>
                    {!ENVELOPE_DESIGNS.some(design =>
                        (mailGroup === 'all' || (mailGroup === 'starter' ? design.level === 1 : design.level > 1)) &&
                        `${design.title} ${design.id}`.toLowerCase().includes(mailSearch.trim().toLowerCase())
                    ) && <p className="develop-mail-empty">No matching envelopes. Try a different name or collection.</p>}
                </section>}
                {section === 'arcade' && <>
                    <p className="develop-hint">These previews reuse the exact artwork from gameplay. Paw Run draws the same vehicle and building SVG documents onto its canvas, and the other icons share their in-game React components.</p>
                    <h2 className="develop-art-subheading">Mini-game menu icons</h2>
                    <div className="develop-grid develop-furniture">
                        {(['memory', 'dino', 'runner', 'pattern', 'mole', 'claw'] as const).map(game =>
                            <article key={game} className="develop-tile">
                                <div className="develop-furniture-art develop-arcade-art">
                                    {game === 'memory' ? <BrainCircuit size={34}/> : game === 'dino' ? <Sprout size={34}/> :
                                        game === 'runner' ? <Rabbit size={34}/> : game === 'pattern' ? <Heart size={34}/> :
                                        game === 'mole' ? <MoleGameIcon/> : <ClawMenuIcon/>}
                                </div>
                                <b>{({memory: 'Memory Tiles', dino: 'Cactus Jump', runner: 'Paw Run', pattern: 'Heart Color Match', mole: 'Whack-a-Mole', claw: 'Paw Claw'} as const)[game]}</b>
                                <small>Same SVG used on the game-selection card</small>
                            </article>
                        )}
                    </div>
                    <h2 className="develop-art-subheading">Paw Run · Five vehicles</h2>
                    <div className="develop-grid develop-furniture">
                        {VEHICLE_ART.map((document, index) => <article key={`vehicle-${index}`} className="develop-tile">
                            <div className="develop-furniture-art develop-arcade-art"><img src={arcadeSpriteSrc(document)} alt={`Paw Run vehicle ${index + 1}`}/></div>
                            <b>{['Bubblegum car', 'Mint van', 'Lavender coupe', 'Honey taxi', 'Sky-blue minibus'][index]}</b><small>Actual Paw Run sprite · {index + 1}/5</small>
                        </article>)}
                    </div>
                    <h2 className="develop-art-subheading">Paw Run · Roadside buildings</h2>
                    <div className="develop-grid develop-furniture">
                        {BUILDING_ART.map((document, index) => <article key={`building-${index}`} className="develop-tile">
                            <div className="develop-furniture-art develop-arcade-art"><img src={arcadeSpriteSrc(document)} alt={`Paw Run building ${index + 1}`}/></div>
                            <b>{['Cream townhouse', 'Mint corner shop', 'Lavender apartment', 'Peach café'][index]}</b><small>Actual roadside sprite · {index + 1}/4</small>
                        </article>)}
                    </div>
                    <h2 className="develop-art-subheading">Cactus Jump · Obstacles and guide</h2>
                    <div className="develop-grid develop-furniture">
                        {CACTUS_ART.map((document, index) => <article key={`cactus-${index}`} className="develop-tile">
                            <div className="develop-furniture-art develop-arcade-art"><img src={arcadeSpriteSrc(document)} alt={`Spiky cactus ${index + 1}`}/></div>
                            <b>Spiky cactus {index + 1}</b><small>Actual Cactus Jump sprite</small>
                        </article>)}
                        <article className="develop-tile">
                            <div className="develop-furniture-art develop-arcade-guide"><JumpGuide/></div>
                            <b>Jump instruction</b><small>Same SVG guide as gameplay</small>
                        </article>
                    </div>
                    <h2 className="develop-art-subheading">Memory Tiles · Heart colors</h2>
                    <div className="develop-grid develop-furniture">
                        {MEMORY_HEARTS.map((entry, index) => <article key={entry.label} className="develop-tile">
                            <div className="develop-furniture-art develop-arcade-art"><MemoryHeart index={index} size={82}/></div>
                            <b>{entry.label} heart</b><small>Same Memory Tiles component</small>
                        </article>)}
                    </div>
                    <h2 className="develop-art-subheading">Heart Color Match · Paint palettes</h2>
                    <div className="develop-grid develop-furniture">
                        {PAW_COLOR_PALETTE.map((color, index) => <article key={`${color}-palette`} className="develop-tile">
                            <div className="develop-furniture-art develop-arcade-art"><PaintPalette color={color} size={82}/></div>
                            <b>Palette {index + 1}</b><small>{color} · actual game color</small>
                        </article>)}
                    </div>
                    <h2 className="develop-art-subheading">Heart Color Match · Target hearts</h2>
                    <div className="develop-grid develop-furniture">
                        {PAW_COLOR_PALETTE.map((color, index) => <article key={`${color}-target`} className="develop-tile">
                            <div className="develop-furniture-art develop-arcade-art"><TargetHeart color={color}/></div>
                            <b>Target {index + 1}</b><small>{color} · actual game color</small>
                        </article>)}
                    </div>
                    <h2 className="develop-art-subheading">Paw Claw · Grabber</h2>
                    <div className="develop-grid develop-furniture">
                        <article className="develop-tile">
                            <div className="develop-furniture-art develop-arcade-art"><ClawGrabberArt/></div>
                            <b>Mechanical claw</b><small>Same SVG used by Paw Claw</small>
                        </article>
                    </div>
                    <h2 className="develop-art-subheading">Whack-a-Mole · Targets</h2>
                    <div className="develop-grid develop-furniture">
                        {(['mouse', 'gold', 'bomb'] as const).map(kind => <article key={kind} className="develop-tile">
                            <div className="develop-furniture-art"><MoleArt kind={kind}/></div>
                            <b>{titleCase(kind)}</b><small>Real Whack-a-Mole component</small>
                        </article>)}
                    </div>
                </>}

            </main>}
        <footer className="paw-admin-footer">© {new Date().getFullYear()} PawPal. All rights reserved. · Jorge Jose</footer>
    </div>;
}
