import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { POSITION, VELOCITY, BIRD_VS, BIRD_FS } from './murmurationShaders.js';
import { duskBackdrop } from './stage.js';

// three.js's webgl_gpgpu_birds (MIT), ported as faithfully as we can:
// 1,024 birds flocking on the graphics chip, a finger as the predator
// they scatter from. Recoloured as starlings at dusk. This is the
// reference for "a flock that feels alive".
const WIDTH = 32;
const BIRDS = WIDTH * WIDTH;
const BOUNDS = 800, HALF = BOUNDS / 2;

class BirdGeometry extends THREE.BufferGeometry {
  constructor() {
    super();
    const tri = BIRDS * 3, points = tri * 3;
    const vertices = new THREE.BufferAttribute(new Float32Array(points * 3), 3);
    const birdColors = new THREE.BufferAttribute(new Float32Array(points * 3), 3);
    const references = new THREE.BufferAttribute(new Float32Array(points * 2), 2);
    const birdVertex = new THREE.BufferAttribute(new Float32Array(points), 1);
    this.setAttribute('position', vertices);
    this.setAttribute('birdColor', birdColors);
    this.setAttribute('reference', references);
    this.setAttribute('birdVertex', birdVertex);
    let v = 0;
    const push = (...a) => { for (const x of a) vertices.array[v++] = x; };
    const span = 20;
    for (let f = 0; f < BIRDS; f++) {
      push(0, -0, -20, 0, 4, -20, 0, 0, 30);
      push(0, 0, -15, -span, 0, 0, 0, 0, 15);
      push(0, 0, 15, span, 0, 0, 0, 0, -15);
    }
    for (let i = 0; i < tri * 3; i++) {
      const bi = ~~(~~(i / 3) / 3);
      const c = Math.random();
      birdColors.array[i * 3] = c; birdColors.array[i * 3 + 1] = c; birdColors.array[i * 3 + 2] = c;
      references.array[i * 2] = (bi % WIDTH) / WIDTH;
      references.array[i * 2 + 1] = ~~(bi / WIDTH) / WIDTH;
      birdVertex.array[i] = i % 9;
    }
    this.scale(0.2, 0.2, 0.2);
  }
}

export default function Murmuration({ controls }) {
  const ref = useRef(null);
  const ctl = useRef(controls);
  ctl.current = controls;

  useEffect(() => {
    const el = ref.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 1, 8000);
    camera.position.z = 350;
    const { dispose: disposeSky } = duskBackdrop(scene);
    const resize = () => {
      const W = el.clientWidth, H = el.clientHeight;
      renderer.setSize(W, H, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const gpu = new GPUComputationRenderer(WIDTH, WIDTH, renderer);
    const pos0 = gpu.createTexture(), vel0 = gpu.createTexture();
    for (let k = 0, a = pos0.image.data; k < a.length; k += 4) {
      a[k] = Math.random() * BOUNDS - HALF; a[k + 1] = Math.random() * BOUNDS - HALF; a[k + 2] = Math.random() * BOUNDS - HALF; a[k + 3] = 1;
    }
    for (let k = 0, a = vel0.image.data; k < a.length; k += 4) {
      a[k] = (Math.random() - 0.5) * 10; a[k + 1] = (Math.random() - 0.5) * 10; a[k + 2] = (Math.random() - 0.5) * 10; a[k + 3] = 1;
    }
    const velV = gpu.addVariable('textureVelocity', VELOCITY, vel0);
    const posV = gpu.addVariable('texturePosition', POSITION, pos0);
    gpu.setVariableDependencies(velV, [posV, velV]);
    gpu.setVariableDependencies(posV, [posV, velV]);
    const pu = posV.material.uniforms, vu = velV.material.uniforms;
    pu.time = { value: 0 }; pu.delta = { value: 0 };
    Object.assign(vu, {
      time: { value: 1 }, delta: { value: 0 }, testing: { value: 1 },
      separationDistance: { value: 20 }, alignmentDistance: { value: 20 }, cohesionDistance: { value: 20 },
      freedomFactor: { value: 0.75 }, predator: { value: new THREE.Vector3() },
    });
    velV.material.defines.BOUNDS = BOUNDS.toFixed(2);
    velV.wrapS = velV.wrapT = posV.wrapS = posV.wrapT = THREE.RepeatWrapping;
    const err = gpu.init();
    if (err) console.error(err);

    const birdUniforms = {
      texturePosition: { value: null }, textureVelocity: { value: null }, time: { value: 1 }, delta: { value: 0 },
      near: { value: new THREE.Color('#10132a') }, far: { value: new THREE.Color('#4a4a78') },
    };
    const mesh = new THREE.Mesh(new BirdGeometry(), new THREE.ShaderMaterial({
      uniforms: birdUniforms, vertexShader: BIRD_VS, fragmentShader: BIRD_FS, side: THREE.DoubleSide,
    }));
    mesh.rotation.y = Math.PI / 2;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    scene.add(mesh);

    let mx = 10000, my = 10000;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      mx = e.clientX - r.left - r.width / 2;
      my = e.clientY - r.top - r.height / 2;
    };
    el.addEventListener('pointermove', onMove);

    let last = performance.now(), raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      let delta = (now - last) / 1000;
      if (delta > 1) delta = 1;
      last = now;
      delta *= ctl.current?.speed ?? 1;
      const W2 = el.clientWidth / 2, H2 = el.clientHeight / 2;
      pu.time.value = now; pu.delta.value = delta;
      vu.time.value = now; vu.delta.value = delta;
      birdUniforms.time.value = now; birdUniforms.delta.value = delta;
      const c = ctl.current || {};
      vu.separationDistance.value = c.separation ?? 20;
      vu.cohesionDistance.value = c.cohesion ?? 20;
      vu.predator.value.set((0.5 * mx) / W2, (-0.5 * my) / H2, 0);
      mx = 10000; my = 10000;
      gpu.compute();
      birdUniforms.texturePosition.value = gpu.getCurrentRenderTarget(posV).texture;
      birdUniforms.textureVelocity.value = gpu.getCurrentRenderTarget(velV).texture;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener('pointermove', onMove);
      gpu.dispose?.();
      disposeSky();
      mesh.geometry.dispose();
      mesh.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={ref} className="bd-stage" />;
}
