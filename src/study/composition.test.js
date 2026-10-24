import test from 'node:test';
import assert from 'node:assert/strict';
import {readSwitches,scrollPond,pondView,gardenView,switchNames} from './composition.js';
test('every upgrade has an independent URL switch, with unknown names ignored',()=>{
 for(const name of switchNames){const s=readSwitches('?off='+name+',unknown');assert.equal(s[name],false);assert.equal(Object.values(s).filter(Boolean).length,7);}
 assert.equal(Object.values(readSwitches('?off=wet,garden')).filter(Boolean).length,6);
});
test('pond stays elliptical and native fish scale is reached continuously at either size',()=>{
 for(const [W,H] of [[390,844],[1180,820]]){
  const rect=scrollPond(W,H);assert.equal(rect.h/rect.w,.52);
  let previous=pondView(W,H,rect,0);
  assert.equal(previous.sy/previous.sx,.52);assert.ok(previous.sx<.4);
  for(let i=1;i<=100;i++){
   const view=pondView(W,H,rect,i/100);assert.equal(view.ellipse,true);
   assert.ok(view.sx>=previous.sx&&view.sy>=previous.sy);assert.ok(view.rect.w>=previous.rect.w);
   assert.ok(Math.abs(view.tx-previous.tx)<W*.02);previous=view;
  }
  assert.equal(previous.sx,1);assert.equal(previous.sy,1);
  assert.ok(previous.rect.x<0&&previous.rect.y<0&&previous.rect.x+previous.rect.w>W&&previous.rect.y+previous.rect.h>H);
  const small=pondView(W,H,rect,1,{fullsize:false});assert.ok(small.sx<.4);assert.equal(small.sx,small.sy);
  const flat=pondView(W,H,rect,0,{squash:false});assert.equal(flat.sx,flat.sy);
  assert.equal(pondView(W,H,rect,.5,{arrival:false}).ellipse,false);
 }
});
test('garden enlarges one uniform drawing without recreation or perspective',()=>{
 for(const [W,H] of [[390,844],[1180,820]]){const a=gardenView(W,H,0),b=gardenView(W,H,1);assert.equal(a.scale,.47);assert.deepEqual(b,{scale:1,tx:0,ty:0,rect:{x:0,y:0,w:W,h:H}});}
});
