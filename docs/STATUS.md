# Where we are (11 October 2026)

## Built and live on `main`

Everything below can be switched back to Classic at **/labs/**, apart from the bug fixes.

**Abide**
- The vine never grows into the words.
- Breath prayer: "Abide in me" on the in-breath, "and I in you" on the out-breath.
- The verse is read twice, then about 15 seconds of stillness.
- The field to clear scales with the group: 5 things per person, and it's skipped if they've
  already cleared it today.
- "I wonder…" questions.
- A closing line: "Carry *Abide* with you today".
- One human sentence in the vineyard.
- No Free write in its menu.

**Pray**
- "Amen." is a button, so reading off the page counts as praying.
- "Now abide →" appears after Amen.
- "Pray it" uses the same words as the page.
- Calmer Options.
- Bug fix: dates now use the local day, not UTC.

**Pond**
- `/make/`: make a board for anyone, with a live preview. Send it as a link, and the person who
  opens it can keep it.
- A second world, Birds at dusk (Pond settings → World). The commitments become clouds.
- Commitment pads use any verbs.
- The lily-pad slit no longer cuts through the text.

**Labs:** `/labs/` has a New/Classic switch and a side-by-side view for every change.

## Suggestions only (not built)

- **"Today":** one daily door linking Pray, then Abide, then the pond.
  - Pray week bugs: the week rolls over 7 days after creation instead of on Monday, the text
    says "this morning" at night, and "New week — shuffle" does two things at once.
- **A household step** so another family can use Pray and Abide (names and creatures are still
  hard-coded).
- **Sync** across devices, more worlds, and a first-run screen for new people.

## Agreed direction (from your notes)

1. **Every surface stands alone, and they can also be joined.**
   - Pond, Pray and Abide each work on their own, at their own address.
   - "Today" is an optional mode that strings them together. It doesn't replace them.
2. **The pond is a long-term board** for a term, a year or a season, not a daily one.
   - Pray only adds a quiet touch to it: names on the water, and the season word's swell.
   - That touch is off by default on boards made at `/make/`.
3. **Screensaver mode for the pond:**
   - `?screen=1`: full screen with no buttons, the screen kept awake, and slower creatures.
   - "Make a wallpaper": exports the board as a PNG sized for a phone lock screen or desktop.
   - On a Mac it can also run as a real screensaver through an open-source web screensaver
     (WebViewScreenSaver).

## Birds and sky: the plan

**Today's birds look like paper cut-outs.** The wings just stretch, the body never banks, and
the clouds are smudges.

**Adapt proven open-source code, MIT licence only:**
- **Flocking:** the plain-JavaScript `Boid` class from Vanta.js BIRDS (MIT), the mobile version
  of three.js's `webgl_gpgpu_birds` (MIT).
  - Birds keep apart from close neighbours, match direction with nearby ones, and draw
    together at a distance. A finger scatters them.
- **Wings:** three.js's flap rule. The wingtips rise and fall with a sine wave, and the flap
  gets faster as the bird speeds up.
  - We add a wrist bend, banking into turns, glides with wings held, bursts of flapping on a
    climb, and circling on a thermal when idle.
- **Clouds:** painted cloud layers that part around a bird and slowly close behind it. Birds fly
  between the layers, so they look like they pass through.
  - No new libraries, kind to battery.
  - Fits a painterly anime/Ghibli dusk, which matches the koi's flat illustrated style better
    than Pixar-style 3D clouds.
- **Later, on capable devices only:** mist the birds stir as they fly through, from Pavel
  Dobryakov's WebGL fluid simulation (MIT).
- **Bible birds as varieties** (verse wording to be checked against the app's translation):
  - dove (Matthew 3:16)
  - sparrow (Matthew 10:29–31)
  - eagle (Isaiah 40:31)
  - raven (1 Kings 17:6, Luke 12:24)
  - swallow (Psalm 84:3)
  - stork (Jeremiah 8:7)
  - hen (Matthew 23:37), which suits a "gathering" state

**Avoid:**
- BirdFlight and most CodePen boids, which have no licence.
- Shadertoy shaders, which default to non-commercial use only.
- drei's cloud texture, which has no licence.
- Moving to three.js for now: about 150KB more to download, and the GPU running on an
  always-on tablet.

**Estimated effort:** birds 1–2 days, clouds 1–2 days, mist 1–2 days (optional).
