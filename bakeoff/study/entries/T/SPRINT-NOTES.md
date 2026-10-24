# Sprint 2 · a closer place

The starting point is T's delivered study at `79d8326`. Its runtime modules and stylesheet are frozen under `src/study/v1/`; only nested imports of the unchanged app modules move up one extra directory. The original entry HTML is frozen too, and supplies the body before the old module loads. `?v=1` selects that copy before any Sprint 2 code or styles load. Hashes are recorded in `sprint1-freeze.json`.

Sprint 2 is the default (`?v=2`). Every requested upgrade has one independent URL switch. `off` accepts a comma-separated list; unknown names are ignored. All eight upgrades are on by default. The table below records the implemented comparisons.

| Brief item | Change | Switch | On | Off | Why |
|---|---|---|---|---|---|
| 3 | The medium spreads from the touched dial across wet paper. | `wet` | [open](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=ink&h=12) | [open](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=ink&h=12&off=wet) | The whole place receives one new medium. |
| 4 | More pigment in Wash, with Colour retaining its richer role. | `pigment` | [open](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=wash&h=12) | [open](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=wash&h=12&off=pigment) | A little more life without making a louder front door. |
| 5 | Wind passes through distant hills; a few rare birds cross. | `birds` | [open](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=ink&h=12) | [open](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=ink&h=12&off=birds) | The distance belongs to the same living landscape. |
| 6 | Smaller koi foreshortened inside the oval pond. | `squash` | [open](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=ink&h=12) | [open](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=ink&h=12&off=squash) | Fish belong to the angled water. |
| 7 | Retain the supplied full-pond koi size. | `fullsize` | [open](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=colour&place=pond&h=12) | [open](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=colour&place=pond&h=12&off=fullsize) | Arrival brings the fish close. Off keeps the small landscape fish in the open view. |
| 8 | An ellipse grows continuously beyond the frame; Back reverses it. | `arrival` | [open](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=ink&h=12) | [open](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=ink&h=12&off=arrival) | A single view opens without a wedge. |
| 9 | Curious/shy touch responses and double-tap feeding. | `touch` | [open](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=colour&place=pond&h=12) | [open](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=colour&place=pond&h=12&off=touch) | A child can meet the same living koi. |
| 10 | Enter the garden, clear stones and thorn, sow Rooted, and watch the vine write. | `garden` | [open](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=wash&h=12) | [open](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=wash&h=12&off=garden) | The new place has one small meaningful thing to do. |

For `wet`, change the dial after opening. For `arrival`, tap the pond and then Back. In the full pond, hold a finger near a koi or tap twice to feed. The distant birds are deliberately rare; leave the scroll open for about a minute. Switches combine, for example `?off=birds,pigment`.

## Sources and decisions

Read and ran S's delivered study (`f237691`) locally at phone and tablet size. Borrow the idea of a radial, feathered dial reveal originating at the control (`study/main.js`, `setDial` and `draw`), with credit to studio S. Implement it within T's renderer; no wholesale page or asset copy. S's fuller pigment, mobile mist and distant brush birds inform the requested refinements. T keeps its oval basin, negative space, typography and brush implementation.

The sprint explicitly permits learning from S and supersedes the earlier seal. Its instruction to merge the base supersedes the original no-merge rule. Existing application routes remain outside the work.

Use the house art-direction and product-review passes. Keep sky a view; no extra settings UI, streaks, points, saved personal input or full practice flow. Interaction switches live only in URLs. The garden's incomplete phrases are prompts to think, never traits assigned to a person.


## What changed in the drawing

The new oval has a height/width ratio of 0.52. Its wider-frame diameter is capped by height, so it reads as a round place rather than a long water strip. The same native fish drawing is compressed vertically in the scroll, never rotated or skewed. A uniform, smaller framing keeps the shoal subordinate to the garden. As the oval opens its axes grow continuously until its boundary lies beyond the screen corners. The reverse follows the same function. `off=arrival` restores the old superellipse route for comparison.

Interpret “today’s size” as the full-pond reference supplied and judged in Sprint 1. Keep those fish, their construction and their unscaled open-view drawing. Only the landscape makes them smaller. `off=fullsize` deliberately retains the small fish in the open view, so the client can isolate the enlargement. The original app also offers a screen/person-dependent construction rule in `PondView.jsx`; applying that to three fictional adult fish changed an already accepted view, so it is excluded from the final refinement. The original `SpineFish` class and its renderer remain untouched; different media read the same persistent skeleton. The original `FoodBowl` supplies curiosity, flight, gradual food noticing and eating. Three small pellets are one pinch; there is no new reward loop.

