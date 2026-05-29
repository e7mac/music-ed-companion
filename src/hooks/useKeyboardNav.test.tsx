import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardNav } from './useKeyboardNav';

function press(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }));
}

describe('useKeyboardNav', () => {
  it('maps keys to handlers', () => {
    const h = { togglePlay: vi.fn(), nextExample: vi.fn(), prevExample: vi.fn(), nextChapter: vi.fn(), prevChapter: vi.fn() };
    renderHook(() => useKeyboardNav(h));
    press(' '); expect(h.togglePlay).toHaveBeenCalled();
    press('ArrowRight'); expect(h.nextExample).toHaveBeenCalled();
    press('ArrowLeft'); expect(h.prevExample).toHaveBeenCalled();
    press('ArrowUp'); expect(h.nextChapter).toHaveBeenCalled();
    press('ArrowDown'); expect(h.prevChapter).toHaveBeenCalled();
  });
});
