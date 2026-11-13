import { PawPrint, Heart, Sparkles, Users, Swords } from "lucide-react";
import { flushSync } from "react-dom";
import PetArt from "./PetArt";
/*
 * DOCU: Render the public welcome interface and provide its feature behavior.
 * @param {{ onLogin: () => void; onRegister: () => void; onPolicy: (page: "privacy" | "terms") => void }} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export default function PublicWelcome({ onLogin, onRegister, onPolicy }: { onLogin: () => void; onRegister: () => void; onPolicy: (page: "privacy" | "terms") => void }) {
        /*
     * DOCU: Handle transition to behavior for this feature.
     * @param {() => void} callback - Callback to run when this operation completes
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const transitionTo = (callback: () => void) => {
        const doc = document as Document & { startViewTransition?: (update: () => void) => unknown };
        if (doc.startViewTransition) doc.startViewTransition(() => flushSync(callback));
        else callback();
    };
    return <main className="paw-welcome">
        <header className="paw-welcome-header"><a href="/" className="paw-welcome-logo"><PawPrint/> PawPal</a><div><button className="paw-welcome-login" onClick={() => transitionTo(onLogin)}>Log in</button><button className="paw-welcome-join" onClick={() => transitionTo(onRegister)}>Create account</button></div></header>
        <section className="paw-welcome-hero"><div className="paw-welcome-copy"><span className="paw-welcome-kicker"><Sparkles size={15}/> YOUR COZY PET WORLD</span><h1>A little world to call <em>your own.</em></h1><p>Adopt a companion, make a home together, and share the fun with friends in PawPal.</p><button className="paw-welcome-join paw-welcome-cta" onClick={() => transitionTo(onRegister)}>Create your account <span>→</span></button></div><div className="paw-welcome-pets paw-auth-svg-pets" aria-label="PawPal pets"><div className="paw-welcome-pet pet-cat paw-auth-pet paw-auth-pet-cat"><PetArt species="cat"/></div><div className="paw-welcome-pet pet-bunny paw-auth-pet paw-auth-pet-bunny"><PetArt species="bunny"/></div><div className="paw-welcome-pet pet-dog paw-auth-pet paw-auth-pet-dog"><PetArt species="dog"/></div><span className="paw-welcome-heart"><Heart fill="currentColor"/></span></div></section>
        <section className="paw-welcome-features"><article><span><Heart/></span><h2>Care and grow</h2></article><article><span><Sparkles/></span><h2>Make it yours</h2></article><article><span><Users/></span><h2>Play together</h2></article><article><span><Swords/></span><h2>Take a break</h2></article></section>
        <footer className="paw-welcome-footer"><nav><button onClick={() => onPolicy("privacy")}>Privacy Policy</button><button onClick={() => onPolicy("terms")}>Terms of Service</button></nav></footer>
    </main>;
}
