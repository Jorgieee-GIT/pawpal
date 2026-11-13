import {
    ArrowLeft,
    ArrowRight,
    Bell,
    Check,
    Coins,
    Gift,
    Heart,
    LockKeyhole,
    LogOut,
    Mail,
    MailPlus,
    Menu,
    PawPrint,
    Send,
    Settings,
    Sparkles,
    Star,
    Swords,
    Trophy,
    Users,
    X
} from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
// Preserve stylesheet evaluation order when importing extracted feature views.
import PublicWelcome from "./PublicWelcome";
import "./style.css";
import "./features/auth/PasswordRecovery.css";
import AuthScreen from "./features/auth/AuthScreen";
import BackgroundMusic from "./BackgroundMusic";
import { PAW_GAMES } from "./gameCatalog";
import { PawIcon } from "./PawIcons";
import { ENVELOPE_COLORS, ENVELOPE_DESIGNS } from "./features/social/pawMailCatalog";
import PetArt from "./PetArt";
import SectionHeading from "./SectionHeading";
import type { AppearanceChoice } from "./SettingsArt";
import { API } from "./api";
import { useApiRequest } from "./hooks/useApiRequest";
import { musicZoneForTab, readAudioPreferences } from "./musicTracks";
import { themes } from "./shopCatalog";
import type { Friend, MealData, PawMail, PawNotification, Pet, RoomPet, User } from "./types";

const SettingsModal = lazy(() => import("./SettingsModal"));
const PublicPage = lazy(() => import("./PublicPage"));
const AdoptionScreen = lazy(() => import("./features/auth/AdoptionScreen"));
const EnvelopeArtwork = lazy(() => import("./PawMailArt").then(({ EnvelopeArtwork }) => ({ default: EnvelopeArtwork })));
const PawPostcard = lazy(() => import("./features/social/PawPostcard").then(({ PawPostcard }) => ({ default: PawPostcard })));

// Feature panels and game screens load on demand so the login screen does not
// download the entire playhouse.
const RoomPanel = lazy(() => import("./features/rooms/RoomPanel"));
const FriendsPanel = lazy(() => import("./features/social/FriendsPanel"));
const WardrobePanel = lazy(() => import("./features/shop/WardrobePanel"));
const MarketPanel = lazy(() => import("./features/shop/MarketPanel"));
const Multiplayer = lazy(() => import("./features/multiplayer/Multiplayer"));
const ArcadePanel = lazy(() => import("./features/arcade/ArcadePanel"));
const GardenPanel = lazy(() => import("./features/garden/GardenPanel"));
const Kitchen = lazy(() => import("./features/kitchen/Kitchen"));
const MissionCenter = lazy(() => import("./features/missions/MissionCenter"));
const MiniGame = lazy(() => import("./features/arcade/MiniGame").then((module) => ({ default: module.MiniGame })));
const PawClaw = lazy(() => import("./features/arcade/PawClaw"));
const WhackAMole = lazy(() => import("./features/arcade/WhackAMole"));
const BubblePop = lazy(() => import("./features/arcade/BubblePop"));

