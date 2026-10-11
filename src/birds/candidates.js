// The bird candidates. kind: 'demo' (runs here, see BirdsApp DEMOS),
// 'iframe' (one of our own worlds), or 'link' (try it on the web).
export const CANDIDATES = [
  {
    id: 'gltf', kind: 'demo', demo: 'gltf',
    name: 'Animated 3D birds: flamingo, parrot, stork',
    style: '3D, artist-animated (keyframed wingbeats)',
    good: 'The wingbeat is a performance by an animator, not a formula: the wing loads, sweeps and recovers, the body rises and dips with each beat. It reads as a real bird at any size. Here they fly on our kind of steering: wandering, circling, banking, gliding, and scattering from a finger.',
    use: 'A 3D sky world: these models (or others made the same way) driven by our steering, with the board’s words over them. The flap speeds up with effort and pauses into a glide, as you can try below.',
    source: 'three.js examples, models from the “ro.me” project by mirada', sourceUrl: 'https://threejs.org/examples/#webgl_gpgpu_birds_gltf',
    license: 'Shipped in the three.js repository (MIT). The models carry no separate licence file, so credit mirada / ro.me, and ask for sign-off before selling.',
    controls: [
      { id: 'flap', type: 'range', label: 'Wingbeat', min: 0.3, max: 2.5, step: 0.1, default: 1 },
      { id: 'speed', type: 'range', label: 'Flight speed', min: 0.3, max: 2.5, step: 0.1, default: 1 },
      { id: 'glide', type: 'seg', label: 'Gliding', default: 'sometimes', options: [['never', 'Never'], ['sometimes', 'Sometimes'], ['always', 'Always']] },
    ],
  },
  {
    id: 'murmuration', kind: 'demo', demo: 'murmuration',
    name: 'Murmuration: a thousand starlings',
    style: '3D flock, simulated on the graphics chip',
    good: 'The classic three.js flock: 1,024 birds, each keeping apart, matching its neighbours and drawing together, so the whole flock pours and folds like a real murmuration. Each bird is three triangles, yet the movement of the whole is breathtaking. Move a finger through it.',
    use: 'Not our named birds, but the sky they live in: a distant murmuration far behind the board’s words, turning slowly, scattering when touched. Or a whole world on its own (“Murmuration at dusk”).',
    source: 'three.js webgl_gpgpu_birds', sourceUrl: 'https://threejs.org/examples/#webgl_gpgpu_birds',
    license: 'MIT (three.js). Shaders copied verbatim with credit.',
    controls: [
      { id: 'speed', type: 'range', label: 'Pace', min: 0.2, max: 1.5, step: 0.1, default: 1 },
      { id: 'separation', type: 'range', label: 'Spacing', min: 1, max: 100, step: 1, default: 20 },
      { id: 'cohesion', type: 'range', label: 'Togetherness', min: 1, max: 100, step: 1, default: 20 },
    ],
  },
  {
    id: 'ours-2d', kind: 'iframe', src: '/?world=birds&labs=new&preview=1',
    name: 'Ours now: birds at dusk (2D)',
    style: '2D canvas, procedural',
    good: 'Light, and they carry the board: names, swelling near the season word, colour near the friction word, seed. The painted clouds work.',
    use: 'For comparison. The flight and the clouds stay whichever bird we choose; the bird itself is what we’d replace.',
    source: 'This app (src/pond/birds2.js)', license: 'Ours',
  },
  {
    id: 'ours-3d', kind: 'iframe', src: '/?world=dusk3d&preview=1',
    name: 'Ours now: dusk in 3D',
    style: '3D, procedural low-poly',
    good: 'Real depth and light, true parallax on scroll. The birds are simple shapes moved by code.',
    use: 'For comparison: the stage a 3D bird would fly on.',
    source: 'This app (src/pond/worlds/Dusk3D.jsx)', license: 'Ours',
  },
];
