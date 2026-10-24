# Style study, sprint 2: refine, and walk into the garden

Both studies were strong in different ways. The client would lean towards the calmer one,
but wants both studios to take one more pass against the same list. Then he can see
whether the two converge, and choose.

**Keep what works.** This is a refinement, not a rebuild. The client must be able to see
exactly what changed (see "Show your upgrades" below).

## How this sprint works

- Keep working in your own branch, `bakeoff/study-s` or `bakeoff/study-t`.
- First merge the latest `origin/bakeoff/study-base` into it to get this file.
- **The other study is now open to you.** Read the other branch, run it locally and learn
  from it. Adapt ideas in your own hand. Credit anything you take in `SPRINT-NOTES.md`,
  and don't paste in the other studio's work wholesale.
- The original brief (`BRIEF.md`) and rules (`RULES.md`) still apply, except where this
  file changes them.

## The client's verdict on sprint 1

**Liked in S:**
- the dial change spreading across the page like wet ink;
- an ink-and-wash palette with a touch more life;
- hills with a little movement, and birds far off.

**Weak in S:** the pond takes up a third of the page as a flat, top-down rectangle inside
a side-on landscape. It doesn't sit in the scene.

**Liked in T:**
- the restraint and the empty paper;
- **the round pond, seen as an oval in the landscape.** It reads as a real place you
  then look down into, and the move into it was more cohesive.

**Weak in T:**
- the koi are too big for the pond as it appears in the landscape;
- the move into the pond feels like a shifting wedge, not one smooth movement;
- ink and wash a touch too muted;
- hills a little too still.

## The list

### Baseline (from T)
1. Restraint and plenty of empty paper. Nothing busy.
2. The pond is round, and on the landscape it is seen at an angle as an oval.

### Bring in (from S)
3. **The wet-ink dial change.** The new step spreads across the page like colour into wet
   paper.
4. **A slightly richer ink and wash.** A little more tone and pigment than T's, and
   clearly still well below Colour, so Colour keeps its job.
5. **Hills with a little life, and a few distant birds.** They appear only now and then,
   are small and slow, and are never busy.

### Fix
6. **The pond in the landscape is seen at an angle.**
   - Draw the pond from above as usual, then squash it vertically into the oval
     (somewhere around 0.45 to 0.6). That foreshortening is the tilt: the eye reads a
     squashed circle as looking across at a pond.
   - Inside the oval, the koi are smaller and squashed with it, so they belong to that
     view.
   - **Don't** add a rotation or skew on top. It would fight the top-down drawing and
     start to look 3D.
7. **The full pond view keeps the koi at today's size.** Only the landscape view makes
   them smaller.
8. **One smooth move into the pond.**
   - Tapping the pond un-squashes and enlarges the same drawing until it fills the screen.
     The koi grow from their small, foreshortened size to full size as it happens.
   - It must feel like one continuous movement: no wedge, no jump, no change of fish.
   - Back reverses it exactly.
9. **Koi respond to a touch again, as in Quiet Waters.** Curious ones come over, shy ones
   scatter, and double-tap still feeds them. This works in the full pond view.

### New: walk into the garden
10. **Tap the garden and arrive in the Abide field,** with the same quality of arrival as
    the pond. Then show the heart of Abide, drawn in the same brush at every dial step:
    - **Clearing the ground.** Lift a stone or pull up a thorn by hand, with the weight and
      roots of the original (`src/flourish/abide/field.js` and `weeds.js` on `main`).
      - The stones are **prompts, not labels**. Each has a short phrase the person fills
        in for themselves, for example "something I wish I'd done", or carries a word
        that, when lifted, says briefly what it means.
      - The children loved this part.
    - **Sowing the week's word.**
    - **The vine writes the word along the trellis,** as the moment it completes.

    This must work for a child using their finger on a tablet. Two or three stones and a
    thorn are enough for a study; this is not the full practice.

The sky stays a view, not a destination, this sprint.

## Show your upgrades

This is the most important rule of the sprint:

- **`?v=1`** shows your study exactly as you handed it in after sprint 1. Freeze a copy of
  that code; don't approximate it.
- **`?v=2`**, the default, shows the refined version.
- **Each item above (3 to 10) is a named switch** the client can turn off in the address,
  for example `?off=birds,squash`, so he can see each change on its own.
- In `bakeoff/study/entries/<LETTER>/SPRINT-NOTES.md`, write a table with one row per
  item:
  - what you changed;
  - its switch name;
  - a link with it on and a link with it off;
  - one line on why it's better.
- Add before and after screenshots to `screens/sprint2/`. Make a short recording of the
  move into the pond and the walk into the garden if you can.

If you think an item on the list would make your study worse, say so in
`SPRINT-NOTES.md`, build it behind its switch anyway, and leave the switch off by default.

## Quality bar

As before:
- `npm run build` passes.
- No blank page.
- Checked at phone (390 × 844) and tablet (1180 × 820), by day and at night.
- Smooth, and respects reduced motion.

## Finishing

Finish in this order:
1. Update `DONE.md` with the sprint 2 links.
2. Make a final commit with the message `bakeoff: study <LETTER> sprint 2 ready`.
3. Push.
4. Stop.
