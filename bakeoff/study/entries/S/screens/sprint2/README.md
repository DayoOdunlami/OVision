# Screens, sprint 2 (study S)

All are from Chromium, running the page.
- **Phone:** 390 × 844. **Tablet:** 1180 × 820.
- **Day:** `h=12`. **Night:** `h=22`.

## Before and after

`before-*` is sprint 1 (`?v=1`, the frozen copy) and `after-*` is sprint 2, in the same
view.
- **The landscape:** `*-landscape-<step>-<size>-<day|night>`:
  - wash 390 day;
  - ink 390 day;
  - wash 1180 day;
  - ink 1180 night;
  - wash 390 night;
  - colour 1180 day.
- **In the pond:** `*-pond-wash-390-day` and `*-pond-ink-1180-day`.

## Each switch off

`switch-off-<switch>-…` is the sprint 2 page with that one switch off (`?off=<switch>`):
- `richer` (tablet and phone);
- `hills`;
- `squash` (the pond as a circle);
- `garden` (the garden is just a view; the hint goes back to the pond only);
- `fullsize` (in the pond, the koi stay landscape-sized);
- `all` (the baseline alone).

`wetdial` looks the same at rest; it only changes how the dial change moves (see the
recording).

## The garden

- **Arriving:** `garden-arrive-<step>-<size>-<day|night>`.
- **The walk, step by step, on a tablet in Ink and wash:**
  1. arrive;
  2. a stone lifted, with its prompt;
  3. the thorn out, roots and all, over the basket;
  4. the ground clear, and the seed of the week's word;
  5. the vine writes the word along the trellis;
  6. back on the landscape: the word is on the trellis there too.

## The moves

- **Frames from each move:** `move-into-the-pond-wash-390` and
  `move-into-the-garden-wash-390`. Six frames across 2 s, left to right.
- **Recordings:**
  - `rec-into-the-pond-390.webm`: the landscape, into the pond, a double-tap to feed, and
    back.
  - `rec-walk-into-the-garden-1180.webm`: into the garden, three stones to the wall, the
    thorn to the basket, sowing, the vine writing the word, and back.
    - It is played at 1.5× to keep it short, and scaled to 944 px wide.
    - Headless Chromium runs slower while recording, so the hand's drags look slower than
      a real finger.
