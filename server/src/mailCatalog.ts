export const pawMailCatalog = [
 {id:'classic',title:'Classic Letter',price:0,level:1},
 {id:'rose_garden',title:'Rose Garden',price:2000,level:1},
 {id:'starry_night',title:'Starry Night',price:2000,level:1},
 {id:'ocean_waves',title:'Ocean Waves',price:2000,level:1},
 {id:'cherry_blossom',title:'Cherry Blossom',price:2000,level:1},
 {id:'woodland',title:'Woodland Friends',price:2000,level:1},
 {id:'royal',title:'Royal Filigree',price:2000,level:1},
 {id:'sweet_treats',title:'Sweet Treats',price:2000,level:1},
 {id:'celestial',title:'Celestial',price:2000,level:1},
 {id:'butterfly',title:'Butterfly Meadow',price:2000,level:1},
 {id:'winter',title:'Winter Wonderland',price:2000,level:1},
 {id:'strawberry_picnic',title:'Strawberry Picnic',price:5000,level:10},
 {id:'moonlit_library',title:'Moonlit Library',price:7000,level:14},
 {id:'coral_kingdom',title:'Coral Kingdom',price:9500,level:18},
 {id:'enchanted_greenhouse',title:'Enchanted Greenhouse',price:12000,level:22},
 {id:'cloud_palace',title:'Cloud Palace',price:14500,level:26},
 {id:'lantern_festival',title:'Lantern Festival',price:17000,level:30},
 {id:'crystal_cavern',title:'Crystal Cavern',price:20000,level:35},
 {id:'aurora_fox',title:'Aurora Fox',price:23500,level:40},
 {id:'sunfire_phoenix',title:'Sunfire Phoenix',price:27000,level:45},
 {id:'dreamscape',title:'Dreamscape',price:30000,level:50}
] as const;
export const pawMailDesigns = pawMailCatalog.map(design=>design.id);

export function canPurchaseEnvelope(designId:string, level:number, coins:number, owned:string[]=[]){
 const design=pawMailCatalog.find(item=>item.id===designId);
 return Boolean(design && design.id!=='classic' && level>=design.level && coins>=design.price && !owned.includes(designId));
}
