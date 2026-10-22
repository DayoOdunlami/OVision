# Digest — Studio B

## What this entry is

Tend is a household prayer book with a quiet daily page, a physical verse game, a garden of dated memories and an occasional seasonal review. The spiritual task leads; the landscape never sits behind the prayer. Every old route opens the same new book rather than a second app with competing settings.

## Process and evidence

1. **Discover:** Gate 0 read the brief, rules, README, project guidance, status and all three reviews; used the local reference at phone/tablet sizes. Gate 1 merged the shared answers and extended discovery to every surface, day/night, including document, screensaver, builder controls, fallen words, Sunday and the vineyard. An untouched base snapshot supplied 32 before images. DISCOVERY.md and DISCOVERY-DETAIL.md record what to protect and what failed.
2. **Research:** independent practice/product, play/behaviour and art/engineering passes disagreed before the decision. Research used opened primary sources, with limitations stated; no claim of hands-on use of competitor apps. Detailed take/reject tables are in RESEARCH-PRACTICE.md, RESEARCH-PLAY.md and RESEARCH-CRAFT.md.
3. **Directions and decision:** a living landscape as interface, a formal household prayer order and a household fieldbook were genuinely different structures and looks. The fieldbook won. DESIGN-DIRECTION.md was committed before product code (463 fc 99).
4. **Addendum:** it arrived after the first code pass. Implementation paused, the latest base was merged, specific visual/type/colour research was added, and all three 390 px prayer studies were rendered and committed side by side before work continued (b 7 a 1 ed 8). Exploratory study source is beside the PNGs.
5. **Build:** a new shared local model, still prayer flow, per-participant sittings, exact weekly Scripture, forgiving word physics, private reflection, original vector garden, seasonal board, household setup, self-hosted fonts and full offline book. The garden and physics load separately; the initial actions paint before the illustration mounts.
6. **Test and cut:** source review, pure model tests, real Chromium interactions and an eight-moment screenshot matrix. Fixes are described below. These are adult reviewer proxies for the people in the brief; no actual child or client usability test was performed.

This was one working session across the gates, with separate discovery/research/design commits and subsequent implementation/verification milestones. We did not inspect any other entry or preview. The local base is the reference required by the shared answers.

## Key decisions and trade-offs

- **Two sittings, one prayer.** People being prayed for come from the rota; people actually praying come from the participant selector. They are different concepts. Amen records only selected IDs and mode, never a household-wide day-complete flag. Repeat identical person/mode sittings on the same day are harmlessly deduplicated rather than counted as more achievement.
- **A Monday verse, held through Sunday.** Local calendar arithmetic avoids parsing a local day as a UTC instant. The eight-week rotation is deterministic; no shuffle button changes the children's words mid-week. A sitting holds its date/passage if midnight passes while it is open. Outside a sitting the clock and date refresh on resume and every minute.
- **One stable source for reading and play.** Eight verified NIV verses total 70 words; original surrounding prayers/reflections total 1,561 words before interface copy. That is well below 25%, far below 500 verses and no complete book. NIV is identified beside every passage, with acknowledgement in About & Scripture. Existing paraphrases are not put inside the memory game. Two very short passages make some weeks brief; a larger library is later work.
- **Names are data, not indices.** Stable IDs permit 1–24 people, odd households and a person alone. Sunday's rota returns everyone. Dated name snapshots survive a person leaving or changing the roster. Renaming through the text editor creates a new identity rather than silently reassigning old history; the Everyone journal retains the old name.
- **Recall without proof of mastery.** Every word falls by default, following the shared answer rather than the old Memory implementation. Equal words are interchangeable. Hints are free; wrong choices do not punish. “Practised” does not claim “learned by heart”. At enlarged text sizes a flowing large-word bank preserves the task instead of shrinking type to fit physics.
- **A garden, not an economy.** Illustration can quietly acknowledge accumulated sittings, but there is no dying plant, missed-day tally, moral score or claimed measure of spiritual growth. Attendance is a memory. Feeding is simply pleasant play.
- **Actual confession for adults.** Private recognition, asking forgiveness and a possible repair replace the clearing chore. The optional child metaphor names actions, not anxiety/doubt as sins. No confession content or response is stored. Leaving is always allowed.
- **Direct family direction now.** One family board is editable and printable, with previous seasons retained. Connected personal boards are a promising backlog seam, not a rushed requirement. The board is visited deliberately; it does not become a mandatory daily task.
- **One way in.** Today is the default. The household settings live behind the household name/footer. Quiet prayer reaches the first line of Scripture in two taps; Together follows the same path with optional participant adjustments. No account, tour, clearing task or game must be completed first.

## The moments

Use these paths on the branch preview, or on `http://localhost:4173` after a build. `?demo=1` seeds a fictional household only when the device has no household; it never overwrites an existing one. `?h=22` previews night on every view. `day=sunday` replays the most recent Sunday, including its own week's passage.

