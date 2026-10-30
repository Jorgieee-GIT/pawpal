import {kitchenRecipes, kitchenPrices, readyMealPrices, findRecipeByIngredients, knownRecipe, publicKitchenRecipes, cookingRating} from './kitchenCatalog.js';
import {FLOWER_RULES,GARDEN_SEED_PRICE,GARDEN_WATER_PRICE,GARDEN_GROWTH_MS,createGardenFlower,gardenHarvestReady,publicPetGarden,recordFlowerDiscovery} from './gardenRules.js';
import 'dotenv/config';

import express from 'express';

import cors from 'cors';

import {randomUUID} from 'node:crypto';

import bcrypt from 'bcryptjs';

import jwt from 'jsonwebtoken';

import {z} from 'zod';

import {pool} from './db.js';
import {registerMultiplayer} from './multiplayer.js';
import {pawMailCatalog, pawMailDesigns} from './mailCatalog.js';

const app=express();app.use(express.json({limit:'24kb'}));

app.use(cors({

    origin: [

      'http://localhost:5173',

      'https://pawpal-navy.vercel.app',

      /^https:\/\/pawpal-[a-z0-9-]+\.vercel\.app$/

    ],

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

    allowedHeaders: ['Content-Type', 'Authorization']

  }));


// Live updates use authenticated Server-Sent Events and PostgreSQL LISTEN/NOTIFY.
// This works across multiple Node processes connected to the same PostgreSQL database.
const liveClients=new Map<string,Set<any>>();
function publishLive(userIds:string[],type:string){
  const unique=[...new Set(userIds.filter(Boolean))];
  for(const id of unique){
    const payload=JSON.stringify({userId:id,type,at:Date.now()});
    // pg_notify is delivered to all running API instances, including this one.
    void pool.query('SELECT pg_notify($1,$2)',['pawpal_live',payload]).catch(e=>console.error('Live notification failed',e));
  }
}
// Avoid notifying friends on every scrub stroke, while keeping appearance and sleep immediate.
const lastFriendPetBroadcast = new Map<string, number>();
async function publishPetToFriends(userId: string, immediate = false) {
    const now = Date.now();
    if (!immediate && now - (lastFriendPetBroadcast.get(userId) || 0) < 2500) return;
    lastFriendPetBroadcast.set(userId, now);
    const friends = await pool.query(
        "SELECT CASE WHEN requester_id=$1 THEN recipient_id ELSE requester_id END AS friend_id FROM friendships WHERE status='accepted' AND (requester_id=$1 OR recipient_id=$1)",
        [userId]
    );
    publishLive(friends.rows.map((row: any) => String(row.friend_id)), 'friend_pet_updated');
}
async function subscribeLive(){
  const client=await pool.connect();
  client.on('notification',message=>{
    if(message.channel!=='pawpal_live'||!message.payload)return;
    try{const event=JSON.parse(message.payload);for(const res of liveClients.get(event.userId)||[])res.write(`event: update\ndata: ${JSON.stringify({type:event.type})}\n\n`)}catch(e){console.error('Live event parse error',e)}
  });
  client.on('error',e=>console.error('Live database listener error',e));
  client.on('end',()=>{console.warn('Live database listener disconnected');setTimeout(()=>void subscribeLive().catch(console.error),2000)});
  await client.query('LISTEN pawpal_live');
}
void subscribeLive().catch(e=>console.error('Live listener unavailable',e));

const secret=process.env.JWT_SECRET||'LOCAL_DEVELOPMENT_ONLY_CHANGE_THIS_SECRET';

if(process.env.NODE_ENV==='production'&&!process.env.JWT_SECRET)throw Error('Set JWT_SECRET in production');

const fields='id,owner_id,name,species,breed,color,owned_colors,owned_breeds,hunger,happiness,energy,cleanliness,affection,coins,xp,level,food,toys,owned_cosmetics,equipped_cosmetic,equipped_outfit,room_theme,active_room,unlocked_rooms,room_layouts,owned_items,placed_items,garden,last_daily,daily_claimed_at,last_game_at,created_at,updated_at';

const species=['cat','dog','bunny','fox','hamster','panda','penguin','axolotl'];

const catalog:Record<string,{price:number,type:string,level?:number}>={eurasian_lynx:{price:24000,type:'breed',level:7},snow_leopard:{price:30975,type:'breed',level:16},smilodon:{price:41825,type:'breed',level:30},gray_wolf:{price:24000,type:'breed',level:7},african_wild_dog:{price:30975,type:'breed',level:16},dire_wolf:{price:41825,type:'breed',level:30},pygmy_rabbit:{price:24000,type:'breed',level:7},volcano_rabbit:{price:30975,type:'breed',level:16},nuralagus:{price:41825,type:'breed',level:30},kit_fox:{price:24000,type:'breed',level:7},swift_fox:{price:30975,type:'breed',level:16},island_fox:{price:41825,type:'breed',level:30},campbells_dwarf:{price:24000,type:'breed',level:7},european_hamster:{price:30975,type:'breed',level:16},brandts_hamster:{price:41825,type:'breed',level:30},grizzly_bear:{price:24000,type:'breed',level:7},polar_bear:{price:30975,type:'breed',level:16},short_faced_bear:{price:41825,type:'breed',level:30},african_penguin:{price:24000,type:'breed',level:7},king_penguin:{price:30975,type:'breed',level:16},waitaha_penguin:{price:41825,type:'breed',level:30},tiger_salamander:{price:24000,type:'breed',level:7},andersons_salamander:{price:30975,type:'breed',level:16},ambystoma_dumerilii:{price:41825,type:'breed',level:30},bow:{price:420,type:'cosmetic'},cap:{price:550,type:'cosmetic'},crown:{price:2400,type:'cosmetic'},glasses:{price:720,type:'cosmetic'},flower:{price:460,type:'cosmetic'},scarf:{price:790,type:'cosmetic'},halo:{price:3000,type:'cosmetic'},party:{price:850,type:'cosmetic'},pink:{price:550,type:'color'},cream:{price:450,type:'color'},gray:{price:600,type:'color'},orange:{price:650,type:'color'},black:{price:650,type:'color'},lavender:{price:950,type:'color'},mint:{price:950,type:'color'},calico:{price:8100,type:'breed'},tabby:{price:7500,type:'breed'},tuxedo:{price:8300,type:'breed'},spotted:{price:7900,type:'breed'},fluffy:{price:9300,type:'breed'},striped:{price:8000,type:'breed'},cloud_sofa:{price:2400,type:'furniture'},plant:{price:580,type:'furniture'},lamp:{price:950,type:'furniture'},bookshelf:{price:1800,type:'furniture'},rug:{price:950,type:'furniture'},cat_tree:{price:2200,type:'furniture'},plush:{price:750,type:'furniture'},golden:{price:7500,type:'breed'},dalmatian:{price:8100,type:'breed'},husky:{price:8700,type:'breed'},corgi:{price:9300,type:'breed'},lop:{price:7500,type:'breed'},dutch:{price:8100,type:'breed'},angora:{price:8700,type:'breed'},red_fox:{price:7500,type:'breed'},arctic_fox:{price:8100,type:'breed'},fennec:{price:8700,type:'breed'},silver_fox:{price:9300,type:'breed'},syrian:{price:7500,type:'breed'},dwarf:{price:8100,type:'breed'},roborovski:{price:8700,type:'breed'},banded:{price:9300,type:'breed'},giant_panda:{price:7500,type:'breed'},red_panda:{price:8100,type:'breed'},snow_panda:{price:8700,type:'breed'},baby_panda:{price:9300,type:'breed'},emperor:{price:7500,type:'breed'},adelie:{price:8100,type:'breed'},gentoo:{price:8700,type:'breed'},chinstrap:{price:9300,type:'breed'},leucistic:{price:7500,type:'breed'},wild_type:{price:8100,type:'breed'},melanoid:{price:8700,type:'breed'},golden_albino:{price:9300,type:'breed'},star_clip:{price:800,type:'cosmetic'},heart_shades:{price:970,type:'cosmetic'},pearl_necklace:{price:1140,type:'cosmetic'},moon_crown:{price:1310,type:'cosmetic'},rainbow_scarf:{price:1480,type:'cosmetic'},fish_clip:{price:1250,type:'cosmetic'},yarn_hat:{price:1700,type:'cosmetic'},bone_tag:{price:1250,type:'cosmetic'},puppy_bandana:{price:1700,type:'cosmetic'},carrot_clip:{price:1250,type:'cosmetic'},clover_crown:{price:1700,type:'cosmetic'},leaf_cape:{price:1250,type:'cosmetic'},forest_crown:{price:1700,type:'cosmetic'},seed_pouch:{price:1250,type:'cosmetic'},cheek_bow:{price:1700,type:'cosmetic'},bamboo_clip:{price:1250,type:'cosmetic'},bamboo_hat:{price:1700,type:'cosmetic'},sailor_hat:{price:1250,type:'cosmetic'},ice_scarf:{price:1700,type:'cosmetic'},bubble_crown:{price:1250,type:'cosmetic'},coral_clip:{price:1700,type:'cosmetic'},siamese:{price:13500,type:'breed'},british_shorthair:{price:14850,type:'breed'},maine_coon:{price:16200,type:'breed'},beagle:{price:13500,type:'breed'},shiba:{price:14850,type:'breed'},border_collie:{price:16200,type:'breed'},lionhead:{price:13500,type:'breed'},rex:{price:14850,type:'breed'},himalayan:{price:16200,type:'breed'},cross_fox:{price:13500,type:'breed'},marble_fox:{price:14850,type:'breed'},bat_eared_fox:{price:16200,type:'breed'},winter_white:{price:13500,type:'breed'},chinese_hamster:{price:14850,type:'breed'},teddy_bear:{price:16200,type:'breed'},qinling_panda:{price:13500,type:'breed'},brown_panda:{price:14850,type:'breed'},red_panda_cub:{price:16200,type:'breed'},rockhopper:{price:13500,type:'breed'},little_blue:{price:14850,type:'breed'},macaroni:{price:16200,type:'breed'},copper:{price:13500,type:'breed'},piebald:{price:14850,type:'breed'},mosaic:{price:16200,type:'breed'},blush:{price:0,type:'theme'},lavender_room:{price:2500,type:'theme'},mint_room:{price:2500,type:'theme'},night_room:{price:3500,type:'theme'}};

const addedBreedsBySpecies:Record<string,string[]>={"cat": ["siamese", "british_shorthair", "maine_coon", "eurasian_lynx", "snow_leopard", "smilodon"], "dog": ["beagle", "shiba", "border_collie", "gray_wolf", "african_wild_dog", "dire_wolf"], "bunny": ["lionhead", "rex", "himalayan", "pygmy_rabbit", "volcano_rabbit", "nuralagus"], "fox": ["cross_fox", "marble_fox", "bat_eared_fox", "kit_fox", "swift_fox", "island_fox"], "hamster": ["winter_white", "chinese_hamster", "teddy_bear", "campbells_dwarf", "european_hamster", "brandts_hamster"], "panda": ["qinling_panda", "brown_panda", "red_panda_cub", "grizzly_bear", "polar_bear", "short_faced_bear"], "penguin": ["rockhopper", "little_blue", "macaroni", "african_penguin", "king_penguin", "waitaha_penguin"], "axolotl": ["copper", "piebald", "mosaic", "tiger_salamander", "andersons_salamander", "ambystoma_dumerilii"]};

const uniqueCosmeticsBySpecies:Record<string,string[]>={"cat": ["fish_clip", "yarn_hat"], "dog": ["bone_tag", "puppy_bandana"], "bunny": ["carrot_clip", "clover_crown"], "fox": ["leaf_cape", "forest_crown"], "hamster": ["seed_pouch", "cheek_bow"], "panda": ["bamboo_clip", "bamboo_hat"], "penguin": ["sailor_hat", "ice_scarf"], "axolotl": ["bubble_crown", "coral_clip"]};

const breedsBySpecies:Record<string,string[]>={"cat": ["calico", "tabby", "tuxedo", "fluffy"], "dog": ["golden", "dalmatian", "husky", "corgi"], "bunny": ["lop", "dutch", "angora", "spotted"], "fox": ["red_fox", "arctic_fox", "fennec", "silver_fox"], "hamster": ["syrian", "dwarf", "roborovski", "banded"], "panda": ["giant_panda", "red_panda", "snow_panda", "baby_panda"], "penguin": ["emperor", "adelie", "gentoo", "chinstrap"], "axolotl": ["leucistic", "wild_type", "melanoid", "golden_albino"]};

// Append new breed IDs to addedBreedsBySpecies for their species.
// Every additional breed unlocks five levels after that species' previous breed.
// Existing levels never change when breeds are appended.
const BREED_LEVEL_INTERVAL = 5;
const BREED_UNLOCK_LEVELS: Record<string, number> = {};
for (const speciesId of Object.keys(breedsBySpecies)) {
    const orderedBreeds = [
        ...breedsBySpecies[speciesId],
        ...(addedBreedsBySpecies[speciesId] || [])
    ];
    orderedBreeds.forEach((breedId, index) => {
        const requiredLevel = (index + 1) * BREED_LEVEL_INTERVAL;
        BREED_UNLOCK_LEVELS[breedId] = requiredLevel;
    });
}

