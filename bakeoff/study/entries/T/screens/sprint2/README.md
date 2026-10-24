# Sprint 2 · browser evidence

[Before / after comparison](before-after.png) · [Comparison HTML](comparison.html) · [Pond arrival, feeding and dial](pond-arrival-native.webm) · [Garden arrival, clearing and sowing](garden-arrival-native.webm)

These are unretouched captures from the production build at 390 × 844 and 1180 × 820, by day (`?h=12`) and night (`?h=22`). Reduced motion holds each still plate; within each Sprint 2 size/light set all four media and places share the same held fish skeleton. Sprint 1 and Sprint 2 use separate fresh scenes, so their fish poses differ. The two recordings use normal motion and genuine touch input, without speed changes, interpolation or cuts: pond 18.36 seconds; garden 27.40 seconds.

## Before: the frozen Sprint 1 entry

| Medium | Phone day | Phone night | Tablet day | Tablet night |
|---|---|---|---|---|
| Ink | [phone day](before-ink-phone-day.png) | [phone night](before-ink-phone-night.png) | [tablet day](before-ink-tablet-day.png) | [tablet night](before-ink-tablet-night.png) |
| Ink and wash | [phone day](before-wash-phone-day.png) | [phone night](before-wash-phone-night.png) | [tablet day](before-wash-tablet-day.png) | [tablet night](before-wash-tablet-night.png) |

All 32 original Sprint 1 plates remain in the [parent evidence folder](../README.md). `?v=1` now loads the frozen original HTML, drawing modules and stylesheet; only the nested imports of unchanged app modules were adjusted. The [freeze manifest](../../sprint1-freeze.json) records hashes against delivered commit `79d8326`.

## After: every medium in every place

| Place and medium | Phone day | Phone night | Tablet day | Tablet night |
|---|---|---|---|---|
| Scroll · Paper | [phone day](after-scroll-paper-phone-day.png) | [phone night](after-scroll-paper-phone-night.png) | [tablet day](after-scroll-paper-tablet-day.png) | [tablet night](after-scroll-paper-tablet-night.png) |
| Scroll · Ink | [phone day](after-scroll-ink-phone-day.png) | [phone night](after-scroll-ink-phone-night.png) | [tablet day](after-scroll-ink-tablet-day.png) | [tablet night](after-scroll-ink-tablet-night.png) |
| Scroll · Ink and wash | [phone day](after-scroll-wash-phone-day.png) | [phone night](after-scroll-wash-phone-night.png) | [tablet day](after-scroll-wash-tablet-day.png) | [tablet night](after-scroll-wash-tablet-night.png) |
| Scroll · Colour | [phone day](after-scroll-colour-phone-day.png) | [phone night](after-scroll-colour-phone-night.png) | [tablet day](after-scroll-colour-tablet-day.png) | [tablet night](after-scroll-colour-tablet-night.png) |
| Pond · Paper | [phone day](after-pond-paper-phone-day.png) | [phone night](after-pond-paper-phone-night.png) | [tablet day](after-pond-paper-tablet-day.png) | [tablet night](after-pond-paper-tablet-night.png) |
| Pond · Ink | [phone day](after-pond-ink-phone-day.png) | [phone night](after-pond-ink-phone-night.png) | [tablet day](after-pond-ink-tablet-day.png) | [tablet night](after-pond-ink-tablet-night.png) |
| Pond · Ink and wash | [phone day](after-pond-wash-phone-day.png) | [phone night](after-pond-wash-phone-night.png) | [tablet day](after-pond-wash-tablet-day.png) | [tablet night](after-pond-wash-tablet-night.png) |
| Pond · Colour | [phone day](after-pond-colour-phone-day.png) | [phone night](after-pond-colour-phone-night.png) | [tablet day](after-pond-colour-tablet-day.png) | [tablet night](after-pond-colour-tablet-night.png) |
| Garden · Paper | [phone day](after-garden-paper-phone-day.png) | [phone night](after-garden-paper-phone-night.png) | [tablet day](after-garden-paper-tablet-day.png) | [tablet night](after-garden-paper-tablet-night.png) |
| Garden · Ink | [phone day](after-garden-ink-phone-day.png) | [phone night](after-garden-ink-phone-night.png) | [tablet day](after-garden-ink-tablet-day.png) | [tablet night](after-garden-ink-tablet-night.png) |
| Garden · Ink and wash | [phone day](after-garden-wash-phone-day.png) | [phone night](after-garden-wash-phone-night.png) | [tablet day](after-garden-wash-tablet-day.png) | [tablet night](after-garden-wash-tablet-night.png) |
| Garden · Colour | [phone day](after-garden-colour-phone-day.png) | [phone night](after-garden-colour-phone-night.png) | [tablet day](after-garden-colour-tablet-day.png) | [tablet night](after-garden-colour-tablet-night.png) |

