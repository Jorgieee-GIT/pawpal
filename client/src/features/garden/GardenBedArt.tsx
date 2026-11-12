/** A tiny garden diorama. All unrevealed flowers share the same growing stages. */
export type GardenGrowthStage = "empty" | "seed" | "sprout" | "bud" | "ready" | "locked";

export function GardenBedArt({ stage }: {
    stage: GardenGrowthStage
}) {
    const growing = stage !== "empty" && stage !== "locked";
    return (
        <svg
            className={`paw-garden-bed-svg stage-${stage}`}
            viewBox="50 0 150 120"
            role="img"
            aria-label={stage === "ready" ? "A mystery flower ready to reveal" : stage === "locked" ? "A fenced, locked soil spot" : stage === "empty" ? "An empty garden soil spot" : "A growing mystery flower"}
        >
            {stage === "empty" && <g>
                <path d="M94 109q26-12 54-3M106 115q22-8 45-2" stroke="#bd9279" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M120 96l5-9 5 9" stroke="#d4ae8a" strokeWidth="2" fill="none" />
            </g>}
            {stage === "locked" && <g>
                <path d="M81 104V62M110 108V55M140 108V55M169 104V62" stroke="#b89076" strokeWidth="9" strokeLinecap="round" />
                <path d="M72 80Q125 93 178 80" stroke="#9d795f" strokeWidth="8" fill="none" strokeLinecap="round" />
                <rect x="111" y="55" width="28" height="23" rx="5" fill="#e8cfc0" stroke="#aa8a79" strokeWidth="3" />
                <path d="M119 54V49a6 6 0 0 1 12 0v5" fill="none" stroke="#aa8a79" strokeWidth="3" />
            </g>}
            {stage === "seed" && <g>
                <ellipse cx="125" cy="101" rx="21" ry="8" fill="#8b604f" />
                <path d="M115 100q10-14 20 0" stroke="#a97d60" strokeWidth="4" fill="none" />
                <circle cx="123" cy="94" r="2.5" fill="#f8d49c" />
            </g>}
            {growing && stage !== "seed" && <g className="paw-garden-live-plant">
                <path
                    d={stage === "sprout" ? "M124 100V77" : "M124 101Q119 80 124 45"}
                    stroke="#4d9163"
                    strokeWidth={stage === "sprout" ? "5" : "6"}
                    fill="none"
                    strokeLinecap="round"
                />
                <path
                    d={stage === "sprout" ? "M124 85Q105 68 104 83Q115 94 124 89M124 79Q141 66 145 80Q133 91 124 87" : "M124 83Q102 61 94 75Q99 94 124 91M124 72Q146 50 157 65Q152 83 124 83M124 62Q110 47 105 57Q112 73 124 75"}
                    fill="#83c68a"
                    stroke="#4f9f75"
                    strokeWidth="2.8"
                    strokeLinejoin="round"
                />
                {stage !== "sprout" && <g>
                    <path
                        d="M124 48Q99 43 106 27Q124 17 138 28Q151 42 124 48Z"
                        fill={stage === "ready" ? "#e7bedb" : "#b6d8b2"}
                        stroke={stage === "ready" ? "#bd80aa" : "#729c76"}
                        strokeWidth="3"
                    />
                    <path
                        d="M124 46Q111 35 120 25M124 47Q138 37 132 29"
                        stroke={stage === "ready" ? "#c58eb0" : "#8eb995"}
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                    />
                </g>}
                {stage === "ready" && <g className="paw-garden-bud-sparkles" fill="#ffeab1">
                    <path d="M91 30l3-7 3 7 7 3-7 3-3 7-3-7-7-3Z" />
                    <path d="M164 22l2-5 2 5 5 2-5 2-2 5-2-5-5-2Z" />
                    <circle cx="158" cy="52" r="3" />
                    <circle cx="86" cy="56" r="2" />
                </g>}
            </g>}
        </svg>
    );
}
