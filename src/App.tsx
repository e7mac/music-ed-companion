import { useEffect, useState, useCallback, useRef } from 'react';
import { BOOK_TITLES } from './data/books';
import { fetchBook } from './data/fetchBook';
import { buildAssetUrl } from './data/assetUrl';
import type { Book } from './data/bookTypes';
import { AudioEngine } from './audio/AudioEngine';
import { useSoundfontEngine } from './hooks/useSoundfontEngine';
import { usePlayer } from './hooks/usePlayer';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { useSeo } from './hooks/useSeo';
import { BookNav } from './components/BookNav';
import { ExampleView } from './components/ExampleView';
import './App.css';

export default function App() {
  const {
    engine,
    ensureEngine,
    status: sfStatus,
    progress: sfProgress,
    error: sfError,
    retry,
  } = useSoundfontEngine();

  const [bookTitle, setBookTitle] = useState<string>(
    () => new URLSearchParams(window.location.search).get('book') ?? 'Creative Orchestration',
  );
  const [book, setBook] = useState<Book | null>(null);
  const [loadError, setLoadError] = useState('');
  const [ci, setCi] = useState(0);
  const [ei, setEi] = useState(0);
  const [exampleError, setExampleError] = useState('');
  const [igniting, setIgniting] = useState(false);

  const { state, ...controls } = usePlayer(engine);
  useSeo(bookTitle);

  const changeBook = useCallback((title: string) => {
    setBookTitle(title);
    const url = new URL(window.location.href);
    url.searchParams.set('book', title);
    window.history.replaceState(null, '', url);
  }, []);

  useEffect(() => {
    setBook(null);
    setLoadError('');
    setCi(0);
    setEi(0);
    fetchBook(bookTitle)
      .then(setBook)
      .catch((e) => setLoadError(String(e.message ?? e)));
  }, [bookTitle]);

  const chapter = book?.chapters[ci];
  const example = chapter?.examples[ei];

  // Load the current example's MIDI into the engine, deduping concurrent/repeat loads.
  const loadedKey = useRef<string | null>(null);
  const inflight = useRef<{ key: string; p: Promise<void> } | null>(null);

  const loadExampleInto = useCallback(
    (eng: AudioEngine): Promise<void> => {
      if (!book || !chapter || !example?.midi) return Promise.resolve();
      const key = `${bookTitle}|${ci}|${ei}`;
      if (loadedKey.current === key) return Promise.resolve();
      if (inflight.current?.key === key) return inflight.current.p;
      const url = buildAssetUrl(book.baseUrl, chapter.name, example.midi);
      const p = fetch(url)
        .then((r) => r.arrayBuffer())
        .then((buf) => eng.load(buf))
        .then(() => {
          loadedKey.current = key;
        });
      inflight.current = { key, p };
      p.catch(() => {
        if (inflight.current?.key === key) inflight.current = null;
      });
      return p;
    },
    [book, chapter, example, bookTitle, ci, ei],
  );

  // Once the engine exists, preload the current example as the user navigates.
  useEffect(() => {
    if (!engine) return;
    setExampleError('');
    loadExampleInto(engine).catch((err) =>
      setExampleError(err instanceof Error ? err.message : String(err)),
    );
  }, [engine, loadExampleInto]);

  const togglePlay = useCallback(async () => {
    if (state.status === 'playing') {
      controls.pause();
      return;
    }
    try {
      setIgniting(true);
      const eng = engine ?? (await ensureEngine());
      await loadExampleInto(eng);
      eng.play();
    } catch (err) {
      setExampleError(err instanceof Error ? err.message : String(err));
    } finally {
      setIgniting(false);
    }
  }, [engine, ensureEngine, state.status, controls, loadExampleInto]);

  const select = useCallback((c: number, e: number) => {
    setCi(c);
    setEi(e);
  }, []);
  const clampExample = useCallback(
    (c: number, e: number) => {
      if (!book) return;
      const exs = book.chapters[c]?.examples.length ?? 0;
      if (e >= 0 && e < exs) {
        setCi(c);
        setEi(e);
      }
    },
    [book],
  );

  useKeyboardNav({
    togglePlay: () => {
      void togglePlay();
    },
    nextExample: () => {
      clampExample(ci, ei + 1);
    },
    prevExample: () => {
      clampExample(ci, ei - 1);
    },
    nextChapter: () => {
      if (book && ci + 1 < book.chapters.length) {
        setCi(ci + 1);
        setEi(0);
      }
    },
    prevChapter: () => {
      if (ci > 0) {
        setCi(ci - 1);
        setEi(0);
      }
    },
  });

  // Play/pause both route through the toggle (which lazily creates the engine).
  const transportControls = {
    play: () => void togglePlay(),
    pause: () => void togglePlay(),
    seek: controls.seek,
    setTempo: controls.setTempo,
    setTranspose: controls.setTranspose,
    setLoop: controls.setLoop,
  };

  const busy = igniting || state.status === 'loading';

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">♪</span>
          <span className="brand-name">Music Ed</span>
        </div>

        <label className="book-select">
          <span className="sr-only">Book</span>
          <select value={bookTitle} onChange={(e) => changeBook(e.target.value)}>
            {BOOK_TITLES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <div className="sf-status" aria-live="polite">
          {sfStatus === 'downloading' && (
            <span className="sf-chip loading">
              <span className="spinner" aria-hidden="true" /> Loading instruments {Math.round(sfProgress * 100)}%
            </span>
          )}
          {sfStatus === 'error' && (
            <span className="sf-chip error" title={sfError}>
              Audio unavailable{' '}
              <button type="button" onClick={retry}>
                Retry
              </button>
            </span>
          )}
        </div>
      </header>

      {loadError && <p className="banner error">Could not load book: {loadError}</p>}
      {exampleError && <p className="banner error">Could not load example: {exampleError}</p>}
      {!book && !loadError && <p className="placeholder">Loading {bookTitle}…</p>}

      {book && chapter && example && (
        <div className="layout">
          <main className="content">
            <ExampleView
              baseUrl={book.baseUrl}
              chapterName={chapter.name}
              example={example}
              state={state}
              busy={busy}
              controls={transportControls}
            />
          </main>
          <BookNav book={book} chapterIndex={ci} exampleIndex={ei} onSelect={select} />
        </div>
      )}

      <footer className="app-footer">
        <span className="app-footer-label">More tools</span>
        <a href="https://realeartrainer.com" target="_blank" rel="noopener noreferrer">
          Real Ear Trainer
        </a>
        <span className="app-footer-sep" aria-hidden="true">·</span>
        <a href="https://realsightreader.com" target="_blank" rel="noopener noreferrer">
          Real Sight Reader
        </a>
      </footer>
    </div>
  );
}
