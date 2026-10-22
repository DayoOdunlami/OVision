# Digest: round 2, entry P (Our Way)

The design direction, written and committed before any product code, is in
`DIRECTION.md`. The style tiles are in `tiles/`.

## The board

The four-part board (identity, season, commitments, friction) is replaced with four parts
that turn identity into decisions.

| Part | What it holds | Data (`season`) |
|---|---|---|
| Our word, and a line | This season's answer to who we are in Christ | `family.word`, `family.line`, `family.theme` |
| Our yeses (up to 3) | Practices and commitments | `family.yes[].text` |
| The no each yes protects (up to 2) | Each no is written against the yes it guards | `family.yes[].no` |
| Each of us | A word, its theme (picture), one yes; grown-ups may add a no | `people[pid] = { word, theme, yes, no }` |

`season.world` records where the board lives, and `season.lookBack` keeps the
look-back line. `season.words` stays in sync, so older code (the prayer's "here" list,
the join link) is untouched. A Quiet Waters season with `practices` still reads: they
become yeses with no no (`board.js › boardOf`).

## The world contract

| Meaning | World 1: the pond | World 2: the vine |
|---|---|---|
| **Our word** | Lies in still water at the centre; koi beneath it are seen deep and soft (a still-water layer over them), never across it | Written by the vine as it grows (the Flourish word-writer), along the trellis wire, rising from an unnamed trunk ("I am the vine") |
| **Who we're becoming** (the family word's theme) | Sets how the koi gather round the word every ~3 min: resting deep, circling slowly or faster, rising into the light | Sets what the vine bears (jasmine or blossom); "steadfast" thickens the stems; "rest" calms the wind |
| **Each of us** | A koi per person, in their own variety, moving by their theme. On touch it follows the finger and shows name and word on still water | A branch per person, abiding in the vine and shaped by its theme, ending in a blossom in the person's koi colours. Names show at the branch ends on a tablet, or on touch |
| **Our yeses** | Lily pads carrying the words (labelled on a tablet). Koi rest under them and rock them | Tags on the trellis posts (the rule of life holding the vine up), labelled on a tablet |
| **Today's yes** (rotates daily; never a no) | A white water lily opens on its pad; the line on the water names it | A tendril reaches along the wire and coils round its post, seen growing each time the board opens; the tag is sunlit |
| **The no each yes protects** | A stone resting on the floor beneath its yes. It sank once, in the ritual, and doesn't move again. Touch: *No to phones at the table, so yes to slow dinners together* | A pruned spur on the trunk with a lime shoot just below the cut, and the cutting lying at the foot (John 15:2). It falls in the ritual |
| **A person's own no** (grown-ups only) | On their own board only: their stone | On their own board only: their spur |
| **This week's verse** | Its reference on the water (touch to play) | Its reference in the field (touch to play) |
| **Who we pray for today** | Their names on the water; their koi swim as a pair, a minute at a time | Their names in gold at the branch ends and a white flower on each branch; names also on the ground |
| **What has grown** | A small pad for each week of the season and a water lily on each week whose verse was said by heart. Nothing withers | Clusters forming over the season, ripening (green, then rose, then purple) with the date, not with effort; a flower for each verse said by heart. Nothing withers |
| **Being known** (touch) | Your koi turns to your finger and follows it; your name rests on the water | Your branch lifts towards your hand; leaves ruffle as a hand passes; your name rests in the air |
| **The board born** (the ritual's finale) | The youngest lets the word in. Koi swim in one by one, each named under the word; then each stone sinks with a ring | The youngest plants the word. The trunk appears, the word grows, the branches grow one by one with names; then each cutting falls |
| **After Amen** | The koi of those prayed for rise under the paper (Quiet Waters, kept) | A shoot rises under the paper for each, opening a white flower beside a blossom in their colour, with their name |
| **Calm when praying** | Paper over a paused pond, in the pond's palette | Paper over a paused vine, in the vine's linen palette (`data-world`) |

### The attention budget (bench-agreed, counted from the screenshots)

**Phone glance at rest:** the label, the word, *Today · Yes to slow dinners together*,
the prayer line and the verse reference.
- That is 18 words with the clock, 15 without.
- The budget was 12. We kept the prayer line and the reference because the brief's
  contract needs them. The family line is tablet-only.

**Tablet glance:** about 20 words, plus three pad labels.

**Never anywhere:**
- text on a fish or on a moving branch;
- more than two moving systems beyond the water or wind (the koi, and the drifting
  leaves, which are now halved).

## The behaviour bank

One rule maps any word to a theme. The worlds move by themes, never by words.
1. The person taps what the word means to them (six pictures in the ritual).
2. Otherwise a lexicon of about 150 words (`board.js › LEXICON`) decides, with simple
   stemming ("Kindness" and "bravely" both work).
3. Otherwise a gentle default seeded from the word's hash, so an unknown word always
   gets the same theme and looks intended.

| Theme | Koi (`pond/behaviour.js`) | Branch (`vine/vine.js`, `vine/scene.js`) |
|---|---|---|
| **Rest** (abide, peace, still, gentle, patient…) | Long idles in the shade under a yes pad (idle ×2.6), sinking deep, energy low | Hangs lowest and loosest, the slowest sway |
| **Together** (kind, welcome, love, present…) | Follows a companion just behind and to the side; the companion changes daily | A tendril reaches over and twines round the neighbour's branch |
| **Growing** (brave, bold, learn, wise…) | Explores: long journeys to far edges, higher energy | Reaches higher and further out; a tendril curls up towards the light |
| **Shining** (joy, hope, thankful, wonder…) | Rises to the surface often (surface breaks every ~15 s at most), into the light | Blossom all along it |
| **Giving** (generous, serve, help…) | Visits each other koi in turn, keeping up as they move, then a yes pad | A grape cluster that ripens with the season |
| **Steadfast** (steady, faithful, rooted…) | Keeps a slow, even round of the still water at a fixed pace | Thickest (×1.55), and barely bends in a gust (sway ×0.25) |

**Pond-wide.**
- The family word's theme sets the gathering.
- The two prayed for today pair up.
- A person's own board brings their koi up under their word and sends the others deep.

**Variation that never loops.**
- Per-person seeds.
- The gathering runs on a ~3.2-minute cycle with a random offset per open.
- The companion changes by day index.
- The pairing alternates by minute, phase-shifted per koi.
- Each SpineFish keeps its own temperament (curious or shy), depth cycle and surface
  breaks.
- The vine's one wind is three incommensurate travelling waves (`wind.js`).
- The light follows the real clock, and the season sets the leaves and drifters.

## Upgrades

Before and after, side by side, are in `screens/upgrade-*`.

| Before | After | Why it's better |
|---|---|---|
| Quiet Waters pond (koi with gold names that followed them; full verse on the water) | The board in the pond | Words no longer ride on fish or get crossed by them. The board's parts are in the water (pads, stones, a lily for today), and the koi move by what each person's word means. It is quieter, with half the drifters. |
| The Flourish vine (a word on a blank page) | The vine as the board | The proven word-writer, now rooted: a trunk, a field with the clock's sky and one wind, branches per person shaped by theme, a trellis of yeses, pruning for nos, and fruit ripening with the season. |
| "This season", a page you rarely open | The board as the home and idle screen, plus "Our way" on paper | A compass, not a record: glanced every day, with the whole board one tap away. |
| The ritual: words and practices, review | Look back, then pass the tablet (creature, picture, word, yes), then together, then the world, then the finale | Children can do it without spelling; the board is "born" in the world in front of everyone. |

## Research

Every source, and whether we used it:

| Source | Licence | How we used it |
|---|---|---|
| Runions, Lane & Prusinkiewicz, *Modeling Trees with a Space Colonization Algorithm* (2007) | Paper | Studied and rejected for this board (a generic tree; the vine writes the word) |
| `space-colonization` (npm) and The Coding Train's space-colonisation sketches | Not confirmed / MIT-style examples | Not used in code |
| Jason Webb, *morphogenesis-resources* and differential-growth experiments | Repository list (various) | Reference only |
| Craig Reynolds, *Steering Behaviors For Autonomous Characters* (GDC 1999) | Paper | The koi bank's seek, follow (offset pursuit) and wander are his ideas, adapted to SpineFish's own target |
| codeberg `landrew/koi-pond`, GitHub `tchalvak/boids`, `trykhov/FishPond` | Various (not confirmed) | Read for schooling ideas; no code taken |
| Dandelion seed sims (NYU, CMU student work) | — | Considered for "letting go"; rejected on the bench's theology (seeds spread) |
| John 15:1–8 and Galatians 5:22–23 | — | The vine, the branches, pruning, and fruit as a gift of abiding, not effort |
| EMS Allure single-stroke font (Sheldon B. Michaels, from Allura by Rob Leuschke) | SIL OFL 1.1 | Already in `main`; carried with the vine |
| Fraunces, Literata | SIL OFL 1.1 | Already in Quiet Waters |

**The decision:** adapt the proven in-repo code (SpineFish, the Flourish vine, Abide's
wind) rather than import external code. Nothing from outside the repository is in the
bundle.

## Key decisions and trade-offs

- **A no only ever protects a yes.** It is never shown alone and never in the daily
  line. The decision card's third question is *which way leaves us more loving, and
  more at peace?*, not *is it one of our nos?*. This is the spiritual director's point:
  discernment, not a rule list.
- **Pruning, not dandelions, for the vine's no.** Both the spiritual director and the
  art director said dandelions read as the nos spreading; pruning is John 15's own
  image. The children's designer lost the swipe-to-blow. The touch that remains is a
  branch lifting to your hand.
- **The vine is never named.** The family isn't the vine; Christ is. The family word
  grows out of it, and each person is a branch.
- **Children's boards have a yes only.** A grown-up's no stays on their own board,
  avoiding confession or accusation between siblings on a shared screen. True privacy
  isn't possible on a shared device without accounts (out of scope), so the honest
  claim is "not shown to the family", not "private".
- **Growth belongs to the family and follows the weeks.** There are no per-person
  counts, and the fruit ripens by date.
- **No text on fish.** Names appear on still water at a touch. The still-water layer
  over the words is our answer to "fish cover words on a phone": fish pass beneath,
  dimmed, instead of being kept out entirely (which looked like an invisible wall).
- **A word budget on phones.**
  - The family line, the full verse and the pad and tag labels are tablet-only.
  - On a phone today's pad or tag is marked, not labelled, and the DOM line names it.
- **The switch is per device, over a family default.** The ritual sets
  `season.world`, and a screen may override it (`device.world`; `null` means "the
  family's choice"). `?world=` in a link sets it, like the switch.
- **Two worlds, not three.** The starlings were tempting, but two done properly beat
  three thinly.
- **The prayer, puzzle and confession are unchanged.** The world only shows under the
  paper after Amen, as Quiet Waters already did.

## Code reused, and from where

| Code | From | What changed |
|---|---|---|
| `src/app/pond/*` (SpineFish, pads, water, layers, koiFood) | This branch (Quiet Waters) | PondView rewritten for the board; `behaviour.js` is new; `board.js` (yes pads, stones, water lily) is new |
| `src/app/vine/vine.js`, `draw.js`, `allure.js` | `main:src/flourish/lib/` | Our changes are marked "(studio P)": branches by theme, the trunk gap, tendrils for "together" and "growing", the tinted blossom, ripening grapes (green → rose → purple), and leaves tagged to branches so they sway with them |
| `src/app/vine/wind.js`, `ambient.js` | `main:src/flourish/abide/` | Unchanged except the import path |
| `skyAt` (in `vine/scene.js`) | `main:src/flourish/abide/AbideScene.jsx` | Copied; the sky now follows the app's light |
| KoiGlyph, Faces and the paper rooms | This branch | Kept |

## Testing

**Browser.** Chromium (Playwright) at 390 × 844 and 1180 × 820 throughout.

**Times of day.** `h=6.75` (the 06:45 prayer), 11, 17, 19 and 22.

**Other settings.**
- `prefers-reduced-motion`, on the vine at dawn.
- A fresh browser with no data: the Welcome screen, no errors.
- Every demo link opened in a fresh context.

**As whom.**
- As Sam (adult): own board, own no.
- As Ada (child): her board shows a yes only.
- As the youngest, Pip: the finale.
- The ritual walked end to end on a phone into the vine, and on a tablet (by the demo
  jump) into the pond.

**Performance.** Measured in headless Chromium (software rendering) at 1180 × 820 and
1.5× pixel density:
- The board in the pond runs at the same frame time as Quiet Waters' pond at round 2's
  start (a median of 33 ms in that software renderer).
- The vine runs at a median of 17 ms.
- The vine caches its sky per hour, bakes matured stems once, caps its backing store at
  4.5 MP, and drops to every other frame if frames run slow.
- The pond keeps its adaptive shadows.

**What we found and fixed.**
- **Koi crossing the words.** Added the still water layer over them, sized to the words
  themselves rather than their full-width block.
- **Fish names following fish.** Removed; names are now shown at a touch, still.
- **Phone tags truncated** ("Slow dinners t…"). Phone tags now carry no words.
- **Night band** in the vine. A hard-edged tint was replaced with a gradient.
- **A white rectangle around the lit tag.** Fixed the glow's bounds.
- **The finale showed the old world before planting.** It now shows the chosen world,
  empty, waiting.
- **The vine finale was too slow** for a family round a tablet. Growth now runs ×1.7 in
  the finale, and the trunk fades in.
- **At 06:45 the vine's sky was dawn-pink under night-coloured words.** The sky now
  keeps to the page's light.
- **Chosen chips were invisible at night.** Fixed.
- **"Yes to sunday kept for rest".** Lowercasing now leaves the capital on days,
  months, God, Mum and Dad.
- **Personal vine boards bore the family's grapes.** They now bear their own theme, in
  their colour.
- **Amen flowers were too small and covered the notes link.** Fixed.
- **Arrival names covered a pad's words in the pond finale.** They now appear under the
  word.

**`npm run build`** passes.

## Known gaps

- **Not run on a real Android tablet.** The frame-time figures come from a software
  renderer.
- **The word budget on a phone is 15, not 12.** We kept the prayer line and the verse
  reference for the contract.
- **Changing a child's board** is a link on their board ("Change Pip's board"), with no
  guard against a parent changing it. The bench's ethicist wanted children to own their
  boards; without accounts, we rely on the family.
- **Join links** carry the season (and its board) to another device as before, but
  haven't been tested with the new fields beyond reading.
- **In the vine on a tablet, the slip covers some names and tags while awake.** They show
  when the board goes idle (a minute) or the slip is dismissed by waiting.
- **The ritual is 3 screens per person.** With six people that is long (about 24
  screens), but it is termly, and each screen asks one thing.
- **Some behaviour differences only show over minutes:** steadfast's round, giving's
  visits, the gathering. A judge glancing for ten seconds will mostly see the shapes:
  the vine's branches, the pads and the stones.

## Calls made without asking

- **Theme names and pictures.** We chose six themes (rest, together, growing, shining,
  giving, standing firm) and their pictures.
- **No to dandelions.** The pruning image replaces the concept draft's dandelion clocks.
- **Children get no no.** The `kind: 'child'` flag decides; we have no ages.
- **Today's yes rotates by date.** It is the same on every device, so the kitchen
  tablet and Dad's phone agree.
- **The youngest** is taken to be the last child in the household's list.
- **The demo jump** `#/season/new?at=together|family-yes|world|finale` exists in the
  example family only, so a judge can reach the finale in a minute.
- **The demo family's boards were invented.** Pip's word changed from Gentle to Helpful
  so the six people cover all six themes.
- **The finale's grapes** start green and ripen across the season; a new season starts
  with none.
- **Weekly pads** that would sit under a yes pad move to the next free slot round the
  margin.
- **The look-back line** is kept with the season it looks back on, and shown in the
  book of seasons.
