import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGrove, rootPoint } from './groveGeometry.js';

const people=Array.from({length:6},(_,i)=>({id:`p${i}`,kind:i<2?'adult':'child',koi:'kohaku'}));
test('the same household and word produce the same connected canopy',()=>{
 const tree=buildGrove(people,'Welcome');
 assert.deepEqual(tree,buildGrove(people,'Welcome'));
 assert.equal(tree.owners.length,6);
 for(const owner of tree.owners){
  assert.equal(tree.nodes[owner.from].x,owner.root.x);
  assert.equal(tree.nodes[owner.from].y,owner.root.y);
  assert.ok(owner.root.y>tree.junction.y && owner.root.y<tree.base.y);
  assert.ok(tree.leaves.some(l=>l.owner===owner.owner));
 }
 for(const root of tree.roots)assert.deepEqual(rootPoint(root,0),tree.base);
});
test('arbitrary words seed intended finite geometry, not a word-specific lookup',()=>{
 for(const word of ['Hospitality','Sabbath','Brave','共同','A word we made up']){
  const tree=buildGrove(people,word);
  assert.ok(tree.nodes.length>60);
  for(const node of tree.nodes)assert.ok(Number.isFinite(node.x)&&Number.isFinite(node.y)&&node.radius>0);
 }
 assert.notDeepEqual(buildGrove(people,'Rest').leaves,buildGrove(people,'Give').leaves);
});
test('large and empty households remain bounded and connected',()=>{
 const crowded=buildGrove(Array.from({length:40},(_,i)=>({id:String(i)})),'Together');
 assert.equal(crowded.owners.length,16);
 assert.ok(crowded.nodes.length<=16*180);
 const empty=buildGrove([],'Welcome');
 assert.equal(empty.owners.length,1);
 assert.equal(empty.owners[0].claimed,false);
 assert.ok(empty.leaves.length>0);
});
