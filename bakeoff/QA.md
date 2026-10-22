# Questions and answers

Every question from Gate 0, from all three studios, merged by topic and anonymised, with
the client's answers. **These answers are part of the brief.** Where an answer differs
from `BRIEF.md`, the answer wins.

---

## Access and testing

**The live site, previews, and what to treat as the reference.**
The reference is the `bakeoff/r1-base` branch running locally (`npm run dev`); the live
site is simply `main` deployed. Some environments can't reach the live site. Branch
previews on Vercel sit behind the client's Vercel sign-in, so **no studio can open
another entry's preview**. At Gate 2 you review by checking out each branch and running it
locally (see `RULES.md`). Still put your preview URL in `DONE.md`: the client can open it.

## The daily prayer

**Is there one prayer a day, or two (Dad's morning and the children's evening)?**
One. There is one prayer for the household each day: the rota's pair, and on Sunday
everyone. Different people meet it at different times. Dad usually prays it alone in the
morning; the children pray it after dinner, together. So moments 1 and 2 in the brief are
**two sittings of the same prayer**, not two prayers. A morning Amen must not mark the day
as done for people who haven't prayed yet: track it per person (or per sitting).

**How does Dad pray in the morning, and where does his attention slip?**
Silently when he's alone; aloud when he's with the children or his wife. Design the solo
morning for silent prayer.

**When does the week turn, and how often does the prayer change?**
Weekly, and the change should still feel like a small surprise to the children (they
like it). The week turns on **Monday morning**, so Sunday, with the whole household, closes
the week.

## Scripture wording and learning by heart

**What is being learned by heart: the passage, a children's rendering, or the personal
prayer with names?**
The Scripture verse, in **one stable wording** that's the same in the prayer and the
puzzle all week. Family names belong in the prayer, not in the verse being memorised.

**Which translation?**
The children hear the **NIV** at church and school, so verses for learning by heart should
use NIV wording. This replaces the brief's "public domain only" rule, with these limits:
- Stay within Biblica's NIV General Use Guidelines: no more than 500 verses in total,
  never a complete book of the Bible, and less than 25% of the product.
- Show an NIV copyright acknowledgement in the app.
- Everything around the verses (the prayers, prompts and explanations) can stay in the
  existing original modern English, or use the World English Bible.
- Licensing NIV for a product sold to other families is a backlog question, not this round.

## Confession: clearing the ground

**What exactly doesn't land about the stones for Dayo?**
The concept is more compelling than the doing. He's meant to reflect on each stone as he
clears it, but that doesn't really happen; he could as well just imagine the process. It
may work better for the children as an activity. You're free to redesign the adult moment
completely and keep, change or drop the field for the children.

## The children

**Ages and reading?**
Four children, aged roughly 4 to 11. It's mostly used by **the two middle children (around
7 and 9)**, who can read. Design for them first. The youngest is a pre-reader and a bonus,
not a requirement this round.

**What would they miss?**
- **The puzzle:** they always use the default *Memory* cut, with all the words dropping.
  It's the clear favourite.
- **Feeding the koi:** they enjoy it.
- **Everything else:** the koi, the murmuration and seeing the vineyard after Abide are
  all liked, but none is more loved than the others. Nothing besides the puzzle is sacred.

## The board

**One family board, one per person, or both?**
Undecided, and the client welcomes a wise call. His current thinking is **personal boards,
connected to each other, that feed a family board elegantly**, with the family board also
able to be made directly. Treat that as a direction, not a spec.

## Devices and sound

**Which devices?**
**Android.** Mostly a tablet, then a phone, sometimes a laptop. Test on Chrome for
Android sizes first; Sunday is on the tablet.

**Sound, and a synthetic voice for non-readers?**
Not this round. The app is silent by default. You may say in your pitch where sound would
go later.

## Addendum: design and UX craft (sent to all three at the same time during Gate 1)

The client wants the look and the experience decided with the rigour of a world-class
UI and UX studio, not settled at the end. These are now part of the brief. If you have
already chosen a direction, you don't have to start again, but do the items below for it
and its rivals.

**1. Show the directions, don't just describe them.**
- Before building, make a **style tile** for each of your two or three directions: the
  same screen (the 06:45 prayer), actually rendered in that direction's style at 390 px.
- Commit them as `screens/directions/<n>-<name>.png`, and put them side by side in
  `DESIGN-DIRECTION.md` with why one won.
- A direction that exists only as words doesn't count.

**2. Research the visual craft specifically, not only the apps.**
- **Illustration:** for example children's Bibles and picture books, devotional art,
  printmaking and textiles, and the art of calm games.
- **Type:** for long reading and for early readers, plus reading prayer at night.
- **Colour:** day, night and season.
- Record each reference and what you take from it. References inform; never copy a
  specific artwork, character or brand.

**3. A look the code can sustain.**
- Choose an illustration method you can produce consistently across every moment: drawn
  in code (SVG, canvas, CSS), or openly licensed assets with the licence recorded in
  `DESIGN-DIRECTION.md`.
- No stock-photo or clip-art patchwork, and no mix of styles.

**4. One design system.**
- Put colour, type, spacing, radius, shadow and motion in one set of tokens that every
  screen uses, so round 2 can extend it.
- Day and night are two settings of the same tokens, not two stylesheets.

**5. The shape of the whole.**
- In `DESIGN-DIRECTION.md`, include one simple map of the product: every room or mode,
  and how you move between them.
- Count the taps from the home-screen icon to the first line of today's prayer, and keep
  it to two at most.

**6. Every state, not just the happy path.**
Design and build:
- first run
- an empty week
- "already prayed today"
- night
- returning after a gap of several days, with no guilt
- the transitions between moments

**7. Accessible and kind to small hands.**
- Text contrast at WCAG AA or better, by day and at night.
- Tap targets at least 48 × 48 px.
- Respect reduced-motion settings.
- Text that still works at 200% size.
- Children's screens readable by a 7-year-old: short words, one instruction at a time.

**8. Words are design too.**
- Write a short voice guide (a few lines) and hold every label, prompt and message to it.
- Plain British English. No jargon, no exclamation marks, no guilt.

**9. Fast on an ordinary Android tablet.**
- The first screen should be usable within about two seconds.
- Animation stays smooth.
- Heavy pieces, such as 3D or physics, load only when they're opened.

**10. Prove it with a walkthrough, and show before and after.**
- **Walkthroughs:** walk each person through their moments as a usability test (Dad at
  06:45, a 7-year-old and a 9-year-old after dinner, a new family on first run). Record
  in `DIGEST.md` what they had to do, where they hesitated and what you changed.
- **Screenshots:** in `screens/`, for each moment, a before (today's app) and an after
  (yours).

## Existing data

**Must the family's existing data (prayer history, vineyard, the wall) carry over?**
No. You're free to design a new data model that works for any household. A one-off
import of the old data is welcome but optional.
