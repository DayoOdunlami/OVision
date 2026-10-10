# Abide: a critical pass (October 2026)

A design and practice review of `/flourish/abide/`. It covers what was wrong, what this
pass changed, what to do next, the products worth learning from, and how to ask Claude
for this kind of work.

## Why it felt half-baked

The art is very good. The illustration, the one wind and the breath-paced growth are
better than most funded apps in this space. The "half-baked" feeling came from five
things.

1. **The seams were guessed, not measured.** The canvas and the CSS each assumed the
   verse needed about a quarter of the screen. Neither looked at the real text, and
   neither counted the tendrils and leaves that grow outside the letters, so the vine
   grew into the words. This is the overlap you spotted. Wherever two parts of the page
   meet, the same thing can happen: the moon sat behind the word, a phone's stalk ran
   through the answer box, and vineyard tags slid under the name pills.
2. **There were too many decisions before anything good happened.** The first screen
   showed navigation, six people, a title, a three-line instruction, a counter, a
   citation, a three-way Patience setting and Skip. A child can't read most of that,
   and the parent doesn't need half of it.
3. **The practice had no ending.** It closed with "Abide again" over a field. The whole
   point, carrying one word into the day, was never actually said.
4. **The payoff was the weakest screen.** A young vineyard was one small vine in a large,
   empty olive-brown field, with the rows squashed at the bottom.
5. **Most of the mechanics are invisible.** Patience levels, dropped seed, rich soil,
   ripening by learning the prayer in Pray, garlands and the watchtower are all clever.
   But a seven-year-old won't discover most of them, and each one adds code and states
   to maintain. This is where you are reaching diminishing returns.

## What this pass changed

- **Layout is measured.** The page measures the verse block. The scene measures
  everything the vine will draw (stems, tendrils, leaf tips, blossoms), shrinks the vine
  until it fits above the verse, and centres the two as one piece. It was checked with
  four words at desktop, tablet and 390 px, by day and at `?h=22`.
- **The phone's stalk hugs the left edge**, so it no longer crosses the verse or the
  answer box.
- **The sun or moon fades** while it would sit behind the word or the verse.
- **Prepare the ground**: the instruction is cut to one line. Patience moved behind a
  quiet "Patience · Balanced" link.
- **Sow**: one line of instruction. The native word dropdown is behind "Another word".
- **Questions** are now "I wonder…" prompts, as in Godly Play: there is no right answer.
  The answer box says "Write a line, or just be still", so silence counts.
- **A fixed closing line** after the gather: *Carry Abide with you today.*
- **Vineyard**: bare trellis rows now run back to the hills, so a young vineyard reads
  as room to grow rather than an empty field. Vine tags no longer slide under the name
  pills.

**Cut:**
- The Patience control from the first screen. It is a grown-up setting shown before any
  value.
- The breathing instruction on Sow. It already appears, in context, while you breathe.
- The always-visible word dropdown. A strong default beats a choice.

## What to do next (ranked, and deliberately aggressive)

1. **Breath prayer: put the words on the breath.** This is the biggest single upgrade.
   Split the verse across the breath: "Abide in me, *(in)* / and I in you *(out)*". The
   vine already grows with the breath, so let the words land with it too. It is the
   oldest Christian breath practice (the Jesus Prayer) and it suits children.
2. **Read it twice (Lectio).** Once the vine has grown, show the verse a second time with
   the word highlighted, then the question, then about 15 seconds of stillness before
   the Gather button appears. That is the "hold" the art-direction rules already ask for.
3. **Make clearing the ground shorter and earned.**
   - Sixteen things to clear is a chore in a three-minute practice. Cap it at five or six.
   - On a second visit the same day, skip it.
   - Keep the labelled stones (Selfishness, Doubt): that is a genuinely good idea. Make
     them the child's own instead: "What's in the way today?" with a few to tap.
4. **A threshold at the start.** Three slow breaths over the empty field before anything
   asks for work: "Be still." Pray-as-you-go opens with a bell, and this is the visual
   equivalent. Keep sound for later, as the art-direction skill says.
