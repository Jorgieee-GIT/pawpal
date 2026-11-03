import { useEffect, useState, type CSSProperties } from "react";
import {
    Activity, BarChart3, Bell, Check, ChevronRight, Coins, Eye, FileText,
    Gift, History, Lock, Megaphone, RefreshCw, Search, Settings2,
    Shield, ShieldCheck, SlidersHorizontal, Users, X
} from "lucide-react";
import "./AdminConsole.css";
import PetArt from "./PetArt";

const API = import.meta.env.VITE_API_URL || "";
export type AdminSection = "overview" | "players" | "games" | "multiplayer" | "economy" | "announcements" | "reports" | "settings";
export const ADMIN_SECTIONS: Array<{ key: AdminSection; label: string; icon: typeof Users }> = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "players", label: "Players", icon: Users },
    { key: "games", label: "Games", icon: SlidersHorizontal },
    { key: "multiplayer", label: "Multiplayer", icon: Shield },
    { key: "economy", label: "Economy", icon: Coins },
    { key: "announcements", label: "Announcements", icon: Megaphone },
    { key: "reports", label: "Reports & Logs", icon: FileText },
    { key: "settings", label: "Settings", icon: Settings2 }
];

type Json = Record<string, any>;
type Props = {
    token: string;
    section: AdminSection;
    profileId: string | null;
    onCloseProfile: () => void;
    showMessage: (value: string) => void;
    showError: (value: string) => void;
};
const configNames: Record<string, { name: string; description: string }> = {
    feature_arcade: { name: "Arcade & Minigames", description: "Pause coin and score submissions from arcade minigames" },
    feature_garden: { name: "Lucky Garden", description: "Temporarily disable planting, watering and harvesting" },
    feature_kitchen: { name: "Kitchen", description: "Pause cooking, shopping for ingredients and serving" },
    feature_multiplayer: { name: "Paw Brawl", description: "Disable Classic and Duo Clash actions, invitations and lobbies" },
    feature_missions: { name: "Missions", description: "Pause mission claims and achievement rewards" },
    feature_pawclaw: { name: "Paw Claw", description: "Temporarily disable claw entries" },
    feature_shop: { name: "Shop & Furniture", description: "Pause store purchases and furniture changes" }
};
const humanDate = (v: string | null | undefined) => v ? new Date(v).toLocaleString() : "Never";
const number = (v: unknown) => Number(v || 0).toLocaleString();

