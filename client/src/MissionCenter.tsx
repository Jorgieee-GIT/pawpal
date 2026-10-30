import {useCallback, useEffect, useMemo, useState} from 'react';
import {Check, CheckCheck, Clock3, Coins, Sparkles, PawPrint, ChevronDown, Trophy} from 'lucide-react';
import SectionHeading from './SectionHeading';

type MissionKind = 'daily' | 'weekly' | 'milestone';
type Mission = {
    id: string;
    kind: MissionKind;
    title: string;
    metric: string;
    target: number;
    progress: number;
    coins: number;
    xp: number;
    claimed: boolean;
};
type MissionPayload = {
    missions: Mission[];
    today: string;
    week: string;
    totals: {daily: number; weekly: number; milestone: number};
};

const types: {id: MissionKind; label: string; tagline: string}[] = [
    {id: 'daily', label: 'Daily', tagline: 'New adventures every day'},
    {id: 'weekly', label: 'Weekly', tagline: 'A little more to explore'},
    {id: 'milestone', label: 'Milestones', tagline: 'Your lifetime achievements'}
];

const families: Record<string, string> = {
    feed: 'Pet care', play: 'Pet care', sleep: 'Pet care', bathe: 'Pet care', cuddle: 'Pet care',
    arcade: 'Mini-games', claw: 'Mini-games', memory: 'Mini-games', dino: 'Mini-games',
    runner: 'Mini-games', pattern: 'Mini-games', mole: 'Mini-games',
    plant: 'Garden', harvest: 'Garden', water: 'Garden',
    cook: 'Kitchen', serve: 'Kitchen', meal_buy: 'Kitchen',
    buy: 'Shopping', outfit: 'Shopping', atmosphere: 'Shopping', furniture: 'Shopping', room: 'Shopping',
    friend: 'Social', mail: 'Social', brawl: 'Social', gift: 'Social', note: 'Social', daily_surprise: 'Pet care'
};

