import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import World from './World.jsx';
import Home from './screens/Home.jsx';
import Sitting from './screens/Sitting.jsx';
import Welcome from './screens/Welcome.jsx';
import Setup from './screens/Setup.jsx';
import Season from './screens/Season.jsx';
import NewSeason from './screens/NewSeason.jsx';
import Settings from './screens/Settings.jsx';
import Join from './screens/Join.jsx';
import Person from './screens/Person.jsx';
import Weigh from './screens/Weigh.jsx';
import WorldSheet from './screens/WorldSheet.jsx';
import { useStore, useDevice, isDemo, replaceAll, getState, forgetDemo, setDevice } from './store.js';
import { deriveToday } from './today.js';
import { buildDemo } from './demo.js';
import { useRoute, go } from './route.js';
import { isChild } from './household.js';

// Heavy rooms load only when opened: the puzzle brings matter-js, and
// Into the deep its own scene.
const Play = lazy(() => import('./play/Play.jsx'));
const Deep = lazy(() => import('./deep/Deep.jsx'));
const Print = lazy(() => import('./screens/Print.jsx'));

// ── The example family ───────────────────────────────────────────────
// Every deep link with ?demo=1 starts the example fresh for the moment
// it points at (so ?h=6.75 has Dad not yet prayed, and ?h=19 has him
// prayed this morning). Moving around inside the app keeps what you do.
if (isDemo) {
  const sig = window.location.search;
  let stale = true;
  try { stale = sessionStorage.getItem('qw.demo.sig') !== sig || !getState().household; } catch {}
  if (stale) {
    const { state, device } = buildDemo();
    replaceAll(state, device);
    try { sessionStorage.setItem('qw.demo.sig', sig); } catch {}
  }
}
// ?world=vine (or pond): show this screen's board in that world, and
// remember it on this device, as the switch would.
{
  const w = new URLSearchParams(window.location.search).get('world');
  if (w === 'pond' || w === 'vine') setDevice((d) => (d.world === w ? d : { ...d, world: w }));
}

const THEME = { day: '#8ec9c0', dawn: '#c9c3cc', dusk: '#4a6261', night: '#0b1426' };

export default function App() {
  const state = useStore();
  const device = useDevice();
  const route = useRoute();
  const [tick, setTick] = useState(0);

  // The light and the day move on by themselves; look again each minute.
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60000);
    const onVis = () => document.visibilityState === 'visible' && setTick((n) => n + 1);
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const day = useMemo(() => deriveToday(state, device), [state, device, tick]);

  // A phone shows fewer words in the world than a tablet (the budget).
  const [compact, setCompact] = useState(() => window.innerWidth < 700);
  useEffect(() => {
    const on = () => setCompact(window.innerWidth < 700);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.light = day.light;
    root.dataset.world = day.world;
    root.className = day.light === 'night' ? 'night' : '';
    root.style.setProperty('--text-scale', String(device.textScale || 1));
    root.dataset.big = (device.textScale || 1) >= 1.5 ? '1' : '';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME[day.light]);
  }, [day.light, day.world, device.textScale]);

  // A household carried over from another device.
  const join = new URLSearchParams(window.location.search).get('join');

  let screen = null;
  let overlay = false;      // a paper room over the world: pause it
  let focus = null;         // someone's own board: the world turns to them
  const path = route.path;

  if (join) {
    screen = <Join raw={join} />;
    overlay = true;
  } else if (!state.household && !['setup'].includes(path)) {
    screen = <Welcome />;
  } else if (path === 'setup') {
    screen = <Setup />;
    overlay = true;
  } else if (path === 'pray') {
    screen = <Sitting day={day} query={route.query} />;
    overlay = true;
  } else if (path === 'play') {
    screen = <Play day={day} query={route.query} />;
    overlay = true;
  } else if (path === 'deep') {
    screen = <Deep day={day} query={route.query} />;
    overlay = true;
  } else if (path === 'season') {
    screen = <Season day={day} />;
    overlay = true;
  } else if (path === 'season/new') {
    screen = <NewSeason day={day} />;
    overlay = !route.query.finale;
  } else if (path === 'me') {
    screen = <Person day={day} id={route.query.p} />;
    focus = day.people.some((p) => p.id === route.query.p) ? route.query.p : null;
  } else if (path === 'weigh') {
    screen = <Weigh day={day} />;
    overlay = true;
  } else if (path === 'world') {
    screen = <WorldSheet day={day} />;
  } else if (path === 'settings') {
    screen = <Settings day={day} />;
    overlay = true;
  } else if (path === 'print') {
    screen = <Print day={day} />;
    overlay = true;
  } else {
    screen = <Home day={day} idleNow={route.query.idle === '1' || new URLSearchParams(window.location.search).get('idle') === '1'} />;
  }

  return (
    <div className={'app' + (isDemo ? ' is-demo' : '')}>
      <World day={day} paused={overlay} focus={focus} compact={compact} />
      <Suspense fallback={<div className="room-loading" />}>{screen}</Suspense>
      {isDemo && !overlay && (path === 'home' || path === '') && <DemoRibbon />}
    </div>
  );
}

function DemoRibbon() {
  const [open, setOpen] = useState(false);
  return (
    <div className={'demo-ribbon' + (open ? ' is-open' : '')}>
      <button className="demo-tag" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        Example family
      </button>
      {open && (
        <div className="demo-menu">
          <p>An invented household with six weeks behind it. Nothing here touches your own.</p>
          <button className="link" onClick={() => { forgetDemo(); window.location.href = '/'; }}>
            Leave the example
          </button>
        </div>
      )}
    </div>
  );
}

export { go, isChild };
