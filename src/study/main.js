import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/fraunces/full-italic.css';
import '@fontsource-variable/literata/opsz.css';
import './study.css';
import { makeLandscape, grounds } from './landscape.js';
import { createPond } from './fish.js';
import { createGarden } from './garden.js';
import { Wind } from './wind.js';
import { lightAt, now } from '../app/calendar.js';
import { readSwitches, scrollPond, pondView, gardenView, fishSize } from './composition.js';

const params=new URLSearchParams(location.search),choices=['paper','ink','wash','colour'];
const switches=readSwitches(location.search);
let dial=choices.includes(params.get('dial'))?params.get('dial'):'ink';
let place=['pond','garden'].includes(params.get('place'))?params.get('place'):'scroll';
if(place==='garden'&&!switches.garden)place='scroll';
const canvas=document.querySelector('#landscape'),ctx=canvas.getContext('2d'),host=document.querySelector('#study');
const media=matchMedia('(prefers-reduced-motion: reduce)'),wind=new Wind({reduced:media.matches});
let reduced=media.matches,W=0,H=0,DPR=1,land,pond,garden,raf=0,last=0,light=lightAt(now()),paused=false;
let open=place==='pond'?1:0,goal=open,gardenOpen=place==='garden'?1:0,gardenGoal=gardenOpen;
let weights=choices.map(c=>c===dial?1:0),targets=[...weights],spread=null;
let move={from:open,at:0},gardenMove={from:gardenOpen,at:0},hintTimer,promptTimer,touchTimer;
let currentPondView,lastTap=null,gardenHold=null,waterGuideActive=false,waterGuideDone=false,waterGuideTimer;
try{waterGuideDone=sessionStorage.getItem("study.water-guided")==="1";}catch{}
const layer=document.createElement('canvas'),layerCtx=layer.getContext('2d');
const interrupted=document.createElement('canvas');
const entry=document.querySelector('#pond-entry'),back=document.querySelector('#back');
const hint=document.querySelector('#guidance'),note=document.querySelector('#note');
const ease=t=>t*t*(3-2*t),clamp=n=>Math.max(0,Math.min(1,n));
const normalWorld=()=>!reduced&&dial!=='paper'&&!paused&&!document.hidden;

