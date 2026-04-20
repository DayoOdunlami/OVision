import { useEffect, useRef } from 'react';
import OrnamentDivider from '../components/OrnamentDivider.jsx';

// ═══════════════════════════════════════════════════════════════════
// PosterAtmospheric — bold typography with rich atmospheric gradient
// mesh, paper grain, and drifting dust particles. Mood is in the
// background; letters carry solid deep colour.
// ═══════════════════════════════════════════════════════════════════

export default function PosterAtmos({ board }) {
  const canvasRef = useRef(null);

  // Drifting dust — scoped to this view. Respects prefers-reduced-motion.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    let raf;
    let particles = [];

    const setup = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      const count = Math.min(38, Math.floor(rect.width / 42));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.1,
        vy: -Math.random() * 0.22 - 0.03,
        r: Math.random() * 1.1 + 0.3,
        o: Math.random() * 0.25 + 0.08,
      }));
    };
    setup();
    window.addEventListener('resize', setup);

    const animate = () => {
      const r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -8) {
          p.y = r.height + 8;
          p.x = Math.random() * r.width;
        }
        if (p.x < -8) p.x = r.width + 8;
        if (p.x > r.width + 8) p.x = -8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(184, 92, 56, ${p.o})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', setup);
    };
  }, []);

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
      {/* Rich atmospheric mesh */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: `
            radial-gradient(ellipse 90% 50% at 50% 0%, rgba(255, 212, 140, 0.55), transparent 60%),
            radial-gradient(ellipse 60% 40% at 15% 30%, rgba(184, 92, 56, 0.35), transparent 65%),
            radial-gradient(ellipse 60% 40% at 85% 50%, rgba(201, 138, 62, 0.32), transparent 65%),
            radial-gradient(ellipse 80% 50% at 30% 75%, rgba(94, 116, 78, 0.22), transparent 65%),
            radial-gradient(ellipse 80% 60% at 80% 95%, rgba(74, 42, 14, 0.32), transparent 70%)
          `,
        }}
      />

      {/* Paper grain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.4,
          mixBlendMode: 'multiply',
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='280' height='280'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.22  0 0 0 0 0.16  0 0 0 0 0.1  0 0 0 0.36 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
        }}
      />

      <canvas
        ref={canvasRef}
        className="no-print"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />

      {/* Header strip */}
      <div style={{ position: 'relative', maxWidth: '900px', margin: '0 auto', padding: '2.5rem 2rem 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(28, 22, 18, 0.22)',
            paddingBottom: '1rem',
          }}
        >
          <div className="eyebrow" style={{ color: '#7A3E14' }}>
            {board.owner} · Identity
          </div>
          <div className="eyebrow sans" style={{ color: '#7A3E14', opacity: 0.75 }}>
            {board.period}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          maxWidth: '900px',
          margin: '0 auto',
          padding: 'clamp(3rem, 6vw, 5rem) 2rem clamp(3rem, 6vw, 5rem)',
        }}
      >
        {/* ZONE 1 — FLOURISH */}
        <section style={{ marginBottom: 'clamp(4rem, 8vw, 6rem)', textAlign: 'center' }}>
          <div className="eyebrow" style={{ color: '#8B3A1F', marginBottom: '1.5rem' }}>
            Identity · the slow layer
          </div>
          <h1
            className="hero-word"
            style={{
              fontSize: 'clamp(5rem, 20vw, 13rem)',
              color: '#7A2E10',
              marginBottom: '1.75rem',
              textShadow: '0 2px 40px rgba(184, 92, 56, 0.2)',
            }}
          >
            {board.identity.heroWord}.
          </h1>
          <p
            className="display"
            style={{
              fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
              fontStyle: 'italic',
              lineHeight: 1.5,
              color: '#3E2313',
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
              gap: '1.25rem',
              marginBottom: '1.75rem',
            }}
          >
            {board.identity.values.map((v) => (
              <div
                key={v}
                style={{
                  padding: '0.5rem 1.1rem',
                  background: 'rgba(255, 248, 232, 0.45)',
                  border: '1px solid rgba(184, 92, 56, 0.45)',
                  borderRadius: '2px',
                }}
              >
                <span
                  className="display"
                  style={{ fontStyle: 'italic', fontSize: '1rem', color: '#7A2E10', fontWeight: 500 }}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
          <p
            className="display"
            style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#8B3A1F', opacity: 0.85 }}
          >
            “{board.identity.anchor.text}” ·{' '}
            <span className="sans eyebrow" style={{ fontSize: '0.58rem', letterSpacing: '0.22em' }}>
              {board.identity.anchor.reference}
            </span>
          </p>
        </section>

        <OrnamentDivider color="#B85C38" />

        {/* ZONE 2 — FULL */}
        <section style={{ marginBottom: 'clamp(4rem, 8vw, 6rem)', textAlign: 'center' }}>
          <div className="eyebrow" style={{ color: '#7A4E1C', marginBottom: '1.5rem' }}>
            Season · refresh quarterly
          </div>
          <h2
            className="hero-word display-wonk"
            style={{
              fontSize: 'clamp(6rem, 24vw, 15rem)',
              color: '#4A2A0E',
              marginBottom: '1.5rem',
              textShadow: '0 2px 60px rgba(255, 200, 120, 0.35)',
            }}
          >
            {board.season.heroWord}.
          </h2>
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

        <OrnamentDivider color="#B85C38" />

        {/* ZONE 3 — FOUR VERBS */}
        <section style={{ marginBottom: 'clamp(4rem, 8vw, 6rem)' }}>
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
              <div key={c.verb} style={{ textAlign: 'center' }}>
                <h3
                  className="hero-word"
                  style={{
                    fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
                    color: '#2E3A25',
                    marginBottom: '0.75rem',
                  }}
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

        <OrnamentDivider color="#B85C38" />

        {/* ZONE 4 — FRICTION / MARROW */}
        <section style={{ textAlign: 'center' }}>
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
              maxWidth: '30rem',
              margin: '0 auto 0.5rem',
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
            className="hero-word"
            style={{
              fontSize: 'clamp(4rem, 14vw, 9rem)',
              color: '#8B3A1F',
              marginBottom: '2.5rem',
              textShadow: '0 2px 40px rgba(201, 107, 58, 0.35)',
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
                  background: 'rgba(255, 250, 240, 0.4)',
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

        {/* Footer */}
        <div style={{ marginTop: '4rem', textAlign: 'center' }}>
          <div className="display" style={{ color: '#B85C38', fontSize: '1rem', fontStyle: 'italic' }}>
            ✦
          </div>
          <div
            className="eyebrow"
            style={{ color: '#8B3A1F', opacity: 0.6, fontSize: '0.55rem', marginTop: '0.5rem' }}
          >
            {board.owner} · {board.period}
          </div>
        </div>
      </div>
    </div>
  );
}
