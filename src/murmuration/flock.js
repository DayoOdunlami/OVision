// ═══════════════════════════════════════════════════════════════════
// The flock's shaders. The flocking (separation, alignment, cohesion,
// a predator to scatter from, the wingbeat that quickens with speed) is
// three.js's webgl_gpgpu_birds example — MIT licence, © three.js authors
// (https://github.com/mrdoob/three.js/blob/dev/LICENSE).
//
// Ours on top: each bird can be given a slot in a word (textureTarget:
// xyz = where, w = when it sets off, or −1 if it stays with the flock).
// A global pull draws them in; shimmer is how much they wander about
// their slot (it settles during the hold, so the word sharpens); the
// release lets them go in the same left-to-right order they arrived.
// The flock's home is an ellipse over the reeds, shaped to the screen.
// ═══════════════════════════════════════════════════════════════════

export const POSITION = /* glsl */ `
uniform float time;
uniform float delta;
void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 tmpPos = texture2D(texturePosition, uv);
  vec3 position = tmpPos.xyz;
  vec3 velocity = texture2D(textureVelocity, uv).xyz;
  float phase = tmpPos.w;
  // The wingbeat quickens with speed and with climbing (three.js), and
  // never quite stops, even when hovering in the word.
  phase = mod(phase + delta * 1.4 + length(velocity.xz) * delta * 3.0 + max(velocity.y, 0.0) * delta * 6.0, 62.83);
  gl_FragColor = vec4(position + velocity * delta * 15.0, phase);
}
`;

export const VELOCITY = /* glsl */ `
uniform float time;
uniform float delta;
uniform float separationDistance;
uniform float alignmentDistance;
uniform float cohesionDistance;
uniform vec3 predator;       // world position of the finger (far away if none)
uniform float predatorSign;  // 1 scatter from it, −1 gather to it
uniform float predatorRadius;
uniform vec3 home;           // half-extents of the flock's home
uniform vec3 homeCenter;
uniform sampler2D textureTarget;
uniform float pull;          // 0..1: how strongly birds seek their slots
uniform float formT;         // seconds since this word began gathering
uniform float releaseT;      // seconds since it began to release (−1: not)
uniform float shimmer;       // how far birds wander about their slot
uniform vec2 targetCenter;
uniform float targetScale;
uniform float calm;          // 0..1: the flock slows while the verse shows

const float width = resolution.x;
const float height = resolution.y;
const float PI = 3.141592653589793;
const float PI_2 = PI * 2.0;
const float SPEED_LIMIT = 9.0;

float rand(vec2 co) { return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  float zoneRadius = separationDistance + alignmentDistance + cohesionDistance;
  float separationThresh = separationDistance / zoneRadius;
  float alignmentThresh = (separationDistance + alignmentDistance) / zoneRadius;
  float zoneRadiusSquared = zoneRadius * zoneRadius;

  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 selfPosition = texture2D(texturePosition, uv).xyz;
  vec3 selfVelocity = texture2D(textureVelocity, uv).xyz;
  vec4 tg = texture2D(textureTarget, uv);

  vec3 velocity = selfVelocity;
  float limit = SPEED_LIMIT * (1.0 - 0.45 * calm);

  // How much this bird is in the word right now.
  float inWord = 0.0;
  if (tg.w >= 0.0) {
    inWord = smoothstep(tg.w, tg.w + 1.4, formT) * pull;
    // Released in the order they arrived.
    if (releaseT >= 0.0) inWord *= 1.0 - smoothstep(tg.w * 0.55, tg.w * 0.55 + 0.7, releaseT);
  }

  // The finger.
  vec3 dir = predator - selfPosition;
  dir.z = 0.0;
  float dist = length(dir);
  if (dist < predatorRadius && dist > 0.001) {
    float f = (dist * dist / (predatorRadius * predatorRadius) - 1.0) * delta * 100.0 * predatorSign;
    velocity += normalize(dir) * f * (1.0 - 0.7 * inWord);
    limit += 5.0;
  }

  // Home: drawn back toward an ellipse over the reeds, flatter in depth.
  vec3 d = (selfPosition - homeCenter) / home;
  float ld = length(d);
  if (ld > 0.0001) velocity -= normalize(d * vec3(1.0, 1.6, 2.2)) * delta * 5.0 * clamp(ld, 0.35, 2.5) * (1.0 - inWord);

  // Flocking (three.js): separation, alignment, cohesion.
  vec3 flock = vec3(0.0);
  for (float y = 0.0; y < height; y++) {
    for (float x = 0.0; x < width; x++) {
      vec2 ref = vec2(x + 0.5, y + 0.5) / resolution.xy;
      vec3 birdPosition = texture2D(texturePosition, ref).xyz;
      vec3 dd = birdPosition - selfPosition;
      float dl = length(dd);
      if (dl < 0.0001) continue;
      float distSquared = dl * dl;
      if (distSquared > zoneRadiusSquared) continue;
      float percent = distSquared / zoneRadiusSquared;
      if (percent < separationThresh) {
        float f = (separationThresh / percent - 1.0) * delta;
        flock -= normalize(dd) * f;
      } else if (percent < alignmentThresh) {
        float threshDelta = alignmentThresh - separationThresh;
        float adjustedPercent = (percent - separationThresh) / threshDelta;
        vec3 birdVelocity = texture2D(textureVelocity, ref).xyz;
        float f = (0.5 - cos(adjustedPercent * PI_2) * 0.5 + 0.5) * delta;
        flock += normalize(birdVelocity) * f;
      } else {
        float threshDelta = 1.0 - alignmentThresh;
        float adjustedPercent = threshDelta == 0.0 ? 1.0 : (percent - alignmentThresh) / threshDelta;
        float f = (0.5 - (cos(adjustedPercent * PI_2) * -0.5 + 0.5)) * delta;
        flock += normalize(dd) * f;
      }
    }
  }
  velocity += flock * (1.0 - 0.9 * inWord);

  // The word: stream to the slot, then hover about it.
  if (inWord > 0.0) {
    float id = rand(uv) * 6.2831;
    vec3 goal = vec3(targetCenter + tg.xy * targetScale, tg.z);
    goal.xy += vec2(sin(time * 0.0019 + id), cos(time * 0.0016 + id * 1.7)) * shimmer;
    vec3 to = goal - selfPosition;
    float dl = length(to);
    vec3 desired = dl > 0.001 ? to / dl * min(dl * 0.11, 13.0) : vec3(0.0);
    velocity = mix(velocity, desired, clamp(inWord * delta * 5.0, 0.0, 1.0));
    limit = mix(limit, 13.0, inWord);
  }

  // Release: lift out of the word, left to right, on a breath of wind.
  if (releaseT >= 0.0 && tg.w >= 0.0) {
    float rd = tg.w * 0.55;
    if (releaseT > rd && releaseT < rd + 0.35) {
      vec3 lift = normalize(vec3(0.7 + rand(uv + 1.3) * 0.6, 0.35 + rand(uv + 2.1) * 0.7, rand(uv + 3.7) - 0.5));
      velocity += lift * delta * 26.0;
    }
  }

  if (length(velocity) > limit) velocity = normalize(velocity) * limit;
  gl_FragColor = vec4(velocity, 1.0);
}
`;

