# Round 2, entry Q: ready

**Branch:** `bakeoff/r2-q`  
**Preview:** use this branch’s client-protected deployment; no preview URL was discovered. The links below use the local app at port 5190. Replace that origin with the preview origin to use them there.

Run locally with `npm install` and `npm run dev -- --host 0.0.0.0 --port 5190`.

## Open these first

1. [Family board · Pond](http://localhost:5190/?demo=1&world=pond&h=12#/board)
2. [Family board · Grove](http://localhost:5190/?demo=1&world=grove&h=12#/board)
3. [Ada’s personal board](http://localhost:5190/?demo=1&world=grove&h=12#/board?person=ada) — Brave, connected to the family’s Rooted direction.
4. [Glance, left open](http://localhost:5190/?demo=1&world=grove&h=12&idle=1#/board) — touch to return; ordinary boards also quieten after 60 seconds.
5. [Set a new season together](http://localhost:5190/?demo=1&world=pond&h=12#/season/new) — make the family board directly, or pass the tablet round.
6. [Switch worlds](http://localhost:5190/?demo=1&world=pond&h=12#/board) — tap **Pond ⇄** at the top, then **Grove**. The choice belongs to this device; everyone’s words stay intact.

Every link works in a fresh browser with an invented household and completed boards. Preview links explicitly choose a starting world. Normal household use remembers the device’s choice without a URL override.

For the other-room proof, open [home before morning prayer](http://localhost:5190/?demo=1&world=grove&h=6.75), pray through to Amen, then return. The paper sitting keeps its words and sequence; the selected world returns after Amen. Repeat with `world=pond`.

## What is delivered

A daily compass: **who we are becoming / make room for / leave behind**. Independent personal intentions feed a deliberately chosen family direction. Six meaning themes work with arbitrary words, with an explicit interpretation override. The pond keeps the actual living koi; the grove joins personal boughs to a common root. No daily completion is asked for; decorative pond drifters were cut to keep attention on the living koi and chosen intentions.

[One-page pitch](PITCH.md) · [Decisions, sources, behaviour bank and limits](DIGEST.md) · [Screen index and reproduction commands](screens/README.md) · [Native motion evidence](screens/motion/README.md) · [Vine / grove comparison](screens/vine-grove-side-by-side.png) · [Initial style tiles](tiles/)

The four rendered style tiles were committed before any product code in `114eca9`. Final family and personal captures cover both worlds, phone and tablet, day and night, with ritual, glance, switch, home and Amen evidence.

## Validation and remaining gaps

`npm run build` passes. Ten model, geometry and original-renderer boundary checks pass. All 23 final board/accessibility states pass target, overflow and page-error checks. Browser flows verify personal save/reload, direct family creation, archiving, pass-around contributions, whole-intention copying, world persistence and four Amen returns. Both worlds stop and resume on a live reduced-motion preference change. The original `SpineFish.js`, prayer content, puzzle and confession are unchanged.

**Android smoothness remains unproven.** The shared software-rendered desktop probe showed uneven 10.5–21 fps cadence; this is a documented limitation, not certification. Physical Android, battery use, cold first-screen timing, installed offline behaviour and wake lock still need device testing. Confession retains its existing literal water metaphor, within the round’s scope boundary. Full details and raw measurements are in the digest.
