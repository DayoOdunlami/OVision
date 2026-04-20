// ═══════════════════════════════════════════════════════════════════
// ViewToggle — fixed floating control for switching between
// identity-board variants (Atmos / Textured / Pond / Document) and
// the separate Family Board.
//
// The Family Board is visually and tonally distinct (dark teal pond,
// not warm paper), so it's separated with a divider in the control
// rather than pretending it's another view of the same thing.
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

export default function ViewToggle({ view, setView }) {
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
