import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { BOOK_TITLES } from './src/data/books';

// Inject crawlable, real content into #root at build time (a lightweight
// prerender). Search engines and no-JS visitors get a heading, intro, and
// links to every book; React replaces #root on mount. Combined with the
// client-side per-book <title>/canonical updates, each ?book= URL is
// discoverable and indexable without changing routing or the relative base.
function seoPrerender(): Plugin {
  return {
    name: 'seo-prerender',
    transformIndexHtml(html) {
      const items = BOOK_TITLES.map(
        (t) => `<li><a href="./?book=${encodeURIComponent(t)}">${t}</a></li>`,
      ).join('');
      const block = `<div id="root"><main class="prerender">
        <h1>Music Ed</h1>
        <p>Hear the musical examples from classic music-theory, counterpoint, harmony,
        and orchestration textbooks — orchestral playback shown alongside each score,
        free in your browser.</p>
        <h2>Books</h2>
        <ul class="prerender-books">${items}</ul>
      </main></div>`;
      return html.replace('<div id="root"></div>', block);
    },
  };
}

export default defineConfig({
  // Relative base so the same build works under any mount point:
  // GitHub Pages' /music-ed-companion/ subpath AND a root-served host
  // (e.g. a Cloudflare Worker at music-ed-companion.*.workers.dev).
  base: './',
  plugins: [react(), seoPrerender()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    passWithNoTests: true,
  },
});
