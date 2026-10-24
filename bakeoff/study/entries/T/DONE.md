# Style study T · sprint 2 ready

- **Branch:** `bakeoff/study-t`
- **Preview:** [Open Sprint 2](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=ink&h=12). Uses the client's Vercel sign-in.
- **Original:** [Frozen Sprint 1 at ?v=1](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=1&dial=ink&h=12).
- **Default:** `?v=2`; the original HTML, modules and stylesheet remain separately frozen.

## Open these first

1. [The refined scroll, by day in Ink](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=ink&h=12). Tap the pond; use Back to return. Change the dial to see the medium spread.
2. [The garden, in Ink and wash](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=wash&h=12). Tap the garden, lift the stones and thorn, then sow Rooted. Dragging has weight; tapping and keyboard activation also work. The vine writes the word on its trellis.
3. [Direct pond, in Colour](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&place=pond&dial=colour&h=12). Hold a finger near the fish; tap twice to feed.
4. [Night scroll, in Ink and wash](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=wash&h=22).
5. [Paper at 06:45](https://o-vision-git-bakeoff-study-t-dayoodunlamis-projects.vercel.app/study/?v=2&dial=paper&h=6.75).

## Compare and review

- [SPRINT-NOTES.md](SPRINT-NOTES.md): all eight named switches, on/off links, decisions, credits and limits. Example: `?off=birds,pigment`. All requested upgrades are on by default.
- [Before and after](screens/sprint2/before-after.png).
- [All 48 after states, eight before views and twelve completed-word views](screens/sprint2/README.md).
- [Pond arrival, feeding and dial recording](screens/sprint2/pond-arrival-native.webm), 18 seconds.
- [Garden arrival, clearing and sowing recording](screens/sprint2/garden-arrival-native.webm), 27 seconds.
- [Sprint 1 research and source ledger](STUDY.md).

Production build and all 18 focused tests pass. Actual browser checks pass at 390 × 844 and 1180 × 820, day/night: all media, destinations, eight independent switches, touch and keyboard clearing, feeding, live reduced motion, blank Paper and the existing app's demo/season entry. No page errors, horizontal overflow or targets below 48 px. Existing app source and the original fish model are unchanged.

**Remaining limit:** physical Android smoothness is unverified. Full-pond Wash measured 10.9–21.3 fps on the software-rendered test host; it remains the rendering risk. Measurements and cache comparisons are included with the evidence. No 60 fps certification is claimed.

No family record or personal response is saved. Refreshing resets the garden demonstration. Reduced motion holds the world and completes sowing immediately. Extra scenery was cut to protect the empty paper and the chosen moment.

For a local production preview: `npm install`, `npm run build`, then `npm run preview -- --host 0.0.0.0 --port 4170`; open `http://localhost:4170/study/`.