for (const [breedId, level] of Object.entries(BREED_UNLOCK_LEVELS)) {
    if (catalog[breedId]) catalog[breedId].level = level;
}


const COSMETIC_SLOTS:Record<string,string>={"bow":"head","cap":"head","crown":"head","flower":"head","halo":"head","party":"head","star_clip":"head","moon_crown":"head","fish_clip":"head","yarn_hat":"head","carrot_clip":"head","clover_crown":"head","forest_crown":"head","cheek_bow":"head","bamboo_clip":"head","bamboo_hat":"head","sailor_hat":"head","bubble_crown":"head","coral_clip":"head","glasses":"eyes","heart_shades":"eyes","scarf":"neck","pearl_necklace":"neck","rainbow_scarf":"neck","bone_tag":"neck","puppy_bandana":"neck","seed_pouch":"neck","ice_scarf":"neck","leaf_cape":"clothes","rose_beret":"head","straw_hat":"head","cloud_beanie":"head","star_tiara":"head","witch_hat":"head","sunflower_crown":"head","sleep_cap":"head","winter_earmuffs":"head","round_specs":"eyes","blue_goggles":"eyes","sleep_mask":"eyes","monocle":"eyes","butterfly_glasses":"eyes","aviators":"eyes","heart_collar":"neck","gold_chain":"neck","bow_tie":"neck","cherry_necklace":"neck","star_pendant":"neck","cozy_muffler":"neck","bell_collar":"neck","pink_hoodie":"clothes","denim_overalls":"clothes","flower_dress":"clothes","raincoat":"clothes","sailor_top":"clothes","striped_sweater":"clothes","royal_cape":"clothes","cloud_pajamas":"clothes","autumn_vest":"clothes","starry_jacket":"clothes","crystal_circlet":"head","cherry_blossom_crown":"head","moonlit_veil":"head","dragon_horns":"head","aurora_halo":"head","butterfly_crown":"head","pirate_tricorn":"head","royal_diadem":"head","galaxy_antlers":"head","phoenix_plume":"head","cat_eye_frames":"eyes","starlight_specs":"eyes","pixel_shades":"eyes","rose_gold_glasses":"eyes","emerald_goggles":"eyes","snowflake_lenses":"eyes","cyber_visor":"eyes","nebula_shades":"eyes","royal_mask":"eyes","prismatic_monocle":"eyes","moon_choker":"neck","emerald_pendant":"neck","flower_garland":"neck","silk_cravat":"neck","pearl_choker":"neck","sun_medallion":"neck","frost_necklace":"neck","royal_sash":"neck","cosmic_locket":"neck","phoenix_pendant":"neck","strawberry_cardigan":"clothes","forest_cloak":"clothes","moonlight_kimono":"clothes","dragon_armor":"clothes","aurora_dress":"clothes","butterfly_cape":"clothes","pirate_coat":"clothes","royal_uniform":"clothes","galaxy_robe":"clothes","phoenix_armor":"clothes"};

const NEW_COSMETICS={"rose_beret":{"price":900,"type":"cosmetic"},"straw_hat":{"price":1100,"type":"cosmetic"},"cloud_beanie":{"price":950,"type":"cosmetic"},"star_tiara":{"price":1850,"type":"cosmetic"},"witch_hat":{"price":1550,"type":"cosmetic"},"sunflower_crown":{"price":1400,"type":"cosmetic"},"sleep_cap":{"price":820,"type":"cosmetic"},"winter_earmuffs":{"price":970,"type":"cosmetic"},"round_specs":{"price":850,"type":"cosmetic"},"blue_goggles":{"price":1350,"type":"cosmetic"},"sleep_mask":{"price":700,"type":"cosmetic"},"monocle":{"price":1250,"type":"cosmetic"},"butterfly_glasses":{"price":1350,"type":"cosmetic"},"aviators":{"price":1750,"type":"cosmetic"},"heart_collar":{"price":800,"type":"cosmetic"},"gold_chain":{"price":1900,"type":"cosmetic"},"bow_tie":{"price":650,"type":"cosmetic"},"cherry_necklace":{"price":990,"type":"cosmetic"},"star_pendant":{"price":1050,"type":"cosmetic"},"cozy_muffler":{"price":1250,"type":"cosmetic"},"bell_collar":{"price":850,"type":"cosmetic"},"pink_hoodie":{"price":1650,"type":"cosmetic"},"denim_overalls":{"price":1850,"type":"cosmetic"},"flower_dress":{"price":1750,"type":"cosmetic"},"raincoat":{"price":2100,"type":"cosmetic"},"sailor_top":{"price":1500,"type":"cosmetic"},"striped_sweater":{"price":1400,"type":"cosmetic"},"royal_cape":{"price":2850,"type":"cosmetic"},"cloud_pajamas":{"price":1200,"type":"cosmetic"},"autumn_vest":{"price":1350,"type":"cosmetic"},"starry_jacket":{"price":2300,"type":"cosmetic"},"crystal_circlet":{"price": 1100, "type": "cosmetic", "level": 4},"cherry_blossom_crown":{"price": 1580, "type": "cosmetic", "level": 6},"moonlit_veil":{"price": 2060, "type": "cosmetic", "level": 8},"dragon_horns":{"price": 2540, "type": "cosmetic", "level": 10},"aurora_halo":{"price": 3020, "type": "cosmetic", "level": 12},"butterfly_crown":{"price": 3500, "type": "cosmetic", "level": 15},"pirate_tricorn":{"price": 3980, "type": "cosmetic", "level": 18},"royal_diadem":{"price": 4460, "type": "cosmetic", "level": 22},"galaxy_antlers":{"price": 4940, "type": "cosmetic", "level": 27},"phoenix_plume":{"price": 5420, "type": "cosmetic", "level": 35},"cat_eye_frames":{"price": 1100, "type": "cosmetic", "level": 4},"starlight_specs":{"price": 1580, "type": "cosmetic", "level": 6},"pixel_shades":{"price": 2060, "type": "cosmetic", "level": 8},"rose_gold_glasses":{"price": 2540, "type": "cosmetic", "level": 10},"emerald_goggles":{"price": 3020, "type": "cosmetic", "level": 12},"snowflake_lenses":{"price": 3500, "type": "cosmetic", "level": 15},"cyber_visor":{"price": 3980, "type": "cosmetic", "level": 18},"nebula_shades":{"price": 4460, "type": "cosmetic", "level": 22},"royal_mask":{"price": 4940, "type": "cosmetic", "level": 27},"prismatic_monocle":{"price": 5420, "type": "cosmetic", "level": 35},"moon_choker":{"price": 1100, "type": "cosmetic", "level": 4},"emerald_pendant":{"price": 1580, "type": "cosmetic", "level": 6},"flower_garland":{"price": 2060, "type": "cosmetic", "level": 8},"silk_cravat":{"price": 2540, "type": "cosmetic", "level": 10},"pearl_choker":{"price": 3020, "type": "cosmetic", "level": 12},"sun_medallion":{"price": 3500, "type": "cosmetic", "level": 15},"frost_necklace":{"price": 3980, "type": "cosmetic", "level": 18},"royal_sash":{"price": 4460, "type": "cosmetic", "level": 22},"cosmic_locket":{"price": 4940, "type": "cosmetic", "level": 27},"phoenix_pendant":{"price": 5420, "type": "cosmetic", "level": 35},"strawberry_cardigan":{"price": 1100, "type": "cosmetic", "level": 4},"forest_cloak":{"price": 1580, "type": "cosmetic", "level": 6},"moonlight_kimono":{"price": 2060, "type": "cosmetic", "level": 8},"dragon_armor":{"price": 2540, "type": "cosmetic", "level": 10},"aurora_dress":{"price": 3020, "type": "cosmetic", "level": 12},"butterfly_cape":{"price": 3500, "type": "cosmetic", "level": 15},"pirate_coat":{"price": 3980, "type": "cosmetic", "level": 18},"royal_uniform":{"price": 4460, "type": "cosmetic", "level": 22},"galaxy_robe":{"price": 4940, "type": "cosmetic", "level": 27},"phoenix_armor":{"price": 5420, "type": "cosmetic", "level": 35}};

Object.assign(catalog,NEW_COSMETICS);

// Batch 8: additional collectible room themes, validated by the existing item route.
Object.assign(catalog, {
  strawberry_milk: {price:2100,type:'theme'},
  lavender_dream: {price:2300,type:'theme'},
  mint_garden: {price:2300,type:'theme'},
  blueberry_sky: {price:2500,type:'theme'},
  honey_cottage: {price:2700,type:'theme'},
  peach_blossom: {price:2700,type:'theme'},
  moonlight: {price:3300,type:'theme'},
  sage_forest: {price:2900,type:'theme'},
  aurora_prism: {price:5600,type:'theme',level:12},
  cosmic_nebula: {price:7400,type:'theme',level:20},
  crystal_lagoon: {price:9200,type:'theme',level:28},
  solar_eclipse: {price:11500,type:'theme',level:36},
  celestial_opal: {price:14500,type:'theme',level:45}
});

for(const [id,level] of Object.entries({cloud_sofa:5,moon_crown:12,night_room:8,maine_coon:15,red_panda_cub:18,witch_hat:10,star_tiara:20}))if(catalog[id])catalog[id].level=level;

const clamp=(n:number)=>Math.max(0,Math.min(100,Math.round(n)));

const token=(id:string)=>jwt.sign({sub:id},secret,{expiresIn:'14d'});

function auth(req:any,res:any,next:any){try{const t=(req.headers.authorization||'').replace(/^Bearer /,'');const d=jwt.verify(t,secret) as {sub:string};req.userId=d.sub;next()}catch{res.status(401).json({error:'Please sign in again.'})}}

const handle=(fn:(req:any,res:any)=>Promise<void>)=>(req:any,res:any)=>Promise.resolve(fn(req,res)).catch((e:any)=>{console.error(e);if(!res.headersSent)res.status(500).json({error:'Server error. Check the backend terminal.'})});

const register=z.object({username:z.string().regex(/^[a-zA-Z0-9_]{3,24}$/),password:z.string().min(6).max(100)});


// Admin access is a separate credential, never a role users can grant themselves.
// Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH in the server environment.
const adminSecret=secret+':pawpal-admin-v1';
const adminAttempts=new Map<string,{count:number;until:number}>();
function adminAuth(req:any,res:any,next:any){
  try{
    const raw=String(req.headers.authorization||'').replace(/^Bearer /,'');
    const data=jwt.verify(raw,adminSecret,{algorithms:['HS256']}) as {role?:string;sub?:string};
    if(data.role!=='admin'||data.sub!==process.env.ADMIN_USERNAME)throw Error('Not admin');
    next();
  }catch{res.status(401).json({error:'Admin session expired. Sign in again.'})}
}
app.post('/api/admin/login',handle(async(req,res)=>{
  const ip=String(req.ip||req.socket.remoteAddress||'unknown');
  const state=adminAttempts.get(ip);
  if(state&&state.until>Date.now()&&state.count>=5){res.status(429).json({error:'Too many attempts. Try again in 15 minutes.'});return}
  const configuredName=process.env.ADMIN_USERNAME;
  const configuredHash=process.env.ADMIN_PASSWORD_HASH;
  if(!configuredName||!configuredHash){res.status(503).json({error:'Admin access is not configured on this server.'});return}
  const name=String(req.body?.username||'');
  const pass=String(req.body?.password||'');
  const validPassword=pass.length<=128&&await bcrypt.compare(pass,configuredHash);
  if(name!==configuredName||!validPassword){
    const nextCount=(state&&state.until>Date.now()?state.count:0)+1;
    adminAttempts.set(ip,{count:nextCount,until:Date.now()+15*60*1000});
    res.status(401).json({error:'Invalid admin credentials.'});return
  }
  adminAttempts.delete(ip);
  res.json({token:jwt.sign({sub:configuredName,role:'admin'},adminSecret,{algorithm:'HS256',expiresIn:'2h'}),username:configuredName});
}));
app.get('/api/admin/develop-access',adminAuth,(_req,res)=>{
    res.json({authorized:true});
});
app.get('/api/admin/overview',adminAuth,handle(async(_req,res)=>{
  const [users,pets]=await Promise.all([pool.query('SELECT COUNT(*)::int AS count FROM users'),pool.query('SELECT COUNT(*)::int AS count FROM pets')]);
  res.json({users:users.rows[0].count,pets:pets.rows[0].count});
}));
app.get('/api/admin/users',adminAuth,handle(async(req,res)=>{
  const search=String(req.query.search||'').trim().toLowerCase().slice(0,40);
  const page=Math.min(1000,Math.max(1,Number.parseInt(String(req.query.page||'1'),10)||1));
  const q=await pool.query(`SELECT u.id,u.username,u.created_at,p.id AS pet_id,p.name AS pet_name,p.species,p.level,p.coins
   FROM users u LEFT JOIN pets p ON p.owner_id=u.id
   WHERE ($1='' OR u.username ILIKE '%'||$1||'%')
   ORDER BY u.created_at DESC LIMIT 25 OFFSET $2`,[search,(page-1)*25]);
  res.json({users:q.rows,page});
}));
app.post('/api/admin/users/:id/reset-password',adminAuth,handle(async(req,res)=>{
  if(!z.string().uuid().safeParse(req.params.id).success){res.status(400).json({error:'Invalid user ID.'});return}
  const password=String(req.body?.newPassword||'');
  if(password.length<6||password.length>100){res.status(400).json({error:'New password must be 6–100 characters.'});return}
  const hash=await bcrypt.hash(password,12);
  const q=await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2 RETURNING id,username',[hash,req.params.id]);
  if(!q.rowCount){res.status(404).json({error:'User not found.'});return}
  console.info('[ADMIN] Password reset for user',q.rows[0].id);
  res.json({message:'Password reset successfully. Share the new password securely with the account owner.'});
}));

