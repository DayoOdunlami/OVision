# Design direction: entry A

Written before product code.

## What we found (discover)

Protected:

- **The memory puzzle.** It is the thing the children ask to repeat. The default cut leaves most of the verse standing and lets the loose words fall. No score.
- **One weekly passage, prayed by name.** The household already understands a pair a day and everyone on Sunday. The change of passage is a small surprise the children like.
- **Prayer as still type.** Large serif type, one thought, then a tap. Koi behind the words would undo the reason the prayer page exists.
- **The pond's idea, not its chrome.** A living creature in water, fed by hand, is the glance. Four labelled zones, settings, and a "running lean" gauge are not.
- **Hand-made warmth.** Paper, water, weight. Not a component library.

Broken, and not carried forward:

- One "prayed today" flag, so a morning Amen finishes the day before the children arrive.
- The verse the children learn has names and a shifting register inside it. The NIV lines and the paraphrase are not the same words.
- The week turns seven days after the rota was created, not on Monday. Sunday does not close the week. Copy says "this morning" at night.
- Confession is a physics toy. The adult can clear it without reflecting. The names on the stones (greed, selfishness) do the work a question should do.
- Six hard-coded people, a personal board on the family screen, and a front door made of URLs.
- Options, labs, celebration settings, murmuration, and a second vine product. None of them is the daily choice.

## Research

| Source | What we take | What we reject |
|---|---|---|
| Lectio Divina | One passage, read until it is the only thing on the page, then a response. | A commentary stack under the reading. |
| Praying Scripture | Names belong in the prayer around a stable verse. | Rewriting the verse each day so there is nothing solid to learn. |
| The Jesus Prayer / breath prayer | One line, silence, no timer. The morning is silent. | A breathing game during the verse. |
| Ignatian Examen | One honest look: what got in the way. Then stop. | A dashboard of the day. Scoring the conscience. |
| Comer, *Practicing the Way* | A rule of life is a few words you actually live, reviewed when the season changes, not a feed. | Turning the rule into tasks with completion percentages. |
| Godly Play | "I wonder", and a real object a child can move. Silence is an answer. | Quizzing. Clever mechanics nobody is told. |
| Lectio 365 / Lectio for Families | The same shape every day, short enough to finish. | A ten-minute script and a content library. |
| Pray as you Go | A threshold, then one passage, then stop. | Music and a synthetic voice. Sound is out this round. |
| Hallow | Craft and an ending. | Streaks, guilt, a catalogue. |
| Duolingo | Retrieval: the words leave and the child puts them back. | XP, leagues, hearts, "you missed yesterday". |
| Headspace | One session. The screen after the session is quiet. | Courses, minutes-meditated trophies. |
| Alto's Odyssey, Monument Valley, Sky | The place is calm, the picture is the interface, you leave when the moment is over. | Endless play after the prayer. |
| Humane technology | The app should finish. No pull back. | Notifications, infinite home, shame for a gap. |

## Directions explored

### Direction 1: The pond is the house

The water is the home screen. Today's pair swim under the season word. Tap a fish to pray on top of the pond. The puzzle is a second tap. Confession is stones dropped into the water.

It lost. The prayer was built as still paper because moving creatures steal a wandering mind. It also makes the children's favourite thing (the puzzle) a side room of a screensaver. Beautiful, and the wrong door at 06:45.

### Direction 2: An illuminated week-book

Seven days as a bound sheet. The verse on the left, the prayer on the right. Monday turns the page. Looking back is the endpaper. No creatures, no physics, no field.

It lost. It is the right theology and the wrong hand. The children come for falling words and for feeding. A book alone throws away the two gestures they already love, and an adult confession that is only more type repeats the current failure.

### Direction 3: The table

One verse for the household all week, in one NIV wording. Two sittings of that same prayer: silent, alone, in the morning; aloud, together, after dinner. Sunday, everyone, closes the week. Monday morning the verse changes, once, as a surprise. The words of the verse fall and are put back. The adult sets one thing down in words. A child may set one stone down, kindly named. When the tablet is idle it shows still water, the season's word, and fish that can be fed. Personal intentions are one word each, feeding that family word, not a second pond.

## The decision

Direction 3 won.

The product is a table, not a campus. Dad's test is five silent minutes with one passage and the names of his family, and a mind that is not offered a single moving thing. The children's test is the same words, then the fall they already love. The household's test is that those two sittings cannot cancel each other.

Direction 1 lost because it puts the living glance in the only place that must be still. Direction 2 lost because it keeps the stillness and drops the play. The table keeps each in its own room: paper for the prayer, weight for the words, water only when nobody is praying.

