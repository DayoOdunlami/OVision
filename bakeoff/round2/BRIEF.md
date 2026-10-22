# Bake-off, round 2: the living purpose board, in more than one world

You are one of the studios given this brief, this repository and this starting branch.
Each studio works alone. The client judges working prototypes blind, then the winning
approach becomes the basis for the full app improvement.

Before anything else, read these, in this order:
1. `bakeoff/round2/FEEDBACK.md`: what round 1 taught us. It is part of this brief.
2. `bakeoff/round2/RULES.md`: branches, sealing, and how to finish.
3. `README.md` and `CLAUDE.md`: Quiet Waters, the app you are building on.
4. `bakeoff/QA.md`: round 1's answers about this family. They still apply.

Then use the app before you read much code.

## 1. Who you are

Treat this as you would at a world-class product and design studio. Bring the whole bench:
- product strategist
- spiritual director
- children's game designer
- ethical behavioural designer
- art director and motion designer
- engineer and tester

If you can run separate passes or sub-agents, use them for these roles and let them
disagree before you decide.

## 2. The question

Round 1 produced a good daily practice: pray, play with the verse, confess. What it lost
is the **purpose board**: the family's sense of who they are becoming.

Today it is a season page you fill in each term and rarely look at again. The client
wants a **compass, not a record**: something the family leaves on the side and glances at
every day, which helps each of them know what to say yes to and what to say no to.

Round 2 has one job: **show what that board should be, and show it living in more than
one world.** Win the argument with a working prototype, built into Quiet Waters.

## 3. What the board must do

These come from the client. How you meet them is yours.

1. **Glanced daily, changed termly.** It earns a look every day without asking for input.
   Setting or reviewing it is a termly ritual.
2. **It helps decisions.** It turns "who we're becoming" into something you can act on
   today: what to say yes and no to. Never a score, a streak or a nag.
3. **It is alive.** Each part of the board does something in the world that reinforces
   its meaning. The original pond did this:
   - koi swelled near the season word *Full*;
   - koi took the colour of the friction word *marrow* as they passed through it;
   - koi rocked the lily pads that carried the four commitments;
   - particles traced the identity word *Flourish*.

   Words in a world, not a picture above a list. "A lovely hero image followed by a
   form" is the failure we are fixing.
4. **Personal and family.**
   - Each person, children included, can have their own board.
   - Personal boards connect and feed the family's board.
   - The family board can also be made directly.
   - Setting it is something the family does together; Quiet Waters' "pass the tablet" is
     the bar to beat.
5. **The structure is open.** The original board had four parts: identity, season,
   commitments and friction (practices such as silence, fasting and confession). Keep,
   change or replace that structure, with reasons.
6. **Light links to the practice, if they help.** For example, this week's verse, who's
   being prayed for, or what the season has grown. Your call.

## 4. More than one world

The client misses the other worlds this app once had:
- the koi pond;
- the vine that writes a word as it grows;
- the starlings that write words in the sky.

He wonders whether the answer is choosing your world: the same practice and the same
board, in a pond, a garden or a sky.

- **Build two worlds at least.** The first is **the pond**. Improve it, don't replace it,
  and keep the living koi (`src/app/pond/SpineFish.js`). The second is **a nature world
  of your own invention**.
  - A vine is allowed but **not assumed**. If there's a better way to embody growth and
    nature, show it.
  - A third world (a sky, say) is welcome but optional.
- **Same meanings, different strengths.** Each world must express the same things, but
  through what that world does best. Branches swapped in for fish is the failure to
  avoid. **Write down the meanings every world must express** (your own version of a
  world contract) and build both worlds to it. A starting list, which you may revise:
  - the family's word, and who we are becoming;
  - each person's part in it;
  - this week's verse;
  - who is present, and who is being prayed for;
  - what has grown over the season;
  - calm when praying, life when glancing.
- **Switching.** Decide who chooses the world and when:
  - per device, per person, or by moment (a still world for the 06:45 prayer and a
    lively one for the children, say);
  - how the switch is reached;
  - and that it carries through every room that shows a world.
- **The prayer stays paper.** The sitting itself shows no world. At most it takes the
  world's palette.

### Motion, metaphor and behaviour

This is where round 2 will be won or lost. Treat it as seriously as the board itself.

**1. Motion serves meaning, never itself.**
- Every movement should carry a metaphor the family would recognise from the life of
  faith, for example:
  - growth
  - abiding and rest
  - connection and belonging
  - light
  - fruit
  - gathering
  - letting go
  - being known
  - returning
- A movement that only decorates is a candidate to cut.
- Calm is the default: the attention budget in the house art direction skill still
  applies.

**2. A bank of behaviours, not a metaphor per word.**
- Families will write words nobody can anticipate ("Brave", "Steady", "Hospitality",
  "Sabbath"), so don't hand-craft a behaviour for each word.
- For each world, design a **bank of behaviours**, each tied to a theme. For example:
  - **Koi:** gather, rest, swell, circle, pair, follow, glow, rise.
  - **A garden:** sprout, lean to the light, bud, bloom, ripen, intertwine, seed,
    weather a storm.
