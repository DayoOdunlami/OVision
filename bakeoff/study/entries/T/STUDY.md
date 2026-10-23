# A place held in reserve

One landscape, with room to breathe. The eye travels from distant hills through a tended garden to water seen from above. The dial changes the medium, not the place or the life within it. Ink is the default; Paper withdraws the world entirely.

## Direction, before implementation

We choose an asymmetric bank, generous untouched paper and a quiet far distance. On a phone the places stack vertically; a landscape tablet gives the garden and pond more lateral space without making a single-perspective scene. One shared wind moves a few stems. The mist stays still. We rejected constant parallax, tilt and birds: the fish already supply enough independent life.

Ink is a brush interpretation of the existing koi skeleton, not an outline filter. Pressure is explicit and anchored along each stroke; dry fibres use stable local seeds so they travel with the fish rather than flickering. The same brush will make reeds, plant stems, stones and hill ridges. Thin, differently deformed polygon layers create pigment washes, with a little edge accumulation and static paper fibres. Those layers are prepared once.

The pond opens by expanding its own painted boundary into the frame. There is no perspective rotation and no reset of the fish. A quiet Back control reverses the same movement. The four dial steps cross-dissolve their drawing treatments while the same simulation continues underneath. Paper is a plain reading surface, with no landscape or fish hidden behind a monochrome filter.

The independent motion pass identified an important constraint: the original koi draw method also advances the fin and tail skeleton. We will call that original colour draw once per simulation tick, retain its exact result for Colour, and interpret the same resulting points for Ink and Wash. A dial crossfade must never advance the skeleton twice.

## Research and source ledger

- [Asian Art Museum: a visual vocabulary of brushstrokes](https://education.asianart.org/resources/a-visual-vocabulary-of-brushstrokes/). Reference for pressure, speed, moisture, dry brush and line-only description. No image or text copied.
- [Smithsonian: Fish and water weeds](https://asia.si.edu/explore-art-culture/collections/search/edanmdm%3Afsg_F1911.226/). Reference for observed fish movement and restrained water description; no artwork copied.
- [Metropolitan Museum: Landscape in the style of Huang Gongwang](https://www.metmuseum.org/art/collection/search/48934). Reference for stacked, interlocking landscape spaces, not a composition to reproduce. No artwork incorporated.
- [Tyler Hobbs: simulating watercolour](https://www.tylerxhobbs.com/words/a-guide-to-simulating-watercolor-paint-with-generative-art). Layered, variably deformed polygons inform an original small implementation. No code licence assumed and no snippet or image copied.
- [perfect-freehand](https://github.com/steveruizok/perfect-freehand): MIT, copyright 2021 Stephen Ruiz Ltd. Adopt its pressure-outline generator, with explicit pressure rather than velocity inferred from screen movement. Its notice remains in the installed package; a copy will accompany the study.
- [Rough.js](https://github.com/rough-stuff/rough): MIT, copyright 2019 Preet Shihn; researched, not used. Rejected the double-outline pencil character.
- [p5.brush](https://github.com/acamposuribe/p5.brush): MIT, copyright 2023–2026 Alejandro Campos Uribe; researched, not used. A full WebGL painting runtime is excessive for this small moving study.
- Existing `src/app/pond/SpineFish.js`: the repository-authorised living koi, including its upstream notice. Import without editing. Do not claim an unverified upstream licence.

## Study boundaries

No practices, saved data, households or purpose-board implementation. Existing pages remain untouched. All planting is a fictional six-part garden. This is a study of medium, composition and arrival, not a reproduction of a specific painting or a claim of traditional brush mastery.

Implementation, browser evidence and honest limits will replace this working note before hand-in.
