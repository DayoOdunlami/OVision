import OrnamentDivider from '../components/OrnamentDivider.jsx';
import FlourishVines from '../components/FlourishVines.jsx';
import FullSun from '../components/FullSun.jsx';

// ═══════════════════════════════════════════════════════════════════
// PosterTextured — plain paper ground, letters carry the treatment
// via CSS background-clip: text plus hand-drawn SVG ornaments
// (vines around Flourish, solar rays behind Full).
// ═══════════════════════════════════════════════════════════════════

export default function PosterTextured({ board, transparent = false }) {
  // When `transparent` is true we're rendering inside PosterPond — the
  // pond canvas provides the backdrop, so we suppress the outer paper
  // wash and the paper-grain overlay. The inner content column still
  // paints its own parchment so body text stays legible on water.
  const outerBg = transparent ? 'transparent' : '#F3EDDD';
  const columnBg = transparent
    ? 'rgba(243, 237, 221, 0.92)'
    : 'transparent';
  const columnShadow = transparent
    ? '0 24px 80px rgba(30, 14, 4, 0.35), 0 2px 0 rgba(30, 14, 4, 0.18)'
    : 'none';
  const columnRadius = transparent ? '3px' : 0;

  return (
    <div
      className="fade-up"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: outerBg,
        color: '#1C1612',
      }}
    >
      {/* Paper grain only — no atmospheric mesh */}
      {!transparent && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.45,
            mixBlendMode: 'multiply',
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.24  0 0 0 0 0.18  0 0 0 0 0.12  0 0 0 0.32 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
          }}
        />
      )}

      {/* Header strip */}
      <div
        data-pond-plate={transparent || undefined}
        style={{
          position: 'relative',
          maxWidth: '900px',
          margin: '0 auto',
          padding: '2.5rem 2rem 0',
          background: columnBg,
          backdropFilter: transparent ? 'blur(6px)' : undefined,
          WebkitBackdropFilter: transparent ? 'blur(6px)' : undefined,
          borderTopLeftRadius: columnRadius,
          borderTopRightRadius: columnRadius,
          boxShadow: transparent
            ? '0 -20px 40px rgba(30, 14, 4, 0.25)'
            : 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(28, 22, 18, 0.22)',
            paddingBottom: '1rem',
          }}
        >
          <div className="eyebrow" style={{ color: '#3E2614' }}>
            {board.owner} · Identity
          </div>
          <div className="eyebrow sans" style={{ color: '#3E2614', opacity: 0.7 }}>
            {board.period}
          </div>
        </div>
      </div>

      <div
        data-pond-plate={transparent || undefined}
        style={{
          position: 'relative',
          maxWidth: '900px',
          margin: '0 auto',
          padding: 'clamp(3rem, 6vw, 5rem) 2rem',
          background: columnBg,
          backdropFilter: transparent ? 'blur(6px)' : undefined,
          WebkitBackdropFilter: transparent ? 'blur(6px)' : undefined,
          borderBottomLeftRadius: columnRadius,
          borderBottomRightRadius: columnRadius,
          boxShadow: columnShadow,
        }}
      >
        {/* ZONE 1 — FLOURISH textured */}
        <section
          data-zone="identity"
          style={{ marginBottom: 'clamp(4rem, 8vw, 6rem)', textAlign: 'center' }}
        >
          <div className="eyebrow" style={{ color: '#4A5A3D', marginBottom: '1.5rem' }}>
            Identity · the slow layer
          </div>
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              marginBottom: '1.75rem',
              width: '100%',
              maxWidth: '900px',
            }}
          >
            <FlourishVines />
            <h1
              className="hero-word tx-flourish"
              style={{
                fontSize: 'clamp(5rem, 20vw, 13rem)',
                margin: 0,
                position: 'relative',
                zIndex: 1,
                animation: 'glowPulse 6s ease-in-out infinite',
              }}
            >
              {board.identity.heroWord}.
            </h1>
          </div>
          <p
            className="display"
            style={{
              fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
              fontStyle: 'italic',
              lineHeight: 1.5,
              color: '#2E3A25',
              maxWidth: '34rem',
              margin: '0 auto 2rem',
              fontWeight: 400,
            }}
          >
            {board.identity.statement}
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1.75rem',
            }}
          >
            {board.identity.values.map((v) => (
              <div
                key={v}
                style={{ padding: '0.45rem 1rem', border: '1px solid #4A5A3D', borderRadius: '2px' }}
              >
                <span
                  className="display"
                  style={{ fontStyle: 'italic', fontSize: '0.95rem', color: '#2E3A25', fontWeight: 500 }}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
          <p
            className="display"
            style={{ fontSize: '0.88rem', fontStyle: 'italic', color: '#3E2614', opacity: 0.85 }}
          >
            “{board.identity.anchor.text}” ·{' '}
            <span className="sans eyebrow" style={{ fontSize: '0.58rem', letterSpacing: '0.22em' }}>
              {board.identity.anchor.reference}
            </span>
          </p>
        </section>

        <OrnamentDivider color="#7A4E1C" />

        {/* ZONE 2 — FULL textured (radiant) */}
        <section
          data-zone="season"
          style={{ marginBottom: 'clamp(4rem, 8vw, 6rem)', textAlign: 'center' }}
        >
          <div className="eyebrow" style={{ color: '#7A4E1C', marginBottom: '1.5rem' }}>
            Season · refresh quarterly
          </div>
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              marginBottom: '1.5rem',
              width: '100%',
              maxWidth: '900px',
            }}
          >
            <FullSun />
            <h2
              className="hero-word tx-full display-wonk"
              style={{
                fontSize: 'clamp(6rem, 24vw, 15rem)',
                margin: 0,
                position: 'relative',
                zIndex: 1,
                animation: 'glowPulse 5s ease-in-out infinite',
              }}
            >
              {board.season.heroWord}.
            </h2>
          </div>
          <p
            className="display"
            style={{
              fontSize: 'clamp(1.05rem, 2.3vw, 1.25rem)',
              fontStyle: 'italic',
              lineHeight: 1.5,
              color: '#3E2313',
              maxWidth: '34rem',
              margin: '0 auto 1.75rem',
            }}
          >
            {board.season.sentence}
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem',
            }}
          >
            {board.season.threads.map((t, i) => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span className="eyebrow" style={{ color: '#7A4E1C', fontSize: '0.58rem' }}>
                  {t.label}
                </span>
                <span
                  className="display"
                  style={{ fontStyle: 'italic', fontSize: '0.9rem', color: '#4A2F14', fontWeight: 500 }}
                >
                  {t.note}
                </span>
                {i < board.season.threads.length - 1 && (
                  <span style={{ color: '#B89968', marginLeft: '1rem' }}>·</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <OrnamentDivider color="#4A5A3D" />

        {/* ZONE 3 — FOUR VERBS */}
        <section data-zone="commitments" style={{ marginBottom: 'clamp(4rem, 8vw, 6rem)' }}>
          <div
            className="eyebrow"
            style={{ color: '#2E3A25', marginBottom: '2rem', textAlign: 'center' }}
          >
            Commitments · this month
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {board.commitments.map((c) => (
              <div
                key={c.verb}
                data-zone={`commit-${c.verb.toLowerCase()}`}
                style={{ textAlign: 'center' }}
              >
                <h3
                  className="hero-word tx-verb"
                  style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', marginBottom: '0.75rem' }}
                >
                  {c.verb}.
                </h3>
                <p
                  className="sans"
                  style={{
                    fontSize: '0.78rem',
                    color: '#4A5A3D',
                    lineHeight: 1.45,
                    fontWeight: 500,
                    marginBottom: '0.5rem',
                  }}
                >
                  {c.text}
                </p>
                <span
                  className="eyebrow"
                  style={{ color: '#4A5A3D', opacity: 0.75, fontSize: '0.55rem' }}
                >
                  ◦ {c.cadence}
                </span>
              </div>
            ))}
          </div>
        </section>

        <OrnamentDivider color="#6B4226" />

        {/* ZONE 4 — FRICTION / MARROW textured */}
        <section data-zone="friction" style={{ textAlign: 'center' }}>
          <div className="eyebrow" style={{ color: '#6B4226', marginBottom: '1.25rem' }}>
            Honest friction
          </div>
          <p
            className="display display-wonk"
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              fontStyle: 'italic',
              lineHeight: 1.25,
              color: '#3E2614',
              marginBottom: '0.5rem',
              fontWeight: 500,
            }}
          >
            I know the words.
          </p>
          <p
            className="display"
            style={{
              fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
              fontStyle: 'italic',
              color: '#4A2E18',
              marginBottom: '0.25rem',
              fontWeight: 400,
            }}
          >
            I want them in my
          </p>
          <h4
            className="hero-word tx-marrow"
            style={{
              fontSize: 'clamp(4rem, 14vw, 9rem)',
              marginBottom: '2.5rem',
              animation: 'glowPulse 7s ease-in-out infinite',
            }}
          >
            {board.friction.heroWord}.
          </h4>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
              maxWidth: '42rem',
              margin: '0 auto 2rem',
            }}
          >
            {board.friction.plans.map((p, i) => (
              <div
                key={i}
                style={{
                  padding: '1rem 1.1rem',
                  background: 'rgba(62, 38, 20, 0.06)',
                  borderLeft: '2px solid #6B4226',
                  textAlign: 'left',
                }}
              >
                <p
                  className="sans"
                  style={{ fontSize: '0.8rem', color: '#6B4226', fontWeight: 600, marginBottom: '0.3rem' }}
                >
                  If — {p.trigger}
                </p>
                <p
                  className="display"
                  style={{ fontStyle: 'italic', fontSize: '0.88rem', color: '#3E2614', lineHeight: 1.45 }}
                >
                  → {p.action}
                </p>
              </div>
            ))}
          </div>

          <p
            className="display"
            style={{
              fontStyle: 'italic',
              fontSize: '0.88rem',
              color: '#6B4226',
              maxWidth: '28rem',
              margin: '0 auto 0.4rem',
              lineHeight: 1.55,
            }}
          >
            “{board.friction.prayer.text}”
          </p>
          <p className="eyebrow" style={{ color: '#6B4226', fontSize: '0.55rem', opacity: 0.85 }}>
            {board.friction.prayer.reference}
          </p>
        </section>

        <div style={{ marginTop: '4rem', textAlign: 'center' }}>
          <div className="display" style={{ color: '#6B4226', fontSize: '1rem', fontStyle: 'italic' }}>
            ✦
          </div>
          <div
            className="eyebrow"
            style={{ color: '#3E2614', opacity: 0.6, fontSize: '0.55rem', marginTop: '0.5rem' }}
          >
            {board.owner} · {board.period}
          </div>
        </div>
      </div>
    </div>
  );
}
