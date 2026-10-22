import { useEffect, useRef } from 'react';
import { buildGrove, groveRandom, rootPoint } from './groveGeometry.js';
import { Wind } from './wind.js';
import { KOI } from '../household.js';

// A rooted world: personal boughs share a trunk; roots carry belonging,
// buds open, a seed is given away, leaves rest, a clearing admits light.
// Geometry and shaded sprigs are baked once. The frame only moves those
// cached forms with the same wind; no growth search runs in the loop.
const TAU = Math.PI * 2;
const clamp = (n,a=0,b=1) => Math.max(a,Math.min(b,n));
const ease = (n) => { const k=clamp(n);return k*k*(3-2*k); };
const themes=new Set(['belong','rest','grow','give','steady','welcome']);
const themeOf=(s)=>themes.has(s)?s:'grow';
const PAL = {
 day:{bark:['#baa27c','#817053','#48513a'],leaf:['#315b3f','#567849','#859554','#b3a65f','#284b39'],vein:'#d6d7a4',shade:'#243d2c',root:'#6c704b',light:'#f4e8b5'},
 dawn:{bark:['#a28b71','#655f58','#384b47'],leaf:['#4e6b5c','#768777','#a7ac87','#b2a486','#3b5550'],vein:'#cfd7bc',shade:'#263f3d',root:'#626b58',light:'#f2d6bb'},
 dusk:{bark:['#ad8b62','#706349','#3b4436'],leaf:['#4b6550','#76825a','#9a9862','#bd9c5b','#3b5145'],vein:'#d2bd89',shade:'#243d35',root:'#6a6650',light:'#efd39f'},
 night:{bark:['#62695f','#3b4946','#202e30'],leaf:['#354d46','#4b6254','#667963','#8a865d','#2b423e'],vein:'#a3b099',shade:'#101c20',root:'#4a5c53',light:'#b9c7b0'},
};
const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));return c;};
function colour(people,owner){return KOI[people[owner]?.koi]?.turn||['#ae8558','#b47369','#b2a257','#78906d','#7b9ba6','#8e7790'][owner%6];}

