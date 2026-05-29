# Music Ed Companion

A browser player for music-theory and composition textbooks. Each musical example is played back through [SpessaSynth](https://github.com/spessasus/SpessaSynth) using a rich orchestral soundfont, displayed alongside the score image. Book and chapter data are fetched from S3 and rendered in a chapter-nav sidebar; clicking any example loads its MIDI and score image on demand.

## Dev

```bash
npm install      # install deps
npm run dev      # Vite dev server → http://localhost:5173/music-ed-companion/
npm run build    # tsc + vite build → dist/
npm test         # vitest (run once)
```

## Soundfont

The app streams a large SF2 soundfont from S3 on first load. See [`SOUNDFONT.md`](SOUNDFONT.md) for the one-time S3 hosting step. The URL is configured in [`src/audio/soundfontConfig.ts`](src/audio/soundfontConfig.ts).

## Data Source

Book manifests are fetched from:

```
https://music-ed.s3.us-east-2.amazonaws.com/<book>.json
```

Each manifest lists chapters and examples. Example assets (MIDI, score images) live under the `baseUrl` declared in the manifest, e.g. `<baseUrl>/<chapter>/<file>`.

## Deploy

**Automatic:** pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/build.yml`), which runs `npm ci && npm run build` and publishes `dist/` to the `gh-pages` branch via `peaceiris/actions-gh-pages`.

**Manual:**

```bash
npm run deploy   # builds dist/ then pushes to gh-pages branch
```

Live at: https://e7mac.github.io/music-ed-companion/

## Tech Stack

- **Vite 6** — build tooling, dev server
- **React 19** + **TypeScript** — UI
- **Vitest** + **@testing-library/react** — unit/component tests
- **spessasynth_lib** — in-browser SF2 MIDI synthesis