Studio S’s radial, feathered transition is the credited starting idea for `wet`. T paints the old and new medium from the same current pose, then reveals the new drawing from the touched dial. Fast successive choices start from the actual visible frame, avoiding a flash. Paper receives no world; reduced motion changes immediately.

The garden is the same drawing at two framings, clipped into its distant band before a uniform enlargement opens it. No page navigation or replacement world occurs. Three stones carry unfinished phrases; lifting reveals their longer prompt. A thorn’s exposed roots loosen under steady upward tension. Stones lag behind a dragging finger; tap and keyboard activation provide a forgiving equivalent. Cleared stones remain beside the bed and the thorn goes into a basket. Nothing is scored.

Choose **Rooted** as the study week’s word, echoing the original brief’s family word and Colossians 2:7. This is a deliberate fixed demonstration, not a claim to read the family’s current record. After sowing, the seed descends and one vine writes the word along the trellis over about eleven seconds. Its large completion is held without another task. No response is typed, stored or transmitted; refreshing starts this small demonstration again.

## Reuse and licences added this sprint

- Studio S, delivered commit `f237691`: read and ran its phone/tablet dial and pond/back. Learned from `study/main.js`, `paint.js` and its study notes: radial reveal, clearer green/ochre separation, separately cached hill motion and rare paired birds. T implements those ideas in its own renderer and shared pressure brush; no S page, illustration or module pasted in.
- Existing `src/app/pond/PondView.jsx`, `KoiSchool.jsx` and `koiFood.js`: repository-authorised reference for size, and reuse of input/environment and FoodBowl behavior. The original fish source remains byte-identical.
- `origin/main:src/flourish/abide/field.js` and `weeds.js`: adapted the capped, lagging stone response and tension-released roots, redrawn with T’s brush. The full physics runtime, reseeding punishment and practice storage are excluded.
- `origin/main:src/flourish/lib/allure.js` and `vine.js`: five-glyph EMS Allure centre-line subset and arclength growth idea. Font data by Sheldon B. Michaels, derived from Allura by Rob Leuschke, SIL OFL 1.1; SVG conversion credited to Windell H. Oskay / hersheytext. Font notice in `src/study/vendor/EMS-Allure-OFL.txt` and `/study/NOTICE.txt`. No conversion code is incorporated.
- Sprint 1’s sources and licences remain in [STUDY.md](STUDY.md).

## Review and limits

**Verdict: ship with the grounding and input fixes applied.** Protect the negative space, the oval, one continuous arrival and the readable vine. The trellis posts now reach the soil. Reduced-motion thorn dragging completes without waiting for an animation loop; tapping and native buttons reach the same state. Wind, distant movement and fish stop for Paper; reduced motion suppresses all ambient movement. The garden keeps the background still while a prompt is being read or the word grows.

Cut continuous mist curtains, pointer parallax, decorative sun and extra landscape marks because they spend the empty-paper advantage. The short pond hint leaves after a touch or eight seconds; controls for debugging are URL switches rather than extra settings UI. Birds are two tiny, slow marks, with starts more than a minute apart; they never appear during reading or clearing.

The motion audit exposed unnecessary repeated painting work. Each native fish now owns a tight reusable buffer, which shrinks after a large change of orientation. Wash absorption is a bounded, seeded per-mark mask rather than 18–45 fresh radial gradients for every mark every frame. Its geometry and pigment layers still move with the skeleton. A fixed before/after fixture has mean RGB error 0.0082/255, maximum channel error 2; repeated marks and caller alpha restoration pass. The warm moving-fixture workload dropped from 474 ms to 360.5 ms (24%), with 4,860 gradient constructions reduced to zero. This is a rendering optimisation, not a filter on a fish or finished frame. Sprint 1 retains the original implementation.

Final production captures, native recordings, switch checks and measured limits are indexed in [screens/sprint2/README.md](screens/sprint2/README.md). Physical Android testing remains necessary; software-rendered desktop measurements are reported as measurements, not a smoothness certification.


Validation is complete: production build, all 18 focused tests, 48 after states, eight fresh before plates, twelve completed-word plates, all eight individual switches, combined switches, genuine finger drags and double-tap feeding, keyboard clearing, live reduced motion and both native recordings pass. There are no page errors, horizontal overflow or controls below 48 px. The frozen source hashes and unchanged original app source are verified. Full-pond Wash measured 10.9–21.3 fps on the software-rendered host; that is the remaining performance risk, requiring a check on the client's Android tablet. No physical-device or 60 fps certification is claimed.
