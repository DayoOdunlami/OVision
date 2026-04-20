import { useEffect, useRef, useState } from 'react'

// ═══════════════════════════════════════════════════════════════════
// BOARD DATA — single source of truth. All three views read from this.
// ═══════════════════════════════════════════════════════════════════

const BOARD = {
  owner: 'Dayo',
  period: 'Spring 2026',

  identity: {
    statement:
      'I exist to help the people and things around me flourish — and to flourish myself — to the glory of God.',
    heroWord: 'Flourish',
    values: ['Creativity', 'Joy', 'Faithfulness'],
    anchor: {
      text: 'Apart from me you can do nothing.',
      reference: 'John 15:5',
    },
  },

  season: {
    heroWord: 'Full',
    sentence:
      'Filling up before I pour out — more of God, stronger body, making what I make properly seen.',
    threads: [
      { label: 'Spirit', note: 'More of God' },
      { label: 'Body', note: 'Stronger, trained' },
      { label: 'Craft', note: 'Properly seen' },
    ],
  },

  commitments: [
    { verb: 'Pray',  text: 'Ephesians 1:18 over Claire and the kids each morning.',                 cadence: 'Daily',  tag: 'Prayer' },
    { verb: 'Train', text: 'HYROX programming — twice protected, three the target.',                cadence: 'Weekly', tag: 'Body'   },
    { verb: 'Show',  text: 'Thirty minutes showing, not just building.',                            cadence: 'Weekly', tag: 'Craft'  },
    { verb: 'Cook',  text: 'One family meal. Phone down. Fully present.',                           cadence: 'Weekly', tag: 'Home'   },
  ],

  friction: {
    sentence: 'I know the words. I want them in my marrow.',
    heroWord: 'marrow',
    plans: [
      { trigger: 'After gratitude and Bible reading', action: 'Five minutes of silence. No phone. Just sit.' },
      { trigger: 'When I notice I am in head-mode on a passage', action: 'Stop. Pray it instead of processing it.' },
    ],
    prayer: {
      text: 'that Christ may dwell in your hearts through faith… to know this love that surpasses knowledge.',
      reference: 'Ephesians 3:17–19',
    },
    walking:
      'Weekly check-in with Claire. Gap to fill: a man at Grace London who is allowed to ask the hard questions.',
  },
}

// ═══════════════════════════════════════════════════════════════════

