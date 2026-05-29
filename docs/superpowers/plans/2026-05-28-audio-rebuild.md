# music-ed-companion Audio-First Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the textbook example player on Vite + React 19 + TypeScript with a SpessaSynth-based audio engine and a rich orchestral soundfont, so MIDI examples play with true per-instrument timbre.

**Architecture:** A React-free `AudioEngine` owns all playback and wraps a `SynthBackend` interface; the real backend wraps SpessaSynth, a `FakeSynthBackend` powers unit tests. Book data is fetched read-only from the existing S3 bucket. React components are thin and bind to the engine through a `usePlayer` hook. The large soundfont is delivered as SF3 and cached once via the Cache API.

**Tech Stack:** Vite, React 19, TypeScript, Vitest + @testing-library/react, SpessaSynth (`spessasynth_lib`), Cache API / service worker, GitHub Pages.

---

## Reference: spec
`docs/superpowers/specs/2026-05-28-audio-rebuild-design.md`

## Reference: existing data shape (from current `src/App.js` + S3)
- Book list (15) is hardcoded in `src/App.js`.
- `GET https://music-ed.s3.us-east-2.amazonaws.com/<book>.json` returns:
  ```json
  { "name": "Creative Orchestration", "baseUrl": "https://music-ed.s3.us-east-2.amazonaws.com/CreativeOrchestration/",
    "chapters": [ { "name": "Chapter 1", "examples": [ { "name": "Ex2-1 Piccolo", "midi": "...", "image": "...", "mp3": "..." } ] } ] }
  ```
- Asset URL for an example = `baseUrl + chapter.name + "/" + example.<midi|image|mp3>`.

## File Structure (target `src/`)
```
src/
  main.tsx                      App entry
  App.tsx                       Top-level layout + book selection state
  data/
    books.ts                    Hardcoded book-title list (config)
    bookTypes.ts                Book/Chapter/Example TS types
    fetchBook.ts                S3 fetch + parse/validate
    assetUrl.ts                 buildAssetUrl(baseUrl, chapterName, file)
  audio/
    SynthBackend.ts             Interface + types (state enum, callbacks)
    AudioEngine.ts              Backend-agnostic playback state machine
    FakeSynthBackend.ts         Test double (also useful for storybook/manual)
    SpessaSynthBackend.ts       Real SpessaSynth wrapper
    soundfontCache.ts           Cache-API fetch of the SF3 with progress
  hooks/
    usePlayer.ts                Binds AudioEngine state <-> React
    useKeyboardNav.ts           Space / arrow-key shortcuts
  components/
    BookNav.tsx                 Book dropdown + chapter/example lists
    ScoreImage.tsx              Renders example score image (+ error state)
    TransportBar.tsx            play/pause/seek/tempo/loop/transpose
    Mp3Fallback.tsx             native <audio> for mp3-only examples
    ExampleView.tsx             Composes ScoreImage + TransportBar/Mp3Fallback
    SoundfontGate.tsx           Loading/error/retry gate around the app
```

---

## Task 1: Scaffold Vite + React + TS alongside the old app

**Files:**
- Create: `package.json` (replace), `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.nvmrc`
- Create: `src/vite-env.d.ts`
- Keep (do not delete yet): old `src/App.js`, `src/components/*`, `src/lib/*` — removed in Task 12.

- [ ] **Step 1: Snapshot the old book list before touching anything**

Run: `grep -n "Applied Counterpoint" -A 20 src/App.js`
Expected: prints the 15-element `books` array. Copy it for Task 2.

- [ ] **Step 2: Replace `package.json`**

```json
{
  "name": "music-companion-app",
  "version": "0.2.0",
  "private": true,
  "type": "module",
  "homepage": "http://e7mac.github.io/music-ed-companion",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "deploy": "npm run build && gh-pages -d dist"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "spessasynth_lib": "^3.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "gh-pages": "^6.1.0",
    "jsdom": "^25.0.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  }
}
```
Note: pin `spessasynth_lib` to whatever the latest published major is at install time; Task 8 verifies the API against the installed version.

- [ ] **Step 3: Create `vite.config.ts`** (base path matches the gh-pages project path)

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/music-ed-companion/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
});
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Music Ed</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/vite-env.d.ts` and `src/setupTests.ts`**

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```
`src/setupTests.ts`:
```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 7: Create minimal `src/main.tsx` and `src/App.tsx`**

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```
`src/App.tsx`:
```tsx
export default function App() {
  return <h1>Music Ed</h1>;
}
```

- [ ] **Step 8: Install and verify dev server boots**

Run: `npm install && npm run build`
Expected: TypeScript compiles, `dist/` is produced with no errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React 19 + TS app shell"
```

---

## Task 2: Book types + book list config

**Files:**
- Create: `src/data/bookTypes.ts`, `src/data/books.ts`
- Test: `src/data/books.test.ts`

- [ ] **Step 1: Write the failing test**

`src/data/books.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { BOOK_TITLES, bookJsonUrl } from './books';

