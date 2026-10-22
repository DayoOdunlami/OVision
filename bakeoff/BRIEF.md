> **Round 1, closed.** Kept as history. Round 2's brief is `bakeoff/round2/BRIEF.md`.

# Bake-off, round 1: make this the app a family would choose

You are one of three independent design and engineering studios given the same
brief, the same repository and the same starting commit. Each studio works alone.
At the end, the client (Dayo) clicks through every entry himself, with his children
as a panel, and picks the one that becomes the foundation for round 2.

Read `bakeoff/RULES.md` before you start. It covers branches, what you may and may not
touch, how to signal that you are done, and when you are allowed to look at the
other entries (not yet).

---

## 1. Who you are

You are a small, world-class product studio. Act like one. That means you bring the
whole bench to this job, not just a developer:

- **Product strategist.** What is this product for, for whom, and what should it stop doing?
- **Spiritual director.** Someone who knows the Christian disciplines from the inside:
  praying Scripture, Lectio Divina, the Ignatian Examen, breath prayer, confession,
  silence, Sabbath, learning by heart. You protect the practice from the product.
- **Children's game designer.** The children are real, repeat users. Play is not a
  bribe here; it is a way of learning by heart.
- **Behavioural designer, with a conscience.** You know exactly how the best and worst
  companies in the world build habits and pull people back. You use that knowledge for
  a good end and you refuse the dark patterns (streak shame, guilt, infinite feeds,
  manipulative notifications).
- **Art director.** Owns the look, the motion and the feel: illustration style,
  type, palette, how things move, how it feels at 06:45 in a dark bedroom.
- **Engineer and tester.** Ships working software and checks it in a real browser.

If your environment lets you run sub-agents or separate passes, use them for these
roles and let them disagree before you decide.

## 2. The client, and what the app is for

Dayo is a father of four. He built this app to help his family practise
their faith, and it has grown by experiment: each idea became another page. Some of
it is genuinely loved. Some of it never quite lands. He knows it sprawls.

**What it is for**, in order of priority:

1. **Dayo himself.** An adult who wants to practise the spiritual disciplines well,
   starting with praying Scripture for his family. He struggles with a wandering mind
   and wants help that respects the practice rather than gamifying it. The test is
   simple: would he choose to use it, and would he pay for it?
2. **His children**, of different ages. They return to it willingly, which is
   rare and worth protecting. They love the verse puzzle and often ask to play it after
   praying. They seem to enjoy the more physical, game-like parts (clearing stones in
   Abide) more than Dayo does.
3. **Other families, later.** Not now: no sign-in, no accounts, no sync in this round.
   But nothing you build should make that harder, and hard-coded assumptions about this
   one family (six people, these names) are a known problem.

**Purpose and direction.** Behind the daily practice sits a vision or identity board:
who this family is becoming this season or term. Dayo is not sure it needs to be looked
at every day, or how strongly it should connect to the daily practice. That is a
question for you to answer, not an assumption to preserve.

**Screens are not the enemy; purposeless screens are.** Dayo's view is that a screen used
for something edifying (praying, learning Scripture by heart, a game built on the verse)
can redeem screen time rather than add to it. At the same time, monks managed for
centuries with a page by the bed. If paper, a printout or a lock screen does part of the
job better than the app, say so and design for it.

## 3. What exists today (start here)

Live at https://o-vision.vercel.app (the `main` branch). Read `README.md`,
`CLAUDE.md`, `docs/STATUS.md` and the three reviews in `docs/` (`pond-review.md`,
`pray-review.md`, `abide-review.md`) before you form a view. They contain earlier
critiques, ranked "do next" lists and known bugs. Then **use the app** in a browser
before reading much code.

The parts, as the family experiences them:

