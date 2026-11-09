import { Heart, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import PetArt from "./PetArt";
import type { RoomPet } from "./types";

// Batch 11: status artwork is driven by saved pet stats, including friends' pets.
function PetCondition({ pet }: { pet: RoomPet }) {
    const dirty = pet.cleanliness < 35,
        sad = pet.happiness < 35,
        sleepy = pet.energy < 30,
        hungry = pet.hunger < 30,
        lonely = pet.affection < 30;
    if (!dirty && !sad && !sleepy && !hungry && !lonely) {
        return null;
    }
    return (
        <div
            className="paw-condition-overlay"
            aria-label={[
                dirty ? "Needs a bath" : null,
                sad ? "Feeling sad" : null,
                sleepy ? "Sleepy" : null,
                hungry ? "Hungry" : null,
                lonely ? "Lonely" : null
            ]
                .filter(Boolean)
                .join(", ")}
        >
            {dirty && (
                <svg className="paw-condition-dirt" viewBox="0 0 100 100" aria-hidden="true">
                    <ellipse cx="26" cy="64" rx="10" ry="6" fill="#b19b87" opacity=".55" />
                    <ellipse cx="73" cy="70" rx="8" ry="5" fill="#b19b87" opacity=".5" />
                    <circle cx="43" cy="78" r="4" fill="#aa917d" opacity=".45" />
                </svg>
            )}
            {(sad || hungry || lonely) && (
                <svg className="paw-condition-face" viewBox="0 0 100 100" aria-hidden="true">
                    <path
                        d="M43 70 Q50 63 57 70"
                        stroke="#835a73"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        fill="none"
                    />
                    {sad && <path d="M28 56 Q25 63 29 67 Q34 64 28 56" fill="#8bc5e8" />}
                    {hungry && (
                        <path
                            d="M63 73 Q68 76 72 73"
                            stroke="#9a647d"
                            strokeWidth="2"
                            fill="none"
                        />
                    )}
                </svg>
            )}
            {sleepy && (
                <span className="paw-condition-sleep" aria-hidden="true">
                    z<sup>z</sup>
                </span>
            )}
            {lonely && (
                <span className="paw-condition-heart" aria-hidden="true">
                    ♡
                </span>
            )}
        </div>
    );
}

export function Wanderer({
    pet,
    own,
    index,
    sleeping = false,
    bathing = false,
    cuddling = false,
    onScrub,
    onPet,
    onToggleNote,
    noteOpen
}: {
    pet: RoomPet;
    own: boolean;
    index: number;
    sleeping?: boolean;
    bathing?: boolean;
    cuddling?: boolean;
    onScrub?: () => void;
    onPet?: () => void;
    onToggleNote?: (petId: string) => void;
    noteOpen?: boolean;
}) {
    const [x, setX] = useState(12 + ((index * 19) % 76));
    const [flip, setFlip] = useState(false);
    const [pose, setPose] = useState("walk");
    const spongeRef = useRef<HTMLSpanElement | null>(null);
    const hasActiveNote = Boolean(
        pet.pet_note?.trim() &&
        pet.note_expires_at &&
        new Date(pet.note_expires_at).getTime() > Date.now()
    );
    const moveSponge = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!bathing || !own || !spongeRef.current) {
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        spongeRef.current.style.left = x + "%";
        spongeRef.current.style.top = y + "%";
        spongeRef.current.classList.add("is-visible");
    };
    useEffect(() => {
        if (sleeping) {
            setPose("nap");
            return;
        }
        const wander = () => {
            if (document.visibilityState !== "visible") {
                return;
            }
            const next = 10 + Math.random() * 80;
            setX((previous) => {
                setFlip(next < previous);
                return next;
            });
            setPose(Math.random() < 0.22 ? "nap" : "walk");
        };
        const timer = window.setInterval(wander, 2600 + index * 270);
        return () => window.clearInterval(timer);
    }, [index, sleeping]);
    return (
        <div
            className={"wanderer " + (own ? "own" : "") + (sleeping ? " paw-is-sleeping" : "")}
            style={{
                left: `${x}%`,
                bottom: `${8 + (index % 3) * 7}%`,
                zIndex: 10 + index
            }}
        >
            <div className={"nameplate" + (hasActiveNote ? " paw-nameplate-has-note" : "")}>
                <div className="paw-nameplate-title">
                    <b>{pet.name}</b>
                    {hasActiveNote && (
                        <button
                            type="button"
                            className={"paw-note-indicator" + (noteOpen ? " is-open" : "")}
                            aria-label={`Read ${pet.name}'s Pet Note`}
                            title={`${pet.name} has a note`}
                            aria-expanded={Boolean(noteOpen)}
                            aria-controls={noteOpen ? "paw-room-note-popover" : undefined}
                            onClick={(event) => {
                                event.stopPropagation();
                                onToggleNote?.(pet.id);
                            }}
                        >
                            <Mail size={14} strokeWidth={2.3} aria-hidden="true" />
                            <Heart
                                size={7}
                                strokeWidth={2.4}
                                className="paw-note-indicator-heart"
                                aria-hidden="true"
                            />
                        </button>
                    )}
                </div>
                <small>
                    @{pet.username}
                    {own ? " · YOU" : ""}
                </small>
            </div>
            <div
                className={
                    "pet-body " +
                    (sleeping || pose === "nap" ? "nap" : "") +
                    ((bathing || cuddling) && own ? " paw-scrub-target" : "") +
                    (cuddling && own ? " paw-cuddle-target" : "")
                }
                onPointerDown={(e) => {
                    moveSponge(e);
                    if ((bathing || cuddling) && own) {
                        e.preventDefault();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        if (bathing) {
                            onScrub?.();
                        } else {
                            onPet?.();
                        }
                    }
                }}
                onPointerMove={(e) => {
                    moveSponge(e);
                    if (
                        (bathing || cuddling) &&
                        own &&
                        (e.buttons === 1 ||
                            (e.pointerType === "touch" &&
                                e.currentTarget.hasPointerCapture(e.pointerId)))
                    ) {
                        if (bathing) {
                            onScrub?.();
                        } else {
                            onPet?.();
                        }
                    }
                }}
                onPointerLeave={() => spongeRef.current?.classList.remove("is-visible")}
                onPointerUp={(e) => {
                    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                    }
                }}
                onPointerCancel={(e) => {
                    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                    }
                }}
            >
                <div
                    className="paw-pet-art-transform"
                    style={{
                        transform: `scaleX(${flip ? -1 : 1}) scale(${pet.level < 5 ? 0.7 : pet.level < 30 ? 1 : 1.3})`
                    }}
                >
                    <PetArt
                        species={pet.species}
                        color={pet.color}
                        breed={pet.breed}
                        cosmetic={pet.equipped_cosmetic}
                        outfit={pet.equipped_outfit}
                        sleeping={sleeping || cuddling}
                    />
                    <PetCondition pet={pet} />
                </div>
                {bathing && own && (
                    <span
                        ref={spongeRef}
                        className="paw-svg-sponge"
                        style={{
                            left: "50%",
                            top: "50%"
                        }}
                        aria-hidden="true"
                    >
                        <svg
                            viewBox="0 0 64 64"
                            width="54"
                            height="54"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M11 20 Q13 8 28 9 L47 13 Q57 15 54 29 L49 47 Q46 56 33 53 L15 48 Q7 45 9 34 Z"
                                fill="#ffe3a0"
                                stroke="#9b7751"
                                strokeWidth="3.5"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M16 22 Q28 14 46 21"
                                fill="none"
                                stroke="#fff6d7"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                            <circle cx="23" cy="31" r="3" fill="#d7b878" />
                            <circle cx="39" cy="38" r="4" fill="#d7b878" />
                            <circle cx="32" cy="22" r="2" fill="#d7b878" />
                            <circle cx="20" cy="43" r="2" fill="#d7b878" />
                            <circle
                                cx="49"
                                cy="9"
                                r="5"
                                fill="#d7f4ff"
                                stroke="#8ccbd9"
                                strokeWidth="2"
                            />
                            <circle
                                cx="57"
                                cy="17"
                                r="3"
                                fill="#d7f4ff"
                                stroke="#8ccbd9"
                                strokeWidth="1.5"
                            />
                        </svg>
                    </span>
                )}
                {cuddling && own && (
                    <span className="paw-cuddle-hearts" aria-hidden="true">
                        ♡ ♡
                    </span>
                )}
                {sleeping && (
                    <span className="paw-sleep-zzz" aria-label="Sleeping">
                        Z<sup>z</sup>
                    </span>
                )}
            </div>
        </div>
    );
}
