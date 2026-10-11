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
- Worlds:
  - **Koi pond**
  - **Birds at dusk**
    - Lab: flocking birds with real wingbeats.
    - Lab: painted clouds they fly through.
  - **Dusk in 3D** (preview).
- Screensaver (`/?screen=1` or Pond settings): full screen, screen kept awake, a slow tour of
  the zones.

**Today:** an optional front door. "Start the day on Today" is an Admin switch.

## Birds and sky

| | Birds at dusk (2D, Lab) | Dusk in 3D (preview) |
|---|---|---|
| Birds | Flocking after the MIT three.js/Vanta birds, with wings that bend at the wrist, banking, glides between bursts of flapping, and 9 species (5 Bible birds) | The same flight, drawn as low-poly birds whose lit wings hinge at the shoulder and wrist |
| Clouds | Painted, lit from below, part around birds | Soft puffs at real depths in fog, with true parallax |
| Weight | No extra download | three.js loaded only for this world (~134KB gz) |
| Still to do | Fine-tuning | Names on birds, feeding (seed), quality tiers for slow devices, the abide-direction checklist |

**Bible birds**, matched to each person's koi:
- dove (Matthew 3:16)
- sparrow (Matthew 10:29–31)
- raven (Luke 12:24)
- swallow (Psalm 84:3)
- stork (Jeremiah 8:7)

## 3D: the options, and a view

- **Worth doing, as a world you choose:**
  - **Plain three.js** (MIT), loaded only when picked. This is what Dusk in 3D uses, so the
    simulations are shared and React needn't be upgraded.
  - The words stay as page text over the canvas, which keeps them sharp. 3D type blurs and is
    harder to read.
- **Next candidates:**
  - **Pond in 3D**: water with caustics and a Fresnel sheen. The MIT koi-pond-garden repo is
    the reference. About 6–10 days.
  - **Polishing Dusk 3D**: a sun with a soft bloom, more clouds, and quality tiers. About
    3–5 days.
- **Not worth it now:**
  - Spline: proprietary, and huge.
  - WebGPU: not ready across browsers.
  - Glass/refraction materials: expensive on phones.
  - 3D text: hard to read.
  - react-three-fiber: its current version needs React 19, so it would mean an upgrade.
- **Battery** matters only for the always-on tablet. The 3D world sleeps when the tab is hidden.

## Suggestions (not built)

- A household step on `/make/` (names and creatures) so another family can use Pray and Abide.
- Sync across devices.
- Pray week bugs: the week rolls over 7 days after creation, not on Monday; "this morning"
  appears at night.
- Wallpaper export (parked).
