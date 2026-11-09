import { AlertTriangle, LockKeyhole } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import PetArt from "./PetArt";

type Props = {
    authMode: string;
    forgotTicket: { requestId: string; requestKey: string } | null;
    requestForgotPassword: () => Promise<void>;
    authenticate: () => Promise<void>;
    forgotStatus: string;
    clearForgotRequest: () => void;
    setAuthMode: Dispatch<SetStateAction<string>>;
    username: string;
    setUsername: Dispatch<SetStateAction<string>>;
    password: string;
    setPassword: Dispatch<SetStateAction<string>>;
    setForgotError: Dispatch<SetStateAction<string>>;
    forgotError: string;
    busy: boolean;
    forgotBusy: boolean;
};

export default function AuthScreen({
    authMode,
    forgotTicket,
    requestForgotPassword,
    authenticate,
    forgotStatus,
    clearForgotRequest,
    setAuthMode,
    username,
    setUsername,
    password,
    setPassword,
    setForgotError,
    forgotError,
    busy,
    forgotBusy
}: Props) {
    return (
        <div className="auth-wrap">
            <div className="auth-art">
                <div
                    className="hero-pets paw-auth-svg-pets"
                    role="img"
                    aria-label="A cat, bunny, and dog welcoming you to PawPal"
                >
                    <div className="paw-auth-pet paw-auth-pet-cat">
                        <PetArt species="cat" />
                    </div>
                    <div className="paw-auth-pet paw-auth-pet-bunny">
                        <PetArt species="bunny" />
                    </div>
                    <div className="paw-auth-pet paw-auth-pet-dog">
                        <PetArt species="dog" />
                    </div>
                </div>
                <h1>Little paws, big friendships.</h1>
                <p>A cozy pink world to care, collect, decorate and play.</p>
            </div>
            <form
                className="auth-card"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (authMode === "forgot") {
                        if (!forgotTicket) {
                            void requestForgotPassword();
                        }
                    } else {
                        void authenticate();
                    }
                }}
            >
                <div className="eyebrow">WELCOME TO PAWPAL</div>
                <h2>
                    {authMode === "login"
                        ? "Welcome back!"
                        : authMode === "register"
                          ? "Create your account"
                          : "Forgot password?"}
                </h2>
                {authMode === "forgot" && forgotTicket ? (
                    <div className="paw-forgot-waiting" role="status" aria-live="polite">
                        <LockKeyhole size={30} />
                        <span className="paw-forgot-status">{forgotStatus}</span>
                        <p>
                            {forgotStatus === "approved"
                                ? "Admin approved the request. Ask the admin to send your private, five-minute reset link."
                                : forgotStatus === "rejected"
                                  ? "The request was rejected. Contact an admin if you need help."
                                  : forgotStatus === "completed"
                                    ? "Your password has been updated. You can log in now."
                                    : forgotStatus === "expired"
                                      ? "This request expired. You can send another one."
                                      : "Please wait for the admin's decision. You can leave this tab open; status checks automatically."}
                        </p>
                        <p className="password-safety-note">
                            For security, reset links are shared privately by the admin, not
                            displayed automatically to anyone who knows a username.
                        </p>
                        {forgotStatus !== "pending" && (
                            <button
                                type="button"
                                className="secondary"
                                onClick={clearForgotRequest}
                            >
                                Start a new request
                            </button>
                        )}
                        <button
                            type="button"
                            className="link-button"
                            onClick={() => setAuthMode("login")}
                        >
                            Back to login
                        </button>
                    </div>
                ) : (
                    <>
                        {authMode === "forgot" && (
                            <p>
                                Enter your username and the admin will review your request. You will
                                receive a reset link privately once verified.
                            </p>
                        )}
                        <label>Username</label>
                        <input
                            required
                            minLength={3}
                            maxLength={24}
                            pattern="[a-zA-Z0-9_]{3,24}"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="unique_username"
                        />
                        {authMode === "register" && (
                            <div className="username-warning" role="note">
                                <strong>
                                    <AlertTriangle size={16} aria-hidden="true" /> DON'T USE YOUR
                                    REAL NAME!
                                </strong>
                                <span>
                                    Use a nickname. Your username appears above your pet and is how
                                    friends find you.
                                </span>
                            </div>
                        )}
                        {authMode !== "forgot" && (
                            <>
                                <label>Password</label>
                                <input
                                    type="password"
                                    minLength={6}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="At least 6 characters"
                                />
                            </>
                        )}
                        {authMode === "register" && (
                            <small className="password-safety-note">
                                For your security, please use a unique password that you don't use
                                for your email, social media, or other accounts.
                            </small>
                        )}
                        {authMode === "login" && (
                            <button
                                type="button"
                                className="paw-forgot-link"
                                onClick={() => {
                                    setAuthMode("forgot");
                                    setForgotError("");
                                }}
                            >
                                Forgot password?
                            </button>
                        )}
                        {forgotError && (
                            <p className="paw-recovery-error" role="alert">
                                {forgotError}
                            </p>
                        )}
                        <button disabled={busy || forgotBusy} className="primary">
                            {authMode === "forgot"
                                ? forgotBusy
                                    ? "Submitting..."
                                    : "Request password reset"
                                : authMode === "login"
                                  ? "Log in"
                                  : "Create account"}
                        </button>
                        <button
                            type="button"
                            className="link-button"
                            onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                        >
                            {authMode === "login"
                                ? "New here? Create an account"
                                : authMode === "register"
                                  ? "Already registered? Log in"
                                  : "Back to login"}
                        </button>
                    </>
                )}
            </form>
        </div>
    );
}
