import {useCallback,useEffect,useState} from 'react';
import {Coins, Sparkles, Clock3, Check} from 'lucide-react';
type Mission={id:string;kind:'daily'|'weekly'|'milestone';title:string;target:number;progress:number;coins:number;xp:number;claimed:boolean};
type Payload={missions:Mission[];today:string;week:string;totals:{daily:number;weekly:number;milestone:number}};
export default function MissionCenter({token,api,onPetChange,onToast}:{token:string;api:string;onPetChange:()=>Promise<unknown>|void;onToast:(message:string)=>void}){
    const [now,setNow]=useState(()=>Date.now());
    useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[]);
    const [data,setData]=useState<Payload|null>(null);const [filter,setFilter]=useState<'daily'|'weekly'|'milestone'>('daily');const [busy,setBusy]=useState('');
    const load=useCallback(async()=>{try{const r=await fetch(`${api}/api/missions`,{headers:{Authorization:`Bearer ${token}`}});const j=await r.json();if(!r.ok)throw Error(j.error||'Unable to load missions');setData(j)}catch(e){onToast(e instanceof Error?e.message:'Could not load missions')}},[api,token]);
    useEffect(()=>{void load()},[load]);
    async function claim(id:string){setBusy(id);try{const r=await fetch(`${api}/api/missions/${id}/claim`,{method:'POST',headers:{Authorization:`Bearer ${token}`}});const j=await r.json();if(!r.ok)throw Error(j.error||'Unable to claim');onToast(j.message);await Promise.all([load(),Promise.resolve(onPetChange())]);}catch(e){onToast(e instanceof Error?e.message:'Could not claim reward')}finally{setBusy('')}}
    // Philippine time is UTC+08:00 year-round; calculate the next reset in UTC.
    const phtNow=new Date(now+8*3600000);
    const dayStart=Date.UTC(phtNow.getUTCFullYear(),phtNow.getUTCMonth(),phtNow.getUTCDate());
    const nextDay=dayStart+86400000-8*3600000;
    const daysToMonday=(8-phtNow.getUTCDay())%7||7;
    const nextWeek=dayStart+daysToMonday*86400000-8*3600000;
    const remaining=(until:number)=>{const seconds=Math.max(0,Math.ceil((until-now)/1000));const days=Math.floor(seconds/86400);const hours=Math.floor(seconds%86400/3600);const minutes=Math.floor(seconds%3600/60);const secs=seconds%60;return `${days?`${days}d `:''}${String(hours).padStart(2,'0')}h ${String(minutes).padStart(2,'0')}m ${String(secs).padStart(2,'0')}s`};
    const resetKey=`${dayStart}:${Math.floor((dayStart-(phtNow.getUTCDay()===0?6:phtNow.getUTCDay()-1)*86400000)/604800000)}`;
    useEffect(()=>{void load()},[resetKey,load]);
    const selected=(data?.missions.filter(m=>m.kind===filter)||[]).sort((a,b)=>{const rank=(m:Mission)=>m.claimed?2:m.progress>=m.target?0:1;return rank(a)-rank(b)});const completed=selected.filter(m=>m.claimed).length;
    return <section className="panel mission-center"><div className="eyebrow">YOUR PAWPAL JOURNEY</div><h2>Missions & stats</h2><p>Earn coins and EXP for caring, cooking, gardening and playing. Progress and rewards are saved on the server.</p><div className="mission-tabs">{([['daily','Daily · 4'],['weekly','Weekly · 5'],['milestone','Milestones · 120']] as const).map(([id,label])=><button key={id} className={filter===id?'active':''} onClick={()=>setFilter(id)}>{label}</button>)}</div><div className="mission-info"><strong>{filter==='daily'?'Daily quests':filter==='weekly'?'Weekly quests':'Permanent milestones'}</strong><span>{completed}/{selected.length} claimed</span></div><p className="mission-reset"><Clock3 size={16}/> {filter==='daily'?`Resets in ${remaining(nextDay)}`:filter==='weekly'?`Resets in ${remaining(nextWeek)}`:'Permanent progress — never resets'}</p>{!data?<p>Loading your missions…</p>:<div className="mission-grid">{selected.map(m=><article className={'mission-card '+(m.claimed?'claimed':'')} key={m.id}><div className="mission-top"><b>{m.title}</b><span>{m.progress}/{m.target}</span></div><div className="mission-track"><span style={{width:`${Math.min(100,m.progress/m.target*100)}%`}}/></div><div className="mission-footer"><small className="mission-rewards"><Coins size={15}/> {m.coins} coins <Sparkles size={15}/> {m.xp} EXP</small><button className={"mission-claim-button "+(m.claimed?"is-claimed":m.progress>=m.target?"is-ready":"is-pending")} disabled={!!busy||m.claimed||m.progress<m.target} onClick={()=>void claim(m.id)}>{m.claimed?'Claimed ✓':busy===m.id?'Claiming…':m.progress>=m.target?'Claim reward':'In progress'}</button></div></article>)}</div>}</section>
}
