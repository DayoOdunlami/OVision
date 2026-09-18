# Vision Board — Pond & Prayer

Two surfaces that share one deploy and one `localStorage`.

| Route    | Surface | Character |
|----------|---------|-----------|
| `/`      | **Pond** — the living identity board | Ambient, peripheral, always-on. Lives on a fridge tablet, meant to be glanced at. |
| `/pray/` | **Prayer** — the family prayer rota | Focal, sequential, one line at a time. Meant to be *used*, then closed. |

They are deliberately **not** the same page. The pond is animated koi; the
prayer surface is still type on paper. Putting koi behind prayer text would
fight the exact problem the prayer surface exists to solve (a wandering mind).

## How they're joined

Same origin → same `localStorage`. The prayer surface writes `familyPrayer`;
the pond reads it (never writes) via [`src/data/prayerLink.js`](src/data/prayerLink.js).
No API, no database, no build coupling.

What crosses over:

- **Today's rota → named koi.** Each family member has a koi variety. The two
  people on today's rota get their names drawn on the water beside their fish,
  and those two koi can swim as a pair.
- **Consistency → the "Full" swell.** How far koi swell near the word *Full* is
  driven by how many of this week's elapsed days you actually prayed. A good
  week makes them fat and golden; a thin week leaves them lean.
- **Today's pair → the `marrow` zone.** The names are shown under the word, and
  their koi take its colour as they pass through.
- **The masthead chip** on the pond shows today's pair and links straight to
  `/pray/`.

Both integrations are toggleable under **Pond settings → Concepts**, so they can
be judged against the pond without them.

## Pond surface

```
src/
  App.jsx                    routes Pond ↔ Document
  data/board.js              board content (local now, Notion-shaped adapter)
  data/prayerLink.js         reads the prayer surface's state
  SpineFish.js               dot-chain skeletal koi
  pond/PondCanvas.jsx        water, koi, attractors, name labels
  pond/water.js              palette + water painters
  pond/pads.js               decorative pads, blossoms, ripples
  pond/particles.js          edge-bound particles for the Flourish word
  pond/zones/
    FlourishZone.jsx         01 · identity — particles trace the letterforms
    FullZone.jsx             02 · season   — proximity swell + consistency gauge
    CommitmentsZone.jsx      03 · verbs    — lily pads that koi rock and ripple
    MarrowZone.jsx           04 · friction — koi take the word's colour
  views/PosterPond.jsx       the pond view + settings menu
  views/Document.jsx         full-text fallback for everything the pond omits
```

`Atmosphere`, `Textured` and the old `Family` board (`KoiBoard.jsx`) were
retired — the Family board was a second, duplicate pond with its own data model.

## Prayer surface

`public/pray/index.html` — one self-contained static file, no build step. Vite
copies `public/` into `dist/` as-is, so it ships with the same deploy.

- Nine prayers from Scripture, each in three registers (flowing prose / spoken
  modern English / kids) plus an **Explore** note on the Greek or Hebrew.
- Six-person rota, reshuffled weekly; Sunday is the whole household.
- **Pray it** — pace mode: a breath card, then one line per tap, then the
  blessing. Reaching *Amen* is what records the day as prayed.
- Week strip of seven dots, tappable, because you'll sometimes pray without the
  app open.
- **Praying as** is a setting, so everyone in the house gets the first-person
  voice on their own device.
- Printable rota sheet with blank name slots.

### A note on translations

The first four prayers render their flowing prose in NIV wording. Everything
added since is an original modern-English rendering rather than a quotation of
any published translation, which keeps the file distributable without permission
clearances. The `spoken` and `explain` layers were always original. Using a
specific translation throughout is a licensing question, not a technical one.

## Develop

```bash
npm install
npm run dev
```

Pond at `http://localhost:5173/`, prayer at `http://localhost:5173/pray/`.

## Deploy

```bash
npm run build
# drop dist/ on Vercel, Netlify, anywhere static
```
