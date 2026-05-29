import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base so the same build works under any mount point:
  // GitHub Pages' /music-ed-companion/ subpath AND a root-served host
  // (e.g. a Cloudflare Worker at music-ed-companion.*.workers.dev).
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    passWithNoTests: true,
  },
});