| # | Moment | Served by | Deep link |
|---|---|---|---|
|1|06:45, Dad, phone|Still, silent, self-paced Scripture and original intercession; one participant; two taps from Today|`/?demo=1&view=prayer&mode=solo&h=6`|
|2|After dinner, children|Same verse and prayer, selected actual participants, then full-word play; direct play also available|`/?demo=1&view=prayer&mode=together&h=18` and `/?demo=1&view=play&h=18`|
|3|Sunday, household|Everyone on the rota, same week's passage, adjustable actual attendance|`/?demo=1&view=prayer&mode=together&day=sunday&h=12`|
|4|A glance in passing|Full ambient garden with seasonal word, practices and optional screen wake lock|`/?demo=1&view=rest&h=12`|
|5|Clearing the ground|Private adult reflection; optional one-stone child action and invitation to repair|`/?demo=1&view=release&h=12`|
|6|Looking back|Illustrated garden and dated, filterable prayer/practice memories; no streak chart|`/?demo=1&view=garden&h=12`|
|7|New season|Review/edit word, season, three practices and friction; archives previous board; print companion|`/?demo=1&view=season&edit=1&h=12`|
|8|Fresh device|Two clear choices: a minimal household setup or a fictional demonstration|`/` in a fresh browser; setup at `/?view=household`|

The standalone Flourish writing toy and Murmuration world are deliberately cut, as are Labs/Admin controls in the family journey. Their old URLs enter the book. The old multi-stage Abide game and vineyard are replaced by private reflection plus the garden/journal, which needs no undiscovered progression rules. The puzzle and koi feeding are kept because the shared answers identify them as loved.

## Browser walkthroughs and what changed

**Dad at 06:45, phone, half awake.** From Today he selects Pray quietly, then Begin: the stable Scripture appears in two taps. Each thought waits; a response can remain silent; Amen ends his sitting. The next invitation is optional. We removed movement behind reading and cut the obscure Amen eyebrow. We moved a software-focused caveat out of the confession's prayer copy. Night is the same book, with blue-green paper and pale ink.

**A reading 7-year-old and 9-year-old after dinner, tablet.** Gather, choose actual people, read together, Amen, play. A reviewer proxy hesitated at invisible mechanics in the base. The new task says “Tap the first word”, accepts a tap or a drag, and offers a free hint. Real touch, drag, wrong choice and keyboard reconstruction were checked. There is no score, timer or race. Completion saves a practice, never another prayer or a claim of memorisation. The pre-reader is a supported shared-use bonus, not a tested independent user.

**A new household.** The cold entry explains the purpose, then offers Make it yours or Explore a household. A three-person household completed setup and both sittings in browser verification. No six-person default or client names are inserted. Duplicate names and whitespace-only seasonal fields are handled explicitly. A fresh book has room for a first page, without missed-day debt.

**Returning after a gap.** The current prayer is ready; no catch-up itinerary or neglected creature appears. Demo history deliberately has gaps. Already-prayed copy describes a sitting and leaves both invitations usable. No streak feature exists to punish absence.

## Fixes made during verification

- Browser Back restored mode without participants: restored the matching participant selection too.
- Failed saves could be overwritten by visibility resume: pending writes now retain the in-memory book and offer retry.
- Midnight could change a prayer under the reader: a sitting now holds its own date and weekly passage.
- Season Cancel retained abandoned text, and spaces passed native required checks: reset canceled drafts and validate trimmed fields.
- The idle clock was fixed at module load: date/hour now update on resume and a timer, while explicit previews stay fixed.
- The garden wrapper clipped the pond and feeding tools; the ambient view overlaid words on leaves: fitted the whole illustration in normal flow, kept text separate and allowed enlarged controls to wrap.
- Missing diagonal-arrow glyphs appeared as squares: replaced them with original inline SVG marks.
- 44 and 46 px controls were below the addendum: all actions now share a 48 px minimum. Stronger secondary colours pass on soft surfaces; opacity is not used to dim secondary labels.
- A fixed physics arena could hide controls at 200% zoom: measured the visual viewport and supplied a flowing word bank.
- Offline precache missed module/CSS requests because of `Vary: Origin`: public same-origin cached assets now ignore that header variation. Worker source itself contributes to its content version. Formatting exposed a quote-dependent placeholder replacement; the build script now accepts either quotation style and fails loudly if any placeholder remains.

## Verification record