| Part | Where | What it does | What we know |
|---|---|---|---|
| **The pond** | `/` | Animated koi under the family's identity board (four words: identity, season, commitments, friction). Koi behave differently near each word. Also a screensaver (`/?screen=1`). | The most distinctive thing in the project. Unclear whether it earns a daily look. |
| **Make a board** | `/make/` | Four questions make a board for anyone; shareable link. | Works; the household (people) is still hard-coded. |
| **Pray** | `/pray/` | The family prayer rota: a pair of people a day, Sunday all together, fourteen prayers built from Scripture, each in several voices. "Pray it" goes one thought at a time. Amen brings the koi. | The best-crafted surface. Defaults are odd and important choices (voice, first or second person, translation, how often the prayer changes) are hidden in settings. The prayer changing feels like a nice surprise to the children. |
| **The verse puzzle** | inside Pray | The verse falls apart; put it back in order. Three difficulty cuts. | The children love it and ask for it. A strong signal. |
| **Abide** | `/flourish/abide/` | About three minutes: who's here, clear the ground (heavy stones named Selfishness, Greed and so on, and thorns, as a picture of confession), sow the week's word, let it grow at the pace of breath, gather it into a family vineyard that grows over weeks. | Beautiful art. Lands with the children as a game; does not quite land for Dayo as confession. Many clever mechanics nobody discovers. |
| **Flourish** | `/flourish/` | A word written by a growing vine. | A quieter sibling of Abide. |
| **Murmuration** | `/murmuration/` | The board's words written by a flock of starlings at dusk. | An experiment, born of four failed attempts at birds. |
| **Today** | `/today/` | An optional front door: Pray, then Abide, then rest your eyes. | Hidden behind an admin switch. Nothing pulls you in today. |
| **Labs, Admin** | `/labs/`, `/admin/` | A/B switches and settings. | Tools for the builder, not the family. |

Everything is stored per device in `localStorage`. There is no backend. Opening the app
means opening a browser and finding the page, which is real friction.

The repo has two house skills in `.claude/skills/` (`abide-direction` for art and
motion, `product-review` for product decisions). They are the current studio's
standards. **You may adopt, adapt or overturn them, but say which and why.**

## 4. The brief

**Make this the app this family would choose every day, and the foundation of something
other families could one day love.**

You decide what that means. You can refine what is here, merge it, strip it right back,
rebuild it from scratch, turn pages into modes, or invent something nobody has asked
for. Keeping something exactly as it is, is a legitimate choice if you can defend it.
What you may not do is drift: every part you keep, cut or add needs a reason that serves
the people above.

### The moments every entry must serve

Rather than a list of pages, here are the moments in this family's week. Your entry must
show how it serves each one, with a link that drops the judge straight into it. "We
deliberately cut this, and here's why" is an acceptable answer for any moment except 1
and 2.

1. **06:45, Dad, phone, bedside, five minutes.** Pray Scripture for his family without
   his mind wandering off.
2. **After dinner, the children, the kitchen tablet.** Pray for each other, then play
   with this week's verse until they know it by heart.
3. **Sunday, the whole household together**, one screen.
4. **A glance in passing.** The tablet on the side is idle. What does it show, and does
   it remind the family who they are becoming this season?
5. **Clearing the ground.** Confession and letting go, today handled by the stones and
   thorns. Make it land for an adult, and keep what works for a child.
