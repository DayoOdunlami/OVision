// The crown adapts the space-colonisation algorithm demonstrated by Daniel
// Shiffman / Coding Train, MIT © 2022 Coding Train. See vendor/CodingTrain-LICENSE.txt.
// https://github.com/CodingTrain/Coding-Challenges/tree/main/017_SpaceColonizer/P5
// Original research: Runions, Lane & Prusinkiewicz (2007).
// Our additions: one connected bough per person, seeded crown envelopes, bounded
// growth, pipe-model taper, shaded paired leaves and roots shared at one trunk.

export const GROVE_SIZE = { w: 1000, h: 650 };
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export function groveRandom(seed = '') {
  let state = 2166136261;
  for (const c of String(seed)) { state ^= c.codePointAt(0); state = Math.imul(state, 16777619); }
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const len = (x, y) => Math.hypot(x, y) || 1;
const quad = (a, c, b, u) => ({ x: (1-u)**2*a.x + 2*(1-u)*u*c.x + u*u*b.x, y: (1-u)**2*a.y + 2*(1-u)*u*c.y + u*u*b.y });

// Geometry has a strict upper bound, independently of word length or elapsed time.
export function buildGrove(people = [], seed = '') {
  const family = people.filter((p) => p && p.id).slice(0, 16);
  const cast = family.length ? family : [{ id: '__shared', koi: '', kind: 'adult' }];
  const rand = groveRandom(`${seed}|${cast.map((p) => p.id).join('|')}`);
  const nodes = [], leaves = [], roots = [], owners = [], fruit = [];
  const base = { x: 500, y: 584 }, junction = { x: 505, y: 293 };
  const trunk = { a: base, c: { x: 460, y: 448 }, b: junction, width: 31 };

  cast.forEach((person, owner) => {
    const n = cast.length;
    const u = n === 1 ? 0.5 : owner / (n - 1);
    const cx = n === 1 ? 500 : 174 + u * 652;
    const cy = 167 + Math.abs(u - .5) * 64 + (rand() - .5) * 33;
    const radiusX = n <= 2 ? 155 : clamp(410 / n + 35, 65, 120);
    const radiusY = 102 + rand() * 28;
    const points = Array.from({ length: n > 8 ? 26 : 42 }, () => {
      const a = rand() * TAU, r = Math.sqrt(rand());
      return { x: clamp(cx + Math.cos(a)*radiusX*r, 58, 942), y: clamp(cy+Math.sin(a)*radiusY*r, 49, 337), reached: false };
    });
    const start = nodes.length;
    const entry = { x: cx + (rand()-.5)*18, y: cy+radiusY*.76 };
    const join = quad(trunk.a,trunk.c,trunk.b,.34+(1-Math.abs(u-.5)*2)*.43+(rand()-.5)*.09);
    const control = { x: join.x+(entry.x-join.x)*.66, y: join.y-(join.y-entry.y)*.12 };
    const scaffold = { a:join,c:control,b:entry };
    let parent = -1;
    for (let j=0; j<=9; j++) {
      const p=quad(join,control,entry,j/9);
      nodes.push({ ...p, parent, owner, tips: 1, radius: 2, scaffold: true });
      parent=nodes.length-1;
    }
    let tips = [parent];
    // Same grow/reset/consume structure as the reference. Growth searches only
    // this person's bough, and never more than 180 nodes or 58 generations.
    for (let generation=0; generation<58 && nodes.length-start<180; generation++) {
      const influence = new Map();
      for (const point of points) {
        if (point.reached) continue;
        let nearest=-1, record=145;
        for (let j=start+7;j<nodes.length;j++) {
          const node=nodes[j];
          if (node.owner!==owner) continue;
          const d=Math.hypot(point.x-node.x,point.y-node.y);
          if (d<15) { point.reached=true; nearest=-1; break; }
          if (d<record) { record=d; nearest=j; }
        }
        if (nearest>=0) {
          const node=nodes[nearest],dx=point.x-node.x,dy=point.y-node.y,mag=len(dx,dy);
          const pull=influence.get(nearest)||{ x:0,y:0,count:0 };
          pull.x+=dx/mag;pull.y+=dy/mag;pull.count++;
          influence.set(nearest,pull);
        }
      }
      if (!influence.size) break;
      const fresh=[];
      for (const [at,pull] of influence) {
        if (nodes.length-start>=180) break;
        const node=nodes[at];
        const previous=node.parent>=0?nodes[node.parent]:{x:node.x,y:node.y+8};
        let dx=pull.x/pull.count+(node.x-previous.x)*.013;
        let dy=pull.y/pull.count+(node.y-previous.y)*.013-.035;
        const m=len(dx,dy);dx=dx/m*9;dy=dy/m*9;
        if (Math.abs(dx)+Math.abs(dy)<1) continue;
        nodes.push({ x:node.x+dx,y:node.y+dy,parent:at,owner,tips:1,radius:1,scaffold:false });
        fresh.push(nodes.length-1);
      }
      if (!fresh.length) break;
      tips=fresh;
    }
    const end=nodes.length;
    const children=new Map();
    for(let j=start;j<end;j++)if(nodes[j].parent>=start)children.set(nodes[j].parent,(children.get(nodes[j].parent)||0)+1);
    const ends=[];
    for(let j=end-1;j>=start;j--) {
      const node=nodes[j];
      if(!children.has(j)&&!node.scaffold)ends.push(j);
      if(node.parent>=start)nodes[node.parent].tips+=node.tips;
      node.radius=clamp(Math.sqrt(node.tips)*.83, .75, 5.7);
    }
    // A sparse attractor pattern still gets a living tip, including one-person boards.
    if(!ends.length)ends.push(tips[0]??end-1);
    for(const index of ends) {
      const node=nodes[index],prev=nodes[node.parent]||junction;
      const heading=Math.atan2(node.y-prev.y,node.x-prev.x);
      const pairs=3+Math.floor(rand()*2);
      leaves.push({ x:node.x,y:node.y,angle:heading,owner,length:28+rand()*14,pairs,phase:rand()*TAU,tone:Math.floor(rand()*5),seed:rand() });
    }
    // A few interior sprigs make a canopy rather than a bare terminal diagram.
    for(let j=start+10;j<end;j+=7) {
      const node=nodes[j],prev=nodes[node.parent]||junction;
      leaves.push({ x:node.x,y:node.y,angle:Math.atan2(node.y-prev.y,node.x-prev.x)+(rand()-.5)*1.2,owner,length:23+rand()*11,pairs:2,phase:rand()*TAU,tone:Math.floor(rand()*5),seed:rand() });
    }
    const terminal=nodes[ends[Math.floor(ends.length*.6)]];
    fruit.push({x:terminal.x,y:terminal.y+9,owner,phase:rand()*TAU});
    const rootEnd={x:105+((owner+.5)/n)*790,y:622+(rand()-.5)*9};
    roots.push({owner,a:base,c:{x:(rootEnd.x+base.x)/2,y:625},b:rootEnd});
    owners.push({id:person.id,owner,koi:person.koi,kind:person.kind,from:start,to:end,root:join,scaffold,tip:{x:terminal.x,y:terminal.y},anchor:rootEnd,claimed:person.id!=='__shared'});
  });
  return { nodes,leaves,roots,owners,fruit,trunk,base,junction };
}

export function rootPoint(root, u) { return quad(root.a,root.c,root.b,clamp(u,0,1)); }
