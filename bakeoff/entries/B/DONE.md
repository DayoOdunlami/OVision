# Studio B — ready

**Tend. Scripture, held together.**

Branch: **`bakeoff/r1-b`**. Gate 1 is complete; this entry is ready for review.

## Preview and demo

The preview is the **`bakeoff/r1-b` branch deployment** in the client's `o-vision` project. Its direct hostname could not be retrieved through the available deployment connection (403); this uses the branch-name fallback allowed in RULES.md. The client can open the protected deployment while signed in.

[Successful deployed product and evidence build](https://vercel.com/dayoodunlamis-projects/o-vision/9XfNa82ew9F8MBWUxxnzh1GW24jT)

Demo path on that preview: **`/?demo=1&h=12`**. It fills an empty device with an invented household and three weeks of memories, without overwriting an existing household.

For local review:

```sh
npm ci
npm run build
npm run preview -- --port 4173
```

[Open the demo locally](http://localhost:4173/?demo=1&h=12).

## Open these three first

1. **06:45, quietly:** [phone prayer](http://localhost:4173/?demo=1&view=prayer&mode=solo&h=6). Begin, read slowly, pray and leave with one small response.
2. **After dinner, together:** [shared prayer](http://localhost:4173/?demo=1&view=prayer&mode=together&h=18), then play after Amen. For a quick game inspection, [open verse play directly](http://localhost:4173/?demo=1&view=play&mode=together&h=18).
3. **A few weeks in:** [the garden and household memories](http://localhost:4173/?demo=1&view=garden&h=12). Feed the koi, filter the pages, or leave the ambient garden open.

Use the same query paths on the branch preview. [DIGEST.md](DIGEST.md) links every moment, including Sunday, reflection, seasonal review and first run. [PITCH.md](PITCH.md) is the one-page case; [screens/README.md](screens/README.md) is the before/after gallery and the rendered rivals are in [DESIGN-DIRECTION.md](DESIGN-DIRECTION.md).

## Verification and limits

Static build and eleven model tests pass. The production household walkthrough passes eighteen assertions plus seven focused regressions. The game passes phone/tablet, touch, drag, keyboard, reduced motion and enlarged-text checks. The final built book opens prayer and the lazy game offline with saved data retained and no browser errors. The gallery contains all eight moments at both sizes, day/night, plus the front door and child reflection.

The two-second launch target is **not proved**, and the throttled proxy misses it. Native Android installation and an actual family panel remain untested. These limits, timing receipts, secondary gaps and cuts are recorded in the digest. No accounts, backend, paid services, API keys, sound or new-discipline modules were added.

Written last. Studio B stops here and waits for Gate 2.
