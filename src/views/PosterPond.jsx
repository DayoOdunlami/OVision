import { useEffect, useMemo, useState } from 'react';
import PondCanvas from '../pond/PondCanvas.jsx';
import FlourishZone from '../pond/zones/FlourishZone.jsx';
import FullZone from '../pond/zones/FullZone.jsx';
import CommitmentsZone from '../pond/zones/CommitmentsZone.jsx';
import MarrowZone from '../pond/zones/MarrowZone.jsx';
import { POND_VARIETIES } from '../SpineFish.js';

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

// Fish mix admin panel. `null` means "auto" — the pond picks a
// viewport-scaled variety rotation. An object maps variety name to
// integer count, e.g. { chagoi: 1, ogon: 1, shiro: 1 }.
const MIX_KEY = 'vb.pond.mix.counts';
// Small CSS-colour helper used to draw a swatch next to each variety
// row so it's clear which fish is which at a glance.
const rgbCss = (rgb) => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

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

  // null = auto (viewport-scaled), object = explicit per-variety counts.
  const [mixCounts, setMixCounts] = useState(null);
  const [mixPanelOpen, setMixPanelOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage?.getItem(FLOURISH_KEY);
    if (saved && FLOURISH_VARIANTS.some((v) => v.id === saved)) {
      setFlourishVariant(saved);
    }
    try {
      const raw = window.localStorage?.getItem(MIX_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setMixCounts(parsed);
      }
    } catch {}
  }, []);

  const setVariant = (id) => {
    setFlourishVariant(id);
    try { window.localStorage?.setItem(FLOURISH_KEY, id); } catch {}
  };

  // Bump/clamp a single variety's count. Clicking a bump when the
  // mix is currently null seeds from zero so the override takes
  // effect immediately.
  const bumpVariety = (name, delta) => {
    setMixCounts((prev) => {
      const base = prev || {};
      const next = { ...base, [name]: Math.max(0, Math.min(6, (base[name] | 0) + delta)) };
      try { window.localStorage?.setItem(MIX_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const resetMixAuto = () => {
    setMixCounts(null);
    try { window.localStorage?.removeItem(MIX_KEY); } catch {}
  };

  // Total so the panel can show "3 koi" and so PondCanvas only
  // treats non-empty objects as overrides.
  const mixTotal = useMemo(
    () => (mixCounts ? Object.values(mixCounts).reduce((a, b) => a + (b | 0), 0) : 0),
    [mixCounts],
  );

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
          because the Commitments zone has its own pads. When the
          admin panel has pinned per-variety counts, `mix` overrides
          the density-scaled auto mix. */}
      <PondCanvas
        fishMin={3}
        fishMax={5}
        skipPads
        mix={mixTotal > 0 ? mixCounts : null}
      />

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

      {/* Fish mix panel — click the small badge to expand a per-variety
          picker. Counts persist to localStorage. Empty = auto. */}
      <div
        className="no-print"
        style={{
          position: 'fixed',
          bottom: 14,
          left: 14,
          zIndex: 10,
          fontFamily: 'Manrope, sans-serif',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        <button
          onClick={() => setMixPanelOpen((v) => !v)}
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(10, 32, 38, 0.55)',
            backdropFilter: 'blur(6px)',
            color: 'rgba(255,255,255,0.85)',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          title="Fish mix"
        >
          Fish · {mixTotal > 0 ? `${mixTotal} pinned` : 'auto'}
        </button>

        {mixPanelOpen && (
          <div
            style={{
              marginTop: 6,
              padding: '10px 12px',
              background: 'rgba(10, 32, 38, 0.78)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              color: 'rgba(255,255,255,0.85)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minWidth: 200,
              maxHeight: '60vh',
              overflowY: 'auto',
            }}
          >
            {POND_VARIETIES.map((v) => {
              const count = mixCounts?.[v.name] | 0;
              return (
                <div
                  key={v.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '3px 2px',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: rgbCss(v.body),
                      border: `1.5px solid ${rgbCss(v.dorsal)}`,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, letterSpacing: '0.08em', textTransform: 'none' }}>
                    {v.label}
                  </span>
                  <button
                    onClick={() => bumpVariety(v.name, -1)}
                    disabled={count <= 0}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: 'none',
                      background: count > 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                      color: count > 0 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
                      cursor: count > 0 ? 'pointer' : 'default',
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                    aria-label={`Remove one ${v.label}`}
                  >
                    −
                  </button>
                  <span
                    style={{
                      minWidth: 18,
                      textAlign: 'center',
                      fontVariantNumeric: 'tabular-nums',
                      color: count > 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {count}
                  </span>
                  <button
                    onClick={() => bumpVariety(v.name, +1)}
                    disabled={count >= 6}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: 'none',
                      background: count < 6 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                      color: count < 6 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
                      cursor: count < 6 ? 'pointer' : 'default',
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                    aria-label={`Add one ${v.label}`}
                  >
                    +
                  </button>
                </div>
              );
            })}

            <button
              onClick={resetMixAuto}
              style={{
                marginTop: 4,
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Auto (viewport)
            </button>
          </div>
        )}
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
