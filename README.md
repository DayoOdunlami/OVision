# Tend — a household prayer book

Studio B's round-one entry. The shared brief and answers are in `bakeoff/`; the design direction, pitch, full digest and before/after evidence are in `bakeoff/entries/B/`.

Tend brings one household prayer into two sittings: quietly alone, then together. A stable weekly NIV passage is shared by prayer and a falling-word game. The garden holds dated memories; the seasonal board gives a longer direction. There is no account, backend, API key, sound or cross-device sync.

## Run

```sh
npm ci
npm run dev
```

Open `http://localhost:5173/?demo=1` for a fictional household and three weeks of history. A fresh browser without the demo flag starts with household setup. `?h=22` previews night; `?view=prayer&mode=solo` opens quiet prayer. Every old entry URL opens the same book. Legacy source and `docs/` remain as the discovery reference, but are not in the new production bundle.

## Build and verify

```sh
npm run build
npm test
npm run preview -- --port 4173
python scripts/verify-tend.py
```

The browser script needs Python Playwright and Chromium at `/usr/bin/chromium`. Pure calendar, rota, attendance and storage tests run with Node alone. The build makes static `dist/`, including a complete precache worker. Use the production preview to test offline behaviour: the development server intentionally does not register a worker.

## Structure

- `src/tend/App.jsx`: the book's navigation, prayer, household, seasonal board, private reflection and journal.
- `src/tend/model.js`: versioned local state, local-day/Monday calendar logic, stable-ID rota, eight weekly passages, original prayers and invented demo history.
- `src/tend/VersePlay.jsx`: independently loaded, forgiving word physics and a flowing large-word alternative.
- `src/tend/GardenScene.jsx`: original vector illustration and optional koi feeding, independently loaded after the first controls paint.
- `src/tend/tokens.css`: shared day/night design tokens; component styles consume them.
- `public/`: manifest, local fonts and licences, original icons and worker template.
- `scripts/tend-precache.mjs`: replaces the worker's placeholders with the complete built asset list and content version.

Everything is stored on this device under `tend.household.v 1`; no legacy data is imported. Dated name snapshots survive roster edits. Prayer and puzzle attendance are separate. No record claims memorisation or measures faith. Clearing browser site data removes the household's saved book.

NIV acknowledgement is in the app's About & Scripture panel. Eight short verses total 70 words; all surrounding prayers and reflections are original. Licensing for a commercial product remains a backlog question.
