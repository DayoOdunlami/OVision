# Style study S: done (sprint 2)

- **Branch:** bakeoff/study-s
- **Preview:** https://o-vision-git-bakeoff-study-s-dayoodunlamis-projects.vercel.app/study/
  - This is Vercel's branch address, behind the client's sign-in.
  - Locally: `npm install && npm run dev`, then open `/study/`.
- **Sprint 2 is the default** (`/study/` or `/study/?v=2`).
- **Sprint 1, exactly as handed in:** `/study/?v=1`. It runs from a frozen copy of its
  code.
- **What changed and how to see each change on its own:** `SPRINT-NOTES.md`. It has one
  row per item, each with a switch and a link with it on and off (`?off=…`).

## Open these first (sprint 2)
1. **The landscape, by day, in Ink and wash:** `/study/?dial=wash&h=12`. Compare
   `/study/?v=1&dial=wash&h=12`.
2. **Into the pond:** on that page, touch the pond. The oval un-squashes and grows into
   the pond, and the koi grow with it. Touch the water: the curious koi comes, the shy one
   scatters. Double-tap to feed. ← goes back the same way.
3. **Walk into the garden:** on the landscape, touch the garden.
   - Lift the three stones to the wall and read what each asks.
   - Pull up the thorn slowly and lay it in the basket.
   - Touch the soil to sow the week's word, and watch the vine write it.
   - Straight in, starting fresh: `/study/?dial=wash&h=12&view=garden&fresh=1`.
4. **At night, in Ink:** `/study/?dial=ink&h=22`.
5. **Each change off on its own:** for example `/study/?dial=wash&h=12&off=squash`, or
   everything off at once: `&off=all`.

## Also worth opening
- **The landscape in Colour:** `/study/?dial=colour&h=12`.
- **The garden in Ink on a tablet:** `/study/?dial=ink&h=12&view=garden&fresh=1`.
- **Colour koi beside ink koi,** the same fish at the same instant:
  `/study/?dial=ink&h=12&view=pond&compare=1`.
- **A still page (reduced motion):** `/study/?dial=wash&h=12&rm=1`. The garden still works
  by hand.

**Things to know:**
- A finished garden is remembered on the device for the week. `&fresh=1` starts it again.
- "Clear it for me" appears in the garden after 40 s without progress.

## The hand-in
- `SPRINT-NOTES.md`: the table, what we took from study T, and the calls we made.
- `screens/sprint2/`: before and after, each switch off, the garden step by step, frames
  from both moves, and two recordings. See its README.
- `STUDY.md` and `screens/` are sprint 1's, unchanged.