export default function IdentityBoard() {
  const [view, setView] = useState('poster-atmos')
  const canvasRef = useRef(null)

  // Fonts
  useEffect(() => {
    if (document.getElementById('ib-fonts')) return
    const l = document.createElement('link')
    l.id = 'ib-fonts'
    l.rel = 'stylesheet'
    l.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..900,0..100,0..1;1,9..144,300..900,0..100,0..1&family=Manrope:wght@300;400;500;600;700&display=swap'
    document.head.appendChild(l)
  }, [])

  // Dust particles — only on atmospheric variants
  useEffect(() => {
    if (view === 'poster-text') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf, particles = []

    const setup = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      const count = Math.min(38, Math.floor(rect.width / 42))
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.1,
        vy: -Math.random() * 0.22 - 0.03,
        r: Math.random() * 1.1 + 0.3,
        o: Math.random() * 0.25 + 0.08,
      }))
    }
    setup()
    window.addEventListener('resize', setup)

    const animate = () => {
      const r = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, r.width, r.height)
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy
        if (p.y < -8) { p.y = r.height + 8; p.x = Math.random() * r.width }
        if (p.x < -8) p.x = r.width + 8
        if (p.x > r.width + 8) p.x = -8
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(184, 92, 56, ${p.o})`
        ctx.fill()
      })
      raf = requestAnimationFrame(animate)
    }
    animate()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', setup) }
  }, [view])

  return (
    <>
      <SharedStyles />
      <ViewToggle view={view} setView={setView} />

      {view === 'document' && <DocumentView />}
      {view === 'poster-atmos' && <PosterAtmospheric canvasRef={canvasRef} />}
      {view === 'poster-text' && <PosterTextured />}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════════════════════

function SharedStyles() {
  return (
    <style>{`
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes glowPulse {
        0%, 100% { filter: brightness(1) saturate(1); }
        50%      { filter: brightness(1.08) saturate(1.05); }
      }
      .fade-up { animation: fadeUp 1.2s cubic-bezier(0.22, 1, 0.36, 1) both; }

      .display {
        font-family: 'Fraunces', 'Iowan Old Style', Georgia, serif;
        font-variation-settings: "SOFT" 30, "WONK" 0, "opsz" 120;
      }
      .display-wonk { font-variation-settings: "SOFT" 60, "WONK" 1, "opsz" 144; }
      .display-sharp { font-variation-settings: "SOFT" 0, "WONK" 0, "opsz" 144; }
      .sans { font-family: 'Manrope', -apple-system, sans-serif; }

      .eyebrow {
        font-family: 'Manrope', sans-serif;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        font-weight: 600;
        font-size: 0.68rem;
      }

      .chapter-num {
        font-family: 'Fraunces', serif;
        font-variation-settings: "SOFT" 0, "WONK" 0, "opsz" 144;
        font-style: italic;
        font-weight: 400;
        font-size: clamp(3.5rem, 9vw, 5.5rem);
        line-height: 0.9;
      }

      .hero-word {
        font-family: 'Fraunces', serif;
        font-variation-settings: "SOFT" 40, "WONK" 1, "opsz" 144;
        font-style: italic;
        font-weight: 600;
        line-height: 0.85;
        letter-spacing: -0.035em;
      }

      /* Textured word fills */
      .tx-flourish {
        background: linear-gradient(175deg, #5C3820 0%, #4A5A3D 35%, #6B8A4E 70%, #8FA65C 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        -webkit-text-fill-color: transparent;
      }
      .tx-full {
        background: radial-gradient(ellipse at 35% 40%, #FFEBC1 0%, #F0B660 28%, #C9824A 55%, #7A3E14 95%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        -webkit-text-fill-color: transparent;
      }
      .tx-verb {
        background: linear-gradient(180deg, #2E3A25 0%, #4A5A3D 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        -webkit-text-fill-color: transparent;
      }
      .tx-marrow {
        background: radial-gradient(ellipse at 50% 55%, #F0B070 0%, #C96B3A 25%, #8B3A1F 55%, #4A1E0C 90%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        -webkit-text-fill-color: transparent;
      }

      @keyframes sway {
        0%, 100% { transform: rotate(-1.5deg); }
        50%      { transform: rotate(1.5deg); }
      }
      @keyframes raysRotate {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes raysPulse {
        0%, 100% { opacity: 0.35; }
        50%      { opacity: 0.55; }
      }

      @media print {
        .no-print { display: none !important; }
        body { background: #F1E6D2 !important; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        section { break-inside: avoid; }
      }
    `}</style>
  )
}

// ═══════════════════════════════════════════════════════════════════
// VIEW TOGGLE
// ═══════════════════════════════════════════════════════════════════

function ViewToggle({ view, setView }) {
  const options = [
    { id: 'poster-atmos', label: 'Atmosphere' },
    { id: 'poster-text',  label: 'Textured' },
    { id: 'document',     label: 'Document' },
  ]
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
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => setView(o.id)}
          className="sans"
          style={{
            padding: '0.45rem 0.9rem',
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            borderRadius: '999px',
            border: 'none',
            cursor: 'pointer',
            background: view === o.id ? '#F1E6D2' : 'transparent',
            color: view === o.id ? '#1C1612' : '#F1E6D2',
            transition: 'all 0.25s ease',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// VIEW 1 — POSTER · ATMOSPHERIC
// Bold typography doing the work. Background is a swappable mood layer.
// ═══════════════════════════════════════════════════════════════════

function PosterAtmospheric({ canvasRef }) {
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
      {/* Rich atmospheric mesh — swap this block to change mood */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          position: 'absolute',
          inset: 0,
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
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />

      {/* Header strip */}
      <div
        style={{
          position: 'relative',
          maxWidth: '900px',
          margin: '0 auto',
          padding: '2.5rem 2rem 0',
        }}
      >
        <div
          className="flex items-baseline justify-between"
          style={{ borderBottom: '1px solid rgba(28, 22, 18, 0.22)', paddingBottom: '1rem' }}
        >
          <div className="eyebrow" style={{ color: '#7A3E14' }}>
            {BOARD.owner} · Identity
          </div>
          <div className="eyebrow sans" style={{ color: '#7A3E14', opacity: 0.75 }}>
            {BOARD.period}
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
            {BOARD.identity.heroWord}.
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
            {BOARD.identity.statement}
          </p>
          <div
            className="flex items-center justify-center flex-wrap"
            style={{ gap: '1.25rem', marginBottom: '1.75rem' }}
          >
            {BOARD.identity.values.map((v, i) => (
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
                  style={{
                    fontStyle: 'italic',
                    fontSize: '1rem',
                    color: '#7A2E10',
                    fontWeight: 500,
                  }}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
          <p
            className="display"
            style={{
              fontSize: '0.9rem',
              fontStyle: 'italic',
              color: '#8B3A1F',
              opacity: 0.85,
            }}
          >
            “{BOARD.identity.anchor.text}” · <span className="sans eyebrow" style={{ fontSize: '0.58rem', letterSpacing: '0.22em' }}>{BOARD.identity.anchor.reference}</span>
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
            {BOARD.season.heroWord}.
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
            {BOARD.season.sentence}
          </p>
          <div
            className="flex items-center justify-center flex-wrap"
            style={{ gap: '1.5rem' }}
          >
            {BOARD.season.threads.map((t, i) => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span className="eyebrow" style={{ color: '#7A4E1C', fontSize: '0.58rem' }}>
                  {t.label}
                </span>
                <span className="display" style={{ fontStyle: 'italic', fontSize: '0.9rem', color: '#4A2F14', fontWeight: 500 }}>
                  {t.note}
                </span>
                {i < BOARD.season.threads.length - 1 && (
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
            {BOARD.commitments.map((c) => (
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

        {/* ZONE 4 — BONES */}
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
            marrow.
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
            {BOARD.friction.plans.map((p, i) => (
              <div
                key={i}
                style={{
                  padding: '1rem 1.1rem',
                  background: 'rgba(255, 250, 240, 0.4)',
                  borderLeft: '2px solid #6B4226',
                  textAlign: 'left',
                }}
              >
                <p className="sans" style={{ fontSize: '0.8rem', color: '#6B4226', fontWeight: 600, marginBottom: '0.3rem' }}>
                  If — {p.trigger}
                </p>
                <p className="display" style={{ fontStyle: 'italic', fontSize: '0.88rem', color: '#3E2614', lineHeight: 1.45 }}>
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
            “{BOARD.friction.prayer.text}”
          </p>
          <p className="eyebrow" style={{ color: '#6B4226', fontSize: '0.55rem', opacity: 0.85 }}>
            {BOARD.friction.prayer.reference}
          </p>
        </section>

        {/* Footer */}
        <div style={{ marginTop: '4rem', textAlign: 'center' }}>
          <div className="display" style={{ color: '#B85C38', fontSize: '1rem', fontStyle: 'italic' }}>✦</div>
          <div className="eyebrow" style={{ color: '#8B3A1F', opacity: 0.6, fontSize: '0.55rem', marginTop: '0.5rem' }}>
            {BOARD.owner} · {BOARD.period}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// VIEW 2 — POSTER · TEXTURED
// Letters carry visual treatment. Ground is plain paper.
// ═══════════════════════════════════════════════════════════════════

function PosterTextured() {
  return (
    <div
      className="fade-up"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: '#F3EDDD',
        color: '#1C1612',
      }}
    >
      {/* Just paper grain — no atmospheric mesh */}
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

      {/* Header strip */}
      <div
        style={{
          position: 'relative',
          maxWidth: '900px',
          margin: '0 auto',
          padding: '2.5rem 2rem 0',
        }}
      >
        <div
          className="flex items-baseline justify-between"
          style={{ borderBottom: '1px solid rgba(28, 22, 18, 0.22)', paddingBottom: '1rem' }}
        >
          <div className="eyebrow" style={{ color: '#3E2614' }}>
            {BOARD.owner} · Identity
          </div>
          <div className="eyebrow sans" style={{ color: '#3E2614', opacity: 0.7 }}>
            {BOARD.period}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          maxWidth: '900px',
          margin: '0 auto',
          padding: 'clamp(3rem, 6vw, 5rem) 2rem',
        }}
      >
        {/* ZONE 1 — FLOURISH textured */}
        <section style={{ marginBottom: 'clamp(4rem, 8vw, 6rem)', textAlign: 'center' }}>
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
            {/* Rising vine — top-left, arcing over */}
            <svg
              viewBox="0 0 900 500"
              preserveAspectRatio="xMinYMid meet"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            >
              {/* Left vine — rises, arcs, small leaves */}
              <g
                style={{
                  transformOrigin: '80px 450px',
                  animation: 'sway 9s ease-in-out infinite',
                }}
              >
                <path
                  d="M 40,460 Q 70,400 95,350 Q 115,300 135,260 Q 150,215 170,185 Q 195,160 225,155"
                  fill="none"
                  stroke="#3E4F2F"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.72"
                />
                {/* Leaves along the vine */}
                <path
                  d="M 110,320 Q 85,305 80,280 Q 102,283 115,305 Z"
                  fill="#5E7A45"
                  opacity="0.7"
                />
                <path
                  d="M 145,245 Q 168,230 180,208 Q 180,238 162,258 Z"
                  fill="#6B8A4E"
                  opacity="0.65"
                />
                <path
                  d="M 210,175 Q 185,170 175,150 Q 200,147 218,162 Z"
                  fill="#5E7A45"
                  opacity="0.68"
                />
                {/* Small tendril curl */}
                <path
                  d="M 225,155 Q 245,148 248,160 Q 240,170 230,163"
                  fill="none"
                  stroke="#3E4F2F"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </g>

              {/* Right vine — trailing from upper-right, curling down */}
              <g
                style={{
                  transformOrigin: '820px 120px',
                  animation: 'sway 11s ease-in-out infinite reverse',
                }}
              >
                <path
                  d="M 860,100 Q 830,150 790,195 Q 755,240 720,275 Q 695,310 680,345"
                  fill="none"
                  stroke="#3E4F2F"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                <path
                  d="M 805,190 Q 828,175 838,152 Q 838,182 820,200 Z"
                  fill="#6B8A4E"
                  opacity="0.65"
                />
                <path
                  d="M 745,260 Q 720,255 710,235 Q 735,230 753,248 Z"
                  fill="#5E7A45"
                  opacity="0.68"
                />
                <path
                  d="M 690,320 Q 710,308 720,320 Q 712,335 698,330"
                  fill="none"
                  stroke="#3E4F2F"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </g>
            </svg>

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
              {BOARD.identity.heroWord}.
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
            {BOARD.identity.statement}
          </p>
          <div
            className="flex items-center justify-center flex-wrap"
            style={{ gap: '0.75rem', marginBottom: '1.75rem' }}
          >
            {BOARD.identity.values.map((v) => (
              <div
                key={v}
                style={{
                  padding: '0.45rem 1rem',
                  border: '1px solid #4A5A3D',
                  borderRadius: '2px',
                }}
              >
                <span className="display" style={{ fontStyle: 'italic', fontSize: '0.95rem', color: '#2E3A25', fontWeight: 500 }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
          <p className="display" style={{ fontSize: '0.88rem', fontStyle: 'italic', color: '#3E2614', opacity: 0.85 }}>
            “{BOARD.identity.anchor.text}” · <span className="sans eyebrow" style={{ fontSize: '0.58rem', letterSpacing: '0.22em' }}>{BOARD.identity.anchor.reference}</span>
          </p>
        </section>

        <OrnamentDivider color="#7A4E1C" />

        {/* ZONE 2 — FULL textured (radiant) */}
        <section style={{ marginBottom: 'clamp(4rem, 8vw, 6rem)', textAlign: 'center' }}>
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
            {/* Solar rays behind the word */}
            <svg
              viewBox="-300 -300 600 600"
              preserveAspectRatio="xMidYMid meet"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(90%, 680px)',
                aspectRatio: '1',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            >
              <defs>
                <radialGradient id="sunCore" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFE4B0" stopOpacity="0.55" />
                  <stop offset="40%" stopColor="#F0B660" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#C9824A" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="sunHalo" cx="50%" cy="50%" r="50%">
                  <stop offset="60%" stopColor="#D4954A" stopOpacity="0" />
                  <stop offset="85%" stopColor="#D4954A" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#D4954A" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Central glow */}
              <circle cx="0" cy="0" r="260" fill="url(#sunCore)" />
              <circle cx="0" cy="0" r="260" fill="url(#sunHalo)" />

              {/* Rays — slow rotation */}
              <g
                style={{
                  transformOrigin: '0 0',
                  animation: 'raysRotate 180s linear infinite, raysPulse 8s ease-in-out infinite',
                }}
              >
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i / 24) * Math.PI * 2
                  const isLong = i % 2 === 0
                  const start = 130
                  const end = isLong ? 275 : 210
                  return (
                    <line
                      key={i}
                      x1={Math.cos(angle) * start}
                      y1={Math.sin(angle) * start}
                      x2={Math.cos(angle) * end}
                      y2={Math.sin(angle) * end}
                      stroke="#D4954A"
                      strokeWidth={isLong ? 1.2 : 0.7}
                      strokeLinecap="round"
                      opacity={isLong ? 0.55 : 0.35}
                    />
                  )
                })}
              </g>
            </svg>

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
              {BOARD.season.heroWord}.
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
            {BOARD.season.sentence}
          </p>
          <div className="flex items-center justify-center flex-wrap" style={{ gap: '1.5rem' }}>
            {BOARD.season.threads.map((t, i) => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span className="eyebrow" style={{ color: '#7A4E1C', fontSize: '0.58rem' }}>{t.label}</span>
                <span className="display" style={{ fontStyle: 'italic', fontSize: '0.9rem', color: '#4A2F14', fontWeight: 500 }}>{t.note}</span>
                {i < BOARD.season.threads.length - 1 && <span style={{ color: '#B89968', marginLeft: '1rem' }}>·</span>}
              </div>
            ))}
          </div>
        </section>

        <OrnamentDivider color="#4A5A3D" />

        {/* ZONE 3 — Four verbs, all with same textured treatment */}
        <section style={{ marginBottom: 'clamp(4rem, 8vw, 6rem)' }}>
          <div className="eyebrow" style={{ color: '#2E3A25', marginBottom: '2rem', textAlign: 'center' }}>
            Commitments · this month
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {BOARD.commitments.map((c) => (
              <div key={c.verb} style={{ textAlign: 'center' }}>
                <h3
                  className="hero-word tx-verb"
                  style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', marginBottom: '0.75rem' }}
                >
                  {c.verb}.
                </h3>
                <p className="sans" style={{ fontSize: '0.78rem', color: '#4A5A3D', lineHeight: 1.45, fontWeight: 500, marginBottom: '0.5rem' }}>
                  {c.text}
                </p>
                <span className="eyebrow" style={{ color: '#4A5A3D', opacity: 0.75, fontSize: '0.55rem' }}>◦ {c.cadence}</span>
              </div>
            ))}
          </div>
        </section>

        <OrnamentDivider color="#6B4226" />

        {/* ZONE 4 — BONES textured */}
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
            marrow.
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
            {BOARD.friction.plans.map((p, i) => (
              <div
                key={i}
                style={{
                  padding: '1rem 1.1rem',
                  background: 'rgba(62, 38, 20, 0.06)',
                  borderLeft: '2px solid #6B4226',
                  textAlign: 'left',
                }}
              >
                <p className="sans" style={{ fontSize: '0.8rem', color: '#6B4226', fontWeight: 600, marginBottom: '0.3rem' }}>
                  If — {p.trigger}
                </p>
                <p className="display" style={{ fontStyle: 'italic', fontSize: '0.88rem', color: '#3E2614', lineHeight: 1.45 }}>
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
            “{BOARD.friction.prayer.text}”
          </p>
          <p className="eyebrow" style={{ color: '#6B4226', fontSize: '0.55rem', opacity: 0.85 }}>
            {BOARD.friction.prayer.reference}
          </p>
        </section>

        <div style={{ marginTop: '4rem', textAlign: 'center' }}>
          <div className="display" style={{ color: '#6B4226', fontSize: '1rem', fontStyle: 'italic' }}>✦</div>
          <div className="eyebrow" style={{ color: '#3E2614', opacity: 0.6, fontSize: '0.55rem', marginTop: '0.5rem' }}>
            {BOARD.owner} · {BOARD.period}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// VIEW 3 — DOCUMENT
// The review/update view. Same data, full detail.
// ═══════════════════════════════════════════════════════════════════

function DocumentView() {
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
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.42, mixBlendMode: 'multiply',
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='280' height='280'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.22  0 0 0 0 0.16  0 0 0 0 0.1  0 0 0 0.38 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
        }}
      />

      <div style={{ position: 'relative', maxWidth: '920px', margin: '0 auto', padding: '2.5rem 2rem 0' }}>
        <div className="flex items-baseline justify-between" style={{ borderBottom: '1px solid rgba(28, 22, 18, 0.18)', paddingBottom: '1rem' }}>
          <div className="eyebrow" style={{ color: '#8B3A1F' }}>{BOARD.owner} · Identity Board</div>
          <div className="eyebrow sans" style={{ color: '#8B3A1F', opacity: 0.75 }}>{BOARD.period}</div>
        </div>
      </div>

      <div style={{ position: 'relative', maxWidth: '920px', margin: '0 auto', padding: 'clamp(3rem, 6vw, 5rem) 2rem' }}>
        {/* 01 IDENTITY */}
        <section style={{ marginBottom: 'clamp(5rem, 10vw, 8rem)' }}>
          <div className="flex items-baseline" style={{ gap: '1.5rem', marginBottom: '3rem' }}>
            <span className="chapter-num" style={{ color: '#B85C38' }}>01</span>
            <div>
              <div className="eyebrow" style={{ color: '#8B3A1F' }}>Identity</div>
              <div className="sans" style={{ fontSize: '0.85rem', color: '#6B3A24', marginTop: '0.35rem' }}>the slow layer · rarely changes</div>
            </div>
          </div>
          <div style={{ marginLeft: 'clamp(0rem, 6vw, 5rem)', marginBottom: '3.5rem' }}>
            <p className="display" style={{ fontSize: 'clamp(1.7rem, 4.6vw, 3rem)', lineHeight: 1.15, fontWeight: 400, letterSpacing: '-0.015em' }}>
              {renderStatement(BOARD.identity.statement, BOARD.identity.heroWord)}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '3rem', marginLeft: 'clamp(0rem, 6vw, 5rem)', maxWidth: '36rem' }}>
            {BOARD.identity.values.map((v, i) => (
              <div key={v} style={{ borderTop: '1.5px solid #B85C38', paddingTop: '0.85rem' }}>
                <div className="eyebrow" style={{ color: '#B85C38', fontSize: '0.6rem', marginBottom: '0.4rem' }}>0{i + 1}</div>
                <div className="display" style={{ fontSize: 'clamp(1.05rem, 2.2vw, 1.25rem)', fontStyle: 'italic', fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginLeft: 'clamp(0rem, 6vw, 5rem)', maxWidth: '32rem', padding: '1.25rem 1.5rem', borderLeft: '2px solid #B85C38', background: 'rgba(184, 92, 56, 0.06)' }}>
            <p className="display" style={{ fontStyle: 'italic', fontSize: '1.05rem', lineHeight: 1.5, color: '#3E2418' }}>
              “{BOARD.identity.anchor.text}”
            </p>
            <p className="eyebrow" style={{ color: '#B85C38', marginTop: '0.65rem', fontSize: '0.6rem' }}>{BOARD.identity.anchor.reference}</p>
          </div>
        </section>

        {/* 02 SEASON */}
        <section style={{
          marginBottom: 'clamp(5rem, 10vw, 8rem)',
          padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem)',
          background: 'linear-gradient(135deg, rgba(201, 162, 87, 0.22) 0%, rgba(184, 120, 56, 0.14) 60%, rgba(122, 74, 28, 0.08) 100%)',
          borderRadius: '2px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-120px', right: '-120px', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%, rgba(255, 215, 140, 0.6), rgba(201, 138, 62, 0.2) 55%, transparent 72%)', filter: 'blur(6px)', pointerEvents: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'clamp(1.5rem, 4vw, 3rem)', alignItems: 'baseline', position: 'relative' }}>
            <div>
              <div className="flex items-baseline" style={{ gap: '1.25rem', marginBottom: '1.5rem' }}>
                <span className="chapter-num" style={{ color: '#7A4E1C' }}>02</span>
                <div>
                  <div className="eyebrow" style={{ color: '#7A4E1C' }}>Season</div>
                  <div className="sans" style={{ fontSize: '0.8rem', color: '#7A4E1C', opacity: 0.8, marginTop: '0.3rem' }}>refresh quarterly</div>
                </div>
              </div>
              <div className="display display-wonk" style={{ fontSize: 'clamp(5rem, 14vw, 9.5rem)', lineHeight: 0.85, fontStyle: 'italic', fontWeight: 500, color: '#4A2A0E', letterSpacing: '-0.035em', marginLeft: '-0.3rem' }}>
                {BOARD.season.heroWord}.
              </div>
            </div>
            <div style={{ paddingTop: 'clamp(0.5rem, 2vw, 2rem)' }}>
              <p className="display" style={{ fontSize: 'clamp(1.1rem, 2.4vw, 1.35rem)', lineHeight: 1.45, color: '#3E2313', marginBottom: '1.75rem', fontStyle: 'italic' }}>
                {BOARD.season.sentence}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {BOARD.season.threads.map((t) => (
                  <div key={t.label} style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                    <div className="eyebrow" style={{ color: '#7A4E1C', minWidth: '4.5rem', fontSize: '0.62rem' }}>{t.label}</div>
                    <div className="sans" style={{ fontSize: '0.95rem', color: '#4A2F14', fontWeight: 500 }}>{t.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 03 COMMITMENTS */}
        <section style={{ marginBottom: 'clamp(5rem, 10vw, 8rem)' }}>
          <div className="flex items-baseline" style={{ gap: '1.5rem', marginBottom: '2.75rem' }}>
            <span className="chapter-num" style={{ color: '#4A5A3D' }}>03</span>
            <div>
              <div className="eyebrow" style={{ color: '#2E3A25' }}>Commitments</div>
              <div className="sans" style={{ fontSize: '0.85rem', color: '#4A5A3D', marginTop: '0.35rem' }}>the process · refresh monthly</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {BOARD.commitments.map((c, i) => (
              <article key={i} style={{ padding: '1.5rem 1.4rem 1.4rem', background: 'rgba(94, 116, 78, 0.08)', borderTop: '1.5px solid #4A5A3D', borderRadius: '2px', minHeight: '11rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
                  <span className="display" style={{ fontSize: '1.6rem', color: '#4A5A3D', fontWeight: 500, fontVariantNumeric: 'oldstyle-nums', lineHeight: 1 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="eyebrow" style={{ color: '#2E3A25', fontSize: '0.58rem' }}>{c.tag}</span>
                </div>
                <p className="display" style={{ fontSize: '1.02rem', lineHeight: 1.4, fontWeight: 500, color: '#1C1612', flex: 1 }}>
                  <strong style={{ fontWeight: 600, fontStyle: 'italic' }}>{c.verb}.</strong> {c.text}
                </p>
                <div className="eyebrow" style={{ marginTop: '1rem', color: '#4A5A3D', opacity: 0.85, fontSize: '0.6rem' }}>◦ {c.cadence}</div>
              </article>
            ))}
          </div>
        </section>

        {/* 04 FRICTION */}
        <section style={{
          padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem)',
          background: 'linear-gradient(180deg, rgba(62, 42, 24, 0.08) 0%, rgba(107, 66, 38, 0.16) 100%)',
          borderRadius: '2px',
        }}>
          <div className="flex items-baseline" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
            <span className="chapter-num" style={{ color: '#6B4226' }}>04</span>
            <div>
              <div className="eyebrow" style={{ color: '#6B4226' }}>Honest friction</div>
              <div className="sans" style={{ fontSize: '0.85rem', color: '#6B4226', marginTop: '0.35rem', opacity: 0.85 }}>name the real obstacle · refresh monthly</div>
            </div>
          </div>
          <p className="display display-wonk" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', lineHeight: 1.2, fontStyle: 'italic', fontWeight: 500, color: '#3E2614', marginBottom: '3rem', maxWidth: '32rem' }}>
            “{BOARD.friction.sentence}”
          </p>
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '3rem', maxWidth: '42rem' }}>
            {BOARD.friction.plans.map((p, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.85rem', padding: '1rem 1.1rem', background: 'rgba(255, 250, 240, 0.4)', borderLeft: '2px solid #6B4226' }}>
                <span className="eyebrow" style={{ color: '#6B4226', fontSize: '0.6rem', paddingTop: '0.2rem', minWidth: '2.5rem' }}>If</span>
                <div>
                  <p className="sans" style={{ fontSize: '0.95rem', color: '#3E2614', fontWeight: 500, marginBottom: '0.35rem' }}>{p.trigger}</p>
                  <p className="display" style={{ fontSize: '1rem', fontStyle: 'italic', color: '#5C3820', lineHeight: 1.45 }}>→ {p.action}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.75rem', paddingTop: '2rem', borderTop: '1px solid rgba(107, 66, 38, 0.25)' }}>
            <div>
              <div className="eyebrow" style={{ color: '#6B4226', marginBottom: '0.75rem', fontSize: '0.6rem' }}>Prayer anchor</div>
              <p className="display" style={{ fontStyle: 'italic', fontSize: '0.95rem', color: '#3E2614', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                “{BOARD.friction.prayer.text}”
              </p>
              <p className="eyebrow" style={{ color: '#6B4226', fontSize: '0.58rem', opacity: 0.85 }}>{BOARD.friction.prayer.reference}</p>
            </div>
            <div>
              <div className="eyebrow" style={{ color: '#6B4226', marginBottom: '0.75rem', fontSize: '0.6rem' }}>Walking with</div>
              <p className="sans" style={{ fontSize: '0.9rem', color: '#3E2614', lineHeight: 1.6 }}>{BOARD.friction.walking}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function OrnamentDivider({ color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'clamp(2rem, 5vw, 3.5rem) 0' }}>
      <div style={{ height: '1px', width: '3rem', background: `linear-gradient(to right, transparent, ${color}66, transparent)` }} />
      <div className="display" style={{ color, fontSize: '0.9rem', fontStyle: 'italic', margin: '0 0.9rem', opacity: 0.8 }}>✦</div>
      <div style={{ height: '1px', width: '3rem', background: `linear-gradient(to right, transparent, ${color}66, transparent)` }} />
    </div>
  )
}

function renderStatement(text, emphasis) {
  if (!emphasis) return text
  const lower = text.toLowerCase()
  const idx = lower.indexOf(emphasis.toLowerCase())
  if (idx === -1) return text
  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + emphasis.length)
  const after = text.slice(idx + emphasis.length)
  return (
    <>
      {before}
      <em style={{ fontStyle: 'italic', color: '#B85C38', fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}>
        {match}
      </em>
      {after}
    </>
  )
}