export default function AdminConsole({ token, section, profileId, onCloseProfile, showMessage, showError }: Props) {
    const [data, setData] = useState<Json>({});
    const [settings, setSettings] = useState<Record<string, boolean | number>>({});
    const [profile, setProfile] = useState<Json | null>(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [coinValue, setCoinValue] = useState("0");
    const [confirmCoin, setConfirmCoin] = useState(false);
    const [coinReason, setCoinReason] = useState("");
    const [announcement, setAnnouncement] = useState({ title: "", body: "", audience: "all", usernames: "", hours: "72", publishAt: "" });
    const [reportTab, setReportTab] = useState<"reports" | "audit" | "errors">("reports");

    async function request(path: string, method = "GET", body?: object) {
        const response = await fetch(API + "/api/admin/" + path, {
            method,
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: body ? JSON.stringify(body) : undefined
        });
        const result = await response.json().catch(() => ({ error: "Invalid server response." }));
        if (!response.ok) {
            throw Error(result.error || "Admin request failed.");
        }
        return result;
    }
    const sectionPaths: Partial<Record<AdminSection, string>> = {
        overview: "dashboard",
        games: "activity",
        multiplayer: "multiplayer-monitor",
        economy: "economy",
        announcements: "announcements",
        reports: "reports",
        settings: "settings"
    };
    async function reload(active = section) {
        if (active === "players") {
            return;
        }
        setLoading(true);
        try {
            if (active === "games") {
                const [activity, configuration] = await Promise.all([request("activity"), request("settings")]);
                setData(activity);
                setSettings(configuration.settings);
            } else if (active === "reports") {
                const [reports, logs] = await Promise.all([request("reports"), request("logs")]);
                setData({ ...reports, ...logs });
            } else if (active === "settings") {
                const response = await request("settings");
                setSettings(response.settings);
                setData(response);
            } else {
                setData(await request(sectionPaths[active] || "dashboard"));
            }
        } catch (error) {
            showError((error as Error).message);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        void reload(section);
    }, [token, section]);
    useEffect(() => {
        if (!profileId) {
            setProfile(null);
            return;
        }
        void request("players/" + profileId + "/profile").then(setProfile).catch(error => showError(error.message));
    }, [profileId, token]);

    async function updateSetting(key: string, value: boolean | number) {
        setBusy(true);
        try {
            const response = await request("settings", "PATCH", { key, value });
            setSettings(response.settings);
            showMessage("Setting saved. New gameplay requests will follow this setting.");
        } catch (error) {
            showError((error as Error).message);
        } finally {
            setBusy(false);
        }
    }
    async function updateAccess(access: { suspended: boolean; lucky_games_access: boolean; disabled_features: string[] }) {
        if (!profileId) return;
        setBusy(true);
        try {
            await request("players/" + profileId + "/access", "PATCH", {
                suspended: access.suspended, luckyGamesAccess: access.lucky_games_access,
                disabledFeatures: access.disabled_features
            });
            setProfile(await request("players/" + profileId + "/profile"));
            showMessage("Player access permissions updated and audited.");
        } catch (error) {
            showError((error as Error).message);
        } finally {
            setBusy(false);
        }
    }
    async function adjustCoins() {
        if (!profileId || !Number.isInteger(Number(coinValue))) {
            showError("Enter a valid whole-coin amount.");
            return;
        }
        setBusy(true);
        try {
            await request("players/" + profileId + "/coins", "POST", { amount: Number(coinValue), reason: coinReason.trim() });
            setProfile(await request("players/" + profileId + "/profile"));
            setCoinValue("0");
            setCoinReason("");
            setConfirmCoin(false);
            showMessage("Paw Coins updated and logged.");
        } catch (error) {
            showError((error as Error).message);
        } finally {
            setBusy(false);
        }
    }
    async function sendAnnouncement(event: React.FormEvent) {
        event.preventDefault();
        setBusy(true);
        try {
            await request("announcements", "POST", {
                title: announcement.title.trim(), body: announcement.body.trim(), audience: announcement.audience,
                usernames: announcement.audience === "selected" ? announcement.usernames.split(",").map(x => x.trim()).filter(Boolean) : [],
                hours: Number(announcement.hours),
                ...(announcement.publishAt ? { publishAt: new Date(announcement.publishAt).toISOString() } : {})
            });
            setAnnouncement({ title: "", body: "", audience: "all", usernames: "", hours: "72", publishAt: "" });
            showMessage("Announcement published to the selected players.");
            await reload("announcements");
        } catch (error) {
            showError((error as Error).message);
        } finally {
            setBusy(false);
        }
    }
    async function archiveAnnouncement(id: string) {
        setBusy(true);
        try {
            await request("announcements/" + id + "/archive", "POST");
            await reload("announcements");
            showMessage("Announcement archived.");
        } catch (error) {
            showError((error as Error).message);
        } finally {
            setBusy(false);
        }
    }
    async function setReportStatus(id: string, status: string) {
        setBusy(true);
        try {
            await request("reports/" + id, "PATCH", { status });
            await reload("reports");
            showMessage("Report status saved.");
        } catch (error) {
            showError((error as Error).message);
        } finally {
            setBusy(false);
        }
    }
    function title(name: string, subtitle: string) {
        return <div className="admin-console-heading"><div><h2>{name}</h2><p>{subtitle}</p></div><button type="button" onClick={() => void reload()} disabled={loading}><RefreshCw size={16} /> Refresh</button></div>;
    }

    return <>
        {section === "overview" && <section className="admin-console-section">
            {title("Overview", "Live data from your PawPal database. Player presence reflects recent connected sessions.")}
            <div className="admin-console-metrics">
                {([
                    ["Registered players", data.players, Users], ["Adopted pets", data.pets, ShieldCheck],
                    ["Connected recently", data.online, Activity], ["Active battles", data.activeBattles, Shield],
                    ["Paw Coins held", data.pawCoins, Coins], ["Open reports", data.openReports, FileText],
                    ["Password requests", data.passwordRequests, Lock]
                ] as const).map(([label, value, Icon]) => <article key={label} className="admin-console-metric"><Icon size={20} /><span>{label}</span><strong>{number(value)}</strong></article>)}
            </div>
            <div className="admin-console-panel"><h3>Recent admin activity</h3>
                {data.recent?.length ? data.recent.map((item: Json) => <div key={item.id} className="admin-console-listrow"><span>{item.action.replaceAll("_", " ")}</span><small>{humanDate(item.created_at)}</small></div>) : <p className="admin-console-muted">No recorded changes yet.</p>}
            </div>
        </section>}

        {section === "games" && <section className="admin-console-section">
            {title("Games & activity", "Control gameplay access and the future reward rate for new actions.")}
            <div className="admin-console-panel"><h3>Game availability</h3><p className="admin-console-muted">Disabling a feature blocks its API actions on the server. Turn it back on to restore access.</p>
                <div className="admin-console-setting-grid">{Object.entries(configNames).map(([key, value]) => <label key={key} className="admin-console-setting"><span><b>{value.name}</b><small>{value.description}</small></span><input type="checkbox" checked={settings[key] === true} disabled={busy} onChange={event => void updateSetting(key, event.target.checked)} /></label>)}</div>
            </div>
            <div className="admin-console-panel"><h3>Reward controls</h3><p className="admin-console-muted">Changes apply to new arcade rewards and future Garden plantings, not crops already growing. 100% keeps existing payouts.</p>
                <div className="admin-console-setting-grid">{[
                    ["arcade_reward_percent", "Arcade Paw Coins"], ["garden_reward_percent", "New Garden harvest value"]
                ].map(([key, label]) => <label key={key} className="admin-console-slider"><span><b>{label}</b><strong>{Number(settings[key] ?? 100)}%</strong></span><input type="range" min={50} max={150} step={5} disabled={busy}
                    style={{ "--admin-slider-progress": `${Math.max(0, Math.min(100, (Number(settings[key] ?? 100) - 50)))}%` } as CSSProperties}
                    value={Number(settings[key] ?? 100)} onChange={e => setSettings(prev => ({ ...prev, [key]: Number(e.target.value) }))} onPointerUp={() => void updateSetting(key, Number(settings[key] ?? 100))} onKeyUp={e => { if (e.key === "Enter") void updateSetting(key, Number(settings[key] ?? 100)); }} /><button type="button" disabled={busy} onClick={() => void updateSetting(key, Number(settings[key] ?? 100))}>Save rate</button></label>)}</div>
                <div className="admin-console-setting-grid">{[
                    ["arcade_cooldown_seconds", "Arcade reward cooldown", 8, 60],
                    ["claw_cooldown_seconds", "Paw Claw cooldown", 15, 120]
                ].map(([key, label, min, max]) => <label key={String(key)} className="admin-console-slider"><span><b>{label}</b><strong>{Number(settings[String(key)] ?? min)} seconds</strong></span>
                    <input type="range" min={Number(min)} max={Number(max)} step={1} disabled={busy}
                        style={{ "--admin-slider-progress": `${Math.max(0, Math.min(100, (Number(settings[String(key)] ?? min) - Number(min)) * 100 / (Number(max) - Number(min))))}%` } as CSSProperties}
                        value={Number(settings[String(key)] ?? min)}
                        onChange={e => setSettings(prev => ({ ...prev, [String(key)]: Number(e.target.value) }))}/>
                    <button type="button" disabled={busy} onClick={() => void updateSetting(String(key), Number(settings[String(key)] ?? min))}>Save cooldown</button></label>)}</div>
            </div>
            <div className="admin-console-panel"><h3>Minigame engagement</h3><p className="admin-console-muted">Number of players with a recorded score per game. Does not count every play.</p>
                <div className="admin-console-tablewrap"><table><thead><tr><th>Game</th><th>Players</th><th>Highest score</th></tr></thead><tbody>{(data.games || []).map((g: Json) => <tr key={g.game}><td>{g.game}</td><td>{g.players}</td><td>{number(g.best)}</td></tr>)}</tbody></table></div>
                <h4>Pet adoption by species</h4><div className="admin-console-chips">{(data.species || []).map((s: Json) => <span key={s.species}>{s.species}: {s.players}</span>)}</div>
            </div>
            <div className="admin-console-panel"><h3>Recent player presence</h3><div className="admin-console-tablewrap"><table><thead><tr><th>Player</th><th>Last connected</th></tr></thead><tbody>{(data.recentPlayers || []).map((p: Json) => <tr key={p.username}><td>@{p.username}</td><td>{humanDate(p.last_seen_at)}</td></tr>)}</tbody></table></div></div>
        </section>}

        {section === "multiplayer" && <section className="admin-console-section">
            {title("Multiplayer monitor", "Read-only match records. Active battles are not modified by this dashboard.")}
            <div className="admin-console-panel"><h3>Classic Clash 1v1</h3><div className="admin-console-tablewrap"><table><thead><tr><th>Players</th><th>Status</th><th>Wager</th><th>Winner</th><th>Updated</th></tr></thead><tbody>{(data.classic || []).map((m: Json) => <tr key={m.id}><td>@{m.challenger} vs @{m.opponent}</td><td><span className="admin-console-pill">{m.status}</span></td><td>{number(m.wager)}</td><td>{m.winner ? "@" + m.winner : "—"}</td><td>{humanDate(m.updated_at)}</td></tr>)}</tbody></table></div></div>
            <div className="admin-console-panel"><h3>Duo Clash 2v2</h3><div className="admin-console-tablewrap"><table><thead><tr><th>Room</th><th>Players</th><th>Status</th><th>Wager</th><th>Updated</th></tr></thead><tbody>{(data.duo || []).map((m: Json) => <tr key={m.id}><td>{m.code}</td><td>{Array.isArray(m.participants) ? m.participants.map((p: Json) => p.username || p.name || "Player").join(", ") : "—"}</td><td><span className="admin-console-pill">{m.status}</span></td><td>{number(m.wager)}</td><td>{humanDate(m.updated_at)}</td></tr>)}</tbody></table></div></div>
        </section>}

        {section === "economy" && <section className="admin-console-section">
            {title("Paw Coin economy", "Current balances and historical records that the database can verify.")}
            <div className="admin-console-metrics">
                {[["Total held", data.balances?.total], ["Average balance", data.balances?.average], ["Largest balance", data.balances?.largest], ["Arena Fees removed", data.arenaFees?.collected], ["Tracked coin inflow", data.tracked?.earned], ["Tracked coin outflow", data.tracked?.spent]].map(([name, value]) => <article className="admin-console-metric" key={String(name)}><Coins size={18}/><span>{name}</span><strong>{number(value)}</strong></article>)}
            </div>
            <div className="admin-console-panel"><p className="admin-console-muted">Coin inflow and outflow are tracked from this migration forward for supported pet actions and admin adjustments. Older activity, Kitchen transactions, and multiplayer settlements are not fully represented in those totals. Current balances and Arena Fee totals come directly from Neon.</p></div>
            <div className="admin-console-panel"><h3>Highest current Paw Coin balances</h3><div className="admin-console-tablewrap"><table><thead><tr><th>Player</th><th>Level</th><th>Coins</th></tr></thead><tbody>{(data.top || []).map((p: Json) => <tr key={p.username}><td>@{p.username}</td><td>{p.level}</td><td>{number(p.coins)}</td></tr>)}</tbody></table></div></div>
        </section>}

        {section === "announcements" && <section className="admin-console-section">
            {title("Announcements", "Send in-app messages to everyone or only selected usernames.")}
            <form className="admin-console-panel admin-console-form" onSubmit={sendAnnouncement}>
                <h3>New announcement</h3>
                <label>Title<input required maxLength={100} minLength={3} value={announcement.title} onChange={e => setAnnouncement(p => ({ ...p, title: e.target.value }))} placeholder="What's new in PawPal?" /></label>
                <label>Message<textarea required maxLength={1200} minLength={5} rows={4} value={announcement.body} onChange={e => setAnnouncement(p => ({ ...p, body: e.target.value }))} placeholder="Share an update, maintenance notice or community event." /></label>
                <div className="admin-console-form-grid"><label>Recipients<select value={announcement.audience} onChange={e => setAnnouncement(p => ({ ...p, audience: e.target.value }))}><option value="all">All players</option><option value="selected">Selected players</option></select></label><label>Expires after<select value={announcement.hours} onChange={e => setAnnouncement(p => ({ ...p, hours: e.target.value }))}><option value="24">24 hours</option><option value="72">3 days</option><option value="168">7 days</option></select></label></div>
                <label>Schedule for later (optional)
                    <input type="datetime-local" value={announcement.publishAt} onChange={e => setAnnouncement(p => ({ ...p, publishAt: e.target.value }))}/>
                </label>
                {announcement.audience === "selected" && <label>Usernames, separated by commas<input value={announcement.usernames} onChange={e => setAnnouncement(p => ({ ...p, usernames: e.target.value }))} placeholder="player1, player2" /></label>}
                <button className="admin-primary" disabled={busy} type="submit"><Megaphone size={16}/> Publish announcement</button>
            </form>
            <div className="admin-console-panel"><h3>Announcement history</h3>{(data.announcements || []).map((a: Json) => <article className="admin-console-entry" key={a.id}><div><b>{a.title}</b><small>{a.audience} · {humanDate(a.publish_at || a.created_at)} · {a.status === "active" && new Date(a.publish_at).getTime() > Date.now() ? "scheduled" : a.status}</small><p>{a.body}</p></div>{a.status === "active" && <button type="button" disabled={busy} onClick={() => void archiveAnnouncement(a.id)}>Archive</button>}</article>)}{!data.announcements?.length && <p className="admin-console-muted">No announcements yet.</p>}</div>
        </section>}

        {section === "reports" && <section className="admin-console-section">
            {title("Reports & logs", "Player-submitted reports, administrative changes and server error codes.")}
            <div className="admin-console-subtabs">{(["reports", "audit", "errors"] as const).map(item => <button type="button" key={item} className={reportTab === item ? "is-active" : ""} onClick={() => setReportTab(item)}>{item === "reports" ? "Player reports" : item === "audit" ? "Admin audit" : "Server errors"}</button>)}</div>
            {reportTab === "reports" && <div className="admin-console-panel">{(data.reports || []).map((r: Json) => <article className="admin-console-entry" key={r.id}><div><b>@{r.username} · {r.category}</b><small>{humanDate(r.created_at)}</small><p>{r.description}</p></div><select aria-label="Report status" disabled={busy} value={r.status} onChange={e => void setReportStatus(r.id, e.target.value)}><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option></select></article>)}{!data.reports?.length && <p className="admin-console-muted">No player reports.</p>}</div>}
            {reportTab === "audit" && <div className="admin-console-panel"><div className="admin-console-tablewrap"><table><thead><tr><th>Action</th><th>Target</th><th>Details</th><th>Time</th></tr></thead><tbody>{(data.audit || []).map((a: Json) => <tr key={a.id}><td>{a.action}</td><td>{a.target || "—"}</td><td><code>{JSON.stringify(a.details || {})}</code></td><td>{humanDate(a.created_at)}</td></tr>)}</tbody></table></div></div>}
            {reportTab === "errors" && <div className="admin-console-panel"><p className="admin-console-muted">Only API route and error code are recorded, never tokens, passwords or request bodies.</p><div className="admin-console-tablewrap"><table><thead><tr><th>Route</th><th>Error code</th><th>Time</th></tr></thead><tbody>{(data.errors || []).map((e: Json) => <tr key={e.id}><td>{e.path}</td><td>{e.error_code}</td><td>{humanDate(e.created_at)}</td></tr>)}</tbody></table></div></div>}
        </section>}

        {section === "settings" && <section className="admin-console-section">
            {title("System settings", "Global controls protected by your existing admin login.")}
            <div className="admin-console-panel admin-console-maintenance"><div><h3>Maintenance mode</h3><p className="admin-console-muted">Block new gameplay changes while preserving login, announcements, user profiles and admin access. Turn it off to restore normal play.</p></div><label className="admin-console-setting"><span><b>{settings.maintenance_mode ? "Maintenance ON" : "Maintenance OFF"}</b><small>Changes apply to new API requests.</small></span><input type="checkbox" disabled={busy} checked={settings.maintenance_mode === true} onChange={e => void updateSetting("maintenance_mode", e.target.checked)}/></label></div>
            <div className="admin-console-panel"><h3>Permissions & privacy</h3><p className="admin-console-muted">Only the single configured administrator can access this panel. Admin roles have not been added. Passwords, signing keys and account session tokens are never displayed in audit logs.</p><p className="admin-console-muted">The account name and footer branding remain Jorge Jose. Account recovery still uses private, one-time, five-minute links.</p></div>
        </section>}

        {profileId && <div className="admin-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onCloseProfile(); }}>
            <section className="admin-dialog admin-console-profile" role="dialog" aria-modal="true" aria-labelledby="admin-profile-title">
                <div className="paw-modal-top admin-reset-header"><div><h2 id="admin-profile-title">Player profile</h2><p className="paw-modal-subtitle">{profile?.user ? "@" + profile.user.username : "Loading player"}</p></div><button type="button" className="paw-modal-close" aria-label="Close profile" onClick={onCloseProfile}><X size={19}/></button></div>
                <div className="admin-console-profilebody">
                    {!profile ? <p>Loading profile...</p> : <>
                        {profile.pet && <div className="admin-console-pet-preview">
                            <div className="admin-console-pet-art"><PetArt species={profile.pet.species} color={profile.pet.color} breed={profile.pet.breed} outfit={profile.pet.equipped_outfit}/></div>
                            <div><strong>{profile.pet.name}</strong><small>{profile.pet.breed?.replaceAll("_", " ")} · Level {profile.pet.level}</small></div>
                        </div>}
                        <div className="admin-console-profile-grid">{[
                            ["Pet", profile.pet?.name || "Not adopted"], ["Species / Breed", profile.pet ? profile.pet.species + " / " + profile.pet.breed : "—"],
                            ["Level", profile.pet?.level], ["Paw Coins", number(profile.pet?.coins)], ["Friends", profile.friends], ["Achievements", profile.achievements],
                            ["Joined", humanDate(profile.user?.created_at)], ["Last online", humanDate(profile.lastSeen)]
                        ].map(([name, value]) => <div key={String(name)}><small>{name}</small><strong>{value ?? "—"}</strong></div>)}</div>
                        <h3>Unlocked inventory</h3><p className="admin-console-muted">Furniture: {profile.pet?.owned_items?.length || 0} · Cosmetics: {profile.pet?.owned_cosmetics?.length || 0} · Breeds: {profile.pet?.owned_breeds?.length || 0} · Rooms: {profile.pet?.unlocked_rooms?.length || 0}</p>
                        <h3>Account permissions</h3>
                        <div className="admin-console-setting-grid">
                            <label className="admin-console-setting"><span><b>Account suspended</b><small>Blocks player logins and all authenticated activities.</small></span>
                                <input type="checkbox" disabled={busy} checked={profile.access?.suspended === true}
                                    onChange={e => void updateAccess({ ...profile.access, suspended: e.target.checked })}/></label>
                            <label className="admin-console-setting"><span><b>Lucky Games approved</b><small>Reserved for the future Lucky Games tab.</small></span>
                                <input type="checkbox" disabled={busy} checked={profile.access?.lucky_games_access === true}
                                    onChange={e => void updateAccess({ ...profile.access, lucky_games_access: e.target.checked })}/></label>
                        </div>
                        <h3>Restricted gameplay features</h3>
                        <p className="admin-console-muted">Toggle to restrict or restore individual game features for this player.</p>
                        <div className="admin-console-chips admin-console-permissions">{["arcade", "garden", "kitchen", "multiplayer", "missions", "pawclaw", "shop"].map(feature =>
                            <label key={feature}><input type="checkbox" disabled={busy}
                                checked={(profile.access?.disabled_features || []).includes(feature)}
                                onChange={e => {
                                    const previous: string[] = profile.access?.disabled_features || [];
                                    const disabled = e.target.checked ? [...previous, feature] : previous.filter(item => item !== feature);
                                    void updateAccess({ ...profile.access, disabled_features: disabled });
                                }}/>{feature.replaceAll("_", " ")} restricted</label>)}</div>
                        <h3>Owned furniture and cosmetics</h3>
                        <div className="admin-console-chips">{(profile.pet?.owned_items || []).map((name: string) => <span key={name}>{name.replaceAll("_", " ")}</span>)}</div>
                        <h3>Rooms and breed unlocks</h3>
                        <div className="admin-console-chips">{[...(profile.pet?.unlocked_rooms || []), ...(profile.pet?.owned_breeds || [])].map((name: string, i: number) => <span key={i}>{name.replaceAll("_", " ")}</span>)}</div>
                        <h3>Minigame records</h3><div className="admin-console-chips">{(profile.records || []).map((g: Json) => <span key={g.game}>{g.game}: {number(g.best)}</span>)}</div>
                        {profile.pet && <div className="admin-console-adjust"><h3>Adjust Paw Coins</h3><p className="admin-console-muted">Only adjust with a documented reason. This is logged and cannot reduce the balance below zero.</p><div className="admin-console-form-grid"><label>Change (+/-)<input type="number" min={-10000} max={10000} step={1} value={coinValue} onChange={e => setCoinValue(e.target.value)}/></label><label>Reason<input minLength={6} maxLength={200} value={coinReason} onChange={e => setCoinReason(e.target.value)} placeholder="Reason for adjustment"/></label></div><button type="button" disabled={busy || !coinReason.trim()} onClick={() => setConfirmCoin(true)}><Coins size={15}/> Save adjustment</button></div>}
                        <h3>Recent tracked coin changes</h3><div className="admin-console-tablewrap"><table><thead><tr><th>Change</th><th>Source</th><th>When</th></tr></thead><tbody>{(profile.coinEvents || []).map((e: Json, i: number) => <tr key={i}><td>{Number(e.change_amount)>0?"+":""}{number(e.change_amount)}</td><td>{e.source}</td><td>{humanDate(e.created_at)}</td></tr>)}</tbody></table></div>
                    </>}
                </div>
            </section>
        </div>}
        {confirmCoin && profileId && <div className="admin-backdrop admin-console-confirm" onMouseDown={e => { if (e.target === e.currentTarget) setConfirmCoin(false); }}>
            <section className="admin-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-confirm-coins-title">
                <div className="paw-modal-top admin-reset-header"><div><h2 id="admin-confirm-coins-title">Confirm coin change</h2><p className="paw-modal-subtitle">Player management</p></div><button type="button" className="paw-modal-close" onClick={() => setConfirmCoin(false)} aria-label="Close confirmation"><X size={19}/></button></div>
                <p>Change @{profile?.user?.username}'s balance by {coinValue} coins? This action will be recorded in the audit history.</p>
                <div className="admin-dialog-actions"><button type="button" onClick={() => setConfirmCoin(false)}>Cancel</button><button type="button" disabled={busy} className="admin-primary" onClick={() => void adjustCoins()}>Confirm change</button></div>
            </section>
        </div>}
    </>;
}
