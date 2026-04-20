// ═══════════════════════════════════════════════════════════════════
// FullSun — the solar rays behind the "Full" hero word. A central
// glow, a thin halo, and 24 tapered rays (long/short alternating)
// that slowly rotate and gently pulse. Behind the word via zIndex: 0.
// ═══════════════════════════════════════════════════════════════════

export default function FullSun() {
  return (
    <svg
      viewBox="-300 -300 600 600"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
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
          <stop offset="0%"   stopColor="#FFE4B0" stopOpacity="0.55" />
          <stop offset="40%"  stopColor="#F0B660" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#C9824A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sunHalo" cx="50%" cy="50%" r="50%">
          <stop offset="60%"  stopColor="#D4954A" stopOpacity="0" />
          <stop offset="85%"  stopColor="#D4954A" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#D4954A" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="0" cy="0" r="260" fill="url(#sunCore)" />
      <circle cx="0" cy="0" r="260" fill="url(#sunHalo)" />

      {/* Rays — slow rotation + gentle pulse */}
      <g
        style={{
          transformOrigin: '0 0',
          animation: 'raysRotate 180s linear infinite, raysPulse 8s ease-in-out infinite',
        }}
      >
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2;
          const isLong = i % 2 === 0;
          const start = 130;
          const end = isLong ? 275 : 210;
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
          );
        })}
      </g>
    </svg>
  );
}
