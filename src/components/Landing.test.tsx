import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Landing } from './Landing';
import { BOOK_TITLES } from '../data/books';

describe('Landing', () => {
  it('renders a hero heading', () => {
    render(<Landing onSelectBook={() => {}} />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders every book in the library', () => {
    render(<Landing onSelectBook={() => {}} />);
    for (const title of BOOK_TITLES) {
      expect(screen.getByRole('button', { name: new RegExp(title) })).toBeInTheDocument();
    }
  });

  it('invokes onSelectBook with the chosen title', async () => {
    const onSelectBook = vi.fn();
    render(<Landing onSelectBook={onSelectBook} />);
    await userEvent.click(
      screen.getByRole('button', { name: new RegExp('Creative Orchestration') }),
    );
    expect(onSelectBook).toHaveBeenCalledWith('Creative Orchestration');
  });
});
