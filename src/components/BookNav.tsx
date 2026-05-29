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
