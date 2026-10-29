import type {ReactNode} from 'react';

// Shared by the player PawMail screens and the read-only Develop SVG gallery.
// Keep the envelope artwork and unlock metadata in one place.
export const ENVELOPE_DESIGNS=[
{id:'classic',title:'Classic Letter',symbol:'♡',price:0,level:1},
{id:'rose_garden',title:'Rose Garden',symbol:'rose',price:2000,level:1},
{id:'starry_night',title:'Starry Night',symbol:'✦',price:2000,level:1},
{id:'ocean_waves',title:'Ocean Waves',symbol:'art',price:2000,level:1},
{id:'cherry_blossom',title:'Cherry Blossom',symbol:'✿',price:2000,level:1},
{id:'woodland',title:'Woodland Friends',symbol:'leaves',price:2000,level:1},
{id:'royal',title:'Royal Filigree',symbol:'♛',price:2000,level:1},
{id:'sweet_treats',title:'Sweet Treats',symbol:'berry',price:2000,level:1},
{id:'celestial',title:'Celestial',symbol:'☾',price:2000,level:1},
{id:'butterfly',title:'Butterfly Meadow',symbol:'butterfly',price:2000,level:1},
{id:'winter',title:'Winter Wonderland',symbol:'snowflake',price:2000,level:1},

{id:'strawberry_picnic',title:'Strawberry Picnic',symbol:'berry',price:5000,level:10},
{id:'moonlit_library',title:'Moonlit Library',symbol:'book',price:7000,level:14},
{id:'coral_kingdom',title:'Coral Kingdom',symbol:'shell',price:9500,level:18},
{id:'enchanted_greenhouse',title:'Enchanted Greenhouse',symbol:'leaf',price:12000,level:22},
{id:'cloud_palace',title:'Cloud Palace',symbol:'cloud',price:14500,level:26},
{id:'lantern_festival',title:'Lantern Festival',symbol:'lantern',price:17000,level:30},
{id:'crystal_cavern',title:'Crystal Cavern',symbol:'crystal',price:20000,level:35},
{id:'aurora_fox',title:'Aurora Fox',symbol:'fox',price:23500,level:40},
{id:'sunfire_phoenix',title:'Sunfire Phoenix',symbol:'phoenix',price:27000,level:45},
{id:'dreamscape',title:'Dreamscape',symbol:'dream',price:30000,level:50}
];
export function EnvelopeArtwork({design}:{design:string}){const motifs:Record<string,ReactNode>={
classic:<><path d="M12 42Q80 96 148 42"/><path d="M12 42L80 12L148 42"/></>,
rose_garden:<><path d="M30 95Q24 63 40 33M126 95Q132 63 116 33"/><path d="M40 33c-24-17-27 12-10 15 1-24 30-28 29-9-2 17-30 18-29 1M116 33c24-17 27 12 10 15-1-24-30-28-29-9 2 17 30 18 29 1"/><path d="M29 72q-23-16-17-27 18 1 22 17M127 72q23-16 17-27-18 1-22 17"/></>,
starry_night:<><path d="M78 10L85 32L108 38L85 45L78 67L71 45L48 38L71 32Z"/><path d="M25 14v20m-10-10h20M132 61v20m-10-10h20M116 10l5 10-5 10-5-10Z"/><circle cx="38" cy="75" r="3"/><circle cx="108" cy="89" r="3"/></>,
ocean_waves:<>{[32,53,74,95].map(y=><path key={y} d={`M4 ${y}q18-17 36 0t36 0t36 0t44 0`}/>) }<path d="M118 22q11-17 22 0-11-5-22 0"/></>,
cherry_blossom:<><path d="M15 94Q56 48 141 13M91 45l28 12M58 66L34 43"/>{[[39,49],[75,35],[119,24],[105,64],[29,81]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}>{[0,72,144,216,288].map(a=><ellipse key={a} cy="-9" rx="6" ry="10" transform={`rotate(${a})`} fill="currentColor" fillOpacity=".18"/>)}<circle r="3"/></g>)}</>,
woodland:<><path d="M22 97V36m-15 18 15-36 15 36H7Zm115 43V30m-15 25 15-40 15 40h-30Z"/><path d="M53 90q0-26 21-26t21 26Z"/><circle cx="67" cy="78" r="2" fill="currentColor"/><circle cx="82" cy="78" r="2" fill="currentColor"/><path d="M60 70l-4-13 14 9m18 4 4-13-14 9"/></>,
royal:<><path d="M25 65L17 26 48 43 80 15 112 43 143 26 135 65Z"/><path d="M25 72h110v12H25Z"/><path d="M80 39l10 13-10 13-10-13Z"/><circle cx="17" cy="22" r="5"/><circle cx="80" cy="11" r="5"/><circle cx="143" cy="22" r="5"/></>,
sweet_treats:<><path d="M25 82q-12-23 0-35 13-8 24 4 14-12 26 1 12 17-26 43Z"/><path d="M91 85V45q24-25 48 0v40Z"/><path d="M91 62q12 13 24 0t24 0"/><circle cx="113" cy="31" r="7"/><path d="M113 24q-5-12 5-15"/></>,
celestial:<><path d="M82 13a35 35 0 1 0 0 70 30 30 0 1 1 0-70Z"/><path d="M116 18l6 14 14 6-14 6-6 14-6-14-14-6 14-6Z"/><path d="M28 8v20M18 18h20M131 74v20m-10-10h20"/></>,
butterfly:<><path d="M80 51Q29-7 22 37q-5 27 51 22Q32 96 62 101q22 0 18-50ZM80 51q51-58 58-14 5 27-51 22 41 37 11 42-22 0-18-50Z"/><path d="M80 49v45m0-43-12-19m12 19 12-19"/><circle cx="42" cy="37" r="7"/><circle cx="118" cy="37" r="7"/></>,
strawberry_picnic:<><path d="M13 79Q80 55 147 79v20H13Z" fill="#ffb8c7" fillOpacity=".55"/><path d="M25 79v20m18-29v29m18-29v29m18-29v29m18-29v29m18-29v29m18-29v29M13 88h134" stroke="#ce557c" strokeWidth="1.5"/><path d="M45 55q-28-34 0-30 26-4 0 30Z" fill="#f65e7a" stroke="#b94e6f"/><path d="M45 30l-15-9 14 2 9-12 1 16 16-2-12 12" fill="#5b9d73" stroke="#5b9d73"/><path d="M111 54q-28-34 0-30 26-4 0 30Z" fill="#ed6a85" stroke="#b94e6f"/><path d="M111 28l-12-9 12 3 9-12v17l14-3-11 11" fill="#5b9d73" stroke="#5b9d73"/><path d="M41 36l-6 6m14 0 5-6m-10 11-3 4M107 38l-5 5m12 0 5-6" stroke="#ffeec0" strokeWidth="3"/></>,
moonlit_library:<><path d="M10 96V22h140v74M20 29h120M20 74h120M42 29v45M68 29v45M92 29v45M118 29v45" stroke="#92729a"/><path d="M23 34h14v34H23Zm23 9h14v25H46Zm25-9h15v34H71Zm23 8h18v26H94Zm25-8h17v34h-17Z" fill="#b8a0df" fillOpacity=".48"/><path d="M80 15a23 23 0 1 0 20 34A19 19 0 0 1 80 15Z" fill="#f5dd91" stroke="#e2bb65"/><path d="M25 14v9m-4-4h8M133 10v12m-6-6h12M55 11l3 5 5 3-5 3-3 5-3-5-5-3 5-3Z" stroke="#d6af5f"/></>,
coral_kingdom:<><path d="M17 94V61l8 14 8-31 9 26 6-12v36m70 0V51l10 14 10-36 9 21 2 44" fill="#f8a38f" fillOpacity=".5" stroke="#d77c86"/><path d="M38 84Q80 57 122 84" stroke="#50a8b5" strokeWidth="4"/><path d="M56 89q20-30 46-6-21 22-46 6Z" fill="#a4e6e0" stroke="#4c9eaf"/><circle cx="95" cy="88" r="3" fill="#4a8c9c"/><path d="M16 18q18 15 37 0t37 0t55 0M13 33q14 10 28 0t28 0t28 0t50 0" stroke="#77bfd0" opacity=".6"/><path d="M78 55q-25-15 0-33 25 18 0 33Z" fill="#f8e7b6" stroke="#cd9c75"/><circle cx="78" cy="39" r="8" fill="#fff"/></>,
enchanted_greenhouse:<><path d="M17 99V47L80 12l63 35v52H17Z" fill="#c7e5c4" fillOpacity=".3" stroke="#5fa57b" strokeWidth="3"/><path d="M80 12v87M17 47h126M45 31v68m70-68v68" stroke="#69aa82" strokeWidth="2"/><path d="M40 95V70q-16-6-17-21 21 0 23 18 6-22 23-23-3 20-23 28M114 95V68q-22-4-22-22 19 2 24 19 2-19 22-22-1 19-24 29" fill="#71b894" stroke="#4d9772"/><path d="M77 65q-23-9-11-25 8-3 14 10 9-16 17-7 10 19-20 22Z" fill="#f2a5c3" stroke="#a96090"/><circle cx="81" cy="58" r="4" fill="#f9e3a4"/></>,
cloud_palace:<><path d="M20 96V53h23V37l18-20 17 20v59m4 0V37l17-20 18 20v16h23v43Z" fill="#fbf3fa" stroke="#b994d1" strokeWidth="2.5"/><path d="M28 64h14m-10 12h11m46-12h14m-10 12h11M66 60V42m33 0v19" stroke="#b994d1" strokeWidth="3"/><path d="M68 96V77q10-14 22 0v19" fill="#ddc6ee" stroke="#b994d1"/><path d="M15 26q-16 0-10-13 8-8 17-1 3-15 17-9 11 10 2 21Zm105-7q-12-15 7-18 12-1 15 10 15-4 17 8Z" fill="#fff" stroke="#d7c6ed"/><path d="M52 11l4 8 8 4-8 4-4 8-4-8-8-4 8-4" fill="#fff0a4" stroke="#d5bc68"/></>,
lantern_festival:<><path d="M7 17Q80 39 153 17" stroke="#ce8aaf" strokeWidth="2"/>{[30,80,130].map((x,i)=><g key={i}><path d={`M${x} ${23-i%2*8}v19`} stroke="#b778a0"/><path d={`M${x-12} ${41-i%2*8}q12-8 24 0v24q-12 13-24 0Z`} fill={i===1?'#f6ca78':'#ec8eae'} stroke="#b8758f"/><path d={`M${x} ${66-i%2*8}v12`} stroke="#b778a0"/><path d={`M${x-7} ${48-i%2*8}h14M${x-7} ${57-i%2*8}h14`} stroke="#fff4cf"/></g>)}<path d="M13 96Q80 64 147 96" stroke="#d9a4a5" strokeWidth="3"/><path d="M47 92l4-10 4 10 10 4-10 4-4 10-4-10-10-4Z" fill="#ffe9ac" stroke="#c19b76"/></>,
crystal_cavern:<><path d="M13 100 20 58 41 72 55 13 76 69 87 25 112 75 130 42 147 100Z" fill="#b6d0f6" fillOpacity=".55" stroke="#7a97cf" strokeWidth="2"/><path d="M55 13 48 80l7 20 21-31m11-44L77 86l10 14 25-25M20 58l13 36 8-22m89-30-7 43-11-10" fill="none" stroke="#fff" strokeWidth="2"/><path d="M13 100h134M76 7l4 9 9 4-9 4-4 9-4-9-9-4 9-4M126 15l3 8 8 3-8 3-3 8-3-8-8-3 8-3" fill="#fff7d0" stroke="#8bafe3"/></>,
aurora_fox:<><path d="M0 50Q30 0 60 48T120 48T160 35V0H0Z" fill="#a3e9d5" fillOpacity=".65"/><path d="M0 60Q30 17 60 60T120 58T160 50" stroke="#b9a0eb" strokeWidth="6" opacity=".65"/><path d="M38 80 57 38 78 64 98 38 121 80l-9 20H49Z" fill="#f6b8b0" stroke="#bb7792" strokeWidth="2.5"/><path d="M55 65q30-17 50 0l-11 19-14 15-14-15Z" fill="#fff3e8" stroke="#bb7792"/><path d="M68 73h1m23 0h1" stroke="#8d5a78" strokeWidth="5" strokeLinecap="round"/><path d="M76 83l4 3 4-3" fill="#a66479"/><path d="M16 10v15m-7-7h15M145 9v18m-9-9h18" stroke="#fff7e0" strokeWidth="2"/></>,
sunfire_phoenix:<><path d="M80 10q-33 37-18 49-23-20-32 4 6 30 34 38-12-30 13-40-5 26 15 40 43-18 36-47-23-11-27 4 15-32-21-48Z" fill="#f8a46f" stroke="#d67776" strokeWidth="2.5"/><path d="M80 33q-17 23-4 35-11-9-14 5 3 15 18 24 22-13 20-29-14-7-17 4 9-20-3-39Z" fill="#ffe2a6" stroke="#efa55d"/><path d="M76 47q-16-18-30-18 8 21 30 25m12-7q16-18 30-18-8 21-30 25" fill="#f9c17f" stroke="#d78c6c"/><circle cx="73" cy="55" r="2.5" fill="#985d75"/><circle cx="89" cy="55" r="2.5" fill="#985d75"/><path d="M77 64h7l-3 5Z" fill="#e39c73"/><path d="M18 13l5 8 8 5-8 5-5 8-5-8-8-5 8-5M137 11l4 8 8 4-8 4-4 8-4-8-8-4 8-4" fill="#fff1c5" stroke="#e7b080"/></>,
dreamscape:<><path d="M0 96Q40 65 80 86T160 77V110H0Z" fill="#b4cce6" fillOpacity=".5"/><path d="M16 62q20-34 41 0 14-44 38-5 25-40 51 4" fill="none" stroke="#dfb8ea" strokeWidth="8" opacity=".6"/><path d="M80 10a29 29 0 1 0 0 58 25 25 0 1 1 0-58" fill="#fff2b9" stroke="#e5c69a"/><path d="M120 25l5 12 12 5-12 5-5 12-5-12-12-5 12-5Z" fill="#fff" stroke="#b9a0d8"/><path d="M34 37l4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill="#fff" stroke="#c29edb"/><path d="M60 94q0-24 20-24 18 0 20 24" fill="#e6cbf5" stroke="#bda0d5"/><circle cx="72" cy="84" r="2" fill="#8c709a"/><circle cx="88" cy="84" r="2" fill="#8c709a"/><path d="M76 90q4 5 8 0" stroke="#8c709a"/></>,
winter:<><path d="M80 9v91M35 32l90 46M35 78l90-46"/>{[0,60,120,180,240,300].map(a=><path key={a} d="M80 17l-9 11m9-11 9 11" transform={`rotate(${a} 80 54)`}/>) }<circle cx="80" cy="54" r="9"/></>
};return <svg className="paw-envelope-art-svg" viewBox="0 0 160 110" role="img" aria-label={`${design.replaceAll('_',' ')} envelope artwork`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{motifs[design]||motifs.classic}</svg>}
