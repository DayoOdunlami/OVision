import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

// The commit a build came from, shown at the foot of the prayer
// surface's Options sheet so a deployed page can be matched to git.
// Vercel provides it as an env var; locally, ask git.
function buildId() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (sha) return sha.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD').toString().trim() + '-local';
  } catch {
    return 'dev';
  }
}
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Two surfaces, two HTML entry points, one build:
//
//   index.html       → /        the Pond
//   pray/index.html  → /pray/   the Prayer surface
//   flourish/index.html → /flourish/  the Vine (a word grown by a vine)
//   flourish/abide/index.html → /flourish/abide/  Abide (sow, stay, gather)
//   labs/index.html  → /labs/   each design change, New or Classic (A/B)
//   make/index.html  → /make/   make a board, for you or someone else
//   admin/index.html → /admin/  version, Main/Lab switch, every change (/labs/ too)
//   birds/index.html → /birds/  bird gallery: candidates for the sky, live
//   today/index.html → /today/  optional: today's prayer, word and board in one place
//
// They're separate documents on purpose (the prayer page must never
// carry the animated pond), but they share an origin — and therefore
// localStorage — plus any modules under src/shared/. Vite splits code
// both pages use into a common chunk, so React is only downloaded once.
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_ID__: JSON.stringify(buildId()),
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        pray: resolve(__dirname, 'pray/index.html'),
        flourish: resolve(__dirname, 'flourish/index.html'),
        abide: resolve(__dirname, 'flourish/abide/index.html'),
        labs: resolve(__dirname, 'labs/index.html'),
        make: resolve(__dirname, 'make/index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
        today: resolve(__dirname, 'today/index.html'),
        birds: resolve(__dirname, 'birds/index.html'),
      },
    },
  },
});
