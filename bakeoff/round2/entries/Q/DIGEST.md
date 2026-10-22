# Studio Q · decisions and verification

## Before product code

Read round 2 brief, feedback and rules in full, then README, CLAUDE, round 1 QA and both house skills. Used the existing home, season and setting ritual at phone and landscape tablet; before captures are in `screens/`.

The season is currently a well-made document. Its daily decision is implicit. We choose the three-part compass: becoming / make room for / leave behind. Concrete intentions remain stable for the term; viewing the board asks for no input and records no compliance.

Independent product/spiritual/children and motion passes agreed on a rooted grove rather than a drifting-seed meadow. Disagreement worth preserving: a meadow has a more immediate wind gesture; rooted branches make belonging and durable personal contribution clearer. We choose the grove. Growth follows the calendar, never attendance. The family can make its board directly; no forced six-person questionnaire.

## World contract

| Meaning | Pond | Grove |
|---|---|---|
| Shared purpose | A gathering around clear water | A crown supported by one trunk |
| Each person's part | Their original living koi, a readable shore anchor | Their branch joining the shared root |
| Make room | A school opens a space | Growth turns towards the chosen light |
| Leave behind | An open channel stays clear | A clearing remains open, not dead or diseased |
| Belong / rest / grow / give / steady / welcome | Gather / settle / rise / spread / broad route / open ring | Join / shelter / bud / seed / yield and return / open canopy |
| Verse and prayer pair | Quiet reference, names outside the movement | Same quiet reference and names |
| Season | Slow calendar development, never scores | Leaves, buds and seed heads follow elapsed term |
| Reading | Paper, world paused | Paper, world paused |

The theme is stored independently of the word; the family interpretation wins over the lexicon. Unknown words default to Grow. Motion uses irregular schedules and one shared travelling wind rather than independent loops. Reduced motion keeps the complete scene and all meanings visible.

## Research and reuse ledger

- Existing `src/app/pond/SpineFish.js`: preserve the skeletal koi, fins, shading, personalities and feeding. Existing repository asset explicitly authorised by the brief; upstream origin https://github.com/akeatk/fish-pond. Preserve its notice; do not assert an unverified upstream licence.
- Existing `origin/main:src/flourish/abide/wind.js`: reuse the shared travelling gust field. Repository asset authorised by the brief. One wind is the house skill's strongest motion rule.
- Space colonisation: Runions, Lane and Prusinkiewicz (2007), https://www.algorithmicbotany.org/papers/colonization.egwnp2007.html. A crown grows towards attractor points, which disappear when reached; reference for the grove's branching structure.
- Coding Train's plain, proven implementation: https://github.com/CodingTrain/Coding-Challenges/tree/main/017_SpaceColonizer/P5. MIT, copyright 2022 Coding Train; keep the licence when adapting its algorithm. Generate geometry once, bounded attractors and iterations; do not run branching search every frame.
- Existing main vine (`src/flourish/lib/vine.js`, `draw.js`): retain as a comparator. Its single word-writing growth is a serious asset; the grove must earn its replacement through visible personal contributions and a shared structure, not claim finer lettering.
- Hauser & Wirth's account of the Oudolf Field, https://www.hauserwirth.com/resources/9946-oudolf-field/ and its winter study https://www.hauserwirth.com/news/23317-oudolf-field-winter-garden/: take structural beauty and seed heads beyond flowering, not a specific planting or artwork.
- Praxis rule-of-life decision making, https://www.praxis.co/playbooks/chapter/rule-of-life-decision-making: take dependence, discernment and yes/no as chosen practices; reject a behaviour score. These are research references, not copied content or code.

## Art direction

Keep Fraunces and Literata, self-hosted; maintain common colour and motion tokens. The two scenes share a naturalistic illustrated language, light by the clock, readable unmoving text, meaningful gold. Preserve the living koi rather than redrawing them. Branch geometry and leaf clusters, rendered in code with volume, replace Tend's static garden only if the before/after comparison shows clearer belonging and living response.

Adapt the house skill's one-world rule to two explicitly chosen worlds. Keep its shared light, one wind, attention budget, holds, reduced motion, no sparkle and stillness during reading. Apply product-review before shipping. Keep seasonal context but cut decorative weather flourishes and per-day prompts.

## Implementation

