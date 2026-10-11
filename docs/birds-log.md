# Birds: what we tried, and why we stopped (October 2026)

We tried to give the board a second world, birds in a dusk sky, as an alternative to the koi.
Over four attempts none came close to the koi, so the bird worlds were removed. The code is in
git history if it's ever wanted again. This page is the record.

## Why the koi work and the birds didn't

The koi were adapted from open-source code where someone had already worked out the body
mechanics. A spine of joints, each following the last, makes the whole fish bend into its turns.
The tail lags behind the head. Speed, turning and depth come from one model of a swimming body.

Every bird we tried was either **a shape with flapping attached** (wings going up and down on a
body steered around circles) or **a good animation on a body that wasn't flying it** (an
animator's wingbeat played on a model we turned to face the steering). Neither is a bird flying.
A believable bird needs the same kind of body model the koi have:
- wingbeat tied to lift and speed
- climbing costs effort, gliding saves it
- banking into a turn (the body rolls, not just the heading)
- a pitch that follows climb and dive
- consistent up-ness: never belly-up

That is a project of its own, for a smaller return than the koi already give.

## The attempts

| # | What | Why not |
|---|---|---|
| 1 | **2D silhouettes** (`birds.js`): body, two wings that widened and narrowed, steering copied from the koi | Flat, "paper cut-out". The wings only stretched; the body never banked. |
| 2 | **2D, second pass** (`birds2.js`, Labs): Reynolds flocking, a wing bent at the wrist and folding on the upstroke, banking, glides between bursts of flapping, nine species (five from the Bible), painted clouds they flew through | Better, still cut-out. Drawing wing shapes in code, seen from one angle, never reads as flight. **The painted clouds were the one success** (lit from below, parting around a bird). |
| 3 | **Dusk in 3D** (`worlds/Dusk3D.jsx`): the same flight as low-poly 3D birds with hinged wings, clouds at real depths, parallax | Real depth and light, but the birds were toys moved by a formula. Lazy-loaded three.js (~134KB gz) for little gain. |
| 4 | **Bird gallery** (`/birds/`): the three.js keyframed **flamingo, parrot and stork** (ro.me), Quaternius's CC0 **eagle**, the three.js **GPU murmuration**, plus links to CodePen, Rive and Lottie | The animated models flap beautifully, but driven by our steering they **flew upside down** when heading left, and swam in circles rather than flying. The model's roll and pitch weren't tied to its flight. Lottie birds are fixed loops; Rive needs its runtime and a rig built for steering. Only the murmuration felt alive, because it's a flock, not a bird. |

## What we kept

- **The murmuration** (`/murmuration/`): three.js's `webgl_gpgpu_birds` (MIT), 1,024 starlings on
  the GPU at dusk. A finger scatters them. Kept as an experiment and the seed of the idea below.
- **The pond fixes made along the way**: the lily-pad slit no longer cuts through the
  commitment text, commitments show any verbs, and the friction practices line comes from the
  board.
- **What we learned about sources:**
  - CodePen public pens are MIT by default.
  - three.js examples are MIT; their bird models (ro.me) carry no separate licence.
  - Quaternius models are CC0.
  - Shadertoy defaults to non-commercial use.
  - LottieFiles uses its own licence.

## The idea worth trying instead

**A murmuration that writes the board's words.** Thousands of starlings pour and fold. Every
so often the flock gathers into a word (*Flourish*), holds it a breath, then lets it go again.
A touch scatters them, or draws them near.

This plays to the one thing that worked: the flock, not the bird. It also says the board's words
in a new way. It would be a page of its own (and a screensaver), not a replacement for the pond.
See `docs/STATUS.md`.
