# Screen evidence

All after captures come from the working local app. Phone is 390 × 844; tablet is 1180 × 820. Day and night use the existing time preview, `h=12` / `h=22`. Each fresh demo link creates fictional boards. During final screenshots the already-rendered canvas is held using the visibility pause, then immediately resumed; this avoids capture contention on the software-rendered host. Screenshots are static evidence; see [motion](motion/README.md) for native recordings and the performance limitation.

- `{pond,grove}-{family,personal}-{phone,tablet}-{day,night}.png`: all 16 required board views. Personal view is Ada's **Brave**, linked to the family's **Rooted** direction.
- `{pond,grove}-glance-{phone,tablet}-{day,night}.png`: controls quietened using **Leave it open**; also occurs after 60 seconds without input.
- `{pond,grove}-home-{phone,tablet}.png`: home carries the same chosen world, with prayer and play accessible.
- `world-switch-{phone,tablet}.png`: device-level world choice. It preserves all boards.
- `{pond,grove}-amen-{phone,tablet}-night.png`: visual return from the unchanged paper sitting.
- `ritual-start-tablet.png`, `ritual-gather-tablet.png`, `ritual-family-review-tablet.png`, `ritual-personal-review-phone-night.png`: direct family and pass-around paths; a complete personal intention can seed the editable family draft.
- `grove-large-text-{phone,tablet}.png`, `ritual-large-text-{phone,tablet}.png`: 200% device text; the board and ritual scroll with reachable controls. These are viewport captures, not claims that enlarged content fits without scrolling.
- `{pond,grove}-reduced-motion-phone.png`: complete static compositions.
- `empty-season-tablet.png`: honest empty state, without invented commitments.
- `before-*`: round 2 base, captured before product code.
- [Vine / grove comparison](vine-grove-side-by-side.png), [HTML source](comparison.html): old word-writer asset rendered with its original geometry and drawing code, beside the working grove. **Upgrade: distinct personal intentions form one connected living structure with a practical yes and no.** The original is still the finer word writer; this is not its application shell.

The four initial style tiles are in `../tiles/` and belong to commit `114eca9`, before any product implementation. The tile HTML is an exploratory source from that commit; its historical iframe should be viewed at that revision. The committed PNGs are the authoritative initial tiles.

`browser-results.json` records the final board target, overflow and page-error checks. The sibling `verify-worlds.py` reproduces that walkthrough; `verify-ritual.py` exercises actual saved data and reloads; `verify-amen.py` walks the unchanged sitting through the chosen-world return. Native browser screenshots retain ordinary page text and canvas output without compositing new artwork over the result.

To repeat locally, run `npm install`, `npm run dev -- --host 0.0.0.0 --port 5190`, then (with a local browser automation runtime and `/usr/bin/chromium` available):

```sh
node --test src/app/compass/*.test.js
python bakeoff/round2/entries/Q/verify-worlds.py http://localhost:5190 /tmp/q-worlds
python bakeoff/round2/entries/Q/verify-ritual.py http://localhost:5190 /tmp/q-ritual
python bakeoff/round2/entries/Q/verify-amen.py http://localhost:5190 /tmp/q-amen
```