// The new destination and its controls exist only when its named upgrade is on.
let gardenEntry,practice,title,instruction,prompt,sow,objects,objectButtons=[];
if(switches.garden){
 gardenEntry=document.createElement('button');gardenEntry.id='garden-entry';
 gardenEntry.setAttribute('aria-label','Walk into the garden');gardenEntry.innerHTML='<span>The garden ↑</span>';
 entry.before(gardenEntry);
 practice=document.createElement('section');practice.id='practice';practice.hidden=true;
 practice.setAttribute('aria-label','Clear the ground and sow a word');
 practice.innerHTML='<div class="practice-copy"><p class="note-kicker">In the garden</p><h1 id="practice-title">Make a little room.</h1><p id="practice-instruction">Lift a stone. Pull up the thorn.</p><p id="practice-prompt" aria-live="polite"></p></div><div id="garden-objects"></div><button id="sow" hidden>Sow Rooted <span aria-hidden="true">↓</span></button>';
 document.querySelector('main').append(practice);
 title=practice.querySelector('h1');instruction=practice.querySelector('#practice-instruction');
 prompt=practice.querySelector('#practice-prompt');sow=practice.querySelector('#sow');objects=practice.querySelector('#garden-objects');
 sow.addEventListener('click',()=>{if(garden.sow()){clearPrompt();syncGarden();start();}});
 back.innerHTML='<span aria-hidden="true">↑</span> Back to the landscape';
 hint.querySelector('span').textContent='Touch the garden or the water to go closer.';
 note.querySelectorAll('p')[2].textContent='Touch the garden or water to go closer. Use the dial to change the medium. In the garden, lift what is in the way, then sow Rooted.';
}
if(switches.touch){
 const feed=document.createElement('button');feed.id='feed-koi';feed.className='focus-action';feed.textContent='Feed the koi';feed.hidden=true;
 feed.addEventListener('click',()=>{pond.feed({x:W/2,y:H/2});start();});entry.after(feed);
 const waterHint=document.createElement('p');waterHint.id='water-hint';waterHint.textContent='Touch the water. Tap twice to feed.';waterHint.hidden=true;entry.after(waterHint);
}
function dismiss(){hint.style.opacity='0';hint.style.pointerEvents='none';clearTimeout(hintTimer);}
function clearPrompt(){clearTimeout(promptTimer);if(prompt)prompt.textContent='';}
function showPrompt(text){
 if(!prompt)return;prompt.textContent=text;clearTimeout(promptTimer);
 promptTimer=setTimeout(()=>{prompt.textContent='';},4500);
}
function syncGarden(){
 if(!garden||!switches.garden)return;
 const state=garden.getState();if(!state.held)gardenHold=null;
 const clear=state.phase==='clear',ready=state.phase==='ready';
 title.textContent=clear?'Make a little room.':ready?'Room for something good.':state.phase==='complete'?'A word for the day.':'Let it take root.';
 instruction.textContent=clear?'Lift a stone. Pull up the thorn.':ready?'Sow one word to carry into the day.':state.phase==='complete'?'Carry it with you.':'One word, growing along the trellis.';
 sow.hidden=!ready||dial==='paper';
 for(const [i,item] of [...state.stones,state.thorn].entries()){
  let button=objectButtons[i];
  if(!button){
   button=document.createElement('button');button.className='garden-object';button.dataset.object=item.id;
   button.innerHTML='<span aria-hidden="true"></span>';objects.append(button);objectButtons[i]=button;
   button.addEventListener('click',e=>{if(e.detail===0){garden.activate(button.dataset.object);syncGarden();start();}});
   button.addEventListener('pointerdown',e=>{
    if(place!=='garden'||gardenOpen<.999||dial==='paper')return;
    e.preventDefault();const q=coordinates(e);gardenHold=e.pointerId;
    if(garden.pointerDown(q.x,q.y,e.pointerId)){button.setPointerCapture(e.pointerId);syncGarden();start();}
   });
   button.addEventListener('pointermove',e=>{if(gardenHold===e.pointerId){const q=coordinates(e);garden.pointerMove(q.x,q.y,e.pointerId);start();}});
   button.addEventListener('pointerup',e=>{
    if(gardenHold!==e.pointerId)return;const q=coordinates(e);garden.pointerUp(q.x,q.y,e.pointerId);gardenHold=null;
    if(button.hasPointerCapture(e.pointerId))button.releasePointerCapture(e.pointerId);syncGarden();start();
   });
   button.addEventListener('pointercancel',e=>{garden.pointerCancel(e.pointerId);gardenHold=null;start();});
  }
  const thorn=item.id===state.thorn.id,x=thorn?item.hitX:item.x,y=thorn?item.hitY:item.y;
  const width=Math.max(58,(thorn?item.r*2:item.rx*2)+16),height=Math.max(58,(thorn?item.r*2:item.ry*2)+20);
  button.style.cssText=`left:${x-width/2}px;top:${y-height/2}px;width:${width}px;height:${height}px`;
  button.querySelector('span').textContent=item.label;
  button.setAttribute('aria-label',(thorn?'Pull the thorn: ':'Lift the stone: ')+item.prompt);
  button.hidden=!clear||item.cleared||dial==='paper';
 }
}
function applyUI(){
 document.body.dataset.paper=dial==='paper'&&!spread?'1':'0';document.body.dataset.place=place;
 document.querySelectorAll('[data-dial]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dial===dial)));
 entry.hidden=place!=='scroll'||dial==='paper';back.hidden=place==='scroll';
 if(gardenEntry)gardenEntry.hidden=place!=='scroll'||dial==='paper';
 if(practice)practice.hidden=place!=='garden'||gardenOpen<.999||dial==='paper';
 if(switches.touch){
  document.querySelector('#feed-koi').hidden=place!=='pond'||dial==='paper';
  const showWaterGuide=place==='pond'&&dial!=='paper'&&open>.999;
  if(showWaterGuide&&!waterGuideDone&&!waterGuideActive){waterGuideActive=true;try{sessionStorage.setItem('study.water-guided','1');}catch{}waterGuideTimer=setTimeout(finishWaterGuide,8000);}
  document.querySelector('#water-hint').hidden=!showWaterGuide||!waterGuideActive;
 }
 if(dial==='paper'||place!=='scroll')dismiss();
 canvas.setAttribute('aria-label',dial==='paper'?'':`A ${dial==='ink'?'brush ink':dial==='wash'?'brush ink and watercolour':'colour'} ${place==='pond'?'pond with living koi':place==='garden'?'garden with stones, a thorn and a trellis':'landscape: mist, a tended garden and living koi in an oval pond'}.`);
 canvas.setAttribute('aria-hidden',String(dial==='paper'));syncGarden();
}
function address(){
 const u=new URL(location.href);u.searchParams.set('dial',dial);
 if(place!=='scroll')u.searchParams.set('place',place);else u.searchParams.delete('place');history.replaceState(null,'',u);
}
function selectDial(value,button){
 if(value===dial)return;
 const old=[...weights];
 if(switches.wet&&!reduced){
  const r=(button||document.querySelector(`[data-dial="${value}"]`)).getBoundingClientRect(),h=host.getBoundingClientRect();
  const frozen=!!spread;if(frozen){interrupted.width=canvas.width;interrupted.height=canvas.height;interrupted.getContext('2d').drawImage(canvas,0,0);}
  spread={from:old,to:choices.map(c=>c===value?1:0),at:performance.now(),x:r.left+r.width/2-h.left,y:r.top+r.height/2-h.top,frozen};
 }
 dial=value;targets=choices.map(c=>c===dial?1:0);if(reduced)weights=[...targets];
 dismiss();applyUI();address();start();
}
function finishWaterGuide(){waterGuideDone=true;waterGuideActive=false;clearTimeout(waterGuideTimer);document.querySelector('#water-hint')?.setAttribute('hidden','');}
function selectPlace(value){
 const previousPlace=place;
 if(value==='garden'&&!switches.garden)return;
 garden?.pointerCancel(gardenHold);gardenHold=null;pond.setPointer(null);lastTap=null;clearPrompt();
 place=value;goal=value==='pond'?1:0;gardenGoal=value==='garden'?1:0;
 move={from:open,at:performance.now()};gardenMove={from:gardenOpen,at:performance.now()};
 if(reduced){open=goal;gardenOpen=gardenGoal;}
 dismiss();applyUI();address();start();
 if(value!=='scroll')back.focus({preventScroll:true});else (previousPlace==='garden'?gardenEntry:entry)?.focus({preventScroll:true});
}
function basinPath(context,view,p){
 const r=view.rect;
 if(view.ellipse){context.beginPath();context.ellipse(r.x+r.w/2,r.y+r.h/2,r.w/2,r.h/2,0,0,Math.PI*2);return;}
 // The original wedge-producing superellipse is retained only for off=arrival.
 const cx=r.x+r.w/2,cy=r.y+r.h/2,n=2+p*16;context.beginPath();
 if(p>.999){context.rect(r.x,r.y,r.w,r.h);return;}
 for(let j=0;j<=90;j++){const a=j/90*Math.PI*2,c=Math.cos(a),s=Math.sin(a),x=cx+r.w/2*Math.sign(c)*Math.abs(c)**(2/n),y=cy+r.h/2*Math.sign(s)*Math.abs(s)**(2/n);if(j)context.lineTo(x,y);else context.moveTo(x,y);}context.closePath();
}
function paintWorld(context,paintWeights){
 context.setTransform(DPR,0,0,DPR,0,0);context.globalAlpha=1;context.globalCompositeOperation='source-over';
 context.clearRect(0,0,W,H);context.fillStyle=grounds[light];context.fillRect(0,0,W,H);
 if(1-paintWeights[0]<.001)return;
 context.drawImage(land.paper,0,0,W,H);
 const mediums=paintWeights.slice(1),p=open,g=gardenOpen,view=pondView(W,H,land.rect,p,switches);
 currentPondView=view;
 context.save();context.globalAlpha*=Math.pow(1-g,1.6);basinPath(context,view,p);context.clip();
 context.fillStyle=grounds[light];context.fillRect(view.rect.x,view.rect.y,view.rect.w,view.rect.h);
 land.paintWater(context,mediums,view.rect);
 context.save();context.translate(view.tx,view.ty);context.scale(view.sx,view.sy);
 pond.draw(context,{ink:paintWeights[1]+paintWeights[2],wash:paintWeights[2],colour:paintWeights[3],night:light==='night'||light==='dusk'});context.restore();context.restore();
 context.save();context.globalAlpha*=Math.pow(1-g,1.6);land.paintRim(context,mediums,view.rect,p);
 context.translate(0,-p*22);land.paintLand(context,mediums,wind,Math.pow(1-p,1.7),{motion:normalWorld()&&place==='scroll',garden:!switches.garden});context.restore();
 if(switches.garden&&p<.999){
  const v=gardenView(W,H,g);
  context.save();context.globalAlpha*=Math.pow(1-p,1.7);context.beginPath();context.rect(v.rect.x,v.rect.y,v.rect.w,v.rect.h);context.clip();
  context.translate(v.tx,v.ty);context.scale(v.scale,v.scale);
  garden.draw(context,{ink:paintWeights[1]+paintWeights[2],wash:paintWeights[2],colour:paintWeights[3],light,night:light==='night'||light==='dusk',wind:place==='scroll'||garden.getState().phase==='complete'?wind:null,reduced,pigment:switches.pigment});context.restore();
 }
}
function paint(t=performance.now()){
 if(!land||!pond)return;
 if(!spread){paintWorld(ctx,weights);return;}
 const k=clamp((t-spread.at)/1650);
 if(k>=1){weights=[...targets];spread=null;applyUI();paintWorld(ctx,weights);return;}
 if(spread.frozen){ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(interrupted,0,0);}else paintWorld(ctx,spread.from);
 paintWorld(layerCtx,spread.to);
 const far=Math.max(...[[0,0],[W,0],[0,H],[W,H]].map(([x,y])=>Math.hypot(x-spread.x,y-spread.y))),feather=Math.min(110,W*.18);
 const radius=(far+feather)*ease(k),outer=Math.max(.01,radius+feather),inner=Math.max(0,radius-feather);
 layerCtx.save();layerCtx.setTransform(DPR,0,0,DPR,0,0);layerCtx.globalCompositeOperation='destination-in';
 const mask=layerCtx.createRadialGradient(spread.x,spread.y,inner,spread.x,spread.y,outer);mask.addColorStop(0,`rgba(0,0,0,${Math.min(1,k*12)})`);mask.addColorStop(1,'transparent');layerCtx.fillStyle=mask;layerCtx.fillRect(0,0,W,H);layerCtx.restore();
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(layer,0,0);ctx.restore();
}
function running(){
 return !paused&&!document.hidden&&((!reduced&&dial!=='paper')||spread||Math.abs(open-goal)>.001||Math.abs(gardenOpen-gardenGoal)>.001||weights.some((v,i)=>Math.abs(v-targets[i])>.002));
}
function frame(t){
 raf=0;const dt=last?Math.min(.06,(t-last)/1000):1/60;last=t;
 if(paused||document.hidden)return;
 if(!spread){for(let i=0;i<weights.length;i++){weights[i]+=(targets[i]-weights[i])*Math.min(1,dt*5);if(Math.abs(targets[i]-weights[i])<.001)weights[i]=targets[i];}}
 if(open!==goal){const k=clamp((t-move.at)/1650);open=move.from+(goal-move.from)*ease(k);if(k===1){open=goal;applyUI();}}
 if(gardenOpen!==gardenGoal){const k=clamp((t-gardenMove.at)/1650);gardenOpen=gardenMove.from+(gardenGoal-gardenMove.from)*ease(k);if(k===1){gardenOpen=gardenGoal;applyUI();}}
 if(normalWorld()){
  if(gardenOpen<.999)pond.step({paintColour:weights[3]>.001||spread?.from[3]>.001||spread?.to[3]>.001});
  if(place==='scroll'||place==='pond'||garden?.getState().phase==='complete')wind.step(dt,{calm:.35});
  if(gardenOpen>0){garden?.step(dt);if(gardenHold!==null)syncGarden();}
 }
 paint(t);if(running())raf=requestAnimationFrame(frame);
}
function start(){if(!raf&&!paused&&!document.hidden){last=0;raf=requestAnimationFrame(frame);}}
function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
function resize(){
 stop();const r=host.getBoundingClientRect();W=Math.round(r.width);H=Math.round(r.height);DPR=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1.5e6/(W*H)));
 canvas.width=layer.width=Math.round(W*DPR);canvas.height=layer.height=Math.round(H*DPR);
 land=makeLandscape(W,H,light,{pigment:switches.pigment,atmosphere:switches.birds,pondRect:switches.squash?scrollPond(W,H):null});
 entry.style.left=land.rect.x+'px';entry.style.top=land.rect.y+'px';entry.style.width=land.rect.w+'px';entry.style.height=land.rect.h+'px';
 if(!pond||pond.width!==W||pond.height!==H)pond=createPond(W,H,{interactive:switches.touch,pigment:switches.pigment,sizeScale:fishSize(W,H,switches.fullsize)});
 if(switches.garden){
  if(!garden)garden=createGarden(W,H,{light,reduced,onChange:syncGarden,onPrompt:showPrompt});else garden.resize(W,H);
 }
 const dark=light==='night'||light==='dusk';host.style.setProperty('--paper',grounds[light]);host.style.setProperty('--ink',dark?'#c6cbbc':'#34453d');host.style.setProperty('--muted',dark?'#a4b0a6':'#69776c');host.style.setProperty('--line',dark?'#c6cbbc2d':'#34453d26');host.style.setProperty('--veil',dark?'#182327ed':'#f1ecdeed');
 document.documentElement.style.background=grounds[light];document.querySelector('meta[name="theme-color"]').content=grounds[light];
 spread=null;weights=[...targets];applyUI();paint();start();
}
function coordinates(e){const r=host.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
function waterPoint(e){const p=coordinates(e),v=currentPondView||pondView(W,H,land.rect,open,switches);return {x:(p.x-v.tx)/v.sx,y:(p.y-v.ty)/v.sy};}
function canTouch(e){return switches.touch&&place==='pond'&&open>.999&&dial!=='paper'&&!paused&&!e.target.closest('button,dialog');}
host.addEventListener('pointerdown',e=>{if(canTouch(e)){finishWaterGuide();lastTap=lastTap&&performance.now()-lastTap.t<400?lastTap:null;clearTimeout(touchTimer);pond.setPointer(waterPoint(e));start();}});
host.addEventListener('pointermove',e=>{if(canTouch(e)&&(e.pointerType==='mouse'||e.buttons)){pond.setPointer(waterPoint(e));start();}});
host.addEventListener('pointerup',e=>{
 if(!canTouch(e))return;const q=waterPoint(e),t=performance.now();
 if(lastTap&&t-lastTap.t<400&&Math.hypot(q.x-lastTap.x,q.y-lastTap.y)<60){pond.feed(q);lastTap=null;}else{pond.setPointer(q);lastTap={...q,t};}
 clearTimeout(touchTimer);touchTimer=setTimeout(()=>{pond.setPointer(null);},1300);start();
});
host.addEventListener('pointerleave',()=>{pond?.setPointer(null);});
host.addEventListener('pointercancel',()=>{pond?.setPointer(null);lastTap=null;});
document.querySelectorAll('[data-dial]').forEach((button,i)=>{
 button.addEventListener('click',()=>selectDial(button.dataset.dial,button));
 button.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const at=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:3))%4;selectDial(choices[at],document.querySelector(`[data-dial="${choices[at]}"]`));document.querySelector(`[data-dial="${choices[at]}"]`).focus();});
});
entry.addEventListener('click',()=>selectPlace('pond'));gardenEntry?.addEventListener('click',()=>selectPlace('garden'));
back.addEventListener('click',()=>selectPlace('scroll'));document.querySelector('#dismiss').addEventListener('click',dismiss);
document.querySelector('#about').addEventListener('click',()=>{dismiss();paused=true;stop();note.showModal();});
document.querySelector('#close-note').addEventListener('click',()=>note.close());note.addEventListener('close',()=>{paused=false;start();});
note.addEventListener('click',e=>{if(e.target===note){const r=note.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)note.close();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!note.open&&place!=='scroll')selectPlace('scroll');});
media.addEventListener('change',()=>{reduced=media.matches;wind.reduced=reduced;if(reduced){weights=[...targets];open=goal;gardenOpen=gardenGoal;spread=null;}stop();applyUI();paint();start();});
document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,180);});
setInterval(()=>{const next=lightAt(now());if(next!==light){light=next;resize();}},60000);
try{if(sessionStorage.getItem('study.guided')||params.get('intro')==='0'||dial==='paper'||place!=='scroll')hint.hidden=true;else{sessionStorage.setItem('study.guided','1');hintTimer=setTimeout(dismiss,8000);}}catch{hintTimer=setTimeout(dismiss,8000);}
resize();
window.studyState=()=>({v:2,dial,place,open,gardenOpen,weights:[...weights],spreading:!!spread,light,reduced,windTime:wind.t,switches:{...switches},view:currentPondView,garden:garden?.getState(),food:pond.food,fish:pond.fish.map(f=>({x:f.head.x,y:f.head.y}))});
