import { Gamepad2 } from "lucide-react";
import { ClawMenuIcon, MoleGameIcon } from "./ArcadeArt";
import { PAW_GAMES } from "./MiniGame";
import { PawIcon } from "./PawIcons";
import SectionHeading from "./SectionHeading";
import type { Pet } from "./types";

type Props = {
    launchGame: (id: string, petSpecies: string) => Promise<void>;
    pet: Pet;
    records: { game: string; best: number }[];
};

export default function ArcadePanel({ launchGame, pet, records }: Props) {
    return (
        <section className="panel">
            <div className="eyebrow">THE LITTLE ARCADE</div>
            <SectionHeading title="Mini-games" Icon={Gamepad2} />
            <div className="games-grid">
                {PAW_GAMES.map(([id, icon, label]) => (
                    <button
                        key={id}
                        onClick={() => {
                            void launchGame(id, pet.species);
                        }}
                    >
                        <span className={"paw-game-art paw-game-art-" + id}>
                            {id === "mole" ? (
                                <MoleGameIcon />
                            ) : id === "claw" ? (
                                <ClawMenuIcon />
                            ) : (
                                <PawIcon name={id} size={34} />
                            )}
                        </span>
                        <b>{label}</b>
                        <small>
                            {id === "claw"
                                ? "Prize machine · 15s cooldown"
                                : `Personal best: ${records.find((r) => r.game === id)?.best || 0}`}
                        </small>
                        <strong>PLAY →</strong>
                    </button>
                ))}
            </div>
        </section>
    );
}
