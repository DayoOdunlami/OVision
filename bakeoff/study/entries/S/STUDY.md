# Style study S

One page at `/study/`. It is a hanging-scroll landscape (pond, garden, hills) with a
four-step colour dial: Paper, Ink, Ink and wash, Colour. Every layer is painted in code
with one brush and one wash, on one sheet of paper. The koi are Quiet Waters'
`SpineFish`, untouched, painted rather than filled.

## The decisions

### Composition, and how the scroll fits phone and tablet

The places are stacked up the page, each seen from its own angle. The pond is at the
foot, the garden in the middle, the hills and sky at the top. The scroll fills the
screen without scrolling at both sizes:

| Band (share of the height) | What it holds | Seen from |
|---|---|---|
| 0–33% | Far, middle and near hills, with mist between them | The side, far off |
| 37–57% | A trellis with the vine along the back; raised beds with five plants at different stages; a stone lantern at the water's edge | The side |
| 64–100% | The pond | Above |

The same proportions serve the tablet. The wider frame gets more posts, three beds,
more stones and longer ridges, rather than a different composition.

**Parallax.** There is no 3D camera. The world drifts on its own: mist between the
ranges, the one wind in the grass and plants, the water lines, and now and then a few
birds. With a mouse, the layers part slightly. We left out tilt, because on a tablet
that never stops moving it pulls at you and costs frames (the calm test).

### The ink technique

There is one brush (`study/brush.js`). A stroke is a line of points with a pressure for
each, turned into a variable-width outline by **perfect-freehand**. Five things make it
read as ink rather than as a vector line:

1. **The press.** Every stroke presses as it lands (wider), runs full, and lifts to a
   hairline. A "dab" press makes the teardrop fins and the boneless leaves.
2. **Stable wobble.** Each point is nudged along its normal by smooth noise, seeded per
   stroke and indexed along the stroke. The same stroke wobbles the same way every
   frame, so nothing flickers.
3. **Pooling.** Ink beads where the brush lands, and a little where it lifts.
4. **Dry brush (kasure),** for still things only. The stroke is laid as a few bristles,
   each with its own load of ink that runs out at its own point, so the tail breaks into
   streaks.
5. **Paper.** A grain tile made in code (cloudy tone, fibres, tooth) is laid over
   everything with `multiply`. The koi's ink is filled from an uneven ink tile fixed to
   the sheet.

**Lines are left open.** Lines break where a painter would lift the brush: the koi's
flanks, the lily pads, the ridges and the wires.

**The ink koi** (`study/inkKoi.js`) are drawn on the very same moving skeleton:
- **The back:** one side-loaded stroke down the spine, dark at the spine and paling
  outwards.
- **The flanks:** a lighter line on each side, broken twice, heavier at the shoulder.
- **The head:** one curved press.
- **The front fins:** a single teardrop dab each. The rear pair is small and pale.
- **The tail:** two dry flicks.
- **The markings:** in Ink, tone only (sumi dark, red as pale ink). In Ink and wash,
  vermilion and ochre washes laid under the line.

`SpineFish` advances its fins and tail inside its own `draw()`. The ink drawer calls
the same `act()` once a frame instead, so the motion is identical. No filter, no
rebuilt fish. **Colour** is `fish.draw()` exactly as today.

### The wash technique

`study/wash.js` follows Tyler Hobbs' published method:
- **Deform.** A rough polygon is deformed by recursive midpoint displacement, each new
  vertex drawn from a Gaussian, with per-vertex variance.
- **Glaze.** It is laid as 6 to 18 nearly transparent glazes, each deformed again from
  the same base.
- **Edge.** A faint line along the last glaze gives the pigment that gathers at a
  drying edge.
- **Granulation.** Every fourth glaze goes through a granulation tile.

**Fades.** Hills and sky fade into mist: they are painted on their own sheet and faded
with a gradient mask.

**Colour.** Colour uses the same washes, fuller, with the line in a lighter, warmer
ink.

### The dial and its transitions

The dial is four small marks at the top right, at 62% opacity until touched. The step's
name shows for two seconds.
- **Between Ink, Wash and Colour,** the new step spreads out from the dial like colour
  into wet paper. It is a soft radial mask over a second canvas, over 1.5 s, with both
  steps live underneath, so the koi never freeze.
- **Paper** dissolves the world over 1.2 s into a plain sheet with this week's verse.
  Going back, the world dissolves in again.
- The step is remembered on the device and kept in the address (`?dial=`), so any link
  opens a given state.

### Into the pond

The koi swim in the pond's own frame: the whole screen, seen from above. On the scroll
you see a band of it through the bank, and three koi keep to that band; we chose only
where they head next, not how they swim. Two more roam beneath the bank and come and
go.

**The move.** Touch the water and, over 1.5 s:
- the page slides down towards the pond;
- the garden and hills fade;
- the bank's stones and lantern fade;
- the water opens out from the bank's edge to fill the screen.

The koi carry on at the same size and speed, because they were always in that frame.
The way back (or Escape) reverses it.

**In the pond:** a touch rings the water and the curious koi come to look, as in Quiet
Waters.

### Day and night

Day and night follow the clock, or `?h=`.
- **Night:** a graded indigo wash laid over the sheet with multiply (deepest in the
  sky), and a moon of bare paper with a wash ring.
- **Dawn and dusk:** a warm wash at the horizon. By day, a vermilion sun is the only hot
  note.

