# Children, memory and humane habit: research notes

## Evidence boundary

The QA is stronger evidence about this family than any app precedent. I read the Gate 1 QA, rules, brief, puzzle implementation and the existing product-review guidance. External sources below were opened/read through web research on 22 October 2026, except the final two marked search excerpts. Recommendations are design inferences, not a claim that these exact puzzle mechanics have been studied with this family.

## What the product evidence says

- The two middle children, about seven and nine, can read and are the primary child users. A pre-reader is a bonus, not a gate.
- The puzzle is the only sacred existing surface. Feeding the koi is enjoyed. No evidence says stone-clearing, the pond or vineyard must survive unchanged.
- The answer says they use the default Memory cut “with all the words dropping.” Current code actually drops about every third word in Memory. Honour the answer's behaviour: all words should fall by default, even if the internal mode is called `words`. Avoid silently preserving the existing cloze behaviour because of its label.
- Existing puzzle architecture has valuable craft worth retaining: real physical tumbling, optional tap instead of precise drag, only the next slot active, repeated identical words interchangeable, forgiving wrong placement, no points or buzzer, helpers, and fixed-timestep physics with sleeping bodies.
- The existing puzzle draws from `day.steps`, which can differ from the prayer's flowing prose and includes personal names. This directly conflicts with the new requirement. Give the prayer's Scripture block and the puzzle one immutable passage string per week; personalise only the surrounding prayer.

## Outward research: take and reject

1. [RetrievalPractice.org FAQ](https://www.retrievalpractice.org/faq). Opened/read. Describes retrieving as a learning strategy, recommends feedback rather than grades, and explains spaced practice and normal forgetting. Take: let a child try, gently show/cue the next word, allow another attempt, return to the same passage over several days. Reject: calling one successful reconstruction “learned by heart”; visible word tiles make this partly recognition, not a demonstrated independent recall test. Record **practised**, not **mastered**.
2. [EEF: retrieval as a game of hide and seek](https://educationendowmentfoundation.org.uk/news/retrieval-practice-a-game-of-hide-and-seek). Opened/read. The education evidence concerns school learning rather than Scripture; it supports purposeful, playful retrieval, clear targets, cues for younger children and paired play. Take: one stable target verse, short enough to fit, a useful hint and shared turns. Reject: treating challenge or lack of a hint as inherently superior. Inference: the game can support memory without measuring a child's faith or intelligence.
3. [Monument Valley official page](https://ustwogames.co.uk/our-games/monument-valley/). Opened/read, including its illustration-led presentation and the description of a silent guided journey. Take: one coherent scene, readable physical affordances, a quiet finish. Reject: importing optical-illusion difficulty into a prayer puzzle. This source is a visual/craft precedent, not child-learning evidence.
4. [Center for Humane Technology: Humane Product Design](https://www.humanetech.com/humane-product-design). Opened/read. The principles distinguish meaningful outcomes from engagement proxies and ask technology to respect human psychology. Take: measure the product by whether the family prayed and remembers the verse away from the device. Reject: retention pressure, quotas, lost streaks, lean fish, dying plants or getting more fruit for performing prayer correctly. All days of absence should leave a welcoming place.
5. [Duolingo: how the streak builds a habit](https://blog.duolingo.com/how-duolingo-streak-builds-habit/). Search excerpt reviewed; not a full product walkthrough. Take: make returning to a small familiar task very easy. Reject: consecutive-day accounting as a proxy for spiritual growth. Do not copy the streak, friends' streaks, loss aversion or the metric-first rationale.
6. [Sesame Workshop: Headspace collaboration](https://sesameworkshop.org/about-us/press-room/sesame-street-and-headspace-team-encourage-kids-practice-meditation-and/). Search excerpt reviewed; not a video walkthrough. Take: children can enter calm through a concrete everyday situation and one simple embodied action. Reject: assuming a three-minute breath activity has to precede their chosen puzzle, or importing a secular meditation frame as prayer.

## Proposed interaction and safeguards

- Read the week's NIV passage in full. “Let the words fall.” All movable words tumble. Restore the verse in spoken order. Tap is equal to drag; don't make a precise motor gesture a test of memory.
- Keep a useful hint available after the fall. A hint can highlight the next matching tile or briefly reveal the next word. No hint cost, error count, countdown or speed bonus.
- The child can finish, read the restored verse aloud with whoever is there, and optionally play again. The ending offers a clear way out, not a mandatory koi wait or endless automatic next round.
- If turns are offered, make them gentle social prompts, never competitive attribution. Do not track who got which word wrong.
- A family sitting can include any subset of people. One adult's morning Amen writes only that morning sitting or the selected people. The evening begins ready to pray, using exactly the same rota pair and weekly passage. Never let the day read “done” for the entire household after Dad's silent sitting.
- Store dated sittings and the selected participants, not a single global day boolean. Separate `prayer` and `verse-practice` events. A puzzle completion must not imply that somebody prayed, and a prayer Amen must not imply verse recall.
- Keep the weekly change as the family's pleasant Monday discovery. Stable through Sunday, independent of when storage was created. An absent week neither resets a streak nor makes the world unhealthy.
- Scripture target must remain NIV and name-free; surrounding bespoke prayers can name the pair. Display the acknowledgement, document the exact small corpus and ensure the quoted verse material remains below the QA's limits.

## Disagreement for the decision

I oppose making an illustrated world the main navigation if it costs the children an extra puzzle-unlocking ritual or Dad a scenic wait. Keep a place worth returning to, but let the direct act be accessible in one tap. I also oppose awarding visible spiritual fruit solely because a sentence was reconstructed: the app cannot infer either memorisation or spiritual maturity from that action. The gentler record is a book of real shared sittings, with optional words the family chooses to remember.
