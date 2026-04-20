import renderStatement from '../components/renderStatement.jsx';

// ═══════════════════════════════════════════════════════════════════
// Document — the review / update surface. Same data, full detail,
// numbered chapters, editorial composition. Reads the entire BOARD
// object; treated as the "full surface" fallback for content written
// in Notion.
// ═══════════════════════════════════════════════════════════════════

export default function DocumentView({ board }) {
  return (
    <div
      className="fade-up"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: '#F1E6D2',
        color: '#1C1612',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: `
            radial-gradient(ellipse 60% 35% at 20% 10%, rgba(184, 92, 56, 0.14), transparent 60%),
            radial-gradient(ellipse 50% 30% at 80% 28%, rgba(201, 162, 87, 0.18), transparent 65%),
            radial-gradient(ellipse 55% 30% at 15% 55%, rgba(94, 116, 78, 0.12), transparent 60%),
            radial-gradient(ellipse 60% 30% at 85% 78%, rgba(139, 58, 31, 0.15), transparent 65%)
          `,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.42,
          mixBlendMode: 'multiply',
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='280' height='280'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.22  0 0 0 0 0.16  0 0 0 0 0.1  0 0 0 0.38 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
        }}
      />

      <div style={{ position: 'relative', maxWidth: '920px', margin: '0 auto', padding: '2.5rem 2rem 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(28, 22, 18, 0.18)',
            paddingBottom: '1rem',
          }}
        >
          <div className="eyebrow" style={{ color: '#8B3A1F' }}>
            {board.owner} · Identity Board
          </div>
          <div className="eyebrow sans" style={{ color: '#8B3A1F', opacity: 0.75 }}>
            {board.period}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          maxWidth: '920px',
          margin: '0 auto',
          padding: 'clamp(3rem, 6vw, 5rem) 2rem',
        }}
      >
        {/* 01 IDENTITY */}
        <section style={{ marginBottom: 'clamp(5rem, 10vw, 8rem)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '1.5rem',
              marginBottom: '3rem',
            }}
          >
            <span className="chapter-num" style={{ color: '#B85C38' }}>
              01
            </span>
            <div>
              <div className="eyebrow" style={{ color: '#8B3A1F' }}>
                Identity
              </div>
              <div className="sans" style={{ fontSize: '0.85rem', color: '#6B3A24', marginTop: '0.35rem' }}>
                the slow layer · rarely changes
              </div>
            </div>
          </div>
          <div style={{ marginLeft: 'clamp(0rem, 6vw, 5rem)', marginBottom: '3.5rem' }}>
            <p
              className="display"
              style={{
                fontSize: 'clamp(1.7rem, 4.6vw, 3rem)',
                lineHeight: 1.15,
                fontWeight: 400,
                letterSpacing: '-0.015em',
              }}
            >
              {renderStatement(board.identity.statement, board.identity.heroWord)}
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '3rem',
              marginLeft: 'clamp(0rem, 6vw, 5rem)',
              maxWidth: '36rem',
            }}
          >
            {board.identity.values.map((v, i) => (
              <div key={v} style={{ borderTop: '1.5px solid #B85C38', paddingTop: '0.85rem' }}>
                <div
                  className="eyebrow"
                  style={{ color: '#B85C38', fontSize: '0.6rem', marginBottom: '0.4rem' }}
                >
                  0{i + 1}
                </div>
                <div
                  className="display"
                  style={{
                    fontSize: 'clamp(1.05rem, 2.2vw, 1.25rem)',
                    fontStyle: 'italic',
                    fontWeight: 500,
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginLeft: 'clamp(0rem, 6vw, 5rem)',
              maxWidth: '32rem',
              padding: '1.25rem 1.5rem',
              borderLeft: '2px solid #B85C38',
              background: 'rgba(184, 92, 56, 0.06)',
            }}
          >
            <p
              className="display"
              style={{ fontStyle: 'italic', fontSize: '1.05rem', lineHeight: 1.5, color: '#3E2418' }}
            >
              “{board.identity.anchor.text}”
            </p>
            <p className="eyebrow" style={{ color: '#B85C38', marginTop: '0.65rem', fontSize: '0.6rem' }}>
              {board.identity.anchor.reference}
            </p>
          </div>
        </section>

        {/* 02 SEASON */}
        <section
          style={{
            marginBottom: 'clamp(5rem, 10vw, 8rem)',
            padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem)',
            background:
              'linear-gradient(135deg, rgba(201, 162, 87, 0.22) 0%, rgba(184, 120, 56, 0.14) 60%, rgba(122, 74, 28, 0.08) 100%)',
            borderRadius: '2px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-120px',
              right: '-120px',
              width: '360px',
              height: '360px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 40% 40%, rgba(255, 215, 140, 0.6), rgba(201, 138, 62, 0.2) 55%, transparent 72%)',
              filter: 'blur(6px)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 'clamp(1.5rem, 4vw, 3rem)',
              alignItems: 'baseline',
              position: 'relative',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <span className="chapter-num" style={{ color: '#7A4E1C' }}>
                  02
                </span>
                <div>
                  <div className="eyebrow" style={{ color: '#7A4E1C' }}>
                    Season
                  </div>
                  <div
                    className="sans"
                    style={{ fontSize: '0.8rem', color: '#7A4E1C', opacity: 0.8, marginTop: '0.3rem' }}
                  >
                    refresh quarterly
                  </div>
                </div>
              </div>
              <div
                className="display display-wonk"
                style={{
                  fontSize: 'clamp(5rem, 14vw, 9.5rem)',
                  lineHeight: 0.85,
                  fontStyle: 'italic',
                  fontWeight: 500,
                  color: '#4A2A0E',
                  letterSpacing: '-0.035em',
                  marginLeft: '-0.3rem',
                }}
              >
                {board.season.heroWord}.
              </div>
            </div>
            <div style={{ paddingTop: 'clamp(0.5rem, 2vw, 2rem)' }}>
              <p
                className="display"
                style={{
                  fontSize: 'clamp(1.1rem, 2.4vw, 1.35rem)',
                  lineHeight: 1.45,
                  color: '#3E2313',
                  marginBottom: '1.75rem',
                  fontStyle: 'italic',
                }}
              >
                {board.season.sentence}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {board.season.threads.map((t) => (
                  <div key={t.label} style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                    <div
                      className="eyebrow"
                      style={{ color: '#7A4E1C', minWidth: '4.5rem', fontSize: '0.62rem' }}
                    >
                      {t.label}
                    </div>
                    <div
                      className="sans"
                      style={{ fontSize: '0.95rem', color: '#4A2F14', fontWeight: 500 }}
                    >
                      {t.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 03 COMMITMENTS */}
        <section style={{ marginBottom: 'clamp(5rem, 10vw, 8rem)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.5rem', marginBottom: '2.75rem' }}>
            <span className="chapter-num" style={{ color: '#4A5A3D' }}>
              03
            </span>
            <div>
              <div className="eyebrow" style={{ color: '#2E3A25' }}>
                Commitments
              </div>
              <div className="sans" style={{ fontSize: '0.85rem', color: '#4A5A3D', marginTop: '0.35rem' }}>
                the process · refresh monthly
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1rem',
            }}
          >
            {board.commitments.map((c, i) => (
              <article
                key={i}
                style={{
                  padding: '1.5rem 1.4rem 1.4rem',
                  background: 'rgba(94, 116, 78, 0.08)',
                  borderTop: '1.5px solid #4A5A3D',
                  borderRadius: '2px',
                  minHeight: '11rem',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: '0.75rem',
                  }}
                >
                  <span
                    className="display"
                    style={{
                      fontSize: '1.6rem',
                      color: '#4A5A3D',
                      fontWeight: 500,
                      fontVariantNumeric: 'oldstyle-nums',
                      lineHeight: 1,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="eyebrow" style={{ color: '#2E3A25', fontSize: '0.58rem' }}>
                    {c.tag}
                  </span>
                </div>
                <p
                  className="display"
                  style={{ fontSize: '1.02rem', lineHeight: 1.4, fontWeight: 500, color: '#1C1612', flex: 1 }}
                >
                  <strong style={{ fontWeight: 600, fontStyle: 'italic' }}>{c.verb}.</strong> {c.text}
                </p>
                <div
                  className="eyebrow"
                  style={{ marginTop: '1rem', color: '#4A5A3D', opacity: 0.85, fontSize: '0.6rem' }}
                >
                  ◦ {c.cadence}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 04 FRICTION */}
        <section
          style={{
            padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem)',
            background:
              'linear-gradient(180deg, rgba(62, 42, 24, 0.08) 0%, rgba(107, 66, 38, 0.16) 100%)',
            borderRadius: '2px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <span className="chapter-num" style={{ color: '#6B4226' }}>
              04
            </span>
            <div>
              <div className="eyebrow" style={{ color: '#6B4226' }}>
                Honest friction
              </div>
              <div
                className="sans"
                style={{ fontSize: '0.85rem', color: '#6B4226', marginTop: '0.35rem', opacity: 0.85 }}
              >
                name the real obstacle · refresh monthly
              </div>
            </div>
          </div>
          <p
            className="display display-wonk"
            style={{
              fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
              lineHeight: 1.2,
              fontStyle: 'italic',
              fontWeight: 500,
              color: '#3E2614',
              marginBottom: '3rem',
              maxWidth: '32rem',
            }}
          >
            “{board.friction.sentence}”
          </p>
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '3rem', maxWidth: '42rem' }}>
            {board.friction.plans.map((p, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '0.85rem',
                  padding: '1rem 1.1rem',
                  background: 'rgba(255, 250, 240, 0.4)',
                  borderLeft: '2px solid #6B4226',
                }}
              >
                <span
                  className="eyebrow"
                  style={{
                    color: '#6B4226',
                    fontSize: '0.6rem',
                    paddingTop: '0.2rem',
                    minWidth: '2.5rem',
                  }}
                >
                  If
                </span>
                <div>
                  <p
                    className="sans"
                    style={{
                      fontSize: '0.95rem',
                      color: '#3E2614',
                      fontWeight: 500,
                      marginBottom: '0.35rem',
                    }}
                  >
                    {p.trigger}
                  </p>
                  <p
                    className="display"
                    style={{
                      fontSize: '1rem',
                      fontStyle: 'italic',
                      color: '#5C3820',
                      lineHeight: 1.45,
                    }}
                  >
                    → {p.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.75rem',
              paddingTop: '2rem',
              borderTop: '1px solid rgba(107, 66, 38, 0.25)',
            }}
          >
            <div>
              <div
                className="eyebrow"
                style={{ color: '#6B4226', marginBottom: '0.75rem', fontSize: '0.6rem' }}
              >
                Prayer anchor
              </div>
              <p
                className="display"
                style={{
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  color: '#3E2614',
                  lineHeight: 1.5,
                  marginBottom: '0.5rem',
                }}
              >
                “{board.friction.prayer.text}”
              </p>
              <p className="eyebrow" style={{ color: '#6B4226', fontSize: '0.58rem', opacity: 0.85 }}>
                {board.friction.prayer.reference}
              </p>
            </div>
            <div>
              <div
                className="eyebrow"
                style={{ color: '#6B4226', marginBottom: '0.75rem', fontSize: '0.6rem' }}
              >
                Walking with
              </div>
              <p className="sans" style={{ fontSize: '0.9rem', color: '#3E2614', lineHeight: 1.6 }}>
                {board.friction.walking}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
