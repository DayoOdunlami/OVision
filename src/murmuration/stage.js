import * as THREE from 'three';

// A dusk sky behind everything.
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
