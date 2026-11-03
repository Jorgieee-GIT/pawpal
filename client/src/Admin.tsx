import { useEffect, useState } from "react";
import { ShieldCheck, Users, PawPrint, Search, LogOut, KeyRound, ArrowLeft, ArrowRight, Images, X, Link2, ClipboardCopy, Inbox, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import "./Admin.css";
import "./AdminShared.css";
import AdminConsole, { ADMIN_SECTIONS, type AdminSection } from "./AdminConsole";
const API = import.meta.env.VITE_API_URL || "";
type ResetRequest = {
    id: string;
    username: string;
    status: "pending" | "approved" | "rejected" | "expired" | "completed";
    created_at: string;
    decided_at: string | null;
    link_expires_at: string | null;
};
type ResetLink = { username: string; localUrl: string; productionUrl: string; expiresAt: string };
type AdminUser = {
    id: string;
    username: string;
    created_at: string;
    pet_id: string | null;
    pet_name: string | null;
    species: string | null;
    level: number | null;
    coins: number | null
};
async function adminRequest(path: string, token: string, method = "GET", body?: object) {
    const r = await fetch(API + "/api/admin" + path, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? {
                Authorization: "Bearer " + token
            } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    });
    const d = await r.json().catch(() => ({
        error: "Server returned an invalid response."
    }));
    if (!r.ok) {
        throw Error(d.error || "Request failed");
    }
    return d;
}
export default function Admin() {
    const [token, setToken] = useState(() => sessionStorage.getItem("pawpal-admin-token") || "");
    const [section, setSection] = useState<AdminSection>("overview");
    const [profileId, setProfileId] = useState<string | null>(null);
    const [username, setUsername] = useState(""), [password, setPassword] = useState("");
    const [users, setUsers] = useState<AdminUser[]>([]), [overview, setOverview] = useState<{
        users: number;
        pets: number
    } | null>(null);
    const [search, setSearch] = useState(""), [page, setPage] = useState(1);
    const [resetRequests, setResetRequests] = useState<ResetRequest[]>([]);
    const [requestFilter, setRequestFilter] = useState("");
    const [shareLink, setShareLink] = useState<ResetLink | null>(null);
    const [resetId, setResetId] = useState<string | null>(null), [newPassword, setNewPassword] = useState("");
    const [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [error, setError] = useState("");
    const logout = () => {
        sessionStorage.removeItem("pawpal-admin-token");
        setToken("");
        setUsers([]);
        setOverview(null);
        setResetId(null);
        setShareLink(null);
        setResetRequests([])
    };
    async function load(t = token, q = search, p = page) {
        try {
            const [u, o] = await Promise.all([adminRequest("/users?search=" + encodeURIComponent(q) + "&page=" + p, t), adminRequest("/overview", t)]);
            setUsers(u.users);
            setOverview(o)
        }
        catch (e) {
            if (String(e).includes("session expired")) {
                logout();

            } setError((e as Error).message)
        }
    }
    async function loadResetRequests(t = token) {
        try {
            const result = await adminRequest("/password-reset/requests", t);
            setResetRequests(result.requests || []);
        } catch (e) {
            setError((e as Error).message);
        }
    }
    useEffect(() => {
        if (token) {
            void load(token, search, page);
        }
    }, [token, search, page]);
    useEffect(() => {
        if (!token) {
            return;
        }
        void loadResetRequests(token);
        const refresh = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                void loadResetRequests(token);
            }
        }, 15000);
        return () => window.clearInterval(refresh);
    }, [token]);

    async function login(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            const d = await adminRequest("/login", "", "POST", {
                username,
                password
            });
            sessionStorage.setItem("pawpal-admin-token", d.token);
            setToken(d.token);
            setPassword("")
        } catch (e) {
            setError((e as Error).message)
        } finally {
            setBusy(false)
        }
    }
    async function reset(e: React.FormEvent) {
        e.preventDefault();
        if (!resetId) {
            return;

        } setBusy(true);
        setError("");
        setMessage("");
        try {
            const d = await adminRequest("/users/" + resetId + "/reset-password", token, "POST", {
                newPassword
            });
            setMessage(d.message);
            setNewPassword("");
            setResetId(null)
        } catch (e) {
            setError((e as Error).message)
        } finally {
            setBusy(false)
        }
    }
    async function createLink(account: AdminUser) {
        setBusy(true);
        setError("");
        try {
            const link = await adminRequest("/users/" + account.id + "/reset-link", token, "POST");
            setShareLink({ username: account.username, localUrl: link.localUrl || "", productionUrl: link.productionUrl || link.url, expiresAt: link.expiresAt });
            void loadResetRequests();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }
    async function decideRequest(id: string, decision: "approve" | "reject") {
        setBusy(true);
        setError("");
        try {
            const data = await adminRequest("/password-reset/requests/" + id + "/decision", token, "POST", { decision });
            if (data.url) {
                const account = resetRequests.find(item => item.id === id);
                setShareLink({ username: account?.username || "player", localUrl: data.localUrl || "", productionUrl: data.productionUrl || data.url, expiresAt: data.expiresAt });
            }
            setMessage(data.message);
            void loadResetRequests();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }
    async function copyLink(destination: "local" | "production") {
        if (!shareLink) {
            return;
        }
        const selectedLink = destination === "local" ? shareLink.localUrl : shareLink.productionUrl;
        if (!selectedLink) {
            setError("This link is unavailable. Redeploy the updated backend first.");
            return;
        }
        try {
            await navigator.clipboard.writeText(selectedLink);
            setMessage(destination === "local"
                ? "Local link copied. Use it while the Vite and API development servers are running."
                : "Vercel link copied. Share it privately after confirming the reset page is deployed.");
        } catch {
            setError("Copy was blocked. Select the link below and copy it manually.");
        }
    }
    function viewRequests(username = "") {
        setSection("players");
        setRequestFilter(username);
        document.getElementById("admin-reset-inbox")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const pendingRequests = resetRequests.filter(item => item.status === "pending");
    const visibleRequests = resetRequests.filter(item => !requestFilter || item.username === requestFilter);
    return <div className="admin-page">
        <div className="admin-shell">
            <header className="admin-header paw-admin-header">
                <div className="admin-brand">
                    <span>
                        <ShieldCheck size={22} />
                    </span>
                    <div>
                        <b>PawPal Admin</b>
                        <small>Administration workspace</small>
                    </div>
                </div>
                {token && <div className="admin-header-actions">
                    <span className="paw-admin-welcome">Welcome, Jorge Jose</span>
                    <a className="admin-dashboard-link" href="/develop">
                        <Images size={17} /> Developer gallery</a>
                    <button type="button" onClick={logout}>
                        <LogOut size={16} /> Sign out</button>
                </div>}
            </header>
            {!token ? <main className="admin-login">
                <div className="admin-login-icon">
                    <ShieldCheck size={34} />
                </div>
                <h1>Administrator sign in</h1>
                <p>Only the configured administrator credentials can access this page. Player accounts cannot sign in here.</p>
                <form onSubmit={login}>
                    <label>Admin username<input autoComplete="username" required value={username} onChange={e => setUsername(e.target.value)} />
                    </label>
                    <label>Admin password<input autoComplete="current-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                    </label>
                    <button disabled={busy} className="admin-primary">
                        {busy ? "Signing in…" : "Sign in to admin"}
                    </button>
                </form>
            </main> :
                <main className="admin-main">
                    <nav className="admin-section-nav" aria-label="Admin sections">
                        {ADMIN_SECTIONS.map(item => {
                            const Icon = item.icon;
                            return <button key={item.key} type="button" className={section === item.key ? "is-active" : ""}
                                aria-current={section === item.key ? "page" : undefined} onClick={() => setSection(item.key)}>
                                <Icon size={16} />{item.label}{item.key === "players" && pendingRequests.length > 0 ? " (" + pendingRequests.length + ")" : ""}
                            </button>;
                        })}
                    </nav>
                    {section === "players" && <div className="admin-legacy-players">
                    <div className="admin-heading paw-admin-intro">
                        <div>
                            <span>ACCOUNT MANAGEMENT</span>
                            <h1>Player management</h1>
                            <p>Inspect accounts, manage passwords and review recovery requests.</p>
                        </div>
                    </div>
                    <div className="admin-stats">
                        <article>
                            <Users size={23} />
                            <div>
                                <strong>
                                    {overview?.users ?? "-"}
                                </strong>
                                <span>Registered players</span>
                            </div>
                        </article>
                        <article>
                            <PawPrint size={23} />
                            <div>
                                <strong>
                                    {overview?.pets ?? "-"}
                                </strong>
                                <span>Adopted pets</span>
                            </div>
                        </article>
                    </div>
                    <section className="admin-panel">
                        <div className="admin-panel-head">
                            <h2>Players</h2>
                            <div className="admin-search">
                                <Search size={18} />
                                <input
                                    aria-label="Search username"
                                    placeholder="Search by username"
                                    value={search}
                                    onChange={e => {
                                        setSearch(e.target.value);
                                        setPage(1)
                                    }}
                                />
                            </div>
                        </div>
                        <div className="admin-table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Pet</th>
                                        <th>Level</th>
                                        <th>Coins</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => <tr key={u.id}>
                                        <td>
                                            <b>@{u.username}
                                            </b>
                                        </td>
                                        <td>
                                            {u.pet_name ? u.pet_name + " · " + u.species : "No pet yet"}
                                        </td>
                                        <td>
                                            {u.level ?? "-"}
                                        </td>
                                        <td>
                                            {u.coins?.toLocaleString() ?? "-"}
                                        </td>
                                        <td>
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div className="admin-account-actions">
                                                <button type="button" className="admin-reset" onClick={() => setProfileId(u.id)}>
                                                    <Users size={15} /> Inspect profile
                                                </button>
                                                <button type="button" className="admin-reset" disabled={busy} onClick={() => {
                                                    setResetId(u.id);
                                                    setNewPassword("");
                                                    setMessage("");
                                                }}>
                                                    <KeyRound size={15} /> Reset password
                                                </button>
                                                <button type="button" className="admin-reset" disabled={busy} onClick={() => void createLink(u)}>
                                                    <Link2 size={15} /> Create link
                                                </button>
                                                <button type="button" className="admin-reset" onClick={() => viewRequests(u.username)}>
                                                    <Inbox size={15} /> Requests{pendingRequests.filter(r => r.username === u.username).length > 0 ? " (" + pendingRequests.filter(r => r.username === u.username).length + ")" : ""}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>)}
                                </tbody>
                            </table>
                            {!users.length && <p className="admin-empty">No accounts found.</p>}
                        </div>
                        <div className="admin-pages">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                                <ArrowLeft size={15} /> Previous</button>
                            <span>Page {page}
                            </span>
                            <button disabled={users.length < 25} onClick={() => setPage(p => p + 1)}>Next <ArrowRight size={15} />
                            </button>
                        </div>
                    </section>
                    <section className="admin-panel admin-request-panel" id="admin-reset-inbox">
                        <div className="admin-panel-head">
                            <div>
                                <h2><Inbox size={19} /> Forgot password requests {pendingRequests.length > 0 ? "(" + pendingRequests.length + " pending)" : ""}</h2>
                                <p>Check account ownership before approving. Links are shown only to you, not automatically to requesters.</p>
                            </div>
                            <div className="admin-request-tools">
                                {requestFilter && <button type="button" onClick={() => setRequestFilter("")}>Show all</button>}
                                <button type="button" onClick={() => void loadResetRequests()}><Clock3 size={15} /> Refresh</button>
                            </div>
                        </div>
                        <div className="admin-request-list">
                            {visibleRequests.length === 0 && <p className="admin-empty">No requests to review.</p>}
                            {visibleRequests.map(item => <article key={item.id} className="admin-request-row">
                                <div className="admin-request-info">
                                    <strong>@{item.username}</strong>
                                    <span>{new Date(item.created_at).toLocaleString()}</span>
                                    <span className={"admin-request-status " + item.status}>{item.status}</span>
                                </div>
                                {item.status === "pending" && <div className="admin-request-buttons">
                                    <button type="button" className="admin-primary" disabled={busy} onClick={() => void decideRequest(item.id, "approve")}><CheckCircle2 size={15} /> Accept and create link</button>
                                    <button type="button" disabled={busy} onClick={() => void decideRequest(item.id, "reject")}><XCircle size={15} /> Reject</button>
                                </div>}
                                {item.status === "approved" && <span className="admin-request-hint">Link issued. Generate a new link if the original has expired or was lost.</span>}
                            </article>)}
                        </div>
                    </section>
                    </div>}
                    <AdminConsole token={token} section={section} profileId={profileId}
                        onCloseProfile={() => setProfileId(null)} showMessage={setMessage} showError={setError} />
                </main>}
            {error && <div className="admin-toast error" role="alert">
                {error}
                <button onClick={() => setError("")}>×</button>
            </div>}
            {message && <div className="admin-toast" role="status">
                {message}
                <button onClick={() => setMessage("")}>×</button>
            </div>}
            {shareLink && <div className="admin-backdrop" onMouseDown={e => {
                if (e.target === e.currentTarget) {
                    setShareLink(null);
                }
            }}>
                <section className="admin-dialog admin-share-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-share-title">
                    <div className="paw-modal-top admin-reset-header">
                        <div>
                            <h2 id="admin-share-title">One-time reset link</h2>
                            <p className="paw-modal-subtitle">For @{shareLink.username}</p>
                        </div>
                        <button type="button" className="paw-modal-close" aria-label="Close reset link" onClick={() => setShareLink(null)}><X size={19} /></button>
                    </div>
                    <p>The owner chooses their own new password. This link expires in five minutes or immediately after use.</p>
                    <div className="admin-reset-link-options">
                        <div className="admin-reset-link-option">
                            <div className="admin-reset-link-heading">
                                <strong>Local testing</strong>
                                <span>Vite development server</span>
                            </div>
                            <textarea readOnly rows={2} aria-label="Local reset link" value={shareLink.localUrl || "Redeploy Render to enable a local reset link."} onFocus={e => e.currentTarget.select()} />
                            <button type="button" disabled={!shareLink.localUrl} onClick={() => void copyLink("local")}><ClipboardCopy size={15} /> Copy local link</button>
                        </div>
                        <div className="admin-reset-link-option">
                            <div className="admin-reset-link-heading">
                                <strong>Vercel / Live website</strong>
                                <span>Share after deploying the reset page</span>
                            </div>
                            <textarea readOnly rows={2} aria-label="Vercel reset link" value={shareLink.productionUrl} onFocus={e => e.currentTarget.select()} />
                            <button type="button" className="admin-primary" onClick={() => void copyLink("production")}><ClipboardCopy size={15} /> Copy Vercel link</button>
                        </div>
                    </div>
                    <p className="admin-link-expiry">Expires: {new Date(shareLink.expiresAt).toLocaleTimeString()}</p>
                    <p>Both links share the same one-time token. Using either invalidates both. Localhost only works on the computer running your development server. Verify the owner before sending a link.</p>
                    <div className="admin-dialog-actions">
                        <button type="button" onClick={() => setShareLink(null)}>Close</button>
                    </div>
                </section>
            </div>}
            {resetId && <div className="admin-backdrop" onMouseDown={e => {
                if (e.target === e.currentTarget) {
                    setResetId(null)

                }
            }}>
                <form className="admin-dialog" onSubmit={reset}>
                    <div className="paw-modal-top admin-reset-header">
                        <div>
                            <h2>Reset player password</h2>
                            <p className="paw-modal-subtitle">Account management</p>
                        </div>
                        <button type="button" className="paw-modal-close" aria-label="Close password reset" onClick={() => setResetId(null)}>
                            <X size={19} />
                        </button>
                    </div>
                    <p>Set a new temporary password for <b>@{users.find(u => u.id === resetId)?.username}
                    </b>. The original password cannot be viewed.</p>
                    <label>New password<input
                        type="password"
                        autoComplete="new-password"
                        minLength={6}
                        maxLength={100}
                        required
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                    />
                    </label>
                    <div className="admin-dialog-actions">
                        <button type="button" onClick={() => setResetId(null)}>Cancel</button>
                        <button type="submit" className="admin-primary" disabled={busy}>
                            {busy ? "Saving…" : "Reset password"}
                        </button>
                    </div>
                </form>
            </div>}
            <footer className="paw-admin-footer">© {new Date().getFullYear()} PawPal. All rights reserved. · Jorge Jose</footer>
        </div>
    </div>
}
