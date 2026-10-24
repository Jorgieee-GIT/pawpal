import {useState} from 'react';
export const FURNITURE:Record<string,{name:string,room:string,price:number,kind:string}>={
 living_sofa:{name:'Cloud Sofa',room:'living',price:0,kind:'sofa'},living_table:{name:'Coffee Table',room:'living',price:0,kind:'table'},living_rug:{name:'Rose Rug',room:'living',price:0,kind:'rug'},living_lamp:{name:'Floor Lamp',room:'living',price:0,kind:'lamp'},living_plant:{name:'Leafy Plant',room:'living',price:0,kind:'plant'},
 bedroom_bed:{name:'Dream Bed',room:'bedroom',price:0,kind:'bed'},bedroom_nightstand:{name:'Bedside Table',room:'bedroom',price:0,kind:'table'},bedroom_wardrobe:{name:'Wardrobe',room:'bedroom',price:0,kind:'wardrobe'},bedroom_nightlight:{name:'Moon Nightlight',room:'bedroom',price:0,kind:'lamp'},bedroom_plush:{name:'Sleepy Plush',room:'bedroom',price:0,kind:'plush'},
 studio_desk:{name:'Art Desk',room:'studio',price:0,kind:'table'},studio_easel:{name:'Easel',room:'studio',price:0,kind:'easel'},studio_bookshelf:{name:'Bookcase',room:'studio',price:0,kind:'shelf'},studio_paint:{name:'Paint Station',room:'studio',price:0,kind:'paint'},studio_stool:{name:'Artist Stool',room:'studio',price:0,kind:'stool'},
 sports_mat:{name:'Yoga Mat',room:'sports',price:0,kind:'mat'},sports_weights:{name:'Dumbbells',room:'sports',price:0,kind:'weights'},sports_rack:{name:'Training Rack',room:'sports',price:0,kind:'rack'},sports_bag:{name:'Punching Bag',room:'sports',price:0,kind:'bag'},sports_water:{name:'Water Station',room:'sports',price:0,kind:'water'},
 cloud_sofa:{name:'Cloud Sofa Deluxe',room:'living',price:2400,kind:'sofa'},plant:{name:'Potted Fern',room:'living',price:580,kind:'plant'},lamp:{name:'Blush Lamp',room:'living',price:950,kind:'lamp'},bookshelf:{name:'Story Shelf',room:'living',price:1800,kind:'shelf'},rug:{name:'Fluffy Rug',room:'living',price:950,kind:'rug'},cat_tree:{name:'Climbing Tree',room:'living',price:2200,kind:'tree'},plush:{name:'Cuddle Plush',room:'living',price:750,kind:'plush'},velvet_armchair:{name:'Velvet Armchair',room:'living',price:1700,kind:'chair'},tea_cart:{name:'Tea Cart',room:'living',price:1300,kind:'table'},flower_vase:{name:'Flower Vase',room:'living',price:720,kind:'plant'},record_player:{name:'Record Player',room:'living',price:2300,kind:'music'},fireplace:{name:'Cozy Fireplace',room:'living',price:3200,kind:'fire'},
 canopy_bed:{name:'Canopy Bed',room:'bedroom',price:2800,kind:'bed'},moon_lamp:{name:'Moon Lamp',room:'bedroom',price:850,kind:'lamp'},vanity:{name:'Vanity Mirror',room:'bedroom',price:2100,kind:'vanity'},star_pillow:{name:'Star Pillow',room:'bedroom',price:600,kind:'plush'},cloud_dresser:{name:'Cloud Dresser',room:'bedroom',price:1700,kind:'wardrobe'},cozy_bench:{name:'Cozy Bench',room:'bedroom',price:1100,kind:'chair'},
 drawing_table:{name:'Drawing Table',room:'studio',price:2200,kind:'table'},canvas_stack:{name:'Canvas Stack',room:'studio',price:780,kind:'easel'},paint_cart:{name:'Paint Cart',room:'studio',price:1200,kind:'paint'},sculpture:{name:'Clay Sculpture',room:'studio',price:1950,kind:'sculpture'},studio_lamp:{name:'Studio Lamp',room:'studio',price:950,kind:'lamp'},craft_cabinet:{name:'Craft Cabinet',room:'studio',price:1800,kind:'shelf'},
 treadmill:{name:'Treadmill',room:'sports',price:2900,kind:'treadmill'},boxing_bag:{name:'Boxing Bag',room:'sports',price:1800,kind:'bag'},fitness_ball:{name:'Fitness Ball',room:'sports',price:850,kind:'ball'},medal_case:{name:'Medal Display',room:'sports',price:1300,kind:'rack'},skipping_rope:{name:'Skipping Rope',room:'sports',price:520,kind:'rope'},mini_bike:{name:'Mini Bike',room:'sports',price:2400,kind:'bike'}
};
export const DEFAULTS:Record<string,string[]>={living:['living_sofa','living_table','living_rug','living_lamp','living_plant'],bedroom:['bedroom_bed','bedroom_nightstand','bedroom_wardrobe','bedroom_nightlight','bedroom_plush'],studio:['studio_desk','studio_easel','studio_bookshelf','studio_paint','studio_stool'],sports:['sports_mat','sports_weights','sports_rack','sports_bag','sports_water']};
export type FurniturePlacement={id:string,x:number,y:number};
const POSITIONS=[[70,61],[28,60],[48,78],[88,38],[13,45]];
export function furnitureLayout(room:string,layouts?:Record<string,FurniturePlacement[]>):FurniturePlacement[]{return Array.isArray(layouts?.[room])?layouts![room]:DEFAULTS[room].map((id,i)=>({id,x:POSITIONS[i][0],y:POSITIONS[i][1]}));}

