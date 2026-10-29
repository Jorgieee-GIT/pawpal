import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import PetArt from './PetArt';
import { ClawGrabberArt } from './ArcadeArt';
import './PawClaw.css';
import {Gamepad2,X} from 'lucide-react';

type Pet = { species: string };
type Phase = 'ready' | 'moving' | 'dropping' | 'lifting' | 'prize';

const odds = [
    ['15–20 coins', '56%'],
    ['Claw misses: no prize', '20%'],
    ['25–50 coins', '16%'],
    ['65–80 coins', '4.8%'],
    ['Random unowned room atmosphere', '2.4%'],
    ['5th unlockable breed for your species', '0.8%']
];
const toys = ['cat', 'bunny', 'dog', 'fox', 'hamster', 'panda', 'penguin', 'axolotl'];
const positions = [9, 22, 35, 48, 61, 74, 86, 95];

export default function PawClaw({
    pet,
    onQuit,
    onPlay
}: {
    pet: Pet;
    onQuit: () => void;
    onPlay: () => Promise<{ message?: string } | undefined>;
}) {
    const [cooldownUntil, setCooldownUntil] = useState(() => Number(localStorage.getItem('pawpal-claw-next-play') || 0));
    const [now, setNow] = useState(Date.now());
    const [phase, setPhase] = useState<Phase>('ready');
    const [oddsOpen, setOddsOpen] = useState(false);
    const [prize, setPrize] = useState('');
    const [grabbed, setGrabbed] = useState<number | null>(null);
    const [round, setRound] = useState(0);
    const [busy, setBusy] = useState(false);

    const armRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<number | null>(null);
    const clawXRef = useRef(50);
    const mountedRef = useRef(true);
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const remaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

    useEffect(() => {
        mountedRef.current = true;
        const interval = window.setInterval(() => setNow(Date.now()), 250);
        return () => {
            mountedRef.current = false;
            window.clearInterval(interval);
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
            timersRef.current.forEach(window.clearTimeout);
            timersRef.current = [];
        };
    }, []);

    // Animate the actual claw arm, not React state. The old implementation
    // rerendered the whole cabinet/plush pile on every animation frame.
    useEffect(() => {
        if (phase !== 'moving') return;
        let startTime: number | null = null;
        const animate = (timestamp: number) => {
            if (startTime === null) startTime = timestamp;
            clawXRef.current = 50 + 39 * Math.sin((timestamp - startTime) / 650);
            if (armRef.current) armRef.current.style.left = `${clawXRef.current}%`;
            frameRef.current = requestAnimationFrame(animate);
        };
        frameRef.current = requestAnimationFrame(animate);
        return () => {
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        };
    }, [phase, round]);

    const sleep = (milliseconds: number) => new Promise<void>(resolve => {
        const timeout = window.setTimeout(() => {
            timersRef.current = timersRef.current.filter(timer => timer !== timeout);
            resolve();
        }, milliseconds);
        timersRef.current.push(timeout);
    });

    const start = () => {
        if (busy || Date.now() < cooldownUntil) return;
        clawXRef.current = 50;
        if (armRef.current) armRef.current.style.left = '50%';
        setGrabbed(null);
        setPrize('');
        setPhase('moving');
    };

    async function drop() {
        if (phase !== 'moving' || busy || Date.now() < cooldownUntil) return;
        setBusy(true);
        // Freeze the current position before starting the vertical drop animation.
        const dropX = clawXRef.current;
        if (armRef.current) armRef.current.style.left = `${dropX}%`;
        setPhase('dropping');
        const target = positions.reduce((best, value, index) =>
            Math.abs(value - dropX) < Math.abs(positions[best] - dropX) ? index : best, 0);
        await sleep(930);
        if (!mountedRef.current) return;
        setGrabbed(target);
        setPhase('lifting');
        await sleep(1020);
        if (!mountedRef.current) return;
        try {
            const result = await onPlay();
            if (!mountedRef.current) return;
            const message = result?.message || 'Unable to claim reward. Please try again.';
            if (result?.message && !result.message.startsWith('Wait ')) {
                const until = Date.now() + 15000;
                localStorage.setItem('pawpal-claw-next-play', String(until));
                setCooldownUntil(until);
                setNow(Date.now());
            } else if (result?.message?.startsWith('Wait ')) {
                const seconds = Number(result.message.match(/Wait (\d+)/)?.[1] || 15);
                const until = Date.now() + seconds * 1000;
                localStorage.setItem('pawpal-claw-next-play', String(until));
                setCooldownUntil(until);
                setNow(Date.now());
            }
            setPrize(message);
            if (message.includes('No prize') || message.includes('slipped') || !result?.message) setGrabbed(null);
        } catch {
            if (!mountedRef.current) return;
            setPrize('Unable to claim reward. Please try again.');
            setGrabbed(null);
        }
        if (!mountedRef.current) return;
        setPhase('prize');
        setBusy(false);
    }

    const restart = () => {
        if (Date.now() < cooldownUntil) return;
        setRound(value => value + 1);
        start();
    };

    return (
        <div className="overlay">
            <div className="game-modal paw-claw-modal">
                <header className="paw-arcade-modal-header">
                    <h2><Gamepad2 size={23} aria-hidden="true"/><span>Paw Claw</span></h2>
                    <button className="paw-arcade-exit" type="button" aria-label="Close game" title="Close game" onClick={onQuit}><X size={20}/></button>
                </header>
                <div className="paw-claw-machine" style={{ '--claw-x': '50%' } as CSSProperties}>
                    <div className="paw-claw-top"><span>PAW PAL</span><span>♡ CLAW ♡</span></div>
                    <div className="paw-claw-glass">
                        <button
                            className="paw-arcade-info paw-claw-info-button"
                            type="button"
                            onClick={() => setOddsOpen(true)}
                            aria-label="Prize possibilities and chances"
                            title="Prize possibilities and chances"
                        >!</button>
                        <div className="paw-claw-rail" />
                        <div ref={armRef} className={`paw-claw-arm ${phase === 'dropping' ? 'dropping' : phase === 'lifting' ? 'lifting' : ''}`}>
                            <div className="paw-claw-wire" />
                            <ClawGrabberArt/>
                            {grabbed !== null && phase === 'lifting' && (
                                <div className="paw-claw-caught"><PetArt species={toys[grabbed]} /></div>
                            )}
                        </div>
                        <div className="paw-claw-pile" key={round}>
                            {toys.map((species, index) => (
                                <div
                                    className={`paw-claw-plush paw-claw-plush-${index}${grabbed === index && phase === 'lifting' ? ' caught' : ''}`}
                                    key={species}
                                    style={{ '--tilt': `${index % 2 === 0 ? -10 : 12}deg` } as CSSProperties}
                                >
                                    <PetArt species={species} />
                                </div>
                            ))}
                        </div>
                        <div className="paw-claw-shelf" />
                        <div className="paw-claw-chute">PRIZE ♡</div>
                    </div>
                    <div className="paw-claw-base">
                        <div className="paw-claw-joystick"><i /></div>
                        <div className="paw-claw-base-text">CATCH A LITTLE FRIEND</div>
                        <div className="paw-claw-button-art" />
                    </div>
                </div>
                <div className="paw-claw-actions" aria-live="polite">
                    {phase === 'ready' ? (
                        <button className="primary" disabled={remaining > 0} onClick={start}>
                            {remaining > 0 ? `Wait ${remaining}s to play` : 'Start playing'}
                        </button>
                    ) : phase === 'moving' ? (
                        <>
                            <p className="paw-claw-motion-hint">The claw is moving! Pick your moment.</p>
                            <button className="primary" disabled={remaining > 0 || busy} onClick={() => void drop()}>
                                {remaining > 0 ? `Wait ${remaining}s` : 'DROP CLAW!'}
                            </button>
                        </>
                    ) : phase === 'dropping' || phase === 'lifting' ? (
                        <p>Claw in motion…</p>
                    ) : (
                        <>
                            <p className="paw-claw-prize">{prize}</p>
                            <button className="primary" disabled={busy || remaining > 0} onClick={restart}>
                                {remaining > 0 ? `Play again in ${remaining}s` : 'Play again'}
                            </button>
                        </>
                    )}
                </div>
                <small className="paw-claw-footnote">15-second reward cooldown</small>
                {oddsOpen && (
                    <div className="paw-modal-backdrop" onMouseDown={event => {
                        if (event.target === event.currentTarget) setOddsOpen(false);
                    }}>
                        <section className="paw-modal" role="dialog" aria-modal="true" aria-label="Paw Claw prize chances">
                            <h2>Prize possibilities ♡</h2>
                            <p>Chances per drop (including misses):</p>
                            <div className="paw-claw-odds">
                                {odds.map(([name, chance]) => <div key={name}><span>{name}</span><b>{chance}</b></div>)}
                            </div>
                            <p><small>Already-owned rare prizes convert to bonus coins. The pet artwork represents the plushies, not a guaranteed breed reward.</small></p>
                            <button className="primary" onClick={() => setOddsOpen(false)}>Got it!</button>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
