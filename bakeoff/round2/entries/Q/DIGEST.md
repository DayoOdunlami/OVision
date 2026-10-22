# Studio Q · working digest

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

## To complete

Implementation, verification, cuts, known gaps and final links will be recorded here as work proceeds.

## Implementation checkpoint

Style tiles and the direction were committed first (`114eca9`). The living compass replaces the home and adds `#/board`; the former season document remains as the season book. World choice is explicit and per device, with fresh-browser `?world=pond|grove` links. It carries across home, family, personal and the visual return after Amen. Existing prayer text, steps, timers, puzzle and confession are preserved. The literal water in confession remains part of that unchanged practice; recasting it for each world belongs to the next round, not a hidden change here.

The new `season.compass` stores a complete family board and independent personal boards, each `{word,yes,no,theme}`. It mirrors existing seasonal words for prayer compatibility; existing prayer and history records remain intact. No commitment is invented when reading an older board. New seasons archive the prior board; quick personal and family edits do not.

Product-review fixes applied: make **Leave it open** primary on an already-set board, keep reviewing secondary; reduce phone koi size and widen gathering spaces; keep the selected person's koi in the visible lower water while others stay quiet; correct arbitrary-word grammar; copy an entire personal yes/no into an editable family suggestion. The natural scene never records that someone did a yes or avoided a no.

Nine meaningful pure checks pass (season preservation/archiving/unknown meanings; deterministic, connected, bounded geometry). Actual browser flows passed for persistent personal edit, direct family creation, full contribution copying, four skipped people, and final save. All measured board controls across phone/tablet and day/night meet 48 × 48 px, with no horizontal overflow or page errors. Large text and reduced-motion scenes render. Final captures, cadence measurements and limitations follow below.
