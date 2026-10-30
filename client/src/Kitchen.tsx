import {useCallback, useEffect, useRef, useState} from 'react';
import {BookOpen, Check, ChefHat, Clock3, CookingPot, FlaskConical, Heart, LockKeyhole, PackageOpen, Plus, Minus, Search, ShoppingBasket, Sparkles, Star, UtensilsCrossed, X} from 'lucide-react';
import SectionHeading from './SectionHeading';
import {kitchenMarkerPhase,kitchenMarkerScore} from './KitchenTiming';
import {randomOrder} from './KitchenSequence';
import {rhythmKeyDirection, rhythmSwipeDirection} from './KitchenGesture';
import {FoodArt, KitchenToolArt, KitchenPrepArt, KitchenEffectArt} from './KitchenArt';
export {FoodArt, FOOD_ART_IDS} from './KitchenArt';

type Recipe = {
    name: string;
    ingredients: Record<string,number>;
    steps: string[];
    hunger: number;
    happiness: number;
    energy: number;
    xp: number;
    hint: string;
    tier: 'starter' | 'discovery';
    ingredientCount: number;
    discovered: boolean;
};
type RecipeRecord = {cooked:number;best:number};
type KitchenState = {
    ingredients: Record<string,number>;
    meals: Record<string,number>;
    active_recipe: string | null;
    recipe_step: number;
    cooking_started_at: string | null;
    discovered_recipes: string[];
    recipe_records: Record<string,RecipeRecord>;
    step_scores: number[];
};
type KitchenResult = {recipeId:string;name:string;score:number;rating:string;firstTime:boolean};
type Game = 'chop' | 'flip' | 'bake' | 'decorate' | 'boil' | 'pour' | 'plate' | 'rhythm' | 'wash';
const stepNames: Record<string,string> = {wash:'Rinse',mix:'Rhythm Mix',chill:'Perfect Pour',cook:'Pancake Flip',plate:'Plate Puzzle',chop:'Precision Chopping',simmer:'Boiling Point',serve:'Plate Puzzle',bake:'Perfect Baking',decorate:'Cake Decorating'};
const directions = ['←','↑','→','↓'];
type SequenceOrders = {decorate: number[];plate: number[];rhythm: number[]};
const gameAssets: Record<Game,{tool:string;prep:string;effect:string;instruction:string}> = {
    chop: {tool:'cutting_board',prep:'carrot_sliced',effect:'twinkle',instruction:'Tap CHOP as the marker enters the pink target. Land three cuts.'},
    flip: {tool:'skillet',prep:'pancake_golden',effect:'twinkle',instruction:'Time your flip when the marker is in the golden zone.'},
    bake: {tool:'oven',prep:'oven_baked',effect:'steam',instruction:'Keep the oven near 180°C until the pastry finishes baking.'},
    decorate: {tool:'frosting_bag',prep:'cake_frosted',effect:'frosting_drop',instruction:'Follow the frosting order shown below. It changes each round.'},
    boil: {tool:'stove_pot',prep:'soup_simmer',effect:'bubbles',instruction:'Take the food off the heat at the ideal doneness.'},
    pour: {tool:'measuring_cup',prep:'smoothie_poured',effect:'twinkle',instruction:'Hold POUR, then release near the 75% fill line.'},
    plate: {tool:'serving_plate',prep:'plated_meal',effect:'twinkle',instruction:'Follow the plating order shown below. It changes each round.'},
    rhythm: {tool:'whisk',prep:'batter_bowl',effect:'flour_dust',instruction:'Follow the shuffled arrows: use your keyboard arrow keys or swipe anywhere on a touchscreen.'},
    wash: {tool:'mixing_bowl',prep:'berries_washed',effect:'bubbles',instruction:'Swipe across the wash basin or tap RINSE five times.'}
};
function gameForStep(step:string):Game {
    if (step === 'chop') return 'chop';
    if (step === 'cook') return 'flip';
    if (step === 'bake') return 'bake';
    if (step === 'decorate') return 'decorate';
    if (step === 'simmer') return 'boil';
    if (step === 'chill') return 'pour';
    if (step === 'plate' || step === 'serve') return 'plate';
    if (step === 'wash') return 'wash';
    return 'rhythm';
}
const titleCase = (value:string) => value.replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase());
const clamp = (value:number,min:number,max:number) => Math.max(min,Math.min(max,value));
const formatRating = (score:number) => score>=90?'Perfect!':score>=75?'Great!':score>=50?'Good':'Messy, but edible!';

