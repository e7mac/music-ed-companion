import { BOOK_TITLES } from '../data/books';
import { bookCategory } from '../data/bookMeta';
import '../Landing.css';

interface LandingProps {
  onSelectBook: (title: string) => void;
}

const STEPS = [
  {
    n: '1',
    title: 'Pick a book',
    body: 'Fifteen classic texts, from species counterpoint to orchestration.',
  },
  {
    n: '2',
    title: 'Choose an example',
    body: 'Every chapter’s figures, laid out next to the printed score.',
  },
  {
    n: '3',
    title: 'Press play',
    body: 'Rich orchestral MIDI playback, right beside the page.',
  },
];

export function Landing({ onSelectBook }: LandingProps) {
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">♪</span>
          <span className="brand-name">Music Ed</span>
        </div>
      </header>

      <section className="hero">
        <h1 className="hero-title">The textbook examples, finally heard.</h1>
        <p className="hero-sub">
          Orchestral playback for the musical examples in the great theory, counterpoint,
          harmony, and orchestration textbooks — alongside each score, free in your browser.
        </p>
        <a className="hero-cta" href="#library">Browse the library</a>
      </section>

      <section className="library" id="library" aria-labelledby="library-heading">
        <h2 id="library-heading" className="section-heading">The library</h2>
        <ul className="book-grid">
          {BOOK_TITLES.map((title) => (
            <li key={title}>
              <button
                type="button"
                className="book-card"
                onClick={() => onSelectBook(title)}
              >
                <span className="book-card-tag">{bookCategory(title)}</span>
                <span className="book-card-title">{title}</span>
                <span className="book-card-go" aria-hidden="true">Listen →</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="how" aria-labelledby="how-heading">
        <h2 id="how-heading" className="section-heading">How it works</h2>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.n} className="step">
              <span className="step-num" aria-hidden="true">{s.n}</span>
              <div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-body">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

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
