import { lazy, Suspense } from 'react';
import PondView from './pond/PondView.jsx';
import { useMoment } from './moment.js';

// ═══════════════════════════════════════════════════════════════════
// World — where the board lives: the pond or the vine (studio P).
//
// The family chooses at the end of the ritual; any device can show the
// other (the corner mark on the board, or Settings), and remembers. The
// same board, the same meanings, in whichever world is showing: the
// home and idle screen, each person's board, the ritual's finale, and
// under every paper room (paused, its palette on the paper). The prayer
// itself stays paper.
// ═══════════════════════════════════════════════════════════════════

const VineView = lazy(() => import('./vine/VineView.jsx'));

export default function World({ day, focus = null, paused = false, compact }) {
  const moment = useMoment();
  const world = moment?.world || day.world;
  const waiting = moment?.kind === 'waiting';
  const props = {
    board: waiting ? null : day.board,
    people: day.people,
    todayIds: day.todayIds,
    todayYes: day.todayYes,
    pads: waiting ? [] : day.pads,
    weeks: day.pads.length,
    heart: day.heartCount,
    progress: day.progress,
    light: day.light,
    hour: day.clock.getHours() + day.clock.getMinutes() / 60,
    season: day.seasonName,
    paused,
    focus,
    moment,
    compact,
    grown: true,
  };
  if (world === 'vine') {
    return (
      <Suspense fallback={<div className="pond-canvas world-wait" />}>
        <VineView {...props} />
      </Suspense>
    );
  }
  return <PondView {...props} />;
}
