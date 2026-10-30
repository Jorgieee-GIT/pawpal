/** A tiny garden diorama. All unrevealed flowers share the same growing stages. */
export type GardenGrowthStage = 'empty' | 'seed' | 'sprout' | 'bud' | 'ready' | 'locked';

export function GardenBedArt({stage}: {stage:GardenGrowthStage}) {
    const growing = stage !== 'empty' && stage !== 'locked';
    return (
        <svg className={`paw-garden-bed-svg stage-${stage}`} viewBox="0 0 250 188" role="img" aria-label={stage === 'ready' ? 'A mystery flower ready to reveal' : stage === 'locked' ? 'A fenced, locked flower bed' : stage === 'empty' ? 'An empty raised flower bed' : 'A growing mystery flower'}>
            {/* Lush grassy verge, not a floating rectangular card. */}
            <path d="M15 146Q13 133 33 130Q35 115 59 122Q76 108 91 118Q128 104 151 115Q172 103 188 119Q216 112 220 132Q238 130 236 149Q222 172 137 174L51 168Q23 164 15 146Z" fill="#add9a0" stroke="#6da879" strokeWidth="3"/>
            <path d="M18 147Q54 135 92 145T171 145T235 147" fill="none" stroke="#dbedb3" strokeWidth="6" opacity=".8"/>
            <g fill="#7ead76"><path d="M25 134l-5-15 10 11-1-19 10 22M212 133l-3-17 10 12 4-16 1 22"/><path d="M46 154l-5-13 11 10 3-13 2 17M197 159l-2-13 9 6 5-11 1 18"/></g>
            <g fill="#f9e3b7" stroke="#baa882" strokeWidth="1.2"><ellipse cx="23" cy="150" rx="4" ry="2.4"/><ellipse cx="220" cy="155" rx="5" ry="3"/><ellipse cx="65" cy="171" rx="4" ry="2"/></g>
            {/* Raised timber frame. */}
            <path d="M29 111L74 93H178L222 111L213 157Q123 176 39 155Z" fill="#aa7559" stroke="#7c5849" strokeWidth="3" strokeLinejoin="round"/>
            <path d="M28 111Q125 130 223 111L216 132Q124 151 35 132Z" fill="#dba77a" stroke="#a67858" strokeWidth="2.5"/>
            <path d="M35 132Q125 150 216 132L213 149Q126 169 39 151Z" fill="#c38c66"/>
            <path d="M48 139q32 9 58 7M138 150q30-1 56-7M61 157q23 4 46 4" stroke="#936744" strokeWidth="2.5" opacity=".55" strokeLinecap="round" fill="none"/>
            <path d="M34 110L74 92H177L221 110Q124 130 34 110Z" fill="#8d5a45" stroke="#815441" strokeWidth="3" strokeLinejoin="round"/>
            <path d="M49 109L78 98H174L205 109Q126 124 49 109Z" fill="#715041"/>
            <path d="M65 106Q102 98 120 107T181 106" stroke="#a6775e" strokeWidth="3" fill="none" opacity=".8"/>
            <g fill="#e2b59c"><circle cx="74" cy="112" r="2"/><circle cx="160" cy="115" r="2.5"/><circle cx="190" cy="108" r="2"/></g>
            {/* Garden-edge decorations. */}
            <g fill="#f8d6e4" stroke="#d48aa6" strokeWidth="1"><circle cx="44" cy="145" r="3"/><circle cx="51" cy="140" r="2.4"/><circle cx="209" cy="147" r="3"/></g>
            {stage === 'empty' && <g><path d="M94 109q26-12 54-3M106 115q22-8 45-2" stroke="#bd9279" strokeWidth="3" strokeLinecap="round" fill="none"/><path d="M120 96l5-9 5 9" stroke="#d4ae8a" strokeWidth="2" fill="none"/></g>}
            {stage === 'locked' && <g><path d="M81 104V62M110 108V55M140 108V55M169 104V62" stroke="#b89076" strokeWidth="9" strokeLinecap="round"/><path d="M72 80Q125 93 178 80" stroke="#9d795f" strokeWidth="8" fill="none" strokeLinecap="round"/><rect x="111" y="55" width="28" height="23" rx="5" fill="#e8cfc0" stroke="#aa8a79" strokeWidth="3"/><path d="M119 54V49a6 6 0 0 1 12 0v5" fill="none" stroke="#aa8a79" strokeWidth="3"/></g>}
            {stage === 'seed' && <g><ellipse cx="125" cy="101" rx="21" ry="8" fill="#8b604f"/><path d="M115 100q10-14 20 0" stroke="#a97d60" strokeWidth="4" fill="none"/><circle cx="123" cy="94" r="2.5" fill="#f8d49c"/></g>}
            {growing && stage !== 'seed' && <g className="paw-garden-live-plant">
                <path d={stage==='sprout'?'M124 100V77':'M124 101Q119 80 124 45'} stroke="#4d9163" strokeWidth={stage==='sprout'?'5':'6'} fill="none" strokeLinecap="round"/>
                <path d={stage==='sprout'?'M124 85Q105 68 104 83Q115 94 124 89M124 79Q141 66 145 80Q133 91 124 87':'M124 83Q102 61 94 75Q99 94 124 91M124 72Q146 50 157 65Q152 83 124 83M124 62Q110 47 105 57Q112 73 124 75'} fill="#83c68a" stroke="#4f9f75" strokeWidth="2.8" strokeLinejoin="round"/>
                {stage !== 'sprout' && <g><path d="M124 48Q99 43 106 27Q124 17 138 28Q151 42 124 48Z" fill={stage==='ready'?'#e7bedb':'#b6d8b2'} stroke={stage==='ready'?'#bd80aa':'#729c76'} strokeWidth="3"/><path d="M124 46Q111 35 120 25M124 47Q138 37 132 29" stroke={stage==='ready'?'#c58eb0':'#8eb995'} strokeWidth="2.5" fill="none" strokeLinecap="round"/></g>}
                {stage === 'ready' && <g className="paw-garden-bud-sparkles" fill="#ffeab1"><path d="M91 30l3-7 3 7 7 3-7 3-3 7-3-7-7-3Z"/><path d="M164 22l2-5 2 5 5 2-5 2-2 5-2-5-5-2Z"/><circle cx="158" cy="52" r="3"/><circle cx="86" cy="56" r="2"/></g>}
            </g>}
        </svg>
    );
}
