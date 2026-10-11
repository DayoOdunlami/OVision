import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Bird2, SPECIES } from '../birds2.js';
import { buildPondMix, buildPondMixFromCounts } from '../../SpineFish.js';

// ═══════════════════════════════════════════════════════════════════
// Dusk 3D — the sky world in three dimensions (a preview: Pond settings
// → World → Dusk in 3D). Loaded only when chosen, so the rest of the app
// stays light.
//
//   · The birds are the same flight as the 2D sky (birds2.js: boids,
//     errands, glides and bursts), drawn as low-poly birds: a body, and
//     wings hinged at the shoulder and the wrist, flat-shaded so the
//     dusk light catches each beat. Height becomes real depth.
//   · Clouds are heaps of soft puffs at real depths in a dusk fog; they
//     part around a bird and close behind it, and slide past each other
//     with true parallax as the board scrolls.
//   · The words stay as they are (the page's own type, over the canvas),
//     and the zones still work: birds swell near the season word, take
//     the friction word's colour, and rock the commitments as they pass.
//
// Falls back to the 2D sky (onFail) when WebGL isn't there.
// ═══════════════════════════════════════════════════════════════════

const FOV = 40;
const SKY_TOP = new THREE.Color('#141a36');
const SKY_MID = new THREE.Color('#333a6a');
const SKY_LOW = new THREE.Color('#8a6a8c');
const FOG = new THREE.Color('#3b3f6e');
const CRIMSON = new THREE.Color('#c4381e');

function puffTexture() {
  const s = 128, c = document.createElement('canvas');
  c.width = c.height = s;
  const x = c.getContext('2d');
  // Soft disc, lit from below: warm underside, cool top.
  const lg = x.createLinearGradient(0, 0, 0, s);
  lg.addColorStop(0, '#a99cc8');
  lg.addColorStop(0.5, '#c4b3d6');
  lg.addColorStop(1, '#f6bf9c');
  x.fillStyle = lg;
  x.fillRect(0, 0, s, s);
  x.globalCompositeOperation = 'destination-in';
  const rg = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  rg.addColorStop(0, 'rgba(0,0,0,0.9)');
  rg.addColorStop(0.45, 'rgba(0,0,0,0.7)');
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = rg;
  x.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// A low-poly bird: body, and two wings each with an arm and a hand.
function makeBird(sp, span) {
  const g = new THREE.Group();
  const mat = (hex) => new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), flatShading: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
  const mats = { body: mat(sp.belly), wing: mat(sp.wing), tip: mat(sp.tip), head: mat(sp.head), beak: mat(sp.beak), accent: mat(sp.accent) };
  const L = span * (sp.neck ? 0.62 : 0.48);
  const half = span / 2;
  // Body: a stretched octahedron, nose forward (+x).
  const body = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), mats.body);
  body.scale.set(L * 0.32, L * 0.12, L * 0.11);
  g.add(body);
  const breast = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), mats.accent);
  breast.scale.set(L * 0.14, L * 0.115, L * 0.1);
  breast.position.x = L * 0.14;
  g.add(breast);
  const neck = sp.neck ? L * sp.neck : 0;
  if (neck) {
    const n = new THREE.Mesh(new THREE.CylinderGeometry(L * 0.03, L * 0.035, neck, 5), mats.head);
    n.rotation.z = Math.PI / 2;
    n.position.x = L * 0.2 + neck / 2;
    g.add(n);
  }
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(L * 0.085, 0), mats.head);
  head.position.x = L * 0.3 + neck;
  g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(L * 0.03, sp.neck ? L * 0.22 : L * 0.1, 4), mats.beak);
  beak.rotation.z = -Math.PI / 2;
  beak.position.x = head.position.x + L * 0.06 + (sp.neck ? L * 0.11 : L * 0.05);
  g.add(beak);
  // Tail: a flat fan or fork.
  const tl = sp.tail === 'fork' ? L * 0.62 : L * 0.36;
  const tw = L * 0.16;
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, -L * 0.06);
  if (sp.tail === 'fork') { tailShape.lineTo(-tl, -tw * 1.4); tailShape.lineTo(-tl * 0.42, 0); tailShape.lineTo(-tl, tw * 1.4); }
  else { tailShape.lineTo(-tl, -tw); tailShape.lineTo(-tl * 1.05, 0); tailShape.lineTo(-tl, tw); }
  tailShape.lineTo(0, L * 0.06);
  const tail = new THREE.Mesh(new THREE.ShapeGeometry(tailShape), mats.wing);
  tail.position.x = -L * 0.24;
  g.add(tail);

  // Wings: shoulder pivot → arm plate → wrist pivot → hand plate. In the
  // bird's frame +y is out along the right wing; the left is mirrored.
  const wings = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(L * 0.04, side * L * 0.06, 0);
    const arm = half * 0.42, hand = half * 0.6, chord = L * sp.chord;
    const armShape = new THREE.Shape();
    armShape.moveTo(L * 0.1, 0);
    armShape.lineTo(L * 0.06, side * arm);
    armShape.lineTo(-chord, side * arm);
    armShape.lineTo(-chord * 0.8, 0);
    const armMesh = new THREE.Mesh(new THREE.ShapeGeometry(armShape), mats.wing);
    shoulder.add(armMesh);
    const wrist = new THREE.Group();
    wrist.position.set(0, side * arm, 0);
    const handShape = new THREE.Shape();
    handShape.moveTo(L * 0.06, 0);
    handShape.lineTo(-chord * 0.2, side * hand);
    if (sp.fingers) {
      for (let i = 1; i <= sp.fingers; i++) {
        const k = i / (sp.fingers + 1);
        handShape.lineTo(-chord * (0.25 + 0.5 * k), side * hand * (1 - k * 0.45));
        handShape.lineTo(-chord * (0.18 + 0.5 * k), side * hand * (0.94 - k * 0.45));
      }
    }
    handShape.lineTo(-chord * 0.75, side * hand * 0.35);
    handShape.lineTo(-chord, 0);
    const handMesh = new THREE.Mesh(new THREE.ShapeGeometry(handShape), mats.tip);
    wrist.add(handMesh);
    shoulder.add(wrist);
    g.add(shoulder);
    return { side, shoulder, wrist };
  });
  return { group: g, wings, mats, base: Object.fromEntries(Object.entries(mats).map(([k, m]) => [k, m.color.clone()])) };
}