app.get('/api/health',(_q,r)=>r.json({ok:true}));



// Temporary diagnostic endpoint: confirms database connectivity and users table.

app.get('/api/db-health', async (_req, res) => {

  try {

    const result = await pool.query(

      "SELECT to_regclass('public.users') AS users_table"

    );

    res.json({

      databaseConnected: true,

      usersTableExists: result.rows[0].users_table !== null

    });

  } catch (error) {

    console.error('Database health check failed:', error);

    res.status(500).json({

      databaseConnected: false,

      message: 'Database connection failed. Check Render logs.'

    });

  }

});



app.post('/api/auth/register',handle(async(req,res)=>{const v=register.safeParse(req.body);if(!v.success)return void res.status(400).json({error:'Username must be 3–24 letters, numbers or underscores. Password must be at least 6 characters.'});const {username,password}=v.data;const hash=await bcrypt.hash(password,12);try{const q=await pool.query('INSERT INTO users(id,username,password_hash) VALUES($1,$2,$3) RETURNING id,username',[randomUUID(),username.toLowerCase(),hash]);res.status(201).json({token:token(q.rows[0].id),user:q.rows[0]})}catch(e:any){if(e.code==='23505')return void res.status(409).json({error:'That username is already taken.'});throw e}}));

app.post('/api/auth/login',handle(async(req,res)=>{const {identity,password}=req.body||{};const q=await pool.query('SELECT * FROM users WHERE username=$1',[String(identity||'').toLowerCase()]);if(!q.rows[0]||!await bcrypt.compare(String(password||''),q.rows[0].password_hash))return void res.status(401).json({error:'Incorrect username or password.'});res.json({token:token(q.rows[0].id),user:{id:q.rows[0].id,username:q.rows[0].username}})}));

// Keep the decay clock separate from updated_at: purchases, care actions and
// profile refreshes must not restart the countdown. Store fractional progress
// in the existing garden JSON so no database migration is necessary.
function applyPetDecay(p:any){
  const now=Date.now();
  const stored=Number(p.garden?._decay_at);
  const fallback=new Date(p.updated_at).getTime();
  const previous=Number.isFinite(stored)&&stored>0?stored:(Number.isFinite(fallback)?fallback:now);
  // Do not cap elapsed time: pets must change even after several offline days.
  const elapsed=Math.max(0,now-previous);
  const sleeping=!!p.garden?._sleeping;
  const rate=sleeping?0.75:1;
  const carry={...(p.garden?._decay_carry||{})};
  const take=(name:string,amount:number)=>{
    const total=Math.max(0,Number(carry[name]||0))+amount;
    const whole=Math.floor(total);
    carry[name]=total-whole;
    return whole;
  };
  // All four stats advance against server elapsed time, regardless of whether
  // the browser was open. Fractional progress is preserved between requests.
  const tenMinuteSteps=elapsed/600000;
  p.hunger=clamp(p.hunger-take('hunger',tenMinuteSteps*rate));
  p.happiness=clamp(p.happiness-take('happiness',tenMinuteSteps*rate/2));
  p.cleanliness=clamp(p.cleanliness-take('cleanliness',tenMinuteSteps*rate/2));
  // Awake: -1 Energy / 10 min. Sleeping: +5 Energy / minute,
  // meaning 0 -> 100 in exactly 20 minutes of accumulated sleep.
  p.energy=clamp(p.energy+(sleeping?take('sleep_energy',elapsed/60000*5):-take('awake_energy',tenMinuteSteps)));
  p.garden={...(p.garden||{}),_decay_at:now,_decay_carry:carry};
  return sleeping;
}

// Waking is idempotent. Complete elapsed sleep recovery first, then stop it.
// The row lock makes concurrent activities and sleep toggles consistent.
async function wakePetForActivity(userId:string){
    const client=await pool.connect();
    let changed=false;
    try{
        await client.query('BEGIN');
        const result=await client.query(`SELECT ${fields} FROM pets WHERE owner_id=$1 FOR UPDATE`,[userId]);
        const pet=result.rows[0];
        if(pet?.garden?._sleeping){
            applyPetDecay(pet);
            pet.garden={...(pet.garden||{}),_sleeping:false};
            await client.query(`UPDATE pets SET hunger=$2,happiness=$3,energy=$4,cleanliness=$5,garden=$6::jsonb,updated_at=NOW() WHERE id=$1`,[
                pet.id,pet.hunger,pet.happiness,pet.energy,pet.cleanliness,JSON.stringify(pet.garden)
            ]);
            changed=true;
        }
        await client.query('COMMIT');
    }catch(error){
        await client.query('ROLLBACK');
        throw error;
    }finally{
        client.release();
    }
    if(changed){
        publishLive([userId],'pet_sleep_changed');
        void publishPetToFriends(userId,true).catch(console.error);
    }
    return changed;
}

// Browsing, shopping, changing outfits, decorating, social actions, and claiming rewards
// do not interrupt naps. Only activities that require an awake pet wake it.
function isWakeActivity(path:string,body:any,method:string){
    if(!['POST','PUT','PATCH','DELETE'].includes(method))return false;
    if(path==='/care')return ['feed','play','bathe','scrub','pet_stroke','cuddle'].includes(String(body?.action||''));
    if(path==='/kitchen')return body?.action==='serve';
    if(path==='/game'||path==='/claw/play')return true;
    if(/^\/multiplayer\/challenges\/[^/]+\/move$/.test(path))return true;
    if(/^\/multiplayer\/challenges\/[^/]+\/respond$/.test(path))return body?.action==='accept';
    return false;
}
app.use('/api',(req:any,res:any,next:any)=>{
    if(!isWakeActivity(req.path,req.body,req.method))return next();
    auth(req,res,()=>{
        Promise.resolve(wakePetForActivity(String(req.userId))).then(()=>next()).catch(next);
    });
});

// UI interactions (including opening a game) use this idempotent wake action.
app.post('/api/care/wake',auth,handle(async(req,res)=>{
    await wakePetForActivity(String(req.userId));
    res.json({message:'Your pet is awake!'});
}));

app.get('/api/me',auth,handle(async(req,res)=>{
  const c=await pool.connect();
  try{
    await c.query('BEGIN');
    const u=await c.query('SELECT id,username,CASE WHEN note_expires_at>NOW() THEN pet_note ELSE NULL END AS pet_note,note_expires_at FROM users WHERE id=$1',[req.userId]);
    const q=await c.query(`SELECT ${fields} FROM pets WHERE owner_id=$1 FOR UPDATE`,[req.userId]);
    let pet=q.rows[0]||null;
    if(pet){
      applyPetDecay(pet);
      const result=await c.query(`UPDATE pets SET hunger=$2,energy=$3,happiness=$4,cleanliness=$5,garden=$6::jsonb WHERE id=$1 RETURNING ${fields}`,[pet.id,pet.hunger,pet.energy,pet.happiness,pet.cleanliness,JSON.stringify(pet.garden)]);
      pet=result.rows[0];
    }
    await c.query('COMMIT');
    res.json({user:u.rows[0],pet:publicPetGarden(pet)});
  }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}));

app.post('/api/adopt',auth,handle(async(req,res)=>{const v=z.object({name:z.string().trim().min(1).max(24),species:z.enum(['cat','dog','bunny','fox','hamster','panda','penguin','axolotl'])}).safeParse(req.body);if(!v.success)return void res.status(400).json({error:'Choose a species and a pet name.'});try{const q=await pool.query(`INSERT INTO pets(id,owner_id,name,species) VALUES($1,$2,$3,$4) RETURNING ${fields}`,[randomUUID(),req.userId,v.data.name,v.data.species]);res.status(201).json({pet:q.rows[0]})}catch(e:any){if(e.code==='23505')return void res.status(409).json({error:'You can adopt only one pet.'});throw e}}));

// One-time migration of the old anonymous pet. Explicit ownership claim requires its UUID and an account with no pet.

app.post('/api/claim',auth,handle(async(req,res)=>{if(!z.string().uuid().safeParse(req.body?.petId).success)return void res.status(400).json({error:'Invalid old pet ID.'});const q=await pool.query(`UPDATE pets SET owner_id=$1 WHERE id=$2 AND owner_id IS NULL AND NOT EXISTS(SELECT 1 FROM pets WHERE owner_id=$1) RETURNING ${fields}`,[req.userId,req.body.petId]);if(!q.rows[0])return void res.status(409).json({error:'Pet already claimed, missing, or account already has a pet.'});res.json({pet:publicPetGarden(q.rows[0])})}));

async function mutate(req:any,res:any,fn:(p:any)=>string|Promise<string>){const c=await pool.connect();try{await c.query('BEGIN');const q=await c.query(`SELECT ${fields} FROM pets WHERE owner_id=$1 FOR UPDATE`,[req.userId]);if(!q.rows[0]){await c.query('ROLLBACK');return void res.status(404).json({error:'Adopt a pet first.'})}const p=q.rows[0];const wasSleepingAtRequest=applyPetDecay(p);p._wasSleepingAtRequest=wasSleepingAtRequest;const message=await fn(p);const action=String(req.body?.action||'');const metric=req.path==='/api/care'?({feed:'feed',play:'play',sleep:'sleep',bathe:'bathe',scrub:'bathe',pet_stroke:'cuddle',cuddle:'cuddle',food:'buy',toy:'buy'} as Record<string,string>)[action]:req.path==='/api/garden'?({plant:'plant',harvest:'harvest',water:'water',seeds:'buy',buy_water:'buy'} as Record<string,string>)[action]:req.path==='/api/item'&&req.body?.mode==='buy'?'buy':req.path==='/api/item'&&req.body?.mode==='equip'&&(catalog[req.body?.item]?.type==='theme')?'atmosphere':req.path==='/api/item'&&req.body?.mode==='equip'?'outfit':null;const failed=/^(Buy |Too tired|Not enough|Already |Unknown |Choose |This |That |Unlock |Unlocks |Plant |Your flower|Not ready|All twelve|You need |Please use|Incorrect |Item removed|Look updated)/.test(message);if(metric&&!failed)await recordMissionEvent(c,req.userId,metric);while(p.xp>=p.level*100){p.xp-=p.level*100;p.level++;p.coins+=60}const out=await c.query(`UPDATE pets SET hunger=$2,happiness=$3,energy=$4,cleanliness=$5,affection=$6,coins=$7,xp=$8,level=$9,food=$10,toys=$11,owned_cosmetics=$12::jsonb,equipped_cosmetic=$13,owned_colors=$14::jsonb,color=$15,owned_breeds=$16::jsonb,breed=$17,room_theme=$18,owned_items=$19::jsonb,placed_items=$20::jsonb,garden=$21::jsonb,last_daily=$22,last_game_at=$23,equipped_outfit=$24::jsonb,updated_at=NOW() WHERE id=$1 RETURNING ${fields}`,[p.id,p.hunger,p.happiness,p.energy,p.cleanliness,p.affection,p.coins,p.xp,p.level,p.food,p.toys,JSON.stringify(p.owned_cosmetics),p.equipped_cosmetic,JSON.stringify(p.owned_colors),p.color,JSON.stringify(p.owned_breeds),p.breed,p.room_theme,JSON.stringify(p.owned_items),JSON.stringify(p.placed_items),JSON.stringify(p.garden),p.last_daily,p.last_game_at,JSON.stringify(p.equipped_outfit||{head:null,eyes:null,neck:null,clothes:null})]);await c.query('COMMIT');if(req.path==='/api/care'&&action==='sleep_toggle'){const friends=await pool.query("SELECT CASE WHEN requester_id=$1 THEN recipient_id ELSE requester_id END AS friend_id FROM friendships WHERE status='accepted' AND (requester_id=$1 OR recipient_id=$1)",[req.userId]);publishLive([String(req.userId),...friends.rows.map((r:any)=>String(r.friend_id))],'pet_sleep_changed')}publishLive([String(req.userId)],'pet_updated');if(req.path==='/api/item'||(req.path==='/api/care'&&['sleep_toggle','scrub','pet_stroke','feed','play','bathe','cuddle'].includes(action)))void publishPetToFriends(String(req.userId),action==='sleep_toggle'||req.path==='/api/item').catch(console.error);res.json({pet:publicPetGarden(out.rows[0]),message,...(req.gardenReveal?{gardenReveal:req.gardenReveal}:{})})}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}