## The visual and interaction system

- **Illustration:** Hand-made and few. Prayer is paper, not a scene. Puzzle pieces are paper slips with weight. A child's "putting down" is one river stone, not a field of rubble. The glance is water and a handful of koi, drawn as simple living bodies (spine, tail, spots), not icons and not the old four-zone board. No stock illustration, no 3D, no murmuration.
- **Type:** Cormorant Garamond italic for the verse, so the words being learned look different from everything around them. Literata for the prayer. Source Sans 3 for names, buttons, and quiet labels. Large sizes. The verse is never smaller than the chrome.
- **Palette (day, night, season):** Day paper `#efe6d6` to `#f7f1e4`, ink `#241f1a`, names and meaning in clay `#8c4a2f`. Night is the same sheet with the lamp down: `#161c28` and `#f3eadc`, clay lightened to `#e0b07a`. The glance water changes with the clock and the season word (autumn olive, winter blue, spring green, summer teal). Night water is deep blue. Gold `#c9a15b` is only the live gap in the puzzle and a learned verse. It is not decoration.
- **Motion, and its attention budget:** Prayer: no ambient motion. One card replaces another. Puzzle: the loose words fall and settle; a right word snaps home; a wrong word returns. Glance: the fish move, slowly, and the water does not. At most those fish, plus food when a hand asks for it. Nothing moves while a verse card is up. Reduced motion: no fall, no swim, the words still place. Holds after Amen and after the verse is restored. No confetti, no ripple carnival, no koi on the Amen card.
- **Sound:** None. The morning is silent on purpose. Later, a single bell at the threshold, and a human voice reading the verse for a pre-reader. Not a soundtrack, and not a synthetic voice.
- **Touch and feel:** The whole card is the way on. Buttons are at least 48px, ink on paper, pill-shaped only where a finger needs a target. Puzzle pieces can be dragged or tapped into the glowing gap. Fish come to a held finger and to food. The app ends. "Amen" does not open a feed.

## Defaults we rejected

| The default | What we chose instead | Why |
|---|---|---|
| Inter, or the system UI stack, on grey cards | Cormorant, Literata, Source Sans, on one paper sheet | The prayer has to feel read, not operated. |
| A purple or teal gradient wellness shell | Clay, ink, paper, and water kept in its own room | Colour follows the material of the moment. |
| One home full of rooms (Pray, Abide, Pond, Labs) | One table. Glance, weeks, and season are quiet ways out | A person should not have to know a URL. |
| A single "day prayed" check | A sitting recorded per person | Morning must not finish the day for the children. |
| Names inside the memorised line, and a kids paraphrase as a second verse | One NIV verse all week. Names only in the original prayer around it | They are learning the verse, not the rota. |
| NIV prose for some prayers and a paraphrase for others | NIV only for the verse. The prayer around it is original | The church's wording stays stable. The licence stays inside Biblica's general-use limits. |
| Sunday as day seven of a rolling timer | The week turns on Monday. Sunday closes it | That is the household's week. |
| Stones named greed and selfishness, cleared by physics | An adult question ("what got in the way") and, with children, one kindly named stone | The adult moment has to be reflection. The child keeps a physical act without shame-words. |
| Streaks, "running lean", a consistency swell | Gaps are just unmarked days | Shame is not a practice. |
| Koi, gold sweeps, and celebration settings at Amen | Stillness, then stop. Fish only on the glance | The Amen is the end of the prayer, not a show. |
| Sound, read-aloud, a breathing bubble | Silence | Asked for, and right for a dark bedroom. |
| A board per person with four zones | One family word on the water. Each person may add one word underneath | Personal boards feed the family board. They do not compete with it. |
| The vineyard, the watchtower, patience levels | A margin of the weeks: the verse, who sat with it, what was set down | Looking back should be readable in a minute. The clever half was never found. |

## House skills

`product-review` is kept. It is why the home has one main action, why a morning Amen does not say "done", why there is no score, and why labs, celebration, and the stone-field are cut.

`abide-direction` is adapted, not thrown out. The glance keeps its rules: one place, hand-drawn bodies, light from the clock and the season, gold only for meaning, little moving, reduced motion still usable, no sparkle. It is overturned on the prayer itself. The skill wants one continuous illustrated world and a shared wind. A wandering mind at 06:45 needs the opposite: paper, no wind, no creatures, no camera move. The water is a room you go to when the prayer is over, not the floor under the verse.
