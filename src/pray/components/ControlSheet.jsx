import { useEffect, useRef, useState } from 'react';
import { FAMILY } from '../../shared/family.js';
import {
  DAY_NAMES, todayDayIndex, isoForDayIndex, TEXT_SCALES, ROTATION, CELEBRATIONS,
} from '../lib/state.js';
import { prayers } from '../data/prayers.js';
import { dayWho } from '../lib/script.js';
import { useEscape, useBodyLock } from './bits.jsx';

// ═══════════════════════════════════════════════════════════════════
// ControlSheet — every control, in one place, out of the way.
//
// A bottom sheet rather than a side drawer or a settings page because
// on a phone it's reachable with the thumb that's already holding the
// device, and because it keeps the prayer visible behind it — you can
// change the voice and watch the text change. Dismiss by tapping the
// scrim, dragging the handle down, or Escape.
//
// Order is by how often you reach for it: who (day), how (voice and
// style), then the week, then the rarely-touched housekeeping.
// ═══════════════════════════════════════════════════════════════════

export default function ControlSheet({
  open,
  onClose,
  state,
  dayIndex,
  setDayIndex,
  update,
  tally,
  togglePrayedDay,
  textScale,
  setTextScale,
  focus,
  setFocus,
  onNewWeek,
  onPrint,
  onChoosePrayer,
  celebrate,
  setCelebrate,
}) {
  const panelRef = useRef(null);
  const [dragY, setDragY] = useState(0);
  const drag = useRef(null);
  const today = todayDayIndex();

  useEscape(open, onClose);
  useBodyLock(open);

  // Reset any half-finished drag when the sheet closes.
  useEffect(() => { if (!open) setDragY(0); }, [open]);

  // Drag-to-dismiss from the handle. Past 90px (or a quick flick) it
  // closes; otherwise it springs back.
  const onHandleDown = (e) => {
    drag.current = { y: e.clientY, t: performance.now() };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onHandleMove = (e) => {
    if (!drag.current) return;
    setDragY(Math.max(0, e.clientY - drag.current.y));
  };
  const onHandleUp = (e) => {
    if (!drag.current) return;
    const dy = e.clientY - drag.current.y;
    const v = dy / Math.max(1, performance.now() - drag.current.t);
    drag.current = null;
    if (dy > 90 || v > 0.6) onClose();
    else setDragY(0);
  };

  const scaleIdx = TEXT_SCALES.indexOf(textScale);

  return (
    <div className={`sheet-root${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <div className="sheet-scrim" onClick={onClose} />
      <div
        ref={panelRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Options"
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
      >
        <div
          className="sheet-handle-hit"
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
        >
          <span className="sheet-handle" />
        </div>

        <div className="sheet-scroll">
          {/* ── Who ─────────────────────────────────────────────── */}
          <Group label="Day">
            <div className="day-grid">
              {DAY_NAMES.map((d, i) => (
                <button
                  key={d}
                  className={
                    'day-chip' +
                    (i === dayIndex ? ' is-active' : '') +
                    (i === today ? ' is-today' : '')
                  }
                  onClick={() => setDayIndex(i)}
                  aria-pressed={i === dayIndex}
                >
                  <span className="day-chip-day">{i === today ? 'Today' : d}</span>
                  <span className="day-chip-who">{dayWho(state, i)}</span>
                </button>
              ))}
            </div>
          </Group>

          {/* ── How ─────────────────────────────────────────────── */}
          <Group label="Voice">
            <Segmented
              value={state.mode}
              onChange={(mode) => update({ mode })}
              options={[
                { value: 'solo', label: 'Solo' },
                { value: 'family', label: 'Together' },
                { value: 'kids', label: 'Kids' },
              ]}
            />
          </Group>

          <Group
            label="Style"
            hint={state.spokenView
              ? 'Modern English, one thought at a time, with notes on the original language.'
              : 'The passage as continuous prayer.'}
          >
            <Segmented
              value={state.spokenView ? 'spoken' : 'flowing'}
              onChange={(v) => update({ spokenView: v === 'spoken' })}
              options={[
                { value: 'flowing', label: 'Flowing' },
                { value: 'spoken', label: 'Spoken' },
              ]}
            />
          </Group>

          <PrayerPicker
            current={state.prayerIndex}
            learned={state.learned || {}}
            onChoose={onChoosePrayer}
          />

          <Group label="Reading">
            <div className="row-split">
              <div className="size-stepper" role="group" aria-label="Text size">
                <button
                  onClick={() => setTextScale(TEXT_SCALES[Math.max(0, scaleIdx - 1)])}
                  disabled={scaleIdx <= 0}
                  aria-label="Smaller text"
                >
                  <span style={{ fontSize: '0.8em' }}>A</span>
                </button>
                <span className="size-value">{Math.round(textScale * 100)}%</span>
                <button
                  onClick={() => setTextScale(TEXT_SCALES[Math.min(TEXT_SCALES.length - 1, scaleIdx + 1)])}
                  disabled={scaleIdx >= TEXT_SCALES.length - 1}
                  aria-label="Larger text"
                >
                  <span style={{ fontSize: '1.2em' }}>A</span>
                </button>
              </div>
              <Toggle
                label="Focus"
                hint="Dim all but the line you're reading"
                on={focus}
                onChange={setFocus}
              />
            </div>
          </Group>

          {/* ── This week ───────────────────────────────────────── */}
          <Group
            label="This week"
            hint={`${tally.done} of ${tally.elapsed} day${tally.elapsed === 1 ? '' : 's'} prayed · tap a day to mark it`}
          >
            <div className="wk">
              {DAY_NAMES.map((d, i) => {
                const future = i > today;
                const done = !future && Boolean(state.prayed?.[isoForDayIndex(i)]);
                return (
                  <button
                    key={d}
                    className={'wk-dot' + (done ? ' is-done' : '') + (future ? ' is-future' : '') + (i === today ? ' is-today' : '')}
                    disabled={future}
                    onClick={() => togglePrayedDay(i)}
                    aria-label={`${d}${done ? ', prayed' : ''}`}
                    aria-pressed={done}
                  >
                    {d[0]}
                  </button>
                );
              })}
            </div>
          </Group>

          <Group label="Puzzle celebration" hint={CELEBRATE_HINTS[celebrate]}>
            <Segmented
              value={celebrate}
              onChange={setCelebrate}
              options={CELEBRATIONS}
            />
          </Group>

          {/* ── Housekeeping ────────────────────────────────────── */}
          <Group label="Praying as" hint="Solo mode says “me” and “we” when you're one of the pair.">
            <div className="chips">
              {FAMILY.map((p) => (
                <button
                  key={p.name}
                  className={'chip' + (p.name === state.selfName ? ' is-active' : '')}
                  onClick={() => update({ selfName: p.name })}
                  aria-pressed={p.name === state.selfName}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </Group>

          <RecentLog log={state.log} />

          <Group label="Week">
            <div className="meta-rows">
              <MetaRow k="Prayer" v={state.prayerRef} />
              <MetaRow k="Started" v={formatDate(state.weekStartDate)} />
            </div>
            <div className="btn-row">
              <button className="btn btn-quiet" onClick={onNewWeek}>New week &mdash; shuffle</button>
              <button className="btn btn-quiet" onClick={() => onPrint(false)}>Print rota</button>
              <button className="btn btn-quiet" onClick={() => onPrint(true)}>Print with notes</button>
            </div>
          </Group>
        </div>
      </div>
    </div>
  );
}

const CELEBRATE_HINTS = {
  recommended: 'Each verse: a ripple and a sweep of gold. The whole prayer: it gathers together, and a koi swims past.',
  quiet: 'A ripple and a sweep of gold, every time. Nothing more.',
  grand: 'Every verse gathers together, and a koi swims past.',
};

// This week's prayer. Collapsed to the current choice; open it to pick
// another. Listed in rotation order, so "next" in the list is next
// week. A ✓ marks prayers you've rebuilt end to end in the puzzle.
function PrayerPicker({ current, learned, onChoose }) {
  const cur = prayers[current];
  return (
    <section className="grp">
      <details className="picker">
        <summary className="picker-summary">
          <span className="grp-label" style={{ margin: 0 }}>This week&rsquo;s prayer</span>
          <span className="picker-current">
            <span className="picker-ref">{cur?.ref}</span>
            <span className="picker-theme">{cur?.theme}</span>
          </span>
          <span className="picker-change">Change</span>
        </summary>
        <ul className="picker-list">
          {ROTATION.map((i) => {
            const p = prayers[i];
            const isCur = i === current;
            return (
              <li key={i}>
                <button
                  className={'picker-row' + (isCur ? ' is-active' : '')}
                  onClick={() => onChoose(i)}
                  aria-pressed={isCur}
                >
                  <span className="picker-row-text">
                    <span className="picker-ref">{p.ref}</span>
                    <span className="picker-theme">{p.theme}</span>
                  </span>
                  {learned[p.ref] && (
                    <span className="picker-learned" title="Rebuilt in the puzzle">&#10003;</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </details>
    </section>
  );
}

function Group({ label, hint, children }) {
  return (
    <section className="grp">
      <h2 className="grp-label">{label}</h2>
      {children}
      {hint && <p className="grp-hint">{hint}</p>}
    </section>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="seg" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          className={'seg-opt' + (value === o.value ? ' is-active' : '')}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, hint, on, onChange }) {
  return (
    <button className="tgl" onClick={() => onChange(!on)} aria-pressed={on} title={hint}>
      <span className="tgl-label">{label}</span>
      <span className={'tgl-track' + (on ? ' is-on' : '')}><span className="tgl-knob" /></span>
    </button>
  );
}

function MetaRow({ k, v }) {
  return (
    <div className="meta-row">
      <span className="meta-k">{k}</span>
      <span className="meta-v">{v}</span>
    </div>
  );
}

function RecentLog({ log }) {
  if (!log || log.length === 0) return null;
  const recent = log.slice(-20).reverse();
  return (
    <section className="grp">
      <details className="log">
        <summary className="grp-label log-summary">
          What you&rsquo;ve prayed <span className="log-count">{log.length}</span>
        </summary>
        <ul className="log-list">
          {recent.map((e, i) => (
            <li key={i}>
              <span className="log-meta">{e.date} &middot; {e.names}</span>
              <span className="log-text">{e.text}</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
