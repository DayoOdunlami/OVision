# Where we are (11 October 2026)

**Live:** <https://o-vision.vercel.app>. Every push to `main` deploys there in about a minute
(Vercel project *o-vision*).

**Admin:** Pond settings → Admin, or `/admin/`. The password is `bio123` (`123` also works).
From there you can:
- switch the whole app between **Main** (as it was) and **Lab** (every new change)
- switch any single change, or compare it side by side
- see which version is live
- open every surface and mode

## How the pieces fit: one house, three rooms

| Room | What it's for | How often | Stands alone? |
|---|---|---|---|
| **Pond** `/` | Who you're becoming this term or season: the long view. A board you rest your eyes on, also as a screensaver. | Glanced at; changes with the season | Yes |
| **Pray** `/pray/` | Praying for each other: the family rota, a pair a day, Sunday all together. | Daily | Yes |
| **Abide** `/flourish/abide/` | One word of Scripture, taken in with the breath and gathered into the vineyard. | Daily, about 3 minutes | Yes |
| **Today** `/today/` | Optional front door: Pray → Abide → Rest your eyes, showing what's done today. | Daily, if you want it | It *is* the join |

The rooms only touch lightly:
- Pray's rota puts today's names on the water.
- The week's prayer gives Abide its word.
- Learning the prayer by heart ripens the vineyard's fruit.
- The pond itself changes with the board, not the day.

## What's built

**Abide**
- Breath prayer on the breath.
- The verse is read twice, then 15 seconds of stillness.
- The field to clear scales with the group.
- "I wonder…" questions and a closing line.
- One human sentence in the vineyard.
- The vine no longer grows into the words.

**Pray**
- Tapping Amen counts as praying, then "Now abide →".
- "Pray it" uses the same words as the page.
- Calmer Options.
- Dates use the local day.

**Pond**
- `/make/` (make a board for anyone) and share links.
- Screensaver (`/?screen=1` or Pond settings): full screen, screen kept awake, a slow tour of
  the zones.

**Today:** an optional front door. "Start the day on Today" is an Admin switch.

## Birds: stopped

Four attempts at a bird world didn't come close to the koi, so they were removed. The record and
the reasons are in `docs/birds-log.md`. What grew from them is the **Murmuration** (`/murmuration/`): the board's words
written by a flock of starlings, a counterpart to the pond. Brief: `docs/murmuration-brief.md`.

## 3D: a view

Plain three.js (MIT), loaded only where it's used, is the right tool if we want 3D, with the
words kept as page text over it. The murmuration already uses it. A **3D koi pond** (water with
light patterns and reflections; the MIT koi-pond-garden repo is the reference) would be the
next 3D step, about 6–10 days, if the 2D pond ever feels limiting.

## Suggestions (not built)

- A household step on `/make/` (names and creatures) so another family can use Pray and Abide.
- Sync across devices.
- Pray week bugs: the week rolls over 7 days after creation, not on Monday; "this morning"
  appears at night.
- Wallpaper export (parked).
