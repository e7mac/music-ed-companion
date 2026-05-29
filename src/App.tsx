import { useCallback, useEffect, useState } from 'react';
import { Landing } from './components/Landing';
import { Player } from './Player';
import { useSeo } from './hooks/useSeo';
import './App.css';

function readBookParam(): string | null {
  return new URLSearchParams(window.location.search).get('book');
}

/**
 * Route shell: a bare visit (no `?book=`) shows the landing page; `?book=<title>`
 * shows the player for that book. Navigation uses pushState so the player stays
 * deep-linkable and the browser back/forward buttons move between the two views.
 * The player's hooks (soundfont engine, etc.) only mount when a book is open, so
 * the landing page never downloads the soundfont.
 */
export default function App() {
  const [bookParam, setBookParam] = useState<string | null>(readBookParam);

  useEffect(() => {
    const onPop = () => setBookParam(readBookParam());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((title: string | null) => {
    const url = new URL(window.location.href);
    if (title) url.searchParams.set('book', title);
    else url.searchParams.delete('book');
    window.history.pushState(null, '', url);
    setBookParam(title);
  }, []);

  const openBook = useCallback((title: string) => navigate(title), [navigate]);
  const goHome = useCallback(() => navigate(null), [navigate]);

  useSeo(bookParam ?? '');

  return bookParam ? (
    <Player bookTitle={bookParam} onChangeBook={openBook} onHome={goHome} />
  ) : (
    <Landing onSelectBook={openBook} />
  );
}
