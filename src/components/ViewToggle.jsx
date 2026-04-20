import { useEffect, useRef, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════
// ViewToggle — top chrome for the identity board.
//
// Two responsibilities:
//   1. WHICH board is shown  — the member picker (Dayo / Claire /
//      Kids / Family). Hidden on the Family Board view because that
//      one has its own data model.
//   2. HOW that board is shown — the view variant row (Atmosphere /
//      Textured / Pond / Document / Family).
//
// Member picker sits top-left, view picker top-right, so they don't
// compete for attention and the eye can treat them as separate axes.
// The member picker collapses to a small name chip on mobile; the
// view picker is always pill-shaped and identical to the old layout.
// ═══════════════════════════════════════════════════════════════════

const IDENTITY_VIEWS = [
  { id: 'poster-atmos', label: 'Atmosphere' },
  { id: 'poster-text',  label: 'Textured' },
  { id: 'poster-pond',  label: 'Pond' },
  { id: 'document',     label: 'Document' },
];

const FAMILY_VIEWS = [
  { id: 'family', label: 'Family' },
];

export default function ViewToggle({
  view,
  setView,
  members,
  memberId,
  setMemberId,
  showMemberPicker = true,
}) {
  return (
    <>
      {showMemberPicker && (
        <MemberPicker
          members={members}
          memberId={memberId}
          setMemberId={setMemberId}
        />
      )}
      <ViewPicker view={view} setView={setView} />
    </>
  );
}

// ── Member picker ────────────────────────────────────────────────
// Dropdown-style control. Collapsed state: a small chip showing the
// current member's name. Opening it reveals a stack of options, each
// with a draft badge if the member's board is still placeholder
// content. Outside clicks close the dropdown.
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
    <div
      ref={rootRef}
      className="no-print"
      style={{
        position: 'fixed',
        top: '1.25rem',
        left: '1.25rem',
        zIndex: 50,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="sans"
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0.45rem 0.9rem 0.45rem 0.7rem',
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(28, 22, 18, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: '#F1E6D2',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(28, 22, 18, 0.25)',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: active?.draft ? '#b08f4a' : '#6fb38a',
            boxShadow: '0 0 0 2px rgba(255,255,255,0.08)',
          }}
        />
        <span style={{ opacity: 0.65, fontWeight: 500 }}>Board</span>
        <span>{active?.name || '—'}</span>
        <span aria-hidden="true" style={{ opacity: 0.55, marginLeft: 2 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          style={{
            listStyle: 'none',
            margin: '6px 0 0',
            padding: 4,
            minWidth: 200,
            background: 'rgba(28, 22, 18, 0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
          }}
        >
          {members.map((m) => {
            const selected = m.id === memberId;
            return (
              <li key={m.id}>
                <button
                  role="option"
                  aria-selected={selected}
                  onClick={() => { setMemberId(m.id); setOpen(false); }}
                  className="sans"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.74rem',
                    fontWeight: selected ? 700 : 500,
                    letterSpacing: '0.03em',
                    color: selected ? '#1C1612' : '#F1E6D2',
                    background: selected ? '#F1E6D2' : 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: m.draft ? '#b08f4a' : '#6fb38a',
                    }}
                  />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block' }}>{m.name}</span>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.62rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        opacity: 0.7,
                        fontWeight: 500,
                      }}
                    >
                      {m.role}
                    </span>
                  </span>
                  {m.draft && (
                    <span
                      style={{
                        fontSize: '0.6rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: selected ? 'rgba(176, 143, 74, 0.25)' : 'rgba(176, 143, 74, 0.35)',
                        color: selected ? '#5a4420' : '#e8d4a0',
                      }}
                    >
                      Draft
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── View picker ──────────────────────────────────────────────────
function ViewPicker({ view, setView }) {
  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        top: '1.25rem',
        right: '1.25rem',
        zIndex: 50,
        display: 'flex',
        gap: '2px',
        padding: '3px',
        background: 'rgba(28, 22, 18, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '999px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 20px rgba(28, 22, 18, 0.25)',
      }}
    >
      {IDENTITY_VIEWS.map((o) => (
        <ToggleButton key={o.id} option={o} active={view === o.id} onClick={() => setView(o.id)} />
      ))}
      <div
        aria-hidden="true"
        style={{
          width: '1px',
          margin: '4px 4px',
          background: 'rgba(255,255,255,0.18)',
        }}
      />
      {FAMILY_VIEWS.map((o) => (
        <ToggleButton key={o.id} option={o} active={view === o.id} onClick={() => setView(o.id)} />
      ))}
    </div>
  );
}

function ToggleButton({ option, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="sans"
      style={{
        padding: '0.45rem 0.9rem',
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.05em',
        borderRadius: '999px',
        border: 'none',
        cursor: 'pointer',
        background: active ? '#F1E6D2' : 'transparent',
        color: active ? '#1C1612' : '#F1E6D2',
        transition: 'all 0.25s ease',
      }}
    >
      {option.label}
    </button>
  );
}