- `npm run build`: static Vite output, separate garden and word-game chunks, complete precache generated.
- `npm test`: eleven pure checks covering DST/local dates, Monday/Sunday, eight stable passages, arbitrary rosters, stable IDs, per-participant prayer and practice, demo dates, malformed storage and save failure.
- Household browser story: eighteen assertions, including a fresh three-person setup, quiet Amen, evening for two different people, identical Scripture, separate records, return to solo, saved seasonal archive, feeding,200% reflow across seven main views and no unhandled errors.
- Game: phone 390×844 and tablet 1180×820; normal, reduced motion, explicit Large words and 200% zoom. Final production night check placed a wrong word, touched the first correct piece, dragged the second, and completed by keyboard. One practice and zero prayer sittings were added; replay and Escape work.
- Offline production: one online visit, service worker claimed, then never-visited prayer/play/garden/season queries. The lazy word game opened offline, saved household stayed identical, and no external requests or page errors occurred. Native installation was not performed; Chrome's persistent-profile manifest/installability inspection reported no errors.
- Before/after: all eight moments at 390×844 and 1180×820, day/night, plus both adult and child clearing-ground treatments. See screens/README.md.
- Contrast: the selected main, accent and muted text tokens meet AA on their actual day/night paper and soft surfaces. Decorative lines are not the focus outline. This is a measured palette/target/reflow audit, not a full independent WCAG conformance certification.

Final performance and edge-regression receipts are appended below after the last candidate checks. A throttled desktop browser is not an ordinary Android device; a native device pass remains necessary before promising a launch-time number.

## Self-critique and cuts

We cut the formal service binding, the garden-as-navigation direction, competing worlds, builder switches, the three-cut taxonomy, attendance-based rewards and compulsory clearing. We also cut the exploratory full-text prayer mode to keep one tested bedside flow; the seasonal board prints, but a whole-prayer print/reading view remains a gap. We removed a decorative Amen label and a copy line that made someone think about software during confession. The illustration waits until the controls paint, and physics waits for play.

The garden is coherent and inviting, but less physically rich than the base's koi and vineyard. That is a deliberate cost of a repeatable art system and a clearer product. The child stone is one gentle action, not a whole game. The strongest product claim is the still prayer plus the beloved word mechanic; the documents and scenery must not pretend otherwise.

## Calls made without asking

The shared answers are authoritative. All-word play wins over the base's Memory label. Eight short verses form the initial library. No legacy import. A direct family board wins for this round. Names/nicknames only, no ages. Up to 24 people with a deterministic round-robin; same-day identical person/mode records deduplicate. Personal reflection is never persisted. Demo is opt-in on an empty book and never erases a real one. The Sunday preview replays a past day rather than creating future attendance. There is no audio, account, sync, payment, API key or new-discipline module.

## Known gaps and another day

Actual family observations, a native Android installation and ordinary-device performance measurements come first. Next: tune any hesitation observed in the two-tap path, add a carefully edited wider verse library, provide a whole-prayer print/read view, improve the household editor's explicit rename/archive interaction, and make a portable backup/export before sync. Removed people remain in the Everyone journal but cannot be selected by its current-person filter. Personal boards feeding the family board, accounts/sync, new disciplines, sound and commercial NIV licensing remain backlog. No notifications, analytics or monetisation are implemented.

## Final receipts and verdict

The last built candidate passed the full eighteen-assertion household story in production, plus seven focused regressions: canceled board draft, whitespace rejection, failed save retained on resume, retry persistence, an open Sunday's verse held over Monday midnight, the next verse outside the sitting, and automatic day/night change on resume. The 40-image after matrix completed with zero browser errors. Final reading images were refreshed after removing the default browser outline around the non-interactive reading region; keyboard actions retain their focus ring.

`FINAL-SMOKE.json` identifies the final cache version and confirms offline prayer, visible keyboard focus on actions, the lazy 12-piece verse game and unchanged saved data without page errors. `OFFLINE-RECEIPT.md` and its raw JSON preserve the more extensive offline/install/loading inspection; its timing sample precedes only the final contrast/focus stylesheet clean-up.

**Performance is an admitted gap.** Cold local visible-action mark was 2.004 s and FCP 2.648 s. The CPU×4/10 Mbps/80 ms proxy marked the action at 8.560 s and FCP 10.336 s. Both actions worked, and no physics ran on the first screen; the garden loaded after first paint. The initial main transfer was about 63.2 KB including headers, with all fonts local. These noisy single-sample desktop results do not establish a two-second ordinary-Android load. We reduced initial work by splitting art and physics, but do not call the target passed. A device trace and further reduction of hydration/layout cost are priority next work.

**Self-review verdict: ship this bake-off entry with the disclosed loading gap.** The core required prayer and play work; the foundation is static, install-eligible and offline. There has been no actual family panel, native Android install, independent full accessibility audit or production-preview click-through. The private preview cannot be inspected through the available deployment connection; its successful build status is visible through the repository. Use branch `bakeoff/r 1-b` in the client's project or run the local production preview.

Additional secondary limitations: the journal displays the most recent 18 matching records, with person filters reaching farther back; all older records remain saved. Saving an unchanged seasonal board also archives its previous state. These are refinement gaps, not claims that an activity is unwired.
