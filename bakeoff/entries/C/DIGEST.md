# Digest: entry C, *Quiet Waters*

The full account, for an expert reviewer. The product itself is the argument; this is the
reasoning and the honest ledger behind it.

## Process

All in one working session. The order is visible in `git log`.

| Phase | What we did |
|---|---|
| **Gate 0** | Walked the live app at 390 px and 1180 × 820, by day and at `?h=22`. Read every doc and the code for every surface. Asked eight questions (`QUESTIONS.md`). |
| **Discover** | Re-read the code we would build on: `SpineFish`, the koi food, `KoiSchool`, the puzzle, the prayer content and grammar, Abide's words. Walked Pray it, Abide's sow and vineyard, and the screensaver. Findings are in `DESIGN-DIRECTION.md` ("What we found"). |
| **Research** | The practices (Lectio, Examen, breath prayer, Centering Prayer, Practicing the Way, Godly Play), the apps (Lectio 365, Pray as you go, Hallow, Duolingo, Headspace, Finch), calm games, humane design, and then, after the addendum, illustration, type and colour references. Each has a "take / reject" row. |
| **Directions** | Three, genuinely different: *The Book of Hours* (a typeset breviary), *The Vineyard* (Abide's world as a growing game), *Quiet Waters* (one pond; every practice opens from it and closes into it). Each is rendered as a style tile of the same screen (the 06:45 prayer at 390 px). |
| **Bench critique** | Before committing the direction, two independent passes argued with the draft: a spiritual director and a children's game designer. Six decisions changed (see the table in `DESIGN-DIRECTION.md`), including the adult confession, which we had got wrong. |
| **Decide and write** | `DESIGN-DIRECTION.md` was committed before any product code (commit `50f4219`). After the addendum we added the tiles, tokens, product map, every-state table, voice guide and accessibility and performance plan, again before product code (`2b4e5ff`). |
| **Build** | One app at `/` (commit `404b4bb` onwards), with old addresses redirected. The koi, puzzle, prayers, grammar and Amen koi were carried over and adapted; everything else is new. |
| **Test** | Playwright at both sizes, in every light, as each person, plus contrast, 200% text, reduced motion, offline and throttled performance (below). An independent usability walkthrough by a fresh reviewer (below). |
| **Self-critique and cut** | `product-review` run on our own entry, with its fixes applied (below). |

## Key decisions and trade-offs

1. **One place, not a set of pages.**
   - The pond is home, idle screen and record. Rooms are paper laid over the water: they
     surface when opened and sink back when closed.
   - Trade-off: we lose Abide's painted field and vineyard, the most beautiful art in the
     repo. We judged it a second world and a second daily practice, and the client's own
     notes say a young vineyard reads as empty.
   - Its best ideas moved to the pond: the breath prayer, reading twice, stillness, "I
     wonder", the stones, and accumulation over time.
2. **One prayer a day, many sittings.**
   - Per the Q&A, moments 1 and 2 are two sittings of the same prayer.
   - Each Amen records who prayed (`sittings[].who`). A morning Amen marks only Dad.
   - The evening sitting says, for example, "Dad prayed for Ada and Mum this morning. Now it's your
     turn."
3. **Who's here decides how to pray, so there are no settings for it.**
   - One grown-up: silent, first person, the verse twice and stillness.
   - Children present: simple words and turns to read.
   - Sunday: everyone.
   - This removes the hidden voice, style and "praying as" settings the brief called out.
   - Trade-off: a grown-up who wants the children's words with no child present can't
     ask for them. That case is rare; `script.js` already takes `simpleWords`, so it is
     one line from a toggle.
4. **The rota is worked out, not stored.**
   - `rota.js` derives the week's pairs from the household id, its people and the week
     number, continuing the sequence across weeks so an odd household is fair. It works
     for any household size.
   - The phone and the tablet therefore agree on today with no sync.
   - The week turns on Monday morning (Q&A). The prayer day turns at 03:00, so a
     midnight prayer still belongs to the evening.
5. **The verse learned is NIV, with no names in it (Q&A).**
   - `content/verses.js` holds fourteen NIV verses (one per prayer), each with its word,
     a breath prayer and an "I wonder…". The same wording is used in the sitting, the
     puzzle, the pond and the printed card.
   - The NIV notice is in Settings → About and in the README.
   - The prayers around the verses keep their existing original renderings.
6. **Learning by heart has an honest end.**
   - Four steps across the week: *Some words*, *More words*, *Every word*, *By heart*.
     The app remembers the step per week.
   - Different words fall each round: `puzzle.js` takes `every` and `offset`.
   - *By heart* hides the verse and makes each word a stepping stone showing its first
     letter. You say it, then tap to check. The app can't hear, so it doesn't pretend to.
   - "We said it by heart" (here or on Sunday) opens the week's lotus.
7. **Confession: reflection before gesture.** *Into the deep*, rebuilt after the
   spiritual director's critique (`deep/`).
   - A grown-up asks for light (Psalm 139:23–24) and looks back over a concrete day.
   - Thirty seconds of quiet, then they name it to God (nothing typed), and one stone is
     opened from the hand. "He casts it into the depths" (Micah 7:19), then 1 John 1:9 and
     one thing to put right.
   - Children are led by a grown-up through a gentle question. Each child throws a stone
     (sorry) or a flower (thank you), so nobody has to find a sin.
   - The assurance is read aloud, then "Is there someone to say sorry to?"
   - Nothing is stored.
8. **Seasons, not a dashboard board.**
   - The Q&A's direction ("personal boards feeding a family board") became: each person
     chooses one word, passing the tablet round. The family chooses its word together
     (often from those) and up to three "we will…" practices, a rule of life.
   - The family word lies in the pond. Tapping your koi shows your word, and Sunday shows
     everyone's.
   - The old four-zone board (identity, season, commitments, friction) is gone.
   - Trade-off: Dayo's richer personal board lost its "friction" and commitment detail.
     We judged one word per person a better daily signal, and the practices carry the
     commitments.
9. **Looking back without a ledger.**
   - A lily pad for every week of the season (whatever happened) and a lotus for each
     verse said by heart.
   - *This season* lists the weeks, their words and verses, and the morning lines.
   - No prayer counts, and never one child against another (the director's point: pads
     per week prayed would have been a streak in disguise).
10. **Koi at Amen: kept, made quieter.**
    - The director worried that "her fish came up because I prayed" teaches cause and
      effect. We kept it because it is the family's most loved moment, but the koi are
      always those prayed for, at every Amen, so nobody earns them.
    - The solo morning holds three seconds of silence first.
    - This is the one point where we overruled the bench.
11. **Data model** (`store.js`): `household`, `seasons`, append-only `sittings`, `heart`,
    `play` and `pick`, plus a small per-device record.
    - The example family lives under its own key, so `?demo=1` on the family's own
      tablet never touches their data.
    - The old `familyPrayer` record is not imported (optional per the Q&A). See the gaps
      below.

## The moments

Every link works on a fresh browser. `?demo=1` loads the example family (Sam = Dad,
Jo = Mum; Ada, Kit, Noor and Pip). Each deep link starts the example fresh for that
moment.

| # | Moment | How it's served | Deep link |
|---|---|---|---|
| 1 | 06:45, Dad, phone, bedside | Night pond, then *Pray*: two taps from the icon. Night paper. Three breaths, the verse twice with its word in gold, 20 s of quiet, the prayer one thought at a time with *Wandered?* (the week's word and breath prayer), a line for them, the blessing, Amen, three seconds of held silence, then their koi rise. Notes on the passage are offered after Amen. | `/?demo=1&h=6.75` then *Pray* · straight in: `/?demo=1&h=6.75#/pray` |
| 2 | After dinner, children, tablet | Who's here is remembered, and shown on the first card with each child's koi and "Not right? Change". It opens with "Dad prayed for … this morning. Now it's your turn." The verse read together, simple words, each card read by a different child (koi colour), "I wonder…", the blessing together, Amen and the koi (feed them), then *Play the verse*: four steps, different words each time, turns in koi colours, several fingers at once, a hint after 8 s. *Today's prayer* (with names) is the second game. | `/?demo=1&h=19#/pray` · `/?demo=1&h=19#/play` |
| 3 | Sunday, household, one screen | The Lord's Prayer; everyone held, each with their season word; the week's verse said together from first letters ("We said it by heart" opens a lotus); the week looked back on; Amen with everyone's koi. | `/?demo=1&h=17&day=sun#/pray` |
| 4 | A glance in passing | After a minute the slip sinks away. The idle pond shows the family's word, the week's verse and "Today · …" with today's two names, which also float beside their koi. It changes with the clock (dawn, day, dusk, night) and the season. Settings → *Keep the screen on* holds a wake lock. | `/?demo=1&h=21&idle=1` · by day: `/?demo=1&h=11&idle=1` |
| 5 | Clearing the ground | *Into the deep* (see decision 7). Offered on the slip on Saturday evenings; a quiet link otherwise. | grown-up: `/?demo=1&h=21.5#/deep?who=sam` · children: `/?demo=1&h=19#/deep?who=ada,kit,noor` · the offer: `/?demo=1&h=20&day=sat` |
| 6 | Looking back | The pond after six weeks: seven pads and four lotuses. *This season*: the words, the weeks with their verses and lotuses, the lines written in the morning, and the book of seasons. | `/?demo=1&h=12` · `/?demo=1&h=12#/season` |
| 7 | New term or season | *Begin a new season*: name it, pass the tablet to each person for one word (children tap, nobody has to type), choose the family's word and practices, review, begin. The old season goes into the book; the pond starts clear. Two weeks before a season's end, the slip offers the look back. | `/?demo=1&h=12#/season/new` |
| 8 | First run, fresh device | A clear pond with three stranger koi; *Set up our household* (names, grown-up or child, a koi each) or *Look around with an example family*. From there it's two taps to praying. *Settings → Another phone or tablet* makes a link that carries the household (and its season) to a second device. | `/` in a fresh browser · `/#/setup` |

Other states:
- Returning after a gap: `/?demo=1&h=8.5&away=5`.
- Already prayed today: `/?demo=1&h=21`, where *Pray* has gone quiet for whoever usually prays at
  that time.
- Winter: `&season=winter`.
- Printed card: `/?demo=1#/print`.

## Testing

**How.** Playwright with Chromium. Everything was walked on the dev server, and
performance and offline were checked on the production build (`vite preview`). Before
screenshots came from `bakeoff/r1-base` run locally.

**Sizes and times.** Every room at 390 × 844 and 1180 × 820. The pond and sittings at
`h=6.75` (before dawn), `7.6` (dawn), `12` and `15` (day), `17` to `19` (dusk and
evening), and `21` to `22` (night), plus `season=winter`.

**What we checked, and what we fixed as a result:**

| Check | Result | Fixed |
|---|---|---|
| Every room loads at both sizes with no console or page errors | Pass, ours and the independent walkthrough | — |
| The 06:45 sitting, end to end | Pass. Two taps from the icon to its first words. | — |
| The children's sitting, end to end, then Play | Pass | — |
| Sunday, end to end | Pass | The verse's stepping stones crowded together, so they are now laid out word by word. |
| Into the deep, grown-up (open hand, sinking) and children (drag-throw and tap) | Pass | The disabled "…" button during the sink is replaced by nothing until it has sunk. |
| By heart, Today's prayer, setup, new season | Pass | By heart now ends on the whole verse, gold. Setup has a way back. "Last season" became "Until now". |
| Contrast, all text roles, all four lights (script: `contrast.mjs`, alpha composited) | All AA or better. The lowest is 5.2:1 (day gold on the slip). The word in the water is 8:1 by day on its still-water halo. | The day word in the water is deep-teal ink, not white on pale water. |
| 200% text | Initially the home and the sitting clipped their tops. | Large text now scrolls (`justify-content: safe center`), the home's verse is clamped to three lines, and the puzzle's controls keep their size (the puzzle fits its own words). |
| Reduced motion | Still pond, no rises; the puzzle lays its tiles in rows. | The tile rows overlapped when the stage resized, so they are now laid out again on resize. |
| Offline | After one visit, an offline reload opens the pond and the manifest. | — |
| Performance, production build, CPU ×4 slower, about 6 Mbps | First run usable at 1.6 s; the example family at 2.8 s. | — |
| Frame rate | Was 4.4 fps at tablet size in headless software rendering, half the old pond's 10.3 in the same harness. | Still layers painted once, sprites for caustics and pad shadows, no backdrop blur over moving water, and adaptive koi shadows (blur off if the median frame exceeds 24 ms). Now about 58 fps at tablet size and about 51 at phone size, in the same harness. |

Headless numbers are pessimistic, because canvas there is software-rendered. A real
Android tablet has GPU canvas.

**Visual fixes from looking at our own screenshots:**
- Koi crossing the verse hurt legibility, so the words now sit on still water.
- The autumn leaves read as red stars, so they are now fallen leaves.
- The moon's reflection was stripy, so it is now one soft disc.
- The example tag overlapped the date.
- Lily pads hid under the slip.
- The idle slip didn't fade (its entrance animation's fill mode beat the fade).

## Walkthroughs (usability test)

A fresh reviewer, with no access to our reasoning, drove the running app by tapping
visible controls only, as three people. There were no console or page errors. Here is
what they found, and what we did.

**Dad at 06:45 (phone).**
- Two taps from the pond to the first words: the breath prayer and the names. The
  intercession itself comes after the verse and the stillness, which is by design. Ten
  taps from pond to pond.
- Nothing glaring at night.
- Hesitations:
  - "Stay a moment" skipped the stillness when tapped, the opposite of what it says.
    **Fixed:** it now reads *Skip the quiet*, and *Continue* when the twenty seconds are
    up.
  - The Settings icon read as a sun or brightness toggle. **Fixed:** a real gear.
  - "Tap the water. Double-tap to feed the koi." is app talk at dawn. **Fixed:** the
    hint no longer shows in the morning or at night.
  - Koi and their name tags crossed the verse. **Fixed:** koi no longer rest on the
    words; their resting places are moved to the side of the still water. They still
    cross beneath.
- **Not changed:** "Read it again" and "Be still" as button names. The reviewer wanted
  "Next". We think the instruction *is* the step at 06:45, and the eyebrow label says the
  same. A judgement call.
- **Not changed:** *Wandered?* under each prayer card. It is the quiet way back the
  spiritual director asked for.

**Two children, 7 and 9, after dinner (tablet).**
- The sitting opened on "Praying: Ada, Kit and Noor" from the last evening, and the small
  "· change" wasn't noticed. **Fixed:**
  - On children's sittings the first card shows each child's koi, "Here: …" and a full
    "Not right? Change" button.
  - The picker's button says *Done* and goes straight on.
- "Help Jesus to live deep in their hearts" read as asking God to help Jesus. **Fixed:**
  "Please let Jesus live deep in their hearts."
- In the puzzle:
  - Nothing said what to do. **Fixed:** "Drag or tap the next word."
  - The live slot glowed red (Ada's koi colour) and looked like an error. **Fixed:** the
    slot is gold, and the turn colour is only its underline.
  - Dragging, tapping and finishing a round all worked.
- In *Into the deep*:
  - Next stayed disabled until every listed child had thrown, so an absent child blocked
    the others. **Fixed:** any child can finish.
  - "A grown-up reads this out loud" showed with no grown-up present. **Fixed:** it says
    "Read this out loud together" unless a grown-up is among those here.
- **Not changed:**
  - "Well done!" at the end of a round. The voice guide bans exclamation marks, and the
    gold sweep and the passing koi are the celebration.
  - Giving the shortest line to the youngest reader (a good idea; noted for another day).

**A new family on first run (phone).**
- Setup was smooth.
- *This season* was offered twice on the pond (the offer and the link). **Fixed:** the
  link is hidden while the offer shows.
- After beginning a season, the first button on the result was "Begin a new season".
  **Fixed:** *Back to the pond* comes first.
- Dusk text on the pond looked low-contrast over the sunlit centre. **Fixed:** the dusk
  water's centre is darker and its still-water halo is stronger.
- **Not changed:**
  - A child whose own name is in today's pair hears the prayer for them while reading it.
    That is the household's rota, and we kept it.
  - Children are asked "this term" and grown-ups "this season". This is deliberate.

Our own persona walks before that (Playwright, the same three people plus Sunday) led to
the earlier fixes listed under Testing.

## Self-critique: what we cut and why

We ran `product-review` (with our two added tests: the 06:45 test and the child-alone
test) on the finished entry.

- **Verdict:** ship with fixes. The fixes below are applied.
- **Protect:** the night paper, the two taps, *Wandered?*, Amen held in silence, the
  koi-colour turns, *By heart*, the stone-or-flower choice.
- **Cut, before the build:**
  - Abide's sow-grow-gather and the vineyard: a second daily practice.
  - Flourish and Murmuration: other worlds.
  - Today: the pond is the front door.
  - Labs and Admin: builder tools.
  - `/make/`: merged into seasons.
  - The voice, style, celebration and patience settings: inferred, or one strong default.
  - Prayer counts and per-child tallies: a ledger.
  - The "words on stones" for children: they become labels a child wears.
- **Cut during self-critique:**
  - Lines written in the morning on the Sunday screen. They are private intercession,
    and the Sunday screen is shared with children; they now appear only in *This season*
    on that device.
  - A visible return word on every card, now behind *Wandered?*.
  - The backdrop blur on the slip, which cost frames for an effect nobody would miss.
- **Restored during self-critique:** the Greek and Hebrew notes on each passage (months
  of writing). We had dropped them. They are back as *Notes on Ephesians 3:16–19* after
  Amen, never during the prayer.
- **06:45 test:**
  - The "Praying: Sam · change" chip on the first card is the one remaining piece of app
    in the prayer. We kept it because it's how you correct who's here; it shows only on
    the first card.
  - The progress dots are small and dim at night.
- **Child-alone test:** pond, *Play the verse*, the puzzle, ✕, the pond: no reading
  needed beyond "Let them fall". *Pray* asks *Who's praying?* the first time on a
  device.

## Known gaps and bugs (honestly)

- **The family's existing data is not imported.** Their prayer history, vineyard and wall
  under `familyPrayer`, `flourish.*` and `abide.who` stay in their browser, untouched but
  unused. A one-off import is possible: the six names map to a household and `prayed`
  dates to sittings. We didn't build it.
- **No sync between devices.** On Dad's phone the tablet's evening Amen isn't known, so
  "already prayed" and "Dad prayed this morning" only know the device they're on. The
  device link carries the household, not the history.
- **Install prompt:** Chrome's own prompt is captured and offered in Settings. We
  couldn't test a real install on Android here; the manifest, icons (including maskable)
  and service worker validate in Chromium.
- **Wake lock** is requested on the home screen when *Keep the screen on* is set. It is
  untested on a real tablet.
- **Haptics** use `navigator.vibrate`, which works on Android Chrome and is ignored
  elsewhere. Untested on hardware.
- **Koi still pass under the words.** The still-water halo keeps contrast at AA, but a
  black koi crossing the word in daylight is momentarily busy. This is by design (the
  words are *in* the water), but it is a judgement call.
- **In reduced motion** the puzzle's bottom row can sit close to the last line of a long
  verse on a short phone.
- **Hebrews 13:21 and Colossians 1:10 begin mid-sentence** in the NIV, and we capitalised
  their first word.
- **Light by the clock** assumes UK sunrise and sunset by month.
- **A grown-up praying alone can't ask for the children's words** (see decision 3).
- **The old Labs, Admin and murmuration code is deleted** from this branch, not hidden.
  The redirects keep bookmarks working. Git history keeps the code.
- **The icon generator** was a one-off page run against the dev server. It is described
  here but not committed.

## Calls made without asking

- We named the product *Quiet Waters* (Psalm 23:2), so it is one product with one name.
- NIV Anglicised (UK spellings: favour, for evermore), because the family is in the UK.
- The week turns at Monday 00:00 by the prayer day, which turns at 03:00, so in practice
  Monday 03:00.
- Sunday's prayer is the Lord's Prayer plus a blessing over everyone, as the original
  had. The week's verse is said together.
- Who's here is remembered per device and per part of the day (morning, afternoon,
  evening, night).
- A season lasts about 12 weeks by default. The slip offers the look back two weeks
  before the end.
- The example family is invented (no real names).
- No sound, per the Q&A. Silent haptics stand in for "how a tap should feel" on Android.

## With another day

1. A one-off import of the family's old data, so their history continues.
2. Two-device sync of sittings (a small Supabase table keyed by household), so Dad's
   phone and the tablet share "already prayed".
3. A real-device pass on the family's Android tablet: install, wake lock, haptics, frame
   rate.
4. The pre-reader path for the youngest: Andika type and picture prompts. Then, with
   sound allowed, the verse read aloud.
5. An Examen evening sitting grown from *Into the deep*: the first new discipline in the
   same grammar.
