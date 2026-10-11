# Murmuration: product brief

A counterpart to the koi pond. Same board, different way of seeing it. Where the pond keeps the
words still and lets the koi move around them, the murmuration has no words at first: only a
thousand starlings over a reed bed at dusk. **Every so often the flock gathers and writes one of
the board's words in the sky, holds it for a breath, and lets it go.**

It's a page of its own (`/murmuration/`), and a screensaver. Someone might live with the pond for
a month, then the murmuration for a month: two ways of carrying the same words.

## What it should feel like

- **Patience, rewarded.** Nothing is asked of you. If you keep watching, the flock gives you a
  word, then another. The first comes soon (about ten seconds) so a first-time viewer gets it.
  After that the gaps lengthen and vary, so the next one is always slightly unexpected.
- **Readable, but only just made.** The word is unmistakable at its peak, but it's clearly made
  of birds: edges shimmer, a few stragglers circle. It is never a font with birds sprinkled on.
- **The longer it holds, the sharper it gets.** During the hold the birds' jitter settles, so the
  word comes into focus as you look at it. Attention is rewarded within each word, not just
  across them.
- **Written, then breathed away.** The flock writes the word left to right, the way a hand would.
  It lets go the same way, peeling off as if a breath of wind carried it.

## The rhythm (one cycle)

| Beat | Length | What happens |
|---|---|---|
| Free | first 9s, then 22–45s (Patient) or 12–22s (Generous) | The flock pours and folds over the reeds. |
| Gather | about 6s | Birds peel off and stream in, left to right. The word appears letter by letter. |
| Hold | 5s + 0.3s per letter | The word holds, sharpening. A faint warm light catches it (gold = meaning). The verse may appear beneath it. The rest of the flock circles. |
| Release | about 3s | Left to right, birds lift out of the word and rejoin the flock. |

**Almost-words.** About one gathering in four only half forms, a hint of a word, then
dissolves. It keeps the watching alive: you're never sure if this is the one. This can be
switched off.

## Words

- The words come from the viewer's board (the same board as the pond, or a shared `?board=`
  link).
- They're picked by weight: the identity word most often (it is "home"), then the season word,
  the friction word, the three values, and occasionally a commitment's verb.
- No word appears twice in a row.
- **The verse beneath:** after the identity word comes the anchor verse; after the season word,
  its sentence; after the friction word, its prayer. It appears in serif italic and fades with
  the release. While it shows, the flock is nearly still.

## Touch

- **Brush the sky:** the flock scatters from your finger, like a hawk passing. An option turns
  this round, so they gather to you instead.
- **Press and hold:** calls the next word now. Agency for the impatient, and a delight for
  children.

## Look

- **Light follows the clock:**
  - Dawn: rose and gold.
  - Day: pale overcast, like most murmuration photographs.
  - Dusk: deep blue to rose to gold, the classic.
  - Night: indigo, with the birds silvered as if by the moon.
- **A reed bed and a far tree line along the bottom.** It gives scale and a place for them to
  come home to.
- **Birds are dark silhouettes, slim with swept wings like starlings.** They're dense enough
  that a word reads, small enough to read as a flock. Distant birds fade into the sky.

## Options (a small panel; a strong default for each)

| Option | Default | Note |
|---|---|---|
| Words | The board's words | or just the one word, or none (pure murmuration) |
| Writing | Written in (left to right) | or all at once |
| Almost-words | On | |
| Pace | Patient | or Generous |
| Touch | Scatter | or Gather |
| Verse beneath | On | |
| Sunlit word | On | the word catches the last light |
| Breathe | Off | **bold:** the word swells and settles at the pace of breath (4s in, 6s out), as in Abide |
| Ink | Off | **bold:** each bird leaves a fading trail, so the flock draws itself like calligraphy and the word looks brushed |
| Follow the clock | On | otherwise always dusk |
| Full screen | — | screensaver: fills the screen and keeps it awake; controls fade when you're not touching |

## Legibility (learned on a real phone)

Spreading birds evenly across thick letters made long words dust on a phone. What makes a word
read:
- **Lettering:** medium-weight (600) upright letters with air between them.
- **More of the flock in the word:** 92% of the birds take part.
- **Bigger birds in the word:** they grow about 60% as they arrive, so they overlap like ink.
  The free flock stays fine.
- **A tight hold:** jitter settles almost to nothing.
- **Fewer long words on phones:** words over 8 letters come up a quarter as often.
- **Faint letters** (an option, on by default): a bare whisper of the word in the sky under
  the birds (about 5% strength), there only once they've arrived.
- **The sunlit gold** is strong only against a dark sky.

More birds was *not* the answer: the flocking cost grows with the square of the count.

## Technical

- **Flocking:** three.js's `webgl_gpgpu_birds` (MIT), on the graphics chip, about 1,000 birds on
  a phone and 1,600 on a larger screen. Extended with per-bird targets (where its slot in the
  word is), arrival delays (for writing left to right), a global pull, a shimmer amount, and a
  staggered release.
- **The word:** drawn off screen in the board's display face (Fraunces, heavy italic) and
  sampled into target points. Part come from the letters' outlines for crisp edges, the rest
  from inside.
- **Assignment:** each bird goes to the nearest-in-order slot (both sorted left to right), so
  the flock streams in rather than crisscrossing.
- **The sky:** painted on a plain 2D canvas behind the WebGL birds, redrawn only on resize or
  a change of hour.
- **The reeds:** their own canvas, stirring in one slow breeze that travels left to right
  (a few pixels, well under 0.5 Hz), drawn at 30fps. Still under reduced motion.
- **Budgets:** under 16ms a frame on a mid phone; pixel density capped at 1.75.
  `prefers-reduced-motion` slows everything by half and turns off Ink.

## Done means

1. The first word forms within about 10 seconds and is readable on a phone (390px) and a
   desktop.
2. Words come from the viewer's board, never twice in a row.
3. Options persist per device and each visibly changes the experience.
4. It works by day and at `?h=22` (night), on a phone and full screen on desktop.
5. No console errors; it runs smoothly on a recent phone.
