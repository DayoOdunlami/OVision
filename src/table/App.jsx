import { useMemo, useState } from 'react';
import Glance from './Glance.jsx';
import Pray from './Pray.jsx';
import Puzzle from './Puzzle.jsx';
import { Home, Season, Week, Welcome } from './pages.jsx';
import {
  boot,
  defaultSelected,
  ensureWeek,
  isoDate,
  isSunday,
  joinNames,
  mondayIso,
  personName,
  prayedForIds,
  recordLearned,
  recordSitting,
  satMap,
  save,
  seasonKey,
  weekVerse,
  weeksFor,
} from './model.js';

export default function App() {
  const bootOnce = useMemo(() => boot(window.location.search), []);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [state, setState] = useState(bootOnce.state);
  const [view, setView] = useState(bootOnce.view);
  const [now] = useState(bootOnce.now);
  const [at] = useState(bootOnce.at);
  const [selected, setSelected] = useState(() => defaultSelected(bootOnce.state, bootOnce.at, bootOnce.now));
  const [prayKey, setPrayKey] = useState(0);
  const [startAt, setStartAt] = useState(bootOnce.at === 'setdown' ? 'down' : 'start');
  const reduced = params.has('still') || document.documentElement.dataset.motion === 'off';
  const night = document.documentElement.dataset.time === 'night';
  const season = seasonKey(state.board.season, params.get('season'));

  const people = state.household.people;
  const today = isoDate(now);
  const monday = mondayIso(now);
  const forceSunday = at === 'sunday' || isSunday(now);
  const verse = people.length ? weekVerse(state, monday) : weekVerse(state, monday);
  const forIds = prayedForIds(state, now, forceSunday);
  const pairNames = joinNames(forIds.map((id) => personName(state, id)));
  const pairLabel = forceSunday ? 'The whole household.' : `Holding ${pairNames}.`;
  const sat = satMap(state, today);
  const prayed = people.filter((p) => sat[p.id]);
  const pending = people.filter((p) => selected.includes(p.id) && !sat[p.id]);
  const withChildren = people.some((p) => selected.includes(p.id) && p.kind === 'child');
  const voice = withChildren ? 'together' : 'silent';
  const allSelectedSat = selected.length > 0 && pending.length === 0;
  const puzzleReady = allSelectedSat && withChildren;
  const primaryIsPray = !allSelectedSat;
  const satLine = prayed.length
    ? `${joinNames(prayed.map((p) => p.name))} prayed this earlier.`
    : '';
  const newVerse = Boolean(verse && state.seenVerseId && state.seenVerseId !== verse.id);

  function commit(next) {
    save(next);
    setState(next);
  }

  function toggle(id) {
    setSelected((cur) => {
      if (cur.includes(id)) {
        if (cur.length === 1) return cur;
        return cur.filter((x) => x !== id);
      }
      return [...cur, id];
    });
  }

  function amen(putDown) {
    const next = structuredClone(state);
    ensureWeek(next, monday);
    recordSitting(next, today, selected, putDown);
    next.seenVerseId = verse.id;
    commit(next);
  }

  function learned() {
    const next = structuredClone(state);
    recordLearned(next, monday, selected.length ? selected : people.map((p) => p.id));
    next.seenVerseId = verse.id;
    commit(next);
  }

  function begin({ people: nextPeople, board }) {
    const next = structuredClone(state);
    next.household.people = nextPeople;
    next.board = board;
    ensureWeek(next, monday);
    next.seenVerseId = weekVerse(next, monday).id;
    commit(next);
    setSelected(defaultSelected(next, '', now));
    setView('home');
  }

  function saveSeason({ people: nextPeople, board }) {
    const next = structuredClone(state);
    next.household.people = nextPeople;
    next.board = board;
    commit(next);
    setSelected((cur) => {
      const ids = nextPeople.map((p) => p.id);
      const kept = cur.filter((id) => ids.includes(id));
      return kept.length ? kept : ids.slice(0, 1);
    });
    setView('home');
  }

  if (view === 'welcome') {
    return <Welcome onBegin={begin} />;
  }
  if (view === 'pray') {
    return (
      <Pray
        key={prayKey}
        verse={verse}
        pairNames={pairNames}
        voice={voice}
        liturgy={forceSunday ? 'sunday' : 'day'}
        withChildren={withChildren}
        startAt={startAt}
        onClose={() => setView('home')}
        onAmen={amen}
        onFall={() => setView('puzzle')}
      />
    );
  }
  if (view === 'puzzle') {
    return (
      <Puzzle
        verse={verse}
        reduced={reduced}
        onClose={() => setView('home')}
        onLearned={learned}
      />
    );
  }
  if (view === 'glance') {
    return (
      <Glance
        word={state.board.word}
        verseLine={verse.clauses[0]}
        todayLine={forceSunday ? 'Today · everyone' : `Today · ${pairNames}`}
        people={people}
        pairIds={forIds}
        night={night}
        season={season}
        reduced={reduced}
        onClose={() => setView('home')}
      />
    );
  }
  if (view === 'week') {
    return (
      <Week
        state={state}
        now={now}
        weeks={weeksFor(state, now)}
        onHome={() => setView('home')}
        onSeason={() => setView('season')}
      />
    );
  }
  if (view === 'season') {
    return <Season state={state} onHome={() => setView('home')} onSave={saveSeason} />;
  }

  return (
    <Home
      now={now}
      verse={verse}
      pairLabel={pairLabel}
      people={people}
      selected={selected}
      satLine={satLine}
      newVerse={newVerse}
      primary={primaryIsPray ? 'Pray' : (puzzleReady ? 'Let the words fall' : '')}
      quietLabel={allSelectedSat ? 'Pray again' : ''}
      fallLabel={allSelectedSat && !puzzleReady ? 'Let the words fall' : ''}
      onPrimary={() => {
        if (primaryIsPray) {
          setStartAt('start');
          setPrayKey((k) => k + 1);
          setView('pray');
        } else setView('puzzle');
      }}
      onFall={() => setView('puzzle')}
      onQuiet={() => {
        setStartAt('start');
        setPrayKey((k) => k + 1);
        setView('pray');
      }}
      onToggle={toggle}
      onGlance={() => setView('glance')}
      onWeek={() => setView('week')}
      onSeason={() => setView('season')}
    />
  );
}
