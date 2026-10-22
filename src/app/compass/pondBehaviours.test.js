import test from 'node:test';
import assert from 'node:assert/strict';
import SpineFish, { buildPondMixFromCounts } from '../pond/SpineFish.js';
import { boardFishScale } from './pondBehaviours.js';

test('compact child koi retain enough spine parts for the original dorsal renderer', () => {
  const random = Math.random;
  const path = { beginPath() {}, moveTo() {}, lineTo() {}, closePath() {} };
  try {
    // Smallest possible mass reproduced the intermittent four-part skeleton.
    Math.random = () => 0;
    for (const variety of ['showa', 'shiro', 'ogon', 'sanke', 'chagoi']) {
      const [v] = buildPondMixFromCounts({ [variety]: 1 });
      const fish = new SpineFish(390, 280, { ...v, sizeScale: boardFishScale(v.sizeScale || 1, .22, true) });
      assert.ok(fish.parts.length >= 5, variety);
      assert.doesNotThrow(() => fish.traceDorsal(path), variety);
    }
  } finally { Math.random = random; }
});
