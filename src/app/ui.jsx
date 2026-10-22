import { KOI } from './household.js';

// ═══════════════════════════════════════════════════════════════════
// ui.jsx — the few shared pieces. A person is always their koi (drawn,
// in their own variety's colours) and their name: no avatars, no icons.
// ═══════════════════════════════════════════════════════════════════

export function KoiGlyph({ koi = 'kohaku', size = 28, turn = 0 }) {
  const c = KOI[koi] || KOI.kohaku;
  const dark = ['showa', 'hiUtsuri', 'karasu'].includes(koi);
  return (
    <svg className="koi-glyph" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={{ transform: `rotate(${turn}deg)` }}>
      <path d="M11 17 C6 15 5 19 9 21 Z M29 17 C34 15 35 19 31 21 Z" fill={c.body} opacity="0.7" />
      <path d="M20 31 C24 34 27 38 26 39 C23 37 21 36 20 35 C19 36 17 37 14 39 C13 38 16 34 20 31 Z" fill={c.body} opacity="0.8" />
      <path d="M20 3 C27 7 28.5 17 25.5 25 C23.6 30 21.2 33 20 34 C18.8 33 16.4 30 14.5 25 C11.5 17 13 7 20 3 Z" fill={c.body} stroke={dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.16)'} strokeWidth="0.8" />
      <circle cx="20.5" cy="12" r="4.2" fill={c.accent} />
      <circle cx="18.6" cy="21.5" r="3" fill={c.accent} opacity="0.9" />
      {c.spot && <circle cx="22" cy="26" r="1.7" fill={c.spot} />}
      <circle cx="17.6" cy="7.6" r="0.9" fill="#111" opacity="0.6" />
      <circle cx="22.4" cy="7.6" r="0.9" fill="#111" opacity="0.6" />
    </svg>
  );
}

// Tap who's here. Big targets, their own colours, their own names.
export function Faces({ people, selected, onToggle, big = false, forKids = false }) {
  return (
    <div className={'faces' + (big ? ' faces-big' : '')} role="group" aria-label="Who's here">
      {people.map((p) => {
        const on = selected.includes(p.id);
        return (
          <button
            key={p.id}
            type="button"
            className={'face' + (on ? ' is-on' : '')}
            aria-pressed={on}
            onClick={() => onToggle(p.id)}
            style={{ '--koi': KOI[p.koi]?.turn || '#888' }}
          >
            <span className="face-pool"><KoiGlyph koi={p.koi} size={big ? 44 : 34} /></span>
            <span className="face-name">{forKids && p.short ? p.short : p.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Dots({ count, at }) {
  return (
    <div className="dots" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <i key={i} className={i === at ? 'is-on' : i < at ? 'is-past' : ''} />
      ))}
    </div>
  );
}

export function CloseButton({ onClick, label = 'Back to the pond' }) {
  return (
    <button className="icon-btn" onClick={onClick} aria-label={label} title={label}>
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path d="M4 4 L14 14 M14 4 L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function Gear() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 2.5v2.2M10 15.3v2.2M2.5 10h2.2M15.3 10h2.2M4.7 4.7l1.6 1.6M13.7 13.7l1.6 1.6M4.7 15.3l1.6-1.6M13.7 6.3l1.6-1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// A short haptic tick on Android: a word snaps home, a stone touches the
// water, Amen. Silent, so it's fine at 06:45.
export const tick = (ms = 10) => { try { navigator.vibrate?.(ms); } catch {} };