/*
 * DOCU: Render the loading state while a feature panel is being downloaded.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
function PanelLoader() {
    return (
        <section className="panel paw-panel-loading" role="status" aria-live="polite">
            <PawPrint size={26} aria-hidden="true" />
            <span>Loading…</span>
        </section>
    );
}

/*
 * DOCU: Render the application shell and coordinate shared session, pet, navigation, and overlay state.
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export default function App() {
    const [token, setToken] = useState(() => {
        // Reset links invalidate existing sessions. An explicit login redirect must
        // never reuse an old token and jump straight into an expired playhouse.
        if (new URLSearchParams(window.location.search).get("login") === "1") {
            localStorage.removeItem("pawpal-token");
            sessionStorage.removeItem("pawpal-forgot-ticket");
            return "";
        }
        return localStorage.getItem("pawpal-token") || "";
    });
    const [user, setUser] = useState<User | null>(null);
    const [pet, setPet] = useState<Pet | null>(null);
    const [noteDraft, setNoteDraft] = useState("");
    const [editingNote, setEditingNote] = useState(false);
    const [openRoomNoteId, setOpenRoomNoteId] = useState<string | null>(null);
    const [themeModal, setThemeModal] = useState(false);
    const [mealModal, setMealModal] = useState(false);
    const [mealData, setMealData] = useState<MealData | null>(null);
    const [mealBusy, setMealBusy] = useState(false);
    const [roomPets, setRoomPets] = useState<RoomPet[]>([]);
    const [hideVisitingPets, setHideVisitingPets] = useState(false);
    useEffect(() => {
        if (!user?.id) {
            setHideVisitingPets(false);
            return;
        }
        setHideVisitingPets(localStorage.getItem(`pawpal-hide-visitors:${user.id}`) === "true");
    }, [user?.id]);
        /*
     * DOCU: Toggle visiting pets for this feature.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const toggleVisitingPets = () => {
        setHideVisitingPets((current) => {
            const next = !current;
            if (user?.id) {
                localStorage.setItem(`pawpal-hide-visitors:${user.id}`, String(next));
            }
            return next;
        });
    };
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requestsOpen, setRequestsOpen] = useState(false);
    // Per-account viewed incoming requests. Outgoing requests must never light the badge.
    const [seenFriendRequestIds, setSeenFriendRequestIds] = useState<string[]>([]);
    const [missionReady, setMissionReady] = useState(false);
    const [missionRefreshKey, setMissionRefreshKey] = useState(0);
    const [friendToast, setFriendToast] = useState<Friend | null>(null);
    const [removeFriend, setRemoveFriend] = useState<Friend | null>(null);
    const [friendDecision, setFriendDecision] = useState<Friend | null>(null);
    const [mail, setMail] = useState<PawMail[]>([]);
    const [mailModal, setMailModal] = useState<"inbox" | "compose" | "collection" | null>(null);
    const [mailFolder, setMailFolder] = useState<"received" | "sent">("received");
    const [selectedLetter, setSelectedLetter] = useState<PawMail | null>(null);
    const [sentMail, setSentMail] = useState<PawMail[]>([]);
    const [mailCatalog, setMailCatalog] = useState(ENVELOPE_DESIGNS);
    const [notifications, setNotifications] = useState<PawNotification[]>([]);
    const pendingSeenNotifications = useRef(new Set<string>());
    const lastLiveActivity = useRef(0);
    const [multiplayerSignal, setMultiplayerSignal] = useState(0);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [announcementOpen, setAnnouncementOpen] = useState<PawNotification | null>(null);
    const [maintenanceNotice, setMaintenanceNotice] = useState(false);
    const [notificationDecisions, setNotificationDecisions] = useState<
        Record<string, "accepted" | "declined">
    >({});
    const [mailDesign, setMailDesign] = useState("classic");
    const [mailColor, setMailColor] = useState("blush");
    const [mailMessage, setMailMessage] = useState("");
    const [ownedEnvelopes, setOwnedEnvelopes] = useState<string[]>(["classic"]);
    const [mailTo, setMailTo] = useState("");
    const [tab, setTab] = useState("home");
    const [notice, setNotice] = useState(() =>
        new URLSearchParams(window.location.search).get("passwordReset") === "success"
            ? "Password updated. Log in with your new password."
            : ""
    );
    useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.has("login") || url.searchParams.has("passwordReset")) {
            url.searchParams.delete("login");
            url.searchParams.delete("passwordReset");
            window.history.replaceState(null, "", url.pathname + url.search + url.hash);
        }
    }, []);
    const [menuOpen, setMenuOpen] = useState(false);
    const [roomMenuOpen, setRoomMenuOpen] = useState(false);
    const [marketRoom, setMarketRoom] = useState("living");
    const [editFurniture, setEditFurniture] = useState(false);
    const [selectedFurniture, setSelectedFurniture] = useState<string | null>(null);
    const [adoptionAcknowledged, setAdoptionAcknowledged] = useState(false);
    const [settingsState, setSettingsState] = useState<"unopened" | "open" | "closed">("unopened");
    const settingsOpen = settingsState === "open";
    const [policyOpen, setPolicyOpen] = useState<"privacy" | "terms" | null>(null);
    const [appearance, setAppearance] = useState<AppearanceChoice>(() => {
        const saved = localStorage.getItem("pawpal-theme");

        if (saved === "light" || saved === "dark" || saved === "system") {
            return saved;
        }

        return "system";
    });
    const [systemDark, setSystemDark] = useState(
        () => window.matchMedia("(prefers-color-scheme: dark)").matches
    );
    const [audioPreferences, setAudioPreferences] = useState(readAudioPreferences);
    const dark = appearance === "dark" || (appearance === "system" && systemDark);

    useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
                /*
         * DOCU: Update the current state for this feature.
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const update = () => setSystemDark(media.matches);

        media.addEventListener("change", update);
        update();

        return () => {
            media.removeEventListener("change", update);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem("pawpal-theme", appearance);
        document.documentElement.dataset.pawpalTheme = dark ? "dark" : "light";
    }, [appearance, dark]);

    useEffect(() => {
        localStorage.setItem("pawpal-audio-preferences", JSON.stringify(audioPreferences));
    }, [audioPreferences]);
    useEffect(() => {
        if (!notice) {
            return;
        }
        const timer = setTimeout(() => setNotice(""), 4200);
        return () => clearTimeout(timer);
    }, [notice]);
    const [busy, setBusy] = useState(false);
    const sleepRequestInFlight = useRef(false);
    const [sleepPending, setSleepPending] = useState(false);
    const [bathMode, setBathMode] = useState(false);
    const [cuddleMode, setCuddleMode] = useState(false);
    const cuddleActive = useRef(false);
    const cuddleLastMove = useRef(0);
    const cuddleRequest = useRef(false);
    const cuddleSeconds = useRef(0);
    const bathScrubbing = useRef(false);
    const bathLastMove = useRef(0);
    const bathRequest = useRef(false);
    const [authMode, setAuthMode] = useState(() =>
        sessionStorage.getItem("pawpal-forgot-ticket") ? "forgot" : "welcome"
    );
    const [forgotTicket, setForgotTicket] = useState<{
        requestId: string;
        requestKey: string;
    } | null>(() => {
        try {
            const saved = sessionStorage.getItem("pawpal-forgot-ticket");
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [forgotStatus, setForgotStatus] = useState("pending");
    const [forgotBusy, setForgotBusy] = useState(false);
    const [forgotError, setForgotError] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [petName, setPetName] = useState("");
    const [choice, setChoice] = useState("cat");
    const [friendSearch, setFriendSearch] = useState("");
    const [found, setFound] = useState<User | null>(null);
    const [playPickerOpen, setPlayPickerOpen] = useState(false);
    const [game, setGame] = useState<string | null>(null);
    const [records, setRecords] = useState<
        {
            game: string;
            best: number;
        }[]
    >([]);
    const [achievements, setAchievements] = useState<string[]>([]);
    const [nowTick, setNowTick] = useState(Date.now());
    useEffect(() => {
        // Check navigation badges while outside the garden too, without
        // rerendering the entire app every second on other pages.
                /*
         * DOCU: Advance timed gameplay and update the active round state.
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const tick = () => {
            if (document.visibilityState === "visible") {
                setNowTick(Date.now());
            }
        };
        tick();
        const id = window.setInterval(tick, tab === "garden" ? 1000 : 15000);
        document.addEventListener("visibilitychange", tick);
        return () => {
            window.clearInterval(id);
            document.removeEventListener("visibilitychange", tick);
        };
    }, [tab]);
    const [rotation, setRotation] = useState(0);
    const oldPetId = localStorage.getItem("pawpal-pet-id");
    const request = useApiRequest(token, () => {
        setToken("");
        setUser(null);
        setPet(null);
        setAuthMode("login");
        setNotice("Your session expired. Please log in again.");
    });
        /*
     * DOCU: Create a stable identifier for a notification.
     * @param {PawNotification} item - Item being handled
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const notificationId = (item: PawNotification) =>
        `${item.kind}:${item.event_id}:${new Date(item.created_at).getTime()}`;
        /*
     * DOCU: Update notifications from server for this feature.
     * @param {PawNotification[]} items - items value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
function updateNotificationsFromServer(items: PawNotification[]) {
        // A polling response may arrive just before the seen acknowledgement.
        // Do not restore a red dot while a mark-seen request is in flight.
        for (const item of items) {
            if (!item.unread) {
                pendingSeenNotifications.current.delete(notificationId(item));
            }
        }
        setNotifications(
            items.map((item) =>
                pendingSeenNotifications.current.has(notificationId(item))
                    ? { ...item, unread: false }
                    : item
            )
        );
    }
        /*
     * DOCU: Mark notifications seen for this feature.
     * @param {PawNotification[]} items - items value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
async function markNotificationsSeen(items: PawNotification[]) {
        const unseen = items.filter(
            (item) => item.unread && !pendingSeenNotifications.current.has(notificationId(item))
        );
        if (!unseen.length) {
            return;
        }
        for (const item of unseen) {
            pendingSeenNotifications.current.add(notificationId(item));
        }
        setNotifications((current) =>
            current.map((item) =>
                pendingSeenNotifications.current.has(notificationId(item))
                    ? { ...item, unread: false }
                    : item
            )
        );
        try {
            await request("/notifications/seen", "POST", {
                items: unseen.map((item) => ({
                    kind: item.kind,
                    event_id: item.event_id,
                    created_at: item.created_at
                }))
            });
            void request("/notifications")
                .then(updateNotificationsFromServer)
                .catch(() => {});
        } catch {
            // A failed write should never pretend to have marked anything as seen.
            for (const item of unseen) {
                pendingSeenNotifications.current.delete(notificationId(item));
            }
            void request("/notifications")
                .then(updateNotificationsFromServer)
                .catch(() => {});
        }
    }
    useEffect(() => {
        // Opening the notification bell means the visible entries were viewed.
        // The invitation or friend request itself stays pending until acted on.
        if (notificationsOpen && notifications.some((item) => item.unread)) {
            void markNotificationsSeen(notifications);
        }
    }, [notificationsOpen, notifications]);
    useEffect(() => {
        if (!token) {
            pendingSeenNotifications.current.clear();
            setNotifications([]);
        }
    }, [token]);
    useEffect(() => {
        let mounted = true;
        let checking = false;
        let interval: ReturnType<typeof window.setInterval> | undefined;
                /*
         * DOCU: Check maintenance for this feature.
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
async function checkMaintenance() {
            if (!mounted || document.visibilityState === "hidden" || checking) return;
            checking = true;
            try {
                const response = await fetch(API + "/api/system/status", { cache: "no-store" });
                if (response.ok) {
                    const data = await response.json();
                    if (mounted) setMaintenanceNotice(data.maintenance === true);
                }
            } catch {
                // Preserve the last known banner during a transient network interruption.
            } finally {
                checking = false;
            }
        }
                /*
         * DOCU: Start polling for this feature.
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
function startPolling() {
            if (document.visibilityState === "hidden" || interval !== undefined) return;
            interval = window.setInterval(() => void checkMaintenance(), 60000);
        }
                /*
         * DOCU: Sync visibility for this feature.
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
function syncVisibility() {
            if (document.visibilityState === "hidden") {
                if (interval !== undefined) window.clearInterval(interval);
                interval = undefined;
                return;
            }
            void checkMaintenance();
            startPolling();
        }
        void checkMaintenance();
        startPolling();
        document.addEventListener("visibilitychange", syncVisibility);
        window.addEventListener("focus", checkMaintenance);
        return () => {
            mounted = false;
            if (interval !== undefined) window.clearInterval(interval);
            document.removeEventListener("visibilitychange", syncVisibility);
            window.removeEventListener("focus", checkMaintenance);
        };
    }, []);
    // Mission status remains current even while the Missions panel is closed.
    useEffect(() => {
        if (!token) {
            setMissionReady(false);
            return;
        }
        let active = true;
                /*
         * DOCU: Check missions for this feature.
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
async function checkMissions() {
            if (document.visibilityState === "hidden") {
                return;
            }
            try {
                const data = await request("/missions");
                if (active) {
                    setMissionReady(
                        Array.isArray(data.missions) &&
                            data.missions.some(
                                (mission: { claimed: boolean; progress: number; target: number }) =>
                                    !mission.claimed &&
                                    Number(mission.progress) >= Number(mission.target)
                            )
                    );
                }
            } catch {
                // Keep the previous indicator on transient connection problems.
            }
        }
        void checkMissions();
        const interval = window.setInterval(() => void checkMissions(), 45000);
        document.addEventListener("visibilitychange", checkMissions);
        return () => {
            active = false;
            window.clearInterval(interval);
            document.removeEventListener("visibilitychange", checkMissions);
        };
    }, [token, missionRefreshKey]);

        /*
     * DOCU: Refresh the current state for this feature.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
async function refresh() {
        if (!token) {
            return;
        }
        try {
            // Independent resources load together rather than waiting for /me first.
            const [data, rp, fs, rs, ac, ml, envelopes, notificationsData] = await Promise.all([
                request("/me"),
                request("/room"),
                request("/friends"),
                request("/records"),
                request("/achievements"),
                request("/mail"),
                request("/mail/designs"),
                request("/notifications")
            ]);
            setUser(data.user);
            setPet(data.pet);
            if (user) {
                setMissionRefreshKey((value) => value + 1);
            }
            if (!editingNote) {
                setNoteDraft(data.user?.pet_note || "");
            }
            setRoomPets(rp);
            setFriends(fs);
            setRecords(rs);
            setAchievements(ac);
            setMail(ml);
            setOwnedEnvelopes(envelopes.owned || ["classic"]);
            if (Array.isArray(envelopes.catalog)) {
                setMailCatalog(envelopes.catalog);
            }
            updateNotificationsFromServer(notificationsData);
        } catch (error: any) {
            // The shared request handler already returned to login for a revoked session.
            if (error?.status !== 401) {
                setNotice(error.message);
            }
        }
    }
    useEffect(() => {
        void refresh();
    }, [token]);
    useEffect(() => {
        if (!token) {
            return;
        }
        let active = true;
        let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
        let eventTimer: ReturnType<typeof setTimeout> | undefined;
        let controller: AbortController | undefined;
        let retryDelay = 1500;
        const pending = new Set<string>();
        lastLiveActivity.current = 0;
        let notificationsInitialized = false;
        const knownNotificationIds = new Set<string>();
                /*
         * DOCU: Sync notifications for this feature.
         * @param {PawNotification[]} items - items value used by this function
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const syncNotifications = (items: PawNotification[]) => {
            if (!active) {
                return;
            }
            const current = new Set(items.map((item) => `${item.kind}:${item.event_id}`));
            if (notificationsInitialized) {
                const freshBattle = items.some(
                    (item) =>
                        item.unread &&
                        (item.kind === "multiplayer_challenge" || item.kind === "duo_invite") &&
                        !knownNotificationIds.has(`${item.kind}:${item.event_id}`)
                );
                if (freshBattle) {
                    setNotice("New Paw Brawl invitation received.");
                }
            }
            notificationsInitialized = true;
            knownNotificationIds.clear();
            current.forEach((id) => knownNotificationIds.add(id));
            updateNotificationsFromServer(items);
        };
        // Seed the fallback's seen set without treating old invitations as new.
        void request("/notifications")
            .then(syncNotifications)
            .catch(() => {});

                /*
         * DOCU: Refresh events for this feature.
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const refreshEvents = async () => {
            if (!active || document.visibilityState === "hidden") {
                return;
            }
            const types = new Set(pending);
            pending.clear();
            const requests: Promise<unknown>[] = [];
                        /*
             * DOCU: Load the feature data required by the current screen.
             * @param {string} path - path value used by this function
             * @param {(value: T) => void} update - update value used by this function
             *
             * Last Updated: 2026-11-13
             * Author: Jorge
             * Last Updated By: Jorge
             */
