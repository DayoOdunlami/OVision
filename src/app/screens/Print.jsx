import { home } from '../route.js';
import { prayers } from '../content/prayers.js';
import { WEEKDAYS } from '../calendar.js';
import { niceWeekRange } from '../calendar.js';
import { peopleOf, andNames } from '../household.js';

// ═══════════════════════════════════════════════════════════════════
// Print — the week on a card. Monks managed for centuries with a page
// by the bed; some mornings the page is better than the phone.
// ═══════════════════════════════════════════════════════════════════

const SLOT = '<span class="slot">&nbsp;</span>';
const blank = {
  pair: `${SLOT} and ${SLOT}`, pairSubj: `${SLOT} and ${SLOT}`, pairPossessive: `${SLOT} and ${SLOT}'s`,
  they: 'they', them: 'them', their: 'their', themselves: 'themselves', theyP: 'they', themP: 'them', theirP: 'their',
  selfIncluded: false,
};

export default function Print({ day }) {
  const prayer = prayers[day.prayerIdx];
  const text = prayer.flowing.solo(blank).split('\n\n');
  return (
    <div className="room room-paper print" role="dialog" aria-modal="true" aria-label="This week on paper">
      <div className="room-top no-print">
        <button className="btn btn-quiet" onClick={home}>Back</button>
        <button className="btn btn-primary" onClick={() => window.print()}>Print</button>
      </div>
      <article className="card">
        <header>
          <p className="label">This week · {niceWeekRange(day.week)}</p>
          <h1 className="card-word">{day.verse.word}</h1>
          <blockquote className="scripture">{day.verse.verse}</blockquote>
          <p className="scripture-ref">{day.verse.ref}</p>
        </header>
        <ul className="card-rota">
          {day.rota.map((ids, k) => (
            <li key={k}><span>{WEEKDAYS[k]}</span><b>{k === 6 ? 'All of us' : andNames(peopleOf(day.household, ids))}</b></li>
          ))}
        </ul>
        <section className="card-prayer">
          <p className="label">The prayer · {prayer.ref}</p>
          {text.map((p, k) => <p key={k} dangerouslySetInnerHTML={{ __html: p }} />)}
        </section>
        <footer>
          <p>Wandered? Come back with the word: <b>{day.verse.word}</b>. {day.verse.breath[0]} / {day.verse.breath[1]}.</p>
        </footer>
      </article>
    </div>
  );
}
