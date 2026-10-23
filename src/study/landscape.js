import { stroke, wash, rng, paperTexture } from './brush.js';

const TAU=Math.PI*2;
const surface=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c;};
const ellipse=(x,y,rx,ry,n=36)=>Array.from({length:n},(_,i)=>[x+Math.cos(i/n*TAU)*rx,y+Math.sin(i/n*TAU)*ry]);
const arc=(x,y,rx,ry,a,b,n=38)=>Array.from({length:n},(_,i)=>[x+Math.cos(a+(b-a)*i/(n-1))*rx,y+Math.sin(a+(b-a)*i/(n-1))*ry]);
const curve=(a,b,c,n=25)=>Array.from({length:n},(_,i)=>{const t=i/(n-1),u=1-t;return [u*u*a[0]+2*u*t*b[0]+t*t*c[0],u*u*a[1]+2*u*t*b[1]+t*t*c[1]];});
export const grounds={day:'#f1ecde',dawn:'#e9e4d9',dusk:'#313b3b',night:'#182327'};
export function palette(light, medium){
 const dark=light==='night'||light==='dusk',ink=dark?'#bcc4b9':'#34453d';
 if(medium==='ink')return {ink,soft:ink,leaf:ink,water:ink,stone:ink,soil:ink,far:ink,clay:ink};
 const rich=medium==='colour';
 return {ink,soft:dark?'#81958d':'#6b8273',leaf:dark?'#7f9b84':rich?'#5a7848':'#98a388',water:dark?rich?'#244f59':'#738d91':rich?'#83b7ad':'#a1b7ab',stone:dark?'#829393':rich?'#8e9385':'#b6b4a0',soil:dark?'#7c766c':rich?'#a79c79':'#bcb194',far:dark?'#6c858b':rich?'#8baba2':'#a4b5ae',clay:dark?'#aa9682':rich?'#b28259':'#c1a27c'};
}
function mark(ctx,p,colour,width,seed,alpha=1,dry=.4){stroke(ctx,p,{colour,width:width*(alpha>=.5?1.32:1),seed,alpha,dry});}
function fill(ctx,p,colour,seed,alpha=.4,layers=28){wash(ctx,p,{colour,seed,alpha,layers});}
function leaf(ctx,x,y,a,length,width,p,style,seed){
 const pts=Array.from({length:16},(_,i)=>{const t=i/15;return [x+Math.cos(a)*length*t-Math.sin(a)*Math.sin(t*Math.PI)*width,y+Math.sin(a)*length*t+Math.cos(a)*Math.sin(t*Math.PI)*width];});
 const back=Array.from({length:16},(_,i)=>{const t=1-i/15;return [x+Math.cos(a)*length*t+Math.sin(a)*Math.sin(t*Math.PI)*width*.8,y+Math.sin(a)*length*t-Math.cos(a)*Math.sin(t*Math.PI)*width*.8];});
 const contour=pts.concat(back);
 if(style!=='ink')fill(ctx,contour,p.leaf,seed,style==='colour'?.76:.36,16);
 mark(ctx,pts.concat(back.slice(0,6)),p.ink,.85,seed,.68,.45);
 mark(ctx,[[x,y],[x+Math.cos(a)*length,y+Math.sin(a)*length]],p.ink,.6,seed+12,.42,.6);
}
function plantSprite(u,p,style,index){
 const c=surface(140*u,215*u),ctx=c.getContext('2d');ctx.scale(u,u);ctx.translate(70,204);
 const random=rng(701+index*83),height=[35,59,91,117,144,74][index];
 const stem=curve([0,0],[-13+index*4,-height*.6],[Math.sin(index*2.1)*12,-height]);
 mark(ctx,stem,p.ink,index===4?1.7:1.35,70+index,.8,.38);
 const count=2+index%4;
 for(let j=0;j<count;j++){
  const t=.28+j/count*.58,at=stem[Math.floor(t*(stem.length-1))],side=j%2?1:-1;
  const angle=-Math.PI/2+side*(.65+random()*.45),l=15+random()*16+(index===2?7:0);
  leaf(ctx,at[0],at[1],angle,l,4+random()*3,p,style,300+index*50+j);
 }
 if(index===3||index===4){
  const top=stem[stem.length-1];
  for(let k=0;k<5;k++){
   const q=[top[0]+(k-2)*5,top[1]+Math.abs(k-2)*2];
   mark(ctx,curve(top,[q[0]+2,q[1]-13],[q[0]+(k-2)*1.6,q[1]-16]),p.ink,.8,550+k,.65,.6);
   const end=[q[0]+(k-2)*1.6,q[1]-16];
   if(style!=='ink')fill(ctx,ellipse(end[0],end[1],3,5,10),p.clay,680+k,.6,14);
   mark(ctx,arc(end[0],end[1],2.4,3.5,-2,3,14),p.ink,.9,606+k,.65,.3);
  }
 }
 if(index===5){for(let j=0;j<3;j++){const x=(j-1)*15,y=-24-j*7;mark(ctx,curve([0,-15],[x,y+7],[x,y-6]),p.ink,.8,200+j,.6);leaf(ctx,x,y-6,-1.8+j*.2,23,7,p,style,220+j);}}
 return c;
}
function stone(ctx,x,y,r,p,style,seed){
 const random=rng(seed),pts=ellipse(x,y,r,r*.48,12).map(([a,b],i)=>[a+(random()-.5)*r*.15,b+(random()-.5)*r*.12]);
 if(style!=='ink')fill(ctx,pts,p.stone,seed,.47,25);
 mark(ctx,pts.slice(0,10),p.ink,1.25,seed,.6,.55);
 mark(ctx,curve([x-r*.7,y],[x-r*.2,y-r*.36],[x+r*.4,y-r*.2]),p.ink,.8,seed+1,.25,.7);
 for(let i=0;i<3;i++)mark(ctx,[[x+r*(-.3+i*.2),y],[x+r*(-.5+i*.25),y+r*.18]],p.ink,.55,seed+3+i,.28,.7);
}
function lotus(ctx,x,y,r,p,style,seed){
 const pts=arc(x,y,r,r*.67,.45,TAU-.1,32).concat([[x-r*.08,y+r*.04],[x+r*.89,y+r*.18]]);
 if(style!=='ink')fill(ctx,pts,p.leaf,seed,style==='colour'?.62:.24,24);
 mark(ctx,pts,p.ink,1.1,seed,.66,.5);
 for(let i=0;i<5;i++)mark(ctx,curve([x,y],[x+Math.cos(i*1.1)*r*.5,y+Math.sin(i*1.1)*r*.25],[x+Math.cos(i*1.1)*r*.9,y+Math.sin(i*1.1)*r*.58]),p.ink,.65,seed+20+i,.37,.55);
}
export function pondGeometry(W,H){
 return {x:W*.055,y:H*.615,w:W*.89,h:H*(W<650?.245:.272)};
}
export function makeLandscape(W,H,light){
 const U=Math.min(W/530,H/820),portrait=W<650,dark=light==='night'||light==='dusk';
 const r=pondGeometry(W,H),paper=paperTexture(W,H,dark),styles=['ink','wash','colour'];
 const gardens=[],waters=[],sprigs=[];
 const plantXs=portrait?[.12,.2,.34,.59,.69,.79]:[.2,.255,.38,.62,.69,.75];
 const plantY=H*.555;
 for(const style of styles){
  const p=palette(light,style),c=surface(W,H),ctx=c.getContext('2d');
  // Disconnected ridgelines leave the mist as unpainted paper.
  const ridge1=[[W*.02,H*.32],[W*.12,H*.27],[W*.19,H*.23],[W*.24,H*.25],[W*.3,H*.2],[W*.38,H*.27],[W*.46,H*.28],[W*.55,H*.25],[W*.63,H*.27]];
  const ridge2=[[W*.37,H*.335],[W*.48,H*.31],[W*.55,H*.29],[W*.66,H*.305],[W*.75,H*.24],[W*.82,H*.265],[W*.89,H*.235],[W*.98,H*.32]];
  if(style!=='ink'){
   wash(ctx,ridge1.concat([[W*.64,H*.36],[W*.44,H*.385],[W*.16,H*.39],[-W*.05,H*.36]]),{colour:p.far,seed:93,alpha:style==='colour'?.27:.17,layers:38,softness:5,edgeVariance:ridge1.map(()=>.2).concat([2.8,3.2,3,2.5])});
   wash(ctx,ridge2.concat([[W*1.05,H*.385],[W*.81,H*.405],[W*.56,H*.4],[W*.36,H*.37]]),{colour:p.soft,seed:95,alpha:style==='colour'?.19:.13,layers:38,softness:5,edgeVariance:ridge2.map(()=>.2).concat([2.8,3.2,3.1,2.7])});
  }
  mark(ctx,ridge1,p.ink,.95*U,18,dark?.22:.23,.68);
  mark(ctx,ridge2.slice(1,8),p.ink,1.2*U,25,.25,.6);
  // Sparse rock-face strokes, an incomplete description rather than a contour map.
  for(let i=0;i<7;i++){const x=W*(.12+i*.105),y=H*(.278+Math.sin(i*2)*.021);mark(ctx,curve([x,y],[x-9*U,y+11*U],[x-19*U,y+18*U]),p.ink,.7*U,411+i,.12,.7);}
  if(dark)mark(ctx,arc(W*.77,H*.17,13*U,13*U,1.3,6.65,34),p.ink,1.2*U,321,.6,.65);
  const bed=[[W*.075,plantY+8*U],[W*.18,plantY-2*U],[W*.29,plantY+8*U],[W*.43,plantY-7*U],[W*.6,plantY-14*U],[W*.77,plantY-6*U],[W*.85,plantY+15*U],[W*.7,plantY+28*U],[W*.58,plantY+14*U],[W*.36,plantY+32*U],[W*.15,plantY+22*U]];
  if(style!=='ink')fill(ctx,bed,p.soil,75,style==='colour'?.29:.14,38);
  mark(ctx,curve([W*.07,plantY+17*U],[W*.25,plantY+39*U],[W*.43,plantY+24*U]),p.ink,1.15*U,442,.33,.65);
  mark(ctx,curve([W*.56,plantY+17*U],[W*.7,plantY+31*U],[W*.83,plantY+13*U]),p.ink,.9*U,449,.28,.65);
  mark(ctx,curve([W*.2,plantY-8*U],[W*.51,plantY-22*U],[W*.83,plantY+7*U]),p.ink,.85*U,443,.24,.7);
  // A modest trellis belongs to the back of this garden, not the whole world.
  const tx=W*(portrait?.59:.63),ty=plantY-24*U,tw=105*U,th=94*U;
  for(const side of [0,1])mark(ctx,[[tx+side*tw,ty],[tx+side*tw+2*U,ty-th]],p.ink,1.5*U,806+side,.48,.55);
  for(let k=1;k<=3;k++)mark(ctx,curve([tx-7*U,ty-th*k/4],[tx+tw*.4,ty-th*k/4+3*U],[tx+tw+7*U,ty-th*k/4-2*U]),p.ink,.8*U,810+k,.28,.65);
  const vine=curve([tx+tw*.1,ty],[tx+tw*.37,ty-th*.95],[tx+tw*.84,ty-th*.78]);
  mark(ctx,vine,p.ink,1.7*U,827,.7,.46);
  for(let j=3;j<vine.length-2;j+=4){const q=vine[j];leaf(ctx,q[0],q[1],-2.2+(j%3)*.8,18*U,4*U,p,style,843+j);}
  // Four irregular stones imply a route; they never become a decorative border.
  for(let i=0;i<4;i++)stone(ctx,W*(.16-i*.024),plantY+(46+i*22)*U,(12+i*2)*U,p,style,950+i);
  // The near shore is described by a few stones and reeds, not a closed frame.
  stone(ctx,W*.9,H*.798,27*U,p,style,883);
  stone(ctx,W*.846,H*.836,17*U,p,style,884);
  stone(ctx,W*.918,H*.845,34*U,p,style,885);
  for(let j=0;j<5;j++)mark(ctx,curve([W*.92,H*.81],[W*.91+(j-2)*9*U,H*.76],[W*.9+(j-2)*13*U,H*.728+Math.abs(j-2)*5*U]),p.ink,(1.4-j*.12)*U,900+j,.6,.45);
  gardens.push(c);
  sprigs.push(plantXs.map((x,i)=>({canvas:plantSprite(U,p,style,i),x:x*W,y:plantY+[3,-5,9,-1,-11,6][i]*U,owner:i})));
  const water=surface(W,H),wc=water.getContext('2d');
  if(style!=='ink'){
   fill(wc,ellipse(W*.49,H*.49,W*.61,H*.65,60),p.water,63,style==='colour'?.76:.19,40);
   fill(wc,ellipse(W*.67,H*.69,W*.54,H*.47,48),p.water,62,style==='colour'?.3:.08,32);
  }
  // Strokes are local to the water, prepared once, never noisy frame filters.
  for(let i=0;i<4;i++)mark(wc,curve([W*(.07+i*.16),H*(.33+i*.105)],[W*(.3+i*.1),H*(.26+i*.13)],[W*(.56+i*.1),H*(.31+i*.13)]),p.ink,.9,2001+i,style==='ink'?.12:.08,.7);
  lotus(wc,W*.18,H*.23,27*U,p,style,1200);
  lotus(wc,W*.8,H*.78,35*U,p,style,1300);
  waters.push(water);
 }
 return {paper,rect:r,paintLand(ctx,weights,wind,opacity=1){
  for(let i=0;i<3;i++)if(weights[i]>.001){ctx.save();ctx.globalAlpha=weights[i]*opacity;ctx.drawImage(gardens[i],0,0);for(const s of sprigs[i]){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(wind.sway(s.x,.022,s.owner*.23));ctx.drawImage(s.canvas,-s.canvas.width/2,-s.canvas.height);ctx.restore();}ctx.restore();}
 },paintWater(ctx,weights,rect){for(let i=0;i<3;i++)if(weights[i]>.001){ctx.save();ctx.globalAlpha=weights[i];ctx.drawImage(waters[i],rect.x,rect.y,rect.w,rect.h);ctx.restore();}},paintRim(ctx,weights,rect,open){
  if(open>.97)return;
  for(let i=0;i<3;i++)if(weights[i]>.001){const p=palette(light,styles[i]);ctx.save();ctx.globalAlpha=weights[i]*(1-open);mark(ctx,arc(rect.x+rect.w/2,rect.y+rect.h/2,rect.w*.495,rect.h*.48,2.83,4.66),p.ink,1.15*U,144,.35,.7);mark(ctx,arc(rect.x+rect.w/2,rect.y+rect.h/2,rect.w*.495,rect.h*.48,-.8,.54),p.ink,.95*U,145,.24,.7);ctx.restore();}
 }};
}
