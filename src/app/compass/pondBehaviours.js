// Intention steers the existing skeleton; it never replaces fish movement.
// Feeding and a frightened fish always take precedence. Coordinates are habitat-local.
export function pondTarget(theme, index, count, seconds, width, height, focus = '') {
  const n = Math.max(1, count);
  const angle = index / n * Math.PI * 2 + seconds * .017;
  let x = .5, y = .5, depth = .4, rest = false;
  if (focus === 'no') {
    x = .3 + Math.cos(angle) * .18; y = .46 + Math.sin(angle) * .24;
  } else if (focus === 'yes') {
    x = .4 + Math.cos(angle) * .22; y = .42 + Math.sin(angle) * .22;
  } else if (theme === 'rest') {
    x = .38 + index / n * .26; y = .65 + Math.sin(index * 2.4) * .06;
    depth = .72; rest = true;
  } else if (theme === 'grow') {
    x = .38 + Math.sin(index * 2.4) * .2; y = .3 + index / n * .18; depth = .12;
  } else if (theme === 'give') {
    x = index % 2 ? .7 : .3; y = .33 + (index / n) * .35; depth = .25;
  } else if (theme === 'steady') {
    x = .5 + Math.cos(angle) * .28; y = .5 + Math.sin(angle) * .28;
  } else if (theme === 'welcome') {
    // An open gathering: the space at the lower right is deliberately unoccupied.
    const a = -.35 + index / n * Math.PI * 1.45 + Math.sin(seconds * .023) * .07;
    x = .49 + Math.cos(a) * .29; y = .48 + Math.sin(a) * .28;
  } else {
    x = .5 + Math.cos(angle) * .28; y = .48 + Math.sin(angle) * .27;
  }
  return { x: Math.max(24, Math.min(width - 24, x * width)), y: Math.max(24, Math.min(height - 24, y * height)), depth, rest };
}