function formatReset(until: number, now: number) {
    const seconds = Math.max(0, Math.ceil((until - now) / 1000));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor(seconds % 86400 / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;
    return `${days ? `${days}d ` : ''}${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

export default function MissionCenter({token, api, onPetChange, onToast}: {
    token: string;
    api: string;
    onPetChange: () => Promise<unknown> | void;
    onToast: (message: string) => void;
}) {
    const [now, setNow] = useState(() => Date.now());
    const [data, setData] = useState<MissionPayload | null>(null);
    const [kind, setKind] = useState<MissionKind>('daily');
    const [family, setFamily] = useState('All');
    const [shown, setShown] = useState(18);
    const [busy, setBusy] = useState('');

    const load = useCallback(async () => {
        try {
            const response = await fetch(`${api}/api/missions`, {
                headers: {Authorization: `Bearer ${token}`}
            });
            const result = await response.json();
            if (!response.ok) throw Error(result.error || 'Unable to load missions');
            setData(result);
        } catch (error) {
            onToast(error instanceof Error ? error.message : 'Could not load missions');
        }
    }, [api, token]);

    useEffect(() => {
        void load();
    }, [load]);
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const manilaNow = new Date(now + 8 * 3600000);
    const dayStart = Date.UTC(manilaNow.getUTCFullYear(), manilaNow.getUTCMonth(), manilaNow.getUTCDate());
    const nextDay = dayStart + 86400000 - 8 * 3600000;
    const daysToMonday = (8 - manilaNow.getUTCDay()) % 7 || 7;
    const nextWeek = dayStart + daysToMonday * 86400000 - 8 * 3600000;
    const resetKey = `${dayStart}:${dayStart + daysToMonday * 86400000}`;
    useEffect(() => {
        void load();
    }, [resetKey, load]);

    const selected = useMemo(() => (data?.missions || []).filter(mission => mission.kind === kind)
        .sort((a, b) => {
            const rank = (mission: Mission) => mission.claimed ? 2 : mission.progress >= mission.target ? 0 : 1;
            return rank(a) - rank(b) || a.target - b.target || a.title.localeCompare(b.title);
        }), [data, kind]);
    const ready = selected.filter(mission => !mission.claimed && mission.progress >= mission.target);
    const claimed = selected.filter(mission => mission.claimed).length;
    const categories = ['All', ...new Set(selected.map(mission => families[mission.metric] || 'Other'))];
    const visible = selected.filter(mission => family === 'All' || (families[mission.metric] || 'Other') === family);
    const count = kind === 'milestone' ? Math.min(shown, visible.length) : visible.length;
    const displayed = visible.slice(0, count);

    async function claim(id: string) {
        if (busy) return;
        setBusy(id);
        try {
            const response = await fetch(`${api}/api/missions/${id}/claim`, {
                method: 'POST', headers: {Authorization: `Bearer ${token}`}
            });
            const result = await response.json();
            if (!response.ok) throw Error(result.error || 'Unable to claim reward');
            onToast(result.message);
            await Promise.all([load(), Promise.resolve(onPetChange())]);
        } catch (error) {
            onToast(error instanceof Error ? error.message : 'Could not claim reward');
        } finally {
            setBusy('');
        }
    }

    async function claimAll() {
        if (busy || !ready.length) return;
        setBusy('all');
        try {
            const response = await fetch(`${api}/api/missions/claim-all`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
                body: JSON.stringify({kind})
            });
            const result = await response.json();
            if (!response.ok) throw Error(result.error || 'Unable to claim rewards');
            onToast(result.message);
            await Promise.all([load(), Promise.resolve(onPetChange())]);
        } catch (error) {
            onToast(error instanceof Error ? error.message : 'Could not claim rewards');
        } finally {
            setBusy('');
        }
    }

    return <section className="panel mission-center paw-missions-refreshed">
        <div className="eyebrow">YOUR LITTLE ADVENTURES</div>
        <div className="paw-missions-heading"><SectionHeading title="Missions" Icon={Trophy}/></div>
        <div className="paw-missions-kinds" role="tablist" aria-label="Mission schedule">
            {types.map(item => {
                const missions = (data?.missions || []).filter(mission => mission.kind === item.id);
                const done = missions.filter(mission => mission.claimed).length;
                return <button key={item.id} role="tab" type="button" aria-selected={kind === item.id} className={kind === item.id ? 'active' : ''} onClick={() => {setKind(item.id); setFamily('All'); setShown(18)}}>
                    <span>{item.label}</span><small>{done}/{missions.length} claimed</small>
                </button>;
            })}
        </div>
        <div className="paw-missions-toolbar">
            <div className="paw-missions-reset"><Clock3 size={16}/><span>{kind === 'daily' ? `Resets in ${formatReset(nextDay, now)}` : kind === 'weekly' ? `Resets in ${formatReset(nextWeek, now)}` : 'Permanent progress'}</span></div>
            <button type="button" className="paw-missions-claim-all" disabled={!!busy || !ready.length} onClick={() => void claimAll()}><CheckCheck size={17}/>{busy === 'all' ? 'Claiming...' : 'Claim all'}</button>
        </div>
        {kind === 'milestone' && <div className="paw-missions-filters" aria-label="Milestone categories">
            {categories.map(category => <button type="button" key={category} className={family === category ? 'active' : ''} onClick={() => {setFamily(category); setShown(18)}}>{category}</button>)}
        </div>}
        {!data ? <p className="paw-missions-empty">Loading your missions...</p> : <div className="mission-grid">
            {displayed.map(mission => {
                const done = mission.progress >= mission.target;
                return <article className={`mission-card ${mission.claimed ? 'claimed' : ''} ${done && !mission.claimed ? 'paw-mission-ready' : ''}`} key={mission.id}>
                    <div className="paw-mission-category"><PawPrint size={12}/>{families[mission.metric] || 'Adventure'}{mission.claimed && <span><Check size={13}/> Collected</span>}</div>
                    <div className="mission-top"><b>{mission.title}</b><span>{mission.progress}/{mission.target}</span></div>
                    <div className="mission-track" role="progressbar" aria-label={`${mission.title} progress`} aria-valuenow={mission.progress} aria-valuemin={0} aria-valuemax={mission.target}><span style={{width: `${Math.min(100, mission.progress / mission.target * 100)}%`}}/></div>
                    <div className="mission-footer"><small className="mission-rewards"><Coins size={15}/> {mission.coins} coins <Sparkles size={15}/> {mission.xp} EXP</small><button type="button" className={`mission-claim-button ${mission.claimed ? 'is-claimed' : done ? 'is-ready' : 'is-pending'}`} disabled={!!busy || mission.claimed || !done} onClick={() => void claim(mission.id)}>{mission.claimed ? 'Claimed' : busy === mission.id ? 'Claiming...' : done ? 'Claim' : 'In progress'}</button></div>
                </article>;
            })}
        </div>}
        {kind === 'milestone' && count < visible.length && <button className="paw-missions-show-more" type="button" onClick={() => setShown(value => value + 18)}><ChevronDown size={17}/> Show more milestones ({visible.length - count} remaining)</button>}
    </section>;
}