6. **Looking back.** A few weeks in: what has taken root? (Today: the vineyard, the
   koi's "Full" swell, the wall.)
7. **Start of a new term or season.** Setting or reviewing the board.
8. **First run on a fresh device**, or another family opening it for the first time.

### Requirements

- **One way in.** Whatever you build, a person must never have to know a URL or hunt
  for a page. Make it installable to a phone or tablet home screen (a web app manifest,
  icons, sensible offline behaviour).
- **Demo data.** Every preview runs on a new browser with empty storage. Add
  `?demo=1` (or an obvious first-run choice) that fills in a believable family and a
  few weeks of history, so the judge can click through every moment in minutes.
- **Phone and tablet.** Every moment must work at 390 px wide (phone, portrait) and on a
  tablet in landscape (1180 × 820). Check both by day and at night (`?h=22` works on
  the existing surfaces; keep an equivalent).
- **Children.** Readable and usable by a child who can't read well yet. No scores
  against each other, no streak shame.
- **Scripture text.** Keep the existing renderings, or use public-domain translations
  (World English Bible, King James). Don't paste in text from copyrighted translations.
- **Static site.** It must still build with `npm run build` and deploy on Vercel as a
  static site. Any open-source package is fine. No backend, no accounts, no paid
  services, no API keys.

### Not this round (write it down, don't build it)

Cross-device sync, sign-in, accounts, payments, other families' households beyond
making them possible, and new disciplines as modules (fasting, Sabbath, the Examen and
so on). You may show in your pitch how your foundation would take them.

## 5. How a world-class studio would run this

Work in these phases, and commit as you go so the order is visible in history.

1. **Discover.** Read the docs and the code; use every surface in a browser at both
   sizes. Write down what is genuinely good and must be protected, and what is broken.
2. **Research.** Look outward before you design. Suggested starting points, not limits:
   - **The practices:** Lectio Divina, the Ignatian Examen, breath prayer, praying
     Scripture, and John Mark Comer's *Practicing the Way*.
   - **Children and faith:** Godly Play's "I wonder" questions.
   - **Apps that do prayer well:** Lectio 365, Pray as you go, Hallow.
   - **Habit and play done well:** Duolingo, Headspace.
   - **Calm, crafted games:** Alto's Odyssey, Monument Valley, Sky.
   - **The humane design critique of attention-harvesting products.**

   Note what you take from each and what you reject.
3. **Directions.** Develop **two or three genuinely different directions**: different
   structure, different look, different idea of what the product is. Not three
   colourways of one idea.
4. **Decide.** Pick one, and say why the others lost.
5. **Write the design direction** (`DESIGN-DIRECTION.md`, below) **before you write
   product code.** Commit it first.
6. **Build.** Working software, not mockups. Wire the moments through properly; you may
   leave secondary settings and edge cases unwired if you list them as gaps.
7. **Test.** In a real browser (Playwright is available) at both sizes, by day and at
   night. Walk it as: a child who can't read well, Dayo at 06:45 half awake, and a
   stranger on first run. Fix what you find.
8. **Self-critique and cut.** Run `product-review` (or your own equivalent) on your own
   work, act on it, and record what you cut.
9. **Ship** and signal done (see `RULES.md`).

### Don't build the average

Left alone, every studio converges on the same safe app: a stock component library,
default system or Inter type, rounded cards on grey, a purple gradient, generic icons.
**If your entry could be any wellness app, it has failed.** Decide the look on purpose:

- **Illustration:** painterly, hand-made, vector or photographic.
- **Type:** chosen for reading prayer, at a size that suits the moment.
- **Palette:** tied to time of day and season.
- **Motion:** with an attention budget.
- **Sound:** whether there is any.
- **Feel:** how a tap should feel.

In your design direction, list the defaults you deliberately rejected and what you
chose instead.

## 6. What to hand in

All in your own branch, under `bakeoff/entries/<your letter>/`:

| File | What it is |
|---|---|
| `DESIGN-DIRECTION.md` | Research takeaways; the two or three directions you explored and why one won; the visual system (type, palette, illustration, motion, sound) with the defaults you rejected; which house skills you kept, adapted or overturned. |
| `PITCH.md` | **One page** for the client. What the product is now, in a sentence. Who it serves and how. What you kept, merged, cut and added, and why. Why a family would choose it every day. How it grows into the backlog. |
| `DIGEST.md` | The full account, written for an expert reviewer. Your process and the key decisions with their trade-offs; the moments table (moment, how it's served, deep link); what you tested and how; known gaps and bugs, honestly; anything you would do with another day. |
| `screens/` | Screenshots of every moment at phone and tablet size. |
| `DONE.md` | Written last. Your preview URL, the demo link, and the three links you most want the judge to open first. |

## 7. How it will be judged

The client scores entries blind (as A, B and C) using `bakeoff/SCORING.md`. Read it.
The product is judged by clicking through it; the documents are there to explain your
thinking, not to replace a working product. A smaller entry that is coherent and
beautiful beats a sprawling one that does everything a bit.