// Each purchasable furnishing has its own illustrated silhouette, not a reused category icon.
const CUSTOM_FURNITURE=new Set(Object.keys(FURNITURE).filter(id=>FURNITURE[id].price>0));
function CustomFurniture({id}:{id:string}){
 const wood='#b88d83',pink='#edb3c9',light='#fff0e8',mint='#9dcebb',lav='#b3a2d5',dark='#786e8e',gold='#f2cb79';
 const rect=(x:number,y:number,w:number,h:number,fill:string,rx=5)=><rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} stroke={dark} strokeWidth="2.5"/>;
 const line=(d:string,color=dark,width=4)=><path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round"/>;
 const circle=(x:number,y:number,r:number,fill:string)=><circle cx={x} cy={y} r={r} fill={fill} stroke={dark} strokeWidth="2"/>;
 switch(id){
 case 'cloud_sofa':return <>{rect(8,45,104,47,lav,19)}{[24,45,67,89].map(x=><circle key={x} cx={x} cy="44" r="21" fill={light}/>)}{rect(16,71,88,21,pink,12)}{line('M27 92v10M93 92v10',wood,6)}</>;
 case 'plant':return <>{line('M59 77V22',mint,5)}{[[-24,-15],[-12,-36],[16,-29],[27,-8]].map(([x,y],i)=><ellipse key={i} cx={60+x} cy={67+y} rx="14" ry="22" transform={`rotate(${x*2} ${60+x} ${67+y})`} fill={mint} stroke="#6a9b7b" strokeWidth="2"/>)}{rect(37,75,46,28,pink,5)}</>;
 case 'lamp':return <>{line('M60 51v46M35 98h50',wood,6)}<path d="M25 49L42 11h36l17 38Z" fill={pink} stroke={dark} strokeWidth="3"/>{circle(60,20,7,gold)}{line('M43 56h34',gold,4)}</>;
 case 'bookshelf':return <>{rect(18,10,84,94,wood)}{[38,69].map(y=>line(`M23 ${y}h74`,'#fff0e5',5))}{[27,40,53,68,81].map((x,i)=>rect(x,15,10,19,[mint,lav,pink,gold,light][i],2))}{[30,49,67,84].map((x,i)=>rect(x,44,11,20,[gold,pink,mint,lav][i],2))}{rect(32,76,54,21,light,2)}</>;
 case 'rug':return <><ellipse cx="60" cy="56" rx="54" ry="36" fill={light} stroke={pink} strokeWidth="8" strokeDasharray="5 4"/><ellipse cx="60" cy="56" rx="34" ry="20" fill={pink}/>{circle(60,56,9,light)}</>;
 case 'cat_tree':return <>{line('M22 101h76',wood,9)}{line('M43 97V26M84 97V53',wood,11)}{rect(16,19,58,13,mint,7)}{rect(64,45,44,12,pink,7)}{circle(46,12,11,light)}{line('M83 57v16',gold,3)}{circle(83,77,6,gold)}</>;
 case 'plush':return <>{circle(36,30,18,lav)}{circle(84,30,18,lav)}{circle(60,60,37,pink)}{circle(46,58,4,dark)}{circle(74,58,4,dark)}{circle(60,70,5,light)}{line('M53 80q7 6 14 0')}</>;
 case 'velvet_armchair':return <>{rect(23,16,74,80,lav,28)}{rect(12,57,25,35,pink,10)}{rect(83,57,25,35,pink,10)}{rect(30,66,60,25,light,11)}{line('M32 92v9M89 92v9',wood,6)}</>;
 case 'tea_cart':return <>{rect(16,42,87,11,gold,3)}{rect(20,73,79,10,wood,3)}{line('M27 50v39M94 50v39',wood,5)}{circle(29,96,9,dark)}{circle(90,96,9,dark)}{circle(46,33,13,light)}{line('M60 31q17-9 18 3q-1 12-17 6',pink,4)}{line('M47 16q-7-8 0-13',lav,3)}</>;
 case 'flower_vase':return <>{rect(37,56,46,44,lav,13)}{line('M60 58V18M60 43L35 27M60 36l25-17',mint,4)}{[ [60,15],[34,25],[87,18] ].map(([x,y],i)=><g key={i}>{[0,1,2,3,4].map(j=><circle key={j} cx={x+Math.cos(j*6.28/5)*10} cy={y+Math.sin(j*6.28/5)*10} r="7" fill={pink}/>)}{circle(x,y,6,gold)}</g>)}</>;
 case 'record_player':return <>{rect(13,40,94,57,wood)}{circle(49,66,23,dark)}{circle(49,66,9,pink)}{line('M91 49l-20 22 7 6',gold,5)}{rect(24,91,72,7,light,3)}</>;
 case 'fireplace':return <>{rect(13,9,94,95,wood)}{rect(23,34,74,63,dark,20)}<path d="M60 90Q32 71 51 48Q55 62 62 47Q90 73 60 90" fill={gold}/><path d="M60 91Q47 78 60 63Q75 79 60 91" fill={pink}/>{rect(6,8,108,14,light,2)}</>;
 case 'canopy_bed':return <>{[14,104].map(x=>line(`M${x} 14v88`,wood,7))}{line('M14 14h90',wood,6)}<path d="M16 18q16 28 29 0M76 18q12 28 27 0" fill={pink} stroke={lav} strokeWidth="3"/>{rect(18,54,84,40,lav,7)}{rect(24,61,72,28,light,9)}{rect(29,60,26,13,pink,6)}</>;
 case 'moon_lamp':return <>{line('M60 70v27M37 98h46',wood,5)}<path d="M78 12A32 32 0 1 0 85 66A27 27 0 0 1 78 12Z" fill={gold} stroke={dark} strokeWidth="3"/>{circle(48,40,3,light)}</>;
 case 'vanity':return <>{rect(22,68,76,29,pink)}{rect(37,9,47,55,wood,23)}{rect(43,15,35,43,'#c9e6ef',19)}{circle(61,83,4,gold)}{line('M34 97v7M88 97v7',wood,5)}</>;
 case 'star_pillow':return <><path d="M60 9L73 40L106 44L82 65L88 99L60 82L32 99L38 65L14 44L47 40Z" fill={gold} stroke={pink} strokeWidth="5"/>{circle(49,57,3,dark)}{circle(72,57,3,dark)}{line('M54 69q6 5 12 0')}</>;
 case 'cloud_dresser':return <>{rect(17,35,86,64,light,11)}{[45,66,87].map(y=>line(`M22 ${y}h76`,pink,3))}{[55,76].map(y=>circle(60,y,3,gold))}{[27,44,60,78,94].map((x,i)=><circle key={i} cx={x} cy="33" r="16" fill={pink}/>)}</>;
 case 'cozy_bench':return <>{rect(15,47,90,29,mint,12)}{rect(17,24,86,29,light,14)}{line('M30 76v25M90 76v25',wood,7)}{rect(39,43,42,15,pink,6)}</>;
 case 'drawing_table':return <>{rect(9,28,102,15,wood,4)}{line('M25 43l-8 56M95 43l8 56',wood,7)}<path d="M31 24L78 9L93 31L44 42Z" fill={light} stroke={dark} strokeWidth="2"/>{line('M49 26l22-8',pink,4)}</>;
 case 'canvas_stack':return <>{[ [15,26],[29,17],[44,9] ].map(([x,y],i)=><g key={i}>{rect(x,y,60,74,light,2)}{line(`M${x+10} ${y+56}l16-19 14 11 9-24`,[mint,pink,lav][i],4)}</g>)}</>;
 case 'paint_cart':return <>{rect(16,44,88,13,mint)}{rect(22,73,76,10,wood)}{line('M30 56v36M91 56v36',wood,5)}{circle(30,98,8,dark)}{circle(90,98,8,dark)}{[36,57,78].map((x,i)=><g key={i}>{rect(x-8,23,16,23,[pink,lav,gold][i])}{line(`M${x} 20v-9`,dark,3)}</g>)}</>;
 case 'sculpture':return <>{rect(28,84,64,16,wood)}{rect(41,66,38,18,light)}<path d="M60 12Q23 21 42 48Q53 57 44 70Q74 81 80 54Q99 28 60 12" fill={lav} stroke={dark} strokeWidth="3"/>{circle(64,39,6,light)}</>;
 case 'studio_lamp':return <>{line('M25 100h61M59 99V66L83 39',wood,6)}{circle(59,65,7,gold)}<path d="M73 17h29l-3 29H78Z" fill={mint} stroke={dark} strokeWidth="3"/>{line('M84 48l-10 18',gold,4)}</>;
 case 'craft_cabinet':return <>{rect(17,11,86,90,mint)}{line('M60 15v82M21 57h78',wood,4)}{[ [40,38],[80,38],[40,79],[80,79] ].map(([x,y],i)=>circle(x,y,4,[gold,pink,lav,light][i]))}</>;
 case 'treadmill':return <>{line('M23 78L90 78L105 95H13Z',dark,8)}{line('M91 76V23H70',lav,7)}{rect(61,17,31,17,light)}{line('M25 79h55',pink,5)}</>;
 case 'boxing_bag':return <>{line('M60 5v23',wood,5)}{line('M43 28l17-17 17 17',dark,3)}{rect(38,28,44,68,pink,20)}{line('M42 54h36',light,5)}{circle(60,72,8,gold)}</>;
 case 'fitness_ball':return <>{circle(60,59,43,mint)}{[35,50,65,80].map(x=>line(`M${x} 25q-19 34 0 69`,light,3))}{circle(60,59,7,lav)}</>;
 case 'medal_case':return <>{rect(15,13,90,86,wood)}{[36,60,84].map((x,i)=><g key={i}>{line(`M${x-8} 25l8 17 8-17`,[pink,mint,lav][i],6)}{circle(x,50,10,gold)}</g>)}{line('M24 77h72',light,4)}</>;
 case 'skipping_rope':return <>{line('M26 31C12 106 110 107 94 31',pink,8)}{rect(17,10,17,30,mint,6)}{rect(86,10,17,30,mint,6)}</>;
 case 'mini_bike':return <>{circle(30,78,22,lav)}{circle(91,78,22,lav)}{line('M30 78l25-42 36 42H30l27-30M54 36h15M91 78l-11-46h14',pink,5)}{line('M48 33h18',wood,5)}</>;
 default:return <>{circle(60,55,30,pink)}</>;
 }
}

