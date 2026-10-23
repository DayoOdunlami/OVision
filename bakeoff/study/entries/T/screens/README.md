# Browser evidence

The 32 plates below come from the production build at `/study/`, tested in a real browser at 390 × 844 and 1180 × 820. Day is `?h=12`; night is `?h=22`. Reduced motion holds one pose across all eight dial/place states for each size and light. These plates compare media; they do not demonstrate animation.

[Native transition and dial recording](transition-and-dial-tablet.webm) · [Colour/Ink comparison](colour-ink-side-by-side.png) · [Comparison HTML](comparison.html) · [32-state results](browser-results.json)

The recording is the untouched 22.56-second browser capture at tablet size with normal motion: pond arrival, Wash, Colour, Ink, return, Paper and Ink. No interpolation or speed adjustment. The comparison uses two actual plates from the same held pose.

## Plates

| Place and medium | Phone day | Phone night | Tablet day | Tablet night |
|---|---|---|---|---|
| Scroll · Paper | [phone day](scroll-paper-phone-day.png) | [phone night](scroll-paper-phone-night.png) | [tablet day](scroll-paper-tablet-day.png) | [tablet night](scroll-paper-tablet-night.png) |
| Scroll · Ink | [phone day](scroll-ink-phone-day.png) | [phone night](scroll-ink-phone-night.png) | [tablet day](scroll-ink-tablet-day.png) | [tablet night](scroll-ink-tablet-night.png) |
| Scroll · Ink and wash | [phone day](scroll-wash-phone-day.png) | [phone night](scroll-wash-phone-night.png) | [tablet day](scroll-wash-tablet-day.png) | [tablet night](scroll-wash-tablet-night.png) |
| Scroll · Colour | [phone day](scroll-colour-phone-day.png) | [phone night](scroll-colour-phone-night.png) | [tablet day](scroll-colour-tablet-day.png) | [tablet night](scroll-colour-tablet-night.png) |
| Pond · Paper | [phone day](pond-paper-phone-day.png) | [phone night](pond-paper-phone-night.png) | [tablet day](pond-paper-tablet-day.png) | [tablet night](pond-paper-tablet-night.png) |
| Pond · Ink | [phone day](pond-ink-phone-day.png) | [phone night](pond-ink-phone-night.png) | [tablet day](pond-ink-tablet-day.png) | [tablet night](pond-ink-tablet-night.png) |
| Pond · Ink and wash | [phone day](pond-wash-phone-day.png) | [phone night](pond-wash-phone-night.png) | [tablet day](pond-wash-tablet-day.png) | [tablet night](pond-wash-tablet-night.png) |
| Pond · Colour | [phone day](pond-colour-phone-day.png) | [phone night](pond-colour-phone-night.png) | [tablet day](pond-colour-tablet-day.png) | [tablet night](pond-colour-tablet-night.png) |

## Checks and limits

`npm run build` and all three `node --test src/study/fish.test.js` checks passed. The original `SpineFish.js` and every existing app page are unchanged. The motion tests compare all reachable simulation scalars against the original renderer over 120 ticks; an additional real native Canvas comparison agrees for 60 ticks.

The [production browser script](../verify.py) checks every plate for page errors, controls at least 48 × 48 px, horizontal overflow, dial state and held fish heads. It also checks pond arrival/back, arrow-key dial use, the information dialog/Escape, the 06:45 clock override, Paper's uniformly blank canvas, and the existing app's demo/season entry. A [brush probe](../verify-brush.py) checks deterministic rendering and restored caller alpha.

The [initial audit](motion-before.json) records normal movement at both sizes by day and night. On this shared software-rendered host, Ink measured 23–35 fps and Wash 14–20 fps; their painting paths are unchanged by the final Colour optimisation. Before that optimisation Colour measured 3–6 fps. The [final focused audit](motion-after.json) measures Colour at 30.6 fps phone and 33.3 fps tablet, with 50 ms p95 frame intervals. These are short desktop-host samples, not physical Android certification or a 60 fps claim. The original frame-based simulation slows when frames drop.

The final audit waits explicitly for live reduced motion to take effect: both sizes then have zero changed sampled pixels and zero head displacement. Ignore the initial audit's tablet/day reduced pixel sample: it straddled the media-query change. Its earlier running sample was mistakenly included before the preference event settled. The final settled probes replace it.

The [native painter comparison](native-pixel-comparison.json) compares the unchanged original drawing into a full canvas with its new tight per-fish buffer, across three varieties and pixel densities 1/1.5. Translation produces 21–117 differing edge pixels per fish (11,680–31,078 nontransparent pixels); maximum channel difference 40, alpha difference 20. Native palette, scale and filters are retained; pixel identity is not claimed. Example raw transparent rasters: [direct](native-direct.png), [tight buffer](native-tight.png).

Reproduce locally with:

```sh
npm install
npm run build
npm run preview -- --host 0.0.0.0 --port 4170
# In another terminal, with Python's browser automation package and Chromium installed:
python bakeoff/study/entries/T/verify.py http://localhost:4170 /tmp/study-plates
node --test src/study/fish.test.js
```

The brush and [focused motion probe](verify-motion.py) use source imports and therefore need the dev server on port 5190 (`npm run dev -- --port 5190`). Motion output is written to `/tmp/study-t/motion/`. Performance depends on hardware and background load. No images were retouched.