Style tiles and the direction were committed first (`114eca9`). The living compass replaces the home and adds `#/board`; the former season document remains as the season book. World choice is explicit and per device, with fresh-browser `?world=pond|grove` links. It carries across home, family, personal and the visual return after Amen. Existing prayer text, steps, timers, puzzle and confession are preserved. The literal water in confession remains part of that unchanged practice; recasting it for each world belongs to the next round, not a hidden change here.

The new `season.compass` stores a complete family board and independent personal boards, each `{word,yes,no,theme}`. It mirrors existing seasonal words for prayer compatibility; existing prayer and history records remain intact. No commitment is invented when reading an older board. New seasons archive the prior board; quick personal and family edits do not.

Product-review fixes applied: make **Leave it open** primary on an already-set board, keep reviewing secondary; reduce phone koi size and widen gathering spaces; keep the selected person's koi in the visible lower water while others stay quiet; correct arbitrary-word grammar; copy an entire personal yes/no into an editable family suggestion. The natural scene never records that someone did a yes or avoided a no.

Ten meaningful pure checks pass (season preservation/archiving/unknown meanings; deterministic, connected, bounded geometry). Actual browser flows passed for persistent personal edit, direct family creation, full contribution copying, four skipped people, and final save. All measured board controls across phone/tablet and day/night meet 48 × 48 px, with no horizontal overflow or page errors. Large text and reduced-motion scenes render. Final captures, cadence measurements and limitations follow below.

## Behaviour bank and mapping

Any text up to 32 characters is accepted, including an unfamiliar word. A small local lexicon suggests one of six meanings. The explicit meaning in the ritual overrides the suggestion and survives renaming. No remote model or service interprets a family's theology.

| Meaning | Koi bank | Grove bank |
|---|---|---|
| Belonging | A broad, loose gathering; individual koi retain their natural movement | A brief passage follows a personal root into the common trunk |
| Rest | Settle deeper in sheltered water, retaining the natural idle orbit | Wind settles, leaf pairs fold slightly, then hold |
| Growth | Rise towards lighter water | One tip unfolds two leaves; no numeric progress |
| Giving | Spread from a shared place into pairs | One winged seed is released into the shared wind |
| Steadiness | A broad, slow route | A bough yields to a gust and returns with damping |
| Welcome | An open gathering with a deliberately clear channel | Boughs open slightly around light in the clearing |

The family meaning leads. Periodically one person's meaning contributes a single event to the shared scene; their word is not merely a label under a generic animation. Natural phases, owners and intervals vary. Grove events occur roughly 19–36 seconds apart after an initial event; roots and fruit remain visible between them. Koi retain their existing temperament, skeletal motion, shading, feeding and curiosity. Board steering never teleports or stretches them, and feeding/fleeing takes precedence.

Touching Make room for or Leave behind highlights that part and demonstrates its meaning without recording an action. Opening a personal board quietens the other boughs/koi and leaves the family link visible. The grove's structure stays stable: personal selection changes emphasis, not the identity of the tree.

One shared Wind is reused verbatim from main. Branching adapts Coding Train's MIT space-colonisation implementation to plain vectors, with seeded crown envelopes, tapered curved scaffolds, per-person ownership and common roots. Geometry is generated once per household, bounded at 16 visual boughs, 180 nodes per bough and 58 growth passes. Cached bough and leaf sprites are moved by the shared field. The canvas is capped at DPR 1.5 and 1.5 megapixels. It stops scheduling frames while paused, hidden or under reduced motion.

A final return-home pass exposed an intermittent compact child koi with only four spine parts, below the original dorsal renderer’s assumption. A .3 minimum constructor size at the caller fixes it; a deterministic minimum-mass regression exercises that original renderer. The pond keeps `SpineFish.js` byte-for-byte. It caches slow water painting rather than recomputing its additive gradients at the koi's frame rate, caps board DPR at 1.5, reduces the calendar pads to the latest three in this compact habitat and omits decorative drifting leaves. The existing lotus still marks a verse said by heart; it is not a prayer-attendance reward. The koi remain the life, rather than competing with extra effects. Opaque banks and shore labels protect text; no word moves with an animal.

## Upgrade comparison

