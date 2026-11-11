import { Gift, Mail, MailPlus, UserRoundMinus, UserRoundPlus, Users, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import PetArt from "../../PetArt";
import SectionHeading from "../../SectionHeading";
import type { ApiRequest, ExecuteAction, Friend, PawMail, RoomPet, User } from "../../types";

type Props = {
    mail: PawMail[];
    openPawInbox: () => void;
    openPawComposer: (friendId?: string) => void;
    setRequestsOpen: Dispatch<SetStateAction<boolean>>;
    unseenIncomingRequests: Friend[];
    requestsOpen: boolean;
    pending: Friend[];
    friendSearch: string;
    setFriendSearch: Dispatch<SetStateAction<string>>;
    setFound: Dispatch<SetStateAction<User | null>>;
    request: ApiRequest;
    setNotice: Dispatch<SetStateAction<string>>;
    found: User | null;
    busy: boolean;
    execute: ExecuteAction;
    user: User;
    setRemoveFriend: Dispatch<SetStateAction<Friend | null>>;
    accepted: Friend[];
    roomPets: RoomPet[];
};

export default function FriendsPanel({
    mail,
    openPawInbox,
    openPawComposer,
    setRequestsOpen,
    unseenIncomingRequests,
    requestsOpen,
    pending,
    friendSearch,
    setFriendSearch,
    setFound,
    request,
    setNotice,
    found,
    busy,
    execute,
    user,
    setRemoveFriend,
    accepted,
    roomPets
}: Props) {
    return (
        <section className="panel paw-friends-panel">
            <div className="eyebrow">YOUR LITTLE COMMUNITY</div>
            <div className="paw-friends-title-row">
                <SectionHeading title="Friends" Icon={Users} />
                <div className="paw-requests-launch-row">
                    <button
                        type="button"
                        className={
                            "paw-requests-launch paw-friends-mail-action " +
                            (mail.some((m) => !m.read_at) ? "has-unread" : "")
                        }
                        onClick={openPawInbox}
                        aria-label={`Open PawMail inbox, ${mail.filter((m) => !m.read_at).length} unread`}
                        title="PawMail inbox"
                    >
                        <Mail size={21} strokeWidth={1.8} />
                        {mail.some((m) => !m.read_at) && <span className="paw-inbox-alert" />}
                    </button>
                    <button
                        type="button"
                        className="paw-requests-launch paw-friends-compose-action"
                        onClick={() => openPawComposer()}
                        aria-label="Write PawMail"
                        title="Write PawMail"
                    >
                        <MailPlus size={21} strokeWidth={1.8} />
                    </button>
                    <button
                        type="button"
                        className="paw-requests-launch"
                        onClick={() => setRequestsOpen(true)}
                        aria-label={`Add friends and view friend requests (${unseenIncomingRequests.length} new)`}
                        title="Add friends & requests"
                    >
                        <UserRoundPlus size={21} strokeWidth={1.8} aria-hidden="true" />
                        {unseenIncomingRequests.length > 0 && (
                            <span className="paw-requests-count">
                                {unseenIncomingRequests.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>
            {requestsOpen && (
                <div
                    className="paw-modal-backdrop"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            setRequestsOpen(false);
                        }
                    }}
                >
                    <section
                        className="paw-modal paw-requests-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="paw-requests-modal-title"
                    >
                        <div className="paw-modal-top">
                            <div>
                                <h2 id="paw-requests-modal-title">
                                    Add friends{" "}
                                    <span className="paw-requests-count">
                                        {pending.length} pending
                                    </span>
                                </h2>
                                <p className="paw-modal-subtitle">Your little community</p>
                            </div>
                            <button
                                className="paw-modal-close"
                                aria-label="Close friend requests"
                                onClick={() => setRequestsOpen(false)}
                            >
                                <X size={19} strokeWidth={1.8} aria-hidden="true" />
                            </button>
                        </div>
                        <div className="paw-requests-add">
                            <h3>Add a friend</h3>
                            <div className="search-row">
                                <input
                                    placeholder="Search exact username"
                                    value={friendSearch}
                                    onChange={(e) => {
                                        setFriendSearch(e.target.value);
                                        setFound(null);
                                    }}
                                />
                                <button
                                    className="primary"
                                    onClick={async () => {
                                        try {
                                            const r = await request(
                                                "/users/search?username=" +
                                                    encodeURIComponent(friendSearch)
                                            );
                                            setFound(r.user);
                                            if (!r.user) {
                                                setNotice("No account with that username.");
                                            }
                                        } catch (e: any) {
                                            setNotice(e.message);
                                        }
                                    }}
                                >
                                    Search
                                </button>
                            </div>
                            {found && (
                                <div className="friend-row">
                                    <b>@{found.username}</b>
                                    <button
                                        disabled={busy}
                                        onClick={() =>
                                            void execute("/friends/request", {
                                                username: found.username
                                            })
                                        }
                                    >
                                        Add friend ＋
                                    </button>
                                </div>
                            )}
                        </div>
                        <h3 className="paw-requests-subheading">
                            Friend requests ({pending.length})
                        </h3>
                        <div className="paw-requests-list">
                            {pending.length === 0 && <p>No pending requests.</p>}
                            {pending.map((f) => (
                                <div className="friend-row" key={f.friend_id}>
                                    <b>@{f.username}</b>
                                    <div className="paw-friend-actions">
                                        {f.recipient_id === user.id ? (
                                            <button
                                                onClick={() =>
                                                    void execute(
                                                        "/friends/" + f.friend_id + "/accept",
                                                        {},
                                                        "POST"
                                                    )
                                                }
                                            >
                                                Accept ✓
                                            </button>
                                        ) : (
                                            <small>Request sent</small>
                                        )}{" "}
                                        <button
                                            className="secondary"
                                            onClick={() => setRemoveFriend(f)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}{" "}
                        </div>
                    </section>
                </div>
            )}
            {accepted.length === 0 && (
                <p>No friends yet. Tap the person-plus icon above to add a friend.</p>
            )}
            {accepted.map((f) => (
                <div className="friend-row" key={f.friend_id}>
                    <div className="paw-friend-identity">
                        <span className="paw-friend-avatar">
                            {roomPets.find((p) => p.user_id === f.friend_id) ? (
                                <PetArt
                                    species={
                                        roomPets.find((p) => p.user_id === f.friend_id)!.species
                                    }
                                    breed={roomPets.find((p) => p.user_id === f.friend_id)!.breed}
                                    cosmetic={
                                        roomPets.find((p) => p.user_id === f.friend_id)!
                                            .equipped_cosmetic
                                    }
                                    outfit={
                                        roomPets.find((p) => p.user_id === f.friend_id)!
                                            .equipped_outfit
                                    }
                                />
                            ) : (
                                <span className="paw-avatar-placeholder">♡</span>
                            )}
                        </span>
                        <span className="paw-friend-name">
                            @{f.username}
                            {roomPets.find((p) => p.user_id === f.friend_id) && (
                                <small>
                                    {roomPets.find((p) => p.user_id === f.friend_id)!.name}
                                </small>
                            )}
                        </span>
                    </div>
                    <div className="paw-friend-actions paw-friend-icon-actions">
                        <button
                            type="button"
                            className="paw-friend-icon-button paw-friend-mail"
                            title="Send PawMail"
                            aria-label={`Send PawMail to @${f.username}`}
                            onClick={() => openPawComposer(f.friend_id)}
                        >
                            <MailPlus size={25} strokeWidth={1.9} aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            className="paw-friend-icon-button paw-friend-gift"
                            title="Gift 25 coins"
                            aria-label={`Gift 25 coins to @${f.username}`}
                            disabled={busy}
                            onClick={() =>
                                void execute("/gifts", {
                                    friendId: f.friend_id
                                })
                            }
                        >
                            <Gift size={25} strokeWidth={1.9} aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            className="paw-friend-icon-button paw-friend-unfriend"
                            title="Unfriend"
                            aria-label={`Unfriend @${f.username}`}
                            onClick={() => setRemoveFriend(f)}
                        >
                            <UserRoundMinus size={25} strokeWidth={1.9} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            ))}
        </section>
    );
}
