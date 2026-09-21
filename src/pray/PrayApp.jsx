import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import ReadingView from './components/ReadingView.jsx';
import ControlSheet from './components/ControlSheet.jsx';
import PaceMode from './components/PaceMode.jsx';
import PrintSheet from './components/PrintSheet.jsx';
// The puzzle pulls in matter-js (~30 KB gzipped). Loaded on demand so
// the reading page — what almost every visit is — stays light.
const PuzzleMode = lazy(() => import('./components/PuzzleMode.jsx'));
import { buildDay } from './lib/script.js';
import {
  loadState, writeStored, createWeek, weekTally, isoDate, isoForDayIndex,
  todayDayIndex, readTextScale, writeTextScale, advance,
  readCelebrate, writeCelebrate,
} from './lib/state.js';
import { prayers } from './data/prayers.js';

// ═══════════════════════════════════════════════════════════════════
// PrayApp — the prayer surface.
//
// Layout, top to bottom:
//   · a quiet back-link to the Pond
//   · the reading view — the prayer is the landing page
//   · a dock at the bottom, in thumb reach: Options · Pray it · Puzzle
//
// Everything else — day, voice, style, text size, the week, settings —
// lives in the Options sheet, so none of it competes with the prayer
// until you ask for it.
//
// State is the shared `familyPrayer` record (see lib/state.js), written
// through on every change so the pond sees it.
// ═══════════════════════════════════════════════════════════════════

export default function PrayApp() {
  const [state, setState] = useState(() => loadState());
  const [dayIndex, setDayIndexRaw] = useState(() => todayDayIndex());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [overlay, setOverlay] = useState(null); // null | 'pace' | 'puzzle'
  const [focus, setFocus] = useState(false);
  const [textScale, setTextScaleRaw] = useState(() => readTextScale());
  const [printNotes, setPrintNotes] = useState(false);
  const [celebrate, setCelebrateRaw] = useState(() => readCelebrate());

  const setCelebrate = (v) => {
    setCelebrateRaw(v);
    writeCelebrate(v);
  };

  // Write-through update. Every change is persisted immediately; there
  // is no "save" step anywhere in this app.
  const update = useCallback((patch) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      writeStored(next);
      return next;
    });
  }, []);

  const setDayIndex = useCallback((i) => {
    setDayIndexRaw(i);
    update({ selectedDay: i });   // kept in the record for compatibility
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [update]);

  const setTextScale = (v) => {
    setTextScaleRaw(v);
    writeTextScale(v);
  };

  // Another tab of this app changed the record — pick it up.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'familyPrayer') setState(loadState());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const day = useMemo(() => buildDay(state, dayIndex), [state, dayIndex]);
  const tally = weekTally(state.prayed);
  const prayedThatDay = dayIndex <= todayDayIndex() && Boolean(state.prayed?.[isoForDayIndex(dayIndex)]);
  const isKids = state.mode === 'kids' && !state.spokenView;

  const markPrayedToday = () => {
    update({ prayed: { ...state.prayed, [isoDate()]: true } });
  };

  // Rebuilding a whole prayer in the puzzle counts as praying it, and
  // also marks it "learned" (first date kept) for the prayer picker.
  const puzzleAmen = () => {
    const key = day?.learnKey;
    update({
      prayed: { ...state.prayed, [isoDate()]: true },
      learned: key && !state.learned?.[key]
        ? { ...state.learned, [key]: isoDate() }
        : state.learned,
    });
  };

  // Choose this week's prayer by hand. The rotation carries on from
  // whichever one you pick.
  const choosePrayer = (i) => {
    update({ prayerIndex: i, prayerRef: prayers[i].ref, prayerTheme: prayers[i].theme });
  };

  const togglePrayedDay = (i) => {
    if (i > todayDayIndex()) return;
    const iso = isoForDayIndex(i);
    const prayed = { ...state.prayed };
    if (prayed[iso]) delete prayed[iso];
    else prayed[iso] = true;
    update({ prayed });
  };

  const savePetition = (text) => {
    const entry = {
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      names: day?.logNames || '',
      text,
      prayer: prayers[state.prayerIndex].ref,
    };
    update({ log: [...(state.log || []), entry] });
  };

  const newWeek = () => {
    const next = createWeek(advance(state.prayerIndex, 1), state);
    writeStored(next);
    setState(next);
    setDayIndexRaw(todayDayIndex());
    setSheetOpen(false);
  };

  const print = (withNotes) => {
    setPrintNotes(withNotes);
    setSheetOpen(false);
    // Let React render the notes (or not) before the print dialog
    // snapshots the page.
    setTimeout(() => window.print(), 250);
  };

  return (
    <div
      className="pray-app"
      style={{ '--scale': textScale }}
    >
      <a className="to-pond" href="/" aria-label="Back to the pond">
        <span aria-hidden="true">&#8592;</span> Pond
      </a>

      <ReadingView
        day={day}
        dayIndex={dayIndex}
        setDayIndex={setDayIndex}
        prayedThatDay={prayedThatDay}
        focus={focus}
        onSavePetition={savePetition}
        isKids={isKids}
      />

      <nav className="dock" aria-label="Prayer controls">
        <button className="dock-side" onClick={() => setSheetOpen(true)} aria-haspopup="dialog">
          <OptionsIcon />
          <span>Options</span>
        </button>
        <button
          className="dock-main"
          onClick={() => setOverlay('pace')}
          disabled={!day}
        >
          <span aria-hidden="true" className="dock-main-icon">&#9655;</span>
          Pray it
        </button>
        <button
          className="dock-side"
          onClick={() => setOverlay('puzzle')}
          disabled={!day}
          aria-haspopup="dialog"
        >
          <PuzzleIcon />
          <span>Puzzle</span>
        </button>
      </nav>

      <ControlSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        state={state}
        dayIndex={dayIndex}
        setDayIndex={(i) => { setDayIndex(i); }}
        update={update}
        tally={tally}
        togglePrayedDay={togglePrayedDay}
        textScale={textScale}
        setTextScale={setTextScale}
        focus={focus}
        setFocus={setFocus}
        onNewWeek={newWeek}
        onPrint={print}
        onChoosePrayer={choosePrayer}
        celebrate={celebrate}
        setCelebrate={setCelebrate}
      />

      {overlay === 'puzzle' && day && (
        <Suspense fallback={<div className="overlay" aria-busy="true" />}>
          <PuzzleMode
            day={day}
            celebrate={celebrate}
            onClose={() => setOverlay(null)}
            onAmen={puzzleAmen}
          />
        </Suspense>
      )}

      {overlay === 'pace' && day && (
        <PaceMode
          day={day}
          celebrate={celebrate}
          onClose={() => setOverlay(null)}
          onAmen={markPrayedToday}
        />
      )}

      <PrintSheet state={state} withNotes={printNotes} />
    </div>
  );
}

function PuzzleIcon() {
  // Three tiles, one lifted out of line — a verse coming apart.
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="13" width="6" height="5" rx="1.5" />
      <rect x="10.5" y="13" width="11" height="5" rx="1.5" />
      <rect x="6" y="4" width="8" height="5" rx="1.5" transform="rotate(-10 10 6.5)" />
    </svg>
  );
}

function OptionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="17" x2="20" y2="17" />
      <circle cx="9" cy="7" r="2.4" fill="var(--paper)" />
      <circle cx="15" cy="17" r="2.4" fill="var(--paper)" />
    </svg>
  );
}
