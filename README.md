# Family Vision Board

An ambient, living display for the kitchen fridge. A fullscreen React app that
alternates between a Makoto-Shinkai-inspired koi pond, a dusk-sky flock of
birds, and a daylight cloud horizon — each quietly holding the family's Why,
How, and personal focuses.

## Stack

- Vite + React 18 (plain JSX, no TypeScript)
- Canvas 2D (pond + fish)
- Vanta.js via CDN (birds, fog, clouds)
- `localStorage` for all persistence

## Develop

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run build
# drop dist/ on Vercel, Netlify, anywhere static
```

## Structure

```
index.html              # Vanta + three.js CDN scripts, Google Fonts
src/
  main.jsx              # React entry
  KoiBoard.jsx          # top-level component, theme switcher, overlay, controls
  SpineFish.js          # dot-chain skeletal fish (ported from akeatk/fish-pond)
```
