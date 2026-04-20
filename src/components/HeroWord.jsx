// ═══════════════════════════════════════════════════════════════════
// HeroWord — shared hero word component. Accepts a textured-fill
// class (tx-flourish / tx-full / tx-verb / tx-marrow) or a solid
// colour. Used across all identity-board views.
// ═══════════════════════════════════════════════════════════════════

export default function HeroWord({
  children,
  fill,
  color,
  wonk = false,
  size = 'clamp(5rem, 20vw, 13rem)',
  pulse = false,
  style = {},
  as: Tag = 'h1',
}) {
  const classes = [
    'hero-word',
    wonk ? 'display-wonk' : null,
    fill || null,
  ]
    .filter(Boolean)
    .join(' ');

  const combined = {
    fontSize: size,
    color: fill ? undefined : color,
    margin: 0,
    position: 'relative',
    zIndex: 1,
    animation: pulse ? 'glowPulse 6s ease-in-out infinite' : undefined,
    ...style,
  };

  return (
    <Tag className={classes} style={combined}>
      {children}
    </Tag>
  );
}
