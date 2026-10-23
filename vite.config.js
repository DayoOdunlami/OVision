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

// One app, one entry point. The old addresses (/pray/, /flourish/abide/,
// /today/ …) are tiny redirect pages in public/, so a family's bookmarks
// and home-screen icons still land somewhere sensible.
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
      input: { main: resolve(__dirname, 'index.html'), study: resolve(__dirname, 'study/index.html') },
    },
  },
});
