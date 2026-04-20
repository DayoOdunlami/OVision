# Identity Board — Design Brief for a Fresh Pass

## TL;DR

I've built a personal "action board" (deliberately not a vision board — see philosophy below) in a single React JSX file. It's working, but I'm not sure it's reached its ceiling. I'm bringing it to you for a fresh designer pass with three specific asks:

1. **Critique the structural choices honestly.** Where are the blind spots?
2. **Show me 3–5 alternative background treatments** I can compare.
3. **Show me 3–5 alternative typography directions** I can compare.

Output preference: a single HTML file I can click through — tabs, side-by-side, or staged (backgrounds first, typography next). Image generation welcome where it would elevate the work beyond what SVG and CSS alone can do.

The working implementation (`identity_board.jsx`) is attached separately. Read it for the technical state; this brief is for the **intent, philosophy, and asks**.

---

## Why an action board, not a vision board

This structure is grounded in specific behavioural research. Understanding why we made the structural choices matters before critiquing them.

- **Identity > outcome** (James Clear). Identity-based commitments stick where goal-based ones collapse. The board leads with who I *am*, not what I'm chasing.
- **Mental contrasting, not fantasy** (Gabriele Oettingen, WOOP). Pure aspiration measurably *decreases* motivation — the brain experiences fake-completion. Every board must name the honest obstacle.
- **2–3 values, not 10** (Brené Brown). Most people list 10–15 values; only 2–3 guide actual choices.
- **Process visualisation beats outcome visualisation** (Pham & Taylor). Students who visualised *studying* outperformed those visualising *the A*. Hence verb-led commitments.
- **Action boards, not vision boards** (Tara Swart). The neuroscience-informed reframe.
- **Frequency of viewing > format polish.** Daily glance matters more than beautiful-but-forgotten.
- **Seasonal refresh, not perennial.** A board that never changes becomes wallpaper in weeks.

Classic vision board failure modes this design is explicitly avoiding:
- Collages of cars / houses / bodies (outcome porn, measurably harmful)
- 10+ values (noise)
- No named obstacle (fantasy loop)
- No review cadence (wallpaper within three weeks)

---

## The four-zone structure (non-negotiable)

| Zone | Content | Refresh |
|---|---|---|
| **01 Identity** | Who I am (present tense) + 2–3 values + anchor verse | Yearly (rarely) |
| **02 Season** | One-word banner + single honest sentence for this chapter + threads | Quarterly |
| **03 Commitments** | 3–4 identity-aligned practices as *verbs* with cadence | Monthly |
| **04 Honest Friction** | The real obstacle + if-then plans + prayer anchor + who's walking with me | Monthly |

The zones can be visually reorganised. The underlying structure shouldn't be.

---

## The actual content (the BOARD object)

```
Owner: Dayo
Period: Spring 2026

01 IDENTITY
  Statement: "I exist to help the people and things around me flourish
              — and to flourish myself — to the glory of God."
  Hero word: Flourish
  Values: Creativity · Joy · Faithfulness
  Anchor: "Apart from me you can do nothing." — John 15:5

02 SEASON
  Hero word: Full
  Sentence: "Filling up before I pour out — more of God, stronger body,
             making what I make properly seen."
  Threads: Spirit (More of God) · Body (Stronger, trained) · Craft (Properly seen)

03 COMMITMENTS
  Pray.  Ephesians 1:18 over Claire and the kids each morning.  (Daily, Prayer)
  Train. HYROX — twice protected, three the target.              (Weekly, Body)
  Show.  Thirty minutes showing, not just building.              (Weekly, Craft)
  Cook.  One family meal. Phone down. Fully present.             (Weekly, Home)

04 HONEST FRICTION
  Hero sentence: "I know the words. I want them in my marrow."
  Hero word: marrow
  If-then plans:
    - After gratitude and Bible reading → five minutes of silence. No phone. Just sit.
    - When I notice I'm in head-mode on a passage → stop. Pray it instead of processing it.
  Prayer anchor: "that Christ may dwell in your hearts through faith…
                  to know this love that surpasses knowledge." — Ephesians 3:17–19
  Walking with: Weekly check-in with Claire. Gap to fill: a man at Grace London
                who is allowed to ask the hard questions.
```

---

## What's been built so far

Single React JSX file. Three toggleable views from one `BOARD` data object.

**View 1 — Document**
Editorial review layout. Numbered chapters (01–04), asymmetric composition, detail-rich. Used for sit-down monthly updates.

**View 2 — Poster · Atmospheric**
Bold plain typography. Rich multi-layer radial gradient mesh (warm terracotta → amber → sage → deep umber). Paper grain overlay. Drifting dust particles. Hero words in solid deep colour; background carries the mood.

**View 3 — Poster · Textured** *(the current favourite, the one to push hardest)*
Plain paper ground. Letters carry visual treatment via CSS `background-clip: text`:
- **Flourish** — earth-to-leaf vertical gradient + hand-coded SVG vines (one rising bottom-left arcing up with three leaves and a tendril; one trailing upper-right). Subtle sway animation.
- **Full** — radial warm glow gradient inside letters + SVG solar treatment behind: central glow, halo ring, 24 tapered rays (long/short alternating), slow rotation + gentle pulse.
- **Pray / Train / Show / Cook** — unified sage vertical gradient. Restrained to keep hero hierarchy.
- **marrow** — radial auburn-to-deep-earth gradient (warm core, darker edges) — living tissue, not death imagery. This replaced "bones" for better resonance with Hebrews 4:12.

