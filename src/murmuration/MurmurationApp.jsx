import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { POSITION, VELOCITY, BIRD_VS, BIRD_FS } from './flock.js';
import { boardWords, pickWord, sampleWord } from './words.js';
import { hourNow, lightAt, paintSky, Reeds } from './sky.js';

// ═══════════════════════════════════════════════════════════════════
// Murmuration — the board's words, written by a flock of starlings at
// dusk. See docs/murmuration-brief.md for the why of every choice here.
//
// One cycle:  free (the flock pours and folds over the reeds)
//          →  gather (birds stream in and write the word left to right)
//          →  hold (it sharpens as you look; the verse may come beneath)
//          →  release (they lift out of it, left to right, and rejoin)
//
// Brush the sky and they scatter (or gather, in Options). Press and hold
// to call the next word.
// ═══════════════════════════════════════════════════════════════════

const OPT_KEY = 'mm.options';
const DEFAULTS = {
  words: 'board', writing: 'written', almost: true, pace: 'patient', touch: 'scatter',
  verse: true, lit: true, breathe: false, ink: false, clock: true, lettering: 'sans', guide: true,
};
const readOpts = () => {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(OPT_KEY) || '{}') }; } catch { return { ...DEFAULTS }; }
};
const HINT_KEY = 'mm.hinted';

// A starling: a slim body and swept, pointed wings (three triangles, the
// wingtips — vertices 4 and 7 — beat in the shader).
function birdGeometry(N, WIDTH, size = 0.17) {
  const g = new THREE.BufferGeometry();
  const points = N * 9;
  const vertices = new Float32Array(points * 3);
  const references = new Float32Array(points * 2);
  const birdVertex = new Float32Array(points);
  let v = 0;
  const push = (...a) => { for (const x of a) vertices[v++] = x; };
  for (let f = 0; f < N; f++) {
    push(0, -1, -15, 0, 2.5, -11, 0, 0, 24);       // body
    push(0, 0, -9, -24, 0, -9, 0, 0, 11);           // left wing, tip swept back
    push(0, 0, 11, 24, 0, -9, 0, 0, -9);            // right wing
  }
  for (let i = 0; i < points; i++) {
    const bi = Math.floor(i / 9);
    references[i * 2] = (bi % WIDTH) / WIDTH;
    references[i * 2 + 1] = Math.floor(bi / WIDTH) / WIDTH;
    birdVertex[i] = i % 9;
  }
  g.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  g.setAttribute('reference', new THREE.BufferAttribute(references, 2));
  g.setAttribute('birdVertex', new THREE.BufferAttribute(birdVertex, 1));
  g.scale(size, size, size);
  return g;
}

const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;