function leaf(ctx,x,y,a,l,w,pal,tone,alpha=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha*=alpha;
 const g=ctx.createLinearGradient(0,-w,0,w);g.addColorStop(0,pal.leaf[tone%pal.leaf.length]);g.addColorStop(.44,pal.leaf[(tone+1)%pal.leaf.length]);g.addColorStop(1,pal.leaf[0]);
 ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(l*.25,-w,l*.74,-w*.75,l,0);ctx.bezierCurveTo(l*.62,w*.7,l*.2,w*.8,0,0);ctx.fill();
 ctx.globalAlpha*=.2;ctx.strokeStyle=pal.vein;ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(1,0);ctx.quadraticCurveTo(l*.52,-.3,l*.95,0);ctx.stroke();ctx.restore();
}
function sprigSprite(pal,tone,pairs){
 const d=2,c=makeCanvas(108*d,82*d),ctx=c.getContext('2d');ctx.scale(d,d);ctx.translate(27,41);
 ctx.strokeStyle=pal.leaf[0];ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-2,0);ctx.quadraticCurveTo(17,-1,39,-2);ctx.stroke();
 for(let i=0;i<pairs;i++){
  const x=5+i*8, l=17+(pairs-i)*1.7;
  leaf(ctx,x,0,-.8,l,7.5,pal,(tone+i)%5);
  leaf(ctx,x+2,0,.75,l*.9,6.5,pal,(tone+i+1)%5);
 }
 leaf(ctx,31,-2,-.08,19,7,pal,(tone+2)%5);
 return {canvas:c,x:27,y:41,w:108,h:82};
}
function branchSprite(tree,owner,pal,pixelScale){
 const part=tree.nodes.slice(owner.from,owner.to),pad=15;
 const minX=Math.min(...part.map(n=>n.x))-pad,maxX=Math.max(...part.map(n=>n.x))+pad;
 const minY=Math.min(...part.map(n=>n.y))-pad,maxY=Math.max(...part.map(n=>n.y))+pad;
 const c=makeCanvas((maxX-minX)*pixelScale,(maxY-minY)*pixelScale),ctx=c.getContext('2d');
 ctx.setTransform(pixelScale,0,0,pixelScale,-minX*pixelScale,-minY*pixelScale);
 ctx.lineCap='round';ctx.lineJoin='round';
 const g=ctx.createLinearGradient(minX,0,maxX,0);g.addColorStop(0,pal.bark[0]);g.addColorStop(.4,pal.bark[1]);g.addColorStop(1,pal.bark[2]);
 // A continuous curved bough replaces the reference's straight scaffold.
 const curve=owner.scaffold;
 const contour=(side)=>Array.from({length:26},(_,i)=>{const t=i/25,u=1-t;const x=u*u*curve.a.x+2*u*t*curve.c.x+t*t*curve.b.x,y=u*u*curve.a.y+2*u*t*curve.c.y+t*t*curve.b.y;const dx=2*u*(curve.c.x-curve.a.x)+2*t*(curve.b.x-curve.c.x),dy=2*u*(curve.c.y-curve.a.y)+2*t*(curve.b.y-curve.c.y),l=Math.hypot(dx,dy)||1;const r=(5.8*(1-t)+2.2*t)*side;return {x:x-dy/l*r,y:y+dx/l*r};});
 const outline=[...contour(1),...contour(-1).reverse()];
 ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(outline[0].x,outline[0].y);for(const p of outline)ctx.lineTo(p.x,p.y);ctx.closePath();ctx.fill();
 ctx.strokeStyle=pal.bark[0];ctx.globalAlpha=.35;ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(curve.a.x-1,curve.a.y);ctx.quadraticCurveTo(curve.c.x-1,curve.c.y,curve.b.x-1,curve.b.y);ctx.stroke();ctx.globalAlpha=1;
 for(let j=owner.from+10;j<owner.to;j++){
  const n=tree.nodes[j],p=tree.nodes[n.parent];if(!p)continue;
  ctx.strokeStyle=g;ctx.lineWidth=(p.radius+n.radius)*.98;
  ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(n.x,n.y);ctx.stroke();
  if(n.radius>1.7){ctx.strokeStyle=pal.bark[0];ctx.globalAlpha=.35;ctx.lineWidth=Math.max(.55,n.radius*.2);ctx.beginPath();ctx.moveTo(p.x-.7,p.y);ctx.lineTo(n.x-.7,n.y);ctx.stroke();ctx.globalAlpha=1;}
 }
 return {canvas:c,x:minX,y:minY,w:maxX-minX,h:maxY-minY};
}
function trunk(ctx,tree,pal){
 const {a,c,b}=tree.trunk;
 const left=[],right=[];
 for(let i=0;i<=24;i++){
  const t=i/24,u=1-t;
  const x=u*u*a.x+2*u*t*c.x+t*t*b.x,y=u*u*a.y+2*u*t*c.y+t*t*b.y;
  const dx=2*u*(c.x-a.x)+2*t*(b.x-c.x),dy=2*u*(c.y-a.y)+2*t*(b.y-c.y),l=Math.hypot(dx,dy)||1;
  const r=15.5*(1-t)+2.2*t;
  left.push({x:x-dy/l*r,y:y+dx/l*r});right.push({x:x+dy/l*r,y:y-dx/l*r});
 }
 const g=ctx.createLinearGradient(476,0,525,0);g.addColorStop(0,pal.bark[0]);g.addColorStop(.38,pal.bark[1]);g.addColorStop(1,pal.bark[2]);ctx.fillStyle=g;
 ctx.beginPath();ctx.moveTo(left[0].x,left[0].y);for(const p of left)ctx.lineTo(p.x,p.y);for(const p of right.reverse())ctx.lineTo(p.x,p.y);ctx.closePath();ctx.fill();
 // A quiet grain runs with the wood rather than a texture laid over it.
 ctx.strokeStyle=pal.bark[0];ctx.globalAlpha=.25;ctx.lineWidth=.8;
 for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(a.x-6+k*5,a.y-13);ctx.quadraticCurveTo(c.x-4+k*3,c.y,b.x-4+k*3,b.y+14);ctx.stroke();}ctx.globalAlpha=1;
}