**Typography:** Fraunces (variable serif, using SOFT/WONK axes for character) + Manrope (body/labels).
**Palette:** warm paper. Primary accents are terracotta (#B85C38), amber (#C9824A), sage (#4A5A3D), rust (#6B4226). Background cream (#F1E6D2 / #F3EDDD).

---

## Where this reached its ceiling (the prompts that brought you in)

I asked Claude to push harder. It built hand-coded SVG vines and solar rays in the Textured view. They work, but:

- **Letters can't truly become images** in SVG alone. A "Flourish" whose letterforms *are* vines (type-design territory) needs either a type designer or generative imagery.
- **Backgrounds are atmospheric gradients, not compositions.** They carry mood but don't *speak*. A subtle photograph of dawn light or sacred space might do more.
- **Typography is one paired combination.** There are strong alternatives I haven't explored.
- **Single-column Cathedral layout is working** but may not be the only right answer.

Claude flagged you specifically for this round because you can generate imagery it can't.

---

## What I want from this round

### 1. Structural critique

Read the current file and this brief. Tell me honestly:

- Are the four zones architecturally sound, or is there a better skeleton?
- Is Cathedral (vertical single column) the right layout for daily-glance use?
- Is the three-view split (Document / Atmospheric / Textured) right, or is one redundant?
- Where would a top editorial / spiritual-product designer push back?
- Is the Document view doing any real work, or should it just be a side-annotated poster?
- Any other structural blind spots?

Don't be polite. I'd rather be challenged well than affirmed weakly.

### 2. Background variants (3–5 options)

Keep warm palette as the core spirit, but push beyond current atmospheric gradient. Directions I'm curious about:

- **More dramatic gradient mesh** — richer colour meetings, stronger depth
- **AI-generated atmospheric imagery** — dawn light, sacred interior space, golden hour texture, abstract moody landscapes. Not photographic stock. Generated specifically for this brief. If you render imagery, please render **subtle** — it's a ground, not a picture.
- **Museum / gallery aesthetic** — near-monochrome cream with one strong accent, refined emptiness
- **Darker mood variant** — for Advent / Lent / reflective seasons (deep warm browns, single candle-like accent)
- **Architecturally textural** — walls, weathered surfaces, plaster, aged paper as the ground

Show each as a working option in the HTML. I'll pick.

### 3. Typography variants (3–5 options)

Current Fraunces + Manrope is strong but not sacred. Push me:

- **Alternative display serifs** — distinctive, not Times/Garamond/Playfair generic. Canela, Recoleta, Ogg, Tiempos, Instrument Serif, etc. Or something I haven't heard of.
- **Display sans options** — if a confident modern grotesk or humanist sans would serve better
- **Mixed treatments** — different faces for different zones
- **Illustrative letterforms** — especially for Flourish / Full / marrow. If you can *generate* letterforms that are visually meaningful (Flourish as vines, Full as a sun, marrow as internal tissue), show me.
- **Hand-lettered quality** — if there's a way to get the warmth of hand-lettering without it looking like a wedding invitation.

---

## Output — what I'd like back

Single HTML file with CSS. One page that lets me:
- Click / tab between background variants
- Click / tab between typography variants
- See them applied to the actual content (BOARD object above)
- Comments / notes inline where you want to explain design choices

If one monolithic file is too much, **stage it** — backgrounds first, typography second, structural rework third. Tell me which.

---

## Constraints — what to preserve

- **The four zones and their philosophy.** The structural skeleton.
- **Warm palette spirit** as core. Variants welcome (dusk, dawn, advent, lent), but warm is the identity.
- **Text readability** — hero words must remain readable at a glance from 3 metres. Every decoration serves that, never fights it.
- **Print-friendliness** — this will be A3 on the fridge. Motion is bonus; static must work first.
- **The BOARD data object** as the source of truth. Same content, new treatments.

---

## What can change

- Typography (genuinely open)
- Background treatment (open)
- Imagery approach (open — including generated imagery you produce)
- Layout within each zone
- Specific visual treatments per zone
- Composition — Cathedral isn't sacred if you have a better argument with reasoning

---

## Context about me — for your design judgment

- Dayo, 40s, father of 4 (Bella, Florence, Keziah, Ezra), married to Claire
- Rail innovation consultant (Connected Places Catapult)
- Christian, Grace London (Waterloo), working through Comer's *Practising the Way*
- Daily gratitude journal since November 2016
- Trains for HYROX, cooks for family as creative outlet
- Builds apps (vibe-coding, React, Notion)
- Aesthetic lean: warm sepia over cold modern. Editorial over corporate. Substantive over decorative.
- Reference brands I respect: Comer's Practising the Way branding, Kinfolk, Monocle, Penguin Great Ideas covers, Dieter Rams, medieval Books of Hours
- This board will live on the fridge (printed A3) and as a digital reference. Family members (Claire and 4 kids) will eventually get their own versions using the same structure with age-appropriate scope.

---

## Final ask

Push harder than Claude did. Image generation where it helps. Honest structural pushback. Multiple directions to compare, not one "best" answer. I want to *choose*, not be given a single deliverable.

If you need to stage the work across multiple responses, say so up front and tell me the order. I'd rather have one direction done excellently than five done superficially.

Ready when you are.
