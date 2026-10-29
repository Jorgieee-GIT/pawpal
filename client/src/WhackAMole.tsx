import {useEffect,useRef,useState} from 'react';
import {Gamepad2,X} from 'lucide-react';
import './WhackAMole.css';
import {MoleGameIcon} from './ArcadeArt';

type Critter='mouse'|'bomb'|'gold';
type Target={kind:Critter;id:number}|null;
const START_LIVES=3;
export default function WhackAMole({onQuit,onFinish}:{onQuit:()=>void;onFinish:(score:number)=>Promise<boolean>}){
 const [phase,setPhase]=useState<'ready'|'playing'|'over'>('ready');
 const [claiming,setClaiming]=useState(false),[rewardError,setRewardError]=useState(false);
 const claimRef=useRef(false);
 async function claimRound(replay:boolean){
     if(claimRef.current)return;
     claimRef.current=true;
     setClaiming(true);
     setRewardError(false);
     try{
         const rewarded=await onFinish(scoreRef.current);
         if(rewarded){
             if(replay)start();
             else onQuit();
         }else setRewardError(true);
     }catch{
         setRewardError(true);
     }finally{
         claimRef.current=false;
         setClaiming(false);
     }
 }
 const closeGame=()=>{if(phase==='over')void claimRound(false);else{stop();onQuit()}};
 const [score,setScore]=useState(0),[lives,setLives]=useState(START_LIVES),[round,setRound]=useState(1);
 const [holes,setHoles]=useState<Target[]>(Array(9).fill(null)),[hit,setHit]=useState(-1),[effect,setEffect]=useState<{index:number;label:string;id:number}|null>(null);
 const active=useRef(false),generation=useRef(0),sequence=useRef(0),scoreRef=useRef(0),livesRef=useRef(3),roundRef=useRef(1),targetRef=useRef<{index:number;id:number;kind:Critter}|null>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),hideTimer=useRef<ReturnType<typeof setTimeout>|null>(null),effectTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 function clearTimers(){[timer,hideTimer,effectTimer].forEach(t=>{if(t.current!==null)clearTimeout(t.current);t.current=null})}
 function stop(){active.current=false;generation.current++;clearTimers();targetRef.current=null}
 useEffect(()=>()=>stop(),[]);
 function end(){stop();setHoles(Array(9).fill(null));setPhase('over')}
 function loseLife(){livesRef.current=Math.max(0,livesRef.current-1);setLives(livesRef.current);if(livesRef.current===0)end()}
 function spawn(){
  if(!active.current)return;
  const token=generation.current;
  const next=++sequence.current;
  const index=Math.floor(Math.random()*9);
  const difficulty=Math.min(26,Math.floor(scoreRef.current/75));
  const kind:Critter=Math.random()<Math.min(.32,.12+difficulty*.007)?'bomb':Math.random()<.12?'gold':'mouse';
  const normalVisibility=Math.max(540,1550-difficulty*48);
  const visibility=kind==='gold'?Math.round(normalVisibility*0.5):normalVisibility;
  targetRef.current={index,id:next,kind};
  setHoles(Array.from({length:9},(_,i)=>i===index?{kind,id:next}:null));
  hideTimer.current=setTimeout(()=>{
   if(!active.current||generation.current!==token||targetRef.current?.id!==next)return;
   targetRef.current=null;setHoles(Array(9).fill(null));
   // Missing a mouse costs a life; bombs can safely be ignored.
   if(kind!=='bomb'){loseLife();if(!active.current)return}
   const delay=Math.max(140,460-difficulty*12);
   timer.current=setTimeout(spawn,delay);
  },visibility);
 }
 function start(){
  stop();scoreRef.current=0;livesRef.current=3;roundRef.current=1;
  setScore(0);setLives(3);setRound(1);setHoles(Array(9).fill(null));setEffect(null);setHit(-1);setPhase('playing');
  active.current=true;timer.current=setTimeout(spawn,550);
 }
 function tap(index:number){
  if(!active.current)return;
  const current=targetRef.current;
  if(!current||current.index!==index)return;
  targetRef.current=null;
  if(hideTimer.current!==null)clearTimeout(hideTimer.current);
  setHoles(Array(9).fill(null));setHit(index);
  const bomb=current.kind==='bomb';
  const points=current.kind==='gold'?30:10;
  if(!bomb){scoreRef.current+=points;setScore(scoreRef.current);const nextRound=1+Math.floor(scoreRef.current/100);if(nextRound!==roundRef.current){roundRef.current=nextRound;setRound(nextRound)}}
  setEffect({index,label:bomb?'−1 life':`+${points}`,id:current.id});
  if(effectTimer.current!==null)clearTimeout(effectTimer.current);
  effectTimer.current=setTimeout(()=>{setEffect(null);setHit(-1)},450);
  if(bomb){loseLife();if(!active.current)return}
  const difficulty=Math.min(26,Math.floor(scoreRef.current/75));
  timer.current=setTimeout(spawn,Math.max(130,470-difficulty*13));
 }
 return <div className="overlay"><div className="game-modal arcade-modal mole-modal"><header className="paw-arcade-modal-header"><h2><Gamepad2 size={23} aria-hidden="true"/><span>Whack-a-Mole</span></h2><button className="paw-arcade-exit" type="button" aria-label="Close game" title="Close game" disabled={claiming} onClick={closeGame}><X size={20}/></button></header>
 {phase==='ready'?<div className="game-center paw-mole-start"><div className="huge mole-intro-card-art"><MoleGameIcon/></div><p>Tap mice for <b>+10 points</b> and golden mice for <b>+30</b>. Avoid bombs! You have <b>3 lives</b>, and the mice get faster as you score.</p><button className="primary" onClick={start}>Start game</button></div>:
 phase==='over'?<div className="game-center mole-intro"><h2>Game over!</h2><h3>{score} points · Round {round}</h3><p>Those mice are quick! Want another try?</p>{rewardError&&<p className="paw-arcade-reward-error" role="alert">Reward wasn't saved. Try again to claim it.</p>}<div className="actions centered paw-game-over-actions"><button className="primary" disabled={claiming} onClick={()=>void claimRound(true)}>{claiming?'Collecting reward...':'Retry'}</button><button className="secondary" disabled={claiming} onClick={()=>void claimRound(false)}>Collect coins & quit</button></div></div>:
 <><div className="mole-hud paw-arcade-hud"><span><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 2 15 9 23 9 17 14 19 22 12 18 5 22 7 14 1 9 9 9Z" fill="#f4ce7b" stroke="#aa8192" strokeWidth="1.5"/></svg> {score} points</span><span>Round {round}</span><span aria-label={`${lives} lives remaining`}>{Array.from({length:3},(_,i)=><span key={i} className={i<lives?'mole-heart':'mole-heart spent'}><svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" fill={i<lives?'#ed799d':'none'} stroke={i<lives?'#ed799d':'#c7b4c0'} strokeWidth="2"/></svg></span>)}</span></div><div className="mole-board">{holes.map((target,index)=><button type="button" key={index} className={'mole-hole '+(target?'has-target ':'')+(hit===index?'mole-hit':'')} aria-label={target?target.kind==='bomb'?'Bomb! Avoid!':target.kind==='gold'?'Golden mouse, 30 points':'Mouse, 10 points':'Empty hole'} onClick={()=>tap(index)}><span className="mole-dirt"/><span className="mole-creature">{target&&<MoleArt kind={target.kind}/>}</span><span className="mole-rim"/>{effect?.index===index&&<span key={effect.id} className={'mole-score-pop '+(effect.label.includes('−')?'bad':'')}>{effect.label}</span>}</button>)}</div><p className="mole-hint">Tap the mice, avoid bombs! • Missed mice cost a life.</p></>}
 </div></div>;
}
export function MoleArt({kind}:{kind:Critter}){
 if(kind==='bomb')return <svg viewBox="0 0 100 100" role="img" aria-label="Bomb"><path d="M49 22Q50 8 66 8" fill="none" stroke="#75606b" strokeWidth="6" strokeLinecap="round"/><path d="M68 7l8-5-1 10 10 3-12 5-5 10-3-13-11-5Z" fill="#f7ba68"/><circle cx="50" cy="57" r="32" fill="#494554" stroke="#332d3c" strokeWidth="4"/><ellipse cx="39" cy="48" rx="9" ry="5" fill="#fff" opacity=".22"/><path d="M35 55l8 8m0-8-8 8M58 55l8 8m0-8-8 8" stroke="#fff4f6" strokeWidth="4" strokeLinecap="round"/></svg>;
 return <svg viewBox="0 0 100 100" role="img" aria-label={kind==='gold'?'Golden mouse':'Mouse'}><ellipse cx="24" cy="33" rx="18" ry="22" fill={kind==='gold'?'#f6cb68':'#bd99a7'} stroke="#886b79" strokeWidth="3"/><ellipse cx="76" cy="33" rx="18" ry="22" fill={kind==='gold'?'#f6cb68':'#bd99a7'} stroke="#886b79" strokeWidth="3"/><ellipse cx="24" cy="33" rx="10" ry="13" fill="#f8cad5"/><ellipse cx="76" cy="33" rx="10" ry="13" fill="#f8cad5"/><ellipse cx="50" cy="60" rx="33" ry="35" fill={kind==='gold'?'#ffe09a':'#d5b9c5'} stroke="#886b79" strokeWidth="3"/><circle cx="39" cy="55" r="4" fill="#554455"/><circle cx="61" cy="55" r="4" fill="#554455"/><ellipse cx="50" cy="68" rx="7" ry="5" fill="#f193ac"/><path d="M50 73q-5 7-11 2m11-2q5 7 11 2M26 69l-16-4m16 10-17 3m65-9 16-4m-16 10 17 3" stroke="#886b79" strokeWidth="2" strokeLinecap="round" fill="none"/>{kind==='gold'&&<path d="M50 11l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1Z" fill="#fff9d7" stroke="#d59e49" strokeWidth="2"/>}</svg>;
}
