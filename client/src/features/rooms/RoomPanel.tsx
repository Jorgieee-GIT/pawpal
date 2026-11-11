import {
    Bath,
    Check,
    Coins,
    Droplets,
    Eye,
    EyeOff,
    Gamepad2,
    Heart,
    HeartHandshake,
    LockKeyhole,
    Mail,
    Moon,
    PawPrint,
    Sun,
    Utensils,
    X
} from "lucide-react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { API } from "../../api";
import { FoodArt } from "../kitchen/KitchenArt";
import RoomArchitecture from "./RoomArchitecture";
import { DEFAULTS, FURNITURE, RoomFurniture, furnitureLayout } from "./RoomFurniture";
import { Wanderer } from "./RoomPets";
import { ITEM_LEVEL_REQUIREMENTS, roomThemeNames, store, themes } from "../../shopCatalog";
import type { ExecuteAction, MealData, Pet, RoomPet, User } from "../../types";

type Props = {
    pet: Pet;
    roomMenuOpen: boolean;
    setRoomMenuOpen: Dispatch<SetStateAction<boolean>>;
    busy: boolean;
    execute: ExecuteAction;
    setSelectedFurniture: Dispatch<SetStateAction<string | null>>;
    setEditFurniture: Dispatch<SetStateAction<boolean>>;
    refresh: () => Promise<void>;
    setThemeModal: Dispatch<SetStateAction<boolean>>;
    roomColors: [string, string, string];
    hideVisitingPets: boolean;
    toggleVisitingPets: () => void;
    setNoteDraft: Dispatch<SetStateAction<string>>;
    user: User;
    setEditingNote: Dispatch<SetStateAction<boolean>>;
    themeModal: boolean;
    setMealModal: Dispatch<SetStateAction<boolean>>;
    setMealBusy: Dispatch<SetStateAction<boolean>>;
    token: string;
    setMealData: Dispatch<SetStateAction<MealData | null>>;
    setNotice: Dispatch<SetStateAction<string>>;
    setPlayPickerOpen: Dispatch<SetStateAction<boolean>>;
    sleepPending: boolean;
    togglePetSleep: () => Promise<void>;
    bathMode: boolean;
    setBathMode: Dispatch<SetStateAction<boolean>>;
    setCuddleMode: Dispatch<SetStateAction<boolean>>;
    bathScrubbing: RefObject<boolean>;
    cuddleActive: RefObject<boolean>;
    cuddleMode: boolean;
    editFurniture: boolean;
    selectedFurniture: string | null;
    visible: RoomPet[];
    cuddleLastMove: RefObject<number>;
    bathLastMove: RefObject<number>;
    setOpenRoomNoteId: Dispatch<SetStateAction<string | null>>;
    openRoomNoteId: string | null;
    openedRoomNote: RoomPet | undefined;
    mealModal: boolean;
    mealBusy: boolean;
    mealData: MealData | null;
};