export default function Dusk3D({ fishMin = 3, fishMax = 5, mix = null, namedKoi = [], onFail }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    } catch {
      onFail?.();
      return undefined;
    }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(FOG, 600, 2600);
    const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 6000);

    // Sky: a gradient dome behind everything, with a warm glow low down.
    const skyMat = new THREE.ShaderMaterial({
      depthWrite: false, fog: false,
      uniforms: { top: { value: SKY_TOP }, mid: { value: SKY_MID }, low: { value: SKY_LOW } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 low; varying vec3 vP;
        void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.5, h)) : mix(mid, low, smoothstep(0.0, 0.45, -h));
        gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(5000, 24, 16), skyMat);
    scene.add(sky);

    // Stars, far off.
    const starGeo = new THREE.BufferGeometry();
    const sp = [];
    for (let i = 0; i < 260; i++) {
      const a = Math.random() * Math.PI * 2, y = 0.15 + Math.random() * 0.85;
      const r = 4600;
      sp.push(Math.cos(a) * r * Math.sqrt(1 - y * y), y * r, -Math.abs(Math.sin(a) * r * Math.sqrt(1 - y * y)) - 800);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xfff3dc, size: 2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.7 }));
    scene.add(stars);

    // Dusk light: a cool sky above, warm glow from below the horizon.
    scene.add(new THREE.HemisphereLight(0x9aa0e0, 0xf2a070, 1.6));
    const sun = new THREE.DirectionalLight(0xffc49a, 1.4);
    sun.position.set(-0.3, -1, 0.6);
    scene.add(sun);

    // ── Birds: the 2D sky's flight, in 3D ──────────────────────────
    let W = 1, H = 1, dist = 1;
    const size = () => {
      W = Math.max(1, el.clientWidth); H = Math.max(1, el.clientHeight);
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      // The z = 0 plane maps one-to-one onto the screen.
      dist = (H / 2) / Math.tan((FOV * Math.PI) / 360);
      camera.position.set(0, 0, dist);
      camera.updateProjectionMatrix();
    };
    size();
    const hasCounts = mix && Object.values(mix).reduce((a, b) => a + (b | 0), 0) > 0;
    const varieties = hasCounts ? buildPondMixFromCounts(mix)
      : buildPondMix(Math.max(fishMin, Math.min(fishMax, Math.round((W * H) / 260000))));
    for (const n of namedKoi || []) if (!varieties.some((v) => v.name === n.koi)) varieties.push(...buildPondMixFromCounts({ [n.koi]: 1 }));
    const sizeFactor = Math.max(0.6, Math.min(1, W / 1000));
    const sims = varieties.map((v) => new Bird2(W, H, { ...v, sizeScale: (v.sizeScale || 1) * sizeFactor * 1.45 }));
    sims.forEach((b) => b.joinFlock(sims));
    const birds = sims.map((b) => {
      const m = makeBird(SPECIES[b.kind], b.span);
      scene.add(m.group);
      return { sim: b, ...m };
    });

    // ── Clouds: heaps of soft puffs at real depths ─────────────────
    const tex = puffTexture();
    const clouds = [];
    const puffMat = (o) => new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: o, depthWrite: false, fog: true });
    const layers = [{ z: -1600, n: 4, s: 1.8, o: 0.55 }, { z: -650, n: 3, s: 1.0, o: 0.6 }, { z: -150, n: 3, s: 0.62, o: 0.55 }, { z: 300, n: 2, s: 0.32, o: 0.16 }];
    for (const l of layers) {
      for (let i = 0; i < l.n; i++) {
        const grp = new THREE.Group();
        const scaleAt = (dist - l.z) / dist;
        const cx = (Math.random() - 0.5) * W * scaleAt * 1.4, cy = (Math.random() - 0.5) * H * scaleAt * 2.2;
        const w = (220 + Math.random() * 200) * l.s;
        const n = 14 + Math.floor(Math.random() * 8);
        const puffs = [];
        for (let k = 0; k < n; k++) {
          const u = Math.random() - 0.5;
          const body = 1 - Math.abs(u) * 1.6;
          const r = (60 + body * 90 + Math.random() * 40) * l.s;
          const s = new THREE.Sprite(puffMat(l.o));
          const home = new THREE.Vector3(u * w, Math.min(r * 0.2, -r * 0.4 * body * Math.random() + r * 0.25), (Math.random() - 0.5) * 80 * l.s);
          s.position.copy(home);
          s.scale.set(r * 2, r * 1.7, 1);
          grp.add(s);
          puffs.push({ s, home, off: new THREE.Vector3(), vel: new THREE.Vector3(), r });
        }
        grp.position.set(cx, cy, l.z + (Math.random() - 0.5) * 120);
        scene.add(grp);
        clouds.push({ grp, puffs, v: (0.05 + Math.random() * 0.08) * l.s, span: W * scaleAt * 1.8, baseY: cy });
      }
    }

    // ── Zones: swell, colour, and the wake the pads feel ──────────
    let targets = { full: [], marrow: [] }, refresh = 0;
    const readTargets = () => {
      const full = [], marrow = [];
      document.querySelectorAll('[data-full-attractor]').forEach((n) => {
        const r = n.getBoundingClientRect();
        full.push({ cx: r.left + r.width / 2, cy: r.top + r.height / 2, radius: Math.max(360, Math.min(680, r.width * 1.15)), max: Number(n.dataset.fullMax) || 1.85 });
      });
      document.querySelectorAll('[data-marrow-attractor]').forEach((n) => {
        const r = n.getBoundingClientRect();
        marrow.push({ cx: r.left + r.width / 2, cy: r.top + r.height / 2, radius: Math.max(320, Math.min(560, r.width * 1.05)) });
      });
      targets = { full, marrow };
    };
    const tmp = new THREE.Vector3();
    const toScreen = (v) => { tmp.copy(v).project(camera); return [(tmp.x + 1) / 2 * W, (1 - tmp.y) / 2 * H]; };

    let cur = { x: -9999, y: -9999 };
    const onMove = (e) => { cur = { x: e.clientX, y: e.clientY }; };
    const onLeave = () => { cur = { x: -9999, y: -9999 }; };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);

    let raf = 0, t = 0, dead = false;
    const frame = () => {
      if (dead) return;
      t++;
      const scrollY = window.scrollY || 0;
      if (t - refresh > 12) { refresh = t; readTargets(); }
      // Scrolling moves the camera down the sky: near clouds slide past
      // faster than far ones. Birds keep their place on screen.
      const camY = -scrollY * 0.35;
      camera.position.y = camY + Math.sin(t * 0.0015) * 6;
      camera.position.x = Math.sin(t * 0.0011) * 10;
      camera.lookAt(camera.position.x * 0.5, camY, 0);

      const ambient = [];
      for (const b of birds) {
        const s = b.sim;
        if (!reduced) s.update(W, H, cur, {});
        // Height is depth: high birds are further away.
        const z = 120 - s.depth * 900;
        const k = (dist - z) / dist;   // keep it where the 2D sky would put it
        b.group.position.set((s.x - W / 2) * k, (H / 2 - s.y) * k + camY, z);
        b.group.rotation.set(0, 0, 0);
        b.group.rotateZ(-s.dir);
        b.group.rotateX(-s.bank * 0.7);
        // Wings: the beat (shoulder), the fold (wrist) on the upstroke.
        const e = Math.sin(s.phase), up = Math.max(0, Math.cos(s.phase)), g = s.glide;
        for (const w of b.wings) {
          w.shoulder.rotation.x = w.side * (e * 0.9 * (1 - g) + g * 0.12);
          w.wrist.rotation.x = w.side * (e * 0.5 * (1 - g) - g * 0.05);
          w.wrist.rotation.z = w.side * up * (1 - g) * 0.9;
        }
        // Swell near the season word; colour near the friction word.
        let swell = 1, heat = 0;
        for (const f of targets.full) {
          const d = Math.hypot(s.x - f.cx, s.y - f.cy);
          if (d < f.radius) { const u = 1 - d / f.radius; swell = Math.max(swell, 1 + (f.max - 1) * u * u * (3 - 2 * u)); }
        }
        for (const m of targets.marrow) {
          const d = Math.hypot(s.x - m.cx, s.y - m.cy);
          if (d < m.radius) heat = Math.max(heat, 1 - d / m.radius);
        }
        b.group.scale.setScalar(swell);
        for (const [key, mat] of Object.entries(b.mats)) mat.color.copy(b.base[key]).lerp(CRIMSON, heat * 0.7);
        // What the pads and the identity word's particles feel.
        const [sx, sy] = toScreen(b.group.position);
        const r = s.span * 0.25 * swell * k;
        ambient.push({ x: sx, y: sy, r }, { x: sx + Math.cos(s.dir) * r, y: sy + Math.sin(s.dir) * r, r: r * 0.6 });
      }
      window.__ambientFish = ambient;

      // Clouds drift; puffs near a bird are pushed aside, then return.
      for (const c of clouds) {
        if (!reduced) c.grp.position.x += c.v;
        if (c.grp.position.x > c.span / 2 + 400) c.grp.position.x = -c.span / 2 - 400;
        for (const p of c.puffs) {
          for (const b of birds) {
            tmp.copy(p.home).add(p.off).add(c.grp.position).sub(b.group.position);
            const reach = p.r + b.sim.span * 0.6;
            const d = tmp.length();
            if (d < reach && d > 0) p.vel.addScaledVector(tmp, ((1 - d / reach) * 0.9) / d);
          }
          p.vel.addScaledVector(p.off, -0.012).multiplyScalar(0.9);
          p.off.add(p.vel).clampLength(0, p.r * 1.2);
          p.s.position.copy(p.home).add(p.off);
        }
      }

      renderer.render(scene, camera);
      if (!reduced) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onResize = () => { size(); };
    window.addEventListener('resize', onResize);
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
    };
    document.addEventListener('visibilitychange', onVis);
    const onLost = (e) => { e.preventDefault(); onFail?.(); };
    renderer.domElement.addEventListener('webglcontextlost', onLost);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      scene.traverse((o) => { o.geometry?.dispose?.(); if (o.material) [].concat(o.material).forEach((m) => m.dispose()); });
      tex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      window.__ambientFish = [];
    };
  }, [fishMin, fishMax, mix, namedKoi, onFail]);

  return <div ref={ref} aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}
