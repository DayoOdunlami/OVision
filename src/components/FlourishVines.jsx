// ═══════════════════════════════════════════════════════════════════
// FlourishVines — the hand-coded SVG vines that wrap the "Flourish"
// hero word in the Textured and Pond views. Gently swaying, drawn
// behind the letterforms via zIndex: 2 (word sits at zIndex: 1 but
// is painted after because it comes later in the DOM with a higher
// stacking context from its own zIndex). Purely decorative: text is
// readable with SVG disabled.
// ═══════════════════════════════════════════════════════════════════

export default function FlourishVines() {
  return (
    <svg
      viewBox="0 0 900 500"
      preserveAspectRatio="xMinYMid meet"
      aria-hidden="true"
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
      <g style={{ transformOrigin: '80px 450px', animation: 'sway 9s ease-in-out infinite' }}>
        <path
          d="M 40,460 Q 70,400 95,350 Q 115,300 135,260 Q 150,215 170,185 Q 195,160 225,155"
          fill="none"
          stroke="#3E4F2F"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.72"
        />
        <path d="M 110,320 Q 85,305 80,280 Q 102,283 115,305 Z" fill="#5E7A45" opacity="0.7" />
        <path d="M 145,245 Q 168,230 180,208 Q 180,238 162,258 Z" fill="#6B8A4E" opacity="0.65" />
        <path d="M 210,175 Q 185,170 175,150 Q 200,147 218,162 Z" fill="#5E7A45" opacity="0.68" />
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
        <path d="M 805,190 Q 828,175 838,152 Q 838,182 820,200 Z" fill="#6B8A4E" opacity="0.65" />
        <path d="M 745,260 Q 720,255 710,235 Q 735,230 753,248 Z" fill="#5E7A45" opacity="0.68" />
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
  );
}
