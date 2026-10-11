import * as THREE from 'three';

// Shared bits for the 3D demos: a dusk sky behind everything, and a
// camera sized so the z = 0 plane maps one-to-one onto the stage.
export function duskBackdrop(scene, { top = '#141a36', mid = '#363c6c', low = '#9a7290' } = {}) {
  const mat = new THREE.ShaderMaterial({
    depthWrite: false, side: THREE.BackSide, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, mid: { value: new THREE.Color(mid) }, low: { value: new THREE.Color(low) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 low; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.5, h)) : mix(mid, low, smoothstep(0.0, 0.45, -h)); gl_FragColor = vec4(c, 1.0); }',
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(6000, 24, 16), mat);
  scene.add(sky);
  return { sky, dispose: () => { sky.geometry.dispose(); mat.dispose(); } };
}

export function fitRenderer(renderer, camera, el) {
  let W = 1, H = 1;
  const apply = () => {
    W = Math.max(1, el.clientWidth); H = Math.max(1, el.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(W, H, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    camera.aspect = W / H;
    camera.position.set(0, 0, (H / 2) / Math.tan((camera.fov * Math.PI) / 360));
    camera.updateProjectionMatrix();
  };
  apply();
  const ro = new ResizeObserver(apply);
  ro.observe(el);
  return () => ({ W, H, dispose: () => ro.disconnect() });
}
