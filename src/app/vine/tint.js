// A person's colours in the vine: their koi's colours (household.js),
// so the same person is the same colour in either world. Kept apart from
// the scene so the home screen can use it without loading the vine.
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;

export function tintFor(c) {
  const a = hex(c.accent), b = hex(c.body);
  const light = mix(a, [255, 250, 244], 0.55);
  return [rgb(mix(a, b, 0.15)), rgb(light), rgb(mix(light, [255, 255, 255], 0.6))];
}
