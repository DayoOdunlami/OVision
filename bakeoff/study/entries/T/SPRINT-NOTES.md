# Sprint 2 · a closer place

The starting point is T's delivered study at `79d8326`. Its six runtime modules and stylesheet are frozen under `src/study/v1/`; only nested imports of the unchanged app modules move up one extra directory. The entry markup stays the same. `?v=1` selects that copy before any Sprint 2 code or styles load. Hashes are recorded in `sprint1-freeze.json`.

Sprint 2 is the default (`?v=2`). Every requested upgrade has one independent URL switch. `off` accepts a comma-separated list; unknown names are ignored. The table below is the implementation contract and will be updated with validation before hand-in.

| Brief item | Change | Switch | On | Off | Why |
|---|---|---|---|---|---|
| 3 | The medium spreads from the touched dial across wet paper. | `wet` | `/study/?v=2&dial=ink&h=12` | `/study/?v=2&dial=ink&h=12&off=wet` | The whole place receives one new medium. |
| 4 | More pigment in Wash, with Colour retaining its richer role. | `pigment` | `/study/?v=2&dial=wash&h=12` | `/study/?v=2&dial=wash&h=12&off=pigment` | A little more life without making a louder front door. |
| 5 | Wind passes through distant hills; a few rare birds cross. | `birds` | `/study/?v=2&dial=ink&h=12` | `/study/?v=2&dial=ink&h=12&off=birds` | The distance belongs to the same living landscape. |
| 6 | Smaller koi foreshortened inside the oval pond. | `squash` | `/study/?v=2&dial=ink&h=12` | `/study/?v=2&dial=ink&h=12&off=squash` | Fish belong to the angled water. |
| 7 | Native koi size in the full pond. | `fullsize` | `/study/?v=2&dial=colour&place=pond&h=12` | `/study/?v=2&dial=colour&place=pond&h=12&off=fullsize` | Arrival brings the fish close. Off retains the small fish in the open view. |
| 8 | An ellipse grows continuously beyond the frame; Back reverses it. | `arrival` | `/study/?v=2&dial=ink&h=12` | `/study/?v=2&dial=ink&h=12&off=arrival` | A single view opens without a wedge. |
| 9 | Curious/shy touch responses and double-tap feeding. | `touch` | `/study/?v=2&dial=colour&place=pond&h=12` | `/study/?v=2&dial=colour&place=pond&h=12&off=touch` | A child can meet the same living koi. |
| 10 | Enter the garden, clear stones and thorn, sow Rooted, and watch the vine write. | `garden` | `/study/?v=2&dial=wash&h=12` | `/study/?v=2&dial=wash&h=12&off=garden` | The new place has one small meaningful thing to do. |

## Sources and decisions

Read and ran S's delivered study (`f237691`) locally at phone and tablet size. Borrow the idea of a radial, feathered dial reveal originating at the control (`study/main.js`, `setDial` and `draw`), with credit to studio S. Implement it within T's renderer; no wholesale page or asset copy. S's fuller pigment, mobile mist and distant brush birds inform the requested refinements. T keeps its oval basin, negative space, typography and brush implementation.

The sprint explicitly permits learning from S and supersedes the earlier seal. Its instruction to merge the base supersedes the original no-merge rule. Existing application routes remain outside the work.

Use the house art-direction and product-review passes. Keep sky a view; no extra settings UI, streaks, points, saved personal input or full practice flow. Interaction switches live only in URLs. The garden's incomplete phrases are prompts to think, never traits assigned to a person.
