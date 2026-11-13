import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, X } from "lucide-react";
import PetArt from "../../PetArt";
import "./PasswordRecovery.css";

const API = import.meta.env.VITE_API_URL || "";

/*
 * DOCU: Render the reset password interface and provide its feature behavior.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export default function ResetPassword() {
    const [resetToken] = useState(() => {
        // Keep the fragment during the form so a temporary network error can be retried.
        // Fragments are not sent to Vercel or Render in HTTP request URLs.
        const value = window.location.hash.slice(1).trim();
        return /^[a-f0-9]{64}$/.test(value) ? value : "";
    });
    const [checking, setChecking] = useState(true);
    const [valid, setValid] = useState(false);
    const [account, setAccount] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [visible, setVisible] = useState(false);
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!done) {
            return;
        }
        // Show a brief success message, then return to the login form automatically.
        const timer = window.setTimeout(() => {
            window.location.replace("/?login=1&passwordReset=success");
        }, 1200);
        return () => window.clearTimeout(timer);
    }, [done]);

    useEffect(() => {
        if (!resetToken) {
            setChecking(false);
            return;
        }
        let active = true;
                /*
         * DOCU: Verify the current state for this feature.
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
async function verify() {
            try {
                const response = await fetch(API + "/api/auth/password-reset/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: resetToken }),
                    cache: "no-store"
                });
                const result = await response.json();
                if (active) {
                    setValid(Boolean(result.valid));
                    setAccount(String(result.username || ""));
                    if (!response.ok && result.error) {
                        setError(result.error);
                    }
                }
            } catch {
                if (active) {
                    setError("Could not connect to PawPal. Check your connection and refresh the link from your message.");
                }
            } finally {
                if (active) {
                    setChecking(false);
                }
            }
        }
        void verify();
        return () => { active = false; };
    }, [resetToken]);

        /*
     * DOCU: Submit the current state for this feature.
     * @param {React.FormEvent} event - User or browser event that triggered this operation
     * @throws {Error} - Propagates an error when this operation cannot complete.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
async function submit(event: React.FormEvent) {
        event.preventDefault();
        setError("");
        if (password !== confirm) {
            setError("The passwords do not match.");
            return;
        }
        if (password.length < 6 || password.length > 100) {
            setError("Use 6–100 characters for your new password.");
            return;
        }
        setBusy(true);
        try {
            const response = await fetch(API + "/api/auth/password-reset/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: resetToken, newPassword: password }),
                cache: "no-store"
            });
            const result = await response.json();
            if (!response.ok) {
                throw Error(result.error || "Unable to reset password.");
            }
            setPassword("");
            setConfirm("");
            // Resetting a password revokes every existing session for this account.
            // Clear the local credentials before navigating back to PawPal login.
            localStorage.removeItem("pawpal-token");
            sessionStorage.removeItem("pawpal-forgot-ticket");
            window.history.replaceState(null, "", window.location.pathname);
            setDone(true);
        } catch (cause) {
            setError((cause as Error).message);
        } finally {
            setBusy(false);
        }
    }

    return <main className="paw-recovery-page">
        <div className="paw-recovery-side" aria-hidden="true">
            <div className="paw-recovery-pets"><PetArt species="cat" /><PetArt species="bunny" /></div>
            <h1>Little paws, safe accounts.</h1>
            <p>A fresh start for your PawPal adventure.</p>
        </div>
        <section className="paw-recovery-card" aria-labelledby="paw-reset-heading">
            <div className="paw-modal-top">
                <div>
                    <h2 id="paw-reset-heading">Reset your password</h2>
                    <p className="paw-modal-subtitle">PawPal account recovery</p>
                </div>
                <a href="/?login=1" className="paw-modal-close" aria-label="Back to PawPal"><X size={19} /></a>
            </div>
            <div className="paw-recovery-icon"><KeyRound size={29} /></div>
            {checking ? <p role="status">Checking your private reset link...</p> : done ? <div className="paw-recovery-state" role="status">
                <CheckCircle2 size={36} />
                <h3>Password updated</h3>
                <p>Your previous login sessions have been signed out. Log in with your new password.</p>
                <a className="paw-recovery-primary" href="/?login=1&passwordReset=success">Go to login</a>
            </div> : !valid ? <div className="paw-recovery-state" role="alert">
                <LockKeyhole size={36} />
                <h3>Link unavailable</h3>
                <p>{error || "This reset link is invalid, has already been used, or expired after five minutes. Ask the admin for a fresh link."}</p>
                <a className="paw-recovery-primary" href="/?login=1"><ArrowLeft size={16} /> Return to login</a>
            </div> : <form onSubmit={event => void submit(event)}>
                <p>Choose a new password for <strong>@{account}</strong>. The admin will not see it.</p>
                <label>New password
                    <span className="paw-recovery-password">
                        <input type={visible ? "text" : "password"} value={password} minLength={6} maxLength={100} autoComplete="new-password" required placeholder="At least 6 characters" onChange={event => setPassword(event.target.value)} />
                        <button type="button" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible(previous => !previous)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </span>
                </label>
                <label>Confirm new password
                    <input type={visible ? "text" : "password"} value={confirm} minLength={6} maxLength={100} autoComplete="new-password" required placeholder="Re-enter new password" onChange={event => setConfirm(event.target.value)} />
                </label>
                <p className="paw-recovery-hint"><ShieldCheck size={15} /> Single-use link, valid for five minutes after issue.</p>
                {error && <p className="paw-recovery-error" role="alert">{error}</p>}
                <button className="paw-recovery-primary" type="submit" disabled={busy}>{busy ? "Updating password..." : "Save new password"}</button>
            </form>}
        </section>
    </main>;
}
