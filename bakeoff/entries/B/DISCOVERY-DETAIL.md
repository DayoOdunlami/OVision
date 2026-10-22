# Studio B discovery / art review

## Evidence and scope
Reference: authorized `bakeoff/r1-base` snapshot, run locally at port 5174. Browser: Chromium, 390×844 and 1180×820, `h=12` and `h=22`. Screens and route-text evidence are in `/tmp/studio-b-discovery/`. The initial Gate 0 review covered the major routes; this pass adds night, the builder surfaces, Document and screensaver, and interactive puzzle/Abide checks. No product edits were made.

## Protect
- The prayer page knows what reading is for: warm paper, generous serif text, names picked out without an icon system, still surroundings. It does not put koi behind scripture.
- The verse pieces are actual physical objects, not a sterile reorder list. Pieces remain readable, repeated words are interchangeable, wrong choices recover without penalty, and keyboard/tap are alternatives to drag.
- The koi are unusually distinctive and feeding is a small intrinsically satisfying gesture. Keep it explicitly chosen, not a visual reward required to count prayer.
- Abide has an excellent coherent illustration language. The vine is a single drawn line and the light/soil/sky belong to one place. Preserve that unity if any of the landscape survives.
- “I wonder” permits a response without an examination. Silence should count; written output should never be required.

## Broken or costly
- Root opens on a sprawling personal board rather than a clear daily practice. Today is a second front door requiring a builder switch; its itinerary proposes three things rather than the client's one prayer in two sittings.
- Prayer text and puzzle can differ substantially; family names appear within the learned rendering. QA requires one stable NIV passage shared all week, separate from the personalised prayer.
- Base Memory cut drops only some eligible words; the client describes the favourite as all words dropping. Use the client's account as the intended interaction, with the scaffold as an optional help rather than a mode taxonomy.
- A single global prayed-today record cannot represent morning and evening. Treat a saved sitting with participants as the unit. Morning must not close the children's evening opportunity.
- Night prayer remains a pale full-screen page in the base when `h=22`; the reading surface needs an intentional bedside palette rather than assuming the illustrated sky solves every mode.
- At phone night size the moon overlaps the clearing instruction. The little labelled stones sit far below a large body of instructions and participant/settings chrome. Attention is spent on operating and interpreting the metaphor before reflection.
- A stone labelled as a fault gives the hand a job. It does not ensure the person recognises a concrete occasion, brings it before God or hears assurance. Shortening the motor task does not solve adult confession.
- Board creation is a long form before the live preview is useful on a phone. It asks for a full conceptual system. The family could begin with a season word and one shared practice, enriching later.
- Labs/Admin contain useful builder comparisons, but they should be absent from the family path and should not determine whether a core doorway exists.
- The vineyard's accumulated geometry is hard to read without explanation. A human sentence attached to a remembered day can carry more meaning than a wall/compost/vine/fruit conversion economy.
- Feeding, birds, vines, prayer and word games are separate experiences. A link is not sufficient to make them one coherent product; the weekly passage and shared seasonal purpose must provide the connection.

## Competing directions / disagreement
1. **Living garden house.** One landscape is the main hub; doors/places correspond to prayer, stones, memories and board. It is child-inviting and artistically distinctive. Objection: it continues asking the half-awake adult to navigate and interpret the garden before praying. It risks turning spirituality into a growth economy.
2. **Household prayer book.** One daily leaf: the week's stable passage, today's people, a silent guided prayer that can be reopened after dinner. Large editorial type and a modest drawn branch; landscape becomes an explicit rest/remember destination. Children enter the same leaf and then let the passage fall into physical pieces. Objection: a paper-like product can lose the loved physical play and merely become an elegant reading app.
3. **Verse play table.** The weekly verse is the centre, assembled collaboratively; prayer emerges around it and each family member contributes a word/intention. Objection: the strongest game becomes the organising metaphor for Dad's silent prayer, reversing client priority.

