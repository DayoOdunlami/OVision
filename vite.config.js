import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Two surfaces, two HTML entry points, one build:
//
//   index.html       → /        the Pond
//   pray/index.html  → /pray/   the Prayer surface
//
// They're separate documents on purpose (the prayer page must never
// carry the animated pond), but they share an origin — and therefore
// localStorage — plus any modules under src/shared/. Vite splits code
// both pages use into a common chunk, so React is only downloaded once.
export default defineConfig({
  plugins: [react()],
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
      },
    },
  },
});