export default function Grove({ people=[],board={},boards={},personId=null,todayIds=[],light='day',season='autumn',paused=false,weeks=0,event=0 }){
 const canvasRef=useRef(null),controlRef=useRef(null),live=useRef({});
 live.current={people,board,boards,personId,todayIds,light,season,paused,weeks,event};
 const shapeKey=people.map(p=>`${p.id}:${p.koi}`).join('|');
 useEffect(()=>{
  const canvas=canvasRef.current;if(!canvas)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced=media.matches,dead=false,raf=0,was=0,t=0,W=1,H=1,DPR=1,unit=1;
  let paletteKey='',pal=PAL.day,branches=[],sprigs=new Map(),drawRoots=[],active=null,nextAt=1.8,lastEvent=live.current.event;
  // A person changes the light on their bough, never the family's whole tree.
  const tree=buildGrove(live.current.people,`Shared roots|${shapeKey}`);
  const random=groveRandom(shapeKey),wind=new Wind({reduced});
  const opened=[];
  const loops=tree.owners.map(()=>({angle:0,velocity:0}));
  const bake=()=>{
   pal=PAL[live.current.light]||PAL.day;paletteKey=`${live.current.light}:${live.current.season}`;
   if(live.current.season==='spring')pal={...pal,leaf:live.current.light==='night'?['#426351','#58775b','#7b906b','#89976a','#344d43']:['#537a45','#83a357','#a7b97b','#c4c591','#426744']};
   if(live.current.season==='summer'&&live.current.light!=='night')pal={...pal,leaf:['#315b3f','#547846','#7e9657','#a8ad6c','#294f38']};
   branches=tree.owners.map(o=>branchSprite(tree,o,pal,Math.max(.5,unit*DPR)));
   sprigs.clear();
   for(let tone=0;tone<5;tone++)for(let pairs=2;pairs<=4;pairs++)sprigs.set(`${tone}:${pairs}`,sprigSprite(pal,tone,pairs));
  };
  const resize=()=>{
   const r=canvas.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);
   DPR=Math.min(1.5,window.devicePixelRatio||1,Math.sqrt(1.5e6/(W*H)));
   canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);
   unit=Math.min(W/1000,H/650);
   drawRoots=tree.roots.map(root=>{const b={x:500+(root.b.x-500)*(W/(1000*unit))*1.1,y:root.b.y};return {...root,b,c:{x:(500+b.x)/2,y:root.c.y}};});
   bake();paint(0);
  };
  const begin=()=>{
   const p=live.current,focus=tree.owners.find(o=>o.id===p.personId);
   const owner=focus?.owner??Math.floor(random()*tree.owners.length);
   const personalTheme=p.boards[tree.owners[owner].id]?.theme;
   const theme=themeOf(focus || random() < .55 ? p.board.theme : personalTheme || p.board.theme);
   active={theme,owner,at:t,duration:theme==='rest'?10:7.5,variation:random(),slot:opened.filter(o=>o.owner===owner).length};
   nextAt=t+19+random()*17;
  };
  const ownerAngle=(owner,dt)=>{
   const state=loops[owner],entry=tree.owners[owner];
   const rootX=entry.tip.x,phase=owner*.77;
   let target=wind.sway(rootX,.006,phase);
   if(active){
    const k=(t-active.at)/active.duration,hold=Math.sin(clamp(k)*Math.PI);
    if(active.theme==='welcome')target+=(entry.tip.x<500?-.022:.022)*hold;
    if(active.theme==='rest')target*=.1;
    if(active.theme==='steady'&&owner===active.owner)target+=Math.sin(k*Math.PI*2)*.009*hold;
   }
   if(reduced)return 0;
   if(dt){state.velocity+=(target-state.angle)*dt*8;state.velocity*=Math.exp(-dt*4.5);state.angle+=state.velocity*dt;}
   return state.angle;
  };
  const branchTransform=(owner,angle)=>{const root=tree.owners[owner].root;ctx.save();ctx.translate(root.x,root.y);ctx.rotate(angle);ctx.translate(-root.x,-root.y);};
  function paint(dt){
   const p=live.current;
   if(`${p.light}:${p.season}`!==paletteKey)bake();
   if(p.event!==lastEvent){lastEvent=p.event;if(!reduced)begin();}
   if(!reduced&&dt){
    t+=dt;
    if(active&&t-active.at>active.duration){
     if(active.theme==='grow'&&active.slot<3)opened.push({owner:active.owner,slot:active.slot});
     active=null;
    }
    if(!active&&t>=nextAt)begin();
    wind.step(dt,{calm:active?.theme==='rest'?.08:1});
   }
   ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);
   const ox=(W-1000*unit)/2,oy=(H-650*unit)/2;
   ctx.translate(ox,oy);ctx.scale(unit,unit);
   ctx.save();ctx.translate(500,601);ctx.scale(1,.12);const shadow=ctx.createRadialGradient(0,0,2,0,0,270);shadow.addColorStop(0,p.light==='night'?'rgba(0,9,13,.35)':'rgba(38,64,35,.21)');shadow.addColorStop(1,'rgba(25,40,28,0)');ctx.fillStyle=shadow;ctx.fillRect(-290,-290,580,580);ctx.restore();
   // The roots remain connected when a bough yields to the shared wind.
   for(const root of drawRoots){
    const id=tree.owners[root.owner].id,focus=!p.personId||p.personId===id;
    ctx.globalAlpha=focus?.75:.22;ctx.strokeStyle=pal.root;ctx.lineWidth=2.8;
    ctx.beginPath();ctx.moveTo(root.a.x,root.a.y);ctx.quadraticCurveTo(root.c.x,root.c.y,root.b.x,root.b.y);ctx.stroke();
    ctx.strokeStyle=colour(p.people,root.owner);ctx.lineWidth=2;ctx.beginPath();const q=rootPoint(root,.79);ctx.moveTo(q.x,q.y);ctx.quadraticCurveTo((q.x+root.b.x)/2,root.b.y,root.b.x,root.b.y);ctx.stroke();
   }ctx.globalAlpha=1;
   if(active?.theme==='belong'){
    const root=drawRoots[active.owner],k=clamp((t-active.at)/active.duration),u=1-k;
    ctx.strokeStyle=pal.light;ctx.globalAlpha=Math.sin(k*Math.PI)*.8;ctx.lineWidth=3.4;ctx.lineCap='round';ctx.beginPath();
    for(let i=0;i<18;i++){const q=rootPoint(root,clamp(u-.12+i/17*.12));if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y);}ctx.stroke();ctx.globalAlpha=1;
   }
   const angles=tree.owners.map(o=>ownerAngle(o.owner,dt));
   for(const o of tree.owners){
    const focus=!p.personId||p.personId===o.id;ctx.globalAlpha=focus?1:.25;
    branchTransform(o.owner,angles[o.owner]);const b=branches[o.owner];ctx.drawImage(b.canvas,b.x,b.y,b.w,b.h);ctx.restore();
   }
   ctx.globalAlpha=1;trunk(ctx,tree,pal);
   if(active?.theme==='welcome'){
    const k=(t-active.at)/active.duration;
    const beam=ctx.createLinearGradient(500,70,500,590);beam.addColorStop(0,p.light==='night'?'rgba(186,208,185,0)':'rgba(250,241,186,0)');beam.addColorStop(.4,p.light==='night'?'rgba(186,208,185,.07)':'rgba(250,241,186,.15)');beam.addColorStop(1,'rgba(250,241,186,0)');
    ctx.globalAlpha=Math.sin(clamp(k)*Math.PI);ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(485,55);ctx.lineTo(515,55);ctx.lineTo(560,590);ctx.lineTo(440,590);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
   }
   for(const o of tree.owners){
    const focus=!p.personId||p.personId===o.id,alpha=focus?1:.24;
    branchTransform(o.owner,angles[o.owner]);
    for(const lf of tree.leaves){
     if(lf.owner!==o.owner||(p.season==='winter'&&lf.seed>.21))continue;
     const sprite=sprigs.get(`${lf.tone}:${lf.pairs}`),k=active?(t-active.at)/active.duration:0;
     const rest=active?.theme==='rest'?Math.sin(clamp(k)*Math.PI):0;
     const sway=reduced?0:wind.sway(lf.x,.085,lf.phase);
     ctx.save();ctx.translate(lf.x,lf.y);ctx.rotate(lf.angle+sway);ctx.scale(lf.length/22,(lf.length/22)*(1-rest*.4));ctx.globalAlpha=alpha*(1-rest*.1);
     ctx.drawImage(sprite.canvas,-sprite.x,-sprite.y,sprite.w,sprite.h);ctx.restore();
    }
    const fruit=tree.fruit[o.owner];
    ctx.globalAlpha=alpha;ctx.strokeStyle=pal.root;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(fruit.x,fruit.y-10);ctx.lineTo(fruit.x+1,fruit.y+5);ctx.stroke();
    const r=3.2+clamp(Number(p.weeks)||0,0,12)/12*2.8;
    const glow=ctx.createRadialGradient(fruit.x-1,fruit.y-1,.5,fruit.x,fruit.y,r);glow.addColorStop(0,p.todayIds.includes(o.id)?pal.light:colour(p.people,o.owner));glow.addColorStop(1,pal.bark[1]);
    ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(fruit.x,fruit.y,r*.78,r,0,0,TAU);ctx.fill();
    ctx.restore();
   }
   ctx.globalAlpha=1;
   const crown=sprigs.get('1:2');ctx.save();ctx.translate(tree.junction.x,tree.junction.y);ctx.rotate(-1.52+(reduced?0:wind.sway(500,.06,.4)));ctx.scale(.72,.72);ctx.drawImage(crown.canvas,-crown.x,-crown.y,crown.w,crown.h);ctx.restore();
   const buds=opened.map(b=>({...b,progress:1}));
   if(active?.theme==='grow'&&active.slot<3)buds.push({owner:active.owner,slot:active.slot,progress:ease((t-active.at)/5)});
   for(const bud of buds){
    const o=tree.owners[bud.owner],focus=!p.personId||p.personId===o.id;
    branchTransform(bud.owner,angles[bud.owner]);ctx.globalAlpha=focus?1:.24;
    const at=o.tip,x=at.x+(bud.slot-1)*9,y=at.y-bud.slot*7,g=bud.progress;
    ctx.strokeStyle=pal.leaf[1];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(at.x,at.y);ctx.lineTo(x,y-16*g);ctx.stroke();
    leaf(ctx,x,y-13*g,-2.1,17*g,5*g,pal,2);leaf(ctx,x,y-9*g,-.9,14*g,4*g,pal,1);ctx.restore();
   }ctx.globalAlpha=1;
   if(active?.theme==='give'){
    const o=tree.owners[active.owner],k=clamp((t-active.at)/active.duration),fall=ease(k);
    const x=o.tip.x+(wind.at(o.tip.x)*65+Math.sin(k*Math.PI*2+active.variation)*13)*fall;
    const y=o.tip.y+fall*(594-o.tip.y);
    ctx.save();ctx.translate(x,y);ctx.rotate(k*4.2+active.variation*TAU);ctx.globalAlpha=Math.sin(clamp(k*1.8)*Math.PI/2)*(1-ease((k-.85)/.15));
    ctx.fillStyle=pal.bark[0];ctx.beginPath();ctx.ellipse(0,0,3,4,0,0,TAU);ctx.fill();
    ctx.fillStyle=pal.leaf[3];ctx.globalAlpha*=.8;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(20,-8,25,-1);ctx.quadraticCurveTo(17,6,0,0);ctx.fill();ctx.restore();
   }
   ctx.globalAlpha=1;
  }
  const loop=(now)=>{
   raf=0;if(dead||reduced||live.current.paused||document.hidden)return;
   const dt=was?Math.min(.05,(now-was)/1000):0;was=now;paint(dt);raf=requestAnimationFrame(loop);
  };
  const start=()=>{if(dead||raf||reduced||live.current.paused||document.hidden)return;was=0;raf=requestAnimationFrame(loop);};
  const stop=()=>{cancelAnimationFrame(raf);raf=0;was=0;};
  controlRef.current={sync:()=>{if(reduced||live.current.paused)stop();else start();paint(0);}};
  const motion=()=>{reduced=media.matches;wind.reduced=reduced;active=null;controlRef.current?.sync();};
  const visibility=()=>{if(document.hidden)stop();else controlRef.current?.sync();};
  const ro=new ResizeObserver(resize);ro.observe(canvas);resize();start();
  media.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);
  return()=>{dead=true;stop();ro.disconnect();media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);controlRef.current=null;};
 },[shapeKey]);
 useEffect(()=>{controlRef.current?.sync();},[paused,personId,light,season,event,board.theme,todayIds.join('|'),weeks]);
 return <canvas ref={canvasRef} className="grove-canvas" role="img" aria-label="A living grove: each person's bough joins one rooted tree." style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}/>;
}
