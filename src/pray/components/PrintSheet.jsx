import { FAMILY } from '../../shared/family.js';
import { prayers, blessing } from '../data/prayers.js';
import { blankContext } from '../lib/context.js';
import { DAY_NAMES, todayDayIndex } from '../lib/state.js';
import { Html } from './bits.jsx';

// ═══════════════════════════════════════════════════════════════════
// PrintSheet — the paper rota. Hidden on screen, the only thing shown
// when printing. One page: who's on which day, then the week's prayer
// with blank lines where the names go, then the blessing. "With notes"
// adds the Explore text under each section.
//
// Ported from the original; the output is intended to be identical.
// ═══════════════════════════════════════════════════════════════════

export default function PrintSheet({ state, withNotes }) {
  const prayer = prayers[state.prayerIndex];
  const mode = state.mode;
  const spoken = state.spokenView;
  const today = todayDayIndex();
  const bc = blankContext();

  const rows = DAY_NAMES.map((d, i) => {
    let who;
    if (i === 6) who = 'Whole family';
    else {
      const p = state.weekPairs[i];
      who = p ? `${FAMILY[p[0]].name} & ${FAMILY[p[1]].name}` : '—';
    }
    return { d, who, isToday: i === today };
  });

  const sections = spoken
    ? prayer.sections.map((s) => ({ body: s.spoken(bc), note: s.explain(bc) }))
    : prayer.flowing[mode](bc).split('\n\n').map((body) => ({ body, note: null }));

  const blessingMode = mode === 'kids' && !spoken ? 'kids' : spoken ? 'solo' : mode;
  const blessingText = blessing.flowing[blessingMode](bc).replace(/\n/g, '<br>');
  const viewLabel = spoken ? 'Spoken' : mode.charAt(0).toUpperCase() + mode.slice(1);
  const weekOf = new Date(state.weekStartDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="print-sheet" aria-hidden="true">
      <div className="ps-header">
        <h1>Family Prayer</h1>
        <div className="ps-sub">{prayer.ref} &mdash; {prayer.theme} &nbsp;&middot;&nbsp; {viewLabel} view</div>
      </div>
      <table className="ps-rota">
        <thead><tr><th>Day</th><th>Who we pray for</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.d} className={r.isToday ? 'ps-today' : ''}>
              <td className="ps-day">{r.d}</td>
              <td>{r.who}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ps-instruction">
        Check the rota for today&rsquo;s two names, then read the prayer aloud
        {spoken ? '' : ' together'}, filling the blanks as you go.
      </div>
      <div className="ps-body">
        {sections.map((s, i) => (
          <div key={i}>
            <Html as="div" className="ps-section" html={s.body} />
            {withNotes && s.note && <Html as="div" className="ps-note" html={s.note} />}
          </div>
        ))}
      </div>
      <div className="ps-blessing">
        <Html as="div" html={blessingText} />
        <div className="ps-amen">Amen.</div>
        {withNotes && <Html as="div" className="ps-note" html={blessing.explain(bc)} />}
      </div>
      <div className="ps-footer">Week of {weekOf} &nbsp;&middot;&nbsp; {prayer.ref}</div>
    </div>
  );
}
