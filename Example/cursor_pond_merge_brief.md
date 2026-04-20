# Identity Board × Koi Pond — Merge Brief for Cursor

## TL;DR

I have two working builds:
1. **`identity_board.jsx`** — a structurally-sound four-zone identity board with bold typography, SVG vines around "Flourish", SVG solar rays behind "Full", and the warm-paper aesthetic I want to keep.
2. **A separate koi-pond implementation** (attached in this repo — you'll see it) with animated fish swimming across the background.

Task: merge them. Keep the identity board's **content, structure, typography, and text treatments** as the foreground. Replace/augment the static paper background with the **koi pond animation system**, but make the fish behaviour *zone-aware* so the animation reinforces the meaning of each zone rather than running generic across the whole board.

Architecturally set this up to eventually read from Notion as the content backend, with the Document view treated as the "full surface" fallback.

---

## Design principle — responsive ambient motion

Generic fish swimming across everything = decoration. We don't want that.

**The fish are a living ambient layer that responds to what's above them.** Each zone has a distinct micro-ecosystem. The viewer doesn't need to notice the differences consciously — but the cumulative effect is that the board feels *alive in a way that matches what it's saying*.

Think of it as the visual equivalent of a film score changing key under different scenes. Subtle, not obvious.

---

## Zone-by-zone behavioural specification

Treat these as starting points; refine during build.

### Zone 01 — Identity / "Flourish"
- **Metaphor:** thriving, multiplying, abundant life
- **Fish:** many small fish (15–25), forming a loose shoal
- **Behaviour:** smooth Boids-style flocking — alignment, cohesion, separation
- **Ambient elements:** 3–5 lily pads drifting very slowly, fish occasionally dart between them
- **Interactive touch:** when cursor/touch is near the shoal, they disperse briefly then reform — organic response, not panic
- **Optional stretch:** the fish subtly bias their flocking centre toward the letterforms of "Flourish" at rest, as if attracted to it. Not particles spelling the word — more like gravitational pull.

### Zone 02 — Season / "Full"
- **Metaphor:** abundance, satiety, warm completeness
- **Fish:** 1–2 larger, chubbier fish (golden/warm-toned koi)
- **Behaviour:** slow, languid, satisfied. Occasionally surface and ripple.
- **Relationship to word:** they orbit slowly around the word "Full" at a distance — visible near it, never obscuring it
- **Ambient elements:** warm ripples on the surface where they rise; subtle light refraction through water

### Zone 03 — Commitments (Pray · Train · Show · Cook)
- **Metaphor:** four distinct daily practices
- **Fish:** one fish per verb, each with a distinct behaviour
  - **Pray** — fish pauses, hovers contemplatively beneath the word; occasional slow fin movement
  - **Train** — fast, purposeful, straight-line movement; disciplined loops
  - **Show** — fish rises toward the surface, breaks briefly, returns
  - **Cook** — fish circles in gentle spirals, as if gathering, warming
- Keep these restrained. A light touch.

### Zone 04 — Friction / "marrow"
- **Metaphor:** deep knowing, interior truth coming to surface, relational depth
- **Fish:** two fish swimming in synchronised pairs — a metaphor for knowing-and-being-known
- **Behaviour:** slower than other zones, deeper in the water column (further back visually), occasionally surface in unison
- **Relationship to word:** they pass near "marrow" but never cross its letterforms. The word is inviolable.

### Global ambient layer
- A very slow underlying current affecting all fish mildly
- Subtle water-surface light patterns across the whole board (caustics)
- Occasional floating particles (bubbles, seeds, petals) that all fish ignore but which add liveliness

---

## Technical architecture

### File structure proposal

```
src/
├── App.jsx                 # top-level, view toggle
├── data/
│   └── board.js            # BOARD object, eventual Notion adapter
├── views/
│   ├── PosterPond.jsx      # NEW — the merged view (fish + zones)
│   ├── PosterAtmos.jsx     # existing atmospheric poster
│   ├── PosterTextured.jsx  # existing textured poster
│   └── Document.jsx        # existing editorial document
├── pond/
│   ├── PondCanvas.jsx      # single <canvas>, manages all fish
│   ├── Fish.js             # Fish class, behaviour interface
│   ├── behaviours/
│   │   ├── flock.js        # shoal behaviour for Flourish
│   │   ├── languid.js      # Full zone
│   │   ├── orbit.js        # Full zone (around word)
│   │   ├── contemplative.js# Pray
│   │   ├── disciplined.js  # Train
│   │   ├── rising.js       # Show
│   │   ├── gathering.js    # Cook
│   │   └── paired.js       # marrow
│   ├── ZoneSystem.js       # defines zones, boundaries, behaviour assignments
│   └── water.js            # caustics, ripples, surface effects
└── components/
    ├── HeroWord.jsx        # shared hero word with textured fill
    ├── FlourishVines.jsx   # existing SVG vines
    ├── FullSun.jsx         # existing SVG solar rays
    └── OrnamentDivider.jsx
```

### Pond canvas

- **One `<canvas>` for all fish.** Not one per zone. Positioned fixed or absolute behind the entire board, full viewport.
- Zones are registered with the pond as rectangles (computed from their DOM positions on mount + on resize).
- Each zone declares which behaviour(s) run inside it and how many fish of what type.
- The canvas render loop updates all fish each frame; each fish's behaviour function reads its current zone and applies the rules for that zone.

### Fish class (suggested interface)

```js
class Fish {
  constructor({ type, size, colour, behaviour, home }) { /* ... */ }
  update(dt, context) {
    // context: { zones, cursor, otherFish, zoneForThisFish }
    this.behaviour.update(this, dt, context)
  }
  render(ctx) { /* ... */ }
}
```

### Zone system

```js
const zones = [
  { id: 'identity', boundary: rect, behaviours: ['flock'], fishCount: 20, size: 'sm' },
  { id: 'season',   boundary: rect, behaviours: ['orbit', 'languid'], fishCount: 2, size: 'lg' },
  { id: 'commit-pray',  boundary: rect, behaviours: ['contemplative'], fishCount: 1 },
  { id: 'commit-train', boundary: rect, behaviours: ['disciplined'],    fishCount: 1 },
  { id: 'commit-show',  boundary: rect, behaviours: ['rising'],         fishCount: 1 },
  { id: 'commit-cook',  boundary: rect, behaviours: ['gathering'],      fishCount: 1 },
  { id: 'friction', boundary: rect, behaviours: ['paired'], fishCount: 2 },
]
```

Zone boundaries recomputed on scroll/resize via `getBoundingClientRect()` or IntersectionObserver.

---

## Performance budget

This is the biggest risk. Hard limits:

- **Max ~50 fish total** across all zones. Feels alive; doesn't tank framerate.
- **60fps target** on a mid-range phone. Check on actual hardware, not just Macbook.
- **Single canvas**, not DOM elements per fish. Don't use React state for per-frame updates — use refs + `requestAnimationFrame`.
- **Cull fish in zones currently off-screen.** IntersectionObserver + pausing the update loop for those fish.
- **Reduce motion preference:** respect `prefers-reduced-motion`. If set, fish are near-static, gentle drift only.
- **Static fallback:** below a certain performance threshold (measure FPS for 2s, if < 30fps), freeze the pond to a single painted frame. Accessibility + low-end devices.

If performance is genuinely a problem, fall back to: fewer fish (10–15 total), simpler behaviours, no caustics.

---

## Notion backend — architecture for later

Right now, content lives in `board.js` as the `BOARD` object. Architect the merge so we can later swap this for a Notion adapter without touching view code.

```js
// data/board.js
export async function loadBoard(source = 'local') {
  if (source === 'notion') return loadFromNotion()
  return BOARD
}
```

Notion side (future):
- Each zone is a page/database entry with structured properties
- `owner`, `period` as top-level fields
- `identity.statement`, `identity.heroWord`, `identity.values[]`, `identity.anchor.text`, `identity.anchor.reference`
- Same nested structure for season, commitments (as a database of rows), friction
- A simple API route (Next.js or similar) fetches and transforms to the `BOARD` shape

The **Document view** is the read-all surface — it shows every field. Posters surface a subset. Notion is the edit surface. The content flows: **Notion → loadBoard() → BOARD object → all views**.

Set up the code so this future wiring is one function swap, not a refactor.

---

## What to preserve from the current identity board

- Four-zone structure, content, and philosophy (see `identity_board_brief.md` if attached)
- Warm paper palette (#F1E6D2 / #F3EDDD base, terracotta / amber / sage / rust accents)
- Fraunces (display, with SOFT/WONK) + Manrope (body) typography
- Hero words with CSS `background-clip: text` gradients (`.tx-flourish`, `.tx-full`, `.tx-verb`, `.tx-marrow`)
- SVG vines wrapping "Flourish"
- SVG solar rays behind "Full"
- Text readability at 3-metre distance — fish must stay *behind* the content and never obscure hero words
- Print-friendliness — fish disappear cleanly on print; static paper background shows instead

---

## What can change

- The paper background itself — replace with water/pond surface where it makes sense, but keep warm-toned (not cold blue). Think: shallow pond with warm amber light filtering down, sepia water, golden caustics.
- The dust particles (current atmospheric variant) — remove if the pond handles ambient motion better
- View toggle design — now includes a fourth option: "Pond"
- Specific fish behaviours — refine during build

---

## Implementation order

Stage it, don't try to do it all in one pass.

### Stage 1 — scaffolding
- Extract components from `identity_board.jsx` into the file structure above
- BOARD → `board.js` with `loadBoard()` async interface
- View toggle updated to include "Pond"
- Empty `PosterPond.jsx` that shows the existing textured poster with a single full-viewport canvas overlay (no fish yet)

### Stage 2 — port the existing pond
- Bring the existing koi-pond implementation into `pond/` with minimal changes
- Wire it to the PosterPond view so fish swim behind everything, uniformly
- Confirm performance, print behaviour, reduced-motion fallback

### Stage 3 — zone system
- Implement `ZoneSystem.js` — detect zone boundaries from DOM
- Split fish across zones (still uniform behaviour, just partitioned spatially)

### Stage 4 — behaviours
- Implement the seven or eight behaviour modules one at a time
- Start with `flock` (Flourish) — it's the most demanding; if it works, others are easier
- Then `paired` (marrow), `orbit`+`languid` (Full), then the commitment behaviours

### Stage 5 — polish
- Caustics, lily pads, surface ripples
- Cursor/touch interactivity
- Mobile tuning
- `prefers-reduced-motion` fallback + FPS-based static fallback

Each stage is a checkpoint I can review before you continue.

---

## What I'd love you to push back on

- Is a single full-viewport canvas the right approach, or should each zone have its own local canvas? Tradeoffs?
- Is React the right host for this, or would vanilla JS + a React shell be lighter?
- Am I over-engineering the zone-aware behaviour? Would 2–3 behaviours feel just as rich?
- Are there simpler wins I'm missing (e.g., drifting particles with fish-like trails rather than actual fish sprites)?
- Any accessibility concerns I'm not flagging?

---

## Deliverable

Working, runnable project with the staged commits above. Each stage independently reviewable.

Let me know when Stage 1 is ready and I'll look before you go deeper.
