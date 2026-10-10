---
name: abide-direction
description: Art direction and motion bible for the Flourish/Abide pages (the vine, the field, the vineyard) and the pond. Use before adding or changing anything visual or animated there — a new effect, ambient detail, transition, camera move, colour, or interaction feel — and when asked to make it "more alive", "more beautiful", "more polished", or "less busy". Gives the world's rules, the attention budget, a "not doing" list, and a director's checklist every change must pass.
---

# Abide: art direction

Act as the art director on a small, excellent studio's film. Every visual detail is
judged against this page before it's built. "It looks nice" is not a reason; "it serves
the moment" is.

## What the page is for

A family, often children, on one shared tablet or phone, for about three minutes a day:
**clear the ground → sow a word of Scripture → abide while it grows, at the pace of
breath → gather it into the family vineyard.** The outcome is attention and memory (one
word carried into the day), and over weeks, a vineyard that shows what has taken root.

So the world must feel **alive, calm, and unhurried**. It is a place you visit, not an
app you operate. When in doubt, choose stillness.

## The world

- **One continuous place.** Sky, soil, the field, the vine, the vineyard hillside: one
  world, one light, one wind. Moving between steps is a camera move or a crossfade
  inside that world, never a page change. Objects persist (the wall, the compost, the
  vineyard rows) and the seasons and the clock change them.
- **Hand-made, not rendered.** Illustrated shapes drawn with care (gradients for form,
  a rim light, a soft contact shadow), never glossy UI chrome. Physicality is earned:
  stones have weight, thorns have roots, seed drifts.
- **Light follows the real clock** (`skyAt`: dawn warm, day pale, dusk amber, night
  blue with stars) and **the calendar** (`season.js`). Night darkens everything
  together, by the same tint.

## Palette

- Sky and paper: warm off-whites by day (`#e8eee6`–`#f7f3ea`), deep blue by night
  (`#24304a`–`#3b4563`).
- Soil: `#8d6c4b` → `#4f3a29`; rich (cared-for) soil darker and warmer.
- Growth: fresh lime `#b4d43d` maturing to `#6c9a2e`; leaves in teal-greens, autumn in
  amber/russet.
- Fruit: green `#a9c562` → ripe `#5b2d6e`. Gold `#c98e2e`–`#fbe3a0` is reserved for
  *meaning*: family days, together-garlands, good soil, the target slot. Never decorative.
- Ink `#2F3A2C`; serif italic (Cormorant Garamond) for Scripture and the word; Source
  Sans for small labels; bold condensed caps for carved stones only.

## Motion grammar

- **One wind.** All ambient motion comes from the shared wind field
  (`abide/wind.js`): grass, leaves, weeds, clouds, falling leaves/snow, the vineyard.
  Nothing sways on its own private sine. A gust travels across the scene left to
  right, so neighbours move together, slightly offset.
- **The world breathes with you.** While abiding, the wind follows the breath (rising
  on the in-breath, settling on the out). This is the signature detail; protect it.
- **Slow, small, low-contrast.** Ambient motion stays under about 0.5 Hz, a few pixels,
  in the periphery. Noise-like, never metronomic.
- **Stillness for reading.** While the verse is on screen, ambient motion drops to a
  whisper (the `calm` factor). Life between readings, stillness during them.
- **Lines draw on, things grow in.** Prefer growth and drawing-on over fades;
  springs without bounce for objects, ease-out for camera moves.
- **Holds.** After a key moment (the field cleared, the word sown, the vine gathered)
  hold for a beat before the next thing asks for attention.
- **Camera, not cuts.** The gather is a flight into the vineyard; the overnight reveal is
  a slow push-in. Use the camera for emphasis instead of adding effects.

## The attention budget

- At most **three depth layers** (sky, far, near) and **one or two things moving** in
  view at once beyond the wind.
- At most **one rare surprise a minute** (a bird crossing, nothing more), and never
  while the verse is showing or during the clearing work.
- Anything that moves must be either **the wind**, **the user's own action**, or
  **meaning** (growth, ripening, a garland). If it's none of those, cut it.
- Reduced motion: wind off, no surprises, no camera moves; the page still works.

## Not doing

- Particles for sparkle, glows for decoration, confetti, bouncing icons.
- Separate sine-wave wobbles per object.
- Effects during the verse.
- Gold for anything that isn't meaning.
- Text over busy motion; labels that move.
- Sound (backlog), video, 3D models, or a different art style per day (backlog:
  weekly styles on the same drawing code, weather first).
- Anything that rewards rushing.

## Director's checklist (run on every visual change)

1. **Moment.** Which step is this for (clear, sow, abide, gather, vineyard), and what
   should the person feel there? One sentence.
2. **Source of motion.** Is it the wind, the user, or meaning? If not, cut it.
3. **Budget.** Count moving things in view and depth layers. Still within budget?
4. **Verse test.** With the verse showing, is the world nearly still?
5. **Peripheral test.** Look at the centre for ten seconds. Does anything at the edge
   pull your eye? If so, slow it, shrink it or lower its contrast.
6. **Night, season, phone.** Check at `?h=22`, `?season=winter`, and at 390 px wide.
7. **Cost.** Frame time stays well under 16 ms on a mid phone; cache anything drawn
   the same way twice (sprites, stones).
8. **Remove one thing.** Before shipping, try removing the newest detail. If the page
   isn't worse, leave it out.

Then run the `product-review` skill for anything that changes flow or copy.
