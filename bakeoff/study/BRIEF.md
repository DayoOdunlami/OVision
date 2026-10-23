# Style study: one landscape, one dial

You are one of two studios given this brief, this repository and this starting branch.
Each works alone. It is a **study, not a product build**: one standalone prototype page
that answers three design questions by showing them working. The client judges by using
it, blind, on a phone and a tablet.

Read `bakeoff/study/RULES.md` before you start.

## 1. Who you are

A small, world-class studio, with these on the bench:
- an art director who knows ink painting, watercolour and illustration;
- a motion designer;
- a creative coder who has made generative and painterly work in the browser;
- a product designer who protects calm.

If you can run separate passes or sub-agents, let them disagree before you decide.

## 2. Why this study exists

The app helps a family practise their faith: prayer, learning a verse by heart, a
confession practice, and a board of who they are becoming. It is built on **Quiet
Waters**, which is this branch. Its living koi pond is the most loved thing in it.

The client has used it, and so have his children. Four conclusions shape this study:

1. **Calm by default.** Quiet Waters' home, with coloured koi, lily pads and words, is too
   busy as the front door. The default experience should be quiet: less text, less
   motion, nothing you didn't ask for. Guidance appears once, then gets out of the way.
   Livelier worlds are places you **choose** to go.
2. **Each practice has a world it belongs in.** Confession belongs in the pond (dropping a
   stone). Growth, sowing and the vine belong in the garden. The verse written by
   starlings belongs in the sky. Rather than a skin switch between whole worlds, these are
   **places in one landscape**.
3. **A colour dial, not a choice of worlds.** The same landscape and motion can be shown
   with more or less colour:
   - **Paper.** No world at all, just the page. For "the old-school monk way".
   - **Ink.** Line only, in the spirit of Japanese and Chinese ink painting.
   - **Ink and wash.** Ink with soft watercolour.
   - **Colour.** The koi as they are today.

   Some adults will want ink; the children will probably choose colour. Both see the same
   things moving.
4. **The vine becomes a special moment,** not the whole world. It lives on one part of the
   garden and comes forward when it matters.

## 3. The composition: a hanging scroll, not a 3D camera

Compose the landscape the way East Asian hanging scrolls do: **places stacked up the
page, each seen from its own best angle, with no single perspective.** There's no 3D
camera and no perspective shift.

From bottom to top:

| Layer | Seen | What lives there | The practice it will lead to (later) |
|---|---|---|---|
| **Pond** (bottom) | From above, as in Quiet Waters | The living koi, lilies, stones at the edge | Into the deep (confession), feeding the koi |
| **Garden** (middle) | Gently from the side | Beds with a few plants at different stages of growth, one for each person. A vine on a trellis along the back. | Abide (sow, grow, gather); the purpose board |
| **Hills and sky** (top) | From the side, far away | Hills fading into mist, sky by the clock, perhaps a few birds | The verse written by starlings |

- **Portrait phone:** the scroll fills the screen, top to bottom. It may scroll a little
  if it needs to.
- **Tablet in landscape (1180 × 820):** the same scroll, composed for the wider frame. Your
  call how.
- **It is alive at rest, and calm.** Gentle parallax as the layers drift, or follow tilt
  or pointer if you choose. Water moving. Plants stirring in one wind. Koi swimming.
- **The calm test:** the scroll should be something you could leave on a kitchen side all
  day without it pulling at you.

## 4. What to build

One standalone page at **`/study/`**: its own `study/index.html` entry, added to
`vite.config.js`. Leave every other route working and unchanged.

1. **The scroll,** as above, with all three layers, alive.
2. **The dial,** with four steps: Paper, Ink, Ink and wash, Colour.
   - A small, quiet control switches between them, and the change itself should be
     graceful, not a hard cut.
   - It applies to **every** layer: pond, koi, garden, vine, hills, sky.
   - **Paper** shows no world: a plain page with a single line of text (this week's verse,
     say).
3. **One transition.** Tap the pond and the view eases towards it and opens into the pond
   seen from above, full screen, with the koi swimming as in Quiet Waters, in the current
   dial step. A way back returns to the scroll.
4. **Day and night.** Follow the clock, and honour `?h=` (for example `?h=6.75` or
   `?h=22`) as Quiet Waters does.
