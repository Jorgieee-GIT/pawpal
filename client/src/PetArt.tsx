import {normalizeOutfit,type Outfit} from './outfitCatalog';
import type {ReactNode} from 'react';

type Props={species:string;color?:string;breed?:string;cosmetic?:string;outfit?:Outfit};
const ink='#765e69';
const palette:Record<string,[string,string,string]>={
 cat:['#edab69','#fff0d5','#a77553'],dog:['#dfae77','#fff0dc','#a57857'],bunny:['#f7e4dd','#fff8f1','#d2a9b1'],fox:['#e99758','#fff5e7','#a96a52'],hamster:['#e8b77d','#fff2de','#bb8d69'],panda:['#fff9f0','#504c56','#b9b5b9'],penguin:['#505866','#fff8ef','#f0aa5b'],axolotl:['#f2afc6','#ffe4ef','#d78aa8']};
const fur=(sp:string,b:string):[string,string,string]=>{
 const wildColors:Record<string,[string,string,string]>={eurasian_lynx:["#bd986e", "#f6dfbc", "#604c43"],snow_leopard:["#dce1e5", "#fcfaf3", "#6e7580"],smilodon:["#bf9a76", "#f4dbb5", "#654c43"],gray_wolf:["#9ba4aa", "#e7e9e6", "#616875"],african_wild_dog:["#bd9d71", "#3d3940", "#f3dfb7"],dire_wolf:["#77737a", "#c8c1ba", "#49454f"],pygmy_rabbit:["#9f8b76", "#e5d3c1", "#65564b"],volcano_rabbit:["#a68d77", "#ead8bd", "#6d5b51"],nuralagus:["#b0a08a", "#f1dfc5", "#776c5e"],kit_fox:["#dfba8d", "#fff1d8", "#b58b65"],swift_fox:["#b2a08e", "#f4e3d3", "#867668"],island_fox:["#9b8170", "#f4e1c4", "#63584f"],campbells_dwarf:["#c1a17c", "#f5e5ce", "#86694f"],european_hamster:["#b68c60", "#f8e7ce", "#594a41"],brandts_hamster:["#b1a18a", "#f3e4d0", "#776c5d"],grizzly_bear:["#54433b", "#cda88d", "#39333a"],polar_bear:["#f7f8f4", "#e8f2f5", "#b1bfc9"],short_faced_bear:["#856956", "#d4b49a", "#51443f"],african_penguin:["#44464c", "#fff8ef", "#f1a7ad"],king_penguin:["#4d505d", "#fff6e5", "#f0bd69"],waitaha_penguin:["#555c68", "#e5e8e7", "#a6b8bf"],tiger_salamander:["#66634e", "#d2bb77", "#353b36"],andersons_salamander:["#a67d78", "#edb5a3", "#785958"],ambystoma_dumerilii:["#786d6d", "#c2a3a0", "#4f4b54"]};
 if(wildColors[b])return wildColors[b];
 const defaults=palette[sp]||palette.cat;
 const overrides:Record<string,[string,string,string]>={
 calico:['#fff2df','#e9a66d','#655765'],tabby:['#d7a073','#fff0d9','#956d55'],tuxedo:['#55505b','#fff9f2','#413c48'],fluffy:['#f3d7b4','#fff4e7','#ba927a'],
 golden:['#e6b56d','#fff1d5','#b87f4e'],dalmatian:['#f7f5f0','#474653','#8b8990'],husky:['#b6bdc8','#fff8ef','#686f80'],corgi:['#e5a36a','#fff4e5','#b87a51'],
 lop:['#d4aa8d','#f8e5d8','#ab8578'],dutch:['#fff9f2','#8e8589','#bdadb1'],angora:['#fff7ee','#f2d5dc','#d9b8c3'],spotted:['#f5e6d4','#bd9988','#a37b72'],
 red_fox:['#e99758','#fff5e7','#a96a52'],arctic_fox:['#f7f8ff','#e4eafa','#b8bfce'],fennec:['#eed4a5','#fff7e8','#b99c79'],silver_fox:['#8a8d9c','#f5f2f1','#575866'],
 syrian:['#e8b77d','#fff2de','#bb8d69'],dwarf:['#c9b9ac','#f5e7dd','#93867d'],roborovski:['#e4c69b','#fff5e2','#ba9a75'],banded:['#b28a70','#fff7ed','#8a685b'],
 giant_panda:['#fff9f0','#504c56','#b9b5b9'],red_panda:['#c8794f','#fff0d9','#824c43'],snow_panda:['#f8faff','#a7b6ca','#8796ad'],baby_panda:['#fff4ee','#5e5364','#c6a8b8'],
 emperor:['#454b59','#fff6eb','#f4ad59'],adelie:['#5b6071','#fffaf4','#efa85b'],gentoo:['#666a7a','#fff8ee','#f3a85d'],chinstrap:['#404653','#fff9f0','#efae65'],
 leucistic:['#f3b4ce','#ffe9f0','#d68faa'],wild_type:['#858d71','#c7c6a0','#636d59'],melanoid:['#565260','#918593','#45424e'],golden_albino:['#f3d37c','#fff3b7','#c5a255']};
 const additional:Record<string,[string,string,string]>={siamese:["#f6e5c9", "#765d61", "#9e7875"],british_shorthair:["#aab6c8", "#e6e9ef", "#737f91"],maine_coon:["#bb8c6c", "#f7e5cd", "#765944"],beagle:["#c58e57", "#fff9ed", "#54463d"],shiba:["#d89559", "#fff0d6", "#9b6544"],border_collie:["#4e4b55", "#fff9f1", "#68606b"],lionhead:["#efcfaa", "#fff4e5", "#c49c79"],rex:["#b6a2aa", "#f5e8e9", "#89727d"],himalayan:["#f5ede0", "#82737d", "#aa98a0"],cross_fox:["#b8784d", "#3e3a45", "#e5b27b"],marble_fox:["#f7f1e9", "#d3a2b2", "#aa8995"],bat_eared_fox:["#cfad86", "#fff4df", "#8d765f"],winter_white:["#f7f6f3", "#c6c5cf", "#a7a2b2"],chinese_hamster:["#bca48d", "#f7eadb", "#8e7769"],teddy_bear:["#d7a56d", "#fff0d6", "#a77852"],qinling_panda:["#e9d2ad", "#8d6855", "#b69a7f"],brown_panda:["#d0a87e", "#6e5149", "#9a7865"],red_panda_cub:["#df976c", "#fff0d9", "#91584a"],rockhopper:["#444957", "#fff6ec", "#f4b24c"],little_blue:["#729bb8", "#f8f8f3", "#e7a768"],macaroni:["#555362", "#fff5ea", "#f4c256"],copper:["#d5a47d", "#f5dcc8", "#ad7a66"],piebald:["#f5d6d6", "#8e7688", "#d59baa"],mosaic:["#a1a28b", "#f2c8cf", "#6f7b75"]};
 return additional[b]||overrides[b]||defaults;
};
export default function PetArt({species:sp,breed='classic',cosmetic='none',outfit}:Props){
 const [main,secondary,accent]=fur(sp,breed);const line={stroke:ink,strokeWidth:2.7,strokeLinejoin:'round' as const};
 const ear=(x:number,y:number,rx:number,ry:number,fill=main)=> <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={fill} {...line}/>;
 const isRed=sp==='panda'&&(breed==='red_panda'||breed==='red_panda_cub');
 let ears:ReactNode=null;
 if(sp==='cat'||isRed)ears=<><path d="M31 59 24 13 64 44Z M119 59 126 13 86 44Z" fill={main} {...line}/><path d="M34 43 31 27 49 43Z M116 43 119 27 101 43Z" fill="#f3bac2"/></>;
 if(sp==='fox')ears=<><path d="M25 66 13 5 62 42Z M125 66 137 5 88 42Z" fill={main} {...line}/><path d="M31 47 24 20 47 42Z M119 47 126 20 103 42Z" fill={breed==='arctic_fox'?'#d9dfea':'#edb2a5'}/><path d="M24 56 14 42 39 48M126 56l10-14-25 6" fill={accent} {...line}/></>;
 if(sp==='dog')ears=breed==='husky'?<><path d="M29 56 26 14 59 43Z M121 56 124 14 91 43Z" fill={main} {...line}/></>:<>{ear(27,67,16,breed==='corgi'?21:30,accent)}{ear(123,67,16,breed==='corgi'?21:30,accent)}</>;
 if(sp==='bunny')ears=<>{ear(50,39,13,breed==='lop'?31:35)}{ear(100,39,13,breed==='lop'?31:35)}<ellipse cx="50" cy="39" rx="6" ry="23" fill="#e9abb9"/><ellipse cx="100" cy="39" rx="6" ry="23" fill="#e9abb9"/></>;
 if(sp==='hamster')ears=<>{ear(38,42,19,19)}{ear(112,42,19,19)}<circle cx="38" cy="42" r="10" fill="#f1bac3"/><circle cx="112" cy="42" r="10" fill="#f1bac3"/></>;
 if(sp==='panda'&&!isRed)ears=<>{ear(37,35,18,18,secondary)}{ear(113,35,18,18,secondary)}</>;
 if(sp==='axolotl')ears=<g stroke={accent} strokeWidth="11" strokeLinecap="round"><path d="M30 57 8 37M27 70 5 69M120 57l22-20m-19 33 22-1"/></g>;
 const markings:ReactNode=sp==='cat'&&breed==='calico'?<><path d="M31 55q6-21 27-19l4 20-16 9Z" fill="#e8a166"/><path d="M91 37q25 0 29 22l-20 8-13-15Z" fill="#5d5967"/></>:sp==='cat'&&breed==='tabby'?<path d="M58 37l-4 14m21-17v16m17-13 4 14" stroke={accent} strokeWidth="6" strokeLinecap="round"/>:sp==='cat'&&breed==='tuxedo'?<path d="M54 39q21 16 42 0l-7 54-14 20-14-20Z" fill={secondary}/>:sp==='dog'&&breed==='dalmatian'?<><ellipse cx="42" cy="53" rx="12" ry="9" fill={secondary}/><ellipse cx="107" cy="89" rx="10" ry="12" fill={secondary}/></>:sp==='dog'&&breed==='husky'?<path d="M31 65q16-23 33-13l11 15 11-15q17-10 33 13l-20 12-24-10-24 10Z" fill={secondary}/>:sp==='bunny'&&breed==='dutch'?<path d="M29 67q9-28 34-25l12 27-12 15-33-2Z M121 67q-9-28-34-25L75 69l12 15 33-2Z" fill={secondary}/>:sp==='bunny'&&breed==='spotted'?<><ellipse cx="42" cy="55" rx="12" ry="9" fill={secondary}/><ellipse cx="106" cy="92" rx="10" ry="9" fill={secondary}/></>:sp==='hamster'&&breed==='banded'?<path d="M35 92q40 18 80 0l-6 25H41Z" fill={secondary}/>:null;
 const wildMarkings:ReactNode=breed==='smilodon'?<><path d="M53 99l5 29 9-27M85 99l7 29 6-30" fill="#fff9e7" stroke="#6b605b" strokeWidth="2"/></>:breed==='eurasian_lynx'?<><path d="M25 39l-4-24 15 15M125 39l4-24-15 15" fill="#51453d"/>{[39,105].map(x=><circle key={x} cx={x} cy="77" r="5" fill="#594c42"/>)}</>:breed==='snow_leopard'?<>{[[41,65],[104,65],[55,94],[94,98]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="7" fill="none" stroke="#717984" strokeWidth="4"/>)}</>:breed==='dire_wolf'?<><path d="M34 48l-8-28 28 20M116 48l8-28-28 20" fill="#4b4950"/><path d="M45 78q30-17 60 0" fill="none" stroke="#4b4950" strokeWidth="9"/></>:breed==='gray_wolf'?<path d="M30 52L23 18l35 25M120 52l7-34-35 25" fill="#858f96" stroke="#545a63" strokeWidth="3"/>:breed==='african_wild_dog'?<><path d="M29 55L9 22l47 19M121 55l20-33-47 19" fill="#493c35"/>{[[45,75],[106,85],[79,44]].map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx="12" ry="9" fill={i%2?'#d4ae79':'#51443f'}/>)}</>:breed==='nuralagus'?<><ellipse cx="45" cy="32" rx="15" ry="23" fill="#99836f"/><ellipse cx="105" cy="32" rx="15" ry="23" fill="#99836f"/></>:breed==='volcano_rabbit'?<path d="M42 38l-7-21 18 10M108 38l7-21-18 10" fill="#725e4f"/>:breed==='pygmy_rabbit'?<><ellipse cx="42" cy="89" rx="12" ry="9" fill="#e7d8c4"/><ellipse cx="108" cy="89" rx="12" ry="9" fill="#e7d8c4"/></>:breed==='kit_fox'?<path d="M20 51L9 4l49 34M130 51l11-47-49 34" fill="#e9bc8e" stroke="#9e8067" strokeWidth="2"/>:breed==='swift_fox'?<path d="M33 78q42 25 84 0" fill="none" stroke="#eee0ce" strokeWidth="9"/>:breed==='island_fox'?<path d="M33 48q42-24 84 0" fill="none" stroke="#695c55" strokeWidth="11"/>:breed==='european_hamster'?<><ellipse cx="36" cy="90" rx="14" ry="19" fill="#423c39"/><ellipse cx="114" cy="90" rx="14" ry="19" fill="#423c39"/></>:breed==='brandts_hamster'?<path d="M32 75q43 30 86 0" fill="none" stroke="#74695d" strokeWidth="8"/>:breed==='campbells_dwarf'?<path d="M75 37v45" stroke="#746653" strokeWidth="8"/>:breed==='grizzly_bear'?<path d="M55 101q20 21 40 0" fill="none" stroke="#e5bd92" strokeWidth="12"/>:breed==='polar_bear'?<><ellipse cx="45" cy="73" rx="12" ry="15" fill="#e4ebf0"/><ellipse cx="105" cy="73" rx="12" ry="15" fill="#e4ebf0"/></>:breed==='short_faced_bear'?<path d="M43 79q32-10 64 0" fill="none" stroke="#51443f" strokeWidth="9"/>:breed==='african_penguin'?<><ellipse cx="75" cy="86" rx="34" ry="37" fill="none" stroke="#383e45" strokeWidth="6"/><circle cx="43" cy="61" r="5" fill="#e8a7a9"/><circle cx="107" cy="61" r="5" fill="#e8a7a9"/></>:breed==='king_penguin'?<><path d="M37 57q-4-19 10-20M113 57q4-19-10-20" fill="none" stroke="#e7ac61" strokeWidth="10"/></>:breed==='waitaha_penguin'?<path d="M46 54q29-17 58 0" fill="none" stroke="#c4d2da" strokeWidth="9"/>:breed==='tiger_salamander'?<>{[[40,59],[105,61],[46,92],[105,96]].map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx="10" ry="7" fill="#e6c276"/>)}</>:breed==='andersons_salamander'?<path d="M38 79q37-20 74 0" fill="none" stroke="#e5a79b" strokeWidth="8"/>:breed==='ambystoma_dumerilii'?<>{[[43,67],[106,67],[75,44]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="7" fill="#b49a97"/>)}</>:null;
 const extraMarkings:ReactNode=breed==='siamese'?<><ellipse cx="75" cy="85" rx="26" ry="29" fill={secondary} opacity=".78"/><ellipse cx="75" cy="95" rx="12" ry="10" fill={main}/></>:breed==='beagle'?<><ellipse cx="43" cy="69" rx="16" ry="20" fill={accent}/><path d="M54 41q20 13 42 0" stroke={secondary} strokeWidth="8"/></>:breed==='border_collie'?<path d="M65 36q10 8 20 0l-3 48-7 20-7-20Z" fill={secondary}/>:breed==='shiba'?<path d="M43 83q32 28 64 0l-15 24H58Z" fill={secondary}/>:breed==='lionhead'?<><path d="M26 70q-15-36 21-43m56 0q36 7 21 43" fill="none" stroke={accent} strokeWidth="12" strokeLinecap="round"/></>:breed==='himalayan'?<ellipse cx="75" cy="90" rx="21" ry="20" fill={secondary}/>:breed==='cross_fox'?<path d="M27 65q48 13 96 0" stroke={secondary} strokeWidth="12" opacity=".8"/>:breed==='marble_fox'?<path d="M47 44q28 20 56 0" stroke={secondary} strokeWidth="10"/>:breed==='teddy_bear'?<><circle cx="38" cy="89" r="14" fill={secondary}/><circle cx="112" cy="89" r="14" fill={secondary}/></>:breed==='winter_white'?<path d="M34 83q41 27 82 0" fill="none" stroke={secondary} strokeWidth="10"/>:breed==='qinling_panda'||breed==='brown_panda'?<ellipse cx="75" cy="105" rx="27" ry="11" fill={secondary}/>:breed==='rockhopper'||breed==='macaroni'?<><path d="M36 46q-17-19-21-7m99 7q17-19 21-7" fill="none" stroke="#f2c454" strokeWidth="9" strokeLinecap="round"/></>:breed==='piebald'?<><circle cx="47" cy="52" r="13" fill={secondary}/><circle cx="107" cy="99" r="11" fill={secondary}/></>:breed==='mosaic'?<path d="M75 34q40 10 46 43l-42 5Z" fill={secondary}/>:null;
 const eyes=sp==='panda'&&!isRed?<><ellipse cx="53" cy="72" rx="17" ry="20" fill={secondary}/><ellipse cx="97" cy="72" rx="17" ry="20" fill={secondary}/><circle cx="55" cy="72" r="5" fill="white"/><circle cx="95" cy="72" r="5" fill="white"/><circle cx="55" cy="73" r="3" fill="#373340"/><circle cx="95" cy="73" r="3" fill="#373340"/></>:<><ellipse cx="55" cy="75" rx="5" ry="7" fill="#443c49"/><ellipse cx="95" cy="75" rx="5" ry="7" fill="#443c49"/><circle cx="57" cy="72" r="1.6" fill="white"/><circle cx="97" cy="72" r="1.6" fill="white"/></>;
 const mouth=sp==='penguin'?<path d="M67 88 75 101 83 88Z" fill={accent}/>:sp==='dog'?<><ellipse cx="75" cy="95" rx="22" ry="16" fill={secondary}/><ellipse cx="75" cy="88" rx="8" ry="5" fill="#4e4350"/><path d="M75 93q-6 11-13 3m13-3q6 11 13 3" fill="none" stroke={ink} strokeWidth="2"/></>:sp==='bunny'?<><path d="M69 91 75 95 81 91Z" fill="#c88399"/><path d="M75 95v8m0 0q-6 6-12 0m12 0q6 6 12 0" fill="none" stroke={ink} strokeWidth="2"/></>:sp==='fox'||isRed?<><path d="M35 91 75 114 115 91 94 103 75 114 56 103Z" fill={secondary}/><path d="M69 89 75 96 81 89Z" fill="#514552"/></>:sp==='hamster'?<><ellipse cx="45" cy="94" rx="19" ry="15" fill={secondary}/><ellipse cx="105" cy="94" rx="19" ry="15" fill={secondary}/><ellipse cx="75" cy="92" rx="6" ry="4" fill="#cf8799"/></>:<path d="M69 92q6 8 12 0" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round"/>;
 const accessories:Record<string,ReactNode>={
 star_clip:<g transform="translate(110 41)"><path d="m0-17 5 11 12 2-9 8 2 12L0 10l-10 6 2-12-9-8 12-2Z" fill="#f5cf70" {...line}/></g>,
 heart_shades:<g stroke="#8c5b80" strokeWidth="3"><path d="M35 70q9-13 19-3 12-10 18 3-2 14-18 20-17-7-19-20Zm43 0q9-13 19-3 12-10 18 3-2 14-18 20-17-7-19-20Z" fill="#e9a5c6"/><path d="M72 73h6M35 73l-11-4m91 4 11-4" fill="none"/></g>,
 pearl_necklace:<g>{[43,54,65,76,87,98,109].map((x,i)=><circle key={x} cx={x} cy={118+Math.abs(i-3)*1.5} r="5" fill="#fff9f1" stroke="#d9b4c1" strokeWidth="1.5"/>)}<path d="M76 120l-6 8 6 7 6-7Z" fill="#e8a2bd"/></g>,
 moon_crown:<g><path d="M40 39 34 15l20 10 20-20 20 20 20-10-6 24Z" fill="#aa9cd9" {...line}/><path d="M81 15a9 9 0 1 0 7 13 10 10 0 0 1-7-13" fill="#fff1b9"/></g>,
 rainbow_scarf:<g><path d="M39 111q36 13 72 0l-4 17q-34 9-64-1Z" fill="#f6a8b9" {...line}/><path d="M43 121q32 12 64 0" fill="none" stroke="#f5d179" strokeWidth="4"/><path d="M96 125l12 18 11-4-9-21" fill="#b5d9d1" {...line}/></g>,
 fish_clip:<g transform="translate(111 42)"><path d="M-14 0q12-15 23 0Q-2 15-14 0l-10-9v18Z" fill="#96c6dc" {...line}/><circle cx="3" cy="-3" r="2" fill="#534757"/></g>,
 yarn_hat:<g><path d="M38 40q0-34 37-34t37 34Z" fill="#e8a3be" {...line}/><path d="M35 37q40 10 80 0" stroke="#fff0f5" strokeWidth="8"/><circle cx="75" cy="5" r="10" fill="#f4c4d5" {...line}/></g>,
 bone_tag:<g><path d="M47 114q28 15 56 0" fill="none" stroke="#c58a96" strokeWidth="6"/><path d="M68 128q-8-10-12-2t6 9q-8 7 0 12t13-5q5 12 13 5t0-12q10-7 2-12t-12 5Z" fill="#f7e2b6" {...line}/></g>,
 puppy_bandana:<g><path d="M39 113q36 12 72 0l-36 31Z" fill="#ed8e99" {...line}/><path d="M57 121l18 15 18-15" fill="none" stroke="#fff0de" strokeWidth="3"/></g>,
 carrot_clip:<g transform="translate(112 39) rotate(24)"><path d="M-7-10 0 17 8-10Z" fill="#f3aa69" {...line}/><path d="M0-10q-12-14-9-18m9 18q9-16 15-16" stroke="#8ebc94" strokeWidth="5" fill="none"/></g>,
 clover_crown:<g>{[42,58,74,90,106].map(x=><g key={x}><circle cx={x-5} cy="30" r="7" fill="#a3d1a5"/><circle cx={x+5} cy="30" r="7" fill="#a3d1a5"/><circle cx={x} cy="23" r="7" fill="#a3d1a5"/></g>)}<path d="M40 35q35 9 70 0" stroke="#7ca68d" strokeWidth="4" fill="none"/></g>,
 leaf_cape:<g><path d="M37 111q-20 11-23 31l39-13 22 15 22-15 39 13q-3-20-23-31" fill="#8fc0a3" {...line}/><path d="M75 116v25" stroke="#d6e8bd" strokeWidth="3"/></g>,
 forest_crown:<g><path d="M39 38 32 16l23 12 20-22 20 22 23-12-7 22Z" fill="#86b59c" {...line}/><path d="M48 27q7-14 15-4m24 0q8-10 15 4" fill="none" stroke="#e6edc6" strokeWidth="4"/></g>,
 seed_pouch:<g><path d="M49 111q25 12 52 0" fill="none" stroke="#b48776" strokeWidth="5"/><rect x="63" y="117" width="26" height="26" rx="8" fill="#e5c39d" {...line}/><path d="M68 124h16" stroke="#9d7861" strokeWidth="3"/></g>,
 cheek_bow:<g transform="translate(110 92)"><path d="M0 0q-22-17-20 0t20 6q20 12 20-6T0 0Z" fill="#eaa6c2" {...line}/><circle cx="0" cy="3" r="5" fill="#ffe9f0"/></g>,
 bamboo_clip:<g transform="translate(111 41) rotate(-25)"><rect x="-7" y="-20" width="14" height="35" rx="5" fill="#9dc9a6" {...line}/><path d="M-7-5H7M-7 6H7" stroke="#6b9d80" strokeWidth="3"/></g>,
 bamboo_hat:<g><path d="M39 41q36-58 72 0Z" fill="#b8d5aa" {...line}/><path d="M25 43q50 15 100 0" fill="none" stroke="#86b18c" strokeWidth="9"/></g>,
 sailor_hat:<g><path d="M41 42V18q34-14 68 0v24Z" fill="#fffaf0" {...line}/><path d="M35 40q40 11 80 0" fill="none" stroke="#91b9d3" strokeWidth="9"/><path d="M75 20v15m-8-7h16" stroke="#7298b9" strokeWidth="3"/></g>,
 ice_scarf:<g><path d="M40 111q35 14 70 0l-4 15q-32 9-62 0Z" fill="#9bd9e6" {...line}/><path d="M98 123l10 21 12-5-10-20" fill="#b8e9ed" {...line}/></g>,
 bubble_crown:<g>{[45,60,75,90,105].map((x,i)=><circle key={x} cx={x} cy={26-Math.abs(2-i)*4} r={i===2?12:8} fill="#c4edf6" fillOpacity=".55" stroke="#85bfd3" strokeWidth="2"/>)}</g>,
 coral_clip:<g transform="translate(111 44)"><path d="M0 12V-15m0 12-12-11m12 11 11-11m-11 17-15-4m15 4 15-4" fill="none" stroke="#e69ea5" strokeWidth="7" strokeLinecap="round"/></g>,

 bow:<g transform="translate(103 35)"><path d="M0 10Q-24-13-24 9q0 17 24 7Q23 28 24 8q-2-22-24 2" fill="#ef91b2" {...line}/><circle cx="0" cy="12" r="6" fill="#ffd5e4" {...line}/></g>,
 cap:<g><path d="M37 45q5-39 38-39t38 39Z" fill="#a7c9e9" {...line}/><path d="M58 42q39-9 66 8-24 8-63 0" fill="#85b3db" {...line}/></g>,
 crown:<g><path d="M43 36 37 11 59 23 75 4 91 23 113 11 107 36Z" fill="#f5ca72" {...line}/><circle cx="75" cy="24" r="5" fill="#ee91b2"/></g>,
 glasses:<g fill="none" stroke="#574b61" strokeWidth="4" strokeLinecap="round"><rect x="35" y="65" width="34" height="24" rx="10"/><rect x="81" y="65" width="34" height="24" rx="10"/><path d="M69 72q6-5 12 0M35 74l-12-4m92 4 12-4"/></g>,
 flower:<g transform="translate(110 43)">{[0,72,144,216,288].map(a=><ellipse key={a} cx="0" cy="-11" rx="7" ry="12" transform={`rotate(${a})`} fill="#f2a4c0" stroke="#d883a2" strokeWidth="1.5"/>)}<circle r="7" fill="#f9d779"/></g>,
 scarf:<g><path d="M40 112q35 14 70 0l-4 15q-32 10-62 0Z" fill="#d7b0ed" {...line}/><path d="M97 122l12 22 12-5-9-20" fill="#c39bdf" {...line}/></g>,
 halo:<g><ellipse cx="75" cy="8" rx="30" ry="7" fill="none" stroke="#efc36b" strokeWidth="6"/><ellipse cx="75" cy="8" rx="30" ry="7" fill="none" stroke="#fff2b9" strokeWidth="2"/></g>,
 party:<g><path d="M60 37 75 2 93 37Z" fill="#d6a5e9" {...line}/><circle cx="75" cy="3" r="6" fill="#f2a4bb"/><path d="M66 23l19 3" stroke="#fff6df" strokeWidth="4"/></g>
 };
 return <svg viewBox="0 0 150 150" className="pet-svg" role="img" aria-label={`${breed==='classic'?'classic':breed.replaceAll('_',' ')} ${sp} wearing ${cosmetic==='none'?'no accessory':cosmetic}`}>
 <ellipse cx="75" cy="140" rx="43" ry="6" fill="#78525f" opacity=".12"/>
 {sp==='fox'?<g><path d="M105 119Q151 123 141 60Q131 85 110 91Q137 85 129 105Z" fill={main} {...line}/><path d="M133 85Q143 64 141 60Q147 99 129 108L118 107Z" fill={secondary}/></g>:isRed?<path d="M104 113q39-7 30-42-4 24-29 21" fill={main} {...line}/>:null}
 <ellipse cx="75" cy="113" rx="38" ry="27" fill={main} {...line}/>
 {outfit&&<OutfitArtwork outfit={normalizeOutfit(outfit)} legacy={accessories} layer="body"/>}
 {sp==='penguin'?<><ellipse cx="35" cy="108" rx="12" ry="23" fill={main} transform="rotate(24 35 108)"/><ellipse cx="115" cy="108" rx="12" ry="23" fill={main} transform="rotate(-24 115 108)"/></>:null}
 {ears}<ellipse cx="75" cy="76" rx={sp==='hamster'?54:50} ry="44" fill={main} {...line}/>
 {sp==='penguin'?<ellipse cx="75" cy="85" rx="35" ry="37" fill={secondary}/>:null}
 {markings}{extraMarkings}{wildMarkings}
 {sp==='fox'?<g><path d="M26 71Q33 83 18 89L38 94 28 106Q50 104 75 118Q100 104 122 106L112 94 132 89Q117 83 124 71Q105 82 96 89L75 104 54 89Q45 82 26 71Z" fill={secondary} {...line}/><path d="M45 87Q56 78 66 84M84 84Q94 78 105 87" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M60 101 75 112 90 101" fill="none" stroke={accent} strokeWidth="2"/></g>:null}
 {eyes}{mouth}
 {sp==='cat'?<path d="M35 91H13m22 7H15m100-7h22m-22 7h20" stroke={ink} strokeWidth="2"/>:null}
 {sp==='axolotl'?<path d="M48 96q27 15 54 0" stroke={ink} strokeWidth="2" fill="none"/>:null}
 {!outfit&&accessories[cosmetic]||null}{outfit&&<OutfitArtwork outfit={normalizeOutfit(outfit)} legacy={accessories} layer="front"/>}</svg>;
}


