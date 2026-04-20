import { useEffect, useMemo, useRef, useState } from 'react';
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

      {/* Pond settings — single discrete menu replacing the old
          bottom-left + bottom-right floating toggles. Collapsed is a
          small gear chip; expanded shows Flourish variant and the
          fish mix panel, cleanly grouped. */}
      <PondSettingsMenu
        flourishVariant={flourishVariant}
        setVariant={setVariant}
        mixCounts={mixCounts}
        mixTotal={mixTotal}
        bumpVariety={bumpVariety}
        resetMixAuto={resetMixAuto}
      />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// PondSettingsMenu — one collapsed button in the bottom-right; when
// opened, a single card stacks the two settings that used to live in
// opposite corners. A small outside-click/Escape handler closes it so
// it never competes with the content for attention.
function PondSettingsMenu({
  flourishVariant,
  setVariant,
  mixCounts,
  mixTotal,
  bumpVariety,
  resetMixAuto,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

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

  const activeFlourish = FLOURISH_VARIANTS.find((v) => v.id === flourishVariant);

  return (
    <div
      ref={rootRef}
      className="no-print"
      style={{
        position: 'fixed',
        right: 14,
        bottom: 14,
        zIndex: 10,
        fontFamily: 'Manrope, sans-serif',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Pond settings"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 14px 7px 10px',
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'rgba(10, 32, 38, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: '#F1E6D2',
          cursor: 'pointer',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: 600,
          boxShadow: '0 6px 18px rgba(0,0,0,0.28)',
        }}
      >
        <GearIcon />
        <span>Pond</span>
        <span style={{ opacity: 0.55 }}>·</span>
        <span style={{ opacity: 0.85 }}>{activeFlourish?.label || 'Bubbles'}</span>
        <span style={{ opacity: 0.55 }}>·</span>
        <span style={{ opacity: 0.85 }}>
          {mixTotal > 0 ? `${mixTotal} koi` : 'Auto koi'}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pond settings"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 'calc(100% + 8px)',
            minWidth: 240,
            padding: 14,
            background: 'rgba(10, 32, 38, 0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14,
            boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
            color: 'rgba(255,255,255,0.9)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          {/* Section: Flourish treatment */}
          <div>
            <SectionLabel>Flourish ring</SectionLabel>
            <div
              style={{
                display: 'flex',
                gap: 4,
                padding: 3,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 999,
                marginTop: 6,
              }}
            >
              {FLOURISH_VARIANTS.map((v) => {
                const selected = flourishVariant === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setVariant(v.id)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: 'none',
                      cursor: 'pointer',
                      background: selected ? 'rgba(255,255,255,0.92)' : 'transparent',
                      color: selected ? '#0a2026' : 'rgba(255,255,255,0.82)',
                      fontSize: 10,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      transition: 'background 0.15s ease, color 0.15s ease',
                    }}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Fish mix */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <SectionLabel style={{ margin: 0 }}>Koi mix</SectionLabel>
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                {mixTotal > 0 ? `${mixTotal} pinned` : 'Auto'}
              </span>
              {mixTotal > 0 && (
                <button
                  onClick={resetMixAuto}
                  style={{
                    marginLeft: 'auto',
                    padding: '2px 8px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.16)',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.72)',
                    cursor: 'pointer',
                    fontSize: 9,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Reset
                </button>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto auto auto',
                columnGap: 6,
                rowGap: 2,
                alignItems: 'center',
              }}
            >
              {POND_VARIETIES.map((v) => {
                const count = mixCounts?.[v.name] | 0;
                return (
                  <MixRow
                    key={v.name}
                    variety={v}
                    count={count}
                    onMinus={() => bumpVariety(v.name, -1)}
                    onPlus={() => bumpVariety(v.name, +1)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MixRow({ variety, count, onMinus, onPlus }) {
  const minusDisabled = count <= 0;
  const plusDisabled = count >= 6;
  return (
    <>
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: rgbCss(variety.body),
          border: `1.5px solid ${rgbCss(variety.dorsal)}`,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 12,
          letterSpacing: '0.02em',
          color: count > 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
        }}
      >
        {variety.label}
      </span>
      <MixStepper disabled={minusDisabled} onClick={onMinus} ariaLabel={`Remove one ${variety.label}`}>
        −
      </MixStepper>
      <span
        style={{
          minWidth: 18,
          textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
          fontSize: 12,
          fontWeight: 600,
          color: count > 0 ? '#F1E6D2' : 'rgba(255,255,255,0.35)',
        }}
      >
        {count}
      </span>
      <MixStepper disabled={plusDisabled} onClick={onPlus} ariaLabel={`Add one ${variety.label}`}>
        +
      </MixStepper>
    </>
  );
}

function MixStepper({ disabled, onClick, ariaLabel, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        border: 'none',
        background: disabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.12)',
        color: disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 14,
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children, style }) {
  return (
    <div
      style={{
        fontSize: 10,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.6)',
        fontWeight: 600,
        ...(style || {}),
      }}
    >
      {children}
    </div>
  );
}

function GearIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