export default function Kitchen({token,api,onPetChange,onToast}:{token:string;api:string;onPetChange:()=>Promise<void>;onToast:(message:string)=>void}) {
    const [kitchen,setKitchen] = useState<KitchenState|null>(null);
    const [recipes,setRecipes] = useState<Record<string,Recipe>>({});
    const [prices,setPrices] = useState<Record<string,number>>({});
    const [mealPrices,setMealPrices] = useState<Record<string,number>>({});
    const [busy,setBusy] = useState(false);
    const [shelf,setShelf] = useState<'recipes'|'experiment'|'ingredients'|'pantry'>('recipes');
    const [search,setSearch] = useState('');
    const [filter,setFilter] = useState<'all'|'discovered'|'mystery'>('all');
    const [quantities,setQuantities] = useState<Record<string,number>>({});
    const [selected,setSelected] = useState<string[]>([]);
    const [result,setResult] = useState<KitchenResult|null>(null);
    const [gameOpen,setGameOpen] = useState(false);
    const [clock,setClock] = useState(0);
    const [heat,setHeat] = useState(155);
    const [pourFill,setPourFill] = useState(0);
    const [pourHeld,setPourHeld] = useState(false);
    const [hits,setHits] = useState(0);
    const [mistakes,setMistakes] = useState(0);
    const [orders,setOrders] = useState<SequenceOrders>(() => ({
        decorate: randomOrder(3),
        plate: randomOrder(3),
        rhythm: randomOrder(4)
    }));
    const [feedback,setFeedback] = useState('');
    const gameStarted = useRef(Date.now());
    // The timing marker is animated at the browser's refresh rate, independently
    // of the 100 ms gameplay timer. Input is scored from the exact current phase.
    const timingStarted = useRef(0);
    const timingPointer = useRef<HTMLDivElement|null>(null);
    const hitCount = useRef(0);
    const mistakeCount = useRef(0);
    const totalTimingScore = useRef(0);
    const pending = useRef(false);
    const holdRef = useRef(false);
    const pourRef = useRef(0);
    const heatRef = useRef(155);
    const inZoneTicks = useRef(0);
    const gameTick = useRef(0);
    const gestureX = useRef<number|null>(null);
    const previousSwipe = useRef(0);
    const finishTimeout = useRef<ReturnType<typeof setTimeout>|null>(null);

    const load = useCallback(async() => {
        try {
            const response = await fetch(api+'/api/kitchen',{headers:{Authorization:'Bearer '+token}});
            const data = await response.json();
            if (!response.ok) throw Error(data.error || 'Unable to load Kitchen.');
            setKitchen(data.kitchen);
            setRecipes(data.recipes || {});
            setPrices(data.prices || {});
            setMealPrices(data.mealPrices || {});
        } catch (error) {onToast(error instanceof Error?error.message:'Kitchen unavailable.');}
    },[api,token,onToast]);
    useEffect(() => {void load();},[load]);
    useEffect(() => () => {if (finishTimeout.current) clearTimeout(finishTimeout.current);},[]);

    const active = kitchen?.active_recipe || null;
    const current = active ? recipes[active] : null;
    const step = current?.steps[kitchen?.recipe_step || 0] || 'mix';
    const game: Game = gameForStep(step);
    const assets = gameAssets[game];
    const timingPhase = (at:number) => {
        const duration = game === 'flip' ? 800 : 1050;
        const elapsed = Math.max(0, at - timingStarted.current);
        return kitchenMarkerPhase(elapsed, duration);
    };
    const progressScore = (target:number) => {
        // Read the same time source used to draw the marker rather than a stale
        // React render (which previously lagged a tap by up to 100 ms).
        const phase = timingPhase(performance.now());
        return kitchenMarkerScore(phase, target);
    };
    const pantryCount = Object.values(kitchen?.meals||{}).reduce((sum,value)=>sum+(Number(value)||0),0);

    function resetGame() {
        gameStarted.current = Date.now();
        timingStarted.current = performance.now();
        gameTick.current = 0;
        hitCount.current = 0;
        mistakeCount.current = 0;
        totalTimingScore.current = 0;
        inZoneTicks.current = 0;
        holdRef.current = false;
        pourRef.current = 0;
        heatRef.current = 155;
        setClock(0);
        setHeat(155);
        setPourFill(0);
        setPourHeld(false);
        setHits(0);
        setMistakes(0);
        setFeedback('');
        // Generate a fresh order whenever cooking starts or advances a step.
        // Prevent identical consecutive patterns so repeated recipes don't feel scripted.
        setOrders(previous => ({
            decorate: randomOrder(3,previous.decorate),
            plate: randomOrder(3,previous.plate),
            rhythm: randomOrder(4,previous.rhythm)
        }));
        pending.current = false;
    }

    async function act(action:string,item:string,quantity=1,extras:Record<string,unknown>={}) {
        if (busy) return;
        setBusy(true);
        try {
            const response = await fetch(api+'/api/kitchen',{
                method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
                body:JSON.stringify({action,item,quantity,...extras})
            });
            const data = await response.json();
            if (!response.ok) throw Error(data.error||'Kitchen action failed.');
            setKitchen(data.kitchen);
            if (data.recipes) setRecipes(data.recipes);
            if (data.result) setResult(data.result);
            onToast(data.message);
            if (action==='experiment' && data.result) {setSelected([]);setShelf('recipes');}
            if (action==='start') {resetGame();setGameOpen(true);}
            if (action==='step') {
                if (data.kitchen.active_recipe) resetGame();
                else setGameOpen(false);
            }
            await onPetChange();
        } catch (error) {
            pending.current = false;
            setFeedback(error instanceof Error?error.message:'Please try again.');
            onToast(error instanceof Error?error.message:'Kitchen action failed.');
        } finally {setBusy(false);}
    }

    function finishStep(score:number) {
        if (pending.current || busy || !active || !gameOpen) return;
        pending.current = true;
        const elapsed = Date.now()-gameStarted.current;
        const submit = () => {void act('step',step,1,{score:clamp(Math.round(score),0,100)});};
        // Give the server its minimum genuine play interval. Cosmetic scores never award coins.
        if (elapsed < 2350) {
            setFeedback('Finishing touches…');
            finishTimeout.current = setTimeout(submit,2350-elapsed);
        } else submit();
    }

    useEffect(() => {
        if (!active || !gameOpen || !['chop','flip','boil'].includes(game)) return;
        let frame = 0;
        const pointer = timingPointer.current;
        const track = pointer?.parentElement;
        let travel = track && pointer ? Math.max(0, track.clientWidth - pointer.offsetWidth) : 0;
        const observer = track && typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => {
                travel = pointer ? Math.max(0, track.clientWidth - pointer.offsetWidth) : 0;
            }) : null;
        if (track) observer?.observe(track);
        const animate = (now:number) => {
            // Transform is composited on the GPU; no layout or React re-render
            // is needed for each animation frame, even on slower phones.
            if (pointer && !pending.current && !busy) {
                pointer.style.transform = `translate3d(${timingPhase(now) / 100 * travel}px, 0, 0)`;
            }
            if (!pending.current && !busy) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => {
            cancelAnimationFrame(frame);
            observer?.disconnect();
        };
    },[active,gameOpen,game,busy,kitchen?.recipe_step]);

    useEffect(() => {
        if (!active || !gameOpen || busy || pending.current) return;
        const timer = window.setInterval(() => {
            const elapsed = Date.now()-gameStarted.current;
            if (game==='bake') setClock(elapsed);
            if (game==='flip' && elapsed>=1800) setClock(previous=>previous<1800?elapsed:previous);
            gameTick.current++;
            if (game==='pour' && holdRef.current) {
                pourRef.current = clamp(pourRef.current+2.3,0,100);
                setPourFill(pourRef.current);
            }
            if (game==='bake' && elapsed>=2200) {
                if (heatRef.current>=165 && heatRef.current<=195) inZoneTicks.current++;
                if (elapsed>=7200) {
                    const baked = Math.round(45+55*inZoneTicks.current/Math.max(1,gameTick.current-22));
                    finishStep(baked);
                }
            }
        },100);
        return () => clearInterval(timer);
    },[active,gameOpen,busy,game,kitchen?.recipe_step]);

    function hit() {
        if (busy || pending.current) return;
        const score = progressScore(50);
        hitCount.current++;
        totalTimingScore.current += score;
        setHits(hitCount.current);
        setFeedback(score>=88?'Perfect timing!':score>=65?'Nice!':'A little off, keep going!');
        if (hitCount.current>=3) finishStep(clamp(totalTimingScore.current/3-mistakeCount.current*3,40,100));
    }
    function tapSequence(index:number,expected:number[],label:string) {
        if (busy || pending.current) return;
        if (index!==expected[hitCount.current]) {
            mistakeCount.current++;
            setMistakes(mistakeCount.current);
            setFeedback('Not quite — check the order above!');
            return;
        }
        hitCount.current++;
        setHits(hitCount.current);
        setFeedback(`${label} ${hitCount.current}/${expected.length} ✓`);
        if (hitCount.current>=expected.length) finishStep(clamp(100-mistakeCount.current*12,50,100));
    }
    // Listen at window level so a swipe on the backdrop, not just on the cooking
    // modal, counts. These listeners exist only while Rhythm Mixing is active.
    useEffect(() => {
        if (!active || !gameOpen || game !== 'rhythm' || busy) return;
        let touchStart: {identifier:number;x:number;y:number}|null = null;

        const onKeyDown = (event:KeyboardEvent) => {
            const direction = rhythmKeyDirection(event.key);
            if (direction === null) return;
            event.preventDefault(); // Arrow keys should not scroll the game underneath.
            if (event.repeat || pending.current) return;
            tapSequence(direction, orders.rhythm, 'Whisk');
        };
        const onTouchStart = (event:TouchEvent) => {
            if (event.touches.length !== 1 || pending.current) {
                touchStart = null;
                return;
            }
            const touch = event.touches[0];
            touchStart = {identifier:touch.identifier,x:touch.clientX,y:touch.clientY};
        };
        const onTouchMove = (event:TouchEvent) => {
            if (!touchStart || pending.current) return;
            const touch = Array.from(event.touches).find(item => item.identifier === touchStart?.identifier);
            if (!touch) return;
            // Stop browser scrolling only when the gesture is becoming a swipe.
            if (Math.hypot(touch.clientX-touchStart.x,touch.clientY-touchStart.y)>12 && event.cancelable) {
                event.preventDefault();
            }
        };
        const onTouchEnd = (event:TouchEvent) => {
            if (!touchStart || pending.current) {touchStart=null;return;}
            const touch = Array.from(event.changedTouches).find(item => item.identifier === touchStart?.identifier);
            if (!touch) return;
            const direction = rhythmSwipeDirection(touch.clientX-touchStart.x,touch.clientY-touchStart.y);
            touchStart = null;
            if (direction !== null) {
                if (event.cancelable) event.preventDefault();
                tapSequence(direction,orders.rhythm,'Whisk');
            }
        };
        const onTouchCancel = () => {touchStart=null;};

        window.addEventListener('keydown',onKeyDown,true);
        window.addEventListener('touchstart',onTouchStart,{passive:true});
        window.addEventListener('touchmove',onTouchMove,{passive:false});
        window.addEventListener('touchend',onTouchEnd,{passive:false});
        window.addEventListener('touchcancel',onTouchCancel);
        return () => {
            window.removeEventListener('keydown',onKeyDown,true);
            window.removeEventListener('touchstart',onTouchStart);
            window.removeEventListener('touchmove',onTouchMove);
            window.removeEventListener('touchend',onTouchEnd);
            window.removeEventListener('touchcancel',onTouchCancel);
        };
    },[active,gameOpen,game,busy,orders.rhythm,kitchen?.recipe_step]);

    function releasePour() {
        if (!holdRef.current || busy || pending.current) return;
        holdRef.current = false;
        setPourHeld(false);
        const distance = Math.abs(pourRef.current-75);
        if (pourRef.current<45) {
            setFeedback('A little more! Hold POUR longer and try again.');
            pourRef.current = 0;
            setPourFill(0);
            return;
        }
        setFeedback(distance<=9?'Perfect pour!':'Nice try!');
        finishStep(clamp(100-distance*1.3,45,100));
    }
    function changeHeat(delta:number) {
        heatRef.current = clamp(heatRef.current+delta,110,240);
        setHeat(heatRef.current);
    }
    function wash() {
        if (busy || pending.current || Date.now()-previousSwipe.current<180) return;
        previousSwipe.current = Date.now();
        hitCount.current++;
        setHits(hitCount.current);
        if (hitCount.current>=5) finishStep(100);
    }

    return <section className="panel paw-kitchen kitchen-revamp">
        <div className="eyebrow">PAWPAL COOKING CLUB</div>
        <SectionHeading title="Kitchen" Icon={CookingPot}/>
        {active&&current&&<div className="k3-active-bar"><div className="k3-active-art"><FoodArt id={active}/></div><div><b>{current.name} is in progress</b><small>Step {(kitchen?.recipe_step||0)+1} of {current.steps.length} · {stepNames[step]}</small></div><button className="primary" type="button" onClick={()=>{resetGame();setGameOpen(true)}}>Continue cooking</button></div>}
        <div className="kitchen-shelf-tabs k3-tabs" role="tablist" aria-label="Kitchen sections">
            {([['recipes','Recipe Book',BookOpen],['experiment','Experiment',FlaskConical],['ingredients','Market',ShoppingBasket],['pantry','Pantry',PackageOpen]] as const).map(([id,label,Icon])=><button type="button" role="tab" key={id} aria-selected={shelf===id} className={shelf===id?'active':''} onClick={()=>setShelf(id)}><Icon size={18}/><span className="k3-tab-label">{label}</span>{id==='pantry'&&pantryCount>0&&<span className="k3-tab-count">{pantryCount}</span>}</button>)}
        </div>

        {shelf==='recipes'&&<>
            <div className="k3-section-heading"><div><h3>Recipe Book</h3></div></div>
            <div className="k3-filters"><div className="k3-search"><Search size={17}/><input aria-label="Search recipes" placeholder="Search recipes" value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="k3-filter-buttons">{([['all','All'],['discovered','Known'],['mystery','Mystery']] as const).map(([id,label])=><button type="button" className={filter===id?'active':''} key={id} onClick={()=>setFilter(id)}>{label}</button>)}</div></div>
            <div className="k3-recipe-grid">
                {Object.entries(recipes).filter(([,r]) => (filter==='all'||(filter==='discovered'?r.discovered:!r.discovered)) && (r.discovered?(r.name+' '+r.hint).toLowerCase().includes(search.toLowerCase()):('mystery '+r.hint).toLowerCase().includes(search.toLowerCase()))).map(([id,recipe])=><article className={'k3-recipe '+(!recipe.discovered?'locked':'')} key={id}>
                    <div className="k3-recipe-art">{recipe.discovered?<FoodArt id={id}/>:<><div className="k3-mystery-silhouette"><FoodArt id={id}/></div><LockKeyhole className="k3-recipe-lock" size={21}/></>}</div>
                    <div className="k3-recipe-details"><div className="k3-title-row"><b>{recipe.discovered?recipe.name:'??? Mystery Recipe'}</b>{recipe.tier==='starter'&&<small className="k3-starter-chip">Starter</small>}</div>
                        {recipe.discovered?<><div className="k3-ingredients-list">{Object.entries(recipe.ingredients).map(([ingredient,needed])=><span key={ingredient} className={(kitchen?.ingredients[ingredient]||0)>=needed?'available':'missing'} title={`${titleCase(ingredient)}: ${kitchen?.ingredients[ingredient]||0}/${needed}`}><span><FoodArt id={ingredient}/></span>{titleCase(ingredient)} {kitchen?.ingredients[ingredient]||0}/{needed}</span>)}</div><div className="k3-benefits">{recipe.hunger>0&&<span><Heart size={12}/> +{recipe.hunger} Fullness</span>}{recipe.happiness>0&&<span>+{recipe.happiness} Happy</span>}{recipe.energy>0&&<span>+{recipe.energy} Energy</span>}</div></>:<div className="k3-clue"><Sparkles size={14}/><span>{recipe.hint}</span><small>{recipe.ingredientCount} ingredient types</small></div>}
                        {recipe.discovered&&<small className="k3-record">Cooked {kitchen?.recipe_records?.[id]?.cooked||0} times{(kitchen?.recipe_records?.[id]?.cooked||0)>0&&` · Best ${kitchen?.recipe_records?.[id]?.best||0}/100`}</small>}
                        <div className="k3-recipe-buttons">{recipe.discovered?<><button type="button" className="primary" disabled={busy||!!active||!kitchen||Object.entries(recipe.ingredients).some(([ing,n])=>(kitchen.ingredients[ing]||0)<n)} onClick={()=>void act('start',id)}><ChefHat size={15}/> Cook</button><button type="button" className="secondary" disabled={busy} onClick={()=>void act('buy_meal',id)}>Buy · {(mealPrices[id]||0).toLocaleString()}</button></>:<button className="secondary" type="button" onClick={()=>setShelf('experiment')}><FlaskConical size={15}/> Try to discover</button>}</div>
                    </div>
                </article>)}
            </div>
        </>}

        {shelf==='experiment'&&<>
            <div className="k3-section-heading"><div><h3>Experiment Station</h3></div></div>
            <div className="k3-experiment-layout"><div className="k3-experiment-bench">
                <div className="k3-bench-art"><KitchenToolArt id="mixing_bowl"/><KitchenEffectArt id="twinkle"/></div>
                <h4>Your mixing bowl</h4><div className="k3-selected">{selected.length?selected.map(id=><button type="button" key={id} title={`Remove ${id}`} onClick={()=>setSelected(p=>p.filter(i=>i!==id))}><FoodArt id={id}/><span>{titleCase(id)}</span><X size={13}/></button>):<p>Choose ingredients from below to begin.</p>}</div>
                <p className="k3-experiment-disclaimer">A new match uses one of each selected ingredient. An unsuccessful mix uses only one ingredient. A known recipe uses none.</p>
                <button type="button" className="primary k3-experiment-action" disabled={busy||!!active||selected.length<2} onClick={()=>void act('experiment','',1,{ingredients:selected})}><FlaskConical size={17}/> Experiment with {selected.length} ingredients</button>
                <div className="k3-experiment-small-actions"><button type="button" className="secondary" onClick={()=>setSelected([])}>Clear bowl</button><button type="button" className="secondary" onClick={()=>setShelf('ingredients')}>Get ingredients</button></div>
            </div><div className="k3-experiment-pantry"><h4>Pick your ingredients</h4><div className="k3-ingredient-choices">{Object.keys(prices).map(id=><button type="button" key={id} aria-pressed={selected.includes(id)} className={selected.includes(id)?'selected':''} disabled={busy||((kitchen?.ingredients[id]||0)<1&&!selected.includes(id))||(!selected.includes(id)&&selected.length>=4)} onClick={()=>setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])}><span className="k3-choice-art"><FoodArt id={id}/></span><b>{titleCase(id)}</b><small>Owned {kitchen?.ingredients[id]||0}</small>{selected.includes(id)&&<Check className="k3-choice-check" size={15}/>}</button>)}</div></div></div>
            <h4 className="k3-hint-title"><BookOpen size={17}/> Mystery recipe clues</h4><div className="k3-hints">{Object.entries(recipes).filter(([,r])=>!r.discovered).map(([id,r])=><div key={id}><LockKeyhole size={15}/><p>{r.hint}</p><small>{r.ingredientCount} ingredient types</small></div>)}</div>
        </>}

        {shelf==='ingredients'&&<><div className="k3-section-heading"><div><h3>Ingredient Market</h3></div></div><div className="k3-market-grid">{Object.entries(prices).map(([id,price])=><article className="k3-market-card" key={id}><div className="k3-market-art"><FoodArt id={id}/></div><div className="k3-market-copy"><b>{titleCase(id)}</b><small>Owned: {kitchen?.ingredients[id]||0}</small><span>{price} coins each</span></div><div className="k3-market-buy"><div className="k3-qty"><button type="button" aria-label={`Decrease ${id}`} onClick={()=>setQuantities(q=>({...q,[id]:Math.max(1,(q[id]||1)-1)}))}><Minus size={13}/></button><span>{quantities[id]||1}</span><button type="button" aria-label={`Increase ${id}`} onClick={()=>setQuantities(q=>({...q,[id]:Math.min(20,(q[id]||1)+1)}))}><Plus size={13}/></button></div><button type="button" className="primary" disabled={busy} onClick={()=>void act('buy',id,quantities[id]||1)}>Buy · {price*(quantities[id]||1)}</button></div></article>)}</div></>}

        {shelf==='pantry'&&<><div className="k3-section-heading"><div><h3>Ready-to-serve meals</h3></div></div><div className="k3-pantry-grid">{Object.entries(kitchen?.meals||{}).filter(([,quantity])=>quantity>0).map(([id,quantity])=><article className="k3-pantry-card" key={id}><div className="k3-pantry-art"><FoodArt id={id}/></div><div><b>{recipes[id]?.discovered?recipes[id].name:titleCase(id)}</b><small>{quantity} ready · +{recipes[id]?.xp||0} XP when served</small></div><button className="primary" type="button" disabled={busy} onClick={()=>void act('serve',id)}><UtensilsCrossed size={15}/> Serve</button></article>)}</div>{pantryCount===0&&<div className="k3-empty"><PackageOpen size={27}/><h4>Your pantry is empty</h4><p>Cook a meal or buy a ready-made one from your Recipe Book.</p><button type="button" className="secondary" onClick={()=>setShelf('recipes')}>Browse recipes</button></div>}</>}

        {active&&current&&gameOpen&&<div className="kitchen-game-overlay" onMouseDown={event=>{if(game!=='rhythm'&&event.target===event.currentTarget)setGameOpen(false)}}><div className="kitchen-game-modal k3-game-modal" role="dialog" aria-modal="true" aria-label={`Cooking ${current.name}`}><button className="kitchen-game-close" aria-label="Close cooking game" type="button" onClick={()=>setGameOpen(false)}><X size={22}/></button>
            <div className="kitchen-game-head"><div className="kitchen-game-art"><FoodArt id={active}/></div><div><small>NOW COOKING</small><h3>{current.name}</h3><p>Step {(kitchen?.recipe_step||0)+1} of {current.steps.length} · {stepNames[step]}</p></div></div>
            <div className="kitchen-game-steps">{current.steps.map((name,i)=><span key={i} title={stepNames[name]||name} className={i<(kitchen?.recipe_step||0)?'done':i===(kitchen?.recipe_step||0)?'current':''}>{i+1}</span>)}</div>
            <p className="kitchen-game-instructions">{assets.instruction}</p>
            <div className={`k3-game-stage k3-game-${game}`}>
                <div className="k3-game-prop"><KitchenToolArt id={assets.tool}/>{game==='chop'&&<span className="k3-chopping-knife"><KitchenToolArt id="knife"/></span>}</div>
                <div className="k3-game-food"><KitchenPrepArt id={game==='flip'&&clock<1800?'pancake_raw':game==='bake'&&clock<3500?'oven_raw':assets.prep}/></div>
                <div className="k3-game-effect"><KitchenEffectArt id={assets.effect}/></div>
                {['chop','flip','boil'].includes(game)&&<div className="k3-timing"><div className="k3-timing-zone"/><div className="k3-timing-pointer" ref={timingPointer}/></div>}
                {game==='bake'&&<div className="k3-oven-status"><span>{heat}°C</span><small>Ideal: 165–195°C</small><div className="k3-oven-track"><div style={{width:`${clamp((heat-110)/130*100,0,100)}%`}}/></div><small>{Math.max(0,Math.ceil((7200-clock)/1000))}s remaining</small></div>}
                {game==='pour'&&<div className="k3-pour-track"><div className="k3-pour-target"/><div style={{height:`${pourFill}%`}}/></div>}
                {(game==='decorate'||game==='plate')&&<div className="k3-stage-sequence"><span>Next: {hits>=3?'All set!':(game==='decorate'?orders.decorate:orders.plate)[hits]+1}</span><span>{hits}/3 placed</span></div>}
            </div>
            <div className="k3-game-actions">
                {game==='chop'&&<><button type="button" className="primary" disabled={busy||pending.current} onClick={hit}>Chop! <span>{hits}/3</span></button></>}
                {game==='flip'&&<button type="button" className="primary" disabled={busy||pending.current} onClick={()=>finishStep(progressScore(50))}>Flip pancake!</button>}
                {game==='boil'&&<button type="button" className="primary" disabled={busy||pending.current} onClick={()=>finishStep(progressScore(50))}>Remove from heat!</button>}
                {game==='bake'&&<div className="k3-bake-controls"><button type="button" aria-label="Decrease oven temperature" onClick={()=>changeHeat(-10)}><Minus size={17}/> Cooler</button><button type="button" aria-label="Increase oven temperature" onClick={()=>changeHeat(10)}><Plus size={17}/> Hotter</button></div>}
                {game==='pour'&&<button type="button" className={'primary k3-pour-button '+(pourHeld?'holding':'')} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);holdRef.current=true;setPourHeld(true);}} onPointerUp={releasePour} onPointerCancel={releasePour} onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();holdRef.current=true;setPourHeld(true);}}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();releasePour();}}} disabled={busy||pending.current}>{pourHeld?'Release at the line':'Hold to pour'} · {Math.round(pourFill)}%</button>}
                {game==='decorate'&&<div className="k3-order-controls"><p>Frosting order: {orders.decorate.map(number=>number+1).join(' → ')}</p><div>{['Rose','Star','Heart'].map((label,i)=><button type="button" key={i} disabled={busy||pending.current} onClick={()=>tapSequence(i,orders.decorate,'Frosting')}><KitchenEffectArt id={i===1?'twinkle':i===2?'frosting_drop':'flour_dust'}/><span>{i+1}. {label}</span></button>)}</div></div>}
                {game==='plate'&&<div className="k3-order-controls"><p>Plating order: {orders.plate.map(number=>number+1).join(' → ')}</p><div>{['Main','Garnish','Side'].map((label,i)=><button type="button" key={i} disabled={busy||pending.current} onClick={()=>tapSequence(i,orders.plate,'Plating')}><KitchenPrepArt id={i===0?'pancake_golden':i===1?'carrot_sliced':'tomato_sliced'}/><span>{i+1}. {label}</span></button>)}</div></div>}
                {game==='rhythm'&&<div className="k3-rhythm" aria-label="Rhythm mixing arrow sequence">
                    <div className="k3-rhythm-sequence" aria-live="off">{orders.rhythm.map((index,i)=><span key={i} className={'k3-rhythm-arrow '+(i<hits?'completed':i===hits?'next':'')} aria-label={`${i+1}: ${['left','up','right','down'][index]}`}>{directions[index]}</span>)}</div>
                    <p className="k3-rhythm-desktop-hint">Use your keyboard arrow keys · {hits}/{orders.rhythm.length}</p>
                    <p className="k3-rhythm-touch-hint">Swipe anywhere on the screen · {hits}/{orders.rhythm.length}</p>
                </div>}
                {game==='wash'&&<div className="k3-wash"><div className="k3-wash-pad" role="button" tabIndex={0} aria-label="Swipe to wash ingredients" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);gestureX.current=e.clientX;}} onPointerMove={e=>{if(gestureX.current!==null&&Math.abs(e.clientX-gestureX.current)>35){wash();gestureX.current=e.clientX;}}} onPointerUp={()=>{gestureX.current=null}} onPointerCancel={()=>{gestureX.current=null}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();wash();}}}><KitchenEffectArt id="bubbles"/><span>Swipe to rinse!</span></div><button type="button" className="secondary" disabled={busy||pending.current} onClick={wash}>Rinse · {hits}/5</button></div>}
            </div>
            <div className="k3-game-bottom"><span className="k3-feedback" aria-live="polite">{feedback|| (game==='bake'?'Adjust the oven using the buttons.':'Take your time and enjoy cooking!')}</span>{mistakes>0&&<span className="k3-mistakes">{mistakes} retries</span>}</div>
        </div></div>}
        {result&&<div className="kitchen-game-overlay"><div className="k3-result" role="dialog" aria-modal="true" aria-label="Kitchen result"><button type="button" className="kitchen-game-close" aria-label="Close result" onClick={()=>setResult(null)}><X size={21}/></button><div className="k3-result-art"><FoodArt id={result.recipeId}/><div className="k3-result-sparkle"><KitchenEffectArt id="twinkle"/></div></div><small><Sparkles size={15}/> {result.rating==='Discovery'?'NEW RECIPE DISCOVERED':'COOKING COMPLETE'}</small><h2>{result.name}</h2>{result.rating==='Discovery'?<p>Added permanently to your Recipe Book. You can cook it whenever you have the ingredients!</p>:<><strong className="k3-rating">{formatRating(result.score)}</strong><span className="k3-rating-score">{result.score}/100 cooking score</span><p>{result.firstTime?'First time cooked! Recorded in your recipe journal.':'Your personal best is saved in your Recipe Book.'} All meals restore the same pet stats regardless of quality.</p></>}<button type="button" className="primary" onClick={()=>{setResult(null);setShelf(result.rating==='Discovery'?'recipes':'pantry');}}>Continue</button></div></div>}
    </section>;
}