Recommendation: choose the prayer book, but protect a full, tactile puzzle and an optional feeding pond. Do not turn every screen into illustrated parchment or add decorative leaves to reading states. Root should offer one dominant action that starts practice, with participant/sitting choice legible but inexpensive. The garden belongs beside prayer, never under its text.

## Art system recommendation
- Day: bone paper, ink like dark olive/charcoal, restrained russet/copper for this season; night: warm near-black/ink with low-luminance parchment type, no bright cards.
- Type: a reading serif with a separate small humanist label face. Avoid generic wellness cards, purple gradients, Inter-as-default, pill farms and gold-as-decoration.
- Motion: reading is still; page changes use a short settle/fade; falling words get the budget because the movement is the learning interaction. Pond movement is opt-in and stops or simplifies for reduced motion.
- Touch: forgiving large targets; text does not move away from a reader. Drag has tap and keyboard equivalents. No scores, completion fireworks, streak pressure or withering.
- Sound: silent; no synthetic voice in this round per QA.
- Confession: private by default, nothing entered or logged about faults. One concrete recollection, a freely paced pause, original prayer asking mercy, assurance grounded in Scripture, optional response into the day. Never pretend a swipe removes sin or that a timer proves a spiritual act.

## House standards
Keep the product-review outcome/first-30-seconds/states/cut tests. Keep abide-direction's unity, low ambient motion, readable verse and one-wind discipline where a landscape is retained. Adapt its mandatory clear→sow→abide→gather sequence: QA explicitly permits replacing the adult clearing experience, and the primary adult moment should not be gated behind game work. Overturn fixed palette/type choices only with a coherent product-wide visual reason.

## Browser pass completion
The route matrix visited Pond, screensaver, Pray, Abide ground/sow/vineyard, Flourish, Murmuration, Make, Today, Admin and Labs at both specified sizes and both hours. Two captures hit a screenshot timeout (tablet-night Pond and Flourish), while body/state inspection succeeded. The phone-night Abide moon overlap is confirmed visually. Admin was unlocked and its feature switches inspected. Document view was opened. Puzzle pieces fell and four correct keyboard placements were verified; the original Memory cut left seven slots from a longer personalized rendering. Art/layout screenshots are inspection evidence, not a claim of testing every physics edge or completing every base practice.

## New garden implementation / director's checklist
- Moment: Our garden / Today marginal illustration. A restful place with opt-in feeding, never behind the prayer text.
- Motion source: one coherent canopy breeze and a koi school; feed ripple is user-caused. No ambient particles or camera effects. HTML control text does not move.
- Verse/peripheral budget: scene is separate from reading. Reduced motion disables all ambient animation; offscreen/document-hidden state pauses it.
- Phone/night: 390×844 and 1180×820 day/night art checks, no horizontal overflow, no console errors. Keyboard Enter and button feeding work; reduced-motion computed styles and offscreen pause were asserted.
- Cost: deterministic SVG shapes, no per-frame React work. Actual midrange Android frame timing remains unmeasured.
- Cut: no birds, extraneous pond sparkles, garden-stat labels or sound. Flower count is a neutral capped accompaniment to history; no withering or performance reward.

## Addendum: before / after evidence
After reading the craft addendum, product edits paused. The complete **32-image baseline** is ready at `/tmp/studio-b-discovery/before/`, named `{phone|tablet}-{day|night}-01.png` through `08.png`.

1 = prayer reading, 2 = physical puzzle playing (words already fallen), 3 = Sunday prayer selected through the day navigation, 4 = ambient screensaver, 5 = Abide clearing, 6 = vineyard, 7 = board creation, 8 = fresh root landing. All are browser-rendered from the untouched authorized base. Empty history is intentionally the pristine-device baseline; no fictitious activity has been attached to the real hard-coded family. The puzzle baseline uses its existing sparse Memory mode, accurately showing the mismatch with the requested full-word game. The original reading and board surfaces stay bright at night; the screenshots preserve this existing limitation. Visual contact sheet confirms the files are populated and correspond to the expected moments.
