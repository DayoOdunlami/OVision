# Review by entry C

**How:**
- Each branch was checked out into its own folder and run locally (`npm install`, `npm run dev`).
- Each was driven with Playwright at 390 × 844 and 1180 × 820, by day and at night, using its own demo link.
- Every step was screenshotted and looked at, and both puzzles were played to the end.
- We used each product first and read its `bakeoff/entries/` folder afterwards, apart from `DONE.md` for the demo link.

Neither entry threw a console or page error in anything we did.

---

## Entry A: *Table*

**In one sentence, what is this product?**
One NIV verse for the week, prayed silently by Dad and aloud by the children, then
rebuilt in a word puzzle. All of it is set on still paper, with water and fish only when
nobody is praying.

**What it does better than anyone else in the bake-off (including us):**
- **Restraint.** The 06:45 sitting is the least app-like of the three: "Be still.", the
  verse a clause at a time, one line of intercession, then a single question, *What got
  in the way?*, with six plain words (hurry, worry, pride, fear, envy, a sharp word) or
  *Leave it unsaid*.
- Folding a one-word confession into the end of the daily prayer is the lightest, most
  repeatable answer to "clearing the ground" in the bake-off. A gets the adult confession
  down to one tap without making it a game.

**The moments**

| # | Moment | Verdict | Label |
|---|---|---|---|
| 1 | 06:45, Dad, bedside | Short and silent. One line of intercession ("Let this word rest on Pip and Noor today"), so the family's fourteen Scripture prayers are gone; "praying Scripture for his family" becomes praying one verse over two names. And at `?h=6.75` the paper is still cream: the night sheet only appears later (we saw it at `?h=22`). In October 06:45 is before sunrise. | Defect (light at 06:45) and Trade-off (depth of intercession) |
| 2 | After dinner, children | The same verse in short lines, "God, be near Pip and Noor today", "I wonder what is heavy" with four chips, then the puzzle. The children's words are good and short. The puzzle is hidden until the selected people have prayed, by their own note. | Trade-off: we would not make play the price of prayer |
| 3 | Sunday together | The same sitting as a weekday, with "the whole household". No Lord's Prayer and nothing that closes the week. Defensible (one stable wording), but thin for the one moment the whole household shares. | Trade-off |
| 4 | A glance in passing | Water by the clock and season, the season word, today's names, and fish you can feed. The fish are simple flat glyphs, not the repo's `SpineFish` koi, and at tablet size they are tiny on a large flat ellipse. | Trade-off (a sustainable art system against the project's most distinctive asset) |
| 5 | Clearing the ground | Adult: one question with plain words; child: one kindly stone. But the *weeks* page then shows what was set down, by name: "Idris set down a worry. Sam set down hurry." A confession word becomes a household record on a shared tablet. | Defect (pastorally): reproduce at `/?demo=1&at=week` |
| 6 | Looking back | Per week: the verse, a dot per person per day in their colour, a sprig when the verse was put back, and the set-down lines. Clear, but the coloured dots are a per-child tally the children can compare. | Trade-off |
| 7 | New term or season | One honest form: a word, a sentence, the season, four practices, a word each, and who prays here. Plain and complete, though for children it is a form, not a moment. | Preference |
| 8 | First run | "Who prays here?" straight away, with a name field and a grown-up toggle. There's no sentence about what the app is, and the example family is only reachable by URL. | Trade-off |

**Craft** (look, motion, type, feel). Did it avoid the average?

**Yes, by subtraction.**
- Cormorant for the verse, Literata for the prayer and Source Sans for labels. Warm paper
  and clay. Almost nothing moves.
- **Phone:** the prayer cards are beautiful and the puzzle's cut-paper slips are charming.
- **Tablet:** the landscape layouts aren't designed. The home page and the puzzle sit in a
  ~620 px column on the left with the right half of the screen empty, and the puzzle's
  pile lands in the bottom-right corner, far from the verse it belongs to. Reproduce with
  `/?demo=1&h=18` at 1180 × 820, then *Pray*, then *Let the words fall*.
- The glance is the weakest screen: flat fish on a flat oval.

**Defects:**
- **06:45 renders as day paper.** At `?h=6.75` the sitting is cream. In October and
  through the winter, 06:45 in the UK is dark, and this is moment 1.
- **Confession made public.** The weeks page publishes each person's set-down word
  ("Sam set down hurry.") on the shared device. *The weeks* is one tap from home.
- **Tablet landscape layout.** As above: the home and the puzzle use under half the
  width, and the pile sits in the corner, away from the gaps.
- **Copy.** "Sam prayed this earlier." on the home page (`/?demo=1`) is ungrammatical.
  The morning's continue button is labelled "On", which a half-awake reader has to
  decode; the evening uses "Next".
- **Demo** reseeds on every load (their own note), so a refresh loses what the judge just
  did.

**Trade-offs:**
- **One verse, not fourteen prayers.** One stable NIV wording in both the prayer and the
  puzzle is exactly what the Q&A asked for. The cost is that Dad's intercession shrinks
  to one sentence a day. For this family we would keep the verse *and* a real prayer
  around it.
- **The puzzle gated behind praying.** It protects prayer from becoming a bribe-free
  zone, but it is a gate the children will meet every evening. We'd take the other side:
  play is always open, and Amen leads into it.
- **Flat glyph fish instead of `SpineFish`.** One consistent hand against the loved,
  distinctive koi. We'd keep the koi.

**Preferences:**
- The "On" button reads as charmingly austere to some, cryptic to others.
- The six adult set-down words are well chosen; "a sharp word" is especially good.

**One thing the winner should borrow from this entry:**
The adult confession as **one quiet question at the end of the daily prayer** ("What got
in the way?", a few plain words, or *Leave it unsaid*), *without* recording or displaying
the answer. It turns confession from a separate room into a daily, two-second act of
honesty.

---

## Entry B: *Tend*

**In one sentence, what is this product?**
A beautifully typeset household prayer book with an illustrated walled garden. *Pray
quietly* or *Gather & pray* takes you through one weekly NIV verse and original
intercession, then a verse game, a private confession, a garden journal and a season
page.

**What it does better than anyone else in the bake-off (including us):**
- **The words of the adult prayer.** B's intercessions are the best writing in the
  bake-off: "Let them receive your love before they try to earn anyone's approval… teach
  them to listen without preparing an answer… offer kindness without needing to be
  noticed."
- The sitting's shape is excellent: *Arrive*, *Read slowly*, *Bring your people before
  God*, *Make room to respond* ("There's nothing to type. This moment is yours."), then
  *Carry it with you* ("Choose one small act of love. Do it quietly, without keeping a
  tally.").
- **The adult confession:** notice, ask, begin again, nothing stored, "Grace is a gift,
  not a reward for finishing a task." It is theologically the cleanest of the three.
- **The data model:** stable ids, 1 to 24 people, dated name snapshots, and same-day
  duplicate sittings removed.

**The moments**

| # | Moment | Verdict | Label |
|---|---|---|---|
| 1 | 06:45, Dad, bedside | Two taps to Scripture. A dark green sheet, large serif type, three paragraphs of real intercession, a response, a sending. The strongest adult sitting in the bake-off. The bright salmon *Continue* bar is the one loud thing on a dark page. | Preference (the button) |
| 2 | After dinner, children | *Gather & pray* shows the **same adult prayer text** to the children, in the first person singular ("Jesus, I bring Rowan & Iris…"): "teach them to listen without preparing an answer", "shelter for someone beyond our door". This is not one instruction at a time for a 7-year-old. The verse game afterwards is good: all words fall, free hints, "Try saying it together, away from the screen." | Defect (children's readability, `/?demo=1&view=prayer&mode=together&h=18`) |
| 3 | Sunday together | "For all of us", with everyone pre-selected and the week's passage. The same structure as any day. | Trade-off |
| 4 | A glance in passing | A full-screen dark garden with the season word and practices, *Keep this screen awake*, and *Feed the koi*. A handsome picture. The koi are three small SVG fish in the illustration, not the living pond. | Trade-off |
| 5 | Clearing the ground | Adult: excellent (see above). Children: three preset stones ("Unkind words", "Not sharing", "Leaving someone out") to drag or tap down, then "Is there someone you can be kind to, or say sorry to?". | Trade-off: preset sin labels can become labels a child wears, though B names actions, not feelings, which is the better version |
| 6 | Looking back | The same garden illustration plus a filterable journal ("Rowan prayed quietly", by date and by person). Honest, with no streaks, but the garden does not visibly change as weeks accumulate, and a per-person filter of who prayed is one step from a tally. | Trade-off |
| 7 | New term or season | *Our season*: word, season, three practices, "when it's hard", a printable companion, previous seasons kept. Clear and grown-up. | Preference: it's a page you read, not something the family makes together |
| 8 | First run | "Make it yours" or "Explore a household", with "No account. Just this device." The clearest first run of the three. | — |

**Craft** (look, motion, type, feel). Did it avoid the average?

**Mostly.**
- **Type and art:** the type pairing and the illustrated garden are genuinely
  well-crafted and consistent across every screen.
- **The shape is a website:** a logo with a tagline, a top tab bar (Today / Our garden /
  Our season), a hero headline ("A little room. For what matters."), arrow-cards, and a
  long scrolling home with a numbered "01 This week's Scripture" section. That grammar
  belongs to a premium brand's marketing site, which is the "could be any wellness app"
  risk the brief names. It is beautifully executed, but it reads as a place you browse
  more than a place you pray.
- **The garden is static:** it is the same illustration on Today, Garden, Season and the
  glance. In what we saw, it doesn't visibly accumulate as the weeks pass; we didn't
  test other seasons.

**Defects:**
- **The children's sitting isn't written for children.** The together prayer is word for
  word the adult text, in the first person singular.
- **Sunday's prayer lists six names in a row** ("I bring Rowan, Ellis, Poppy, Milo, Iris
  & Kit before you"). It works, but it is the same template, not a household moment.
- **The Sunday preview** (`day=sunday`) replays a past Sunday rather than showing this
  week's. That's their documented choice, but `&day=sun` on the home page silently does
  nothing.
- We could not finish the tablet verse game with scripted taps (it stalled after
  "Love"), while the phone completed cleanly. This may be our test, not their product:
  **unconfirmed, please weigh lightly.**

**Trade-offs:**
- **Every word falls, by default.** B read the Q&A ("the Memory cut, with all the words
  dropping") as "drop every word". We read it as "the Memory cut, where words drop".
  Either is defensible. With B's short verses (John 15:12 is twelve words) all-words
  works, but it removes the scaffold the children are used to.
- **An illustrated garden instead of the living koi.** A repeatable art system and a
  calmer book, at the cost of the most distinctive thing the family already has (B says
  so honestly in its digest).
- **Two named modes on the home page** (*Pray quietly* / *Gather & pray*). This is
  clearer than inferring who's here, but the children's mode then doesn't change the
  words.

**Preferences:**
- The salmon accent on dark green at night is a little hot for a bedside.
- "A little room. For what matters." is lovely once, but it's the first thing on every
  visit.

**One thing the winner should borrow from this entry:**
The **adult intercession and its shape**:
- the three-paragraph prayers;
- *Make room to respond* ("There's nothing to type. This moment is yours.");
- *Carry it with you*, ending in one small act of love, "without keeping a tally".

---

## Ranking

1. **C (ours), *Quiet Waters*.** It is the only entry that keeps the two things the
   children love at full strength: the living koi as home and glance, and the original
   puzzle's physics, now in four steps to *By heart*. It is also the only one that
   changes the prayer itself for children (simple words, turns to read in their koi
   colour) while giving Dad a genuinely dark, silent 06:45. Our weaknesses:
   - koi crossing the words on a phone is busier than either rival's still page;
   - our adult intercession is the repo's original prayers, which are good but not B's
     best;
   - the app has more rooms to learn.
2. **B, *Tend*.** It has the best adult prayer, the best confession and the most polished
   craft. It is held back for this family by a children's sitting that uses the adult
   text, by a website-like shape, and by replacing the living pond with a static picture.
3. **A, *Table*.** It is the most disciplined idea and has the best tiny confession, but:
   - its 06:45 is light paper;
   - its tablet layouts aren't finished;
   - its fish are a step down from the koi;
   - it publishes what people "set down".

**If the winner is not us, what is the single most important thing it should take from
our entry?**

**The sitting that adapts to who is in the room.** One prayer a day, but:
- a grown-up alone gets silence, the verse twice and stillness;
- children get simple words, a card each to read aloud (in their koi colour), and "I
  wonder…";
- Sunday is the household's.

The room decides how to pray, so nobody has to choose a mode, and the children's words
are actually written for children.
