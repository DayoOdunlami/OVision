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
      <path d="M16.44 8.56 L18.49 8.63 L18.49 11.37 L16.44 11.44 L15.57 13.54 L16.97 15.03 L15.03 16.97 L13.54 15.57 L11.44 16.44 L11.37 18.49 L8.63 18.49 L8.56 16.44 L6.46 15.57 L4.97 16.97 L3.03 15.03 L4.43 13.54 L3.56 11.44 L1.51 11.37 L1.51 8.63 L3.56 8.56 L4.43 6.46 L3.03 4.97 L4.97 3.03 L6.46 4.43 L8.56 3.56 L8.63 1.51 L11.37 1.51 L11.44 3.56 L13.54 4.43 L15.03 3.03 L16.97 4.97 L15.57 6.46 Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

// A short haptic tick on Android: a word snaps home, a stone touches the
// water, Amen. Silent, so it's fine at 06:45.
export const tick = (ms = 10) => { try { navigator.vibrate?.(ms); } catch {} };

// The two worlds, as small marks: a koi, and a vine leaf (studio P).
export function WorldGlyph({ world, size = 22 }) {
  if (world === 'vine') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 20 C5 11 11 5 20 4 C20 13 14 19 5 20 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M5 20 C9 15 12 12 16 8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12 C7 6 14 6 18 12 C14 18 7 18 3 12 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M18 12 L22 8.5 L22 15.5 Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="7.4" cy="11" r="0.9" fill="currentColor" />
    </svg>
  );
}

// The quiet mark in the board's corner: where the board lives, and the
// way to show it in the other world on this screen.
export function WorldMark({ world, onClick }) {
  const name = world === 'vine' ? 'the vine' : 'the pond';
  return (
    <button className="icon-btn world-mark" onClick={onClick} aria-label={`Our board is in ${name}. Choose the world`} title="Choose the world">
      <WorldGlyph world={world} />
    </button>
  );
}

// What a word means, as a picture a child can choose before they can
// spell (studio P): six themes, each a small drawing.
export function ThemePicture({ theme, size = 40 }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="theme-pic">
      {theme === 'rest' && (<>
        <path d="M27 9 A11 11 0 1 0 31 25 A9 9 0 0 1 27 9 Z" {...s} />
        <path d="M6 33 C12 31 17 35 23 33 C28 31 31 34 35 33" {...s} />
      </>)}
      {theme === 'together' && (<>
        <circle cx="15" cy="17" r="5" {...s} /><circle cx="26" cy="17" r="5" {...s} />
        <path d="M6 33 C7 26 12 24 15 24 C18 24 20 25 20.5 27 C21 25 23 24 26 24 C29 24 34 26 34 33" {...s} />
      </>)}
      {theme === 'growing' && (<>
        <path d="M20 35 L20 15" {...s} />
        <path d="M20 22 C13 22 9 17 9 11 C15 11 20 15 20 22 Z" {...s} />
        <path d="M20 17 C20 10 24 6 31 6 C31 13 27 17 20 17 Z" {...s} />
        <path d="M12 35 L28 35" {...s} />
      </>)}
      {theme === 'shining' && (<>
        <circle cx="20" cy="20" r="6.5" {...s} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path key={a} d="M20 6 L20 9.5" {...s} transform={`rotate(${a} 20 20)`} />
        ))}
      </>)}
      {theme === 'giving' && (<>
        <path d="M6 24 C10 24 13 26 16 28 L24 28 C26 28 26 31 24 31 L17 31" {...s} />
        <path d="M6 33 L22 34 C26 34 30 31 34 26" {...s} />
        <path d="M24 19 C24 19 18 15 18 11.5 C18 9 21 8 24 11 C27 8 30 9 30 11.5 C30 15 24 19 24 19 Z" {...s} />
      </>)}
      {theme === 'steadfast' && (<>
        <circle cx="20" cy="12" r="7" {...s} />
        <path d="M20 19 L20 27" {...s} />
        <path d="M6 27 L34 27" {...s} />
        <path d="M20 27 C20 31 17 34 12 36 M20 27 C20 31 23 34 28 36 M20 27 L20 36" {...s} />
      </>)}
    </svg>
  );
}
