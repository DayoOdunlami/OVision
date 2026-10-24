# A place held in reserve

*Sprint 1 record. For the current refinement, see [SPRINT-NOTES.md](SPRINT-NOTES.md).*

One landscape, with room to breathe. The eye travels from distant hills through a tended garden to water seen from above. The dial changes the medium, not the place or the life within it. Ink is the default; Paper withdraws the world entirely.

## Decisions

We choose an asymmetric bank, generous untouched paper and a quiet far distance. On a phone the places stack vertically; a landscape tablet gives the garden and pond more lateral space without making a single-perspective scene. One shared wind moves a few stems. The mist stays still. We rejected constant parallax, tilt and birds: the fish already supply enough independent life.

Ink is a brush interpretation of the existing koi skeleton, not an outline filter. Pressure is explicit and anchored along each stroke; dry fibres use stable local seeds so they travel with the fish rather than flickering. The same brush makes reeds, plant stems, stones and hill ridges. Thin, differently deformed polygon layers create pigment washes, with a little edge accumulation and static paper fibres. Those layers are prepared once.

The pond opens by expanding its own painted boundary into the frame. There is no perspective rotation and no reset of the fish. A quiet Back control reverses the same movement. The four dial steps cross-dissolve their drawing treatments while the same simulation continues underneath. Paper is a plain reading surface, with no landscape or fish hidden behind a monochrome filter.

The independent motion pass identified an important constraint: the original koi draw method also advances the fin and tail skeleton. The original draw advances those joints once per simulation tick. Its visible result supplies Colour; Ink and Wash interpret the same resulting points. Hidden colour drawing uses a non-rasterising context, retaining the exact motion calls while avoiding invisible blur work. A stale colour cache can be refreshed at the held pose with only those two already-completed motion calls suppressed. A dial crossfade must never advance the skeleton twice.

## Research and source ledger

- [Asian Art Museum: a visual vocabulary of brushstrokes](https://education.asianart.org/resources/a-visual-vocabulary-of-brushstrokes/). Reference for pressure, speed, moisture, dry brush and line-only description. No image or text copied.
- [Smithsonian: Fish and water weeds](https://asia.si.edu/explore-art-culture/collections/search/edanmdm%3Afsg_F1911.226/). Reference for observed fish movement and restrained water description; no artwork copied.
- [Metropolitan Museum: Landscape in the style of Huang Gongwang](https://www.metmuseum.org/art/collection/search/48934). Reference for stacked, interlocking landscape spaces, not a composition to reproduce. No artwork incorporated.
- [Tyler Hobbs: simulating watercolour](https://www.tylerxhobbs.com/words/a-guide-to-simulating-watercolor-paint-with-generative-art). Layered, variably deformed polygons inform an original small implementation. No code licence assumed and no snippet or image copied.
- [perfect-freehand](https://github.com/steveruizok/perfect-freehand): MIT, copyright 2021 Stephen Ruiz Ltd. Adopt its pressure-outline generator, with explicit pressure rather than velocity inferred from screen movement. Its notice remains in the installed package; a copy accompanies the study.
- [Rough.js](https://github.com/rough-stuff/rough): MIT, copyright 2019 Preet Shihn; researched, not used. Rejected the double-outline pencil character.
- [p5.brush](https://github.com/acamposuribe/p5.brush): MIT, copyright 2023–2026 Alejandro Campos Uribe; researched, not used. A full WebGL painting runtime is excessive for this small moving study.
- Existing `src/study/wind.js`: copied unchanged from `src/flourish/abide/wind.js` on `main`, repository-authorised reuse of the shared travelling wind.
- Fraunces and Literata: the app’s existing self-hosted fonts, SIL Open Font License 1.1. Notices, including perfect-freehand’s MIT text, are shipped at `/study/NOTICE.txt`.
- Existing `src/app/pond/KoiSchool.jsx`: adapted its tight per-fish canvas bounds/compositing technique, without its additional rise, scale or filtering behaviour. Repository-authorised reuse.
- Existing `src/app/pond/SpineFish.js`: the repository-authorised living koi, including its upstream notice. Import without editing. Do not claim an unverified upstream licence.

## Study boundaries

No practices, saved data, households or purpose-board implementation. Existing pages remain untouched. All planting is a fictional six-part garden. This is a study of medium, composition and arrival, not a reproduction of a specific painting or a claim of traditional brush mastery.

## What the working study establishes

The first pass exposed unsettled native joints, an evenly measured plant row, hard lower hill edges and an inner rectangular fish-cache cut. We settled the original pose before exposure, clustered the planting, varied the wash’s lower-edge deformation and added transparent overscan around the fish. The basin alone now clips them. Its uniform enlargement takes 1.65 seconds; bodies never stretch or restart. Paper, reduced motion and a hidden tab stop the loop. A live reduced-motion change works without reload. Guidance appears once per session and leaves; dial and place are encoded in the URL, with no household record.

Each wash is a neutral coverage mark, made from differently deformed layers and sparse absorption, tinted with its pigment before placement. That avoids tiny-alpha colour quantisation. Pressure outlines, dry fibre gaps and pooled landings are applied to individual brush marks. The paper tooth stays fixed. Static hills, beds, trellis, stones, lilies and plant sprites are cached; only fish and the single wind move. Three koi are the study’s limit, with smaller framing on the scroll and their original scale in the open pond.

**Verdict: ship the study with the craft fixes applied.** Protect the void, original koi motion and single arrival gesture. Cut birds, constant parallax, decorative particles and persistent guidance because they would ask for attention without helping this study. The same geometry carries each medium; Colour retains the original opaque koi and their volumetric drawing. The planting is an illustration, not a botanical simulation; the handmade effect remains procedural, not a claim of traditional brush mastery.

Research and direction were committed before product code (`46dd100`). The build and motion invariants pass. Browser checks cover phone and tablet, day and night, the four dial steps, pond arrival/return, keyboard access, Paper’s fully unpainted canvas and live reduced motion. `screens/` contains the full plates, native motion evidence and colour/ink comparison. Static plates hold one pose so differences in medium can be compared; the recording and cadence audit show movement separately. Tight native per-fish buffers lifted full-pond Colour from roughly 3–6 to 31–33 fps on software-rendered Chromium (50 ms p95). The native painter is unchanged, but translated buffers introduce rare edge-antialias differences, recorded alongside the motion audit. Ink measured 23–35 fps and Wash 14–20 fps on that host. Physical Android performance is not certified; the original frame-based simulation also swims more slowly when frames drop. This remains the main performance risk.

## If this became the app

Put this entry’s calm front door in front of the existing practices, then give each place its own deliberate arrival. The garden and sky are currently visual destinations; only the pond opens. The trellis carries a small vine, with no word-writing or growth interaction in this study. Bring the proven word writer forward for a chosen sowing/gathering moment, then return it to the garden. Next, test sustained frame time and memory on the actual Android tablet, compare the four media with the family, and refine the full-colour planting against the koi’s richer volume. No saved boards, practice rewrite, stock image or extra world was added.