// Atomic claim: a row lock prevents concurrent requests from claiming twice.

// Daily Surprise resets at midnight in the Philippines (UTC+08:00).
// A locked pet row and kitchen upsert make claims atomic and idempotent.
app.post('/api/daily/claim',auth,handle(async(req,res)=>{
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  const q=await client.query('SELECT id,daily_claimed_at FROM pets WHERE owner_id=$1 FOR UPDATE',[req.userId]);
  if(!q.rows[0]){await client.query('ROLLBACK');return void res.status(404).json({error:'Adopt a pet first.'})}
  const manilaDay=(date:Date)=>new Date(date.getTime()+8*3600000).toISOString().slice(0,10);
  const today=manilaDay(new Date());
  const previous=q.rows[0].daily_claimed_at;
  const nextMidnight=new Date(Date.parse(today+'T16:00:00Z')+86400000).toISOString();
  if(previous&&manilaDay(new Date(previous))===today){await client.query('ROLLBACK');return void res.status(429).json({error:'Daily Surprise already claimed today.',nextClaimAt:nextMidnight})}
  const updated=await client.query(`UPDATE pets SET daily_claimed_at=NOW(),last_daily=CURRENT_DATE,coins=coins+120,food=food+2,updated_at=NOW() WHERE id=$1 RETURNING ${fields}`,[q.rows[0].id]);
  await client.query(`INSERT INTO pet_kitchens(user_id,meals) VALUES($1,jsonb_build_object('berry_parfait',5)) ON CONFLICT(user_id) DO UPDATE SET meals=jsonb_set(COALESCE(pet_kitchens.meals,'{}'::jsonb),'{berry_parfait}',to_jsonb(COALESCE((pet_kitchens.meals->>'berry_parfait')::int,0)+5),true)`,[req.userId]);
  await recordMissionEvent(client,req.userId,'daily_surprise');
  await client.query('COMMIT');
  publishLive([String(req.userId)],'daily_reward');
  res.json({pet:publicPetGarden(updated.rows[0]),message:'Daily Surprise: +120 coins, +2 regular meals, and +5 Berry Parfaits!',nextClaimAt:nextMidnight});
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}));

app.post('/api/care',auth,handle(async(req,res)=>mutate(req,res,p=>{const action=req.body?.action;let msg='';switch(action){case 'feed':if(p.food<1)return 'Buy food first.';p.food--;p.hunger=clamp(p.hunger+28);p.xp+=12;msg='Yummy lunch!';break;case 'play':if(p.energy<12)return 'Too tired to play.';p.energy=clamp(p.energy-12);p.happiness=clamp(p.happiness+24);p.affection=clamp(p.affection+8);p.coins+=12;p.xp+=18;msg='Playtime! +12 coins';break;case 'sleep_toggle':{const wasSleeping=!!p._wasSleepingAtRequest;const shouldSleep=!wasSleeping;/* Starting a nap at full energy needs one point of headroom, otherwise the next stats refresh immediately auto-wakes the pet. */if(shouldSleep&&p.energy>=100)p.energy=99;p.garden={...(p.garden||{}),_sleeping:shouldSleep};msg=shouldSleep?'Sweet dreams! Your pet is resting.':'Your pet is awake!';break;}case 'sleep':p.energy=clamp(p.energy+36);p.xp+=8;msg='Sweet dreams!';break;case 'scrub':{const last=Number(p.garden?._last_scrub_at||0);const now=Date.now();if(now-last<900)return 'Keep scrubbing!';p.garden={...(p.garden||{}),_last_scrub_at:now};p.cleanliness=clamp(p.cleanliness+5);msg='Bath time!';break;}case 'bathe':p.cleanliness=clamp(p.cleanliness+40);p.xp+=10;msg='Squeaky clean!';break;case 'pet_stroke':{const now=Date.now();const last=Number(p.garden?._last_pet_stroke_at||0);if(now-last<900)return 'Keep petting gently!';const strokes=Number(p.garden?._pet_stroke_count||0)+1;p.garden={...(p.garden||{}),_last_pet_stroke_at:now,_pet_stroke_count:strokes};p.affection=clamp(p.affection+4);if(strokes%10===0)p.happiness=clamp(p.happiness+2);msg='Your pet loves the cuddles!';break;}case 'cuddle':p.affection=clamp(p.affection+20);p.happiness=clamp(p.happiness+10);p.xp+=8;msg='Best friends forever!';break;case 'daily':return 'Please use the dedicated Daily Surprise claim button.';case 'food':if(p.coins<150)return 'Not enough coins.';p.coins-=150;p.food+=3;msg='3 meals added!';break;case 'toy':if(p.coins<350)return 'Not enough coins.';p.coins-=350;p.toys++;msg='A new toy!';break;default:return 'Unknown action.'}return msg})));

app.post('/api/item',auth,handle(async(req,res)=>mutate(req,res,p=>{const {item,mode}=req.body||{};const product=catalog[item];if(!product)return 'Unknown item.';if(product.type==='cosmetic' && (mode==='buy'||mode==='equip') && Object.values(uniqueCosmeticsBySpecies).some(items=>items.includes(item)) && !uniqueCosmeticsBySpecies[p.species]?.includes(item))return 'This accessory belongs to another species.';if(product.type==='breed' && (mode==='buy'||mode==='equip') && ![...(breedsBySpecies[p.species]||[]),...(addedBreedsBySpecies[p.species]||[])].includes(item))return 'That breed is not available for your pet species.';const owned=product.type==='cosmetic'?p.owned_cosmetics:product.type==='color'?p.owned_colors:product.type==='breed'?p.owned_breeds:p.owned_items;if(mode==='buy'){const requiredLevel = product.type === 'breed' ? BREED_UNLOCK_LEVELS[item] : product.level;
        if (requiredLevel && p.level < requiredLevel) return `Unlocks at Level ${requiredLevel}.`;if(owned.includes(item))return 'Already owned.';if(p.coins<product.price)return 'Not enough coins.';p.coins-=product.price;owned.push(item);if(product.type==='theme'){p.room_theme=item;return 'Room theme unlocked and applied!'}if(product.type==='breed'){p.breed=item;p.color='classic';return 'New breed unlocked and equipped!'}return 'New item unlocked!'}if(mode==='unequip'&&owned.includes(item)){if(product.type==='cosmetic'){const slot=COSMETIC_SLOTS[item];if(slot){p.equipped_outfit={...(p.equipped_outfit||{}),[slot]:null};}if(p.equipped_cosmetic===item)p.equipped_cosmetic='none';}else if(product.type==='color'&&p.color===item)p.color='classic';else if(product.type==='breed'&&p.breed===item)p.breed='classic';else if(product.type==='theme'&&p.room_theme===item)p.room_theme='blush';else if(product.type==='furniture')p.placed_items=p.placed_items.filter((x:string)=>x!==item);return 'Item removed!'}if(item==='blush' && mode==='equip'){p.room_theme='blush';return 'Cozy Blush room equipped!'}if(mode==='equip'&&owned.includes(item)){if(product.type==='cosmetic'){const slot=COSMETIC_SLOTS[item];if(!slot)return 'Unknown accessory slot.';if(req.body?.slot&&req.body.slot!==slot)return 'Incorrect accessory slot.';p.equipped_outfit={...(p.equipped_outfit||{}),[slot]:item};p.equipped_cosmetic='none';}else if(product.type==='color')p.color=item;else if(product.type==='breed'){p.breed=item;p.color='classic';}else if(product.type==='theme')p.room_theme=item;else if(product.type==='furniture'){p.placed_items=p.placed_items.includes(item)?p.placed_items.filter((x:string)=>x!==item):[...p.placed_items,item]}return 'Look updated!'}if(mode==='equip'&&item==='none'&&product.type==='cosmetic'){p.equipped_cosmetic='none';return 'Accessory removed.'}return 'Unlock this item first.'})));


// Batch 10: room-specific furniture inventory and authoritative placement.
const FURNITURE_BY_ROOM:Record<string,Record<string,number>>={
 living:{cloud_sofa:2400,plant:580,lamp:950,bookshelf:1800,rug:950,cat_tree:2200,plush:750,velvet_armchair:1700,tea_cart:1300,flower_vase:720,record_player:2300,fireplace:3200,sunset_painting:650,ocean_painting:795,rose_bouquet:940,tulip_bouquet:1085,sage_monstera:1230,mint_pothos:1375,bubble_aquarium:1520,cuckoo_clock:1665,pastel_ottoman:1810,window_seat:1955},
 bedroom:{canopy_bed:2800,moon_lamp:850,vanity:2100,star_pillow:600,cloud_dresser:1700,cozy_bench:1100,rainbow_mobile:650,starry_mobile:795,lavender_quilt:940,peach_quilt:1085,bunny_slippers:1230,bear_slippers:1375,heart_mirror:1520,jewelry_box:1665,dreamcatcher:1810,cloud_humidifier:1955},
 studio:{drawing_table:2200,canvas_stack:780,paint_cart:1200,sculpture:1950,studio_lamp:950,craft_cabinet:1800,sunflower_canvas:650,mountain_canvas:795,ceramic_vase:940,clay_bowl:1085,yarn_basket:1230,knitting_kit:1375,color_wheel:1520,polaroid_wall:1665,calligraphy_set:1810,mini_pottery_wheel:1955},
 sports:{treadmill:2900,boxing_bag:1800,fitness_ball:850,medal_case:1300,skipping_rope:520,mini_bike:2400,basketball_hoop:650,soccer_goal:795,tennis_racket:940,badminton_racket:1085,jumping_hurdle:1230,balance_beam:1375,speed_ladder:1520,climbing_wall:1665,kettlebell_set:1810,sports_trophy:1955}
};
const FURNITURE_UNLOCK_LEVELS:Record<string,number>={sunset_painting:3,ocean_painting:5,rose_bouquet:7,tulip_bouquet:9,sage_monstera:11,mint_pothos:13,bubble_aquarium:16,cuckoo_clock:19,pastel_ottoman:23,window_seat:28,rainbow_mobile:3,starry_mobile:5,lavender_quilt:7,peach_quilt:9,bunny_slippers:11,bear_slippers:13,heart_mirror:16,jewelry_box:19,dreamcatcher:23,cloud_humidifier:28,sunflower_canvas:3,mountain_canvas:5,ceramic_vase:7,clay_bowl:9,yarn_basket:11,knitting_kit:13,color_wheel:16,polaroid_wall:19,calligraphy_set:23,mini_pottery_wheel:28,basketball_hoop:3,soccer_goal:5,tennis_racket:7,badminton_racket:9,jumping_hurdle:11,balance_beam:13,speed_ladder:16,climbing_wall:19,kettlebell_set:23,sports_trophy:28,cloud_sofa:12,fireplace:25,canopy_bed:15,treadmill:20,record_player:18,mini_bike:14,drawing_table:10,cat_tree:8};
const DEFAULT_ROOM_FURNITURE:Record<string,string[]>={
 living:['living_sofa','living_table','living_rug','living_lamp','living_plant'],
 bedroom:['bedroom_bed','bedroom_nightstand','bedroom_wardrobe','bedroom_nightlight','bedroom_plush'],
 studio:['studio_desk','studio_easel','studio_bookshelf','studio_paint','studio_stool'],
 sports:['sports_mat','sports_weights','sports_rack','sports_bag','sports_water']
};
const DEFAULT_POSITIONS:[[number,number],[number,number],[number,number],[number,number],[number,number]]=[[70,61],[28,60],[48,78],[88,38],[13,45]];
function initialLayout(room:string){return DEFAULT_ROOM_FURNITURE[room].map((id,i)=>({id,x:DEFAULT_POSITIONS[i][0],y:DEFAULT_POSITIONS[i][1]}));}
app.get('/api/furniture/catalog',auth,(_req,res)=>res.json({items:FURNITURE_BY_ROOM,defaults:DEFAULT_ROOM_FURNITURE}));
app.post('/api/furniture',auth,handle(async(req,res)=>{
 const parsed=z.object({room:z.enum(['living','bedroom','studio','sports']),action:z.enum(['buy','place','move','store','reset']),item:z.string().min(1).max(60).optional(),x:z.number().min(5).max(95).optional(),y:z.number().min(20).max(85).optional()}).safeParse(req.body);
 if(!parsed.success)return void res.status(400).json({error:'Invalid furniture action or coordinates.'});
 const {room,action,item,x,y}=parsed.data;
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  const result=await client.query('SELECT id,level,coins,owned_items,room_layouts,unlocked_rooms FROM pets WHERE owner_id=$1 FOR UPDATE',[req.userId]);
  if(!result.rows[0]){await client.query('ROLLBACK');return void res.status(404).json({error:'Adopt a pet first.'})}
  const p=result.rows[0];
  if(!['living','bedroom'].includes(room)&&!p.unlocked_rooms.includes(room)){await client.query('ROLLBACK');return void res.status(403).json({error:'Unlock this room first.'})}
  const layouts={...(p.room_layouts||{})};
  const entries:Array<{id:string,x:number,y:number}>=Array.isArray(layouts[room])?layouts[room]:initialLayout(room);
  const owned:string[]=Array.isArray(p.owned_items)?p.owned_items:[];
  const isDefault=(id:string)=>DEFAULT_ROOM_FURNITURE[room].includes(id);
  const price=item?FURNITURE_BY_ROOM[room][item]:undefined;
  let message='Furniture updated.';
  if(action==='buy'){
   if(!item||price===undefined){await client.query('ROLLBACK');return void res.status(400).json({error:'Not sold in this room.'})}
   if(owned.includes(item)){await client.query('ROLLBACK');return void res.status(409).json({error:'Already owned.'})}
   if(p.level<(FURNITURE_UNLOCK_LEVELS[item]||1)){await client.query('ROLLBACK');return void res.status(403).json({error:`Unlocks at Level ${FURNITURE_UNLOCK_LEVELS[item]}.`})}
   if(p.coins<price){await client.query('ROLLBACK');return void res.status(400).json({error:'Not enough coins.'})}
   await client.query('UPDATE pets SET coins=coins-$2,owned_items=owned_items || $3::jsonb WHERE id=$1',[p.id,price,JSON.stringify([item])]);message='Furniture purchased!';
  }else if(action==='reset'){layouts[room]=initialLayout(room);message='Default furniture restored.';
  }else{
   if(!item||(!isDefault(item)&&(!owned.includes(item)||price===undefined))){await client.query('ROLLBACK');return void res.status(403).json({error:'Furniture is not available or not owned.'})}
   const idx=entries.findIndex(f=>f.id===item);
   if(action==='store'){if(idx<0){await client.query('ROLLBACK');return void res.status(400).json({error:'Furniture is not placed.'})}entries.splice(idx,1);message='Furniture stored.'}
   if(action==='place'){if(idx>=0){await client.query('ROLLBACK');return void res.status(409).json({error:'Already placed.'})}entries.push({id:item,x:x??50,y:y??62});message='Furniture placed.'}
   if(action==='move'){if(idx<0||x===undefined||y===undefined){await client.query('ROLLBACK');return void res.status(400).json({error:'Furniture is not placed or coordinates missing.'})}entries[idx]={id:item,x,y};message='Furniture moved.'}
   layouts[room]=entries;
  }
  if(action!=='buy')await client.query('UPDATE pets SET room_layouts=$2::jsonb WHERE id=$1',[p.id,JSON.stringify(layouts)]);
  if(action==='buy')await recordMissionEvent(client,req.userId,'buy');
  if(action==='place')await recordMissionEvent(client,req.userId,'furniture');
  await client.query('COMMIT');res.json({message});
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}));
app.get('/api/catalog',auth,(_q,r)=>r.json(catalog));

