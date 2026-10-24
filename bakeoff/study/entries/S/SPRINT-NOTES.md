# Style study S, sprint 2: notes

**Preview:** https://o-vision-git-bakeoff-study-s-dayoodunlamis-projects.vercel.app/study/
The links below are relative to it. Locally: `npm run dev`, then `/study/`.

- **Sprint 1 exactly:** `/study/?v=1`. This is a frozen copy of the sprint 1 code in
  `study/v1/`; it is not an approximation.
- **Sprint 2 (the default):** `/study/` or `/study/?v=2`. The code is in `study/v2/`.
- **Each change can be turned off** in the address, for example `?off=hills,squash`.
  - `?off=all` turns every switch off, leaving the sprint 2 baseline (items 1 and 2).
- All links open in Ink and wash by day (`dial=wash&h=12`) unless they say otherwise. Add
  `&h=22` for night.

## The list, one row per item

| # | What we changed | Switch | On | Off | Why it's better |
|---|---|---|---|---|---|
| 1 | **Restraint (baseline).** The landscape is recomposed: sky, three ranges of hills, one garden on the rise, one round pond in front, a lantern and a few reeds. Lots of paper between them. Cut: the five plants and tap-to-grow, the raised beds, the bank band, the mouse parallax. | none (baseline) | `/study/?dial=wash&h=12` | `/study/?v=1&dial=wash&h=12` | The eye has somewhere to rest, and the two places you can go into are the only things that ask for attention. |
| 2 | **A round pond, seen as an oval (baseline).** The pond is a circle. On the landscape it sits low, in a soft ring of bank, with stepping stones running down to it from the garden. | none (baseline) | `/study/?dial=wash&h=12` | `/study/?v=1&dial=wash&h=12` | It reads as a real place in the scene that you then look down into, not a flat third of the page. |
| 3 | **The wet-ink dial change** (from sprint 1, kept). The new step spreads out from the dial like colour into wet paper, with both steps live underneath. | `wetdial` | `/study/?dial=ink&h=12`, then touch a dial step | `/study/?dial=ink&h=12&off=wetdial`, then touch a dial step | Off, the change is a plain crossfade. On, the change itself is painted, as if colour were spreading through the paper. |
| 4 | **A slightly richer ink and wash.** Sprint 1's washes are kept at full strength (sky, hills, pigment in the koi and pads), on the calmer composition. Colour is untouched and stays clearly fuller. | `richer` | `/study/?dial=wash&h=12` | `/study/?dial=wash&h=12&off=richer` | Off, the washes are laid at 62% strength and 35% greyer, close to the calmer study's. On, there is a touch more life, still well below Colour. |
| 5 | **Hills with a little life, and rare birds.** Mist drifts slowly between the ranges. Now and then a cloud's shadow passes over the hills (about two minutes to cross). Two or three small birds fly over, slowly: the first after about 15–25 s, then once every one to two minutes, and only on the landscape. | `hills` | `/study/?dial=wash&h=12` (wait about 20 s for birds) | `/study/?dial=wash&h=12&off=hills` | The hills are alive without anything asking to be watched. Everything moves slowly, at low contrast, in the periphery. |
| 6 | **The pond seen at an angle.** The pond is drawn once from above, then squashed vertically to 0.5 on the landscape. The koi, pads, ripples and water lines are inside that same drawing, so they are smaller and squashed with it. There is no rotation or skew. | `squash` | `/study/?dial=ink&h=12` | `/study/?dial=ink&h=12&off=squash` | Off, the pond is a circle seen straight down, which sits flat on a side-on landscape. On, the foreshortening is the tilt. |
| 7 | **Full size in the pond.** In the pond view the koi are Quiet Waters' own, at today's size for the screen. On the landscape they're about a third of that. | `fullsize` | `/study/?dial=ink&h=12`, then touch the pond | `/study/?dial=ink&h=12&off=fullsize`, then touch the pond | Off, the koi stay landscape-sized when you go in, tiny in a big pond. On, you come close and they're real. |
| 8 | **One smooth move into the pond.** Touch the pond and the same drawing un-squashes and grows until it fills the screen, over 1.7 s. The scale grows geometrically and the centre moves in step with it, so it reads as one move towards a point. The landscape is carried with it (same camera) and fades. Back, or Escape, runs the same curve in reverse. | `smoothmove` | `/study/?dial=wash&h=12`, then touch the pond, then ← | `/study/?dial=wash&h=12&off=smoothmove`, then touch the pond | Off, the pond view crossfades in over the landscape. On, there is no wedge, no jump, and no change of fish: the koi you watched from the bank are the ones that grow. |
| 9 | **Koi respond to touch, as in Quiet Waters.** In the pond, a touch rings the water. The curious chagoi comes over and the shy shiro scatters (SpineFish's own personalities, unchanged). Double-tap, or press and hold, scatters food (Quiet Waters' `koiFood.js`, unchanged), and the koi notice it and come one by one. In Ink and Ink and wash the food is a dab of ink; in Colour it is Quiet Waters' own pellets. | `touch` | `/study/?dial=ink&h=12&view=pond`, then touch the water, then double-tap | `/study/?dial=ink&h=12&view=pond&off=touch` | Off, a touch only rings the water. On, the pond is the one you know, with the same fish behaving the same way. |
| 10 | **Walk into the garden.** Touch the garden and you arrive in the Abide field, by the same kind of move as the pond. Clear the ground: three stones and a thorn. Sow the week's word. The vine writes it along the trellis. See below. | `garden` | `/study/?dial=wash&h=12`, then touch the garden. Or straight in: `/study/?dial=wash&h=12&view=garden&fresh=1` | `/study/?dial=wash&h=12&off=garden` | The landscape becomes a place with a practice in it, not a picture. It's the part the children loved, in the same brush as everything else. |

