# Pray: a critical pass (October 2026)

## Verdict

Pray is the best-crafted surface. The type, the gold names, the paced "Pray it" cards and
the puzzle are good.

It has three structural problems that make the app feel less trustworthy than it looks:

1. **Reading didn't count.** Most days a family reads the prayer off the screen. Only an Amen
   inside "Pray it" or the puzzle marked the day as prayed. So the pond's koi "running lean",
   and the vineyard's fruit, were often wrong about what the family had actually done.
2. **The words changed under you.** With the default style (Flowing), "Pray it" switched adults
   to the modern Spoken lines in the first person, even in Together. On a day you weren't on,
   the card said "give Florence and *me*…".
3. **Options was a settings page.** It had 11 groups and about 30 controls. The two choices you
   make most days (who, and how) sat beside print buttons and a version number.

It also had a real bug. Dates were recorded in UTC, so praying just after midnight in summer
time counted for the day before. That one is fixed, with no flag.

## What this pass changed

Each change is behind a Labs flag. Compare them at `/labs/`, or add `?labs=classic` to the
address to see the old version.

| Change | What it does |
|---|---|
| **Tap "Amen" to finish** | The reading view's *Amen.* is a button. Tapping it marks today as prayed, and the line under it says so. |
| **"Now abide" after Amen** | Once today is prayed, a quiet link continues to Abide with this week's word. |
| **"Pray it" uses the words on the page** | One card per paragraph of the prayer you just read, in the voice you chose. |
| **Calmer Options** | Day, voice and this week come first. Everything else is under *More settings*. |

**Cut:** nothing is deleted. Style, prayer picker, text size, focus, celebration, praying-as,
the log and printing all moved under *More settings*.

## What to do next (ranked)

1. **Week boundaries.** The rota week rolls over seven days after it was *created*, not on
   Monday. So the prayer can change mid-week while the pairs are counted from Monday. Roll
   over on Monday.
2. **"This morning" at night.** The prayer text says "this morning" at any hour. Use the
   clock: morning, today, or tonight.
3. **Split "New week — shuffle".** It does two things at once: next prayer, and reshuffle
   pairs. Separate them, or rename it to say both.
4. **Retire the Celebration setting.** Keep Balanced. The three-way setting needs a paragraph
   to explain itself, and KoiSchool is about 520 lines of code for a moment that "Amen ✓" plus
   one koi already makes.
5. **Six people are assumed.** `allPartitions` hard-codes six indices. This has to change before
   any other family can use Pray (see the pond review: *make it anyone's*).
6. **One "who's praying" across the app.** Abide asks "Who's here?". Pray hides "Praying as"
   in Options. Use one answer for both, remembered.

## A completely better app

Today the family has three doors (Pond, Pray, Abide), and the connective tissue is hidden in
`localStorage`. The better product is **one door: Today**.

> **Today · Sunday**
> We're carrying **Bella & Keziah** · This week's word is **See**
> **Pray** (2 min) → **Abide** (3 min) → and the pond shows it

- **Today is the home screen** on the fridge tablet. The pond is its living background, with the
  two names on the water.
- **One tap starts the practice.** Pray (read, Amen) flows into Abide (sow, breathe, gather),
  then back to the pond. There it is: the koi are fuller, and the vineyard has a new vine.
- **Everything else is a room you visit when you want it:** the puzzle, the vineyard, the
  board, Labs.

"Now abide" after Amen is the first, flagged step towards this. If the family uses that link,
build Today. If they don't, the three-surface design is fine as it is.