const load = <T,>(path: string, update: (value: T) => void) => {
                requests.push(
                    request(path)
                        .then(update)
                        .catch(() => {})
                );
            };
            const social = [...types].some((type) =>
                ["friend_request", "friend_accepted", "friend_removed"].includes(type)
            );
            const mail = types.has("mail");
            const gift = types.has("gift");
            const multiplayer = types.has("multiplayer_updated");
            const ownPet = [...types].some((type) =>
                ["pet_updated", "daily_reward", "kitchen_updated"].includes(type)
            );
            const room = [...types].some((type) =>
                [
                    "friend_pet_updated",
                    "pet_sleep_changed",
                    "friend_accepted",
                    "friend_removed",
                    "pet_updated"
                ].includes(type)
            );
            if (social) {
                load<Friend[]>("/friends", (list) => {
                    setFriends(list);
                    if (types.has("friend_request")) {
                        const incoming = list.find(
                            (friend) =>
                                friend.status === "pending" && friend.recipient_id === user?.id
                        );
                        if (incoming) {
                            setFriendToast(incoming);
                        }
                    }
                });
            }
            if (mail) {
                load<any>("/mail", setMail);
                load<any>("/mail/designs", (data) => setOwnedEnvelopes(data.owned || ["classic"]));
            }
            if (ownPet || gift || multiplayer) {
                load<any>("/me", (data) => {
                    setUser(data.user);
                    setPet(data.pet);
                });
            }
            if (room) {
                load<RoomPet[]>("/room", setRoomPets);
            }
            if (social || mail || gift || multiplayer) {
                load<PawNotification[]>("/notifications", syncNotifications);
            }
            if (multiplayer) {
                setMultiplayerSignal((value) => value + 1);
            }
            await Promise.all(requests);
        };
                /*
         * DOCU: Handle schedule behavior for this feature.
         * @param {string} type - type value used by this function
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const schedule = (type: string) => {
            pending.add(type);
            if (!eventTimer) {
                eventTimer = setTimeout(() => {
                    eventTimer = undefined;
                    void refreshEvents();
                }, 180);
            }
        };
                /*
         * DOCU: Sync on return for this feature.
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const syncOnReturn = () => {
            if (document.visibilityState !== "visible") {
                return;
            }
            if (pending.size) {
                void refreshEvents();
            }
            void request("/notifications")
                .then(syncNotifications)
                .catch(() => {});
            // A browser may silently suspend the response stream in background.
            if (Date.now() - lastLiveActivity.current > 45000) {
                controller?.abort();
            }
        };
        document.addEventListener("visibilitychange", syncOnReturn);
        window.addEventListener("focus", syncOnReturn);
        window.addEventListener("online", syncOnReturn);

                /*
         * DOCU: Connect the current state for this feature.
         * @throws {Error} - Propagates an error when this operation cannot complete.
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
async function connect() {
            controller = new AbortController();
            try {
                const response = await fetch(API + "/api/live", {
                    headers: {
                        Authorization: "Bearer " + token,
                        Accept: "text/event-stream"
                    },
                    signal: controller.signal,
                    cache: "no-store"
                });
                if (!response.ok || !response.body) {
                    throw Error("Live updates unavailable");
                }
                retryDelay = 1500;
                lastLiveActivity.current = Date.now();
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                while (active) {
                    const { value, done } = await reader.read();
                    if (done) {
                        break;
                    }
                    lastLiveActivity.current = Date.now();
                    buffer += decoder
                        .decode(value, {
                            stream: true
                        })
                        .replace(/\r/g, "");
                    const chunks = buffer.split("\n\n");
                    buffer = chunks.pop() || "";
                    for (const chunk of chunks) {
                        const lines = chunk.split("\n");
                        if (!lines.some((line) => line.trim() === "event: update")) {
                            continue;
                        }
                        const data = lines
                            .filter((line) => line.startsWith("data:"))
                            .map((line) => line.slice(5).trim())
                            .join("\n");
                        try {
                            const event = JSON.parse(data) as {
                                type?: string;
                            };
                            if (!event.type) {
                                continue;
                            }
                            schedule(event.type);
                            const messages: Record<string, string> = {
                                friend_request: "New friend request!",
                                friend_accepted: "Friend request accepted!",
                                friend_removed: "Friend list updated.",
                                mail: "New PawMail postcard!",
                                gift: "Coin gift activity updated!",
                                multiplayer_updated: "Paw Brawl activity updated!"
                            };
                            if (messages[event.type]) {
                                setNotice(messages[event.type]);
                            }
                        } catch {
                            /* Ignore malformed event payloads. */
                        }
                    }
                }
            } catch (error) {
                if (active) {
                    console.warn("Live connection interrupted; reconnecting", error);
                }
            }
            if (active) {
                reconnectTimer = setTimeout(() => void connect(), retryDelay);
                retryDelay = Math.min(retryDelay * 2, 15000);
            }
        }
        void connect();
        // Notifications must not wait 60 seconds when Render or SSE reconnects.
        const notificationFallback = window.setInterval(() => {
            const liveIsStale = Date.now() - lastLiveActivity.current > 45000;
            if (document.visibilityState === "visible" && liveIsStale) {
                void request("/notifications")
                    .then(syncNotifications)
                    .catch(() => {});
            }
            if (liveIsStale) {
                controller?.abort();
            }
        }, 12000);
        const profileFallback = window.setInterval(() => {
            if (
                document.visibilityState === "visible" &&
                Date.now() - lastLiveActivity.current > 45000
            ) {
                void request("/me")
                    .then((data) => {
                        setUser(data.user);
                        setPet(data.pet);
                    })
                    .catch(() => {});
            }
        }, 60000);
        return () => {
            active = false;
            controller?.abort();
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
            }
            if (eventTimer) {
                clearTimeout(eventTimer);
            }
            clearInterval(notificationFallback);
            clearInterval(profileFallback);
            document.removeEventListener("visibilitychange", syncOnReturn);
            window.removeEventListener("focus", syncOnReturn);
            window.removeEventListener("online", syncOnReturn);
        };
    }, [token]);
    // Keep the other players' pet states fresh even when live events are delayed or
    // an existing SSE connection silently stalls (notably on background tabs).
    useEffect(() => {
        if (!token) {
            return;
        }
        let alive = true;
                /*
         * DOCU: Sync room for this feature.
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const syncRoom = async () => {
            try {
                const pets: RoomPet[] = await request("/room");
                if (alive) {
                    setRoomPets(pets);
                }
            } catch {
                /* next poll retries */
            }
        };
        const timer = window.setInterval(() => {
            if (
                document.visibilityState === "visible" &&
                Date.now() - lastLiveActivity.current > 45000
            ) {
                void syncRoom();
            }
        }, 20000);
                /*
         * DOCU: Handle on visible behavior for this feature.
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const onVisible = () => {
            if (
                document.visibilityState === "visible" &&
                Date.now() - lastLiveActivity.current > 45000
            ) {
                void syncRoom();
            }
        };
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", onVisible);
        void syncRoom();
        return () => {
            alive = false;
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", onVisible);
        };
    }, [token]);
    useEffect(() => {
        const t = setInterval(() => setRotation((x) => x + 1), 14000);
        return () => clearInterval(t);
    }, []);
        /*
     * DOCU: Validate and grant the completed arcade game reward.
     * @param {string} gameId - gameId value used by this function
     * @param {number} points - points value used by this function
     * @returns {Promise<boolean>} - Result returned by this function.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
async function claimArcadeReward(gameId: string, points: number): Promise<boolean> {
        // Retry still claims the completed round before a new one begins.
        // Respect the backend's existing 8-second reward interval, rather than
        // silently dropping earned coins if a quick round ends too soon.
        for (let attempt = 0; attempt < 3; attempt++) {
            const result = await execute("/game", {
                game: gameId,
                score: points
            });
            const message = String(result?.message || "");
            if (result?.pet && message.startsWith("Arcade reward:")) {
                void refresh();
                return true;
            }
            if (!message.startsWith("Wait ")) {
                return false;
            }
            const seconds = Number(message.match(/Wait (\d+)/)?.[1] || 8);
            if (attempt < 2) {
                await new Promise<void>((resolve) =>
                    window.setTimeout(resolve, Math.max(1, seconds) * 1000 + 250)
                );
            }
        }
        setNotice("Could not collect your reward yet. Please retry.");
        return false;
    }
        /*
     * DOCU: Run a PawPal API action and refresh the affected application state.
     * @param {string} path - path value used by this function
     * @param {unknown} body - body value used by this function
     * @param {unknown} method - method value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
async function execute(path: string, body?: unknown, method = "POST") {
        setBusy(true);
        try {
            const data = await request(path, method, body);
            if (data.pet) {
                setPet(data.pet);
            }
            setNotice(data.message || "Saved!");
            setMissionRefreshKey((value) => value + 1);
            if (
                path.includes("friend") ||
                path.includes("gift") ||
                path.includes("adopt") ||
                path.includes("mail") ||
                path.includes("furniture")
            ) {
                await refresh();
            }
            return data;
        } catch (e: any) {
            setNotice(e.message);
        } finally {
            setBusy(false);
        }
    }
    useEffect(() => {
        if (!bathMode || !pet) {
            return;
        }
        const timer = window.setInterval(async () => {
            if (
                !bathScrubbing.current ||
                Date.now() - bathLastMove.current > 1150 ||
                bathRequest.current ||
                pet.cleanliness >= 100
            ) {
                return;
            }
            bathRequest.current = true;
            try {
                const data = await request("/care", "POST", {
                    action: "scrub"
                });
                if (data.pet) {
                    setPet(data.pet);
                }
            } catch (e: any) {
                setNotice(e?.message || "Could not bathe pet");
            } finally {
                bathRequest.current = false;
            }
        }, 1000);
        return () => window.clearInterval(timer);
    }, [bathMode, pet?.id, pet?.cleanliness]);
    useEffect(() => {
        if (!cuddleMode || !pet) {
            return;
        }
        const timer = window.setInterval(async () => {
            if (
                !cuddleActive.current ||
                Date.now() - cuddleLastMove.current > 1100 ||
                cuddleRequest.current ||
                pet.happiness >= 100
            ) {
                return;
            }
            cuddleRequest.current = true;
            try {
                const data = await request("/care", "POST", {
                    action: "pet_stroke"
                });
                if (data.pet) {
                    setPet(data.pet);
                    cuddleSeconds.current++;
                }
            } catch (e: any) {
                setNotice(e?.message || "Could not cuddle pet");
            } finally {
                cuddleRequest.current = false;
            }
        }, 1000);
        return () => window.clearInterval(timer);
    }, [cuddleMode, pet?.id, pet?.happiness]);
    useEffect(() => {
                /*
         * DOCU: Stop the current state for this feature.
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const stop = () => {
            bathScrubbing.current = false;
            cuddleActive.current = false;
        };
        window.addEventListener("pointerup", stop);
        window.addEventListener("pointercancel", stop);
        return () => {
            window.removeEventListener("pointerup", stop);
            window.removeEventListener("pointercancel", stop);
        };
    }, []);
        /*
     * DOCU: Launch game for this feature.
     * @param {string} id - Identifier of the record or item being handled
     * @param {string} petSpecies - petSpecies value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
async function launchGame(id: string, petSpecies: string) {
        if (pet?.garden?._sleeping) {
            setPet((current) =>
                current
                    ? {
                            ...current,
                            garden: {
                                ...current.garden,
                                _sleeping: false
                            }
                        }
                    : current
            );
            try {
                await request("/care/wake", "POST");
                await refresh();
            } catch (error) {
                setNotice(error instanceof Error ? error.message : "Could not wake your pet");
                return;
            }
        }
        localStorage.setItem("pawpal-arcade-species", petSpecies);
        setGame(id);
    }
        /*
     * DOCU: Toggle pet sleep for this feature.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
async function togglePetSleep() {
        if (sleepRequestInFlight.current) {
            return;
        }
        sleepRequestInFlight.current = true;
        setSleepPending(true);
        try {
            const data = await request("/care", "POST", {
                action: "sleep_toggle"
            });
            if (data.pet) {
                setPet(data.pet);
            }
            setNotice(data.message || "Sleep updated");
        } catch (e: any) {
            setNotice(e?.message || "Could not update sleep");
        } finally {
            sleepRequestInFlight.current = false;
            setSleepPending(false);
        }
    }
        /*
     * DOCU: Authenticate the current state for this feature.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
async function authenticate() {
        setBusy(true);
        try {
            const data = await request(
                "/auth/" + (authMode === "login" ? "login" : "register"),
                "POST",
                authMode === "login"
                    ? {
                            identity: username,
                            password
                        }
                    : {
                            username,
                            password
                        }
            );
            localStorage.setItem("pawpal-token", data.token);
            setToken(data.token);
            setNotice("Welcome to PawPal!");
        } catch (e: any) {
            setNotice(e.message);
        } finally {
            setBusy(false);
        }
    }
        /*
     * DOCU: Request forgot password for this feature.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
async function requestForgotPassword() {
        setForgotBusy(true);
        setForgotError("");
        try {
            const result = await request("/auth/password-reset/request", "POST", {
                username: username.trim()
            });
            const ticket = { requestId: result.requestId, requestKey: result.requestKey };
            sessionStorage.setItem("pawpal-forgot-ticket", JSON.stringify(ticket));
            setForgotTicket(ticket);
            setForgotStatus("pending");
        } catch (e) {
            setForgotError((e as Error).message);
        } finally {
            setForgotBusy(false);
        }
    }
    useEffect(() => {
        if (authMode !== "forgot" || !forgotTicket) {
            return;
        }
        let mounted = true;
                /*
         * DOCU: Check status for this feature.
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
async function checkStatus() {
            if (document.visibilityState === "hidden") {
                return;
            }
            try {
                const response = await fetch(API + "/api/auth/password-reset/request-status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(forgotTicket),
                    cache: "no-store"
                });
                const result = await response.json();
                if (mounted && response.ok) {
                    setForgotStatus(result.status || "pending");
                }
            } catch {
                // Network interruptions don't cancel the admin request.
            }
        }
        void checkStatus();
        const interval = window.setInterval(() => void checkStatus(), 8000);
        return () => {
            mounted = false;
            window.clearInterval(interval);
        };
    }, [authMode, forgotTicket]);
        /*
     * DOCU: Handle clear forgot request behavior for this feature.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
function clearForgotRequest() {
        sessionStorage.removeItem("pawpal-forgot-ticket");
        setForgotTicket(null);
        setForgotStatus("pending");
        setForgotError("");
    }
        /*
     * DOCU: Handle logout behavior for this feature.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
function logout() {
        localStorage.removeItem("pawpal-token");
        setToken("");
        setUser(null);
        setPet(null);
        setRoomPets([]);
        setFriends([]);
        setSeenFriendRequestIds([]);
        setMissionReady(false);
        setMail([]);
    }
    useEffect(() => {
        if (!friendToast) {
            return;
        }
        const t = setTimeout(() => setFriendToast(null), 9000);
        return () => clearTimeout(t);
    }, [friendToast]);
        /*
     * DOCU: Open paw composer for this feature.
     * @param {unknown} friendId - friendId value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const openPawComposer = (friendId = "") => {
        setMailTo(friendId);
        setSelectedLetter(null);
        setMailModal("compose");
    };
        /*
     * DOCU: Open paw inbox for this feature.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const openPawInbox = () => {
        setSelectedLetter(null);
        setMailFolder("received");
        setMailModal("inbox");
    };
        /*
     * DOCU: Show sent letters for this feature.
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const showSentLetters = async () => {
        setMailFolder("sent");
        setSelectedLetter(null);
        try {
            setSentMail(await request("/mail/sent"));
        } catch (error: any) {
            setNotice(error.message);
        }
    };
        /*
     * DOCU: Open paw letter for this feature.
     * @param {PawMail} letter - letter value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const openPawLetter = async (letter: PawMail) => {
        setSelectedLetter(letter);
        if (mailFolder === "received" && !letter.read_at) {
            const result = await execute("/mail/" + letter.id + "/read", undefined, "PATCH");
            if (result) {
                setMail((mails) =>
                    mails.map((m) =>
                        m.id === letter.id
                            ? {
                                    ...m,
                                    read_at: new Date().toISOString()
                                }
                            : m
                    )
                );
            }
        }
    };
    const accepted = friends.filter((f) => f.status === "accepted");
    const pending = friends.filter((f) => f.status === "pending");
    const incomingRequests = pending.filter((f) => f.recipient_id === user?.id);
        /*
     * DOCU: Request seen key for this feature.
     * @param {Friend} friend - friend value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const requestSeenKey = (friend: Friend) => `${friend.requester_id}:${friend.created_at}`;
    const unseenIncomingRequests = incomingRequests.filter(
        (friend) => !seenFriendRequestIds.includes(requestSeenKey(friend))
    );
    const hasHarvestReady = (() => {
        if (!pet) {
            return false;
        }
        const garden = pet.garden;
        const plots = [...(garden.plots || [])];
        if (!plots[0] && garden.planted_at) {
            plots[0] = {
                planted_at: garden.planted_at,
                watered_minutes: garden.watered_minutes || 0
            };
        }
        return plots.some(
            (plot) =>
                plot &&
                Number.isFinite(new Date(plot.planted_at).getTime()) &&
                nowTick >=
                    new Date(plot.planted_at).getTime() +
                        300000 -
                        (plot.watered_minutes || 0) * 60000
        );
    })();
        /*
     * DOCU: Handle friend request is unread behavior for this feature.
     * @param {string} eventId - eventId value used by this function
     *
     * Last Updated: 2026-11-13
     * Author: Jorge
     * Last Updated By: Jorge
     */
