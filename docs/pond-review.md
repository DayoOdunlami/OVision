# The pond: a critical pass (October 2026)

## Verdict

The pond is the most distinctive thing in the project. The words live *in* the water: koi
swell near the season word, take the friction word's colour, and rock the lily pads as they
pass. That is genuinely new, and the rest of the app should protect it.

Its weakness was that it belonged to one person in one world. Board text, verbs, practices
and family names were hard-coded. The commitments only worked if your four verbs were
Pray / Train / Show / Cook. There was also a rookie overlap: the lily pad's slit ran through
the middle of the commitment text.

## What this pass changed

- **Make a board, for anyone (`/make/`).** You answer four short questions in plain words
  (identity, season, commitments, friction) and choose a world. The real pond sits beside the
  form as a live preview. The board saves to this device and appears in the board picker
  (*Make a board* / *Edit this board*). There's an example button for someone starting cold.
- **Share it as a link.** "Copy a link to send" puts the whole board in the address. Whoever
  opens it sees the board straight away, with *Keep it on this device* or *Just looking*. There
  is no server and no account, and nothing is uploaded.
- **A second world: birds at dusk.**
  - The same board, the same meaning, a different place: a deep dusk sky, slow clouds and a few
    stars.
  - Each koi variety becomes a bird of matching colour, so each person's koi is now their bird:
    - red-and-white kohaku → robin
    - gold ogon → goldfinch
    - showa → swallow
    - asagi → bluebird
  - Birds circle when they rest, curious ones come to a finger, and shy ones scatter. They swell
    near the season word, take the friction word's colour, carry today's names, and come down
    to seed (double-tap).
  - The commitments become clouds.
  - Choose the world in *Pond settings → World*, or per board on `/make/`.
- **Any verbs.** The commitment pads show a board's own four, whatever they are.
- **Fixes:**
  - The lily-pad slit stops short of the text.
  - The friction practices line ("Silence · Fasting · Confession") now comes from the board, not
    the code.

## What "make it anyone's" still needs

Most of this is already designed. It's listed in order of cost.

1. **The family.** Names, labels, and which koi (or bird) each person has are in
   `src/shared/family.js` and `KOI_BY_PERSON`, and Pray assumes six people.
   - **Fix:** a "Your household" step on `/make/` (names, each person's creature) stored in one
     place, with every surface reading it through a `getFamily()` function.
2. **More worlds.** The seam is clean now. A world is:
   - a background painter,
   - a creature class with the koi's interface (`update`, `draw`, `head`, `mouth`, `parts`,
     `depth`),
   - a word for the creatures.

   Candidates with equivalent meaning:
   - **Fireflies in a summer meadow at night.** Swell = brighten, colour = warm.
   - **Fish under winter ice.**
   - **Butterflies in a walled garden.** The clouds would become flowers.
3. **Sync.** Everything is per device, so a family with two tablets has two ponds.
   - **Light option:** a share link per board, which already exists.
   - **Real option:** a small backend, e.g. Supabase (row per board, row per household), which
     you'd need anyway for a church or charity offering.
4. **A first-run screen.** Today a new visitor lands on Dayo's board. For anyone else, `/`
   should open on *Make your board* (or *Open a board you were sent*).

## Ideas for later (not built)

- **"Look again" date.** The board's *When* ("Autumn 2026") could prompt a gentle review at the
  season's end: *Is "Steady" still the word?* Then archive the old board as a page in a book of
  seasons.
- **A board for a whole church**, where the season word is the church's word for the term and
  each family's pond carries it.
