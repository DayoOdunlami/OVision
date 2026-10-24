import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/fraunces/full-italic.css';
import '@fontsource-variable/literata/opsz.css';
import './study.css';
import { makeLandscape, grounds } from './landscape.js';
import { createPond } from './fish.js';
import { Wind } from './wind.js';
import { lightAt, now } from '../../app/calendar.js';

const params=new URLSearchParams(location.search),choices=['paper','ink','wash','colour'];
let dial=choices.includes(params.get('dial'))?params.get('dial'):'ink';
let place=params.get('place')==='pond'?'pond':'scroll';
const canvas=document.querySelector('#landscape'),ctx=canvas.getContext('2d'),host=document.querySelector('#study');
const media=matchMedia('(prefers-reduced-motion: reduce)'),wind=new Wind({reduced:media.matches});
let reduced=media.matches,W=0,H=0,DPR=1,land,pond,raf=0,last=0,light=lightAt(now()),paused=false;
let open=place==='pond'?1:0,goal=open;
let weights=choices.map(c=>c===dial?1:0),targets=[...weights];
let hintTimer;
const entry=document.querySelector('#pond-entry'),back=document.querySelector('#back'),hint=document.querySelector('#guidance'),note=document.querySelector('#note');
const ease=t=>t*t*(3-2*t);
let move={from:open,at:0};
function dismiss(){hint.style.opacity='0';hint.style.pointerEvents='none';clearTimeout(hintTimer);}
function applyUI(){
 document.body.dataset.paper=dial==='paper'?'1':'0';
 document.body.dataset.place=place;
 document.querySelectorAll('[data-dial]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dial===dial)));
 entry.hidden=place==='pond'||dial==='paper';back.hidden=place!=='pond';
 if(dial==='paper'||place==='pond')dismiss();
 canvas.setAttribute('aria-label',dial==='paper'?'':`A ${dial==='ink'?'brush ink':dial==='wash'?'brush ink and watercolour':'colour'} ${place==='pond'?'pond with living koi':'landscape: mist, a tended garden and living koi in a pond'}.`);
 canvas.setAttribute('aria-hidden',String(dial==='paper'));
}
function address(){const u=new URL(location.href);u.searchParams.set('dial',dial);if(place==='pond')u.searchParams.set('place','pond');else u.searchParams.delete('place');history.replaceState(null,'',u);}
function selectDial(value){dial=value;targets=choices.map(c=>c===dial?1:0);if(reduced)weights=[...targets];dismiss();applyUI();address();start();}
function selectPlace(value){place=value;goal=value==='pond'?1:0;move={from:open,at:performance.now()};if(reduced)open=goal;dismiss();applyUI();address();start();if(value==='pond')back.focus({preventScroll:true});else entry.focus({preventScroll:true});}
function shape(rect,p){
 const cx=rect.x+rect.w/2,cy=rect.y+rect.h/2,n=2+p*16;ctx.beginPath();
 if(p>.999){ctx.rect(rect.x,rect.y,rect.w,rect.h);return;}
 for(let j=0;j<=90;j++){const a=j/90*Math.PI*2,c=Math.cos(a),s=Math.sin(a),x=cx+rect.w/2*Math.sign(c)*Math.abs(c)**(2/n),y=cy+rect.h/2*Math.sign(s)*Math.abs(s)**(2/n);if(j)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.closePath();
}
function paint(){
 ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);ctx.fillStyle=grounds[light];ctx.fillRect(0,0,W,H);
 const living=1-weights[0];
 if(living>.001){
  ctx.drawImage(land.paper,0,0,W,H);
  const mediums=weights.slice(1),p=open;
  // The scroll's own basin grows to fill the frame, without a perspective shift.
  const r0=land.rect,r={x:r0.x*(1-p),y:r0.y*(1-p),w:r0.w+(W-r0.w)*p,h:r0.h+(H-r0.h)*p};
  ctx.save();shape(r,p);ctx.clip();
  ctx.fillStyle=grounds[light];ctx.fillRect(r.x,r.y,r.w,r.h);
  land.paintWater(ctx,mediums,r);
  const scale=(r0.w/W*.7)*(1-p)+p;
  ctx.save();ctx.translate(r.x+r.w/2-W*scale/2,r.y+r.h/2-H*scale/2);ctx.scale(scale,scale);
  pond.draw(ctx,{ink:weights[1]+weights[2],wash:weights[2],colour:weights[3],night:light==='night'||light==='dusk'});ctx.restore();
  ctx.restore();
  land.paintRim(ctx,mediums,r,p);
  ctx.save();ctx.translate(0,-p*22);land.paintLand(ctx,mediums,wind,(1-p)**1.7);ctx.restore();
 }
}
function running(){return !paused&&!document.hidden&&(!reduced&&dial!=='paper'||Math.abs(open-goal)>.001||weights.some((v,i)=>Math.abs(v-targets[i])>.002));}
function frame(t){
 raf=0;const dt=last?Math.min(.06,(t-last)/1000):1/60;last=t;
 if(paused||document.hidden)return;
 for(let i=0;i<weights.length;i++){weights[i]+= (targets[i]-weights[i])*Math.min(1,dt*5);if(Math.abs(targets[i]-weights[i])<.001)weights[i]=targets[i];}
 if(open!==goal){const k=Math.min(1,(t-move.at)/1650);open=move.from+(goal-move.from)*ease(k);if(k===1)open=goal;}
 if(!reduced&&dial!=='paper'){pond.step({paintColour:weights[3]>.001});wind.step(dt,{calm:.35});}
 paint();if(running())raf=requestAnimationFrame(frame);
}
function start(){if(!raf&&!paused&&!document.hidden){last=0;raf=requestAnimationFrame(frame);}}
function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
function resize(){
 stop();const r=host.getBoundingClientRect();W=Math.round(r.width);H=Math.round(r.height);DPR=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1.5e6/(W*H)));
 canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);land=makeLandscape(W,H,light);if(!pond||pond.width!==W||pond.height!==H)pond=createPond(W,H);
 const dark=light==='night'||light==='dusk';host.style.setProperty('--paper',grounds[light]);host.style.setProperty('--ink',dark?'#c6cbbc':'#34453d');host.style.setProperty('--muted',dark?'#a4b0a6':'#69776c');host.style.setProperty('--line',dark?'#c6cbbc2d':'#34453d26');host.style.setProperty('--veil',dark?'#182327ed':'#f1ecdeed');
 document.documentElement.style.background=grounds[light];document.querySelector('meta[name="theme-color"]').content=grounds[light];paint();start();
}
document.querySelectorAll('[data-dial]').forEach((button,i)=>{button.addEventListener('click',()=>selectDial(button.dataset.dial));button.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const at=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:3))%4;selectDial(choices[at]);document.querySelector(`[data-dial="${choices[at]}"]`).focus();});});
entry.addEventListener('click',()=>selectPlace('pond'));back.addEventListener('click',()=>selectPlace('scroll'));document.querySelector('#dismiss').addEventListener('click',dismiss);
document.querySelector('#about').addEventListener('click',()=>{dismiss();paused=true;stop();note.showModal();});document.querySelector('#close-note').addEventListener('click',()=>note.close());note.addEventListener('close',()=>{paused=false;start();});note.addEventListener('click',e=>{if(e.target===note){const r=note.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)note.close();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!note.open&&place==='pond')selectPlace('scroll');});
media.addEventListener('change',()=>{reduced=media.matches;wind.reduced=reduced;if(reduced){weights=[...targets];open=goal;}stop();paint();start();});
document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,180);});
setInterval(()=>{const next=lightAt(now());if(next!==light){light=next;resize();}},60000);
try{if(sessionStorage.getItem('study.guided')||params.get('intro')==='0'||dial==='paper'||place==='pond')hint.hidden=true;else{sessionStorage.setItem('study.guided','1');hintTimer=setTimeout(dismiss,8000);}}catch{hintTimer=setTimeout(dismiss,8000);}
applyUI();resize();
// Read-only state for the study's browser checks; no family data is read or saved.
window.studyState=()=>({dial,place,open,weights:[...weights],light,reduced,fish:pond.fish.map(f=>({x:f.head.x,y:f.head.y}))});