export function FurnitureArt({kind,itemId}:{kind:string;itemId?:string}){
 if(itemId&&CUSTOM_FURNITURE.has(itemId))return <svg viewBox="0 0 120 110" width="100%" height="100%" role="img" aria-label={FURNITURE[itemId]?.name||'Furniture'}><CustomFurniture id={itemId}/></svg>;
 return <svg viewBox="0 0 120 110" width="100%" height="100%" aria-hidden="true" style={{overflow:'visible'}}>
 <ellipse cx="60" cy="101" rx="48" ry="6" fill="#856879" opacity=".15"/>
 {kind==='sofa'?<><rect x="10" y="37" width="100" height="60" rx="19" fill="#bb849f"/><rect x="17" y="14" width="86" height="61" rx="19" fill="#f1b5ce" stroke="#a76c8c" strokeWidth="3"/><rect x="20" y="65" width="80" height="27" rx="12" fill="#ffe2e9"/></>:null}
 {kind==='bed'?<><rect x="8" y="25" width="104" height="70" rx="12" fill="#b78eaf"/><rect x="13" y="32" width="94" height="55" rx="9" fill="#f2bfd5"/><rect x="18" y="37" width="35" height="24" rx="9" fill="#fff6fa"/><rect x="57" y="37" width="35" height="24" rx="9" fill="#fff6fa"/><path d="M14 74h92" stroke="#b47a9a" strokeWidth="3"/></>:null}
 {['table','stool','chair'].includes(kind)?<><rect x="15" y="41" width="90" height="22" rx="11" fill="#dfac91" stroke="#a57d72" strokeWidth="3"/><path d="M31 62v35M89 62v35" stroke="#a57d72" strokeWidth="8" strokeLinecap="round"/>{kind==='chair'&&<rect x="18" y="11" width="84" height="38" rx="16" fill="#efbbcf"/>}</>:null}
 {['lamp','water'].includes(kind)?<><path d="M60 42v52M35 96h50" stroke="#9d7d96" strokeWidth="7" strokeLinecap="round"/><path d="M32 43L44 8h32l12 35z" fill="#ffe5ad" stroke="#ad8b9b" strokeWidth="3"/></>:null}
 {['plant','tree'].includes(kind)?<><path d="M36 73Q10 37 32 17Q56 26 57 69Q55 8 81 9Q102 40 64 74Q91 38 105 56Q95 78 64 83" fill="#9bcbb1" stroke="#5b987e" strokeWidth="3"/><path d="M30 76h60l-10 27H40z" fill="#d8a2a7" stroke="#9d737f" strokeWidth="3"/></>:null}
 {['shelf','wardrobe','rack','vanity'].includes(kind)?<><rect x="19" y="10" width="82" height="92" rx="7" fill="#e2b5a3" stroke="#a77e7a" strokeWidth="4"/><path d="M22 48h76M60 11v90" stroke="#a77e7a" strokeWidth="4"/>{kind==='vanity'?<ellipse cx="60" cy="35" rx="22" ry="20" fill="#bce3eb"/>:<><rect x="30" y="19" width="12" height="25" fill="#b6d3bd"/><rect x="70" y="59" width="17" height="30" fill="#c5b4dd"/></>}</>:null}
 {['rug','mat'].includes(kind)?<><ellipse cx="60" cy="61" rx="55" ry="34" fill={kind==='mat'?'#9fcbbb':'#f4c3d6'} stroke="#b37b9c" strokeWidth="4"/><ellipse cx="60" cy="61" rx="37" ry="21" fill="none" stroke="#fff5fa" strokeWidth="3"/></>:null}
 {['plush','ball'].includes(kind)?<><circle cx="60" cy="63" r="37" fill="#f1bcd3" stroke="#bd8aa3" strokeWidth="3"/>{kind==='plush'&&<><circle cx="33" cy="28" r="14" fill="#f1bcd3"/><circle cx="87" cy="28" r="14" fill="#f1bcd3"/><circle cx="48" cy="61" r="3" fill="#80586f"/><circle cx="72" cy="61" r="3" fill="#80586f"/><path d="M54 72q6 7 12 0" fill="none" stroke="#80586f" strokeWidth="3"/></>}</>:null}
 {['easel','paint','sculpture','music','fire'].includes(kind)?<><path d="M60 15L20 100M60 15l40 85" stroke="#b28b80" strokeWidth="7"/><rect x="25" y="21" width="70" height="62" rx="5" fill="#fff5e9" stroke="#bd8d9c" strokeWidth="4"/><circle cx="53" cy="48" r="14" fill="#a8cfbe"/><path d="M40 66q20-30 40 0" stroke="#e4a6b9" strokeWidth="8" fill="none"/></>:null}
 {['weights','bag','treadmill','rope','bike'].includes(kind)?<><rect x="17" y="52" width="86" height="13" rx="6" fill="#c1b2d6"/><path d="M18 37v42M102 37v42" stroke="#7d709d" strokeWidth="14" strokeLinecap="round"/><path d="M60 15v30" stroke="#a99ac3" strokeWidth="5"/></>:null}
 </svg>;
}
export function RoomFurniture({room,layout,editing,onMove,onSelect,selected}:{room:string,layout:FurniturePlacement[],editing:boolean,onMove:(id:string,x:number,y:number)=>void,onSelect:(id:string)=>void,selected:string|null}){
 const [drag,setDrag]=useState<{id:string,x:number,y:number}|null>(null);
 return <div className={'room-furniture-layer '+(editing?'editing':'')}>
 {layout.filter(f=>FURNITURE[f.id]?.room===room).map(f=>{
 const current=drag?.id===f.id?drag:f;
 return <div key={f.id} className={'room-furniture-piece '+(selected===f.id?'selected':'')} style={{left:current.x+'%',top:current.y+'%'}} title={FURNITURE[f.id].name} onPointerDown={e=>{if(!editing)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);onSelect(f.id);setDrag({id:f.id,x:f.x,y:f.y})}} onPointerMove={e=>{if(!editing||drag?.id!==f.id)return;const bounds=e.currentTarget.parentElement!.getBoundingClientRect();setDrag({id:f.id,x:Math.min(95,Math.max(5,(e.clientX-bounds.left)/bounds.width*100)),y:Math.min(85,Math.max(20,(e.clientY-bounds.top)/bounds.height*100))})}} onPointerUp={()=>{if(drag?.id===f.id){onMove(f.id,Math.round(drag.x),Math.round(drag.y));setDrag(null)}}}><FurnitureArt kind={FURNITURE[f.id].kind} itemId={f.id}/>{editing&&<small>{FURNITURE[f.id].name}</small>}</div>})}
 </div>;
}
