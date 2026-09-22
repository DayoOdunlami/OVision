import { useEffect, useRef, useState } from 'react';
import { PRAY_URL } from '../data/prayerLink.js';

// ═══════════════════════════════════════════════════════════════════
// ViewToggle — top chrome for the Pond surface.
//
// Three responsibilities:
//   1. WHICH board is shown — the member picker (Dayo / Claire /
//      Kids / Family), top-left.
//   2. HOW that board is shown — Pond or Document, top-right.
//   3. CROSSING to the other surface — the Pray link, also top-right
//      but visually separated, because it's a navigation not a view
//      switch: it leaves this React app for the static /pray/ page.
//
// Responsive: on phones the two clusters would collide, so below
// 720px the whole chrome collapses to a single compact row along the
// top, the member picker loses its role sub-labels, and the view
// labels shorten. Styling is done with real CSS (in the <style> block
// at the bottom) rather than inline, because media queries can't be
// expressed as inline styles and this chrome genuinely needs them.
// ═══════════════════════════════════════════════════════════════════

const IDENTITY_VIEWS = [
  { id: 'poster-pond', label: 'Pond',     short: 'Pond' },
  { id: 'document',    label: 'Document', short: 'Text' },
];

export default function ViewToggle({
  view,
  setView,
  members,
  memberId,
  setMemberId,
}) {
  return (
    <>
      <ChromeStyles />
      <MemberPicker
        members={members}
        memberId={memberId}
        setMemberId={setMemberId}
      />
      <ViewPicker view={view} setView={setView} />
    </>
  );
}

