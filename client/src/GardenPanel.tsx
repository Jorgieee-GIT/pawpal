import {useState} from 'react';
import {BookOpen,Check,Clock3,Coins,Droplets,Flower2,Leaf,LockKeyhole,Shovel,Sparkles, X} from 'lucide-react';
import {GARDEN_FLOWER_CATALOG,GardenIcon} from './GardenArt';
import {GardenBedArt,GardenGrowthStage} from './GardenBedArt';
import SectionHeading from './SectionHeading';

type Plot = {planted_at:string;watered_minutes:number} | null;
type Discovery = {count:number;first_at:string;best_reward:number};
type Garden = {
    seeds:number;
    flowers:number;
    watering_cans?:number;
    unlocked_plots?:number;
    planted_at?:string|null;
    watered_minutes?:number;
    plots?:Plot[];
    discoveries?:Record<string,Discovery>;
};
type Reveal = {rarity:string;name:string;reward:number;variant:number;plotIndex:number;newlyDiscovered:boolean};
type Props = {
    garden:Garden;
    coins:number;
    busy:boolean;
    nowTick:number;
    onAction:(body:{action:string;plotIndex?:number;quantity?:number})=>Promise<any>;
};
const PLOT_PRICES = [750,1500,2500,4000,6000,9000,13000,18000,25000];
const GROWTH_TIME = 300000;
const SEED_PRICE = 40;
const WATER_PRICE = 10;

function StockShop({kind,label,price,quantity,onQuantity,onBuy,busy,coins}:{kind:'seed'|'water';label:string;price:number;quantity:number;onQuantity:(value:number)=>void;onBuy:()=>void;busy:boolean;coins:number}) {
    return <div className="paw-garden-shop-card">
        <div className="paw-garden-shop-heading"><GardenIcon kind={kind}/><div><strong>{label}</strong><small>{price} coins each</small></div></div>
        <div className="paw-garden-shop-controls">
            <div className="paw-garden-qty" aria-label={`${label} quantity`}><button type="button" disabled={quantity<=1} onClick={()=>onQuantity(Math.max(1,quantity-1))} aria-label={`Decrease ${label}`}>−</button><output>{quantity}</output><button type="button" disabled={quantity>=99} onClick={()=>onQuantity(Math.min(99,quantity+1))} aria-label={`Increase ${label}`}>+</button></div>
            <button type="button" className="paw-garden-shop-buy" disabled={busy||coins<price*quantity} onClick={onBuy}>Buy · {(price*quantity).toLocaleString()} <Coins size={14}/></button>
        </div>
    </div>;
}