const friendRequestIsUnread = (eventId: string) =>
        unseenIncomingRequests.some((friend) => friend.requester_id === eventId);
    useEffect(() => {
        if (!user?.id) {
            setSeenFriendRequestIds([]);
            return;
        }
        try {
            const saved = JSON.parse(
                localStorage.getItem(`pawpal-seen-friend-requests:${user.id}`) || "[]"
            );
            setSeenFriendRequestIds(
                Array.isArray(saved) ? saved.filter((id: unknown) => typeof id === "string") : []
            );
        } catch {
            setSeenFriendRequestIds([]);
        }
    }, [user?.id]);
    useEffect(() => {
        if (!requestsOpen || !user?.id) {
            return;
        }
        const ids = friends
            .filter((friend) => friend.status === "pending" && friend.recipient_id === user.id)
            .map((friend) => `${friend.requester_id}:${friend.created_at}`);
        if (!ids.length) {
            return;
        }
        const key = `pawpal-seen-friend-requests:${user.id}`;
        let stored: string[] = [];
        try {
            const previous = JSON.parse(localStorage.getItem(key) || "[]");
            stored = Array.isArray(previous)
                ? previous.filter((id: unknown) => typeof id === "string")
                : [];
        } catch {
            // Repair invalid local data if necessary.
        }
        const updated = [...new Set([...stored, ...ids])];
        localStorage.setItem(key, JSON.stringify(updated.slice(-300)));
        setSeenFriendRequestIds(updated.slice(-300));
    }, [requestsOpen, friends, user?.id]);
    const others = roomPets.filter((p) => p.user_id !== user?.id);
    const visible = roomPets
        .filter((p) => p.user_id === user?.id)
        .concat(
            hideVisitingPets
                ? []
                : others.length <= 8
                    ? others
                    : Array.from(
                        {
                            length: 8
                        },
                        (_, i) => others[(rotation * 8 + i) % others.length]
                    )
        );
    const roomColors = themes[pet?.room_theme || "blush"] || themes.blush;
    const openedRoomNote = visible.find(
        (p) =>
            p.id === openRoomNoteId &&
            p.pet_note?.trim() &&
            p.note_expires_at &&
            new Date(p.note_expires_at).getTime() > Date.now()
    );
    useEffect(() => {
        setOpenRoomNoteId(null);
    }, [tab, rotation]);
    useEffect(() => {
        if (!openRoomNoteId) {
            return;
        }
                /*
         * DOCU: Close outside for this feature.
         * @param {PointerEvent} event - User or browser event that triggered this operation
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const closeOutside = (event: PointerEvent) => {
            const target = event.target;
            if (
                target instanceof Element &&
                !target.closest(".paw-note-indicator, .paw-room-note-popover")
            ) {
                setOpenRoomNoteId(null);
            }
        };
                /*
         * DOCU: Close escape for this feature.
         * @param {KeyboardEvent} event - User or browser event that triggered this operation
         *
         * Last Updated: 2026-11-13
         * Author: Jorge
         * Last Updated By: Jorge
         */
const closeEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpenRoomNoteId(null);
            }
        };
        document.addEventListener("pointerdown", closeOutside);
        document.addEventListener("keydown", closeEscape);
        return () => {
            document.removeEventListener("pointerdown", closeOutside);
            document.removeEventListener("keydown", closeEscape);
        };
    }, [openRoomNoteId]);
    const musicZone = musicZoneForTab(tab, game);

    return (
        <div className={"app " + (dark ? "paw-dark" : "")}>
            <BackgroundMusic
                zone={musicZone}
                preferences={{
                    musicVolume: user ? audioPreferences.musicVolume : 0
                }}
            />
            {user && <header className="nav">
                <div className="logo paw-logo-home" role="button" tabIndex={0} title="Go to Living Room" onClick={() => {setTab("home"); setMenuOpen(false); setNotificationsOpen(false); window.scrollTo({top:0,behavior: "smooth"});}} onKeyDown={(e) => {if (e.key === "Enter" || e.key === " ") {e.preventDefault(); setTab("home"); setMenuOpen(false); setNotificationsOpen(false);}}}>
                    <PawPrint size={25} aria-hidden="true" />
                    <div className="paw-logo-copy">
                        <b>PawPal</b>
                        <span>AY NAKATULOG?</span>
                    </div>
                </div>
                <div className="nav-right">
                    {user && <span className="paw-header-username">Hi, @{user.username}</span>}
                    {user && (
                        <div className="paw-notifications-wrap">
                            <button
                                className="secondary paw-notifications-trigger"
                                aria-label="Notifications"
                                aria-expanded={notificationsOpen}
                                title="Notifications"
                                onClick={() => {
                                    setNotificationsOpen((v) => !v);
                                    void request("/notifications")
                                        .then(updateNotificationsFromServer)
                                        .catch(() => {});
                                }}
                            >
                                <Bell size={20} strokeWidth={1.65} aria-hidden="true" />
                                {notifications.some(
                                    (n) =>
                                        n.unread &&
                                        (n.kind !== "friend_request" ||
                                            friendRequestIsUnread(n.event_id))
                                ) && <span className="paw-notifications-dot" />}
                            </button>
                            {notificationsOpen && (
                                <div className="paw-notifications-panel" role="region" aria-label="Latest notifications">
                                    <div className="paw-notifications-heading">
                                        <b>Notifications</b>
                                        <small>Latest 5</small>
                                        <button className="paw-notifications-close" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications">
                                            ×
                                        </button>
                                    </div>
                                    {notifications.length === 0 ? (
                                        <p className="paw-notifications-empty">
                                            No notifications yet ♡
                                        </p>
                                    ) : (
                                        notifications.map((n) => (
                                            <div key={n.kind + "-" + n.event_id} className={ "paw-notification-item " + (n.unread && (n.kind !== "friend_request" || friendRequestIsUnread(n.event_id)) ? "is-unread" : "")}>
                                                <button
                                                    className="paw-notification-link"
                                                    onClick={() => {
                                                        if (n.kind === "announcement") {
                                                            setAnnouncementOpen(n);
                                                            setNotificationsOpen(false);
                                                            void markNotificationsSeen([n]);
                                                            return;
                                                        }
                                                        if (n.kind === "duo_invite") {
                                                            window.sessionStorage.setItem(
                                                                "pawpal_open_duo",
                                                                "1"
                                                            );
                                                            setMultiplayerSignal((v) => v + 1);
                                                        }
                                                        setTab(
                                                            n.kind.startsWith("multiplayer") ||
                                                                n.kind === "duo_invite"
                                                                ? "multiplayer"
                                                                : "friends"
                                                        );
                                                        setNotificationsOpen(false);
                                                        setMenuOpen(false);
                                                        if (n.kind === "mail") {
                                                            openPawInbox();
                                                        } else {
                                                            window.scrollTo({
                                                                top: 0,
                                                                behavior: "smooth"
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <span className="paw-notification-icon">
                                                        {n.kind.startsWith("multiplayer") ||
                                                        n.kind === "duo_invite" ? (
                                                            <Swords size={16} />
                                                        ) : n.kind === "mail" ? (
                                                            <Mail size={16} />
                                                        ) : (
                                                            <Heart size={16} />
                                                        )}
                                                    </span>
                                                    <span>
                                                        <b>
                                                            {n.kind === "announcement"
                                                                ? n.actor
                                                                : "@" + n.actor}
                                                        </b>{" "}
                                                        {n.kind === "mail"
                                                            ? "sent you PawMail"
                                                            : n.kind === "friend_request"
                                                                ? "requested to be friends"
                                                                : n.kind === "multiplayer_challenge"
                                                                ? "challenged you to a game"
                                                                : n.kind === "multiplayer_result"
                                                                    ? "finished a multiplayer match with you"
                                                                    : n.kind === "duo_invite"
                                                                    ? "invited you to Duo Clash 2v2"
                                                                    : n.kind === "announcement"
                                                                        ? "published: " +
                                                                        (n.title || "a notice")
                                                                        : "accepted your friend request"}
                                                        <small>
                                                            {new Date(
                                                                n.created_at
                                                            ).toLocaleString()}
                                                        </small>
                                                    </span>
                                                </button>
                                                {(n.kind.startsWith("multiplayer") ||
                                                    n.kind === "duo_invite") && (
                                                    <div className="paw-notification-game">
                                                        <Swords size={14} />
                                                        <b>{n.game_name || "Paw Brawl"}</b>
                                                        <span className="paw-notification-game-wager">
                                                            ·{" "}
                                                            {Number(n.wager || 0).toLocaleString()}{" "}
                                                            Paw Coins each
                                                        </span>
                                                    </div>
                                                )}
                                                {n.kind === "multiplayer_challenge" && (
                                                    <div className="paw-notification-actions">
                                                        <button
                                                            className="paw-notification-accept"
                                                            disabled={busy}
                                                            onClick={async () => {
                                                                const ok = await execute(
                                                                    "/multiplayer/challenges/" +
                                                                        n.event_id +
                                                                        "/respond",
                                                                    {
                                                                        action: "accept"
                                                                    }
                                                                );
                                                                if (ok) {
                                                                    setNotificationsOpen(false);
                                                                    setTab("multiplayer");
                                                                    setMultiplayerSignal(
                                                                        (v) => v + 1
                                                                    );
                                                                    void refresh();
                                                                }
                                                            }}
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            className="paw-notification-decline"
                                                            disabled={busy}
                                                            onClick={async () => {
                                                                const ok = await execute(
                                                                    "/multiplayer/challenges/" +
                                                                        n.event_id +
                                                                        "/respond",
                                                                    {
                                                                        action: "decline"
                                                                    }
                                                                );
                                                                if (ok) {
                                                                    setMultiplayerSignal(
                                                                        (v) => v + 1
                                                                    );
                                                                    void refresh();
                                                                }
                                                            }}
                                                        >
                                                            Decline
                                                        </button>
                                                    </div>
                                                )}
                                                {n.kind === "friend_request" &&
                                                    (notificationDecisions[n.event_id] ? (
                                                        <div className={ "paw-notification-result " + notificationDecisions[n.event_id]} role="status">
                                                            You {notificationDecisions[n.event_id]}{" "}
                                                            @{n.actor}'s friend request.
                                                        </div>
                                                    ) : (
                                                        <div className="paw-notification-actions">
                                                            <button
                                                                className="paw-notification-accept"
                                                                disabled={busy}
                                                                onClick={async () => {
                                                                    const ok = await execute(
                                                                        "/friends/" +
                                                                            n.event_id +
                                                                            "/accept",
                                                                        {},
                                                                        "POST"
                                                                    );
                                                                    if (ok) {
                                                                        setNotificationDecisions(
                                                                            (prev) => ({
                                                                                ...prev,
                                                                                [n.event_id]:
                                                                                    "accepted"
                                                                            })
                                                                        );
                                                                        void request(
                                                                            "/notifications"
                                                                        )
                                                                            .then(
                                                                                updateNotificationsFromServer
                                                                            )
                                                                            .catch(() => {});
                                                                    }
                                                                }}
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                className="paw-notification-decline"
                                                                disabled={busy}
                                                                onClick={async () => {
                                                                    const ok = await execute(
                                                                        "/friends/" + n.event_id,
                                                                        undefined,
                                                                        "DELETE"
                                                                    );
                                                                    if (ok) {
                                                                        setNotificationDecisions(
                                                                            (prev) => ({
                                                                                ...prev,
                                                                                [n.event_id]:
                                                                                    "declined"
                                                                            })
                                                                        );
                                                                        void request(
                                                                            "/notifications"
                                                                        )
                                                                            .then(
                                                                                updateNotificationsFromServer
                                                                            )
                                                                            .catch(() => {});
                                                                    }
                                                                }}
                                                            >
                                                                Decline
                                                            </button>
                                                        </div>
                                                    ))}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        type="button"
                        className="secondary theme-toggle paw-header-settings"
                        onClick={() => {
                            setNotificationsOpen(false);
                            setSettingsState("open");
                        }}
                        aria-label="Open Settings"
                        title="Settings"
                        aria-haspopup="dialog"
                        aria-expanded={settingsOpen}
                    >
                        <Settings size={21} strokeWidth={1.8} aria-hidden="true" />
                    </button>
                    {user && (
                        <button className="paw-header-logout" onClick={logout} title="Log out of PawPal">
                            <LogOut size={16} aria-hidden="true" />
                            <span>Log out</span>
                        </button>
                    )}
                </div>
            </header>}
            {announcementOpen && (
                <div className="paw-modal-backdrop" onMouseDown={(event) => {if (event.target ===event.currentTarget) setAnnouncementOpen(null);}}>
                    <section className="paw-modal paw-admin-announcement-modal" role="dialog" aria-modal="true" aria-labelledby="paw-admin-announcement-title">
                        <div className="paw-modal-top">
                            <div>
                                <h2 id="paw-admin-announcement-title">
                                    {announcementOpen.title || "PawPal announcement"}
                                </h2>
                                <p className="paw-modal-subtitle">
                                    Posted {new Date(announcementOpen.created_at).toLocaleString()}
                                </p>
                            </div>
                            <button type="button" className="paw-modal-close" onClick={() => setAnnouncementOpen(null)} aria-label="Close announcement">
                                <X size={19} />
                            </button>
                        </div>
                        <div className="paw-admin-announcement-body">{announcementOpen.body}</div>
                    </section>
                </div>
            )}
            <Suspense fallback={null}>
                {settingsState !== "unopened" && (
                    <SettingsModal
                        open={settingsOpen}
                        onClose={() => setSettingsState("closed")}
                        appearance={appearance}
                        onAppearanceChange={setAppearance}
                        audio={audioPreferences}
                        onAudioChange={setAudioPreferences}
                        canReport={Boolean(user)}
                        onSendReport={async (category, description) => {
                            await request("/support/report", "POST", { category, description });
                        }}
                        onOpenPolicy={setPolicyOpen}
                    />
                )}
            </Suspense>
            <Suspense fallback={null}>
                {policyOpen && <PublicPage page={policyOpen} modal onClose={() => setPolicyOpen(null)} onSwitch={setPolicyOpen} />}
            </Suspense>
            {maintenanceNotice && (
                <div className="paw-maintenance-banner" role="status">
                    PawPal is temporarily in maintenance mode. Some game actions are paused until
                    the administrator reopens them.
                </div>
            )}
            <main className="container">
                {user && mailModal === "inbox" && (
                    <div className="paw-modal-backdrop" onMouseDown={(e) => {if (e.target ===e.currentTarget) {setMailModal(null);}}}>
                        <section className="paw-modal pawmail-window pawmail-inbox-window" role="dialog" aria-modal="true" aria-labelledby="pawmail-inbox-heading">
                            <div className="paw-modal-top">
                                <div>
                                    <h2 id="pawmail-inbox-heading">PawMail</h2>
                                    <p className="paw-modal-subtitle">Special delivery</p>
                                </div>
                                <button type="button" className="paw-modal-close" aria-label="Close PawMail" onClick={() => setMailModal(null)}>
                                    <X size={19} />
                                </button>
                            </div>
                            {selectedLetter ? (
                                <>
                                    <div className="pawmail-detail-top">
                                        <button type="button" className="pawmail-back" onClick={() => setSelectedLetter(null)}>
                                            <ArrowLeft size={16} /> All letters
                                        </button>
                                        <span className="pawmail-date">
                                            {new Date(selectedLetter.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="pawmail-from">
                                        {mailFolder === "received"
                                            ? `From @${selectedLetter.sender_username}`
                                            : `To @${selectedLetter.recipient_username}`}
                                    </p>
                                    <div className="pawmail-letter-detail">
                                        <Suspense fallback={null}>
                                            <PawPostcard
                                                design={selectedLetter.design}
                                                color={selectedLetter.color || "blush"}
                                                message={selectedLetter.message}
                                                senderPet={selectedLetter.sender_pet}
                                            />
                                        </Suspense>
                                    </div>
                                    <div className="pawmail-detail-actions">
                                        {mailFolder === "received" &&
                                            accepted.some(
                                                (f) => f.friend_id === selectedLetter.sender_id
                                            ) && (
                                                <button
                                                    type="button"
                                                    className="primary"
                                                    onClick={() =>
                                                        openPawComposer(selectedLetter.sender_id)
                                                    }
                                                >
                                                    <MailPlus size={16} /> Reply
                                                </button>
                                            )}
                                        {mailFolder === "received" && (
                                            <button
                                                type="button"
                                                className="secondary"
                                                disabled={busy}
                                                onClick={async () => {
                                                    if (
                                                        await execute(
                                                            "/mail/" + selectedLetter.id,
                                                            undefined,
                                                            "DELETE"
                                                        )
                                                    ) {
                                                        setSelectedLetter(null);
                                                        void refresh();
                                                    }
                                                }}
                                            >
                                                Delete letter
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="pawmail-folder-tabs" role="tablist" aria-label="Mail folders">
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={mailFolder === "received"}
                                            className={mailFolder === "received" ? "active" : ""}
                                            onClick={() => {
                                                setMailFolder("received");
                                                setSelectedLetter(null);
                                            }}
                                        >
                                            <Mail size={16} /> Inbox{" "}
                                            {mail.filter((m) => !m.read_at).length > 0 && (
                                                <span className="pawmail-unread-pill">
                                                    {mail.filter((m) => !m.read_at).length}
                                                </span>
                                            )}
                                        </button>
                                        <button type="button" role="tab" aria-selected={mailFolder === "sent"} className={mailFolder === "sent" ? "active" : ""} onClick={() => void showSentLetters()}>
                                            <Send size={16} /> Sent
                                        </button>
                                        <button type="button" className="pawmail-folder-compose" onClick={() => openPawComposer()}>
                                            <MailPlus size={16} /> Write
                                        </button>
                                    </div>
                                    <div className="pawmail-letter-list">
                                        {(mailFolder === "received" ? mail : sentMail).length ===
                                        0 ? (
                                            <div className="pawmail-empty">
                                                <Mail size={36} />
                                                <b>
                                                    {mailFolder === "received"
                                                        ? "No letters yet"
                                                        : "No sent letters yet"}
                                                </b>
                                                <span>
                                                    {mailFolder === "received"
                                                        ? "Your first postcard will arrive here."
                                                        : "Write a little letter to a friend."}
                                                </span>
                                            </div>
                                        ) : (
                                            (mailFolder === "received" ? mail : sentMail).map(
                                                (m) => (
                                                    <button
                                                        key={m.id}
                                                        type="button"
                                                        className={
                                                            "pawmail-list-letter " +
                                                            (!m.read_at && mailFolder === "received"
                                                                ? "unread"
                                                                : "")
                                                        }
                                                        onClick={() => void openPawLetter(m)}
                                                    >
                                                        <span
                                                            className={
                                                                "pawmail-list-icon paw-envelope-" +
                                                                m.design
                                                            }
                                                        >
                                                            <Suspense fallback={null}>
                                                                <EnvelopeArtwork design={m.design} />
                                                            </Suspense>
                                                        </span>
                                                        <span className="pawmail-list-copy">
                                                            <b>
                                                                {mailFolder === "received"
                                                                    ? `@${m.sender_username}`
                                                                    : `To @${m.recipient_username}`}
                                                            </b>
                                                            <span>{m.message}</span>
                                                            <small>
                                                                {new Date(
                                                                    m.created_at
                                                                ).toLocaleString()}
                                                            </small>
                                                        </span>
                                                        {!m.read_at && mailFolder === "received" ? (
                                                            <span
                                                                className="pawmail-new-dot"
                                                                aria-label="Unread"
                                                            />
                                                        ) : (
                                                            <ArrowRight
                                                                size={16}
                                                                className="pawmail-list-arrow"
                                                            />
                                                        )}
                                                    </button>
                                                )
                                            )
                                        )}
                                    </div>
                                </>
                            )}
                        </section>
                    </div>
                )}
                {user && mailModal === "compose" && pet && (
                    <div className="paw-modal-backdrop" onMouseDown={(e) => {if (e.target ===e.currentTarget) {setMailModal(null);}}}>
                        <section className="paw-modal pawmail-window pawmail-composer-window" role="dialog" aria-modal="true" aria-labelledby="pawmail-write-heading">
                            <div className="paw-modal-top">
                                <div>
                                    <h2 id="pawmail-write-heading">Write PawMail</h2>
                                    <p className="paw-modal-subtitle">A little letter</p>
                                </div>
                                <button type="button" className="paw-modal-close" aria-label="Close letter" onClick={() => setMailModal(null)}>
                                    <X size={19} />
                                </button>
                            </div>
                            <div className="pawmail-compose-layout">
                                <div className="pawmail-write-side">
                                    <label htmlFor="pawmail-receiver">Send to</label>
                                    <select id="pawmail-receiver" value={mailTo} onChange={(e) => setMailTo(e.target.value)}>
                                        <option value="">Choose a friend...</option>
                                        {accepted.map((f) => (
                                            <option key={f.friend_id} value={f.friend_id}>
                                                @{f.username}
                                            </option>
                                        ))}
                                    </select>
                                    <label htmlFor="pawmail-body">
                                        Your message <span>{mailMessage.length}/100</span>
                                    </label>
                                    <textarea
                                        id="pawmail-body"
                                        maxLength={100}
                                        rows={4}
                                        value={mailMessage}
                                        onChange={(e) =>
                                            setMailMessage(e.target.value.slice(0, 100))
                                        }
                                        placeholder="Write something sweet for your friend..."
                                    />
                                    <label>Envelope color</label>
                                    <div className="paw-envelope-colors pawmail-compose-colors">
                                        {ENVELOPE_COLORS.map(([id, name, hex]) => (
                                            <button
                                                type="button"
                                                key={id}
                                                title={name}
                                                aria-label={name}
                                                aria-pressed={mailColor === id}
                                                className={mailColor === id ? "selected" : ""}
                                                style={{
                                                    background: hex
                                                }}
                                                onClick={() => setMailColor(id)}
                                            />
                                        ))}
                                    </div>
                                    <div className="pawmail-design-summary">
                                        <span
                                            className={
                                                "pawmail-design-icon paw-envelope-" + mailDesign
                                            }
                                        >
                                            <Suspense fallback={null}>
                                                <EnvelopeArtwork design={mailDesign} />
                                            </Suspense>
                                        </span>
                                        <span>
                                            <small>Your envelope</small>
                                            <b>
                                                {mailCatalog.find((d) => d.id === mailDesign)
                                                    ?.title || "Classic Letter"}
                                            </b>
                                        </span>
                                        <button type="button" className="pawmail-collection-launch" onClick={() => setMailModal("collection")}>
                                            Collection <ArrowRight size={15} />
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        className="pawmail-send-button primary"
                                        disabled={busy || !mailTo || !mailMessage.trim()}
                                        onClick={async () => {
                                            const result = await execute("/mail", {
                                                friendId: mailTo,
                                                design: mailDesign,
                                                color: mailColor,
                                                message: mailMessage.trim()
                                            });
                                            if (result) {
                                                setMailMessage("");
                                                setMailModal(null);
                                                setNotice("Your PawMail was delivered!");
                                                void refresh();
                                            }
                                        }}
                                    >
                                        <Send size={17} /> Send PawMail
                                    </button>
                                </div>
                                <div className="pawmail-live-side">
                                    <div className="pawmail-live-title">LIVE PREVIEW</div>
                                    <Suspense fallback={null}>
                                        <PawPostcard
                                            design={mailDesign}
                                            color={mailColor}
                                            message={mailMessage}
                                            senderPet={pet}
                                        />
                                    </Suspense>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
                {user && mailModal === "collection" && pet && (
                    <div className="paw-modal-backdrop" onMouseDown={(e) => {if (e.target ===e.currentTarget) {setMailModal("compose");}}}>
                        <section className="paw-modal pawmail-window pawmail-collection-window" role="dialog" aria-modal="true" aria-labelledby="pawmail-collection-heading">
                            <div className="paw-modal-top">
                                <div>
                                    <h2 id="pawmail-collection-heading">Envelope Collection</h2>
                                    <p className="paw-modal-subtitle">
                                        Discover special letter art as your pet grows.
                                    </p>
                                </div>
                                <button type="button" className="paw-modal-close" aria-label="Back to writing" onClick={() => setMailModal("compose")}>
                                    <X size={19} />
                                </button>
                            </div>
                            <div className="pawmail-collection-count">
                                <span>
                                    {ownedEnvelopes.length} / {mailCatalog.length} collected
                                </span>
                                <span>Your pet: Level {pet.level}</span>
                            </div>
                            <div className="pawmail-collection-grid">
                                {mailCatalog.map((d) => {
                                    const owned = ownedEnvelopes.includes(d.id);
                                    const levelLocked = pet.level < d.level && !owned;
                                    const selected = mailDesign === d.id;
                                    return (
                                        <article
                                            key={d.id}
                                            className={
                                                "pawmail-collection-card " +
                                                (selected ? "selected " : "") +
                                                (levelLocked ? "level-locked" : "")
                                            }
                                        >
                                            <div className={ "pawmail-collection-art paw-envelope-" + d.id}>
                                                <Suspense fallback={null}>
                                                    <EnvelopeArtwork design={d.id} />
                                                </Suspense>
                                                {levelLocked && (
                                                    <span className="pawmail-art-lock">
                                                        <LockKeyhole size={17} /> Lv. {d.level}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="pawmail-collection-info">
                                                <b>{d.title}</b>
                                                <small>
                                                    {d.level > 1
                                                        ? `Unlocks at Level ${d.level}`
                                                        : d.id === "classic"
                                                            ? "Your first letter"
                                                            : "Available from Level 1"}
                                                </small>
                                            </div>
                                            {owned ? (
                                                <button
                                                    type="button"
                                                    className={
                                                        "pawmail-choose " +
                                                        (selected ? "chosen" : "")
                                                    }
                                                    onClick={() => {
                                                        setMailDesign(d.id);
                                                        setMailModal("compose");
                                                    }}
                                                >
                                                    {selected ? "Selected" : "Choose design"}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="pawmail-buy"
                                                    disabled={
                                                        busy || levelLocked || pet.coins < d.price
                                                    }
                                                    onClick={async () => {
                                                        const result = await execute(
                                                            "/mail/designs/buy",
                                                            {
                                                                design: d.id
                                                            }
                                                        );
                                                        if (result) {
                                                            setOwnedEnvelopes((v) => [
                                                                ...new Set([...v, d.id])
                                                            ]);
                                                            setMailDesign(d.id);
                                                        }
                                                    }}
                                                >
                                                    {levelLocked ? (
                                                        <>
                                                            <LockKeyhole size={13} /> Level{" "}
                                                            {d.level}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Coins size={13} />{" "}
                                                            {d.price.toLocaleString()}
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                            <div className="pawmail-collection-footer">
                                <button className="primary" onClick={() => setMailModal("compose")}>
                                    Back to letter
                                </button>
                            </div>
                        </section>
                    </div>
                )}
                {user && editingNote && (
                    <div className="paw-modal-backdrop" onMouseDown={(e) => {if (e.target ===e.currentTarget) {setEditingNote(false);}}}>
                        <section className="paw-modal paw-note-modal" role="dialog" aria-modal="true" aria-labelledby="paw-note-title">
                            <div className="paw-modal-top">
                                <div>
                                    <div className="eyebrow">A LITTLE MESSAGE</div>
                                    <h2 id="paw-note-title">Pet Note ♡</h2>
                                </div>
                                <button type="button" className="paw-modal-close" aria-label="Close Pet Note" onClick={() => setEditingNote(false)}>
                                    <X size={19} strokeWidth={1.8} aria-hidden="true" />
                                </button>
                            </div>
                            <div className="paw-note-preview" aria-label="Preview of how your note appears">
                                <div className="paw-note-preview-pet">
                                    <PetArt
                                        species={pet?.species || "cat"}
                                        color={pet?.color}
                                        breed={pet?.breed}
                                        cosmetic={pet?.equipped_cosmetic}
                                        outfit={pet?.equipped_outfit}
                                    />
                                </div>
                                <div className="paw-note-preview-content">
                                    <span className="paw-note-preview-label">
                                        <Sparkles size={13} aria-hidden="true" />{" "}
                                        {pet?.name || "Your pet"} says
                                    </span>
                                    <span className="paw-note-preview-bubble">
                                        {noteDraft.trim() || "What is on your mind?"}
                                    </span>
                                </div>
                            </div>
                            <p className="paw-note-helper">
                                Friends will spot a note icon beside your pet's name. Tapping it
                                reveals your message.
                            </p>
                            <form
                                className="paw-note-form"
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const result = await execute("/notes", {
                                        text: noteDraft
                                    });
                                    if (result) {
                                        setEditingNote(false);
                                        await refresh();
                                    }
                                }}
                            >
                                <div className="paw-note-label-row">
                                    <label htmlFor="pawpal-note">Write your note</label>
                                    <span className="paw-note-char-count" aria-live="polite">
                                        {noteDraft.length}/20
                                    </span>
                                </div>
                                <input
                                    id="pawpal-note"
                                    maxLength={20}
                                    value={noteDraft}
                                    onChange={(e) => setNoteDraft(e.target.value)}
                                    placeholder="A little thought..."
                                    autoComplete="off"
                                />
                                <div className="paw-note-actions">
                                    <button
                                        type="button"
                                        className="paw-note-delete secondary"
                                        disabled={busy || !user.pet_note}
                                        onClick={async () => {
                                            const result = await execute(
                                                "/notes",
                                                undefined,
                                                "DELETE"
                                            );
                                            if (result) {
                                                setNoteDraft("");
                                                setEditingNote(false);
                                                await refresh();
                                            }
                                        }}
                                    >
                                        Remove note
                                    </button>
                                    <button type="submit" className="paw-note-save primary" disabled={busy || !noteDraft.trim()}>
                                        <Check size={17} aria-hidden="true" /> Save note
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                )}
                {friendToast && (
                    <div className="paw-friend-toast" role="alert">
                        <div>
                            <b>New friend request ♡</b>
                            <p>@{friendToast.username} wants to be friends!</p>
                        </div>
                        <button
                            onClick={() => {
                                setFriendDecision(friendToast);
                                setFriendToast(null);
                            }}
                        >
                            View request
                        </button>
                        <button className="secondary" aria-label="Dismiss notification" onClick={() => setFriendToast(null)}>
                            ×
                        </button>
                    </div>
                )}
                {friendDecision && (
                    <div className="paw-modal-backdrop" onMouseDown={(e) => {if (e.target ===e.currentTarget) {setFriendDecision(null);}}}>
                        <section className="paw-modal" role="dialog" aria-modal="true" aria-labelledby="friend-decision-title">
                            <div className="paw-modal-top">
                                <div>
                                    <h2 id="friend-decision-title">New friend request</h2>
                                    <p className="paw-modal-subtitle">
                                        @{friendDecision.username} wants to be friends!
                                    </p>
                                </div>
                                <button type="button" className="paw-modal-close" aria-label="Close friend request" onClick={() => setFriendDecision(null)}>
                                    <X size={19} />
                                </button>
                            </div>
                            <p>Would you like to accept their friend request?</p>
                            <div className="paw-modal-actions">
                                <button
                                    disabled={busy}
                                    className="primary"
                                    onClick={async () => {
                                        const ok = await execute(
                                            "/friends/" + friendDecision.friend_id + "/accept",
                                            {},
                                            "POST"
                                        );
                                        if (ok) {
                                            setFriendDecision(null);
                                        }
                                    }}
                                >
                                    Accept request ✓
                                </button>
                                <button
                                    disabled={busy}
                                    className="secondary"
                                    onClick={async () => {
                                        const ok = await execute(
                                            "/friends/" + friendDecision.friend_id,
                                            undefined,
                                            "DELETE"
                                        );
                                        if (ok) {
                                            setFriendDecision(null);
                                        }
                                    }}
                                >
                                    Decline
                                </button>
                                <button className="secondary" onClick={() => setFriendDecision(null)}>
                                    Later
                                </button>
                            </div>
                        </section>
                    </div>
                )}
                {removeFriend && (
                    <div className="paw-modal-backdrop" onMouseDown={(e) => {if (e.target ===e.currentTarget) {setRemoveFriend(null);}}}>
                        <section className="paw-modal" role="dialog" aria-modal="true" aria-labelledby="unfriend-title">
                            <div className="paw-modal-top">
                                <div>
                                    <h2 id="unfriend-title">Remove friend?</h2>
                                    <p className="paw-modal-subtitle">
                                        You can reconnect with them later.
                                    </p>
                                </div>
                                <button type="button" className="paw-modal-close" aria-label="Close remove friend confirmation" onClick={() => setRemoveFriend(null)}>
                                    <X size={19} />
                                </button>
                            </div>
                            <p>
                                Remove @{removeFriend.username} from your PawPal friends? You can
                                send another request later.
                            </p>
                            <div className="paw-modal-actions">
                                <button className="secondary" onClick={() => setRemoveFriend(null)}>
                                    Cancel
                                </button>
                                <button
                                    className="paw-unfriend-confirm"
                                    disabled={busy}
                                    onClick={async () => {
                                        const ok = await execute(
                                            "/friends/" + removeFriend.friend_id,
                                            undefined,
                                            "DELETE"
                                        );
                                        if (ok) {
                                            setRemoveFriend(null);
                                        }
                                    }}
                                >
                                    Remove friend
                                </button>
                            </div>
                        </section>
                    </div>
                )}
                {notice && (
                    <div className="notice paw-toast" role="status">
                        <Sparkles size={16} aria-hidden="true" /> {notice}
                        <button onClick={() => setNotice("")}>×</button>
                    </div>
                )}
                {!token ? (
                    <>
                    {authMode === "welcome" ? <PublicWelcome onLogin={() => setAuthMode("login")} onRegister={() => setAuthMode("register")} onPolicy={setPolicyOpen} /> :
                    <AuthScreen
                        authMode={authMode}
                        forgotTicket={forgotTicket}
                        requestForgotPassword={requestForgotPassword}
                        authenticate={authenticate}
                        forgotStatus={forgotStatus}
                        clearForgotRequest={clearForgotRequest}
                        setAuthMode={setAuthMode}
                        username={username}
                        setUsername={setUsername}
                        password={password}
                        setPassword={setPassword}
                        setForgotError={setForgotError}
                        forgotError={forgotError}
                        busy={busy}
                        forgotBusy={forgotBusy}
                    />
                    }
                    </>
                ) : !user ? (
                    <p>Loading your playhouse…</p>
                ) : !pet ? (
                    <Suspense fallback={<PanelLoader />}>
                        <AdoptionScreen
                            oldPetId={oldPetId}
                            execute={execute}
                            choice={choice}
                            setChoice={setChoice}
                            petName={petName}
                            setPetName={setPetName}
                            adoptionAcknowledged={adoptionAcknowledged}
                            setAdoptionAcknowledged={setAdoptionAcknowledged}
                            busy={busy}
                        />
                    </Suspense>
                ) : (
                    <>
                        <div className="heading paw-dashboard-heading">
                            <div className="paw-dashboard-greeting">
                                <h1>
                                    Welcome home, <em>{pet.name}!</em>
                                </h1>
                            </div>
                            <div className="paw-account-summary" aria-label="Your account at a glance">
                                <div className="paw-account-stat paw-account-coins">
                                    <span className="paw-account-icon">
                                        <Coins size={22} />
                                    </span>
                                    <span className="paw-account-copy">
                                        <small>PAW COINS</small>
                                        <strong>{pet.coins.toLocaleString()}</strong>
                                    </span>
                                </div>
                                <div className="paw-account-stat paw-account-level">
                                    <span className="paw-account-icon">
                                        <Star size={22} />
                                    </span>
                                    <span className="paw-account-copy">
                                        <small>PET LEVEL</small>
                                        <strong>{pet.level}</strong>
                                        <span className="paw-account-xp" title={`${pet.xp} / ${pet.level * 100} XP`}>
                                            <span
                                                style={{
                                                    width: `${Math.min(100, (100 * pet.xp) / Math.max(1, pet.level * 100))}%`
                                                }}
                                            />
                                        </span>
                                    </span>
                                </div>
                                <div className="paw-account-stat paw-account-friends">
                                    <span className="paw-account-icon">
                                        <Users size={22} />
                                    </span>
                                    <span className="paw-account-copy">
                                        <small>FRIENDS</small>
                                        <strong>{accepted.length}</strong>
                                    </span>
                                </div>
                                <button className="mobile-menu-toggle" aria-label="Toggle navigation" title="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((x) => !x)}>
                                    <span className="paw-menu-icon" aria-hidden="true">
                                        {menuOpen ? (
                                            <X size={20} strokeWidth={2.4} />
                                        ) : (
                                            <Menu size={20} strokeWidth={2.4} />
                                        )}
                                    </span>
                                </button>
                            </div>
                        </div>
                        <div className="layout">
                            <aside className={"sidebar " + (menuOpen ? "menu-open" : "")}>
                                <div className="profile">
                                    <span className="profile-pet-portrait">
                                        <PetArt
                                            species={pet.species}
                                            color={pet.color}
                                            breed={pet.breed}
                                            cosmetic={pet.equipped_cosmetic}
                                            outfit={pet.equipped_outfit}
                                        />
                                    </span>
                                    <div>
                                        <b>{pet.name}</b>
                                        <small>
                                            {pet.species} ·{" "}
                                            {pet.level < 5
                                                ? "Baby"
                                                : pet.level < 30
                                                    ? "Teen"
                                                    : "Adult"}
                                        </small>
                                        <small>@{user.username}</small>
                                    </div>
                                </div>
                                <div className="xp">
                                    <div
                                        style={{
                                            width: `${(pet.xp / (pet.level * 100)) * 100}%`
                                        }}
                                    />
                                </div>
                                <small>
                                    {pet.xp}/{pet.level * 100} XP
                                </small>
                                <nav>
                                    {[
                                        ["home", "home", "Room"],
                                        ["friends", "friends", "Friends"],
                                        ["shop", "shop", "Market"],
                                        ["wardrobe", "wardrobe", "Wardrobe"],
                                        ["games", "games", "Mini-games"],
                                        ["multiplayer", "multiplayer", "Multiplayer"],
                                        ["garden", "garden", "Lucky Garden"],
                                        ["kitchen", "kitchen", "Kitchen"],
                                        ["missions", "missions", "Missions"]
                                    ].map(([id, icon, label]) => (
                                        <button
                                            key={id}
                                            className={tab === id ? "active" : ""}
                                            onClick={() => {
                                                setTab(id);
                                                setMenuOpen(false);
                                            }}
                                            aria-label={`${label}${id === "missions" && missionReady ? ", rewards ready to claim" : id === "garden" && hasHarvestReady ? ", flowers ready to harvest" : ""}`}
                                        >
                                            <PawIcon name={id} /> {label}
                                            {((id === "missions" && missionReady) ||
                                                (id === "garden" && hasHarvestReady)) && (
                                                <span
                                                    className="paw-nav-attention"
                                                    aria-hidden="true"
                                                />
                                            )}
                                            <span>›</span>
                                        </button>
                                    ))}
                                </nav>
                                <div className="daily">
                                    <b>
                                        <Gift size={17} /> Daily surprise
                                    </b>
                                    <p>
                                        {pet.daily_claimed_at &&
                                        nowTick <
                                            (Math.floor(
                                                (new Date(pet.daily_claimed_at).getTime() +
                                                    28800000) /
                                                    86400000
                                            ) +
                                                1) *
                                                86400000 -
                                                28800000
                                            ? `Next gift in ${Math.floor(((Math.floor((new Date(pet.daily_claimed_at).getTime() + 28800000) / 86400000) + 1) * 86400000 - 28800000 - nowTick) / 3600000)}h ${Math.floor((((Math.floor((new Date(pet.daily_claimed_at).getTime() + 28800000) / 86400000) + 1) * 86400000 - 28800000 - nowTick) % 3600000) / 60000)}m ${Math.floor((((Math.floor((new Date(pet.daily_claimed_at).getTime() + 28800000) / 86400000) + 1) * 86400000 - 28800000 - nowTick) % 60000) / 1000)}s`
                                            : "Daily at 12 AM PH time: 120 coins, 2 meals and 5 Berry Parfaits!"}
                                    </p>
                                    <button
                                        disabled={
                                            busy ||
                                            Boolean(
                                                pet.daily_claimed_at &&
                                                Date.now() <
                                                    (Math.floor(
                                                        (new Date(pet.daily_claimed_at).getTime() +
                                                            28800000) /
                                                            86400000
                                                    ) +
                                                        1) *
                                                        86400000 -
                                                        28800000
                                            )
                                        }
                                        onClick={() => void execute("/daily/claim", {})}
                                    >
                                        {pet.daily_claimed_at &&
                                        Date.now() <
                                            (Math.floor(
                                                (new Date(pet.daily_claimed_at).getTime() +
                                                    28800000) /
                                                    86400000
                                            ) +
                                                1) *
                                                86400000 -
                                                28800000
                                            ? "Cooling down"
                                            : "Claim reward"}
                                    </button>
                                </div>
                            </aside>
                            <div className="main-column">
                                <Suspense fallback={<PanelLoader />}>
                                    {tab === "home" ? (
                                        <RoomPanel
                                            pet={pet}
                                            roomMenuOpen={roomMenuOpen}
                                            setRoomMenuOpen={setRoomMenuOpen}
                                            busy={busy}
                                            execute={execute}
                                            setSelectedFurniture={setSelectedFurniture}
                                            setEditFurniture={setEditFurniture}
                                            refresh={refresh}
                                            setThemeModal={setThemeModal}
                                            roomColors={roomColors}
                                            hideVisitingPets={hideVisitingPets}
                                            toggleVisitingPets={toggleVisitingPets}
                                            setNoteDraft={setNoteDraft}
                                            user={user}
                                            setEditingNote={setEditingNote}
                                            themeModal={themeModal}
                                            setMealModal={setMealModal}
                                            setMealBusy={setMealBusy}
                                            token={token}
                                            setMealData={setMealData}
                                            setNotice={setNotice}
                                            setPlayPickerOpen={setPlayPickerOpen}
                                            sleepPending={sleepPending}
                                            togglePetSleep={togglePetSleep}
                                            bathMode={bathMode}
                                            setBathMode={setBathMode}
                                            setCuddleMode={setCuddleMode}
                                            bathScrubbing={bathScrubbing}
                                            cuddleActive={cuddleActive}
                                            cuddleMode={cuddleMode}
                                            editFurniture={editFurniture}
                                            selectedFurniture={selectedFurniture}
                                            visible={visible}
                                            cuddleLastMove={cuddleLastMove}
                                            bathLastMove={bathLastMove}
                                            setOpenRoomNoteId={setOpenRoomNoteId}
                                            openRoomNoteId={openRoomNoteId}
                                            openedRoomNote={openedRoomNote}
                                            mealModal={mealModal}
                                            mealBusy={mealBusy}
                                            mealData={mealData}
                                        />
                                    ) : tab === "friends" ? (
                                        <FriendsPanel
                                            mail={mail}
                                            openPawInbox={openPawInbox}
                                            openPawComposer={openPawComposer}
                                            setRequestsOpen={setRequestsOpen}
                                            unseenIncomingRequests={unseenIncomingRequests}
                                            requestsOpen={requestsOpen}
                                            pending={pending}
                                            friendSearch={friendSearch}
                                            setFriendSearch={setFriendSearch}
                                            setFound={setFound}
                                            request={request}
                                            setNotice={setNotice}
                                            found={found}
                                            busy={busy}
                                            execute={execute}
                                            user={user}
                                            setRemoveFriend={setRemoveFriend}
                                            accepted={accepted}
                                            roomPets={roomPets}
                                        />
                                    ) : tab === "wardrobe" ? (
                                        <WardrobePanel pet={pet} execute={execute} busy={busy} />
                                    ) : tab === "shop" ? (
                                        <MarketPanel
                                            marketRoom={marketRoom}
                                            setMarketRoom={setMarketRoom}
                                            pet={pet}
                                            busy={busy}
                                            execute={execute}
                                        />
                                    ) : tab === "multiplayer" ? (
                                        <Multiplayer
                                            api={API}
                                            token={token}
                                            userId={user.id}
                                            friends={friends}
                                            coins={pet.coins}
                                            petLevel={pet.level}
                                            refreshSignal={multiplayerSignal}
                                            onUpdate={refresh}
                                            onToast={setNotice}
                                        />
                                    ) : tab === "games" ? (
                                        <ArcadePanel
                                            launchGame={launchGame}
                                            pet={pet}
                                            records={records}
                                        />
                                    ) : tab === "garden" ? (
                                        <GardenPanel
                                            garden={pet.garden}
                                            coins={pet.coins}
                                            busy={busy}
                                            nowTick={nowTick}
                                            onAction={(body) => execute("/garden", body)}
                                        />
                                    ) : tab === "kitchen" ? (
                                        <Kitchen
                                            token={token}
                                            api={API}
                                            onPetChange={refresh}
                                            onToast={setNotice}
                                        />
                                    ) : tab === "missions" ? (
                                        <MissionCenter
                                            token={token}
                                            api={API}
                                            onPetChange={refresh}
                                            onToast={setNotice}
                                            onReadyChange={setMissionReady}
                                        />
                                    ) : (
                                        <section className="panel">
                                            <SectionHeading title="Missions" Icon={Trophy} eyebrow="YOUR PAWPAL JOURNEY" />
                                            <div className="stats-grid">
                                                {[
                                                    ["Pet level", pet.level],
                                                    ["Coins", pet.coins],
                                                    ["Friends", accepted.length],
                                                    ["Flowers", pet.garden.flowers],
                                                    ["Toys", pet.toys],
                                                    [
                                                        "Growth",
                                                        pet.level < 5
                                                            ? "Baby"
                                                            : pet.level < 30
                                                                ? "Teen"
                                                                : "Adult"
                                                    ]
                                                ].map(([label, value]) => (
                                                    <div className="stat" key={String(label)}>
                                                        <b>{label}</b>
                                                        <h2>{value}</h2>
                                                    </div>
                                                ))}
                                            </div>
                                            <h3>Achievement badges</h3>
                                            {[
                                                ["first_friend", "friends", "Make a friend"],
                                                ["level_5", "level", "Reach level 5"],
                                                ["rich", "coins", "Save 500 coins"]
                                            ]
                                                .sort((a, b) => {
                                                                                                        /*
                                                     * DOCU: Return the current status for the requested operation.
                                                     * @param {string} code - code value used by this function
                                                     *
                                                     * Last Updated: 2026-11-13
                                                     * Author: Jorge
                                                     * Last Updated By: Jorge
                                                     */
const status = (code: string) =>
                                                        achievements.includes(code)
                                                            ? 2
                                                            : (code === "level_5" &&
                                                                    pet.level >= 5) ||
                                                                (code === "rich" &&
                                                                    pet.coins >= 500) ||
                                                                (code === "first_friend" &&
                                                                    accepted.length > 0)
                                                                ? 0
                                                                : 1;
                                                    return status(a[0]) - status(b[0]);
                                                })
                                                .map(([code, icon, label]) => (
                                                    <div className="friend-row" key={code}>
                                                        <b>
                                                            <PawIcon name={icon} /> {label}
                                                        </b>
                                                        <button
                                                            disabled={achievements.includes(code)}
                                                            onClick={() =>
                                                                void execute(
                                                                    "/achievements/claim-all",
                                                                    {}
                                                                ).then(() => void refresh())
                                                            }
                                                        >
                                                            {achievements.includes(code)
                                                                ? "Claimed ✓"
                                                                : (code === "level_5" &&
                                                                        pet.level >= 5) ||
                                                                    (code === "rich" &&
                                                                        pet.coins >= 500) ||
                                                                    (code === "first_friend" &&
                                                                        accepted.length > 0)
                                                                    ? "Claim all ready"
                                                                    : "In progress"}
                                                        </button>
                                                    </div>
                                                ))}
                                            <h3>Daily quests</h3>
                                        </section>
                                    )}
                                </Suspense>
                            </div>
                        </div>
                    </>
                )}
            </main>
            {playPickerOpen && pet && (
                <div className="paw-modal-backdrop" onMouseDown={(e) => {if (e.target ===e.currentTarget) {setPlayPickerOpen(false);}}}>
                    <section className="paw-modal paw-play-picker" role="dialog" aria-modal="true" aria-label="Play with your pet">
                        <div className="paw-modal-top">
                            <div>
                                <h2>Choose a game</h2>
                                <p className="paw-modal-subtitle">
                                    Playing uses energy and gets your paws a little dirty.
                                </p>
                            </div>
                            <button className="paw-modal-close" aria-label="Close games" onClick={() => setPlayPickerOpen(false)}>
                                <X size={19} />
                            </button>
                        </div>
                        <div className="paw-play-options">
                            {PAW_GAMES.map(([id, , label]) => (
                                <button
                                    key={id}
                                    onClick={() => {
                                        setPlayPickerOpen(false);
                                        void launchGame(id, pet.species);
                                    }}
                                >
                                    <PawIcon name={id} size={24} />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            )}
            <footer>
                © {new Date().getFullYear()} PawPal. All rights reserved. Created by <b>HORHEEE</b>.
            </footer>
            <Suspense fallback={null}>
                {game &&
                    pet &&
                    (game === "claw" ? (
                        <PawClaw
                            pet={pet}
                            onQuit={() => setGame(null)}
                            onPlay={async () => {
                                const result = await execute("/claw/play", {});
                                if (result) {
                                    await refresh();
                                }
                                return result;
                            }}
                        />
                    ) : game === "mole" ? (
                        <WhackAMole
                            onQuit={() => setGame(null)}
                            onFinish={(score) => claimArcadeReward(game, score)}
                        />
                    ) : game === "bubble" ? (
                        <BubblePop
                            onQuit={() => setGame(null)}
                            onFinish={(score) => claimArcadeReward(game, score)}
                        />
                    ) : (
                        <MiniGame
                            key={game}
                            kind={game}
                            pet={pet}
                            onQuit={() => setGame(null)}
                            onFinish={(score) => claimArcadeReward(game, score)}
                        />
                    ))}
            </Suspense>
        </div>
    );
}