- Decide how a word gets its behaviours:
  - a small lexicon of themes;
  - the person choosing what their word means to them;
  - a gentle default;
  - or a mix.
- Add enough variation that the board never feels like a loop.
- Any word must work and look intended. Document the bank and the mapping rule in
  `DIGEST.md`.

**3. Upgrade or downgrade, honestly.** The old vine that grows and writes a word
(`src/flourish/lib/` on `main`) is a real asset. Three choices are equally welcome:
- use it;
- improve it;
- replace it with a mechanic of your own.

The same goes for the koi, the starlings and Tend's garden art. But whatever you replace
must be **better**, and you must show it: put the existing version and yours side by side
in `screens/`, and say in one line why yours is an upgrade. Round 1's flat cut-out fish
were a downgrade the client noticed at once.

**4. Research before you invent.** Don't assume you have to write lifelike motion from
nothing. Search for the best existing work and learn from it, or adapt it:
- open-source generative art and creative coding;
- organic growth algorithms (for example L-systems, space colonisation,
  differential growth);
- flocking and schooling;
- water, wind and light;
- illustrators and games that do living worlds beautifully.

Prefer adapting proven, openly licensed code to inventing your own, and record every
source and licence in `DIGEST.md`. References inform; never copy a specific artwork,
character or brand.

**5. You may rethink the look.**
- If you find something more compelling, you may replace Tend's garden, improve the koi
  animation, or change the illustration style altogether: more realistic, more organic,
  more painterly.
- Whatever you choose must be consistent across every room that shows a world, and
  sustainable in code.
- The client is genuinely curious about a more realistic, organic take, so show it if
  you can make it beautiful.

**The bar:** delight and elegance. Ask whether someone would stop and watch it for a
moment, and whether it means something when they do.

### Proven code you may reuse

Lifelike motion has been the hardest thing in this project. You may lift code, with
credit in your digest, from:
- **The koi:** `src/app/pond/` on this branch.
- **The vine and its word writer:** `src/flourish/lib/vine.js`, `allure.js` and `draw.js`
  on `main`.
- **Abide's field, wind, seasons and vineyard:** `src/flourish/abide/` on `main`.
- **The starlings:** `src/murmuration/flock.js` and `sky.js` on `main`.
- **Tend's garden illustration and type:** on `bakeoff/r1-b`.
- **Anything in Table:** on `bakeoff/r1-a`.

Get files from other branches with `git show origin/<branch>:<path>`.

## 5. Scope

**In:**
- The purpose board: family and personal; the termly ritual of setting and reviewing it;
  and the daily glance.
- How the board appears on the home screen and as the idle screen.
- The world contract, the switch, and the two worlds, with the board living in each.
- Enough of one other room (for example the home screen, or after Amen) shown in both
  worlds to prove the switch carries through.
- On the screens you touch, the round 1 craft fixes:
  - no fish over words;
  - no visible scroll bars breaking the calm;
  - tap targets at least 48 × 48 px.

**Out (this is round 3):**
- Changing the prayer, the puzzle or confession.
- The rest of the round 1 fix list.
- Sync, accounts and sound.

If you believe something out of scope must change for the board to work, say so in your
pitch rather than building it.

## 6. Before code

- **Style tiles.** Render the family board in each world, at 390 px and at tablet
  landscape (1180 × 820). Commit them to `bakeoff/round2/entries/<LETTER>/tiles/`.
- **A short design direction**, in `PITCH.md` or its own file. Cover:
  - what the board is now, and why;
  - your world contract;
  - what each world does with its strengths;
  - what you rejected.

Then build.

## 7. What to hand in

In your own branch, under `bakeoff/round2/entries/<LETTER>/`:

| File | What it is |
|---|---|
| `PITCH.md` | **One page** for the client. What the board is, in a sentence. How a family uses it daily and termly. The worlds, and why each is good at what it does. What you kept, cut and borrowed. |
| `DIGEST.md` | For an expert reviewer. The world contract; key decisions and trade-offs; code you reused and from where; how you tested; known gaps. |
| `tiles/` | The style tiles, committed before product code. |
| `screens/` | The board in each world, family and personal, at phone and tablet, by day and at night. Also the ritual of setting it, the glance, and the switch. |
| `DONE.md` | Written last. Preview URL if you can find it, then the demo links to open first: <ul><li>the family board in world 1</li><li>the family board in world 2</li><li>a person's board</li><li>the glance left idle</li><li>setting a new season together</li><li>the switch</li></ul> |

`?demo=1` must fill in an invented family whose boards are already set, so the judge sees
the board alive at once. Every link must work on a fresh browser.

**Quality bar:**
- `npm run build` passes.
- Checked in a real browser at both sizes, by day and at night.
- Smooth on an ordinary Android tablet. Heavy work loads only when needed.

## 8. How it will be judged

The client and his children, by using it, blind. See `bakeoff/round2/SCORING.md`. The
documents explain your thinking; they don't replace a working product.

**A smaller board that the client would genuinely leave on the side beats a sprawling one
that does everything.**