export default function GardenPanel({garden,coins,busy,nowTick,onAction}:Props) {
    const [seedQuantity,setSeedQuantity]=useState(1);
    const [waterQuantity,setWaterQuantity]=useState(1);
    const [guideOpen,setGuideOpen]=useState(false);
    const [guideTab,setGuideTab]=useState<'collection'|'odds'>('collection');
    const [reveal,setReveal]=useState<Reveal|null>(null);
    const unlocked = garden.unlocked_plots || 3;
    const discoveries = garden.discoveries || {};
    const foundCount = GARDEN_FLOWER_CATALOG.filter(flower=>discoveries[flower.rarity]?.count>0).length;
    const plotPrice = PLOT_PRICES[unlocked-3];
    const act = async (action:string, plotIndex?:number, quantity?:number) => {
        const result = await onAction({action,...(plotIndex === undefined?{}:{plotIndex}),...(quantity === undefined?{}:{quantity})});
        if (action === 'harvest' && result?.gardenReveal) setReveal(result.gardenReveal);
    };
    const openGuide = (which:'collection'|'odds') => {setGuideTab(which);setGuideOpen(true);};

    return <section className="panel paw-garden-panel">
        <header className="paw-garden-header">
            <div className="paw-garden-header-copy"><div className="eyebrow">A LITTLE PATCH OF MAGIC</div><SectionHeading title="Lucky Garden" Icon={Flower2}/></div>
            <div className="paw-garden-header-actions">
                <button type="button" onClick={()=>openGuide('collection')}><BookOpen size={17}/> Flower Book <span>{foundCount}/5</span></button>
                <button type="button" onClick={()=>openGuide('odds')}><Sparkles size={17}/> Flower Odds</button>
            </div>
        </header>
        <div className="paw-garden-stock" aria-label="Garden supplies">
            <div><GardenIcon kind="seed"/><span><strong>{garden.seeds||0}</strong><small>Seeds</small></span></div>
            <div><GardenIcon kind="water"/><span><strong>{garden.watering_cans||0}</strong><small>Watering cans</small></span></div>
            <div><GardenIcon kind="flower" rarity="Common"/><span><strong>{garden.flowers||0}</strong><small>Harvested</small></span></div>
            <div><BookOpen size={27}/><span><strong>{foundCount}/5</strong><small>Discovered</small></span></div>
        </div>
        <div className="paw-garden-landscape">
            <div className="paw-garden-scenery" aria-hidden="true"><span className="paw-garden-sun"/><span className="paw-garden-cloud cloud-one"/><span className="paw-garden-cloud cloud-two"/><span className="paw-garden-hill hill-one"/><span className="paw-garden-hill hill-two"/><span className="paw-garden-fence"/><span className="paw-garden-butterfly">✿</span></div>
            <div className="paw-garden-scene-title"><Leaf size={15}/> My flower beds <small>{unlocked} of 12 unlocked</small></div>
            <div className="paw-garden-bed-grid">
                {Array.from({length:unlocked},(_,index)=>{
                    const plot = garden.plots?.[index] || (index===0 && garden.planted_at?{planted_at:garden.planted_at,watered_minutes:garden.watered_minutes||0}:null);
                    const remaining = plot ? Math.max(0,GROWTH_TIME-(nowTick-new Date(plot.planted_at).getTime())-(plot.watered_minutes||0)*60000):0;
                    const progress = plot ? 1-remaining/GROWTH_TIME : 0;
                    const stage:GardenGrowthStage = !plot?'empty':remaining===0?'ready':progress<.22?'seed':progress<.58?'sprout':'bud';
                    const canWater = !!plot&&remaining>0&&(garden.watering_cans||0)>0;
                    const time = `${String(Math.floor(remaining/60000)).padStart(2,'0')}:${String(Math.floor((remaining%60000)/1000)).padStart(2,'0')}`;
                    return <article key={index} className={`paw-garden-bed stage-${stage}`}>
                        <span className="paw-garden-wood-sign">PLOT {index+1}</span>
                        <div className="paw-garden-bed-art"><GardenBedArt stage={stage}/></div>
                        {plot?<>
                            <div className={`paw-garden-bed-status ${remaining===0?'is-ready':''}`} title={remaining===0?'Mystery bloom ready to harvest':stage==='seed'?'Seed planted':stage==='sprout'?'Little sprout':'Growing bud'} aria-label={remaining===0?'Mystery bloom ready to harvest':`${time} remaining, ${stage==='seed'?'seed planted':stage==='sprout'?'little sprout':'growing bud'}`} aria-live="off">{remaining===0?<><Sparkles size={13}/> Ready!</>:<><Clock3 size={13}/><span className="paw-garden-countdown">{time}</span></>}</div>
                            {remaining===0?<button type="button" className="paw-garden-plot-action harvest" disabled={busy} onClick={()=>void act('harvest',index)}><Flower2 size={15}/> Reveal & harvest</button>:<button type="button" className="paw-garden-plot-action water" disabled={busy||!canWater} onClick={()=>void act('water',index)} title="Use one watering can to shorten growth by one minute"><Droplets size={15}/> Water · −1 min</button>}
                        </>:<>
                            <div className="paw-garden-bed-status"><Shovel size={13}/> Fresh soil</div>
                            <button type="button" className="paw-garden-plot-action plant" disabled={busy||garden.seeds<1} onClick={()=>void act('plant',index)}><Leaf size={15}/> Plant seed</button>
                        </>}
                    </article>;
                })}
                {unlocked<12&&<button type="button" className="paw-garden-bed paw-garden-locked-bed" disabled={busy||coins<plotPrice} onClick={()=>void act('unlock_plot')}>
                    <span className="paw-garden-wood-sign">PLOT {unlocked+1}</span>
                    <div className="paw-garden-bed-art"><GardenBedArt stage="locked"/></div>
                    <span className="paw-garden-locked-label"><LockKeyhole size={15}/> Unlock bed</span>
                    <span className="paw-garden-locked-price">{plotPrice.toLocaleString()} <Coins size={13}/></span>
                </button>}
            </div>
            
        </div>
        <div className="paw-garden-supplies"><div className="paw-garden-supplies-intro"><h3>Garden shed</h3><p>Stock up for your next little discovery. Watering speeds growth; it doesn't change your odds.</p></div><div className="paw-garden-shop-grid"><StockShop kind="seed" label="Mystery seeds" price={SEED_PRICE} quantity={seedQuantity} onQuantity={setSeedQuantity} busy={busy} coins={coins} onBuy={()=>void act('seeds',undefined,seedQuantity)}/><StockShop kind="water" label="Watering cans" price={WATER_PRICE} quantity={waterQuantity} onQuantity={setWaterQuantity} busy={busy} coins={coins} onBuy={()=>void act('buy_water',undefined,waterQuantity)}/></div></div>

        {guideOpen&&<div className="paw-modal-backdrop paw-garden-modal-backdrop" onMouseDown={event=>{if(event.currentTarget===event.target)setGuideOpen(false)}}><section className="paw-modal paw-garden-guide-modal" role="dialog" aria-modal="true" aria-label="Garden flower guide">
            <div className="paw-modal-top"><div><div className="eyebrow">MY LITTLE FLOWER BOOK</div><h2>Garden discoveries</h2></div><button className="paw-modal-close" type="button" aria-label="Close flower book" onClick={()=>setGuideOpen(false)}><X size={18}/></button></div>
            <div className="paw-garden-guide-tabs"><button type="button" className={guideTab==='collection'?'active':''} onClick={()=>setGuideTab('collection')}><BookOpen size={15}/> My collection ({foundCount}/5)</button><button type="button" className={guideTab==='odds'?'active':''} onClick={()=>setGuideTab('odds')}><Sparkles size={15}/> Odds & rewards</button></div>
            <div className="paw-garden-discovery-grid">{GARDEN_FLOWER_CATALOG.map(flower=>{
                const found=!!discoveries[flower.rarity]?.count;
                return <article key={flower.rarity} className={`paw-garden-discovery ${!found&&guideTab==='collection'?'undiscovered':''}`}>
                    <div className="paw-garden-discovery-art">{guideTab==='odds'||found?<GardenIcon kind="flower" rarity={flower.rarity} stage={0}/>:<><span className="paw-garden-mystery-flower">?</span><LockKeyhole size={18}/></>}</div>
                    <div className="paw-garden-discovery-info"><h3>{guideTab==='collection'&&!found?'Undiscovered bloom':flower.name}</h3><span className={`paw-garden-rarity rarity-${flower.rarity.toLowerCase()}`}>{flower.rarity}</span>
                        {guideTab==='odds'?<><p>{flower.chance}% chance per seed</p><strong><Coins size={15}/>{flower.min}–{flower.max} coins</strong></>:found?<><p><Check size={14}/> Found {discoveries[flower.rarity].count} time{discoveries[flower.rarity].count===1?'':'s'}</p><strong><Coins size={15}/> Best: {discoveries[flower.rarity].best_reward}</strong></>:<p>Keep planting to discover it!</p>}
                    </div>
                </article>;
            })}</div>
            <p className="paw-garden-guide-note">Each seed costs 40 Paw Coins and takes five minutes to grow. Watering cans cost 10 coins and shorten growth by one minute. Rarity and payout are chosen by the server, then revealed only when you harvest.</p>
        </section></div>}

        {reveal&&<div className="paw-modal-backdrop paw-garden-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setReveal(null)}}><section className={`paw-modal paw-garden-reveal rarity-${reveal.rarity.toLowerCase()}`} role="dialog" aria-modal="true" aria-label="Your harvested flower">
            <div className="paw-garden-reveal-stars" aria-hidden="true">✦ · ✧ · ✦</div><div className="eyebrow">PLOT {reveal.plotIndex+1} · FLOWER REVEAL</div>
            <div className="paw-garden-reveal-art"><GardenIcon kind="flower" rarity={reveal.rarity} variant={reveal.variant} stage={0}/></div>
            <span className={`paw-garden-rarity rarity-${reveal.rarity.toLowerCase()}`}>{reveal.rarity} harvest</span>
            <h2>{reveal.name}</h2>
            {reveal.newlyDiscovered&&<div className="paw-garden-first-find"><BookOpen size={16}/> New discovery added to your Flower Book!</div>}
            <div className="paw-garden-reveal-reward"><Coins size={24}/><strong>+{reveal.reward.toLocaleString()} Paw Coins</strong><small>+15 XP</small></div>
            <button type="button" className="paw-garden-reveal-close" onClick={()=>setReveal(null)}>Lovely! <Check size={16}/></button>
            <button type="button" className="paw-garden-view-book" onClick={()=>{setReveal(null);openGuide('collection')}}>View Flower Book</button>
        </section></div>}
    </section>;
}
