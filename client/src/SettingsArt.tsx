import type { SVGProps } from "react";

export type AppearanceChoice = "light" | "dark" | "system";

type SettingsArtworkProps = SVGProps<SVGSVGElement> & {
    choice: AppearanceChoice;
};

/*
 * DOCU: Render the settings artwork interface and provide its feature behavior.
 * @param {SettingsArtworkProps} props - Properties supplied to the component or operation
 *
 * Last Updated: 2026-11-13
 * Author: Jorge
 * Last Updated By: Jorge
 */
export function SettingsArtwork({ choice, ...props }: SettingsArtworkProps) {
    const isNight = choice === "dark";
    const isSystem = choice === "system";
    const sky = isNight ? "#383653" : "#cce9f9";
    const ground = isNight ? "#7f7a9e" : "#a9d7b6";

    return (
        <svg viewBox="0 0 184 112" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`${choice} appearance artwork`} {...props}>
            <rect x="2" y="2" width="180" height="108" rx="18" fill={isSystem ? "#f0e5fb" : isNight ? "#514761" : "#ffebf2"} />
            {isSystem ? (
                <>
                    <rect x="24" y="16" width="136" height="76" rx="12" fill="#8e79ab" />
                    <rect x="30" y="22" width="124" height="62" rx="8" fill="#fae3ed" />
                    <path d="M92 22 H146 Q154 22 154 30 V76 Q154 84 146 84 H92 Z" fill="#423f66" />
                    <circle cx="60" cy="46" r="12" fill="#f8c46e" />
                    <circle cx="123" cy="46" r="11" fill="#f0e5ae" />
                    <circle cx="129" cy="41" r="10" fill="#423f66" />
                    <path d="M36 70 Q57 52 79 70 V83 H36 Z" fill="#a6d9b3" />
                    <path d="M103 72 Q124 53 148 72 V83 H103 Z" fill="#8981ae" />
                    <rect x="72" y="94" width="40" height="5" rx="2.5" fill="#a692be" />
                    <rect x="64" y="99" width="56" height="4" rx="2" fill="#c6b1d5" />
                </>
            ) : (
                <>
                    <rect x="14" y="12" width="156" height="88" rx="13" fill={sky} />
                    {isNight ? (
                        <>
                            <path d="M139 30 A17 17 0 1 1 123 14 A15 15 0 1 0 139 30" fill="#fff1bd" />
                            <path d="M43 29 l3 6 7 2 -7 2 -3 6 -3 -6 -7 -2 7 -2 Z" fill="#fff3d4" />
                            <circle cx="87" cy="26" r="3" fill="#fff3d4" />
                            <circle cx="105" cy="39" r="2" fill="#fff3d4" />
                        </>
                    ) : (
                        <>
                            <circle cx="139" cy="34" r="15" fill="#ffd16e" />
                            <path d="M38 34 q9 -11 19 0 q10 -10 20 1" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
                            <path d="M86 26 q8 -8 17 0" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
                        </>
                    )}
                    <path d="M14 77 Q57 53 97 76 Q131 55 170 74 V88 Q92 108 14 88 Z" fill={ground} />
                    <path d="M14 88 Q45 66 87 85 Q129 66 170 86 V99 H14 Z" fill={isNight ? "#68688f" : "#7fc69c"} />
                    <rect x="83" y="60" width="31" height="31" rx="7" fill={isNight ? "#f0cade" : "#ffdae9"} stroke={isNight ? "#bda2c7" : "#dba2bd"} strokeWidth="2" />
                    <path d="M80 66 L98 51 L117 66" fill="none" stroke={isNight ? "#f5dfeb" : "#eb9ebc"} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="95" y="74" width="9" height="17" rx="4.5" fill={isNight ? "#8a719e" : "#c58fae"} />
                    <circle cx="44" cy="85" r="10" fill={isNight ? "#ad9dbd" : "#f6c2d0"} />
                    <circle cx="151" cy="84" r="12" fill={isNight ? "#a99bc6" : "#f8c3d2"} />
                </>
            )}
        </svg>
    );
}
