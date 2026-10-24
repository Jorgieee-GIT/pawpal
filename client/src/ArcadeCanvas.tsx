import {useEffect,useRef} from 'react';
import PetArt from './PetArt';
export default function ArcadeCanvas({kind,species='cat',color='classic',breed='classic',cosmetic='none',onScore,onGameOver}:{kind:'dino'|'runner';species?:string;color?:string;breed?:string;cosmetic?:string;onScore:(score:number)=>void;onGameOver:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null);const avatar=useRef<HTMLDivElement>(null);const callbacks=useRef({onScore,onGameOver});callbacks.current={onScore,onGameOver};
 useEffect(()=>{
 const element=canvas.current;if(!element)return;const context=element.getContext('2d');if(!context)return;const ctx=context;const c=element;const avatarElement=avatar.current;
 let frame=0,last=0,elapsed=0,spawn=0,score=0,ended=false,raf=0;
 let height=0,velocity=0,lane=1,targetLane=1,playerLane=1,landing=0;
 let obstacles:{distance:number,lane:number,passed:boolean}[]=[];
 const jump=()=>{if(kind==='dino'&&height<=0.1){velocity=690;height=1;landing=0}};
 const move=(dir:number)=>{targetLane=Math.max(0,Math.min(2,targetLane+dir))};
 const key=(e:KeyboardEvent)=>{if(['Space','ArrowUp','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='Space'||e.code==='ArrowUp')jump();if(e.code==='ArrowLeft')move(-1);if(e.code==='ArrowRight')move(1)};
 let touchX=0;const touchStart=(e:TouchEvent)=>{touchX=e.touches[0].clientX};const touchEnd=(e:TouchEvent)=>{if(kind==='dino')jump();else{const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>20)move(dx>0?1:-1)}};
 const click=()=>{if(kind==='dino')jump()};window.addEventListener('keydown',key);c.addEventListener('touchstart',touchStart,{passive:true});c.addEventListener('touchend',touchEnd,{passive:true});c.addEventListener('pointerdown',click);
 const round=(x:number,y:number,w:number,h:number,r:number,color:string)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()};
 const cloud=(x:number,y:number,s:number)=>{ctx.fillStyle='#fffafc';ctx.beginPath();ctx.ellipse(x,y,40*s,16*s,0,0,Math.PI*2);ctx.ellipse(x-20*s,y-9*s,20*s,18*s,0,0,Math.PI*2);ctx.ellipse(x+10*s,y-12*s,25*s,20*s,0,0,Math.PI*2);ctx.fill()};

 function render(t:number){if(ended)return;const dt=Math.min(.034,(t-last)/1000||0);last=t;elapsed+=dt;const w=640,h=340;c.width=w;c.height=h;
 const speed=kind==='dino'?175+Math.min(210,elapsed*6):.39+Math.min(.55,elapsed*.012);
 const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#dcecf5');sky.addColorStop(1,'#fff2f4');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);for(let i=0;i<4;i++)cloud(((i*220-elapsed*16)%(w+220)+w+220)%(w+220)-50,55+i%2*32,.7+i%2*.25);
 ctx.fillStyle='#a7d2b4';ctx.beginPath();ctx.ellipse(100,290,210,110,0,0,7);ctx.ellipse(530,290,250,115,0,0,7);ctx.fill();
 if(kind==='dino'){
 round(0,275,w,65,0,'#f5dfd2');round(0,274,w,5,0,'#b5d4b7');for(let i=0;i<14;i++){let x=((i*71-elapsed*speed*.6)%720+720)%720;round(x,310,28,4,2,'#e3bcb7')}
 if(height>0){height=Math.max(0,height+velocity*dt);velocity-=1800*dt;if(height===0){landing=1;velocity=0}}landing=Math.max(0,landing-dt*4);
 spawn+=dt;if(spawn>Math.max(.86,1.75-elapsed*.014)){spawn=0;obstacles.push({distance:680,lane:0,passed:false})}
 for(const o of obstacles){o.distance-=speed*dt;round(o.distance,233,24,43,9,'#86bba4');round(o.distance-9,246,11,12,4,'#86bba4');round(o.distance+22,253,10,10,4,'#86bba4');if(o.distance<105&&o.distance>72&&height<42){ended=true;callbacks.current.onGameOver();break}if(o.distance<70&&!o.passed){o.passed=true;score+=15;callbacks.current.onScore(score)}}obstacles=obstacles.filter(o=>o.distance>-40);
 if(avatarElement){avatarElement.style.left=(82/640*100)+'%';avatarElement.style.top=((275-height-68)/340*100)+'%';avatarElement.style.width=(76/640*100)+'%';avatarElement.style.transform=`translateX(-50%) scale(${1-landing*.07})`;}
 }else{
 // Pseudo-3D perspective: the road converges at the horizon; objects scale by depth.
 const horizon=90,bottom=340,center=320;ctx.fillStyle='#d7b3bd';ctx.beginPath();ctx.moveTo(center-44,horizon);ctx.lineTo(center+44,horizon);ctx.lineTo(610,bottom);ctx.lineTo(30,bottom);ctx.closePath();ctx.fill();
 for(let boundary=1;boundary<=2;boundary++){ctx.strokeStyle='#fff9f6';ctx.lineWidth=4;ctx.setLineDash([20,16]);ctx.lineDashOffset=-elapsed*160;ctx.beginPath();ctx.moveTo(center-44+boundary*88/3,horizon);ctx.lineTo(30+boundary*580/3,bottom);ctx.stroke();ctx.setLineDash([])}
 for(let i=0;i<12;i++){const d=((i/12+elapsed*.24)%1);const y=horizon+d*d*(bottom-horizon);const x=320+(i%2===0?-1:1)*(80+d*260);round(x,y,10+d*12,20+d*30,6,'#91c9a6')}
 playerLane+=(targetLane-playerLane)*Math.min(1,dt*12);spawn+=dt;if(spawn>Math.max(.8,1.65-elapsed*.012)){spawn=0;obstacles.push({distance:0,lane:Math.floor(Math.random()*3),passed:false})}
 obstacles.sort((a,b)=>a.distance-b.distance);for(const o of obstacles){o.distance+=speed*dt;const depth=Math.min(1,o.distance);const y=horizon+depth*depth*245;const spread=30+depth*150;const x=center+(o.lane-1)*spread;const size=10+depth*44;round(x-size/2,y-size,size,size,6+depth*6,'#a78cbb');round(x-size*.3,y-size*.82,size*.6,size*.4,5,'#d9c7e7');if(o.distance>.89&&!o.passed){o.passed=true;if(o.lane===targetLane){ended=true;callbacks.current.onGameOver();break}else{score+=15;callbacks.current.onScore(score)}}}obstacles=obstacles.filter(o=>o.distance<1.18);
 const px=center+(playerLane-1)*170;ctx.fillStyle='#7c6377';ctx.beginPath();ctx.ellipse(px,307,29,9,0,0,7);ctx.fill();if(avatarElement){avatarElement.style.left=(px/640*100)+'%';avatarElement.style.top=((301-101+Math.sin(elapsed*15)*3)/340*100)+'%';avatarElement.style.width=(112/640*100)+'%';avatarElement.style.transform='translateX(-50%)';}
 }
 round(14,12,155,30,14,'#fff9f6');ctx.font='bold 16px system-ui';ctx.fillStyle='#866178';ctx.fillText(`Score ${score}`,28,33);
 if(!ended)raf=requestAnimationFrame(render);
 }
 raf=requestAnimationFrame(render);return()=>{cancelAnimationFrame(raf);window.removeEventListener('keydown',key);c.removeEventListener('touchstart',touchStart);c.removeEventListener('touchend',touchEnd);c.removeEventListener('pointerdown',click)};
 },[kind]);
 return <div className="polished-arcade"><div className="arcade-stage"><canvas ref={canvas} aria-label={kind==='dino'?'Jump over cacti':'Three lane perspective runner'}/><div className="arcade-pet-avatar" ref={avatar}><PetArt species={species} color={color} breed={breed} cosmetic={cosmetic}/></div></div><div className="arcade-controls">{kind==='dino'?<span>Space / ↑ / tap to jump</span>:<span>← → / swipe to change lanes</span>}</div></div>
}
