import { useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════
// SharedStyles — global CSS for the identity-board views (Atmos /
// Textured / Pond / Document). Injected once per app mount; idempotent.
// Also loads Fraunces + Manrope via <link>. Family Board has its own
// styling and is unaffected.
// ═══════════════════════════════════════════════════════════════════

export default function SharedStyles() {
  useEffect(() => {
    if (document.getElementById('ib-fonts')) return;
    const l = document.createElement('link');
    l.id = 'ib-fonts';
    l.rel = 'stylesheet';
    l.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..900,0..100,0..1;1,9..144,300..900,0..100,0..1&family=Manrope:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(l);
  }, []);

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

      /* Textured word fills (background-clip: text) */
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
        /* Pond view: translucent parchment plates fall back to solid
           paper so print captures the textured poster look. */
        [data-pond-plate] {
          background: #F3EDDD !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .fade-up { animation: none !important; }
      }
    `}</style>
  );
}
