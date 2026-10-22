# Quiet Waters

A household's daily prayer from Scripture, by the pond. One app at `/`, installable to a
phone or tablet home screen, with no account, no server and no tracking.

> "He leads me beside quiet waters, he refreshes my soul." Psalm 23:2

## What it is

- **The pond** is home, the idle screen and the record. The family's word for the season
  lies in the water, with the week's verse beneath it. Each person is a koi, and today's
  names float beside theirs. Tap the water and it rings. Tap a koi to see whose it is and
  their word. Double-tap or hold to feed them. A lily pad appears for every week of the
  season, and a lotus for each verse said by heart.
- **Pray**: one prayer a day for the household (a pair, and on Sunday everyone). The
  sitting adapts to who's in the room:
  - **One grown-up** (06:45, silent): three breaths, the verse read twice, twenty seconds
    of quiet, the prayer one thought at a time with *Wandered?*, a line for them, the
    blessing, then Amen and a held silence before their koi rise.
  - **Children**: simple words, a different child reads each card, then "I wonder…", the
    blessing together, Amen, then *Play the verse*.
  - **Sunday**: the Lord's Prayer, each person held, the week's verse said together from
    memory, and the week looked back on.
- **Play the verse**: the verse puzzle, in four steps through the week (*Some words*,
  *More words*, *Every word*, *By heart*). Different words fall each time. Turns are shown
  in koi colours, and several fingers can play at once. *Today's prayer*, with the
  family's names, is a second game.
- **Into the deep**: confession. For a grown-up, a short examen and then one stone,
  opened from the hand. For children, a stone (sorry) or a flower (thank you), thrown into
  the pond. Nothing is typed or stored.
- **This season**: the family's word and practices, each person's word, what has taken
  root week by week, and a book of past seasons. *Begin a new season* passes the tablet
  round.
- **First run**: set up a household (names, grown-up or child, a koi each), or look
  around with an example family. *Settings* makes a link that carries the household to
  another device. The rota is worked out from the household and the date, so both devices
  agree without sync.

## Previews

| Address | What |
|---|---|
| `/?demo=1` | An invented household with six weeks behind it (kept apart from any real one). |
| `?h=6.75`, `?h=22` | Any hour: the light and the paper follow it. |
| `?day=sun` | Any weekday of this week. |
| `?season=winter` | Any season on the water. |
| `?idle=1` | The idle screen straight away. |
| `?away=5` | (demo) Back after five days away. |
| `#/pray?who=sam`, `#/play`, `#/deep?who=ada,kit`, `#/season`, `#/season/new`, `#/settings` | Rooms. |

Old addresses (`/pray/`, `/flourish/abide/`, `/today/` and the rest) redirect here.

## Code

```
src/main.jsx                 entry: fonts, tokens, service worker
src/app/
  tokens.css                 the design system (day/dawn/dusk/night are settings of it)
  app.css                    every room, on the tokens
  App.jsx  route.js          the shell and rooms (#/pray …)
  store.js                   the household's record (localStorage), the example family's apart
  calendar.js                now(), the prayer day (turns at 03:00), the week (turns Monday), light
  rota.js                    who we pray for each day, and the week's prayer (worked out, not stored)
  today.js                   everything a screen needs about today
  script.js                  what today's sitting consists of, by who's here
  household.js  demo.js      people and koi; links to another device; the example family
  content/                   prayers.js (fourteen prayers), context.js (grammar), verses.js (NIV)
  pond/                      PondView (home), SpineFish (koi), water, paint, pads, koiFood, KoiSchool
  play/                      Play, Round (the puzzle, matter-js), puzzle.js
  deep/                      Into the deep and its water
  screens/                   Home, Sitting, Season, NewSeason, Settings, Setup, Welcome, Join, Print
public/                      manifest, service worker, icons, redirects from the old addresses
```

## Develop

```bash
npm install
npm run dev      # http://localhost:5173/?demo=1
npm run build    # static site in dist/
```

## Scripture

The memory verses and the confession verses are NIV (Anglicised): Scripture quotations
taken from the Holy Bible, New International Version® Anglicised, NIV® Copyright © 1979,
1984, 2011 by Biblica, Inc. Used by permission. All rights reserved worldwide. There are
fewer than 30 verses, inside Biblica's General Use Guidelines. The prayers, prompts and
notes are original modern renderings.

Earlier reviews of the previous surfaces are in `docs/`.