`screens/comparison.html` and its rendered side-by-side compare the old word-writing vine with the working grove. The original is an asset render using its original geometry/drawing code, not its application shell. The upgrade is **separate personal intentions forming one connected living structure, with a practical yes and no**. The original remains the finer word-writing instrument; this prototype does not pretend to improve its lettering. The pond preserves the actual koi instead of substituting new fish drawings. Before-board and before-home captures show the original round 2 base.

## Calls made without asking

- One stable word plus a concrete yes/no replaces four abstract board zones. A boundary protects the good yes; it is not a named vice or a fault to count.
- The whole household deliberately chooses its direction, rather than having one generated by majority vote or blended keywords. A personal board can be copied as an editable starting point.
- World choice belongs to the device. It does not force every family member to share a preference or require choosing a world during prayer.
- The Scripture link is quiet and opens the unchanged weekly wording; a full passage no longer competes with the compass on the phone.
- Existing personal words survive as incomplete boards, with no invented yes/no. A direct family season needs no personal forms first. Newcomers may choose a board later.
- Calendar weeks ripen small fruit; absence never kills or reduces anything. Illustrative bud events are not a stored history of spiritual progress.
- The grove is a new nature world, not a rebuilt garden picture. No third world: craft and meaningful difference take priority over a third menu option.

## Self-critique and cuts

**Verdict: ship with fixes applied.** Protect living koi, common roots, concrete choices, personal emphasis and the pass-around ritual. Removed decorative pond drifters, the full home-page verse, attendance as a growth condition, the termly editor as the default board action, and any attempt to average personal words. Corrected the first grove's diagram-like boughs into curved, tapered wood with fuller shaded foliage. Added a quick personal edit path rather than requiring the whole ritual for one correction.

Walkthroughs were adult proxy passes, not sessions with real children. A seven-year-old can pick an offered word and examples without typing; a grown-up can write a different intention. A custom unfamiliar word and an explicit interpretation persisted after reload. A family could go straight to its board, or pass to two people, skip four and bring one person's complete yes/no into the family draft. The initial phone school crowded itself; smaller koi and wider gathering space improved that. Personal focus also brings its koi into clearer lower water, rather than losing it beneath a bank.

## Verification and limits

`npm run build` passes. Ten pure model/geometry/render-boundary checks pass. The final browser walkthrough checks family and personal boards in both worlds, at 390 × 844 and 1180 × 820, by day and night, plus home, glance, switch, empty season, 200% text and reduced motion. Measured board controls meet 48 × 48 px; no horizontal overflow or page errors. `verify-worlds.py` reproduces these checks and captures. The normal household's world choice persists after removing the preview URL override and reloading; the season-book round trip retains it. `verify-ritual.py` checks real saves, reload, archiving and copying a complete personal contribution. The Amen walkthrough caught a room-style conflict collapsing the grove canvas; excluding that visual return from the paper child rule and placing it below the reading area fixed it. Both worlds complete the unchanged prayer and return home after Amen.

React review: heavy Grove, ritual, puzzle and confession modules load only when opened; geometry and sprites cache outside the frame loop; frame inputs use refs rather than React updates; listeners, observers and frames clean up. Colour roles live in the common token sheet. Both worlds respond to a live reduced-motion preference change. Paper sheets trap keyboard focus and restore it when closed; control names expose their meaning.

**Motion evidence is mixed.** Normal-mode pixel reads changed in both worlds at both sizes. Reduced-mode reads changed 0.0% in every case. Native tablet recordings and raw cadence results are in `screens/motion/`. The non-recording shared desktop software-rendering probe (after the water cache, before the final size guard/live preference fix) measured Pond about 10.5 fps tablet / 21 phone, Grove about 15.8 / 18.4. Median intervals were 16.8 / 16.7 ms for Pond and 50.1 / 50 ms for Grove, with substantial stalls. These results are a performance limitation; they do not meet or prove the requested smooth ordinary Android tablet bar. Physical Android, sustained battery use, cold first-screen timing, installed offline behaviour and wake-lock permission remain unverified. No actual children were recruited. The board and saving flows are tested; those device and family-use claims remain open.

Grove geometry caps illustration at 16 personal boughs; household records are not truncated. New world assets need an initial online visit before the existing warm cache can help offline. Illustrative buds reset on reopening, rather than presenting a false record of progress. Confession deliberately retains its existing literal water, an explicit scope boundary in the pitch. These are prototype limits, not hidden completion claims.