app.get('/api/live',auth,(req:any,res:any)=>{
  const userId=String(req.userId);
  res.status(200).set({'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});
  res.flushHeaders();
  res.write('event: ready\ndata: {}\n\n');
  let sockets=liveClients.get(userId);if(!sockets){sockets=new Set();liveClients.set(userId,sockets)}sockets.add(res);
  const keepAlive=setInterval(()=>res.write(': heartbeat\n\n'),20000);
  req.on('close',()=>{clearInterval(keepAlive);sockets!.delete(res);if(!sockets!.size)liveClients.delete(userId)});
});
// Batch 39: bounded notification feed. Derive from existing tables, no unbounded notification storage.
app.get('/api/notifications',auth,handle(async(req,res)=>{
 const result=await pool.query(`
  SELECT kind, actor, event_id, created_at, unread, game_name, wager FROM (
   SELECT 'friend_request' AS kind, u.username AS actor, f.requester_id::text AS event_id,
          f.created_at, true AS unread, NULL::text AS game_name, NULL::integer AS wager
   FROM friendships f JOIN users u ON u.id=f.requester_id
   WHERE f.recipient_id=$1 AND f.status='pending'
   UNION ALL
   SELECT 'friend_accepted', u.username, f.recipient_id::text, f.created_at, false, NULL::text, NULL::integer
   FROM friendships f JOIN users u ON u.id=f.recipient_id
   WHERE f.requester_id=$1 AND f.status='accepted'
   UNION ALL
   SELECT 'mail', u.username, m.id::text, m.created_at, (m.read_at IS NULL), NULL::text, NULL::integer
   FROM paw_mail m JOIN users u ON u.id=m.sender_id
   WHERE m.recipient_id=$1 AND m.expires_at>NOW()
   UNION ALL
   SELECT 'multiplayer_challenge', u.username, c.id::text, c.created_at, true, 'Paw Brawl', c.wager
   FROM multiplayer_challenges c JOIN users u ON u.id=c.challenger_id
   WHERE c.challenged_id=$1 AND c.status='pending' AND c.expires_at>NOW()
   UNION ALL
   SELECT 'multiplayer_result', u.username, c.id::text, c.updated_at, false, 'Paw Brawl', c.wager
   FROM multiplayer_challenges c JOIN users u ON u.id=CASE WHEN c.challenger_id=$1 THEN c.challenged_id ELSE c.challenger_id END
   WHERE (c.challenger_id=$1 OR c.challenged_id=$1) AND c.status='finished'
  ) feed ORDER BY created_at DESC LIMIT 5`,[req.userId]);
 res.json(result.rows);
}));
app.get('/api/friends',auth,handle(async(req,res)=>{const q=await pool.query(`SELECT f.requester_id,f.recipient_id,f.status,u.username,u.id AS friend_id FROM friendships f JOIN users u ON u.id=CASE WHEN f.requester_id=$1 THEN f.recipient_id ELSE f.requester_id END WHERE f.requester_id=$1 OR f.recipient_id=$1 ORDER BY f.created_at DESC`,[req.userId]);res.json(q.rows)}));

app.get('/api/users/search',auth,handle(async(req,res)=>{const username=String(req.query.username||'').trim().toLowerCase();if(!/^[a-z0-9_]{3,24}$/.test(username))return void res.status(400).json({error:'Enter an exact username (3–24 characters).'});const q=await pool.query('SELECT id,username FROM users WHERE username=$1 AND id<>$2',[username,req.userId]);res.json({user:q.rows[0]||null})}));

app.post('/api/friends/request',auth,handle(async(req,res)=>{const username=String(req.body?.username||'').toLowerCase();const u=await pool.query('SELECT id FROM users WHERE username=$1 AND id<>$2',[username,req.userId]);if(!u.rows[0])return void res.status(404).json({error:'Username not found.'});const id=u.rows[0].id;const exists=await pool.query('SELECT status FROM friendships WHERE (requester_id=$1 AND recipient_id=$2) OR (requester_id=$2 AND recipient_id=$1)',[req.userId,id]);if(exists.rowCount)return void res.status(409).json({error:'A request or friendship already exists.'});await pool.query('INSERT INTO friendships(requester_id,recipient_id,status) VALUES($1,$2,$3)',[req.userId,id,'pending']);publishLive([id,req.userId],'friend_request');res.json({message:'Friend request sent!'})}));

app.post('/api/friends/:id/accept',auth,handle(async(req,res)=>{const q=await pool.query("UPDATE friendships SET status='accepted' WHERE requester_id=$1 AND recipient_id=$2 AND status='pending' RETURNING requester_id",[req.params.id,req.userId]);if(!q.rowCount)return void res.status(404).json({error:'No incoming request.'});await recordMissionEvent(pool,req.userId,'friend');await recordMissionEvent(pool,req.params.id,'friend');publishLive([String(req.params.id),req.userId],'friend_accepted');res.json({message:'Friend added!'})}));

app.delete('/api/friends/:id',auth,handle(async(req,res)=>{await pool.query('DELETE FROM friendships WHERE (requester_id=$1 AND recipient_id=$2) OR (requester_id=$2 AND recipient_id=$1)',[req.userId,req.params.id]);publishLive([String(req.params.id),req.userId],'friend_removed');res.json({message:'Friend removed.'})}));

// Batch 9: server-authoritative room unlocking and selection.
app.post('/api/rooms',auth,handle(async(req,res)=>{
  const v=z.object({room:z.enum(['living','bedroom','studio','sports']),action:z.enum(['enter','unlock'])}).safeParse(req.body);
  if(!v.success)return void res.status(400).json({error:'Invalid room action.'});
  const {room,action}=v.data;
  const price=room==='studio'?5000:room==='sports'?8000:0;
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const q=await client.query('SELECT id,coins,unlocked_rooms FROM pets WHERE owner_id=$1 FOR UPDATE',[req.userId]);
    if(!q.rows[0]){await client.query('ROLLBACK');return void res.status(404).json({error:'Adopt a pet first.'})}
    const pet=q.rows[0];const unlocked:Array<string>=Array.isArray(pet.unlocked_rooms)?pet.unlocked_rooms:[];
    const owned=room==='living'||room==='bedroom'||unlocked.includes(room);
    if(action==='unlock'&&!owned){
      if(pet.coins<price){await client.query('ROLLBACK');return void res.status(400).json({error:`You need ${price.toLocaleString()} coins to unlock this room.`})}
      await client.query('UPDATE pets SET coins=coins-$2,unlocked_rooms=unlocked_rooms || $3::jsonb,active_room=$4 WHERE id=$1',[pet.id,price,JSON.stringify([room]),room]);
    }else if(action==='enter'&&owned){
      await client.query('UPDATE pets SET active_room=$2 WHERE id=$1',[pet.id,room]);
    }else{await client.query('ROLLBACK');return void res.status(403).json({error:'Unlock this room first.'})}
    await recordMissionEvent(client,req.userId,'room');
    if(action==='unlock'&&!owned)await recordMissionEvent(client,req.userId,'buy');
    await client.query('COMMIT');res.json({message:action==='unlock'&&!owned?'Room unlocked!':'Welcome to your '+room+'!' });
  }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}));

app.post('/api/notes', auth, handle(async (req, res) => {
  const parsed = z.object({
    text: z.string().trim().max(20)
  }).safeParse(req.body);

  if (!parsed.success) {
    return void res.status(400).json({
      error: 'Notes must be 20 characters or fewer.'
    });
  }

  const value = parsed.data.text;
  const expiresAt = value
    ? new Date(Date.now() + 24 * 60 * 60 * 1000)
    : null;

  await pool.query(
    `UPDATE users
     SET pet_note = $2,
         note_expires_at = $3
     WHERE id = $1`,
    [req.userId, value || null, expiresAt]
  );

  if(value)await recordMissionEvent(pool,req.userId,'note');
  res.json({
    message: value
      ? 'Pet Note saved for 24 hours.'
      : 'Pet Note deleted.'
  });
}));

// Personalized PawMail envelopes: ownership and coin purchases enforced server-side.
const pawMailColors=['blush','rose','peach','apricot','butter','mint','sage','aqua','sky','periwinkle','lavender','lilac','cream','coral','slate'] as const;
app.get('/api/mail/designs',auth,handle(async(req,res)=>{
 const r=await pool.query('SELECT design FROM paw_mail_envelopes WHERE user_id=$1',[req.userId]);
 res.json({owned:['classic',...r.rows.map(x=>x.design)],catalog:pawMailCatalog});
}));
app.post('/api/mail/designs/buy',auth,handle(async(req,res)=>{
 const parsed=z.object({design:z.string().refine(value=>pawMailDesigns.includes(value as typeof pawMailDesigns[number]))}).safeParse(req.body);
 if(!parsed.success||parsed.data.design==='classic')return void res.status(400).json({error:'Choose a premium envelope design.'});
 const client=await pool.connect();try{
  await client.query('BEGIN');
  const pet=await client.query('SELECT coins,level FROM pets WHERE owner_id=$1 FOR UPDATE',[req.userId]);
  if(!pet.rowCount){await client.query('ROLLBACK');return void res.status(404).json({error:'Adopt a pet first.'})}
  const owned=await client.query('SELECT 1 FROM paw_mail_envelopes WHERE user_id=$1 AND design=$2',[req.userId,parsed.data.design]);
  if(owned.rowCount){await client.query('ROLLBACK');return void res.status(409).json({error:'You already own this design.'})}
  const design=pawMailCatalog.find(item=>item.id===parsed.data.design)!;
  if(pet.rows[0].level<design.level){await client.query('ROLLBACK');return void res.status(403).json({error:`Reach Pet Level ${design.level} to unlock ${design.title}.`})}
  if(pet.rows[0].coins<design.price){await client.query('ROLLBACK');return void res.status(400).json({error:`You need ${design.price.toLocaleString()} coins.`})}
  await client.query('UPDATE pets SET coins=coins-$1 WHERE owner_id=$2',[design.price,req.userId]);
  await client.query('INSERT INTO paw_mail_envelopes(user_id,design) VALUES($1,$2)',[req.userId,parsed.data.design]);
  await client.query('COMMIT');res.json({message:'Envelope design unlocked!'});
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}));
app.get('/api/mail', auth, handle(async (req, res) => {
 const result = await pool.query(`SELECT m.id,m.sender_id,m.design,m.color,m.message,m.created_at,m.expires_at,m.read_at,u.username AS sender_username,
  CASE WHEN p.id IS NULL THEN NULL ELSE json_build_object('species',p.species,'color',p.color,'breed',p.breed,'equipped_cosmetic',p.equipped_cosmetic,'equipped_outfit',p.equipped_outfit) END AS sender_pet
  FROM paw_mail m JOIN users u ON u.id=m.sender_id LEFT JOIN pets p ON p.owner_id=m.sender_id
  WHERE m.recipient_id=$1 AND m.expires_at>NOW() ORDER BY m.created_at DESC LIMIT 60`, [req.userId]);
 res.json(result.rows);
}));
app.get('/api/mail/sent', auth, handle(async (req, res) => {
 const result = await pool.query(`SELECT m.id,m.sender_id,m.design,m.color,m.message,m.created_at,m.expires_at,m.read_at,
  u.username AS recipient_username,
  CASE WHEN p.id IS NULL THEN NULL ELSE json_build_object('species',p.species,'color',p.color,'breed',p.breed,'equipped_cosmetic',p.equipped_cosmetic,'equipped_outfit',p.equipped_outfit) END AS sender_pet
  FROM paw_mail m JOIN users u ON u.id=m.recipient_id LEFT JOIN pets p ON p.owner_id=m.sender_id
  WHERE m.sender_id=$1 AND m.expires_at>NOW() ORDER BY m.created_at DESC LIMIT 60`, [req.userId]);
 res.json(result.rows);
}));
app.post('/api/mail', auth, handle(async (req, res) => {
 const parsed=z.object({friendId:z.string().uuid(),design:z.string().refine(value=>pawMailDesigns.includes(value as typeof pawMailDesigns[number])),color:z.enum(pawMailColors),message:z.string().trim().min(1).max(100)}).safeParse(req.body);
 if(!parsed.success)return void res.status(400).json({error:'Choose a friend, envelope, color, and a message (1–100 characters).'});
 if(parsed.data.friendId===req.userId)return void res.status(400).json({error:'You cannot mail yourself.'});
 const friendship=await pool.query(`SELECT 1 FROM friendships WHERE status='accepted' AND
 ((requester_id=$1 AND recipient_id=$2) OR (requester_id=$2 AND recipient_id=$1))`,[req.userId,parsed.data.friendId]);
 if(!friendship.rowCount)return void res.status(403).json({error:'You can only send PawMail to friends.'});
 if(parsed.data.design!=='classic'){
  const owned=await pool.query('SELECT 1 FROM paw_mail_envelopes WHERE user_id=$1 AND design=$2',[req.userId,parsed.data.design]);
  if(!owned.rowCount)return void res.status(403).json({error:'Buy this envelope design first.'});
 }
 await pool.query(`INSERT INTO paw_mail(id,sender_id,recipient_id,design,color,message,expires_at)
 VALUES($1,$2,$3,$4,$5,$6,NOW()+INTERVAL '24 hours')`,[randomUUID(),req.userId,parsed.data.friendId,parsed.data.design,parsed.data.color,parsed.data.message]);
 await recordMissionEvent(pool,req.userId,'mail');publishLive([parsed.data.friendId,req.userId],'mail');res.status(201).json({message:'Your personalized PawMail was sent!'});
}));
app.patch('/api/mail/:id/read',auth,handle(async(req,res)=>{
  const result=await pool.query('UPDATE paw_mail SET read_at=COALESCE(read_at,NOW()) WHERE id=$1 AND recipient_id=$2 AND expires_at>NOW() RETURNING id',[req.params.id,req.userId]);
  if(!result.rowCount)return void res.status(404).json({error:'Postcard not found or expired.'});
  res.json({message:'Postcard opened!'});
}));
app.delete('/api/mail/:id',auth,handle(async(req,res)=>{
  const result=await pool.query('DELETE FROM paw_mail WHERE id=$1 AND recipient_id=$2 RETURNING id',[req.params.id,req.userId]);
  if(!result.rowCount)return void res.status(404).json({error:'Postcard not found.'});
  res.json({message:'Postcard removed.'});
}));

app.delete('/api/notes',auth,handle(async(req,res)=>{await pool.query('UPDATE users SET pet_note=NULL,note_expires_at=NULL WHERE id=$1',[req.userId]);res.json({message:'Pet Note deleted.'})}));

app.get('/api/room',auth,handle(async(req,res)=>{const q=await pool.query(`SELECT p.id,p.name,p.species,p.color,p.breed,p.level,p.hunger,p.happiness,p.energy,p.cleanliness,p.affection,p.equipped_cosmetic,p.equipped_outfit,u.username,u.id AS user_id,CASE WHEN u.note_expires_at>NOW() THEN u.pet_note ELSE NULL END AS pet_note,u.note_expires_at,COALESCE((p.garden->>'_sleeping')::boolean,false) AS sleeping FROM pets p JOIN users u ON u.id=p.owner_id WHERE p.owner_id=$1 OR EXISTS(SELECT 1 FROM friendships f WHERE f.status='accepted' AND ((f.requester_id=$1 AND f.recipient_id=p.owner_id) OR (f.recipient_id=$1 AND f.requester_id=p.owner_id)))`,[req.userId]);res.json(q.rows)}));

// Each plot has its own server-timed growth and its own saved rarity.

const plotPrices=[0,0,0,750,1500,2500,4000,6000,9000,13000,18000,25000];

// Flower chances and rewards are defined in gardenRules.ts.

function gardenState(raw:any){const g=raw||{};g.seeds=Number(g.seeds)||0;g.flowers=Number(g.flowers)||0;g.watering_cans=Number(g.watering_cans)||0;g.unlocked_plots=Math.min(12,Math.max(3,Number(g.unlocked_plots)||3));g.plots=Array.isArray(g.plots)?g.plots.slice(0,12):[];if(g.planted_at&&!g.plots.some((x:any)=>x?.planted_at)){g.plots[0]={planted_at:g.planted_at,watered_minutes:Number(g.watered_minutes)||0,rarity:'Common',reward:50,variant:0}};while(g.plots.length<g.unlocked_plots)g.plots.push(null);delete g.planted_at;delete g.watered_minutes;return g;}

app.post('/api/garden',auth,handle(async(req,res)=>mutate(req,res,p=>{const g=gardenState(p.garden);const action=String(req.body?.action||'');const qty=Number(req.body?.quantity??1);const idx=Number(req.body?.plotIndex??0);const validPlot=Number.isInteger(idx)&&idx>=0&&idx<g.unlocked_plots;

if(['seeds','buy_water'].includes(action)){if(!Number.isSafeInteger(qty)||qty<1||qty>99)return 'Choose a quantity from 1 to 99.';const cost=qty*(action==='seeds'?GARDEN_SEED_PRICE:GARDEN_WATER_PRICE);if(p.coins<cost)return 'Not enough coins.';p.coins-=cost;if(action==='seeds')g.seeds+=qty;else g.watering_cans+=qty;p.garden=g;return `Purchased ${qty} ${action==='seeds'?'seeds':'watering cans'}!`;}

if(action==='unlock_plot'){if(g.unlocked_plots>=12)return 'All twelve plots are unlocked.';const cost=plotPrices[g.unlocked_plots];if(p.coins<cost)return `You need ${cost} coins to unlock this plot.`;p.coins-=cost;g.unlocked_plots++;g.plots.push(null);p.garden=g;return `Plot ${g.unlocked_plots} unlocked!`;}

if(!validPlot)return 'Choose an unlocked garden plot.';

const plot=g.plots[idx];

if(action==='plant'){if(plot?.planted_at)return 'This plot already has a flower.';if(g.seeds<1)return 'Buy more seeds.';g.seeds--;g.plots[idx]=createGardenFlower();p.garden=g;p.energy=clamp(p.energy-2);p.cleanliness=clamp(p.cleanliness-3);return `Seed planted in plot ${idx+1}!`;}

if(action==='water'){if(!plot?.planted_at)return 'Plant a flower in this plot first.';if(g.watering_cans<1)return 'Buy a watering can first.';const remaining=GARDEN_GROWTH_MS-(Date.now()-new Date(plot.planted_at).getTime())-(plot.watered_minutes||0)*60000;if(remaining<=0)return 'Your flower is ready!';g.watering_cans--;plot.watered_minutes=Math.min(5,(plot.watered_minutes||0)+1);p.garden=g;p.energy=clamp(p.energy-2);p.cleanliness=clamp(p.cleanliness-2);return `Plot ${idx+1} watered! One minute removed.`;}

if(action==='harvest'){if(!plot?.planted_at)return 'Plant a flower first.';if(!gardenHarvestReady(plot))return 'Not ready to harvest.';const rarity=String(plot.rarity||'Common');const flower=FLOWER_RULES.find(item=>item.rarity===rarity)||FLOWER_RULES[1];const reward=Number(plot.reward)||50;const newlyDiscovered=recordFlowerDiscovery(g,flower.rarity,reward);req.gardenReveal={rarity:flower.rarity,name:flower.name,reward,variant:Number(plot.variant)||0,plotIndex:idx,newlyDiscovered};g.plots[idx]=null;g.flowers++;p.coins+=reward;p.xp+=15;p.garden=g;p.energy=clamp(p.energy-3);p.cleanliness=clamp(p.cleanliness-4);return `${rarity} flower harvested! +${reward} coins and +15 EXP.`;}

return 'Unknown garden action.'})));

// Paw Claw: prize selection is always server-side, never trusted from the browser.
app.post('/api/claw/play',auth,handle(async(req,res)=>{
 const result:any={};
 await mutate(req,{json:(x:any)=>Object.assign(result,x),status:()=>({json:()=>{}})},p=>{
  if(p.last_game_at&&Date.now()-new Date(p.last_game_at).getTime()<15000)return `Wait ${Math.ceil((15000-(Date.now()-new Date(p.last_game_at).getTime()))/1000)} seconds before playing Paw Claw again.`;
  p.last_game_at=new Date().toISOString();
  p.energy=clamp(p.energy-5);p.cleanliness=clamp(p.cleanliness-4);
  const roll=Math.random()*100;
  if(roll<56){const amount=15+Math.floor(Math.random()*6);p.coins+=amount;return `Paw Claw prize: +${amount} coins!`}
  if(roll<72){const amount=25+Math.floor(Math.random()*26);p.coins+=amount;return `Paw Claw prize: +${amount} coins!`}
  if(roll<76.8){const amount=65+Math.floor(Math.random()*16);p.coins+=amount;return `Paw Claw prize: +${amount} coins!`}
  if(roll<79.2){const themes=Object.keys(catalog).filter(id=>catalog[id].type==='theme'&&id!=='blush'&&!p.owned_items.includes(id));if(themes.length){const theme=themes[Math.floor(Math.random()*themes.length)];p.owned_items.push(theme);return `Paw Claw prize: ${theme.replace(/_/g,' ')} atmosphere unlocked!`}p.coins+=75;return 'All atmospheres owned! +75 bonus coins!'}
  if(roll>=80)return 'The claw slipped! No prize this time.';
  const speciesBreeds=[...(breedsBySpecies[p.species]||[]),...(addedBreedsBySpecies[p.species]||[])];
  const fifth=speciesBreeds[4];
  if(fifth&&!p.owned_breeds.includes(fifth)){p.owned_breeds.push(fifth);return `JACKPOT! ${fifth.replace(/_/g,' ')} breed unlocked!`}
  p.coins+=100;return 'Breed already owned! +100 bonus coins!';
 });
 if(!result.pet)return void res.status(500).json({error:'Prize could not be claimed.'});
 if(!String(result.message||'').startsWith('Wait '))await recordMissionEvent(pool,req.userId,'claw');
 res.json(result);
}));
app.post('/api/game',auth,handle(async(req,res)=>{const v=z.object({game:z.enum(['memory','dino','runner','pattern','mole']),score:z.number().int().min(0).max(100000)}).safeParse(req.body);if(!v.success)return void res.status(400).json({error:'Invalid score.'});const result:any={};await mutate(req,{json:(x:any)=>Object.assign(result,x),status:()=>({json:()=>{}})},p=>{if(p.last_game_at&&Date.now()-new Date(p.last_game_at).getTime()<8000)return 'Wait 8 seconds between rewards.';p.last_game_at=new Date().toISOString();const reward=Math.min(75,10+Math.floor(v.data.score/3));p.coins+=reward;p.xp+=Math.min(40,5+Math.floor(v.data.score/8));p.happiness=clamp(p.happiness+8);p.energy=clamp(p.energy-7);p.cleanliness=clamp(p.cleanliness-5);return `Arcade reward: +${reward} coins!`});if(result.pet && !String(result.message||'').startsWith('Wait '))await Promise.all([recordMissionEvent(pool,req.userId,'arcade'),recordMissionEvent(pool,req.userId,v.data.game)]);if(result.pet)await pool.query('INSERT INTO game_records(user_id,game,best) VALUES($1,$2,$3) ON CONFLICT(user_id,game) DO UPDATE SET best=GREATEST(game_records.best,EXCLUDED.best)',[req.userId,v.data.game,v.data.score]);res.json(result)}));

// Kitchen 3: recipe discovery is deterministic and all inventory changes are transactional.
app.get('/api/kitchen', auth, handle(async(req, res) => {
    const q = await pool.query('SELECT ingredients,meals,active_recipe,recipe_step,cooking_started_at,discovered_recipes,recipe_records,step_scores FROM pet_kitchens WHERE user_id=$1', [req.userId]);
    const kitchen = q.rows[0] || {ingredients:{},meals:{},active_recipe:null,recipe_step:0,cooking_started_at:null,discovered_recipes:[],recipe_records:{},step_scores:[]};
    const discovered = Array.isArray(kitchen.discovered_recipes) ? kitchen.discovered_recipes : [];
    res.json({kitchen, recipes: publicKitchenRecipes(discovered), prices: kitchenPrices, mealPrices: readyMealPrices});
}));
app.post('/api/kitchen', auth, handle(async(req, res) => {
    const action = String(req.body?.action || '');
    const item = String(req.body?.item || '');
    const quantity = Number(req.body?.quantity ?? 1);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const petQ = await client.query('SELECT id,coins,hunger,happiness,energy,xp,level FROM pets WHERE owner_id=$1 FOR UPDATE', [req.userId]);
        if (!petQ.rows[0]) {await client.query('ROLLBACK'); return void res.status(404).json({error:'Adopt a pet first.'});}
        await client.query('INSERT INTO pet_kitchens(user_id) VALUES($1) ON CONFLICT DO NOTHING', [req.userId]);
        const kitchenQ = await client.query('SELECT * FROM pet_kitchens WHERE user_id=$1 FOR UPDATE', [req.userId]);
        const k = kitchenQ.rows[0];
        const ingredients: Record<string,number> = {...k.ingredients};
        const meals: Record<string,number> = {...k.meals};
        const discovered: string[] = Array.isArray(k.discovered_recipes) ? [...k.discovered_recipes] : [];
        const records: Record<string,{cooked:number;best:number}> = {...k.recipe_records};
        let scores: number[] = Array.isArray(k.step_scores) ? [...k.step_scores] : [];
        let active: string | null = k.active_recipe;
        let step = Number(k.recipe_step) || 0;
        let started = k.cooking_started_at;
        let message = '';
        let coinDelta = 0;
        let result: {recipeId:string;name:string;score:number;rating:string;firstTime:boolean} | null = null;
        let stats: {hunger:number;happiness:number;energy:number;xp:number;level:number} | null = null;
        const fail = async (error: string) => {await client.query('ROLLBACK'); res.status(400).json({error});};
        if (action === 'buy') {
            if (!Object.hasOwn(kitchenPrices,item) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20) return void await fail('Choose an ingredient and a quantity from 1 to 20.');
            const cost = kitchenPrices[item] * quantity;
            if (petQ.rows[0].coins < cost) return void await fail('Not enough coins.');
            coinDelta = -cost;
            ingredients[item] = (ingredients[item] || 0) + quantity;
            message = `Purchased ${quantity} ${item}!`;
        } else if (action === 'buy_meal') {
            const recipe = kitchenRecipes[item];
            if (!recipe) return void await fail('Unknown meal.');
            if (!knownRecipe(item,discovered)) return void await fail('Discover this recipe before buying a ready-made serving.');
            if (quantity !== 1) return void await fail('Buy one ready-made meal at a time.');
            const cost = readyMealPrices[item];
            if (petQ.rows[0].coins < cost) return void await fail('Not enough Paw Coins.');
            coinDelta = -cost;
            meals[item] = (meals[item] || 0) + 1;
            message = `Bought ${recipe.name} for ${cost} Paw Coins! Ready in your pantry.`;
        } else if (action === 'experiment') {
            if (active) return void await fail('Finish your current meal before experimenting.');
            const selected: unknown = req.body?.ingredients;
            if (!Array.isArray(selected) || selected.length < 2 || selected.length > 4 || !selected.every(v => typeof v === 'string' && Object.hasOwn(kitchenPrices,v)) || new Set(selected).size !== selected.length) return void await fail('Select 2 to 4 different ingredients.');
            const chosen = selected as string[];
            if (chosen.some(id => (ingredients[id] || 0) < 1)) return void await fail('You need at least one of each selected ingredient.');
            const match = findRecipeByIngredients(chosen);
            if (match && knownRecipe(match,discovered)) {
                message = `You already know ${kitchenRecipes[match].name}! Find it in your Recipe Book. No ingredients used.`;
            } else if (match) {
                // Discovery uses exactly one unit of each selected ingredient, not the whole recipe cost.
                for (const id of chosen) ingredients[id]--;
                discovered.push(match);
                message = `New recipe discovered: ${kitchenRecipes[match].name}! Added to your Recipe Book.`;
                result = {recipeId:match,name:kitchenRecipes[match].name,score:0,rating:'Discovery',firstTime:true};
            } else {
                // A failed try consumes ONE ingredient, never the entire selected combination.
                const spent = [...chosen].sort((a,b) => kitchenPrices[a] - kitchenPrices[b])[0];
                ingredients[spent]--;
                message = `Nothing quite came together. Used 1 ${spent}; the other ingredients were saved. Try a Recipe Book clue!`;
            }
        } else if (action === 'start') {
            const recipe = kitchenRecipes[item];
            if (!recipe) return void await fail('Unknown recipe.');
            if (!knownRecipe(item,discovered)) return void await fail('Discover this recipe in the Experiment Station first.');
            if (active) return void await fail('Finish your current recipe first.');
            for (const [ingredient,amount] of Object.entries(recipe.ingredients)) {
                if ((ingredients[ingredient] || 0) < amount) return void await fail('Not enough ingredients for this recipe.');
            }
            for (const [ingredient,amount] of Object.entries(recipe.ingredients)) ingredients[ingredient] -= amount;
            active = item;
            step = 0;
            scores = [];
            started = new Date();
            message = `Started ${recipe.name}!`;
        } else if (action === 'step') {
            if (!active || !kitchenRecipes[active]) return void await fail('Start a recipe first.');
            const recipe = kitchenRecipes[active];
            const expected = recipe.steps[step];
            if (item !== expected) return void await fail('Not quite! Choose the correct next cooking step.');
            const score = Number(req.body?.score);
            if (!Number.isInteger(score) || score < 0 || score > 100) return void await fail('Invalid cooking result.');
            // Time limit reduces instant API completion; score is cosmetic, never a source of coins or XP.
            if (!started || Date.now() - new Date(started).getTime() < 2200) return void await fail('Give this cooking step a little more time.');
            scores.push(score);
            step++;
            started = new Date();
            message = `${expected} complete!`;
            if (step >= recipe.steps.length) {
                meals[active] = (meals[active] || 0) + 1;
                const average = Math.round(scores.reduce((a,b) => a+b, 0) / Math.max(1, scores.length));
                const prior = records[active] || {cooked:0,best:0};
                records[active] = {cooked:Math.max(0,prior.cooked)+1,best:Math.max(prior.best||0,average)};
                result = {recipeId:active,name:recipe.name,score:average,rating:cookingRating(average),firstTime:prior.cooked === 0};
                message = `${recipe.name} is ready! ${cookingRating(average)} cooking · added to your pantry.`;
                active = null;
                step = 0;
                scores = [];
                started = null;
            }
        } else if (action === 'serve') {
            const recipe = kitchenRecipes[item];
            if (!recipe || !(meals[item] > 0)) return void await fail('Cook this meal before serving it.');
            meals[item]--;
            const pet = petQ.rows[0];
            let xp = pet.xp + recipe.xp;
            let level = pet.level;
            let earnedCoins = 0;
            while (xp >= level * 100) {xp -= level*100;level++;earnedCoins += 60;}
            coinDelta = earnedCoins;
            stats = {hunger:clamp(pet.hunger+recipe.hunger),happiness:clamp(pet.happiness+recipe.happiness),energy:clamp(pet.energy+recipe.energy),xp,level};
            message = `Served ${recipe.name}! +${recipe.xp} XP`;
        } else return void await fail('Unknown kitchen action.');
        await client.query(`UPDATE pet_kitchens SET ingredients=$2::jsonb,meals=$3::jsonb,active_recipe=$4,recipe_step=$5,cooking_started_at=$6,discovered_recipes=$7::jsonb,recipe_records=$8::jsonb,step_scores=$9::jsonb WHERE user_id=$1`, [req.userId,JSON.stringify(ingredients),JSON.stringify(meals),active,step,started,JSON.stringify(discovered),JSON.stringify(records),JSON.stringify(scores)]);
        if (stats) await client.query('UPDATE pets SET coins=coins+$2,hunger=$3,happiness=$4,energy=$5,xp=$6,level=$7,updated_at=NOW() WHERE owner_id=$1', [req.userId,coinDelta,stats.hunger,stats.happiness,stats.energy,stats.xp,stats.level]);
        else if (coinDelta) await client.query('UPDATE pets SET coins=coins+$2 WHERE owner_id=$1', [req.userId,coinDelta]);
        if (action === 'buy' || action === 'buy_meal' || action === 'serve' || (action === 'step' && !active)) {
            await recordMissionEvent(client,req.userId,action === 'buy' ? 'buy' : action === 'buy_meal' ? 'meal_buy' : action === 'serve' ? 'serve' : 'cook');
            if (action === 'buy_meal') await recordMissionEvent(client,req.userId,'buy');
        }
        await client.query('COMMIT');
        publishLive([String(req.userId)],'kitchen_updated');
        const kitchen = {ingredients,meals,active_recipe:active,recipe_step:step,cooking_started_at:started,discovered_recipes:discovered,recipe_records:records,step_scores:scores};
        res.json({message,kitchen,recipes:publicKitchenRecipes(discovered),result});
    } catch (error) {await client.query('ROLLBACK');throw error;} finally {client.release();}
}));

// Batch 13: Mission Center. All rewards and progress are server-authoritative.
type MissionKind='daily'|'weekly'|'milestone';
type MissionDef={id:string;kind:MissionKind;title:string;metric:string;target:number;coins:number;xp:number};
const missionDefs:MissionDef[]=[];
const missionMetrics:[string,string,number[]][]=[
 ['feed','Feed your pet',[1,2,3,4,5,7,10,12,15,20]],
 ['play','Play with your pet',[1,2,3,4,5,7,10,12,15,20]],
 ['sleep','Help your pet rest',[1,2,3,4,5,7,10,12,15,20]],
 ['bathe','Give your pet a bath',[1,2,3,4,5,7,10,12,15,20]],
 ['cuddle','Cuddle your pet',[1,2,3,4,5,7,10,12,15,20]],
 ['arcade','Play an arcade game',[1,2,3,4,5,7,10,12,15,20]],
 ['plant','Plant a garden seed',[1,2,3,4,5,7,10,12,15,20]],
 ['harvest','Harvest a flower',[1,2,3,4,5,7,10,12,15,20]],
 ['water','Water a flower',[1,2,3,4,5,7,10,12,15,20]],
 ['cook','Finish a recipe',[1,2,3,4,5,7,10,12,15,20]],
 ['serve','Serve a cooked meal',[1,2,3,4,5,7,10,12,15,20]],
 ['buy','Make a shop purchase',[1,2,3,4,5,7,10,12,15,20]],
 ['claw','Try Paw Claw',[1,2,3,4,5,7,10,12,15,20]],
 ['meal_buy','Buy a ready-made meal',[1,2,3,4,5,7,10,12,15,20]],
 ['friend','Make a new friend',[1,2,3,4,5,7,10,12,15,20]],
 ['mail','Send PawMail',[1,2,3,4,5,7,10,12,15,20]],
 ['outfit','Change your pet outfit',[1,2,3,4,5,7,10,12,15,20]],
 ['atmosphere','Change room atmosphere',[1,2,3,4,5,7,10,12,15,20]],
 ['furniture','Place room furniture',[1,2,3,4,5,7,10,12,15,20]],
 ['room','Visit a room',[1,2,3,4,5,7,10,12,15,20]],
 ['brawl','Finish a Paw Brawl',[1,2,3,4,5,7,10,12,15,20]],
 ['memory','Play Memory Tiles',[1,2,3,4,5,7,10,12,15,20]],
 ['dino','Play Cactus Jump',[1,2,3,4,5,7,10,12,15,20]],
 ['runner','Play Paw Run',[1,2,3,4,5,7,10,12,15,20]],
 ['pattern','Play Heart Color Match',[1,2,3,4,5,7,10,12,15,20]],
 ['mole','Play Whack-a-Mole',[1,2,3,4,5,7,10,12,15,20]],
 ['gift','Send a friend gift',[1,2,3,4,5,7,10,12,15,20]],
 ['note','Write a pet note',[1,2,3,4,5,7,10,12,15,20]],
 ['daily_surprise','Claim your daily surprise',[1,2,3,4,5,7,10,12,15,20]]
];
// Permanent milestones across every tracked activity. Existing mission IDs stay intact.
for(const [metric,label,targets] of missionMetrics){for(let i=0;i<targets.length;i++){
 const target=targets[i];missionDefs.push({id:`m_${metric}_${i+1}`,kind:'milestone',title:`${label} ${target} ${target===1?'time':'times'}`,metric,target,coins:100+(i+1)*75,xp:30+(i+1)*20});
}}
// Daily missions are sampled from low-friction actions, across the live features.
const dailyMetrics=['feed','play','bathe','cuddle','arcade','plant','harvest','water','cook','serve','buy','claw','meal_buy','outfit','atmosphere'];
for(const metric of dailyMetrics)for(let i=0;i<(['outfit','atmosphere'].includes(metric)?1:4);i++)missionDefs.push({id:`d_${metric}_${i+1}`,kind:'daily',title:`${missionMetrics.find(m=>m[0]===metric)?.[1]} ${i+1} ${i===0?'time':'times'} today`,metric,target:i+1,coins:30+(i+1)*25,xp:10+(i+1)*10});
// Weekly missions rotate across the full gameplay catalog.
const weeklyMetrics=['feed','play','sleep','bathe','cuddle','arcade','claw','plant','harvest','water','cook','serve','buy','meal_buy','mail','outfit','atmosphere','furniture','room','memory','dino','runner','pattern','mole','brawl','gift','note','daily_surprise'];
for(const metric of weeklyMetrics)for(let i=0;i<3;i++){
 const target=['outfit','atmosphere','room','furniture','note','gift'].includes(metric)?[1,3,5][i]:metric==='daily_surprise'?[1,3,5][i]:[3,7,12][i];
 missionDefs.push({id:`w_${metric}_${i+1}`,kind:'weekly',title:`${missionMetrics.find(m=>m[0]===metric)?.[1]} ${target} times this week`,metric,target,coins:140+i*100,xp:50+i*35});
}
function manilaDay(d=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}
function manilaWeek(d=new Date()){const day=manilaDay(d);const utc=new Date(day+'T00:00:00Z');const weekday=utc.getUTCDay();utc.setUTCDate(utc.getUTCDate()-(weekday+6)%7);return utc.toISOString().slice(0,10)}
function pickMissions(kind:MissionKind,userId:string,period:string,count:number){const choices=missionDefs.filter(m=>m.kind===kind);let seed=2166136261;for(const ch of userId+kind+period){seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;}const result=[...choices];for(let i=result.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[result[i],result[j]]=[result[j],result[i]];}return result.slice(0,count)}
async function recordMissionEvent(client:any,userId:string,metric:string,amount=1){
 // Cosmetic changes and room visits should not be farmed by tapping a toggle repeatedly.
 // Once per Manila day is also attainable for the corresponding daily and weekly goals.
 if(['room','outfit','atmosphere','furniture','note'].includes(metric)){
  await client.query(`INSERT INTO mission_events(user_id,metric,amount)
   SELECT $1,$2,$3 WHERE NOT EXISTS(
    SELECT 1 FROM mission_events WHERE user_id=$1 AND metric=$2
    AND (created_at AT TIME ZONE 'Asia/Manila')::date=(NOW() AT TIME ZONE 'Asia/Manila')::date
   )`,[userId,metric,amount]);
 }else await client.query('INSERT INTO mission_events(user_id,metric,amount) VALUES($1,$2,$3)',[userId,metric,amount]);
}
async function missionView(client:any,userId:string){
 const today=manilaDay(),week=manilaWeek();
 const chosen=[...pickMissions('daily',userId,today,5),...pickMissions('weekly',userId,week,10),...missionDefs.filter(m=>m.kind==='milestone')];
 const [counts,claims]=await Promise.all([
  client.query(`SELECT metric,COALESCE(SUM(amount),0)::int AS total,COALESCE(SUM(amount) FILTER (WHERE (created_at AT TIME ZONE 'Asia/Manila')::date=$2::date),0)::int AS today,COALESCE(SUM(amount) FILTER (WHERE (created_at AT TIME ZONE 'Asia/Manila')::date >= $3::date),0)::int AS week FROM mission_events WHERE user_id=$1 GROUP BY metric`,[userId,today,week]),
  client.query('SELECT mission_id,period FROM mission_claims WHERE user_id=$1',[userId])
 ]);
 const values=new Map<string,any>(counts.rows.map((r:any)=>[r.metric,r]));const claimed=new Set(claims.rows.map((r:any)=>r.mission_id+'|'+r.period));
 const missions=chosen.map(m=>{const period=m.kind==='daily'?today:m.kind==='weekly'?week:'lifetime';const row=values.get(m.metric);const progress=Math.min(m.target,Number(row?.[m.kind==='daily'?'today':m.kind==='weekly'?'week':'total']||0));return {...m,progress,claimed:claimed.has(m.id+'|'+period),period};});
 return {missions,totals:{daily:missionDefs.filter(m=>m.kind==='daily').length,weekly:missionDefs.filter(m=>m.kind==='weekly').length,milestone:missionDefs.filter(m=>m.kind==='milestone').length},active:{daily:5,weekly:10,milestone:missionDefs.filter(m=>m.kind==='milestone').length},today,week};
}
app.get('/api/missions',auth,handle(async(req,res)=>{res.json(await missionView(pool,req.userId))}));
app.post('/api/missions/claim-all',auth,handle(async(req,res)=>{
 const parsed=z.object({kind:z.enum(['daily','weekly','milestone'])}).safeParse(req.body);
 if(!parsed.success)return void res.status(400).json({error:'Choose a mission group.'});
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  const q=await client.query('SELECT id,coins,xp,level FROM pets WHERE owner_id=$1 FOR UPDATE',[req.userId]);
  if(!q.rows[0]){await client.query('ROLLBACK');return void res.status(404).json({error:'Adopt a pet first.'})}
  const view=await missionView(client,req.userId);
  const eligible=view.missions.filter((m:any)=>m.kind===parsed.data.kind&&!m.claimed&&m.progress>=m.target);
  let rewardCoins=0,rewardXp=0,claimed=0;
  for(const m of eligible){
   const ins=await client.query('INSERT INTO mission_claims(user_id,mission_id,period) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING mission_id',[req.userId,m.id,m.period]);
   if(ins.rowCount){rewardCoins+=m.coins;rewardXp+=m.xp;claimed++}
  }
  let xp=Number(q.rows[0].xp)+rewardXp,level=Number(q.rows[0].level);
  while(xp>=level*100){xp-=level*100;level++;rewardCoins+=60}
  if(claimed)await client.query('UPDATE pets SET coins=coins+$2,xp=$3,level=$4,updated_at=NOW() WHERE owner_id=$1',[req.userId,rewardCoins,xp,level]);
  await client.query('COMMIT');
  if(claimed)publishLive([String(req.userId)],'pet_updated');
  res.json({message:claimed?`Claimed ${claimed} mission rewards! +${rewardCoins} coins and +${rewardXp} EXP.`:'No completed unclaimed missions in this group.',claimed,coins:rewardCoins,xp:rewardXp});
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}));
app.post('/api/missions/:id/claim',auth,handle(async(req,res)=>{
 const client=await pool.connect();try{
  await client.query('BEGIN');
  const q=await client.query('SELECT id,coins,xp,level FROM pets WHERE owner_id=$1 FOR UPDATE',[req.userId]);
  if(!q.rows[0]){await client.query('ROLLBACK');return void res.status(404).json({error:'Adopt a pet first.'})}
  const view=await missionView(client,req.userId);const m=view.missions.find((x:any)=>x.id===req.params.id);
  if(!m){await client.query('ROLLBACK');return void res.status(404).json({error:'Mission is not active.'})}
  if(m.claimed||m.progress<m.target){await client.query('ROLLBACK');return void res.status(409).json({error:m.claimed?'Already claimed.':'Mission not finished yet.'})}
  const inserted=await client.query('INSERT INTO mission_claims(user_id,mission_id,period) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING mission_id',[req.userId,m.id,m.period]);
  if(!inserted.rowCount){await client.query('ROLLBACK');return void res.status(409).json({error:'Already claimed.'})}
  let xp=Number(q.rows[0].xp)+m.xp,level=Number(q.rows[0].level),coins=m.coins;
  while(xp>=level*100){xp-=level*100;level++;coins+=60}
  await client.query('UPDATE pets SET coins=coins+$2,xp=$3,level=$4,updated_at=NOW() WHERE owner_id=$1',[req.userId,coins,xp,level]);
  await client.query('COMMIT');res.json({message:`Mission complete! +${m.coins} coins and +${m.xp} EXP.`,coins,xp,level});
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}));

app.get('/api/records',auth,handle(async(req,res)=>{const q=await pool.query('SELECT game,best FROM game_records WHERE user_id=$1',[req.userId]);res.json(q.rows)}));

app.get('/api/achievements',auth,handle(async(req,res)=>{const q=await pool.query('SELECT code FROM achievements WHERE user_id=$1',[req.userId]);res.json(q.rows.map(x=>x.code))}));

app.post('/api/achievements/claim-all',auth,handle(async(req,res)=>{
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  const pet=await client.query('SELECT level,coins FROM pets WHERE owner_id=$1',[req.userId]);
  if(!pet.rows.length){await client.query('ROLLBACK');return void res.status(404).json({error:'Pet not found.'})}
  const friend=await client.query("SELECT 1 FROM friendships WHERE status='accepted' AND (requester_id=$1 OR recipient_id=$1) LIMIT 1",[req.userId]);
  const ready:string[]=[];
  if(friend.rowCount)ready.push('first_friend');
  if(pet.rows[0].level>=5)ready.push('level_5');
  if(pet.rows[0].coins>=500)ready.push('rich');
  const claimed=await client.query('INSERT INTO achievements(user_id,code) SELECT $1,unnest($2::text[]) ON CONFLICT DO NOTHING RETURNING code',[req.userId,ready]);
  await client.query('COMMIT');
  res.json({message:claimed.rowCount?`Claimed ${claimed.rowCount} achievement${claimed.rowCount===1?'':'s'}!`:'No new achievements to claim.',claimed:claimed.rows.map((r:any)=>r.code)});
 }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
}));

app.post('/api/achievement',auth,handle(async(req,res)=>{const code=String(req.body?.code||'');const p=await pool.query('SELECT level,coins FROM pets WHERE owner_id=$1',[req.userId]);const valid=code==='first_friend'&&!!(await pool.query("SELECT 1 FROM friendships WHERE status='accepted' AND (requester_id=$1 OR recipient_id=$1)",[req.userId])).rowCount||code==='level_5'&&p.rows[0]?.level>=5||code==='rich'&&p.rows[0]?.coins>=500;if(!valid)return void res.status(400).json({error:'Achievement requirements not met.'});await pool.query('INSERT INTO achievements(user_id,code) VALUES($1,$2) ON CONFLICT DO NOTHING',[req.userId,code]);res.json({message:'Achievement unlocked!'})}));

app.post('/api/gifts',auth,handle(async(req,res)=>{const id=req.body?.friendId;const amount=25;const c=await pool.connect();try{await c.query('BEGIN');const f=await c.query("SELECT 1 FROM friendships WHERE status='accepted' AND ((requester_id=$1 AND recipient_id=$2) OR (requester_id=$2 AND recipient_id=$1))",[req.userId,id]);if(!f.rowCount){await c.query('ROLLBACK');return void res.status(403).json({error:'Only friends can receive gifts.'})}const sender=await c.query('SELECT level FROM pets WHERE owner_id=$1 FOR UPDATE',[req.userId]);if(!sender.rows[0]||sender.rows[0].level<10){await c.query('ROLLBACK');return void res.status(403).json({error:'Reach pet Level 10 before sending coin gifts.'})}const sent=await c.query('UPDATE pets SET coins=coins-$2 WHERE owner_id=$1 AND coins >= $2 RETURNING id',[req.userId,amount]);if(!sent.rowCount){await c.query('ROLLBACK');return void res.status(400).json({error:'Not enough coins.'})}await c.query('UPDATE pets SET coins=coins+$2 WHERE owner_id=$1',[id,amount]);await c.query('INSERT INTO gifts(id,sender_id,recipient_id,coins) VALUES($1,$2,$3,$4)',[randomUUID(),req.userId,id,amount]);await recordMissionEvent(c,req.userId,'gift');await c.query('COMMIT');publishLive([String(id),req.userId],'gift');res.json({message:'Sent a 25-coin gift!'})}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}));

registerMultiplayer(app, auth, publishLive);

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, '0.0.0.0', () => {

  console.log(`PawPal API running on port ${PORT}`);

});
