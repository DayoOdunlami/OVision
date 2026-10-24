// Pure framing keeps the same drawing throughout an arrival and its reverse.
const mix=(a,b,t)=>a+(b-a)*t;
export const switchNames=Object.freeze(['wet','pigment','birds','squash','fullsize','arrival','touch','garden']);
export function readSwitches(search=''){
 const p=new URLSearchParams(search),off=new Set((p.get('off')||'').split(','));
 return Object.fromEntries(switchNames.map(name=>[name,!off.has(name)]));
}
export function scrollPond(W,H){
 const w=Math.min(W*.89,H*.72),h=w*.52;
 return {x:(W-w)/2,y:H*.605,w,h};
}
// Match PondView's current adult-koi construction rule, rather than T1's fixed .6.
export function fishSize(W,H,fullsize=true){return fullsize?Math.max(.62,Math.min(1.15,Math.min(W,H)/720))*1.05:.6;}
export function pondView(W,H,r0,open,{squash=true,fullsize=true,arrival=true}={}){
 const p=Math.max(0,Math.min(1,open));
 const radius=Math.hypot(W/2,H/2)+12;
 const end=arrival?{x:W/2-radius,y:H/2-radius,w:radius*2,h:radius*2}:{x:0,y:0,w:W,h:H};
 const rect=Object.fromEntries(['x','y','w','h'].map(k=>[k,mix(r0[k],end[k],p)]));
 const nativeSize=fishSize(W,H,fullsize);
 const small=(squash?Math.min(.36,r0.w/W*.72):r0.w/W*.7)*.6/nativeSize;
 const final=1;
 const sx=mix(small,final,p),sy=mix(small*(squash?.52:1),final,p);
 const cx=mix(r0.x+r0.w/2,W/2,p),cy=mix(r0.y+r0.h/2,H/2,p);
 return {rect,sx,sy,nativeSize,tx:cx-W*sx/2,ty:cy-H*sy/2,ellipse:arrival};
}
export function gardenView(W,H,open){
 const p=Math.max(0,Math.min(1,open)),s=mix(.47,1,p);
 return {scale:s,tx:W*(1-s)/2,ty:mix(H*.47-H*.555*.47,0,p),rect:{x:0,y:H*.335*(1-p),w:W,h:H*(.28+.72*p)}};
}
