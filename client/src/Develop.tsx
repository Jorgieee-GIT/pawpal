import {useEffect, useState} from 'react';
import {ArrowLeft, Eye, LockKeyhole, LogOut, ShieldCheck} from 'lucide-react';
import PetArt from './PetArt';
import {DEFAULTS, FURNITURE, FurnitureArt, RoomFurniture, furnitureLayout} from './RoomFurniture';
import {FoodArt} from './Kitchen';
import {COSMETIC_SLOTS, SLOT_NAMES, type OutfitSlot} from './outfitCatalog';
import {MoleArt} from './WhackAMole';
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
const ROOM_THEMES: Record<string, [string, string, string]> = {blush:['#ffeaf0','#f6d5cc','#bc6482'],lavender_room:['#f0e9ff','#e3d5ed','#8966b1'],mint_room:['#e9faf0','#d2eadc','#4d9275'],night_room:['#dcd6ed','#b7a5c8','#655383'],strawberry_milk:['#ffe1eb','#f4c2cb','#c95379'],lavender_dream:['#eee4ff','#d6c4ed','#7753ad'],mint_garden:['#dff9ed','#bde7d3','#34866f'],blueberry_sky:['#e3edff','#b9cdec','#5579bc'],honey_cottage:['#fff2ce','#e8cd96','#aa7631'],peach_blossom:['#ffe8dd','#f4c6b8','#c77460'],moonlight:['#dce0f5','#a7acd5','#4e588d'],sage_forest:['#e6eee0','#c0d3b4','#617f56'],aurora_prism:['#172451','#5b38a9','#46f2cf'],cosmic_nebula:['#151334','#662c8b','#ff72c6'],crystal_lagoon:['#0d526b','#29aeb7','#c0fcff'],solar_eclipse:['#23152f','#db754d','#ffd58a'],celestial_opal:['#382765','#a78aff','#91ffe7']};
const ROOM_THEME_NAMES: Record<string, string> = {blush:'Cozy Blush',lavender_room:'Lavender Room',mint_room:'Mint Room',night_room:'Night Room',strawberry_milk:'Strawberry Milk',lavender_dream:'Lavender Dream',mint_garden:'Mint Garden',blueberry_sky:'Blueberry Sky',honey_cottage:'Honey Cottage',peach_blossom:'Peach Blossom',moonlight:'Moonlight',sage_forest:'Sage Forest',aurora_prism:'Aurora Prism',cosmic_nebula:'Cosmic Nebula',crystal_lagoon:'Crystal Lagoon',solar_eclipse:'Solar Eclipse',celestial_opal:'Celestial Opal'};
const FOODS = ["berries", "milk", "flour", "carrot", "bread", "honey", "butter", "egg", "cheese", "peach", "pumpkin", "lettuce", "tomato", "pasta", "noodles", "berry_parfait", "cloud_pancakes", "cozy_soup", "moon_cookies", "honey_toast", "starry_omelet", "peach_smoothie", "pumpkin_pie", "garden_salad", "cheesy_pasta", "starlight_cake", "moonlight_ramen"];
const ACCESSORIES = Object.entries(COSMETIC_SLOTS);
const titleCase = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

export default function Develop() {
    const [token, setToken] = useState(() => sessionStorage.getItem('pawpal-admin-token') || '');
    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(Boolean(token));
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [section, setSection] = useState<'species' | 'breeds' | 'accessories' | 'furniture' | 'atmosphere' | 'food' | 'arcade'>('species');
    const [room, setRoom] = useState('all');
    const [atmosphereRoom, setAtmosphereRoom] = useState('living');
    const [atmosphereTheme, setAtmosphereTheme] = useState('blush');
    const [filter, setFilter] = useState('');
    const [previewSpecies, setPreviewSpecies] = useState('cat');
    const [accessorySlot, setAccessorySlot] = useState('all');

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
            <main className="develop-content">
                <div className="develop-intro paw-admin-intro"><div><span className="paw-admin-eyebrow">DEVELOPER GALLERY</span><h1>Artwork inspection</h1><p>These are the real in-game SVG components. Nothing here adopts a pet, buys furniture, or changes player data.</p></div></div>
                <div className="develop-tabs" role="group" aria-label="Gallery section">
                    {([
                        ['species', 'Species'],
                        ['breeds', 'All breeds'],
                        ['accessories', 'Outfits & accessories'],
                        ['furniture', 'Furniture'],
                        ['atmosphere', 'Atmosphere'],
                        ['food', 'Food & ingredients'],
                        ['arcade', 'Arcade artwork']
                    ] as const).map(([id, label]) => (
                        <button key={id} type="button" className={section === id ? 'active' : ''} onClick={() => setSection(id)}>{label}</button>
                    ))}
                </div>
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
                        <RoomFurniture room={atmosphereRoom} layout={furnitureLayout(atmosphereRoom)} editing={false} selected={null} onSelect={() => {}} onMove={() => {}}/>
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
                    <p className="develop-hint">All eight species, rendered using the real in-game pet component.</p>
                    <div className="develop-grid develop-pets">
                        {SPECIES.map(name => <article key={name} className="develop-tile">
                            <div className="develop-pet-art"><PetArt species={name}/></div>
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
                    <p className="develop-hint">Compare all 11 appearances for {titleCase(previewSpecies)} side by side. Each named breed now has distinct markings, facial details, or silhouette accents in addition to its fur palette. Previewing does not unlock or adopt anything.</p>
                    <div className="develop-grid develop-pets">
                        {['classic', ...BREEDS[previewSpecies], ...UNLOCKABLE_BREEDS[previewSpecies]].map(breed => <article key={breed} className="develop-tile">
                            <div className="develop-pet-art"><PetArt species={previewSpecies} breed={breed}/></div>
                            <b>{titleCase(breed)}</b><small>{breed === 'classic' ? 'Free · Default' : `Unlocks at Level ${(['classic', ...BREEDS[previewSpecies], ...UNLOCKABLE_BREEDS[previewSpecies]].indexOf(breed)) * 5}`}</small>
                        </article>)}
                    </div>
                </>}
                {section === 'accessories' && <>
                    <div className="develop-filters">
                        <label>Preview on species<select value={previewSpecies} onChange={event => setPreviewSpecies(event.target.value)}>
                            {SPECIES.map(name => <option key={name} value={name}>{titleCase(name)}</option>)}
                        </select></label>
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
                                <div className="develop-pet-art"><PetArt species={previewSpecies} cosmetic={id} outfit={outfit}/></div>
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
                        {FOODS.map(id => <article key={id} className="develop-tile">
                            <div className="develop-furniture-art"><FoodArt id={id}/></div>
                            <b>{titleCase(id)}</b><small>{id}</small>
                        </article>)}
                    </div>
                </>}
                {section === 'arcade' && <>
                    <p className="develop-hint">SVG targets from Whack-a-Mole. Canvas-drawn arcade graphics are not SVGs and are not included in this gallery.</p>
                    <div className="develop-grid develop-furniture">
                        {(['mouse', 'gold', 'bomb'] as const).map(kind => <article key={kind} className="develop-tile">
                            <div className="develop-furniture-art"><MoleArt kind={kind}/></div>
                            <b>{titleCase(kind)}</b><small>Whack-a-Mole</small>
                        </article>)}
                    </div>
                </>}

            </main>}
        <footer className="paw-admin-footer">© {new Date().getFullYear()} PawPal. All rights reserved. · Jorge Jose</footer>
    </div>;
}
