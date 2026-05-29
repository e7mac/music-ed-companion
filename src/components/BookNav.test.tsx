import { it, expect, vi } from 'vitest';
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