describe('books config', () => {
  it('lists the 15 known books including the orchestration book', () => {
    expect(BOOK_TITLES).toHaveLength(15);
    expect(BOOK_TITLES).toContain('Creative Orchestration');
  });

  it('builds an S3 json url from a title', () => {
    expect(bookJsonUrl('Creative Orchestration')).toBe(
      'https://music-ed.s3.us-east-2.amazonaws.com/Creative Orchestration.json',
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/data/books.test.ts`
Expected: FAIL — cannot find module `./books`.

- [ ] **Step 3: Create `src/data/bookTypes.ts`**

```ts
export interface Example {
  name: string;
  midi?: string;
  mp3?: string;
  image?: string;
}

export interface Chapter {
  name: string;
  examples: Example[];
}

export interface Book {
  name: string;
  baseUrl: string;
  chapters: Chapter[];
}
```

- [ ] **Step 4: Create `src/data/books.ts`** (paste the exact 15 titles from Task 1 Step 1)

```ts
export const S3_BASE = 'https://music-ed.s3.us-east-2.amazonaws.com';

export const BOOK_TITLES = [
  'Applied Counterpoint',
  'Contemporary Harmony',
  'Creative Orchestration',
  'Elementary Counterpoint',
  'Musical Composition Craft And Art',
  'Structural Functions Of Harmony',
  'Twentieth Century Harmony',
  'Modulation',
  'Brahms And The Principle Of Developing Variation',
  'The Shaping Forces In Music',
  'Fundamentals Of Musical Composition',
  'Japanese Music Harmony Vol1',
  'Latin Jazz Piano',
  'Play Latin Piano Like A Pro',
  'Jazz Piano The Left Hand',
] as const;

export function bookJsonUrl(title: string): string {
  return `${S3_BASE}/${title}.json`;
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- src/data/books.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/data/bookTypes.ts src/data/books.ts src/data/books.test.ts
git commit -m "feat: add book types and book-list config"
```

---

## Task 3: Asset URL builder + book fetch/parse

**Files:**
- Create: `src/data/assetUrl.ts`, `src/data/fetchBook.ts`
- Test: `src/data/assetUrl.test.ts`, `src/data/fetchBook.test.ts`

- [ ] **Step 1: Write the failing test for `assetUrl`**

`src/data/assetUrl.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildAssetUrl } from './assetUrl';

describe('buildAssetUrl', () => {
  it('joins baseUrl, chapter name and file', () => {
    expect(buildAssetUrl('https://x/CO/', 'Chapter 1', 'Ex2-1.mid')).toBe(
      'https://x/CO/Chapter 1/Ex2-1.mid',
    );
  });
  it('inserts a slash when baseUrl lacks a trailing one', () => {
    expect(buildAssetUrl('https://x/CO', 'Chapter 1', 'a.png')).toBe(
      'https://x/CO/Chapter 1/a.png',
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/data/assetUrl.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Create `src/data/assetUrl.ts`**

```ts
export function buildAssetUrl(baseUrl: string, chapterName: string, file: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${base}${chapterName}/${file}`;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- src/data/assetUrl.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing test for `fetchBook`** (mock `fetch`)

`src/data/fetchBook.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchBook } from './fetchBook';

const validBook = {
  name: 'Creative Orchestration',
  baseUrl: 'https://x/CO/',
  chapters: [{ name: 'Chapter 1', examples: [{ name: 'Ex2-1 Piccolo', midi: 'a.mid', image: 'a.png' }] }],
};

afterEach(() => vi.restoreAllMocks());

describe('fetchBook', () => {
  it('fetches and returns a parsed book', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => validBook })));
    const book = await fetchBook('Creative Orchestration');
    expect(book.name).toBe('Creative Orchestration');
    expect(book.chapters[0].examples[0].name).toBe('Ex2-1 Piccolo');
  });

  it('throws a clear error on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
    await expect(fetchBook('Nope')).rejects.toThrow(/Failed to load book "Nope".*404/);
  });

  it('throws when the payload is missing chapters', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ name: 'x', baseUrl: 'y' }) })));
    await expect(fetchBook('x')).rejects.toThrow(/invalid book data/i);
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `npm test -- src/data/fetchBook.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 7: Create `src/data/fetchBook.ts`**

```ts
import type { Book } from './bookTypes';
import { bookJsonUrl } from './books';

export async function fetchBook(title: string): Promise<Book> {
  const res = await fetch(bookJsonUrl(title), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to load book "${title}" (HTTP ${res.status})`);
  }
  const data = (await res.json()) as Partial<Book>;
  if (!data || typeof data.name !== 'string' || typeof data.baseUrl !== 'string' || !Array.isArray(data.chapters)) {
    throw new Error(`Received invalid book data for "${title}"`);
  }
  return data as Book;
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `npm test -- src/data/fetchBook.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add src/data/assetUrl.ts src/data/assetUrl.test.ts src/data/fetchBook.ts src/data/fetchBook.test.ts
git commit -m "feat: add asset-url builder and S3 book fetch/parse"
```

---

## Task 4: SynthBackend interface + AudioEngine state machine (TDD, no real synth)

**Files:**
- Create: `src/audio/SynthBackend.ts`, `src/audio/FakeSynthBackend.ts`, `src/audio/AudioEngine.ts`
- Test: `src/audio/AudioEngine.test.ts`

- [ ] **Step 1: Create the interface `src/audio/SynthBackend.ts`**

```ts
export type PlaybackStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error';

export interface SynthBackend {
  /** Load a MIDI song from raw bytes; resolves when ready to play. */
  loadSong(midi: ArrayBuffer): Promise<void>;
  play(): void;
  pause(): void;
  stop(): void;
  /** Seek to an absolute time in seconds. */
  setCurrentTime(seconds: number): void;
  getDuration(): number;
  /** 1 = normal speed; 2 = twice as fast. */
  setPlaybackRate(rate: number): void;
  /** Semitone offset applied to all channels. */
  setTranspose(semitones: number): void;
  setLoop(enabled: boolean): void;
  /** Fired periodically with (currentSeconds, durationSeconds). */
  onProgress(cb: (current: number, duration: number) => void): void;
  /** Fired once when the song reaches its end (and loop is off). */
  onEnd(cb: () => void): void;
}
```

- [ ] **Step 2: Create `src/audio/FakeSynthBackend.ts`** (a controllable test double)

```ts
import type { SynthBackend } from './SynthBackend';

export class FakeSynthBackend implements SynthBackend {
  duration = 10;
  rate = 1;
  transpose = 0;
  loop = false;
  playing = false;
  current = 0;
  loadCalls = 0;
  private progressCb: ((c: number, d: number) => void) | null = null;
  private endCb: (() => void) | null = null;

  async loadSong(_midi: ArrayBuffer): Promise<void> {
    this.loadCalls += 1;
    this.current = 0;
    this.playing = false;
  }
  play() { this.playing = true; }
  pause() { this.playing = false; }
  stop() { this.playing = false; this.current = 0; }
  setCurrentTime(s: number) { this.current = s; }
  getDuration() { return this.duration; }
  setPlaybackRate(r: number) { this.rate = r; }
  setTranspose(n: number) { this.transpose = n; }
  setLoop(e: boolean) { this.loop = e; }
  onProgress(cb: (c: number, d: number) => void) { this.progressCb = cb; }
  onEnd(cb: () => void) { this.endCb = cb; }

  // test helpers
  emitProgress(c: number) { this.progressCb?.(c, this.duration); }
  emitEnd() { this.endCb?.(); }
}
```

- [ ] **Step 3: Write the failing test `src/audio/AudioEngine.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { AudioEngine } from './AudioEngine';
import { FakeSynthBackend } from './FakeSynthBackend';

describe('AudioEngine', () => {
  let backend: FakeSynthBackend;
  let engine: AudioEngine;

  beforeEach(() => {
    backend = new FakeSynthBackend();
    engine = new AudioEngine(backend);
  });

  it('starts idle and becomes ready after loading a song', async () => {
    expect(engine.getState().status).toBe('idle');
    await engine.load(new ArrayBuffer(8));
    expect(engine.getState().status).toBe('ready');
    expect(backend.loadCalls).toBe(1);
  });

  it('transitions to playing and paused', async () => {
    await engine.load(new ArrayBuffer(8));
    engine.play();
    expect(engine.getState().status).toBe('playing');
    engine.pause();
    expect(engine.getState().status).toBe('paused');
  });

  it('reapplies tempo, transpose and loop to a newly loaded song', async () => {
    engine.setTempo(1.5);
    engine.setTranspose(-2);
    engine.setLoop(true);
    await engine.load(new ArrayBuffer(8));
    expect(backend.rate).toBe(1.5);
    expect(backend.transpose).toBe(-2);
    expect(backend.loop).toBe(true);
  });

  it('clamps tempo to the 0.1x..5x range', () => {
    engine.setTempo(99);
    expect(engine.getState().tempo).toBe(5);
    engine.setTempo(0);
    expect(engine.getState().tempo).toBe(0.1);
  });

  it('notifies subscribers of progress', async () => {
    await engine.load(new ArrayBuffer(8));
    const seen: number[] = [];
    engine.subscribe((s) => seen.push(s.currentTime));
    backend.emitProgress(3);
    expect(seen.at(-1)).toBe(3);
  });

  it('returns to ready (currentTime 0) when the song ends', async () => {
    await engine.load(new ArrayBuffer(8));
    engine.play();
    backend.emitEnd();
    expect(engine.getState().status).toBe('ready');
    expect(engine.getState().currentTime).toBe(0);
  });
});
```

- [ ] **Step 4: Run to verify it fails**

Run: `npm test -- src/audio/AudioEngine.test.ts`
Expected: FAIL — cannot find module `./AudioEngine`.

- [ ] **Step 5: Implement `src/audio/AudioEngine.ts`**

```ts
import type { PlaybackStatus, SynthBackend } from './SynthBackend';

export interface EngineState {
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  tempo: number;
  transpose: number;
  loop: boolean;
}

type Listener = (state: EngineState) => void;

const MIN_TEMPO = 0.1;
const MAX_TEMPO = 5;

export class AudioEngine {
  private listeners = new Set<Listener>();
  private state: EngineState = {
    status: 'idle',
    currentTime: 0,
    duration: 0,
    tempo: 1,
    transpose: 0,
    loop: false,
  };

  constructor(private backend: SynthBackend) {
    backend.onProgress((current, duration) => {
      this.patch({ currentTime: current, duration });
    });
    backend.onEnd(() => {
      this.backend.stop();
      this.patch({ status: 'ready', currentTime: 0 });
    });
  }

  getState(): EngineState {
    return { ...this.state };
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  async load(midi: ArrayBuffer): Promise<void> {
    this.patch({ status: 'loading', currentTime: 0 });
    try {
      await this.backend.loadSong(midi);
      // Reapply persistent settings to the new song.
      this.backend.setPlaybackRate(this.state.tempo);
      this.backend.setTranspose(this.state.transpose);
      this.backend.setLoop(this.state.loop);
      this.patch({ status: 'ready', duration: this.backend.getDuration() });
    } catch (err) {
      this.patch({ status: 'error' });
      throw err;
    }
  }

  play(): void {
    this.backend.play();
    this.patch({ status: 'playing' });
  }

  pause(): void {
    this.backend.pause();
    this.patch({ status: 'paused' });
  }

  stop(): void {
    this.backend.stop();
    this.patch({ status: 'ready', currentTime: 0 });
  }

  seek(seconds: number): void {
    this.backend.setCurrentTime(seconds);
    this.patch({ currentTime: seconds });
  }

  setTempo(multiplier: number): void {
    const tempo = Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, multiplier));
    this.backend.setPlaybackRate(tempo);
    this.patch({ tempo });
  }

  setTranspose(semitones: number): void {
    this.backend.setTranspose(semitones);
    this.patch({ transpose: semitones });
  }

  setLoop(enabled: boolean): void {
    this.backend.setLoop(enabled);
    this.patch({ loop: enabled });
  }

  private patch(partial: Partial<EngineState>): void {
    this.state = { ...this.state, ...partial };
    const snapshot = this.getState();
    this.listeners.forEach((l) => l(snapshot));
  }
}
```

- [ ] **Step 6: Run to verify it passes**

Run: `npm test -- src/audio/AudioEngine.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 7: Commit**

```bash
git add src/audio/SynthBackend.ts src/audio/FakeSynthBackend.ts src/audio/AudioEngine.ts src/audio/AudioEngine.test.ts
git commit -m "feat: add SynthBackend interface and AudioEngine state machine"
```

---

## Task 5: Soundfont cache (Cache API) with progress

**Files:**
- Create: `src/audio/soundfontCache.ts`
- Test: `src/audio/soundfontCache.test.ts`

This downloads the SF3 once and serves it from the Cache API on later visits. It streams the
response body to report download progress for the first-load progress bar.

- [ ] **Step 1: Write the failing test** (mock `caches` + a streamed `fetch`)

`src/audio/soundfontCache.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadSoundfont } from './soundfontCache';

function streamResponse(bytes: Uint8Array, total: number) {
  let sent = false;
  const body = new ReadableStream({
    pull(controller) {
      if (sent) { controller.close(); return; }
      sent = true;
      controller.enqueue(bytes);
    },
  });
  return new Response(body, { headers: { 'Content-Length': String(total) } });
}

describe('loadSoundfont', () => {
  beforeEach(() => {
    const store = new Map<string, Response>();
    vi.stubGlobal('caches', {
      open: async () => ({
        match: async (k: string) => store.get(k),
        put: async (k: string, v: Response) => { store.set(k, v); },
      }),
    });
  });

  it('downloads, reports progress, and caches on a miss', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    vi.stubGlobal('fetch', vi.fn(async () => streamResponse(bytes, 4)));
    const progress: number[] = [];
    const buf = await loadSoundfont('https://x/sf.sf3', (p) => progress.push(p));
    expect(new Uint8Array(buf)).toEqual(bytes);
    expect(progress.at(-1)).toBe(1); // 100%
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('serves from cache without fetching on a hit', async () => {
    const cached = new Response(new Uint8Array([9, 9]).buffer);
    vi.stubGlobal('caches', {
      open: async () => ({ match: async () => cached.clone(), put: async () => {} }),
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const buf = await loadSoundfont('https://x/sf.sf3', () => {});
    expect(new Uint8Array(buf)).toEqual(new Uint8Array([9, 9]));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/audio/soundfontCache.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `src/audio/soundfontCache.ts`**

```ts
const CACHE_NAME = 'music-ed-soundfont-v1';

export async function loadSoundfont(
  url: string,
  onProgress: (fraction: number) => void,
): Promise<ArrayBuffer> {
  const cache = await caches.open(CACHE_NAME);
  const hit = await cache.match(url);
  if (hit) {
    onProgress(1);
    return hit.arrayBuffer();
  }

  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download soundfont (HTTP ${res.status})`);
  }
  const total = Number(res.headers.get('Content-Length')) || 0;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total) onProgress(Math.min(1, received / total));
  }
  onProgress(1);

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) { merged.set(c, offset); offset += c.length; }

  await cache.put(url, new Response(merged.slice().buffer));
  return merged.buffer;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- src/audio/soundfontCache.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/audio/soundfontCache.ts src/audio/soundfontCache.test.ts
git commit -m "feat: add Cache-API soundfont loader with progress"
```

---

## Task 6: Obtain and host the SF3 soundfont

**Files:**
- Create: `src/audio/soundfontConfig.ts`
- Docs: append a "Soundfont" note to `README.md`

This is an ops/asset task; it has a manual verification step rather than a unit test.

- [ ] **Step 1: Acquire a FluidR3-class SF3**

Obtain an SF3 (Vorbis-compressed) build of FluidR3_GM (or Musyng). Options:
- Download `FluidR3_GM.sf2` and convert to `.sf3` using the SpessaSynth web tool
  (https://spessasus.github.io/SpessaSynth/) — "Export → compressed SF3".
- Or download a pre-built `FluidR3_GM.sf3`.
Target a file in the tens-of-MB range. Record the final byte size.

- [ ] **Step 2: Host it on the existing S3 bucket** (same origin as book data; keeps it out of git)

Upload to `s3://music-ed/soundfonts/FluidR3_GM.sf3` and confirm it is publicly readable with
permissive CORS (the bucket already serves the book JSON to the site).

Run (user performs, has bucket creds): verify with
`curl -sI "https://music-ed.s3.us-east-2.amazonaws.com/soundfonts/FluidR3_GM.sf3"`
Expected: `HTTP/1.1 200`, a `Content-Length` header, `accept-ranges` present.

- [ ] **Step 3: Create `src/audio/soundfontConfig.ts`**

```ts
export const SOUNDFONT_URL =
  'https://music-ed.s3.us-east-2.amazonaws.com/soundfonts/FluidR3_GM.sf3';
```

- [ ] **Step 4: Commit**

```bash
git add src/audio/soundfontConfig.ts README.md
git commit -m "chore: configure hosted FluidR3 SF3 soundfont url"
```

---

## Task 7: Real SpessaSynth backend

**Files:**
- Create: `src/audio/SpessaSynthBackend.ts`
- Manual verification (no unit test — wraps third-party audio that needs a real AudioContext).

- [ ] **Step 1: Read the installed SpessaSynth API**

Run: `ls node_modules/spessasynth_lib/ && cat node_modules/spessasynth_lib/package.json | grep -E '"version"|"main"|"module"|"exports"'`
Then open the type declarations:
Run: `find node_modules/spessasynth_lib -name "*.d.ts" | head` and read the `Synthetizer` and
`Sequencer` declarations. Confirm the real names of: constructor args, `play/pause/stop`, current-time
getter/setter, duration, playback-rate, loop flag, transpose method, and the song-end / time events.
The names below are the expected SpessaSynth API; **adjust to match the installed version.**

- [ ] **Step 2: Implement `src/audio/SpessaSynthBackend.ts`**

```ts
import { Synthetizer, Sequencer } from 'spessasynth_lib';
import type { SynthBackend } from './SynthBackend';

// NOTE: method names below reflect the SpessaSynth API as of v3. Verify against the
// installed version's .d.ts (Task 7 Step 1) and adjust if they differ.
export class SpessaSynthBackend implements SynthBackend {
  private synth!: Synthetizer;
  private seq: Sequencer | null = null;
  private progressCb: ((c: number, d: number) => void) | null = null;
  private endCb: (() => void) | null = null;
  private rafId = 0;
  private rate = 1;
  private transpose = 0;
  private loopFlag = false;

  /** Must be called after a user gesture so the AudioContext can start. */
  static async create(context: AudioContext, soundfont: ArrayBuffer): Promise<SpessaSynthBackend> {
    await context.audioWorklet.addModule(
      new URL('spessasynth_lib/synthetizer/worklet_processor.min.js', import.meta.url),
    );
    const backend = new SpessaSynthBackend();
    backend.synth = new Synthetizer(context.destination, soundfont);
    await backend.synth.isReady;
    return backend;
  }

  async loadSong(midi: ArrayBuffer): Promise<void> {
    this.seq = new Sequencer([{ binary: midi }], this.synth);
    this.seq.loop = this.loopFlag;
    this.seq.playbackRate = this.rate;
    this.synth.transposeAllChannels(this.transpose);
    this.seq.pause();
    this.seq.addOnSongEndedEvent?.(() => this.endCb?.());
    this.startProgressLoop();
  }

  play() { this.seq?.play(); }
  pause() { this.seq?.pause(); }
  stop() { if (this.seq) { this.seq.pause(); this.seq.currentTime = 0; } }
  setCurrentTime(s: number) { if (this.seq) this.seq.currentTime = s; }
  getDuration() { return this.seq?.duration ?? 0; }
  setPlaybackRate(r: number) { this.rate = r; if (this.seq) this.seq.playbackRate = r; }
  setTranspose(n: number) { this.transpose = n; this.synth.transposeAllChannels(n); }
  setLoop(e: boolean) { this.loopFlag = e; if (this.seq) this.seq.loop = e; }
  onProgress(cb: (c: number, d: number) => void) { this.progressCb = cb; }
  onEnd(cb: () => void) { this.endCb = cb; }

  private startProgressLoop() {
    cancelAnimationFrame(this.rafId);
    const tick = () => {
      if (this.seq) this.progressCb?.(this.seq.currentTime, this.seq.duration);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b`
Expected: no type errors (fix method names against the installed `.d.ts` if tsc complains).

- [ ] **Step 4: Commit**

```bash
git add src/audio/SpessaSynthBackend.ts
git commit -m "feat: add real SpessaSynth synth backend"
```

---

## Task 8: usePlayer hook

**Files:**
- Create: `src/hooks/usePlayer.ts`
- Test: `src/hooks/usePlayer.test.tsx`

- [ ] **Step 1: Write the failing test** (drive the engine through the hook with the fake backend)

`src/hooks/usePlayer.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AudioEngine } from '../audio/AudioEngine';
import { FakeSynthBackend } from '../audio/FakeSynthBackend';
import { usePlayer } from './usePlayer';

describe('usePlayer', () => {
  it('exposes engine state and re-renders on change', async () => {
    const engine = new AudioEngine(new FakeSynthBackend());
    const { result } = renderHook(() => usePlayer(engine));
    expect(result.current.state.status).toBe('idle');
    await act(async () => { await engine.load(new ArrayBuffer(8)); });
    expect(result.current.state.status).toBe('ready');
    act(() => result.current.play());
    expect(result.current.state.status).toBe('playing');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/hooks/usePlayer.test.tsx`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `src/hooks/usePlayer.ts`**

```ts
import { useEffect, useState, useMemo } from 'react';
import { AudioEngine, type EngineState } from '../audio/AudioEngine';

export function usePlayer(engine: AudioEngine) {
  const [state, setState] = useState<EngineState>(() => engine.getState());

  useEffect(() => {
    setState(engine.getState());
    return engine.subscribe(setState);
  }, [engine]);

  const controls = useMemo(
    () => ({
      load: (midi: ArrayBuffer) => engine.load(midi),
      play: () => engine.play(),
      pause: () => engine.pause(),
      stop: () => engine.stop(),
      seek: (s: number) => engine.seek(s),
      setTempo: (m: number) => engine.setTempo(m),
      setTranspose: (n: number) => engine.setTranspose(n),
      setLoop: (e: boolean) => engine.setLoop(e),
    }),
    [engine],
  );

  return { state, ...controls };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- src/hooks/usePlayer.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePlayer.ts src/hooks/usePlayer.test.tsx
git commit -m "feat: add usePlayer hook binding engine to React"
```

---

## Task 9: Navigation + score + transport components

**Files:**
- Create: `src/components/BookNav.tsx`, `src/components/ScoreImage.tsx`, `src/components/TransportBar.tsx`, `src/components/Mp3Fallback.tsx`, `src/components/ExampleView.tsx`
- Test: `src/components/TransportBar.test.tsx`, `src/components/BookNav.test.tsx`

- [ ] **Step 1: Write the failing test for `TransportBar`**

`src/components/TransportBar.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransportBar } from './TransportBar';

const baseProps = {
  status: 'ready' as const,
  currentTime: 0, duration: 10, tempo: 1, transpose: 0, loop: false,
  onPlay: vi.fn(), onPause: vi.fn(), onSeek: vi.fn(),
  onTempo: vi.fn(), onTranspose: vi.fn(), onLoop: vi.fn(),
};

describe('TransportBar', () => {
  it('calls onPlay when play is clicked while not playing', async () => {
    const onPlay = vi.fn();
    render(<TransportBar {...baseProps} onPlay={onPlay} />);
    await userEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(onPlay).toHaveBeenCalled();
  });

  it('shows pause and calls onPause when playing', async () => {
    const onPause = vi.fn();
    render(<TransportBar {...baseProps} status="playing" onPause={onPause} />);
    await userEvent.click(screen.getByRole('button', { name: /pause/i }));
    expect(onPause).toHaveBeenCalled();
  });

  it('changes tempo via the tempo control', async () => {
    const onTempo = vi.fn();
    render(<TransportBar {...baseProps} onTempo={onTempo} />);
    await userEvent.click(screen.getByRole('button', { name: /faster/i }));
    expect(onTempo).toHaveBeenCalledWith(1.1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/components/TransportBar.test.tsx`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `src/components/TransportBar.tsx`**

```tsx
import type { PlaybackStatus } from '../audio/SynthBackend';

interface Props {
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  tempo: number;
  transpose: number;
  loop: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (s: number) => void;
  onTempo: (m: number) => void;
  onTranspose: (n: number) => void;
  onLoop: (e: boolean) => void;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function TransportBar(props: Props) {
  const playing = props.status === 'playing';
  return (
    <div className="transport">
      <button type="button" aria-label={playing ? 'Pause' : 'Play'} onClick={playing ? props.onPause : props.onPlay}>
        {playing ? '⏸' : '▶'}
      </button>

      <input
        type="range" aria-label="Seek"
        min={0} max={props.duration || 0} step={0.1} value={props.currentTime}
        onChange={(e) => props.onSeek(Number(e.target.value))}
      />

      <span className="tempo">
        Tempo
        <button type="button" aria-label="Slower" onClick={() => props.onTempo(round1(props.tempo - 0.1))}>−</button>
        {props.tempo.toFixed(1)}x
        <button type="button" aria-label="Faster" onClick={() => props.onTempo(round1(props.tempo + 0.1))}>+</button>
      </span>

      <span className="transpose">
        Transpose
        <button type="button" aria-label="Transpose down" onClick={() => props.onTranspose(props.transpose - 1)}>−</button>
        {props.transpose > 0 ? `+${props.transpose}` : props.transpose}
        <button type="button" aria-label="Transpose up" onClick={() => props.onTranspose(props.transpose + 1)}>+</button>
      </span>

      <label className="loop">
        <input type="checkbox" checked={props.loop} onChange={(e) => props.onLoop(e.target.checked)} /> Loop
      </label>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- src/components/TransportBar.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing test for `BookNav`**

`src/components/BookNav.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookNav } from './BookNav';
import type { Book } from '../data/bookTypes';

const book: Book = {
  name: 'Creative Orchestration',
  baseUrl: 'https://x/CO/',
  chapters: [
    { name: 'Chapter 1', examples: [{ name: 'Ex2-1 Piccolo' }, { name: 'Ex2-2 Flute' }] },
  ],
};

it('selects an example when clicked', async () => {
  const onSelect = vi.fn();
  render(<BookNav book={book} chapterIndex={0} exampleIndex={0} onSelect={onSelect} />);
  await userEvent.click(screen.getByText('Ex2-2 Flute'));
  expect(onSelect).toHaveBeenCalledWith(0, 1);
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `npm test -- src/components/BookNav.test.tsx`
Expected: FAIL — cannot find module.

- [ ] **Step 7: Implement `src/components/BookNav.tsx`**

```tsx
import type { Book } from '../data/bookTypes';

interface Props {
  book: Book;
  chapterIndex: number;
  exampleIndex: number;
  onSelect: (chapter: number, example: number) => void;
}

export function BookNav({ book, chapterIndex, exampleIndex, onSelect }: Props) {
  return (
    <nav className="book-nav">
      <h2>{book.name}</h2>
      {book.chapters.map((chapter, ci) => (
        <details key={chapter.name} open={ci === chapterIndex}>
          <summary>{chapter.name}</summary>
          <ul>
            {chapter.examples.map((ex, ei) => (
              <li key={ex.name}>
                <button
                  type="button"
                  aria-current={ci === chapterIndex && ei === exampleIndex}
                  onClick={() => onSelect(ci, ei)}
                >
                  {ex.name}
                </button>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </nav>
  );
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `npm test -- src/components/BookNav.test.tsx`
Expected: PASS.

- [ ] **Step 9: Implement `src/components/ScoreImage.tsx` and `src/components/Mp3Fallback.tsx`** (presentational; verified via build)

`src/components/ScoreImage.tsx`:
```tsx
import { useState } from 'react';

export function ScoreImage({ src, alt }: { src: string | null; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (!src) return null;
  if (errored) return <p className="score-error">Score image unavailable.</p>;
  return <img className="score" src={src} alt={alt} onError={() => setErrored(true)} />;
}
```
`src/components/Mp3Fallback.tsx`:
```tsx
export function Mp3Fallback({ src }: { src: string }) {
  return <audio className="mp3" src={src} controls />;
}
```

- [ ] **Step 10: Implement `src/components/ExampleView.tsx`** (composes score + transport, with mp3 fallback)

```tsx
import type { Example } from '../data/bookTypes';
import { buildAssetUrl } from '../data/assetUrl';
import type { EngineState } from '../audio/AudioEngine';
import { ScoreImage } from './ScoreImage';
import { TransportBar } from './TransportBar';
import { Mp3Fallback } from './Mp3Fallback';

interface Props {
  baseUrl: string;
  chapterName: string;
  example: Example;
  state: EngineState;
  controls: {
    play: () => void; pause: () => void; seek: (s: number) => void;
    setTempo: (m: number) => void; setTranspose: (n: number) => void; setLoop: (e: boolean) => void;
  };
}

export function ExampleView({ baseUrl, chapterName, example, state, controls }: Props) {
  const imageSrc = example.image ? buildAssetUrl(baseUrl, chapterName, example.image) : null;
  return (
    <section className="example">
      <h3>{example.name}</h3>
      {example.midi ? (
        <TransportBar
          status={state.status}
          currentTime={state.currentTime}
          duration={state.duration}
          tempo={state.tempo}
          transpose={state.transpose}
          loop={state.loop}
          onPlay={controls.play}
          onPause={controls.pause}
          onSeek={controls.seek}
          onTempo={controls.setTempo}
          onTranspose={controls.setTranspose}
          onLoop={controls.setLoop}
        />
      ) : example.mp3 ? (
        <Mp3Fallback src={buildAssetUrl(baseUrl, chapterName, example.mp3)} />
      ) : null}
      <ScoreImage src={imageSrc} alt={example.name} />
    </section>
  );
}
```

- [ ] **Step 11: Run the full test suite + build**

Run: `npm test && npm run build`
Expected: all tests PASS, build succeeds.

- [ ] **Step 12: Commit**

```bash
git add src/components
git commit -m "feat: add navigation, score, transport, and example-view components"
```

---

## Task 10: Keyboard navigation hook

**Files:**
- Create: `src/hooks/useKeyboardNav.ts`
- Test: `src/hooks/useKeyboardNav.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/hooks/useKeyboardNav.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardNav } from './useKeyboardNav';

function press(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }));
}

describe('useKeyboardNav', () => {
  it('maps keys to handlers', () => {
    const h = { togglePlay: vi.fn(), nextExample: vi.fn(), prevExample: vi.fn(), nextChapter: vi.fn(), prevChapter: vi.fn() };
    renderHook(() => useKeyboardNav(h));
    press(' '); expect(h.togglePlay).toHaveBeenCalled();
    press('ArrowRight'); expect(h.nextExample).toHaveBeenCalled();
    press('ArrowLeft'); expect(h.prevExample).toHaveBeenCalled();
    press('ArrowUp'); expect(h.nextChapter).toHaveBeenCalled();
    press('ArrowDown'); expect(h.prevChapter).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/hooks/useKeyboardNav.test.tsx`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `src/hooks/useKeyboardNav.ts`**

```ts
import { useEffect } from 'react';

interface Handlers {
  togglePlay: () => void;
  nextExample: () => void;
  prevExample: () => void;
  nextChapter: () => void;
  prevChapter: () => void;
}

export function useKeyboardNav(h: Handlers): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ': e.preventDefault(); h.togglePlay(); break;
        case 'ArrowRight': h.nextExample(); break;
        case 'ArrowLeft': h.prevExample(); break;
        case 'ArrowUp': h.nextChapter(); break;
        case 'ArrowDown': h.prevChapter(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [h]);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- src/hooks/useKeyboardNav.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useKeyboardNav.ts src/hooks/useKeyboardNav.test.tsx
git commit -m "feat: add keyboard navigation hook"
```

---

## Task 11: Soundfont gate + App wiring

This is the integration task: the AudioContext + SpessaSynth backend are created on first user
gesture, the soundfont loads behind a progress/error gate, and `App` ties book selection,
navigation, the engine, and keyboard nav together. Verified via build + manual smoke (real audio
cannot be unit-tested in jsdom).

**Files:**
- Create: `src/components/SoundfontGate.tsx`
- Modify: `src/App.tsx`
- Create: `src/App.css`

- [ ] **Step 1: Implement `src/components/SoundfontGate.tsx`**

```tsx
import { useState } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { SpessaSynthBackend } from '../audio/SpessaSynthBackend';
import { loadSoundfont } from '../audio/soundfontCache';
import { SOUNDFONT_URL } from '../audio/soundfontConfig';

type Phase = 'idle' | 'loading' | 'ready' | 'error';

export function SoundfontGate({ children }: { children: (engine: AudioEngine) => React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [engine, setEngine] = useState<AudioEngine | null>(null);
  const [error, setError] = useState('');

  async function start() {
    setPhase('loading'); setError('');
    try {
      const context = new AudioContext();
      await context.resume(); // iOS unlock — start() is called from a click
      const sf = await loadSoundfont(SOUNDFONT_URL, setProgress);
      const backend = await SpessaSynthBackend.create(context, sf);
      setEngine(new AudioEngine(backend));
      setPhase('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  }

  if (phase === 'ready' && engine) return <>{children(engine)}</>;
  return (
    <div className="sf-gate">
      {phase === 'idle' && <button type="button" onClick={start}>Start (loads instrument sounds)</button>}
      {phase === 'loading' && <p>Loading instrument sounds… {Math.round(progress * 100)}%</p>}
      {phase === 'error' && (
        <div>
          <p className="error">Could not load instrument sounds: {error}</p>
          <button type="button" onClick={start}>Retry</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `src/App.tsx`**

```tsx
import { useEffect, useState, useCallback } from 'react';
import { BOOK_TITLES } from './data/books';
import { fetchBook } from './data/fetchBook';
import { buildAssetUrl } from './data/assetUrl';
import type { Book } from './data/bookTypes';
import { AudioEngine } from './audio/AudioEngine';
import { usePlayer } from './hooks/usePlayer';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { SoundfontGate } from './components/SoundfontGate';
import { BookNav } from './components/BookNav';
import { ExampleView } from './components/ExampleView';
import './App.css';

function Player({ engine }: { engine: AudioEngine }) {
  const [bookTitle, setBookTitle] = useState<string>(() => {
    return new URLSearchParams(window.location.search).get('book') ?? 'Creative Orchestration';
  });
  const [book, setBook] = useState<Book | null>(null);
  const [loadError, setLoadError] = useState('');
  const [ci, setCi] = useState(0);
  const [ei, setEi] = useState(0);
  const { state, ...controls } = usePlayer(engine);

  useEffect(() => {
    setBook(null); setLoadError(''); setCi(0); setEi(0);
    fetchBook(bookTitle).then(setBook).catch((e) => setLoadError(String(e.message ?? e)));
  }, [bookTitle]);

  const chapter = book?.chapters[ci];
  const example = chapter?.examples[ei];

  // Load the current example's MIDI into the engine.
  useEffect(() => {
    if (!book || !chapter || !example?.midi) return;
    const url = buildAssetUrl(book.baseUrl, chapter.name, example.midi);
    let cancelled = false;
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((buf) => { if (!cancelled) controls.load(buf); })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, ci, ei]);

  const select = useCallback((c: number, e: number) => { setCi(c); setEi(e); }, []);
  const clampExample = useCallback((c: number, e: number) => {
    if (!book) return;
    const exs = book.chapters[c]?.examples.length ?? 0;
    if (e >= 0 && e < exs) { setCi(c); setEi(e); }
  }, [book]);

  useKeyboardNav({
    togglePlay: () => (state.status === 'playing' ? controls.pause() : controls.play()),
    nextExample: () => clampExample(ci, ei + 1),
    prevExample: () => clampExample(ci, ei - 1),
    nextChapter: () => book && ci + 1 < book.chapters.length && (setCi(ci + 1), setEi(0)),
    prevChapter: () => ci > 0 && (setCi(ci - 1), setEi(0)),
  });

  return (
    <div className="app">
      <header>
        <label>
          Book{' '}
          <select value={bookTitle} onChange={(e) => setBookTitle(e.target.value)}>
            {BOOK_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </header>
      {loadError && <p className="error">Could not load book: {loadError}</p>}
      {book && chapter && example && (
        <main>
          <ExampleView
            baseUrl={book.baseUrl}
            chapterName={chapter.name}
            example={example}
            state={state}
            controls={controls}
          />
          <BookNav book={book} chapterIndex={ci} exampleIndex={ei} onSelect={select} />
        </main>
      )}
    </div>
  );
}

export default function App() {
  return <SoundfontGate>{(engine) => <Player engine={engine} />}</SoundfontGate>;
}
```

- [ ] **Step 3: Create `src/App.css`** (minimal layout — adjust to taste)

```css
.app { max-width: 900px; margin: 0 auto; padding: 1rem; font-family: system-ui, sans-serif; }
.transport { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin: 0.5rem 0; }
.transport input[type="range"] { flex: 1 1 200px; }
.score { max-width: 100%; height: auto; border: 1px solid #ddd; }
.book-nav summary { cursor: pointer; font-weight: 600; }
.book-nav ul { list-style: none; padding-left: 1rem; }
.book-nav button[aria-current="true"] { font-weight: 700; }
.error { color: #b00020; }
.sf-gate { display: grid; place-items: center; min-height: 60vh; }
```

- [ ] **Step 4: Type-check and build**

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`, open the dev URL, click "Start", wait for the soundfont, then:
- Confirm the "Creative Orchestration" book loads and the first example shows a score image.
- Press Space → audio plays through the new soundfont; a piccolo example sounds like a piccolo and
  a harp example sounds like a harp (distinct timbres — the whole point).
- Verify tempo +/- changes speed, seek scrubs, loop repeats, transpose shifts pitch.
- Verify ← / → move between examples and ↑ / ↓ between chapters.
- Switch to a book that uses MP3 (if any) and confirm the `<audio>` fallback appears.
- Test once on iOS Safari: audio starts after the "Start" tap and continues.

- [ ] **Step 6: Commit**

```bash
git add src/components/SoundfontGate.tsx src/App.tsx src/App.css
git commit -m "feat: wire soundfont gate, book selection, nav and engine into App"
```

---

## Task 12: Remove the old CRA app + finalize deploy

**Files:**
- Delete: `src/App.js`, `src/App.css` (old), `src/App.test.js`, `src/index.js`, `src/index.css`, `src/logo.svg`, `src/reportWebVitals.js`, `src/setupTests.js`, `src/components/BookPlayer.js`, `src/components/ChapterPlayer.js`, `src/components/ExamplePlayer.js`, `src/lib/unmute.js`
- Modify: `README.md`, `.github/` workflow if it references CRA
- Delete: `yarn.lock` (now using npm) — or keep yarn; pick one and be consistent.

- [ ] **Step 1: Delete old CRA source files**

```bash
git rm src/App.js src/App.test.js src/index.js src/index.css src/logo.svg \
  src/reportWebVitals.js src/setupTests.js \
  src/components/BookPlayer.js src/components/ChapterPlayer.js src/components/ExamplePlayer.js \
  src/lib/unmute.js
```
(If `src/App.css` old file conflicts with the new one, ensure the new `src/App.css` from Task 11 is the version kept.)

- [ ] **Step 2: Update the GitHub Pages workflow**

Run: `cat .github/workflows/*.yml`
Update build step to `npm ci && npm run build` and publish `dist/` (Vite output) instead of
`build/` (CRA output). Confirm the `base: '/music-ed-companion/'` in `vite.config.ts` matches the
Pages path.

- [ ] **Step 3: Rewrite `README.md`** to document: Vite dev/build/test commands, the soundfont
hosting note from Task 6, and the S3 data source.

- [ ] **Step 4: Full verification**

Run: `npm install && npm test && npm run build`
Expected: all tests PASS; `dist/` built cleanly; no references to react-scripts remain
(`grep -r react-scripts . --include=*.json` returns nothing).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove legacy CRA app and finalize Vite build/deploy"
```

---

## Self-Review notes (spec coverage)

- Modern stack (Vite/React19/TS): Tasks 1, 12. ✓
- Live SpessaSynth playback + orchestral soundfont: Tasks 4–7, 11. ✓
- SF3 + Cache-API download-once + progress: Tasks 5, 6, 11. ✓ (Preset-trimming fallback is a noted
  fast-follow, not a task — only build it if first-load size proves painful per Task 11 smoke.)
- Nav parity + working tempo + transport + loop + transpose: Tasks 9, 10, 11. ✓
- MP3 fallback parity: Task 9 (`Mp3Fallback`, `ExampleView`). ✓
- S3 data source unchanged: Tasks 2, 3. ✓
- iOS audio unlock: Task 11 (`SoundfontGate.start` resumes context on click). ✓
- Error handling (soundfont retry, per-example 404, book load error): Tasks 11 (gate + ScoreImage), 3. ✓
- Testing strategy (Vitest unit + light component + manual smoke): every task + Task 11 Step 5. ✓
- Out of scope respected (no score-follow / solo / pre-render / re-host / auth). ✓