export default function MurmurationApp() {
  const bgRef = useRef(null);
  const glRef = useRef(null);
  const guideRef = useRef(null);
  const reedsRef = useRef(null);
  const [opts, setOptsRaw] = useState(readOpts);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const setOpt = (k, v) => {
    const next = { ...optsRef.current, [k]: v };
    setOptsRaw(next);
    try { localStorage.setItem(OPT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const [panel, setPanel] = useState(false);
  const [idle, setIdle] = useState(false);
  const [verse, setVerse] = useState(null);       // { text, ref } while showing
  const [said, setSaid] = useState('');           // for screen readers
  const [hint, setHint] = useState('');
  const [light, setLight] = useState(() => lightAt(hourNow(), readOpts().clock));
  const [owner, setOwner] = useState('');
  const callRef = useRef(null);

  // The chrome fades when nobody's touching.
  useEffect(() => {
    let t = 0;
    const wake = () => { setIdle(false); clearTimeout(t); t = setTimeout(() => setIdle(true), 4000); };
    wake();
    window.addEventListener('pointermove', wake, { passive: true });
    window.addEventListener('pointerdown', wake, { passive: true });
    window.addEventListener('keydown', wake);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
    };
  }, []);

  // The light follows the clock.
  useEffect(() => {
    const tick = () => setLight(lightAt(hourNow(), optsRef.current.clock));
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [opts.clock]);

  // Paint the sky and reeds when the light or the size changes.
  useEffect(() => {
    const c = bgRef.current;
    const paint = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(innerWidth * dpr); c.height = Math.round(innerHeight * dpr);
      const x = c.getContext('2d');
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintSky(x, innerWidth, innerHeight, light);
    };
    paint();
    window.addEventListener('resize', paint);
    return () => window.removeEventListener('resize', paint);
  }, [light]);

  // The reeds stir: redrawn about 30 times a second (still, for reduced
  // motion), laid out again when the light or the size changes.
  useEffect(() => {
    const c = reedsRef.current, x = c.getContext('2d');
    const reeds = new Reeds();
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const lay = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(innerWidth * dpr); c.height = Math.round(innerHeight * dpr);
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      reeds.layout(innerWidth, innerHeight, light);
      reeds.draw(x, performance.now() / 1000);
    };
    lay();
    let raf = 0, last = 0;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;
      last = now;
      reeds.draw(x, now / 1000);
    };
    if (!reduced) raf = requestAnimationFrame(loop);
    window.addEventListener('resize', lay);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', lay); };
  }, [light]);

  // ── The flock ────────────────────────────────────────────────────
  useEffect(() => {
    const el = glRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    } catch {
      setHint('This device can’t show the murmuration (no WebGL).');
      return undefined;
    }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;
    el.appendChild(renderer.domElement);

    // Smaller flocks on small or modest devices.
    const small = innerWidth < 800 || (navigator.deviceMemory && navigator.deviceMemory <= 4);
    const WIDTH = small ? 32 : 40;
    const N = WIDTH * WIDTH;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 1, 6000);
    // The frame: about 900 world units across (more on a wide screen),
    // so a word is the same size relative to the birds on any screen.
    let V = 900, Hv = 600;
    const frame = () => {
      const W = el.clientWidth || innerWidth, H = el.clientHeight || innerHeight;
      const aspect = W / H;
      V = Math.max(900, 620 * aspect);
      Hv = V / aspect;
      renderer.setSize(W, H, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = aspect;
      camera.position.set(0, 0, (Hv / 2) / Math.tan((camera.fov * Math.PI) / 360));
      camera.updateProjectionMatrix();
    };
    frame();

    // GPU flock (three.js webgl_gpgpu_birds, MIT).
    const gpu = new GPUComputationRenderer(WIDTH, WIDTH, renderer);
    const pos0 = gpu.createTexture(), vel0 = gpu.createTexture();
    for (let k = 0, a = pos0.image.data; k < a.length; k += 4) {
      a[k] = (Math.random() - 0.5) * V * 0.8;
      a[k + 1] = (Math.random() - 0.5) * Hv * 0.5;
      a[k + 2] = -150 + (Math.random() - 0.5) * 300;
      a[k + 3] = Math.random() * 62;
    }
    for (let k = 0, a = vel0.image.data; k < a.length; k += 4) {
      a[k] = (Math.random() - 0.5) * 10; a[k + 1] = (Math.random() - 0.5) * 6; a[k + 2] = (Math.random() - 0.5) * 6; a[k + 3] = 1;
    }
    const velV = gpu.addVariable('textureVelocity', VELOCITY, vel0);
    const posV = gpu.addVariable('texturePosition', POSITION, pos0);
    gpu.setVariableDependencies(velV, [posV, velV]);
    gpu.setVariableDependencies(posV, [posV, velV]);
    const targetData = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) targetData[i * 4 + 3] = -1;
    const targetTex = new THREE.DataTexture(targetData, WIDTH, WIDTH, THREE.RGBAFormat, THREE.FloatType);
    targetTex.needsUpdate = true;
    const pu = posV.material.uniforms, vu = velV.material.uniforms;
    pu.time = { value: 0 }; pu.delta = { value: 0 };
    Object.assign(vu, {
      time: { value: 0 }, delta: { value: 0 },
      separationDistance: { value: 18 }, alignmentDistance: { value: 22 }, cohesionDistance: { value: 22 },
      predator: { value: new THREE.Vector3(1e5, 1e5, 0) }, predatorSign: { value: 1 }, predatorRadius: { value: 140 },
      home: { value: new THREE.Vector3() }, homeCenter: { value: new THREE.Vector3() },
      textureTarget: { value: targetTex }, pull: { value: 0 }, formT: { value: 0 }, releaseT: { value: -1 },
      shimmer: { value: 6 }, targetCenter: { value: new THREE.Vector2() }, targetScale: { value: 1 }, calm: { value: 0 },
    });
    velV.wrapS = velV.wrapT = posV.wrapS = posV.wrapT = THREE.RepeatWrapping;
    const err = gpu.init();
    if (err) { console.error(err); setHint('This device can’t show the murmuration.'); }

    const birdUniforms = {
      texturePosition: { value: null }, textureVelocity: { value: null }, textureTarget: { value: targetTex },
      pull: { value: 0 }, formT: { value: 0 }, releaseT: { value: -1 },
      birdColor: { value: new THREE.Color() }, hazeColor: { value: new THREE.Color() }, litColor: { value: new THREE.Color() },
      lit: { value: 0.45 }, zNear: { value: 80 }, zFar: { value: -480 },
    };
    // Slightly smaller birds on a narrow screen, where the word is small.
    const portrait = innerWidth < innerHeight;
    const birds = new THREE.Mesh(birdGeometry(N, WIDTH, portrait ? 0.15 : 0.17), new THREE.ShaderMaterial({
      uniforms: birdUniforms, vertexShader: BIRD_VS, fragmentShader: BIRD_FS, side: THREE.DoubleSide,
    }));
    birds.rotation.y = Math.PI / 2;
    birds.matrixAutoUpdate = false;
    birds.updateMatrix();
    birds.frustumCulled = false;
    scene.add(birds);

    // Ink: instead of clearing, fade what was drawn, so each bird leaves
    // a trail that thins away behind it.
    const fadeScene = new THREE.Scene();
    const fadeCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const fadeMat = new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.1, depthTest: false, depthWrite: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.ZeroFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    });
    fadeScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fadeMat));

    // ── Words ──────────────────────────────────────────────────────
    let words = [], last = null, count = 0;
    let fontReady = false;
    boardWords().then((b) => { words = b.words; setOwner([b.owner, b.period].filter(Boolean).join(' · ')); });
    Promise.all([document.fonts?.load?.('600 220px "Manrope"'), document.fonts?.load?.('italic 800 220px "Fraunces"')].filter(Boolean))
      .then(() => { fontReady = true; }).catch(() => { fontReady = true; });

    // Where every bird is, read back from the GPU once per word, so each
    // can be given the slot nearest in order (they stream, not cross).
    const buf = new Float32Array(N * 4);
    const readPositions = () => {
      try {
        renderer.readRenderTargetPixels(gpu.getCurrentRenderTarget(posV), 0, 0, WIDTH, WIDTH, buf);
        return true;
      } catch { return false; }
    };

    // The rhythm.
    const S = { phase: 'free', t: 0, next: 9, formT: 0, holdT: 0, releaseT: -1, gatherDur: 6, holdDur: 6, releaseDur: 3, tease: false, word: null, verseShown: false, maxDelay: 2.5, calm: 0, pull: 0 };
    const freeFor = () => (optsRef.current.pace === 'generous' ? 12 + Math.random() * 10 : 22 + Math.random() * 23);

    const gather = (called = false) => {
      const o = optsRef.current;
      if (o.words === 'none' || !words.length || !fontReady) { S.next = S.t + 4; return; }
      const word = pickWord(words, last, o.words, portrait);
      last = word;
      count++;
      S.tease = !called && o.almost && count > 2 && Math.random() < 0.25;
      const P = Math.round(N * (S.tease ? 0.5 : 0.92));
      // Big enough to read across a room, never edge to edge.
      const maxW = V * (portrait ? 0.88 : 0.74), maxH = Math.min(Hv * 0.26, V * 0.22);
      const pts = sampleWord(word.text, P, maxW, maxH, o.lettering);
      if (!pts.length) { S.next = S.t + 4; return; }
      // Pair birds and slots in left-to-right order.
      const have = readPositions();
      const ids = Array.from({ length: N }, (_, i) => i).sort(() => Math.random() - 0.5).slice(0, pts.length);
      if (have) ids.sort((a, b) => buf[a * 4] - buf[b * 4]);
      pts.sort((a, b) => a[0] - b[0]);
      const minX = pts[0][0], span = Math.max(1, pts[pts.length - 1][0] - minX);
      const spread = o.writing === 'written' ? 1.8 + word.text.length * 0.12 : 0;
      targetData.fill(0);
      for (let i = 0; i < N; i++) targetData[i * 4 + 3] = -1;
      pts.forEach((p, j) => {
        const i = ids[j];
        targetData[i * 4] = p[0]; targetData[i * 4 + 1] = p[1]; targetData[i * 4 + 2] = p[2];
        targetData[i * 4 + 3] = (o.writing === 'written' ? ((p[0] - minX) / span) * spread : 0) + Math.random() * 0.8;
      });
      targetTex.needsUpdate = true;
      S.maxDelay = spread + 0.8;
      S.word = word;
      S.guide = pts.guide;
      S.phase = 'gather';
      S.formT = 0;
      S.releaseT = -1;
      S.gatherDur = S.maxDelay + 2.6;
      S.holdDur = S.tease ? 1.2 : 5 + word.text.length * 0.3;
      S.verseShown = false;
      S.said = false;
    };
    callRef.current = () => { if (S.phase === 'free') gather(true); };

    // ── Touch: brush to scatter (or gather); press and hold to call ──
    const toWorld = (cx, cy) => {
      const r = el.getBoundingClientRect();
      return [((cx - r.left) / r.width - 0.5) * V, (0.5 - (cy - r.top) / r.height) * Hv];
    };
    let press = null;
    const onDown = (e) => {
      if (e.target.closest?.('button, a, .mm-panel')) return;
      press = { x: e.clientX, y: e.clientY, t: setTimeout(() => { callRef.current?.(); press = null; }, 650) };
      const [x, y] = toWorld(e.clientX, e.clientY);
      vu.predator.value.set(x, y, 0);
    };
    const onMove = (e) => {
      if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 14) { clearTimeout(press.t); press = null; }
      if (e.pointerType === 'mouse' || e.buttons || e.pointerType === 'touch') {
        const [x, y] = toWorld(e.clientX, e.clientY);
        vu.predator.value.set(x, y, 0);
      }
    };
    const onUp = (e) => {
      if (press) { clearTimeout(press.t); press = null; }
      // A lifted finger is gone; a mouse stays where it is.
      if (e.pointerType !== 'mouse') vu.predator.value.set(1e5, 1e5, 0);
    };
    const onLeave = () => vu.predator.value.set(1e5, 1e5, 0);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);

    // ── The guide: the word's letters, faint in the sky under the birds,
    // there only once they've arrived, so the eye can find the word. ──
    const gc = guideRef.current, gx = gc.getContext('2d');
    let guideA = 0, guideFor = null, tinted = null;
    const drawGuide = (L) => {
      const W = innerWidth, H = innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
      if (gc.width !== Math.round(W * dpr) || gc.height !== Math.round(H * dpr)) { gc.width = Math.round(W * dpr); gc.height = Math.round(H * dpr); }
      gx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gx.clearRect(0, 0, W, H);
      const g = S.guide;
      if (!g || guideA < 0.003) return;
      if (guideFor !== g) {
        // The letters in the birds' own colour, once per word.
        guideFor = g;
        tinted = document.createElement('canvas');
        tinted.width = g.canvas.width; tinted.height = g.canvas.height;
        const t = tinted.getContext('2d');
        t.drawImage(g.canvas, 0, 0);
        t.globalCompositeOperation = 'source-in';
        t.fillStyle = `rgb(${L.birds.map((v) => v | 0).join(',')})`;
        t.fillRect(0, 0, tinted.width, tinted.height);
      }
      const cY = Hv * 0.07;
      const x0 = ((-g.cx * g.k) / V + 0.5) * W;
      const y0 = (0.5 - (g.cy * g.k + cY) / Hv) * H;
      gx.globalAlpha = guideA * (L.night ? 0.045 : 0.06);
      gx.drawImage(tinted, x0, y0, (g.canvas.width * g.k / V) * W, (g.canvas.height * g.k / Hv) * H);
    };

    // ── Each frame ────────────────────────────────────────────────
    let lastT = performance.now(), raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      let dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      if (reduced) dt *= 0.5;
      const o = optsRef.current;
      S.t += dt;

      // The light, from the page.
      const L = lightRef.current;
      birdUniforms.birdColor.value.setRGB(L.birds[0] / 255, L.birds[1] / 255, L.birds[2] / 255, THREE.SRGBColorSpace);
      birdUniforms.hazeColor.value.setRGB(L.mid[0] / 255, L.mid[1] / 255, L.mid[2] / 255, THREE.SRGBColorSpace);
      birdUniforms.litColor.value.setRGB(L.lit[0] / 255, L.lit[1] / 255, L.lit[2] / 255, THREE.SRGBColorSpace);
      // The light catches the word most against a dark sky; by day a
      // touch, so the word keeps its contrast.
      birdUniforms.lit.value = o.lit ? (L.night ? 0.5 : 0.22) : 0;

      // The rhythm.
      if (S.phase === 'free') {
        S.pull = 0;
        if (S.t >= S.next) gather();
      } else if (S.phase === 'gather') {
        S.formT += dt;
        S.pull = smooth(S.formT / 1.2) * (S.tease ? 0.55 : 1);
        if (S.formT >= S.gatherDur) { S.phase = 'hold'; S.holdT = 0; }
      } else if (S.phase === 'hold') {
        S.formT += dt;
        S.holdT += dt;
        // The verse beneath, once the word has settled; the hold lasts
        // long enough to read it, and the flock quietens meanwhile.
        if (!S.tease && o.verse && S.word?.verse && !S.verseShown && S.holdT > 1.4) {
          S.verseShown = true;
          S.holdDur += 3 + S.word.verse.length * 0.03;
          setVerse({ text: S.word.verse, ref: S.word.ref });
        }
        if (!S.tease && S.holdT > 0.8 && !S.said) { S.said = true; setSaid(S.word.text); }
        if (S.holdT >= S.holdDur) {
          S.phase = 'release'; S.releaseT = 0; S.releaseDur = S.maxDelay * 0.55 + 2.2;
          setVerse(null);
        }
      } else if (S.phase === 'release') {
        S.formT += dt;
        S.releaseT += dt;
        if (S.releaseT >= S.releaseDur) {
          S.phase = 'free'; S.pull = 0; S.releaseT = -1; S.next = S.t + freeFor();
          if (count === 1) {
            let hinted = false;
            try { hinted = localStorage.getItem(HINT_KEY) === '1'; } catch { /* ignore */ }
            if (!hinted) {
              setHint('Press and hold anywhere to call the next word.');
              try { localStorage.setItem(HINT_KEY, '1'); } catch { /* ignore */ }
              setTimeout(() => setHint(''), 7000);
            }
          }
        }
      }
      // Shimmer: loose while they arrive, settling through the hold — the
      // word comes into focus as you look at it.
      const shimmer = S.phase === 'hold'
        ? lerp(S.tease ? 9 : 1.4, S.tease ? 9 : 0.05, smooth(S.holdT / Math.max(1.5, S.holdDur * 0.4)))
        : S.tease ? 10 : 3;
      S.calm += ((S.verseShown && S.phase === 'hold' ? 1 : 0) - S.calm) * Math.min(1, dt * 1.5);
      // Breathe: the word swells on the in-breath (4s) and settles on the
      // out (6s), as in Abide.
      let scale = 1;
      if (o.breathe && S.phase !== 'free') {
        const c = (S.t % 10);
        scale = 1 + 0.035 * (c < 4 ? smooth(c / 4) : 1 - smooth((c - 4) / 6));
      }

      vu.time.value = now; vu.delta.value = dt;
      pu.time.value = now; pu.delta.value = dt;
      vu.pull.value = S.pull; birdUniforms.pull.value = S.pull;
      vu.formT.value = S.formT; birdUniforms.formT.value = S.formT;
      vu.releaseT.value = S.releaseT; birdUniforms.releaseT.value = S.releaseT;
      vu.shimmer.value = shimmer;
      vu.calm.value = S.calm;
      vu.targetScale.value = scale;
      vu.targetCenter.value.set(0, Hv * 0.07);
      vu.home.value.set(V * 0.42, Math.min(Hv * 0.27, V * 0.4), 220);
      vu.homeCenter.value.set(0, Hv * 0.06, -150);
      vu.predatorSign.value = o.touch === 'gather' ? -1 : 1;
      vu.predatorRadius.value = V * 0.16;

      gpu.compute();
      birdUniforms.texturePosition.value = gpu.getCurrentRenderTarget(posV).texture;
      birdUniforms.textureVelocity.value = gpu.getCurrentRenderTarget(velV).texture;
      const wantGuide = o.guide && !S.tease && (S.phase === 'hold' || (S.phase === 'gather' && S.formT > S.gatherDur - 1.5)) ? 1 : 0;
      const before = guideA;
      guideA += (wantGuide - guideA) * Math.min(1, dt * (wantGuide ? 0.9 : 2.2));
      if (Math.abs(guideA - before) > 0.0005 || (before > 0.003 && guideA <= 0.003) || (guideA > 0.003 && S.guide !== guideFor)) drawGuide(L);
      if (o.ink && !reduced) renderer.render(fadeScene, fadeCam);
      else renderer.clear();
      renderer.clearDepth();
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => frame();
    window.addEventListener('resize', onResize);
    const onVis = () => { if (!document.hidden) lastT = performance.now(); };
    document.addEventListener('visibilitychange', onVis);
    if (import.meta.env.DEV) window.__mm = { S, call: () => callRef.current?.() };

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      document.removeEventListener('visibilitychange', onVis);
      gpu.dispose?.();
      birds.geometry.dispose(); birds.material.dispose();
      targetTex.dispose(); fadeMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lightRef = useRef(light);
  lightRef.current = light;

  // Full screen, kept awake: the screensaver.
  const fullScreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    navigator.wakeLock?.request('screen').catch(() => {});
    setPanel(false);
  };

  const night = light.night;
  return (
    <div className={`mm-app${idle && !panel ? ' is-idle' : ''}${night ? ' is-night' : ''}`}>
      <canvas ref={bgRef} className="mm-sky" aria-hidden="true" />
      <canvas ref={guideRef} className="mm-sky mm-guide" aria-hidden="true" />
      <canvas ref={reedsRef} className="mm-sky" aria-hidden="true" />
      <div ref={glRef} className="mm-stage" aria-hidden="true" />

      <header className="mm-top">
        <a className="mm-pill" href="/">← Board</a>
        {owner && <span className="mm-owner">{owner}</span>}
      </header>

      <p className={`mm-verse${verse ? ' is-shown' : ''}`} aria-hidden={!verse}>
        {verse?.text}
        {verse?.ref && <span className="mm-ref">{verse.ref}</span>}
      </p>
      <p className="mm-hint" aria-live="polite">{hint}</p>
      <p className="mm-sr" aria-live="polite">{said}</p>

      <button type="button" className="mm-pill mm-opts-btn" onClick={() => setPanel((p) => !p)} aria-expanded={panel}>
        Options
      </button>
      {panel && (
        <section className="mm-panel" aria-label="Options">
          <Seg label="Words" value={opts.words} set={(v) => setOpt('words', v)}
            options={[['board', 'The board’s'], ['one', 'Just one'], ['none', 'None']]} />
          <Seg label="Letters" value={opts.lettering} set={(v) => setOpt('lettering', v)}
            options={[['sans', 'Bold'], ['serif', 'Serif italic']]} />
          <Seg label="Writing" value={opts.writing} set={(v) => setOpt('writing', v)}
            options={[['written', 'Written in'], ['once', 'All at once']]} />
          <Seg label="Pace" value={opts.pace} set={(v) => setOpt('pace', v)}
            options={[['patient', 'Patient'], ['generous', 'Generous']]} />
          <Seg label="Touch" value={opts.touch} set={(v) => setOpt('touch', v)}
            options={[['scatter', 'Scatter'], ['gather', 'Gather']]} />
          <div className="mm-toggles">
            <Toggle label="Almost-words" hint="Now and then a word only half forms" on={opts.almost} set={(v) => setOpt('almost', v)} />
            <Toggle label="Faint letters" hint="A whisper of the word in the sky, under the birds" on={opts.guide} set={(v) => setOpt('guide', v)} />
            <Toggle label="Verse beneath" hint="The word’s verse, while it holds" on={opts.verse} set={(v) => setOpt('verse', v)} />
            <Toggle label="Sunlit word" hint="The word catches the last light" on={opts.lit} set={(v) => setOpt('lit', v)} />
            <Toggle label="Breathe" hint="The word swells and settles: 4s in, 6s out" on={opts.breathe} set={(v) => setOpt('breathe', v)} bold />
            <Toggle label="Ink" hint="Each bird leaves a fading trail" on={opts.ink} set={(v) => setOpt('ink', v)} bold />
            <Toggle label="Follow the clock" hint="Dawn, day, dusk, night — or always dusk" on={opts.clock} set={(v) => setOpt('clock', v)} />
          </div>
          <div className="mm-actions">
            <button type="button" className="mm-pill" onClick={() => { callRef.current?.(); setPanel(false); }}>Call a word now</button>
            <button type="button" className="mm-pill" onClick={fullScreen}>Full screen</button>
          </div>
          <p className="mm-foot">Press and hold anywhere to call a word · <a href="/admin/">Admin</a></p>
        </section>
      )}
    </div>
  );
}

function Seg({ label, value, set, options }) {
  return (
    <div className="mm-row">
      <span className="mm-label">{label}</span>
      <div className="mm-seg" role="radiogroup" aria-label={label}>
        {options.map(([id, l]) => (
          <button key={id} type="button" role="radio" aria-checked={value === id} className={value === id ? 'is-on' : ''} onClick={() => set(id)}>{l}</button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, hint, on, set, bold }) {
  return (
    <label className="mm-toggle">
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
      <span>
        <strong>{label}{bold && <em className="mm-bold">new idea</em>}</strong>
        <span className="mm-hint-s">{hint}</span>
      </span>
    </label>
  );
}
