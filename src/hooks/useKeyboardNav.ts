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
