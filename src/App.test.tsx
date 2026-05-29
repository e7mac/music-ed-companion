import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('./components/Landing', () => ({
  Landing: () => <div data-testid="landing-stub" />,
}));
vi.mock('./Player', () => ({
  Player: ({ bookTitle }: { bookTitle: string }) => (
    <div data-testid="player-stub">{bookTitle}</div>
  ),
}));

import App from './App';

describe('App routing', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('shows the landing page when there is no book param', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(screen.getByTestId('landing-stub')).toBeInTheDocument();
    expect(screen.queryByTestId('player-stub')).not.toBeInTheDocument();
  });

  it('shows the player for the book named in the url', () => {
    window.history.pushState({}, '', '/?book=Modulation');
    render(<App />);
    expect(screen.getByTestId('player-stub')).toHaveTextContent('Modulation');
    expect(screen.queryByTestId('landing-stub')).not.toBeInTheDocument();
  });
});