No item made the study worse, so every switch is on by default. `flags.js` has a place
for switches that should default to off; it is empty.

## Item 10, the garden, in more detail

**The arrival.** The garden is not painted into the landscape. It is drawn once at the
size you'll see it close up, and the landscape shows that same drawing small (about half
size on a tablet). Touching it moves the camera towards it, as with the pond. The
landscape is carried along and fades to a faint wash of hills behind the trellis. The
stones, the thorn and (later) the word on the trellis are the same objects at both
sizes. So once the garden is done, the landscape shows *Planted* (this week's word)
written on the trellis.

**Clearing the ground** (after main's `abide/field.js` and `weeds.js`, without the
physics engine):
- **Three stones, each with a word cut into it:**
  - Undone: *Something I wish I'd done.*
  - Unsaid: *Something I wish I'd said.*
  - Heavy: *Something I've been carrying.*
- **The stones are heavy.**
  - Held, a stone follows the finger at 0.12 of the gap per frame, up to a speed cap, as
    the original's `HEFT.stone` does.
  - Pull too far ahead and it slips ("Too heavy to rush. It slipped. Slowly does it.").
  - Lift it and its prompt appears at the top of the page, for the person to answer
    silently.
  - Set it down off the plot and it goes to the low dry-stone wall at the edge, where it
    stays.
- **The thorn is a thistle carrying the word Worry** (*Something I keep worrying
  about.*).
  - Hold it and lift. Steady tension loosens the roots over about a second, and a thin
    ring of ink fills round it as they go.
  - A yank won't bring it out: it springs back ("Gently…").
  - Out, it comes roots and all, and is carried to the basket.
  - Dropped on the ground, it roots again where it lands.
- **Made for a child's finger on a tablet:**
  - stones about 125 px across on a tablet and 100 px on a phone, with touch areas bigger than the stones;
  - generous touch areas;
  - one short line of guidance at a time;
  - after 40 s without finishing, a quiet "Clear it for me".
- **Then the ground is clear.** A held beat, and the seed of the week's word appears
  above the soil ("Sow this week's word. Touch the soil.").

**Sowing, and the vine.**
- Touch the soil and the seed drops in, and a shoot comes up.
- The vine grows out of the old trunk and writes the word along the top wire, in about
  15 s. This is Flourish's writer (`vine.js`), unchanged, painted in the study's brush.
- The verse reference stays at the top.
- A finished garden stays finished for the week, on that device. `&fresh=1` starts it
  again.

## What we took from study T (with thanks)

- **The round pond seen as an oval, sitting in the landscape.** This is the client's
  baseline, and T's idea.
  - We kept our own pond drawing (wash, pads, ink koi) and our own geometry: one circle,
    squashed, which grows into the pond view.
  - We did not take T's pond code.
- **Restraint and empty paper.**
  - T's composition persuaded us to cut. The five plants, the beds and the bank band went.
  - The garden is now one trellis and one plot, and the sky is left as paper.
- **Stepping stones to the pond.**
  - T has stepping stones at its pond. Ours run from the garden down to the pond and tie
    the two places together.
  - Sprint 1's notes already wanted a path ("What doesn't yet").
- **The muted wash.** The `richer` switch, turned off, approximates T's thinner, greyer
  Ink and wash, so the two can be compared on one page.

We didn't take T's interface (title, info button, bottom dial pill) or its brush. The
dial, the brush, the wash and the paper are still S's.

## Calls we made without asking

- **The pond's geometry.**
  - The pond is a circle whose radius is half the screen's diagonal. Seen straight down
    at full size, it just covers the screen, so the pond view is the same circle.
  - On the landscape the koi keep well inside the pond. In the pond view they keep to the
    part of it that's on screen (only where they head next is chosen; how they swim is
    SpineFish's).
- **The size of the pond and the garden.**
  - On a phone the oval is 84% of the width; on a tablet, 54%.
  - The squash is 0.5, the middle of the range the brief gives.
- **Smoothmove covers the pond.** The garden always arrives by the same move: that is part
  of item 10. With `garden` off, there is no walk at all.
- **The garden, without physics.**
  - We left out Matter.js. Stones don't shove each other, and there is no rubble, wall
    building over days, seed-dropping penalties or patience setting.
  - Two or three stones and a thorn were the ask, and a lighter model keeps the frame
    rate and the code small.
- **The words.**
  - The stones carry a word and say what it's asking when lifted. We used both of the
    brief's ideas at once: the word on the stone, the prompt when lifted.
  - The prompts are in a child's plain words.
- **The week's word** comes from Quiet Waters' `verses.js`, so the garden sows the same
  word as the rest of the app that week. This week it is *Planted* (Psalm 1:3).
  - Sprint 1 always wrote *Rooted*.
- **The sprint 1 "vine moment"** (touch the trellis on the landscape and the vine writes
  a word) is gone. The vine now writes the word as the garden's ending, which is where
  the brief puts it.
- **The hint** now reads "Touch the pond, or the garden" (once per device). With `garden`
  off, it reads as before.
- **Night in the garden.** It uses the same indigo wash as everything else. The words on
  the page turn to paper-white.

## Product review (one line)

**Cut:** the plants and tap-to-grow, the raised beds, the landscape's vine moment and the
mouse parallax. They competed with the two places you can go into, and the brief asks for
restraint.

**Added:** a "Clear it for me" after 40 s, and a week-long memory of a finished garden,
so nobody gets stuck and nothing a family made is lost on refresh.

## What doesn't yet

- **The landscape's own layers are a bitmap,** carried along by the camera. They soften
  as they grow during a move. They have faded by the time it shows, but a frame-by-frame
  look will see it.
- **On a phone, the field leaves a lot of empty paper below the plot.** That's deliberate
  (restraint), but a real Abide would put the family's names or the week's row there.
- **The vine takes about 15 s to write the word,** at Flourish's own pace. Right for
  abiding, long for a demo.
- **The stones don't jostle,** and a stone can't be put back on another stone. A fuller
  version would bring back Matter.js.
- **The koi on the landscape are thin-lined at a third of their size.** They read as koi,
  but the ink line could thicken slightly as they shrink.

## Screens and recordings

All are in `screens/sprint2/` (see its README).
- **`before-*` and `after-*`:** the same views in sprint 1 and sprint 2.
- **`switch-off-*`:** each switch turned off.
- **`garden-*`:** the walk, step by step.
- **`move-*`:** frames of the two moves.
- **The recordings:**
  - `rec-into-the-pond-390.webm`
  - `rec-walk-into-the-garden-1180.webm`