### Optional extras (both done)

- **Plants:** touch a plant and it grows one stage (seed, sprout, young, bud, flower or
  fruit).
- **The vine:** touch the trellis and the page leans in a little. The air in front of
  the trellis clears, and the vine writes *Rooted* along the top wire. This is the old
  Flourish writer, unchanged, painted with this brush. It stays about 20 s; a touch ends
  it sooner.

### Other calls made without asking

- **Ink means tone in one ink, not only line.** Pale ink for the far hills and for the
  koi's red. Ink painters use tone, and line alone made the koi unreadable.
- **The bench.** An art-director pass critiqued the first renders. We took nine of its
  ten points (brush pressure, open lines, fin dabs, a side-loaded back, clustered
  tufts, lean in the posts, boneless leaves, a graded night, a paper moon). We
  overruled one: it wanted the Colour koi run through the brush too. The brief says
  Colour is today's koi, unchanged, so the paper grain is the only thing laid over
  them.
- **Guidance.** It appears once ("Touch the pond to go in"), then never again on that
  device.
- **Comparing.** `?compare=1` shows the same koi at the same instant in Colour and in
  the chosen step, side by side.

## What works

- **The koi keep their motion exactly.** The skeleton, the fins and the tail are the
  same code, stepped once a frame. `?compare=1` shows it.
- **One hand.** The same brush, wash and paper paint the pond, garden, vine, hills, sky
  and koi at every step, and Paper is the same sheet with nothing on it.
- **Calm.**
  - Nothing loops: mist drifts, birds come at most about once a minute, and the wind is
    three slow incommensurate waves.
  - No text on the world except the hint, shown once.
  - The dial is quiet until touched.
- **The move into the pond** reads as one movement, and the fish don't jump.
- **Cost.**
  - The still parts are painted once per dial step, then flattened into one image.
  - Bank and water are cropped to what shows.
  - A slow device drops to every other frame and loses the blurred koi shadow.
  - Reduced motion (or `?rm=1`) gives a still page.

## What doesn't yet

- **The ink koi are good, not yet great.** The breaks in the flanks are at fixed places
  along the body. A painter would vary them with the fish's bend, and the head could
  take a firmer, more characterful press. Up close they can read a little "rubbery".
- **The stones on the bank read as loaves.** They want real cun texture strokes and
  more variety of shape.
- **The garden floor is a band of empty paper.** That is intentional ("mist"), but a
  stepping-stone path would tie the garden to the pond.
- **Allure's script draws "Rooted" with an open o.** At small sizes the word can read as
  "Raoted".
- **Performance on a real Android tablet is untested.** In headless software rendering
  at 1180 × 820 and 1.5× pixel density, frames run at about 30 fps (the phone at 60).
  The page's own fallback halves the frame rate if needed.
- **Quiet Waters' service worker** caches every page under `/`. Visiting `/study/`
  online could make an offline open of `/` show the study. We didn't touch it (out of
  scope), but it should be scoped before this ships.

## Sources and licences

| Source | What we used | Licence |
|---|---|---|
| perfect-freehand (Steve Ruiz), npm 1.2.2 | Variable-width stroke outlines: the heart of the brush | MIT |
| Tyler Hobbs, *A guide to simulating watercolor paint with generative art* (2017) | The wash method: recursive Gaussian deformation, stacked glazes, varied detail | Essay; method reimplemented, no code copied |
| sighack, *Generative watercolor in Processing* | Notes on interleaving glazes | Essay; reference only |
| Strassmann, *Hairy brushes* (SIGGRAPH 1986) | The idea of a brush as bristles carrying their own ink (our dry brush) | Paper; idea only |
| Lingdong Huang, *{Shan, Shui}\** (shan-shui-inf) | Reference for procedural ink landscape: ridge strokes, texture strokes, mist | MIT (per index; not checked in the repo); reference only, no code copied |
| Paper Shaders / Remotion paper effect | Reference for what makes procedural paper read (fibres, tooth, tone) | Reference only |
| Quiet Waters `src/app/pond/SpineFish.js` (from akeatk/fish-pond, per its header) | The koi, unchanged | In repo |
| `main: src/flourish/lib/vine.js`, `allure.js` | The vine word-writer, unchanged; EMS Allure single-stroke font | In repo; the font is SIL OFL 1.1 |
| `main: src/flourish/abide/wind.js` | The one wind, unchanged | In repo |
| Literata (via @fontsource) | The verse and the dial's labels | SIL OFL 1.1 |

Everything else (paper, ink tile, hills, garden, lantern, stones, pads, plants, mist)
is drawn in code. There are no images and no stock.

## If this became the app

- **Make the scroll the home screen,** with Ink as the default. Children will turn the
  dial to Colour, and it's remembered per device.
- **Give each place its practice:**
  - **The pond:** Into the deep (the stone dropped into the water) and feeding the koi.
  - **The garden:** Abide, one bed per person, growing with the weeks.
  - **The vine:** comes forward for the family's word.
  - **The sky:** where the starlings write the verse, and the hills hold it.
- **Make every room paper,** in the dial's palette. Paper itself is the 06:45 prayer's
  natural home.
- **Craft next:**
  - Koi strokes that respond to the fish's bend and speed (thinner and faster lines when
    it darts).
  - A proper cun library for rocks and hills.
  - The vine's growth tied to the season, not to a tap.
  - A WebGL paper pass, if the tablet needs the headroom.