// ── Member picker ────────────────────────────────────────────────
// Dropdown-style control. Collapsed state: a small chip showing the
// current member's name. Opening it reveals a stack of options, each
// with a draft badge if the member's board is still placeholder
// content. Outside clicks and Escape close the dropdown.
function MemberPicker({ members, memberId, setMemberId }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const active = members?.find((m) => m.id === memberId) || members?.[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!members || members.length === 0) return null;

  return (
    <div ref={rootRef} className="no-print vb-chrome vb-chrome-left">
      <button
        onClick={() => setOpen((v) => !v)}
        className="sans vb-chip"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span
          aria-hidden="true"
          className="vb-dot"
          style={{ background: active?.draft ? '#b08f4a' : '#6fb38a' }}
        />
        <span className="vb-chip-muted vb-hide-narrow">Board</span>
        <span>{active?.name || '—'}</span>
        <span aria-hidden="true" className="vb-caret">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <ul role="listbox" className="vb-menu">
          {members.map((m) => {
            const selected = m.id === memberId;
            return (
              <li key={m.id}>
                <button
                  role="option"
                  aria-selected={selected}
                  onClick={() => { setMemberId(m.id); setOpen(false); }}
                  className={`sans vb-option${selected ? ' is-selected' : ''}`}
                >
                  <span
                    aria-hidden="true"
                    className="vb-dot"
                    style={{ background: m.draft ? '#b08f4a' : '#6fb38a' }}
                  />
                  <span className="vb-option-text">
                    <span className="vb-option-name">{m.name}</span>
                    <span className="vb-option-role">{m.role}</span>
                  </span>
                  {m.draft && <span className="vb-badge">Draft</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── View picker + surface crossing ───────────────────────────────
function ViewPicker({ view, setView }) {
  return (
    <div className="no-print vb-chrome vb-chrome-right vb-pillbar">
      {IDENTITY_VIEWS.map((o) => (
        <button
          key={o.id}
          onClick={() => setView(o.id)}
          className={`sans vb-pill${view === o.id ? ' is-active' : ''}`}
        >
          <span className="vb-hide-narrow">{o.label}</span>
          <span className="vb-only-narrow">{o.short}</span>
        </button>
      ))}

      <div aria-hidden="true" className="vb-divider" />

      {/* A real anchor, not a button: /pray/ is a separate document,
          so this is genuine navigation. Keeping it an <a> means
          long-press / open-in-new-tab / middle-click all behave. */}
      <a href="/flourish/" className="sans vb-pill vb-pill-link">
        Flourish
        <span aria-hidden="true" className="vb-arrow">↗</span>
      </a>
      <a href={PRAY_URL} className="sans vb-pill vb-pill-link">
        Pray
        <span aria-hidden="true" className="vb-arrow">↗</span>
      </a>
    </div>
  );
}

function ChromeStyles() {
  return (
    <style>{`
      .vb-chrome {
        position: fixed;
        top: 1.25rem;
        z-index: 50;
      }
      .vb-chrome-left  { left: 1.25rem; }
      .vb-chrome-right { right: 1.25rem; }

      .vb-chip, .vb-pillbar {
        background: rgba(12, 32, 36, 0.82);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 999px;
        box-shadow: 0 4px 20px rgba(4, 18, 22, 0.35);
        color: #F1E6D2;
      }

      .vb-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0.45rem 0.9rem 0.45rem 0.7rem;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        cursor: pointer;
      }
      .vb-chip-muted { opacity: 0.65; font-weight: 500; }
      .vb-caret { opacity: 0.55; margin-left: 2px; }

      .vb-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.08);
      }

      .vb-menu {
        list-style: none;
        margin: 6px 0 0;
        padding: 4px;
        min-width: 200px;
        background: rgba(12, 32, 36, 0.94);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.42);
      }

      .vb-option {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0.55rem 0.75rem;
        font-size: 0.74rem;
        font-weight: 500;
        letter-spacing: 0.03em;
        color: #F1E6D2;
        background: transparent;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        text-align: left;
      }
      .vb-option.is-selected {
        background: #F1E6D2;
        color: #0c2024;
        font-weight: 700;
      }
      .vb-option-text  { flex: 1; }
      .vb-option-name  { display: block; }
      .vb-option-role  {
        display: block;
        font-size: 0.62rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        opacity: 0.7;
        font-weight: 500;
      }
      .vb-badge {
        font-size: 0.6rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 2px 6px;
        border-radius: 4px;
        background: rgba(176, 143, 74, 0.35);
        color: #e8d4a0;
      }
      .vb-option.is-selected .vb-badge {
        background: rgba(176, 143, 74, 0.25);
        color: #5a4420;
      }

      .vb-pillbar {
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 3px;
      }
      .vb-pill {
        padding: 0.45rem 0.9rem;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        border-radius: 999px;
        border: none;
        cursor: pointer;
        background: transparent;
        color: #F1E6D2;
        transition: background 0.25s ease, color 0.25s ease;
        text-decoration: none;
        white-space: nowrap;
      }
      .vb-pill.is-active { background: #F1E6D2; color: #0c2024; }
      .vb-pill-link {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: #ffe0b0;
      }
      .vb-pill-link:hover { background: rgba(255, 224, 176, 0.14); }
      .vb-arrow { opacity: 0.7; font-size: 0.66rem; }

      .vb-divider {
        width: 1px;
        align-self: stretch;
        margin: 4px 4px;
        background: rgba(255, 255, 255, 0.18);
      }

      .vb-only-narrow { display: none; }

      /* Phones: the two clusters collide at full size, so shrink the
         type, drop the "Board" prefix and the role sub-labels, and use
         the short view labels. Also pull both clusters in tight to the
         corners and respect the iOS safe-area inset. */
      @media (max-width: 720px) {
        .vb-chrome       { top: calc(0.6rem + env(safe-area-inset-top, 0px)); }
        .vb-chrome-left  { left: calc(0.6rem + env(safe-area-inset-left, 0px)); }
        .vb-chrome-right { right: calc(0.6rem + env(safe-area-inset-right, 0px)); }
        .vb-chip, .vb-pill { font-size: 0.66rem; padding: 0.4rem 0.6rem; }
        .vb-chip { gap: 6px; }
        .vb-hide-narrow  { display: none; }
        .vb-only-narrow  { display: inline; }
        .vb-menu         { min-width: 168px; }
        .vb-option-role  { display: none; }
        /* Three surfaces now (Pond, Flourish, Pray): drop the arrows. */
        .vb-arrow        { display: none; }
      }

      /* Touch targets: on any device without a fine pointer, pad the
         controls out to a comfortable tap size even though the type
         stays small. iPad especially — the chrome is reachable with a
         thumb and shouldn't need aiming. */
      @media (hover: none) {
        .vb-chip, .vb-pill { min-height: 38px; }
        .vb-option         { min-height: 42px; }
      }
    `}</style>
  );
}