## The word completes

| Medium | Phone day | Phone night | Tablet day | Tablet night |
|---|---|---|---|---|
| Ink | [phone day](rooted-ink-phone-day.png) | [phone night](rooted-ink-phone-night.png) | [tablet day](rooted-ink-tablet-day.png) | [tablet night](rooted-ink-tablet-night.png) |
| Ink and wash | [phone day](rooted-wash-phone-day.png) | [phone night](rooted-wash-phone-night.png) | [tablet day](rooted-wash-tablet-day.png) | [tablet night](rooted-wash-tablet-night.png) |
| Colour | [phone day](rooted-colour-phone-day.png) | [phone night](rooted-colour-phone-night.png) | [tablet day](rooted-colour-tablet-day.png) | [tablet night](rooted-colour-tablet-night.png) |

## Verification

The story runs entirely in this standalone page: touch or keyboard → local practice/pond state → the same Canvas drawing. No API, household record, personal response, server write or external service is involved. Fonts and notices are self-hosted.

`npm run build` and all 18 focused tests pass. The [production browser results](browser-results.json) cover 48 after states, eight fresh before states, twelve completed-word states, all eight independent URL switches, combined switches, 06:45 light, native dialog/Escape, arrow-key dial control and the existing app’s demo/season entry. All visible controls meet 48 × 48 px, with no horizontal overflow or page errors. Paper's canvas is uniformly blank. Reduced-motion media and arrivals preserve held fish heads.

The [native motion results](motion-results.json) cover all three moving media at both sizes by day/night, genuine upward finger drags, a thorn held under tension, reduced-motion dragging without animation frames, double-tap food, rapid interrupted wet changes and `off=wet`. Live reduced motion preserves both pixels and pose after settling. Two native recordings show pond arrival/back and the complete clear → sow → Rooted sequence.

The [atmosphere proof](atmosphere-results.json) isolates a scheduled glimpse at 65 seconds: two tiny brush birds produce 50 pixels in the distant region. Switching the atmosphere off or using reduced motion exactly matches the still drawing. This fixture does not claim birds appear during the short recordings; they deliberately arrive only occasionally.

## Brush and performance evidence

[Before brush cache](brush-before-cache.png) · [After brush cache](brush-after-cache.png) · [Fixed-fixture results](brush-cache-results.json)

The bounded absorption mask belongs to each individual wash mark. Its before/after fixture differs by at most 2/255 per colour channel (mean 0.0082/255); no pixels differ by more than 3. Determinism and caller alpha restoration pass. A warm, moving 18-frame fixture took 474 ms before and 360.5 ms after, with radial gradient constructions falling from 4,860 to zero. This is a matched fixture comparison, not a device frame-rate claim.

Actual full-app measurements are in `motion-results.json`. Fresh random fish and a shared software-rendered host make those short app runs observational rather than controlled performance comparisons. Physical Android performance is not certified. The original frame-based koi simulation swims more slowly when frames drop. The study makes no 60 fps claim.


Observed full-pond frame rates on this shared software-rendered host (fps; short samples, fresh random fish):

| Medium | Phone day | Phone night | Tablet day | Tablet night |
|---|---|---|---|---|
| Ink | 33.8 | 41.2 | 48.4 | 39.4 |
| Wash | 16.0 | 21.3 | 10.9 | 16.2 |
| Colour | 34.1 | 25.5 | 29.7 | 31.5 |

Wash is the remaining rendering risk on this host. These numbers do not establish physical Android smoothness.

## Reproduce

```sh
npm install
node --test src/study/composition.test.js src/study/fish.test.js src/study/garden.test.js
npm run build
npm run preview -- --host 0.0.0.0 --port 4170
# In another terminal, from the repository root, with the browser package and Chromium installed:
python bakeoff/study/entries/T/verify-sprint2.py http://localhost:4170 /tmp/study-sprint2-plates
python bakeoff/study/entries/T/verify-sprint2-motion.py http://localhost:4170 /tmp/study-sprint2-motion
```

The [brush cache probe](../../verify-brush-cache.py) needs the source dev server on port 5190 (`npm run dev -- --port 5190`). It compares the frozen original brush with the current one. Scripts write only local evidence; they do not touch family data. The original app pages, `SpineFish.js` and its FoodBowl remain unchanged.