export default function RoomPanel({
    pet,
    roomMenuOpen,
    setRoomMenuOpen,
    busy,
    execute,
    setSelectedFurniture,
    setEditFurniture,
    refresh,
    setThemeModal,
    roomColors,
    hideVisitingPets,
    toggleVisitingPets,
    setNoteDraft,
    user,
    setEditingNote,
    themeModal,
    setMealModal,
    setMealBusy,
    token,
    setMealData,
    setNotice,
    setPlayPickerOpen,
    sleepPending,
    togglePetSleep,
    bathMode,
    setBathMode,
    setCuddleMode,
    bathScrubbing,
    cuddleActive,
    cuddleMode,
    editFurniture,
    selectedFurniture,
    visible,
    cuddleLastMove,
    bathLastMove,
    setOpenRoomNoteId,
    openRoomNoteId,
    openedRoomNote,
    mealModal,
    mealBusy,
    mealData
}: Props) {
    return (
        <>
            <section className="paw-stats-hud" aria-label="Pet stats">
                <div className="paw-hud-title">
                    <b>{pet.name}</b>
                    <small>Level {pet.level}</small>
                </div>
                <div className="paw-hud-grid">
                    {(
                        [
                            ["Fullness", pet.hunger, "#eeb06d"],
                            ["Happiness", pet.happiness, "#ed91b3"],
                            ["Energy", pet.energy, "#9b9fe7"],
                            ["Cleanliness", pet.cleanliness, "#79c7d5"],
                            ["Affection", pet.affection, "#b69ce3"]
                        ] as [string, number, string][]
                    ).map(([label, value, color]) => (
                        <div
                            className={"paw-hud-stat" + (value < 25 ? " paw-hud-low" : "")}
                            key={label}
                        >
                            <div className="paw-hud-label">
                                <span>{label}</span>
                                <b>{value}%</b>
                            </div>
                            <div className="paw-hud-track">
                                <div
                                    style={{
                                        width: `${Math.max(0, Math.min(100, value))}%`,
                                        background: color
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <section className="room-card">
                <div className="paw-room-toolbar">
                    <div className="paw-room-dropdown">
                        <button
                            className="paw-room-dropdown-trigger"
                            aria-expanded={roomMenuOpen}
                            onClick={() => setRoomMenuOpen((v) => !v)}
                        >
                            ☰{" "}
                            {
                                (
                                    {
                                        living: "Room",
                                        bedroom: "Bedroom",
                                        studio: "Creative Studio",
                                        sports: "Sports Room"
                                    } as Record<string, string>
                                )[pet.active_room || "living"]
                            }{" "}
                            ▾
                        </button>
                        {roomMenuOpen && (
                            <div className="paw-room-dropdown-list">
                                {(
                                    [
                                        ["living", "Room"],
                                        ["bedroom", "Bedroom"],
                                        ["studio", "Creative Studio"],
                                        ["sports", "Sports Room"]
                                    ] as const
                                ).map(([id, label]) => {
                                    const owned =
                                        id === "living" ||
                                        id === "bedroom" ||
                                        (pet.unlocked_rooms || []).includes(id);
                                    return (
                                        <button
                                            key={id}
                                            disabled={busy}
                                            className={
                                                (pet.active_room || "living") === id ? "active" : ""
                                            }
                                            onClick={async () => {
                                                const result = await execute("/rooms", {
                                                    room: id,
                                                    action: owned ? "enter" : "unlock"
                                                });
                                                if (result) {
                                                    setRoomMenuOpen(false);
                                                    setSelectedFurniture(null);
                                                    setEditFurniture(false);
                                                    await refresh();
                                                }
                                            }}
                                        >
                                            {label}
                                            {!owned && (
                                                <small>
                                                    <LockKeyhole size={13} aria-hidden="true" />{" "}
                                                    {id === "studio" ? "5,000" : "8,000"} coins
                                                </small>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="paw-room-tools">
                        <button
                            type="button"
                            className="paw-room-theme-trigger"
                            onClick={() => setThemeModal(true)}
                            aria-label="Change room atmosphere"
                            title="Room atmosphere"
                        >
                            <svg
                                className="paw-room-theme-svg"
                                viewBox="0 0 76 42"
                                preserveAspectRatio="none"
                                aria-hidden="true"
                            >
                                <rect width="76" height="42" fill={roomColors[0]} />
                                <path d="M0 25H76V42H0Z" fill={roomColors[1]} />
                                <circle cx="45" cy="17" r="10" fill={roomColors[2]} opacity=".72" />
                                <path
                                    d="M14 11h11M19.5 5.5v11"
                                    stroke="white"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className={`paw-room-visitor-toggle ${hideVisitingPets ? "is-hidden" : ""}`}
                            onClick={toggleVisitingPets}
                            aria-pressed={hideVisitingPets}
                            aria-label={
                                hideVisitingPets
                                    ? "Show friends' visiting pets"
                                    : "Hide friends' visiting pets"
                            }
                            title={hideVisitingPets ? "Show visiting pets" : "Hide visiting pets"}
                        >
                            {hideVisitingPets ? (
                                <EyeOff size={21} aria-hidden="true" />
                            ) : (
                                <Eye size={21} aria-hidden="true" />
                            )}
                        </button>
                        <button
                            type="button"
                            className="paw-room-note-trigger"
                            onClick={() => {
                                setNoteDraft(user.pet_note || "");
                                setEditingNote(true);
                            }}
                            aria-label="Edit Pet Note"
                            title="Pet Note"
                        >
                            <span className="paw-pet-note-icon" aria-hidden="true">
                                <Mail size={21} strokeWidth={1.85} />
                                <PawPrint size={12} strokeWidth={2.1} />
                            </span>
                        </button>
                    </div>
                </div>
                {themeModal && (
                    <div
                        className="paw-modal-backdrop"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) {
                                setThemeModal(false);
                            }
                        }}
                    >
                        <section
                            className="paw-modal paw-theme-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="paw-theme-title"
                        >
                            <div className="paw-modal-top">
                                <div>
                                    <h2 id="paw-theme-title">Room atmosphere</h2>
                                    <p className="paw-modal-subtitle">Make it yours</p>
                                </div>
                                <button
                                    className="paw-modal-close"
                                    aria-label="Close atmosphere selector"
                                    onClick={() => setThemeModal(false)}
                                >
                                    <X size={19} strokeWidth={1.8} aria-hidden="true" />
                                </button>
                            </div>
                            <div className="paw-theme-picker">
                                <div className="paw-theme-options">
                                    {Object.entries(roomThemeNames)
                                        .sort(
                                            ([a], [b]) =>
                                                (ITEM_LEVEL_REQUIREMENTS[a] || 1) -
                                                (ITEM_LEVEL_REQUIREMENTS[b] || 1)
                                        )
                                        .map(([id, name]) => {
                                            const colors = themes[id];
                                            const owned =
                                                id === "blush" || pet.owned_items.includes(id);
                                            const active = (pet.room_theme || "blush") === id;
                                            const required = ITEM_LEVEL_REQUIREMENTS[id] || 1;
                                            const unlocked = pet.level >= required;
                                            const price =
                                                store.find((item) => item[0] === id)?.[3] || 0;
                                            return (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    className={
                                                        "paw-theme-option " +
                                                        (active
                                                            ? "active "
                                                            : owned
                                                              ? "owned "
                                                              : "") +
                                                        (!owned ? "unowned " : "") +
                                                        (!unlocked && !owned ? "level-locked" : "")
                                                    }
                                                    disabled={
                                                        busy || active || (!owned && !unlocked)
                                                    }
                                                    title={
                                                        active
                                                            ? "Currently applied"
                                                            : owned
                                                              ? "Apply this atmosphere"
                                                              : !unlocked
                                                                ? `Unlocks at Level ${required}`
                                                                : `Buy for ${price.toLocaleString()} Paw Coins`
                                                    }
                                                    onClick={() =>
                                                        void execute("/item", {
                                                            item: id,
                                                            mode: owned ? "equip" : "buy"
                                                        })
                                                    }
                                                >
                                                    {active && (
                                                        <span className="paw-theme-current-tag">
                                                            <Check size={12} /> In use
                                                        </span>
                                                    )}
                                                    <span
                                                        className="paw-theme-swatch"
                                                        style={{
                                                            background: `linear-gradient(155deg, ${colors[0]} 54%, ${colors[1]} 54%)`
                                                        }}
                                                    >
                                                        <i
                                                            style={{
                                                                background: colors[2]
                                                            }}
                                                        />
                                                    </span>
                                                    <span className="paw-theme-name">{name}</span>
                                                    <span
                                                        className={
                                                            "paw-theme-action-label " +
                                                            (active
                                                                ? "is-selected"
                                                                : owned
                                                                  ? "can-apply"
                                                                  : unlocked
                                                                    ? "can-buy"
                                                                    : "is-locked")
                                                        }
                                                    >
                                                        {active ? (
                                                            <>
                                                                <Check
                                                                    size={12}
                                                                    aria-hidden="true"
                                                                />{" "}
                                                                Selected
                                                            </>
                                                        ) : owned ? (
                                                            "Apply"
                                                        ) : unlocked ? (
                                                            <>
                                                                <Coins
                                                                    size={13}
                                                                    aria-hidden="true"
                                                                />{" "}
                                                                Buy · {price.toLocaleString()}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <LockKeyhole
                                                                    size={12}
                                                                    aria-hidden="true"
                                                                />{" "}
                                                                Level {required}
                                                            </>
                                                        )}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                        </section>
                    </div>
                )}
                <div
                    className={
                        "living-room paw-themed-room " +
                        (pet.garden?._sleeping ? "paw-room-sleeping " : "") +
                        "paw-theme-" +
                        (pet.room_theme || "blush") +
                        " paw-room-" +
                        (pet.active_room || "living")
                    }
                    style={
                        {
                            "--wall": roomColors[0],
                            "--floor": roomColors[1],
                            "--room-accent": roomColors[2]
                        } as React.CSSProperties
                    }
                >
                    {pet.garden?._sleeping && (
                        <div className="paw-room-night-overlay" aria-hidden="true" />
                    )}
                    <button
                        type="button"
                        className="paw-room-meals-trigger"
                        aria-label="Feed pet"
                        title="Feed pet"
                        onClick={async () => {
                            setMealModal(true);
                            setMealBusy(true);
                            try {
                                const response = await fetch(API + "/api/kitchen", {
                                    headers: {
                                        Authorization: "Bearer " + token
                                    }
                                });
                                const data = await response.json();
                                if (!response.ok) {
                                    throw Error(data.error || "Unable to load meals");
                                }
                                setMealData({
                                    meals: data.kitchen?.meals || {},
                                    recipes: data.recipes || {}
                                });
                            } catch (e) {
                                setNotice(e instanceof Error ? e.message : "Unable to load meals");
                            } finally {
                                setMealBusy(false);
                            }
                        }}
                    >
                        <Utensils size={21} strokeWidth={2} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className="paw-room-action paw-room-play"
                        aria-label="Play games"
                        title="Play games"
                        onClick={() => setPlayPickerOpen(true)}
                    >
                        <Gamepad2 size={21} />
                    </button>
                    <button
                        type="button"
                        className={
                            "paw-room-action paw-room-nap " +
                            (pet.garden?._sleeping ? "active" : "")
                        }
                        aria-label={pet.garden?._sleeping ? "Wake pet" : "Put pet to sleep"}
                        title={pet.garden?._sleeping ? "Wake pet" : "Put pet to sleep"}
                        aria-busy={sleepPending}
                        onClick={() => void togglePetSleep()}
                    >
                        {pet.garden?._sleeping ? <Sun size={21} /> : <Moon size={21} />}
                    </button>
                    <button
                        type="button"
                        className={"paw-room-action paw-room-bathe " + (bathMode ? "active" : "")}
                        aria-label={bathMode ? "Finish bathing" : "Bathe pet"}
                        title={bathMode ? "Finish bathing" : "Bathe pet"}
                        onClick={() => {
                            setBathMode((v) => !v);
                            setCuddleMode(false);
                            bathScrubbing.current = false;
                            cuddleActive.current = false;
                        }}
                    >
                        <Bath size={21} />
                    </button>
                    <button
                        type="button"
                        className={
                            "paw-room-action paw-room-cuddle " + (cuddleMode ? "active" : "")
                        }
                        aria-label={cuddleMode ? "Finish cuddling" : "Cuddle pet"}
                        title={cuddleMode ? "Finish cuddling" : "Cuddle pet"}
                        onClick={() => {
                            setCuddleMode((v) => !v);
                            setBathMode(false);
                            bathScrubbing.current = false;
                            cuddleActive.current = false;
                        }}
                    >
                        <HeartHandshake size={21} />
                    </button>
                    {cuddleMode && (
                        <div className="paw-cuddle-hint" role="status">
                            <Heart size={14} /> Gently stroke your pet · +4 affection/sec
                        </div>
                    )}
                    {bathMode && (
                        <div className="paw-bath-hint" role="status">
                            <Droplets size={14} /> Hold and scrub your pet · +5 cleanliness/sec
                        </div>
                    )}
                    {pet.garden?._sleeping && (
                        <div className="paw-sleep-status" role="status">
                            <Moon size={14} /> Sleeping · 25% slower stat decay
                        </div>
                    )}
                    <div className="wall-art">♡</div>
                    <RoomArchitecture room={pet.active_room || "living"} />
                    <RoomFurniture
                        room={pet.active_room || "living"}
                        layout={furnitureLayout(pet.active_room || "living", pet.room_layouts)}
                        editing={editFurniture}
                        selected={selectedFurniture}
                        onSelect={setSelectedFurniture}
                        onMove={(id, x, y) =>
                            void execute("/furniture", {
                                room: pet.active_room || "living",
                                action: "move",
                                item: id,
                                x,
                                y
                            })
                        }
                    />
                    {pet.active_room === "bedroom" && (
                        <div className="paw-room-feature paw-bedroom-feature">
                            ☾ <span>Dream nook</span>
                        </div>
                    )}
                    {pet.active_room === "studio" && (
                        <div className="paw-room-feature paw-studio-feature">
                            ✎ <span>Art corner</span>
                        </div>
                    )}
                    {pet.active_room === "sports" && (
                        <div className="paw-room-feature paw-sports-feature">
                            ✦ <span>Play zone</span>
                        </div>
                    )}
                    <div className="room-lights">✦ ✧ ✦ ✧ ✦</div>
                    <div className="rug">♡</div>
                    {visible.map((p, i) => (
                        <Wanderer
                            key={p.id}
                            pet={p}
                            own={p.user_id === user.id}
                            index={i}
                            sleeping={
                                p.user_id === user.id ? !!pet.garden?._sleeping : !!p.sleeping
                            }
                            bathing={bathMode && p.user_id === user.id}
                            cuddling={cuddleMode && p.user_id === user.id}
                            onPet={() => {
                                cuddleActive.current = true;
                                cuddleLastMove.current = Date.now();
                            }}
                            onScrub={() => {
                                bathScrubbing.current = true;
                                bathLastMove.current = Date.now();
                            }}
                            onToggleNote={(petId) =>
                                setOpenRoomNoteId((current) => (current === petId ? null : petId))
                            }
                            noteOpen={openRoomNoteId === p.id}
                        />
                    ))}
                    {openedRoomNote && (
                        <aside
                            id="paw-room-note-popover"
                            className="paw-room-note-popover"
                            role="region"
                            aria-label={`${openedRoomNote.name}'s Pet Note`}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="paw-room-note-popover-header">
                                <span className="paw-room-note-popover-from">
                                    <Mail size={15} aria-hidden="true" /> {openedRoomNote.name}'s
                                    note
                                </span>
                                <button
                                    type="button"
                                    className="paw-room-note-popover-close"
                                    aria-label="Close Pet Note"
                                    onClick={() => setOpenRoomNoteId(null)}
                                >
                                    <X size={15} aria-hidden="true" />
                                </button>
                            </div>
                            <p>{openedRoomNote.pet_note}</p>
                            <small>@{openedRoomNote.username}</small>
                        </aside>
                    )}
                </div>
                <div className="paw-furniture-editor">
                    <div className="paw-furniture-editor-top">
                        <b>Room furniture</b>
                        <button
                            className="secondary"
                            onClick={() => {
                                setEditFurniture((v) => !v);
                                setSelectedFurniture(null);
                            }}
                        >
                            {editFurniture ? "Done decorating" : "Decorate"}
                        </button>
                    </div>
                    {editFurniture && (
                        <>
                            <div className="paw-furniture-placed">
                                {furnitureLayout(pet.active_room || "living", pet.room_layouts).map(
                                    (f) => (
                                        <button
                                            className={selectedFurniture === f.id ? "active" : ""}
                                            key={f.id}
                                            onClick={() => setSelectedFurniture(f.id)}
                                        >
                                            {FURNITURE[f.id]?.name || f.id}
                                        </button>
                                    )
                                )}
                            </div>
                            {selectedFurniture && (
                                <button
                                    className="secondary"
                                    onClick={async () => {
                                        const r = await execute("/furniture", {
                                            room: pet.active_room || "living",
                                            action: "store",
                                            item: selectedFurniture
                                        });
                                        if (r) {
                                            setSelectedFurniture(null);
                                        }
                                    }}
                                >
                                    Store selected furniture
                                </button>
                            )}
                            <h4>Available to place</h4>
                            <div className="paw-furniture-placed">
                                {[
                                    ...DEFAULTS[pet.active_room || "living"],
                                    ...pet.owned_items.filter(
                                        (id) =>
                                            FURNITURE[id]?.room === (pet.active_room || "living")
                                    )
                                ]
                                    .filter(
                                        (id) =>
                                            !furnitureLayout(
                                                pet.active_room || "living",
                                                pet.room_layouts
                                            ).some((f) => f.id === id)
                                    )
                                    .map((id) => (
                                        <button
                                            key={id}
                                            onClick={() =>
                                                void execute("/furniture", {
                                                    room: pet.active_room || "living",
                                                    action: "place",
                                                    item: id
                                                })
                                            }
                                        >
                                            ＋ {FURNITURE[id]?.name}
                                        </button>
                                    ))}
                            </div>
                            <button
                                className="secondary"
                                onClick={() =>
                                    void execute("/furniture", {
                                        room: pet.active_room || "living",
                                        action: "reset"
                                    })
                                }
                            >
                                Restore default layout
                            </button>
                        </>
                    )}
                </div>
            </section>
            {mealModal && (
                <div
                    className="paw-meals-backdrop"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            setMealModal(false);
                        }
                    }}
                >
                    <section
                        className="paw-meals-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Feed your pet"
                    >
                        <div className="paw-meals-header">
                            <div>
                                <h3>Feed your pet</h3>
                                <p className="paw-modal-subtitle">From your Kitchen</p>
                            </div>
                            <button
                                type="button"
                                className="paw-modal-close"
                                aria-label="Close meals"
                                onClick={() => setMealModal(false)}
                            >
                                <X size={19} />
                            </button>
                        </div>
                        {mealBusy ? (
                            <p>Loading meals…</p>
                        ) : !mealData ||
                          !Object.entries(mealData.meals).some(
                              ([id, n]) => n > 0 && mealData.recipes[id]
                          ) ? (
                            <p className="paw-meals-empty">
                                No cooked meals yet. Visit the Kitchen to cook something!
                            </p>
                        ) : (
                            <div className="paw-meals-list">
                                {Object.entries(mealData.meals)
                                    .filter(([id, n]) => n > 0 && !!mealData.recipes[id])
                                    .map(([id, n]) => {
                                        const recipe = mealData.recipes[id];
                                        return (
                                            <div className="paw-meal-row" key={id}>
                                                <div className="paw-meal-art">
                                                    <FoodArt id={id} />
                                                </div>
                                                <div className="paw-meal-info">
                                                    <b>{recipe.name}</b>
                                                    <small>{n} available</small>
                                                    <span>
                                                        {[
                                                            [recipe.hunger, "Hunger"],
                                                            [recipe.happiness, "Happiness"],
                                                            [recipe.energy, "Energy"],
                                                            [recipe.xp, "XP"]
                                                        ]
                                                            .filter(([v]) => Number(v) > 0)
                                                            .map(([v, label]) => `+${v} ${label}`)
                                                            .join(" · ")}
                                                    </span>
                                                </div>
                                                <button
                                                    className="primary"
                                                    disabled={mealBusy}
                                                    onClick={async () => {
                                                        setMealBusy(true);
                                                        try {
                                                            const response = await fetch(
                                                                API + "/api/kitchen",
                                                                {
                                                                    method: "POST",
                                                                    headers: {
                                                                        "Content-Type":
                                                                            "application/json",
                                                                        Authorization:
                                                                            "Bearer " + token
                                                                    },
                                                                    body: JSON.stringify({
                                                                        action: "serve",
                                                                        item: id
                                                                    })
                                                                }
                                                            );
                                                            const data = await response.json();
                                                            if (!response.ok) {
                                                                throw Error(
                                                                    data.error ||
                                                                        "Could not serve meal"
                                                                );
                                                            }
                                                            setMealData((prev) =>
                                                                prev
                                                                    ? {
                                                                          ...prev,
                                                                          meals:
                                                                              data.kitchen?.meals ||
                                                                              {}
                                                                      }
                                                                    : prev
                                                            );
                                                            setNotice(
                                                                data.message || "Meal served!"
                                                            );
                                                            await refresh();
                                                        } catch (e) {
                                                            setNotice(
                                                                e instanceof Error
                                                                    ? e.message
                                                                    : "Unable to serve meal"
                                                            );
                                                        } finally {
                                                            setMealBusy(false);
                                                        }
                                                    }}
                                                >
                                                    Serve
                                                </button>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </>
    );
}