function OutfitArtwork({outfit,legacy,layer}:{outfit:Outfit;legacy:Record<string,ReactNode>;layer:'body'|'front'}){
 const line={stroke:'#765e69',strokeWidth:2.3,strokeLinejoin:'round' as const};
 const item=(id:string|null,slot:string):ReactNode=>{
  if(!id)return null;
  const color= id.includes('blue')?'#99c5e8':id.includes('gold')||id.includes('star')?'#f4d07a':id.includes('cloud')?'#e5d4f5':id.includes('autumn')?'#d7a074':'#f2acc5';
  const unlocks:Record<string,[string,number]>={
'crystal_circlet':['head',0],'cherry_blossom_crown':['head',1],'moonlit_veil':['head',2],'dragon_horns':['head',3],'aurora_halo':['head',4],'butterfly_crown':['head',5],'pirate_tricorn':['head',6],'royal_diadem':['head',7],'galaxy_antlers':['head',8],'phoenix_plume':['head',9],'cat_eye_frames':['eyes',0],'starlight_specs':['eyes',1],'pixel_shades':['eyes',2],'rose_gold_glasses':['eyes',3],'emerald_goggles':['eyes',4],'snowflake_lenses':['eyes',5],'cyber_visor':['eyes',6],'nebula_shades':['eyes',7],'royal_mask':['eyes',8],'prismatic_monocle':['eyes',9],'moon_choker':['neck',0],'emerald_pendant':['neck',1],'flower_garland':['neck',2],'silk_cravat':['neck',3],'pearl_choker':['neck',4],'sun_medallion':['neck',5],'frost_necklace':['neck',6],'royal_sash':['neck',7],'cosmic_locket':['neck',8],'phoenix_pendant':['neck',9],'strawberry_cardigan':['clothes',0],'forest_cloak':['clothes',1],'moonlight_kimono':['clothes',2],'dragon_armor':['clothes',3],'aurora_dress':['clothes',4],'butterfly_cape':['clothes',5],'pirate_coat':['clothes',6],'royal_uniform':['clothes',7],'galaxy_robe':['clothes',8],'phoenix_armor':['clothes',9]};

  const special=unlocks[id];
  if(special){
   const index=special[1],tone=['#e8a7c4','#a8d7bd','#b6b2e5','#e9c27a','#95bddd','#d9a8e3','#bd9e82','#efc76f','#7c82b8','#e7a074'][index];
   const jewel=<path d="M75 12l9 12-9 13-9-13Z" fill="#fff7de" stroke="#907b8d" strokeWidth="2"/>;
   if(slot==='head')return <g>
    {index===3||index===8?<><path d="M43 42Q16 24 27 1L59 36M107 42Q134 24 123 1L91 36" fill={tone} {...line}/></>:index===6?<path d="M21 42L40 16 75 25 110 16 129 42Q75 51 21 42Z" fill={tone} {...line}/>:index===9?<path d="M74 40Q44 10 69-5Q68 17 93 4Q108 31 74 40Z" fill={tone} {...line}/>:index===2?<path d="M40 29Q75-2 110 29L124 80Q75 64 26 80Z" fill={tone} fillOpacity=".65" {...line}/>:<path d="M31 40Q75 19 119 40L113 26Q75 7 37 26Z" fill={tone} {...line}/>}
    {index===1||index===5?<>{[44,58,75,92,106].map((x,i)=><g key={x}><circle cx={x} cy={30-(i%2)*6} r="7" fill={i%2?'#fff1e2':tone}/><circle cx={x} cy={30-(i%2)*6} r="3" fill="#f5d17d"/></g>)}</>:index===4?<ellipse cx="75" cy="10" rx="48" ry="9" fill="none" stroke={tone} strokeWidth="7"/>:jewel}
   </g>;
   if(slot==='eyes')return <g stroke="#725d77" strokeWidth="3">
    {index===9?<><circle cx="97" cy="74" r="21" fill={tone} fillOpacity=".35"/><path d="M116 82q8 14 1 28" fill="none"/></>:index===6||index===8?<path d="M28 65Q75 54 122 65L115 88Q75 95 35 88Z" fill={tone} fillOpacity=".7"/>:<><path d={index===0?'M33 69q17-18 36 0l-3 16q-16 9-30-1ZM81 69q17-18 36 0l-3 16q-16 9-30-1Z':'M35 64h34v25H35ZM81 64h34v25H81Z'} fill={tone} fillOpacity=".55"/><path d="M69 72q6-5 12 0M35 70l-10-5m90 5 10-5" fill="none"/></>}
    {index===1||index===5||index===7?<path d="M54 60l3-8 3 8 8 3-8 3-3 8-3-8-8-3Z" fill="#fff7e0" stroke="none"/>:null}
   </g>;
   if(slot==='neck')return <g><path d={index===3||index===7?'M40 107Q75 126 110 107L97 143 75 131 53 143Z':'M40 108Q75 139 110 108'} fill={index===3||index===7?tone:'none'} stroke={tone} strokeWidth="7" strokeLinejoin="round"/>
    {index===2?<>{[48,61,75,89,102].map(x=><circle key={x} cx={x} cy={121} r="7" fill="#f4b5c7"/>)}</>:index===4?<>{[50,62,75,88,100].map(x=><circle key={x} cx={x} cy={121} r="5" fill="#fff4e9"/>)}</>:<path d={index===0||index===8?'M75 122l10 11-10 11-10-11Z':index===1||index===6?'M75 122l12 11-12 12-12-12Z':index===9?'M75 122q-20 9 0 23 20-14 0-23Z':'M75 123l4 9 10 1-8 7 2 9-8-5-8 5 2-9-8-7 10-1Z'} fill="#fff0d7" stroke="#977b8a" strokeWidth="2"/>}
   </g>;
   if(slot==='clothes')return <g><path d="M41 106Q75 94 109 106Q121 123 109 136Q75 152 41 136Q29 123 41 106Z" fill={tone} {...line}/>
    {index===1||index===5||index===8?<path d="M42 107Q18 117 19 142L45 137M108 107Q132 117 131 142L105 137" fill={tone} {...line}/>:null}
    {index===0||index===4?<>{[56,75,94].map(x=><g key={x}><circle cx={x} cy="125" r="6" fill="#fff0e8"/><circle cx={x} cy="125" r="2" fill="#e6a1bc"/></g>)}</>:index===3||index===9?<path d="M47 119l13-11 15 14 15-14 13 11-13 18H60Z" fill="#fff1cc" stroke="#a28d79" strokeWidth="2"/>:index===6?<path d="M75 111v30M52 123h46" stroke="#f8e7d7" strokeWidth="5"/>:index===2?<path d="M47 110L75 140 103 110" fill="none" stroke="#fff4e3" strokeWidth="7"/>:<path d="M51 125q24 12 48 0" stroke="#fff1de" strokeWidth="6" fill="none"/>}
   </g>;
  }
  if(slot==='head'){
   if(id==='rose_beret'||id==='cloud_beanie'||id==='sleep_cap')return <g><path d="M36 42Q30 4 77 7Q121 9 113 42Z" fill={color} {...line}/><path d="M33 42Q75 48 117 42" stroke="#fff3f8" strokeWidth="8" fill="none"/><circle cx="75" cy="7" r="6" fill="#fff7f1"/></g>;
   if(id==='straw_hat')return <g><path d="M43 37 49 14Q75 4 101 14L107 37" fill="#e9ce93" {...line}/><ellipse cx="75" cy="39" rx="59" ry="10" fill="#e9ce93" {...line}/><path d="M45 29h60" stroke="#e89fb6" strokeWidth="6"/></g>;
   if(id==='witch_hat')return <g><path d="M75 0 48 38h54Z" fill="#6b5c83" {...line}/><ellipse cx="75" cy="39" rx="54" ry="8" fill="#6b5c83" {...line}/><path d="M55 30h40" stroke="#f2bf70" strokeWidth="5"/></g>;
   if(id==='winter_earmuffs')return <g><path d="M29 66Q21 10 75 12Q129 10 121 66" stroke="#b99ad5" strokeWidth="9" fill="none"/><ellipse cx="25" cy="69" rx="13" ry="18" fill="#eac4ec" {...line}/><ellipse cx="125" cy="69" rx="13" ry="18" fill="#eac4ec" {...line}/></g>;
   if(id==='star_tiara'||id==='sunflower_crown')return <g><path d="M43 39 37 22 57 29 75 9 93 29 113 22 107 39Z" fill={color} {...line}/><circle cx="75" cy="25" r="7" fill="#fff9dc"/></g>;
  }
  if(slot==='eyes'){
   if(id==='sleep_mask')return <g><rect x="34" y="62" width="82" height="26" rx="13" fill="#c7a8d8" {...line}/><path d="M50 73q9 8 18 0m14 0q9 8 18 0" stroke="#fff6fc" strokeWidth="3" fill="none"/></g>;
   if(id==='monocle')return <g><circle cx="95" cy="74" r="19" fill="#fff9ed" fillOpacity=".25" stroke="#d7b77b" strokeWidth="4"/><path d="M114 83q9 15 3 30" stroke="#d7b77b" strokeWidth="2" fill="none"/></g>;
   if(id==='butterfly_glasses')return <g fill="#eab6d8" stroke="#8f688d" strokeWidth="2.5"><path d="M35 63q15-8 29 7l5 15q-24 12-34-22Zm80 0q-15-8-29 7l-5 15q24 12 34-22Z"/><path d="M69 73h12M35 69l-9-4m89 4 9-4" fill="none"/></g>;
   return <g fill={id==='aviators'?'#8b9bb2':'#cbe5ed'} fillOpacity=".7" stroke="#765e69" strokeWidth="3"><rect x="35" y="64" width="35" height="23" rx={id==='round_specs'?12:6}/><rect x="80" y="64" width="35" height="23" rx={id==='round_specs'?12:6}/><path d="M70 73q5-4 10 0M35 72l-9-5m89 5 9-5" fill="none"/></g>;
  }
  if(slot==='neck'){
   if(id==='gold_chain'||id==='cherry_necklace'||id==='star_pendant'||id==='bell_collar')return <g><path d="M42 111Q75 144 108 111" fill="none" stroke={id==='gold_chain'?'#eac36e':'#b89dc9'} strokeWidth="6"/><circle cx="75" cy="132" r="7" fill={color} {...line}/></g>;
   if(id==='bow_tie')return <g><path d="M75 119 49 108 47 130 75 122 103 130 101 108Z" fill="#eaa2c4" {...line}/><circle cx="75" cy="119" r="7" fill="#f5d5e1" {...line}/></g>;
   if(id==='heart_collar')return <g><path d="M42 112q33 15 66 0" stroke="#d68da8" strokeWidth="9" fill="none"/><path d="M75 136q-17-10-8-18 8-5 8 2 9-8 13-1 5 8-13 17" fill="#f6b2c5" {...line}/></g>;
   if(id==='cozy_muffler')return <g><path d="M42 111q33 13 66 0l-5 17q-30 10-56 0Z" fill={color} {...line}/><path d="M101 124l13 21 11-4-13-22" fill={color} {...line}/></g>;
  }
  if(slot==='clothes'){
   // Clothes follow the pet's round torso instead of forming rectangular human shirts.
   const garment:Record<string,string>={pink_hoodie:'#f2a7c4',denim_overalls:'#86b3d6',flower_dress:'#f3b8d1',raincoat:'#f2cd72',sailor_top:'#9cc5d9',striped_sweater:'#d9a7db',royal_cape:'#a69ad9',cloud_pajamas:'#b9d8ed',autumn_vest:'#d5a178',starry_jacket:'#777cae'};
   const base=garment[id]||color;
   const isCape=id==='royal_cape';
   return <g>
    {isCape?<path d="M44 102Q19 108 18 135Q31 145 48 139Q75 150 102 139Q119 145 132 135Q131 108 106 102Z" fill={base} {...line}/>:null}
    <path d="M42 107Q75 94 108 107Q119 119 109 133Q98 143 75 143Q52 143 41 133Q31 119 42 107Z" fill={base} {...line}/>
    <path d="M47 108Q75 118 103 108" fill="none" stroke="#fff5ec" strokeWidth="4" strokeLinecap="round"/>
    {id==='denim_overalls'?<g><path d="M55 105 60 133H90L95 105" fill="none" stroke="#eaf5ff" strokeWidth="7"/><rect x="61" y="120" width="28" height="17" rx="7" fill="#aed2e9"/><circle cx="60" cy="113" r="2" fill="#f8d57e"/><circle cx="90" cy="113" r="2" fill="#f8d57e"/></g>:null}
    {id==='flower_dress'?<g>{[57,75,93].map(x=><g key={x}><circle cx={x-4} cy="126" r="4" fill="#fff3ee"/><circle cx={x+4} cy="126" r="4" fill="#fff3ee"/><circle cx={x} cy="122" r="4" fill="#fff3ee"/><circle cx={x} cy="126" r="2" fill="#f0c35d"/></g>)}</g>:null}
    {id==='striped_sweater'||id==='sailor_top'?<g stroke="#fff7ed" strokeWidth="4" fill="none"><path d="M42 119Q75 128 108 119M42 130Q75 140 108 130"/></g>:null}
    {id==='raincoat'?<g><path d="M75 114V141" stroke="#fff8df" strokeWidth="3"/><circle cx="80" cy="122" r="2" fill="#fff8df"/><circle cx="80" cy="133" r="2" fill="#fff8df"/></g>:null}
    {id==='pink_hoodie'?<path d="M53 111Q75 132 97 111" stroke="#f9d6e5" strokeWidth="5" fill="none"/>:null}
    {id==='starry_jacket'||id==='cloud_pajamas'?<g fill="#fff8df"><path d="m58 124 2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1Z"/><circle cx="92" cy="128" r="4"/></g>:null}
    {id==='autumn_vest'?<g><path d="M62 113 75 134 88 113" fill="none" stroke="#f6dfb6" strokeWidth="5"/><circle cx="75" cy="137" r="2" fill="#fff4e6"/></g>:null}
    {isCape?<path d="M46 110Q75 120 104 110" fill="none" stroke="#f9d37d" strokeWidth="4"/>:null}
   </g>;
  }
  return legacy[id]||null;
 };
 return <g className="pawpal-outfit">{layer==='body'?item(outfit.clothes,'clothes'):<>{item(outfit.neck,'neck')}{item(outfit.eyes,'eyes')}{item(outfit.head,'head')}</>}</g>;
}
