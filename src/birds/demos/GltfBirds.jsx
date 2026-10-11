import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { duskBackdrop, fitRenderer } from './stage.js';

// Artist-animated birds: the Parrot, Flamingo and Stork that ship with
// three.js's examples (from the "ro.me" project by mirada; distributed in
// the MIT three.js repo). Their wingbeats are keyframed by an animator
// (morph targets), so the motion is a performance, not a formula.
//
// Here they're driven by our kind of steering, to show it fits: each bird
// wanders and circles, banks into its turns, and its wingbeat speeds up
// with effort or pauses into a glide. A finger scatters them.
export const ROME = [
  { file: 'Flamingo.glb', n: 2, size: 420 },
  { file: 'Parrot.glb', n: 2, size: 260 },
  { file: 'Stork.glb', n: 2, size: 440 },
];

// Quaternius's low-poly eagle (CC0), rigged with a flying clip.
// Its colours don't survive the FBX file, so they're given here (a bald
// eagle: brown wings, white head, gold beak and claws), flat-shaded as
// it was made.
export const EAGLE = [{
  file: 'Eagle.fbx', n: 4, size: 240, clip: /Flying/i, flat: true,
  palette: { Wings: '#5b3b22', Head: '#f1ece2', Beak: '#e0a43a', Claws: '#e0a43a' },
}];

export default function GltfBirds({ controls, models = ROME }) {
  const ref = useRef(null);
  const ctl = useRef(controls);
  ctl.current = controls;

  useEffect(() => {
    const el = ref.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 10, 8000);
    const { dispose: disposeSky } = duskBackdrop(scene);
    scene.add(new THREE.HemisphereLight(0xa8b0ff, 0xffa36b, 2.2));
    const sun = new THREE.DirectionalLight(0xffd2a8, 2.2);
    sun.position.set(-1, -0.6, 1);
    scene.add(sun);
    const size = fitRenderer(renderer, camera, el);

    const birds = [];
    const loader = new GLTFLoader();
    let dead = false;
    const fbx = new FBXLoader();
    for (const m of models) {
      const isFbx = m.file.endsWith('.fbx');
      (isFbx ? fbx : loader).load(`/models/birds/${m.file}`, (res) => {
        if (dead) return;
        const root = isFbx ? res : res.scene.children[0];
        const clips = res.animations || [];
        const clip = (m.clip && clips.find((c) => m.clip.test(c.name))) || clips[0];
        for (let i = 0; i < m.n; i++) {
          const mesh = SkeletonUtils.clone(root);
          const fix = (x) => {
            const c = x.clone();
            if (m.palette?.[c.name]) c.color = new THREE.Color(m.palette[c.name]);
            if (m.flat) { c.flatShading = true; c.shininess = 4; c.needsUpdate = true; }
            return c;
          };
          mesh.traverse((o) => { if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map(fix) : fix(o.material); });
          const box = new THREE.Box3().setFromObject(mesh);
          const k = m.size / Math.max(1, box.getSize(new THREE.Vector3()).length());
          mesh.scale.setScalar(k);
          const holder = new THREE.Group();   // heading + bank
          holder.add(mesh);
          scene.add(holder);
          const mixer = new THREE.AnimationMixer(mesh);
          const action = mixer.clipAction(clip).setDuration(1).play();
          if (m.turn) mesh.rotation.y = m.turn;
          action.time = Math.random();
          const { W, H } = size();
          birds.push({
            holder, mesh, mixer, action,
            x: (Math.random() - 0.5) * W, y: (Math.random() - 0.5) * H, z: -40 - Math.random() * 380,
            dir: Math.random() * Math.PI * 2, speed: 2, bank: 0,
            target: null, circle: 0, glide: 0, glideT: 100 + Math.random() * 200,
          });
        }
      });
    }

    let cur = null;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      cur = { x: e.clientX - r.left - r.width / 2, y: r.height / 2 - (e.clientY - r.top) };
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', () => { cur = null; });

    const clock = new THREE.Clock();
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, clock.getDelta());
      const { W, H } = size();
      const c = ctl.current || {};
      for (const b of birds) {
        // Errands: a point to fly to, then circle a while.
        if (!b.target || Math.hypot(b.target.x - b.x, b.target.y - b.y) < 80) {
          if (b.target && !b.circle) b.circle = 200 + Math.random() * 300;
          b.target = { x: (Math.random() - 0.5) * W * 0.8, y: (Math.random() - 0.5) * H * 0.7 };
        }
        let want = Math.atan2(b.target.y - b.y, b.target.x - b.x);
        if (b.circle > 0) { b.circle--; want = b.dir + 0.012; }
        let effort = 0;
        if (cur && Math.hypot(cur.x - b.x, cur.y - b.y) < 220) {
          want = Math.atan2(b.y - cur.y, b.x - cur.x);
          effort = 1;
          b.circle = 0;
        }
        let d = want - b.dir;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        const turn = Math.max(-0.035, Math.min(0.035, d * 0.05));
        b.dir += turn;
        b.bank += (turn * 18 - b.bank) * 0.06;
        const sp = (c.speed ?? 1) * (1.6 + effort * 2.5);
        b.speed += (sp - b.speed) * 0.05;
        b.x += Math.cos(b.dir) * b.speed;
        b.y += Math.sin(b.dir) * b.speed;
        // Glide now and then (or always, if asked); flap with effort.
        if (--b.glideT <= 0) { b.glide = b.glide ? 0 : 1; b.glideT = b.glide ? 90 + Math.random() * 120 : 160 + Math.random() * 300; }
        const gliding = c.glide === 'always' || (c.glide !== 'never' && b.glide && !effort);
        b.action.timeScale += ((gliding ? 0 : (c.flap ?? 1) * (0.8 + effort * 0.8)) - b.action.timeScale) * 0.08;
        if (gliding && b.action.timeScale < 0.05) {
          // Hold the wings open: ease toward the outstretched pose.
          b.action.time += (0.15 - b.action.time) * 0.08;
        }
        b.mixer.update(dt);
        // Place it: the model faces +z, so turn it to the heading in the
        // screen plane, nose slightly toward us, banked into the turn.
        b.holder.position.set(b.x, b.y, b.z);
        b.holder.rotation.set(0, 0, 0);
        b.holder.rotateZ(b.dir);
        b.holder.rotateY(Math.PI / 2);
        b.holder.rotateZ(-b.bank * 0.8);
        b.holder.rotateX(-0.35);
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      disposeSky();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={ref} className="bd-stage" />;
}
