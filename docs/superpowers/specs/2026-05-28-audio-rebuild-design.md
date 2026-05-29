# music-ed-companion — Audio-First Rebuild

**Date:** 2026-05-28
**Status:** Design approved, ready for planning

## Problem

`music-ed-companion` is a player for music-theory/composition textbooks (book → chapter →
example, each example = a MIDI file + a score image, fetched as JSON from S3). The repo runs on a
dated stack (Create React App / react-scripts, React 17, react-bootstrap 4, class components) and
all examples play through the Magenta `sgm_plus` General MIDI soundfont via the `html-midi-player`
web component.

The triggering complaint is **audio quality for the orchestration books**. The "Creative
Orchestration" book is 127 examples, all MIDI + score image, no MP3 — and the examples are named
for specific instruments (Piccolo, Flute, Bb Clarinet, Harp, …). An orchestration textbook is
*about instrument timbre and color*, yet every example currently plays through the same flat
generic GM soundfont, so a piccolo and a harp sound essentially the same.

## Goal

Rebuild the player from scratch on a modern stack, with high-quality, true-to-instrument audio as
the headline feature.

## Decisions (locked during brainstorming)

- **Scope:** full rebuild (not an incremental patch).
- **Audio approach:** live in-browser MIDI playback (keeps interactivity: tempo, transpose, loop),
  through a real synth + a high-quality orchestral soundfont — *not* pre-rendered audio.
- **Soundfont:** a FluidR3 / Musyng-class rich orchestral GM soundfont.
- **Feature set:** today's navigation parity + a working tempo control + transport
  (play/pause/seek) + loop + transpose. (Score-follow explicitly out of scope.)

## Architecture

### Stack
- **Build:** Vite (replaces CRA/react-scripts).
- **UI:** React 19 + TypeScript, function components + hooks.
- **Styling:** keep it light; component-scoped CSS (or a small utility setup). Drop react-bootstrap
  unless a concrete need surfaces.
- **Deploy:** GitHub Pages via Vite static build (preserve the existing `e7mac.github.io/
  music-ed-companion` homepage + `gh-pages` deploy flow).

### Data source — unchanged
- Books are fetched read-only from the existing S3 bucket:
  `https://music-ed.s3.us-east-2.amazonaws.com/<book>.json`.
- JSON shape: `{ name, baseUrl, chapters: [{ name, examples: [{ name, midi?, mp3?, image? }] }] }`.
  Example asset URLs are `baseUrl + chapterName + "/" + (midi|mp3|image)`.
- The hardcoded book list moves from `App.js` into a typed config module (`data/books`).
- No content is re-hosted (15 books × ~127 examples).

### Audio engine (the core)

A standalone, React-free `AudioEngine` module wrapping **SpessaSynth** (JS SoundFont2/SF3/DLS
synthesizer + sequencer).

Responsibilities:
- Load a soundfont once at startup (see delivery strategy below).
- Parse each example's MIDI and play it via the SpessaSynth sequencer.
- Public API:
  - `loadSoundfont(): Promise<void>` (with progress callback)
  - `load(midiUrl): Promise<void>`
  - `play()`, `pause()`, `stop()`
  - `seek(seconds)`
  - `setTempo(multiplier)` — sequencer playback rate
  - `setTranspose(semitones)` — channel transpose
  - `setLoop(enabled)` — sequencer loop
  - state/observer callbacks: `onState`, `onProgress(currentTime, duration)`, `onEnd`
- iOS Safari audio-context unlock (resume on first user gesture; media-channel playback) is folded
  into the engine, replacing the standalone `unmute.js` hack.

All audio logic lives here so UI components stay declarative and the engine is unit-testable with a
mocked SpessaSynth.

### Soundfont delivery strategy (primary technical risk)

FluidR3/Musyng-class soundfonts are large raw (~148MB for FluidR3_GM; Musyng larger). Plan:

1. **Compress to SF3** (Ogg-Vorbis sample compression) — reduces to tens of MB. SpessaSynth loads
   SF3 natively.
2. **Download once, cache persistently** via the Cache API behind a service worker. First load
   shows a one-time progress bar; subsequent loads are instant/offline.
3. **Fallback if first-load size is still too heavy on mobile:** a build script scans all book
   MIDIs, computes the union of GM programs actually used (orchestral books realistically use <40
   of 128), and trims the soundfont to those presets.

**Build order:** ship v1 with full-SF3 + cache + progress bar. Keep preset-trimming as a fast
follow if first-load size proves painful in testing.

### Player features & UX

- **Navigation parity:** book selector (dropdown), chapter list with expandable example lists,
  ◀ / ▶ buttons for chapter and example, score image display.
- **Transport bar:** play/pause, seek scrubber (driven by `onProgress`), tempo control that
  actually works (the old one was a labeled-WIP dead control), loop toggle, transpose ±semitones.
- **Keyboard shortcuts (match current app):** Space = play/pause, ← / → = prev / next example,
  ↑ / ↓ = prev / next chapter.
- **MP3 fallback (parity):** some non-orchestration books ship `mp3` examples instead of MIDI.
  Those play through a native `<audio>` element fallback (no synth/transport features) so the
  rebuild doesn't regress those books.

### Module boundaries

| Module | Responsibility | Depends on |
|---|---|---|
| `audio/AudioEngine` | All playback logic; wraps SpessaSynth; no React | SpessaSynth |
| `audio/soundfontCache` | Fetch + Cache-API/service-worker caching of the SF3 | Cache API |
| `data/books` | Book list config, S3 fetch, TypeScript types | — |
| `hooks/usePlayer` | Bind engine state ⇄ React | AudioEngine |
| `components/BookNav` | Book/chapter/example navigation | data/books |
| `components/ScoreImage` | Render the example's score image | — |
| `components/TransportBar` | Play/seek/tempo/loop/transpose controls | usePlayer |
| `components/ExampleView` | Compose ScoreImage + TransportBar for current example | — |

### Error handling

- **Soundfont load failure:** the player is unusable without it → show a clear error + retry
  button; block playback UI until loaded.
- **Per-example MIDI/image 404:** inline error on that example; navigation and other examples keep
  working.
- **iOS audio unlock:** resume the audio context on first user gesture.

### Testing

- **Vitest unit tests** for `AudioEngine` with a mocked SpessaSynth: tempo/seek/transpose/loop
  state transitions, load/play/stop lifecycle.
- **Unit tests** for `data/books`: JSON parsing and shape validation.
- **Light component tests** for navigation and transport interactions.
- **Manual smoke test** on the "Creative Orchestration" book across desktop Chrome and iOS Safari,
  confirming distinct instrument timbres and working transport/tempo.

## Out of scope (YAGNI)

- Score-follow / moving playhead synced to the score image (no note→image coordinate data exists).
- Per-instrument solo / mixing.
- MP3 pre-rendering.
- Re-hosting book content.
- Accounts / auth / persistence.