// The bird, oriented along its flight (three.js), with its slot's
// "inWord" passed on so the word can catch the light.
export const BIRD_VS = /* glsl */ `
attribute vec2 reference;
attribute float birdVertex;
uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;
uniform sampler2D textureTarget;
uniform float pull;
uniform float formT;
uniform float releaseT;
varying float z;
varying float vActive;
void main() {
  vec4 tmpPos = texture2D(texturePosition, reference);
  vec3 pos = tmpPos.xyz;
  vec3 vel = texture2D(textureVelocity, reference).xyz;
  if (length(vel) < 0.0001) vel = vec3(1.0, 0.0, 0.0);
  vec3 velocity = normalize(vel);
  vec3 newPosition = position;
  if (birdVertex == 4.0 || birdVertex == 7.0) {
    // The wingtips beat.
    newPosition.y = sin(tmpPos.w) * 5.0;
  }
  newPosition = mat3(modelMatrix) * newPosition;
  velocity.z *= -1.0;
  float xz = length(velocity.xz);
  float x = sqrt(1.0 - velocity.y * velocity.y);
  float cosry = xz > 0.0001 ? velocity.x / xz : 1.0;
  float sinry = xz > 0.0001 ? velocity.z / xz : 0.0;
  float cosrz = x;
  float sinrz = velocity.y;
  mat3 maty = mat3(cosry, 0, -sinry, 0, 1, 0, sinry, 0, cosry);
  mat3 matz = mat3(cosrz, sinrz, 0, -sinrz, cosrz, 0, 0, 0, 1);
  newPosition = maty * matz * newPosition;
  newPosition += pos;
  z = newPosition.z;
  vec4 tg = texture2D(textureTarget, reference);
  vActive = tg.w >= 0.0 ? smoothstep(tg.w + 0.6, tg.w + 2.4, formT) * pull : 0.0;
  if (releaseT >= 0.0 && tg.w >= 0.0) vActive *= 1.0 - smoothstep(tg.w * 0.55, tg.w * 0.55 + 0.5, releaseT);
  gl_Position = projectionMatrix * viewMatrix * vec4(newPosition, 1.0);
}
`;

export const BIRD_FS = /* glsl */ `
uniform vec3 birdColor;
uniform vec3 hazeColor;
uniform vec3 litColor;
uniform float lit;
uniform float zNear;
uniform float zFar;
varying float z;
varying float vActive;
void main() {
  // Distant birds fade into the sky; birds in the word catch the light.
  float k = clamp((zNear - z) / (zNear - zFar), 0.0, 1.0);
  // Birds in the word stay crisp; the rest fade with distance.
  vec3 c = mix(birdColor, hazeColor, k * 0.55 * (1.0 - vActive));
  c = mix(c, litColor, vActive * lit);
  gl_FragColor = vec4(c, 1.0);
}
`;
