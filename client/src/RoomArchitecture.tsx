import {memo} from 'react';

/** Large permanent architectural illustrations shared by gameplay and /develop. */
function RoomArchitecture({room}: {room: string}) {
    const kind = ['bedroom', 'studio', 'sports'].includes(room) ? room : 'living';
    return (
        <svg className="paw-room-architecture" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            {kind === 'living' && <g>
                <rect x="24" y="36" width="225" height="255" rx="22" fill="#fff" fillOpacity=".12" stroke="white" strokeOpacity=".5" strokeWidth="9"/>
                <path d="M137 40V288M28 160H245" stroke="white" strokeOpacity=".35" strokeWidth="8"/>
                <path d="M0 317H1000" stroke="currentColor" strokeOpacity=".3" strokeWidth="9"/>
            </g>}
            {kind === 'bedroom' && <g>
                <path d="M0 28H1000M0 58H1000" stroke="#fffdf7" strokeOpacity=".65" strokeWidth="10"/>
                <path d="M65 50V312M935 50V312" stroke="#b9ad9d" strokeOpacity=".7" strokeWidth="12"/>
                <path d="M66 78H260M740 78H934" stroke="#f8f4ea" strokeWidth="11" strokeLinecap="round"/>
                <path d="M280 315V126Q280 20 500 20Q720 20 720 126V315Z" fill="#f5f0e8" fillOpacity=".64" stroke="#b5a99b" strokeOpacity=".8" strokeWidth="15"/>
                <path d="M308 315V130Q308 52 500 52Q692 52 692 130V315" fill="none" stroke="white" strokeWidth="11" strokeOpacity=".9"/>
                <path d="M300 88Q390 142 500 86Q610 142 700 88" fill="none" stroke="#c9bcae" strokeWidth="18" strokeLinecap="round"/>
                <path d="M318 88Q340 172 318 296M682 88Q660 172 682 296" fill="none" stroke="#e5d9cb" strokeWidth="36" strokeLinecap="round" opacity=".78"/>
                <path d="M105 110Q105 64 150 64Q195 64 195 110V225H105Z" fill="#f8f2e6" stroke="#b9ad9d" strokeWidth="8"/>
                <path d="M143 104A35 35 0 1 0 183 151A33 33 0 0 1 143 104" fill="#d5c5a7"/>
                <path d="M0 315H1000" stroke="#a99d90" strokeWidth="13"/>
                <path d="M0 330H1000" stroke="white" strokeOpacity=".7" strokeWidth="5"/>
                <ellipse cx="500" cy="495" rx="310" ry="70" fill="#f1eadf" fillOpacity=".35" stroke="#b7aa9a" strokeOpacity=".7" strokeWidth="7"/>
            </g>}
            {kind === 'studio' && <g>
                <rect x="392" y="28" width="216" height="236" rx="16" fill="#f6f0e6" fillOpacity=".52" stroke="#b8ad9e" strokeOpacity=".7" strokeWidth="8"/>
                {Array.from({length: 6}, (_, row) => Array.from({length: 5}, (_, col) => (
                    <circle key={`${row}-${col}`} cx={412 + col * 43} cy={48 + row * 39} r="3.5" fill="#aaa093" fillOpacity=".6"/>
                )))}
                <rect x="48" y="43" width="320" height="242" rx="12" fill="#f6f2e9" fillOpacity=".76" stroke="#b7aa9a" strokeWidth="13"/>
                <rect x="67" y="62" width="282" height="203" rx="4" fill="currentColor" fillOpacity=".12"/>
                <path d="M72 224L150 143L209 196L277 111L344 224Z" fill="currentColor" fillOpacity=".19"/>
                <circle cx="283" cy="102" r="31" fill="#d9c7a6"/>
                <rect x="630" y="56" width="298" height="225" rx="12" fill="#f6f2e9" fillOpacity=".82" stroke="#b7aa9a" strokeWidth="13"/>
                <circle cx="755" cy="150" r="66" fill="currentColor" fillOpacity=".18"/><circle cx="814" cy="160" r="50" fill="currentColor" fillOpacity=".13"/><path d="M675 228Q760 177 874 232" stroke="#b6c4b5" strokeWidth="24" fill="none"/>
                <path d="M0 315H1000" stroke="#aa9f93" strokeWidth="13"/>
                <path d="M0 395H1000M0 485H1000M0 575H1000M200 315L120 600M500 315V600M800 315L880 600" stroke="white" strokeOpacity=".42" strokeWidth="7"/>
                <path d="M430 265L500 70L570 265M450 210H550" stroke="#a79b8c" strokeWidth="13" fill="none" strokeLinecap="round"/>
                <rect x="455" y="85" width="90" height="96" rx="5" fill="#f5eee1" stroke="#b4a797" strokeWidth="7"/>
                <path d="M470 154L489 129L507 145L526 113" stroke="#b7c2b6" strokeWidth="10" fill="none"/>
            </g>}
            {kind === 'sports' && <g>
                <path d="M0 40H1000M0 285H1000" stroke="#f8f5ed" strokeOpacity=".8" strokeWidth="10"/>
                <path d="M260 64V282M740 64V282" stroke="#f8f5ed" strokeOpacity=".65" strokeWidth="9"/>
                <rect x="0" y="55" width="1000" height="240" fill="currentColor" fillOpacity=".08"/>
                <path d="M0 95H1000M0 170H1000M0 245H1000" stroke="white" strokeOpacity=".6" strokeWidth="12"/>
                <rect x="385" y="30" width="230" height="155" rx="18" fill="#f4f1e8" stroke="#9eaa9e" strokeWidth="13"/>
                <rect x="406" y="48" width="188" height="94" rx="9" fill="#858f87"/>
                <text x="500" y="114" fontSize="57" fontWeight="900" textAnchor="middle" fill="white" fontFamily="sans-serif">00 : 00</text>
                <path d="M448 167H552" stroke="#a3aaa0" strokeWidth="9"/>
                <rect x="40" y="105" width="180" height="160" rx="15" fill="#f3eee2" fillOpacity=".75" stroke="#a9afa3" strokeWidth="10"/>
                <path d="M85 125V244M130 125V244M175 125V244" stroke="#c0c7b9" strokeWidth="14"/>
                <rect x="780" y="105" width="180" height="160" rx="15" fill="#f3eee2" fillOpacity=".75" stroke="#a9afa3" strokeWidth="10"/>
                <path d="M825 125V244M870 125V244M915 125V244" stroke="#c0c7b9" strokeWidth="14"/>
                <path d="M0 315H1000" stroke="#a8a99e" strokeWidth="14"/>
                <path d="M80 366H920V565H80ZM500 366V565" fill="none" stroke="white" strokeOpacity=".76" strokeWidth="10"/>
                <ellipse cx="500" cy="466" rx="108" ry="88" fill="none" stroke="white" strokeOpacity=".75" strokeWidth="10"/>
                <path d="M80 410H210V520H80M920 410H790V520H920" fill="none" stroke="white" strokeOpacity=".72" strokeWidth="9"/>
            </g>}
        </svg>
    );
}

export default memo(RoomArchitecture);
