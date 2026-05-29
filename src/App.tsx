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
    togglePlay: () => { if (state.status === 'playing') { controls.pause(); } else { controls.play(); } },
    nextExample: () => { clampExample(ci, ei + 1); },
    prevExample: () => { clampExample(ci, ei - 1); },
    nextChapter: () => { if (book && ci + 1 < book.chapters.length) { setCi(ci + 1); setEi(0); } },
    prevChapter: () => { if (ci > 0) { setCi(ci - 1); setEi(0); } },
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