5. **Optional, if time allows:**
   - Tap a plant in the garden to see it grow one stage.
   - The vine writes one word (the family's word, "Rooted") along its trellis, using or
     improving the old vine writer.

**Not in scope:**
- The practices themselves: prayer, puzzle, confession, Abide.
- Saved data, households and the purpose board.
- Changing Quiet Waters' existing pages.

## 5. The craft (the reason this study exists)

### The koi must keep their motion

The koi's movement took many iterations to get right. It comes from
`src/app/pond/SpineFish.js`: a skeleton of points ported from an open-source fish pond,
and drawn fresh every frame.

- **Keep that motion exactly, and change only how the fish is drawn.** Ink means drawing
  the same moving skeleton with a brush rather than coloured fills.
- **Don't** apply a filter to a finished frame, and **don't** rebuild the fish.
- **Colour** is today's koi, unchanged.

### Ink must look hand-made, not computer-drawn

This is the hard part. Done badly, ink looks like a vector outline. Look at:
- how ink painters draw koi, water and grasses;
- line thickness that varies with speed and pressure;
- dry-brush edges;
- a slight wobble that doesn't flicker frame to frame;
- ink pooling where strokes start and stop;
- **paper texture**, which carries a lot of it.

### Watercolour washes

Watercolour can be made in code. There are well-known generative techniques, for
example many translucent, slightly deformed layers, with soft edges and pigment
gathering at the borders.

### Research before you invent

Search for the best existing work in creative coding and generative art, and learn
from it or adapt it. Examples worth knowing (use or ignore):
- variable-width stroke libraries such as `perfect-freehand`;
- hand-drawn rendering such as `rough.js`;
- published generative watercolour techniques;
- paper and grain shaders.

Record every source and licence in `STUDY.md`. References inform; never copy a specific
artwork.

### One hand

Every layer must look painted by the same hand at every dial step. A watercolour garden
above a vector pond is the failure to avoid.

### Calm

- Motion is slow.
- Nothing flickers or loops obviously.
- The house art direction skill (`.claude/skills/abide-direction/SKILL.md`) has an
  attention budget you should respect, or argue with.

### Performance

- Smooth on an ordinary Android tablet.
- Draw static layers once and redraw only what moves.
- Respect reduced-motion settings.

### Assets

Drawn in code, or openly licensed with the licence recorded. No stock images.

### What the client showed us

The client shared reference pictures. They are described here rather than included,
because they are probably licensed stock:
- a soft, flat-colour Japanese garden: a stone lantern, a lotus pond in front, a garden
  behind, a lake and misty hills beyond, all in one picture;
- a flat illustrated koi pond with stepping stones and a tree;
- a painterly, almost photographic lily pond with grass and grey stones in front;
- flat poster-style vineyards in rows over hills;
- **an ink-and-watercolour sketch of a vineyard with a bunch of grapes, loose ink line and
  bleeding washes.** This was the one that prompted the ink idea.

The Japanese garden picture is the closest to the composition we want: pond in front,
garden behind, hills beyond.

## 6. What to hand in

In your branch, under `bakeoff/study/entries/<LETTER>/`:

| File | What it is |
|---|---|
| `STUDY.md` | One to two pages: <ul><li>the decisions you made: composition, the ink technique, the wash technique, the transition;</li><li>what works and what doesn't yet;</li><li>sources and licences;</li><li>what you would do next if this became the app.</li></ul> |
| `screens/` | <ul><li>Each dial step on the scroll and in the pond, at phone (390 × 844) and tablet (1180 × 820), by day and at night.</li><li>A short recording of the transition and the dial change, if you can.</li><li>Side by side: today's colour koi and your ink koi.</li></ul> |
| `DONE.md` | Written last: the branch, the preview URL if you can find it, and the links to open first. |

Use links like `/study/?dial=ink&h=12` so the judge can jump straight to any state.

**Quality bar:**
- `npm run build` passes.
- No blank page.
- Checked in a real browser at both sizes, by day and at night.

## 7. How it will be judged

By using it, on a phone and a tablet, using `bakeoff/study/SCORING.md`:
- Would you leave it on the side?
- Does the ink feel calmer while still alive?
- Do the koi keep their motion?
- Does it look like one hand?
- Does the move into the pond feel right?

**A smaller study done beautifully beats a larger one done roughly.**