5. **Remove "Free write" from Abide's navigation.** It is a different product. Link to it
   from Options or from the Flourish page only.
6. **Make the vineyard the reward.**
   - Open on today's vine, close up, then pull back slowly to the whole family.
   - Say one human sentence, not statistics. For example, instead of "22 vines · 7 days
     together · a wall of 40 stones", say "Bella and Dad have abided together 7 times."
7. **Weeks, not streaks.** The weekly word is already the right unit. Show "this week's
   row", and never let anything wither. Finch and Forest show both sides of this: Finch
   is kind about missed days, and Forest kills your tree.
8. **Turns for a family.**
   - When two or three are here, pass the device for the "I wonder", one line each, in
     their koi colour.
   - Combined with Pray's rota, this works like a family Examen: one person shares, and
     another prays for them.
9. **Remaining craft debts.**
   - A phone on its side (390 px tall) can't fit the verse above the soil.
   - On the phone, the moon can sit on the "Prepare the ground" instruction.
   - On the phone, the stalk of a word that starts right at the edge ("Equipped") can
     brush the longest verse line.

## North stars

| Product | The one thing to take |
|---|---|
| **Lectio 365 / Lectio for Families** (24-7 Prayer) | The same order every day: Pause, Rejoice, Ask, Yield. Abide already follows it: who's here = Pause, sow = Reflect, I wonder = Ask, gather = Yield. Lectio for Families is your closest peer. |
| **Pray As You Go** (Jesuits in Britain) | A bell opens sacred time. It also has a Family Examen. |
| **Headspace × Sesame Street** | Three-minute sessions for children that start from a feeling they know. |
| **Calm "Breathe Bubble"** | One shape, one pace, and the user can set the speed. |
| **Finch** | Missing a day costs nothing, and the creature is glad you're back. |
| **Journey / Sky** (thatgamecompany) | No text, an emotional arc, and you give light to others. Gathering the vine into the family vineyard is your version of this. |
| **Monument Valley** | Every screen should work as a picture on the wall. Test on strangers with no hints. |
| **Godly Play** | Tell the story plainly, then "I wonder…". Trust the silence. |

## If you want others to use it, or to sell it

**Likely partners:**
- 24-7 Prayer, who are mission-driven and already make Lectio for Families.
- BRF Parenting for Faith.
- Church children's ministries, as a licence priced by church size like RightNow or
  Dwell. The weekly word is a ready-made unit for this: church sends it home on Sunday.

**What has to change first:**
- The family is hard-coded in `src/shared/family.js`. You would need setup, accounts and
  sync, because everything lives in one device's `localStorage`.
- The first four Pray prayers render NIV wording, which needs permission to distribute.
- You would need privacy terms for children's data.

Build a one-week pilot with two or three other families before building any of that.

## How to prompt Claude for this kind of work

You don't need special words. Say which of the following you mean.

- **"Critique, don't build"**: *"Act as a design lead. Walk Abide at 390 px and desktop,
  by day and at ?h=22, screenshot every step, and give me a ranked list. Don't change
  code yet."* You get a review you can veto before any code changes.
- **"Fix this, and prove it"**: *"Fix X. Show me before and after screenshots at phone
  and desktop, and test it with the longest and shortest word."* "Prove it" is the key
  word. It makes visual testing part of the job rather than an afterthought.
- **"Pick one from the list"**: *"Do #1 from docs/abide-review.md (breath prayer). Run
  abide-direction and product-review, and tell me what you cut."*
- **"Hold the line"**: *"Don't add anything. Remove one thing from each screen and tell
  me if it got worse."* Use this when it feels busy.
- **Name the person**: *"Walk it as Ezra, aged 6, alone"* or *"as Mum and Bella together
  at bedtime."* A concrete user changes the answers far more than adjectives do.
- **Name the feeling you're missing**: "half-baked", "busy", "cold", "childish". It's a
  useful signal. Add where you felt it ("on the vineyard screen") and Claude can find
  the cause.
- **Pond and Pray next**: *"Do the same critical pass on Pray, with the same north stars
  and method, and write it to docs/pray-review.md."*
