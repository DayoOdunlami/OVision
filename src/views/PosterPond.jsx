import { useEffect, useState } from 'react';
import PondCanvas from '../pond/PondCanvas.jsx';
import FlourishZone from '../pond/zones/FlourishZone.jsx';
import FullZone from '../pond/zones/FullZone.jsx';
import CommitmentsZone from '../pond/zones/CommitmentsZone.jsx';
import MarrowZone from '../pond/zones/MarrowZone.jsx';

// ═══════════════════════════════════════════════════════════════════
// PosterPond — STAGE 3 rebuild.
//
// The pond is no longer a decorative backdrop for a parchment plate.
// Each zone has been reworked so its meaning is *carried by the pond
// itself*:
//
//   01 Flourish   — word is built from particles. Three flavours via
//                   the little control bottom-right:
//                     · Tadpoles  — koi-coloured shoal (default)
//                     · Bubbles   — translucent rising bubbles
//                     · Particle  — Tamino-style logo dots, snappy
//                   All three repel from cursor + nearby koi, then
//                   reform into the word.
//   02 Full       — hero word anchored; pellets orbit and a koi
//                   catches them, briefly scaling up. "Being filled."
//   03 Commitments — four lily pads, each labelled with a verb and a
//                   small cadence line. Bobbing, spaced like stepping
//                   stones across the pond.
//   04 marrow     — the word is live caustic water. Every ~9s, a slow
//                   ring radiates outward from it.
//
// Content stays minimal: hero words carry the weight, cadence lines
// are a light gloss, anchor verses are near-watermark. Everything
// verbose lives on the Document view.
//
// Accessibility: every canvas is aria-hidden; each zone includes a
// visually-hidden <h1>/<span> with the actual word for screen readers.
// prefers-reduced-motion is honoured in every animated component.
// ═══════════════════════════════════════════════════════════════════

// Two variants only. Both render the word as real text with a ring
// of reactive particles tracing the letter outlines; they differ only
// in ring style (soft bubble vs crisp dot). Both scatter on cursor or
// ambient koi proximity. The old 'tadpole' mode is retired.
const FLOURISH_VARIANTS = [
  { id: 'bubble',   label: 'Bubbles' },
  { id: 'particle', label: 'Particle' },
];

const FLOURISH_KEY = 'vb.pond.flourish.variant';
const DEFAULT_FLOURISH = 'bubble';

// Split "I know the words. I want them in my marrow." →
//   preText:   "I know the words."
//   statement: "I want them in my"
//   (the hero word is rendered by the canvas, so we strip it out of
//    the statement to avoid saying it twice.)
function splitMarrowSentence(sentence, heroWord) {
  if (!sentence) return {};
  const wordIdx = heroWord ? sentence.toLowerCase().lastIndexOf(heroWord.toLowerCase()) : -1;
  const beforeWord = wordIdx >= 0 ? sentence.slice(0, wordIdx).trim().replace(/[.!?,;:\s]+$/, '') : sentence;
  const parts = beforeWord.split('.').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { preText: parts[0] + '.', statement: parts.slice(1).join('. ').trim() };
  }
  return { preText: undefined, statement: parts[0] };
}

export default function PosterPond({ board }) {
  const identity = board?.identity || {};
  const season = board?.season || {};
  const commitments = board?.commitments || [];
  const friction = board?.friction || {};

  const [flourishVariant, setFlourishVariant] = useState(DEFAULT_FLOURISH);

  useEffect(() => {
    const saved = window.localStorage?.getItem(FLOURISH_KEY);
    if (saved && FLOURISH_VARIANTS.some((v) => v.id === saved)) {
      setFlourishVariant(saved);
    }
  }, []);

  const setVariant = (id) => {
    setFlourishVariant(id);
    try { window.localStorage?.setItem(FLOURISH_KEY, id); } catch {}
  };

  const cadenceFromValues = (values) =>
    Array.isArray(values) ? values.join(' · ') : undefined;

  const cadenceFromThreads = (threads) =>
    Array.isArray(threads) ? threads.map((t) => t.note || t.label).join(' · ') : undefined;

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
      }}
    >
      {/* Fixed ambient pond canvas — water, a few quiet koi, pads off
          because the Commitments zone has its own pads. */}
      <PondCanvas fishMin={3} fishMax={5} skipPads />

      {/* Content layer. position:relative + zIndex:1 so all zones sit
          above the fixed canvas. Keep plenty of vertical rhythm. */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Masthead — owner + period, tiny */}
        <header
          style={{
            paddingTop: '3vh',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.7rem',
              letterSpacing: '0.5em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.7)',
              textShadow: '0 1px 6px rgba(0,0,0,0.4)',
            }}
          >
            {board?.owner || 'Identity Board'} · {board?.period || ''}
          </div>
        </header>

        {/* 01 · Flourish */}
        <FlourishZone
          text={identity.heroWord || 'Flourish'}
          variant={flourishVariant}
          cadence={cadenceFromValues(identity.values)}
          verse={identity.anchor?.text}
          anchor={identity.anchor?.reference}
        />

        {/* 02 · Full */}
        <FullZone
          text={season.heroWord || 'Full'}
          cadence={cadenceFromThreads(season.threads)}
          verse={season.sentence}
        />

        {/* 03 · Commitments */}
        <CommitmentsZone
          title="Commitments"
          commitments={commitments}
        />

        {/* 04 · marrow */}
        <MarrowZone
          text={friction.heroWord || 'marrow'}
          {...splitMarrowSentence(friction.sentence, friction.heroWord || 'marrow')}
          cadence="Silence · Fasting · Confession"
          verse={friction.prayer?.text}
          anchor={friction.prayer?.reference}
        />

        {/* Footer breath */}
        <footer style={{ height: '14vh' }} />
      </div>

      {/* Flourish variant switch — tiny floating control, only on Pond */}
      <div
        className="no-print"
        style={{
          position: 'fixed',
          bottom: 14,
          right: 14,
          zIndex: 10,
          display: 'flex',
          gap: 4,
          padding: 4,
          background: 'rgba(10, 32, 38, 0.55)',
          backdropFilter: 'blur(6px)',
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.12)',
          fontFamily: 'Manrope, sans-serif',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
        title="Flourish zone treatment"
      >
        <span style={{ alignSelf: 'center', padding: '0 8px', color: 'rgba(255,255,255,0.55)' }}>
          Flourish
        </span>
        {FLOURISH_VARIANTS.map((v) => (
          <button
            key={v.id}
            onClick={() => setVariant(v.id)}
            style={{
              padding: '5px 10px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: flourishVariant === v.id ? 'rgba(255,255,255,0.92)' : 'transparent',
              color: flourishVariant === v.id ? '#0a2026' : 'rgba(255,255,255,0.82)',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
