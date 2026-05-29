import { describe, it, expect } from 'vitest';
import { BOOK_TITLES } from './books';
import { bookCategory } from './bookMeta';

describe('bookCategory', () => {
  it('classifies counterpoint texts', () => {
    expect(bookCategory('Applied Counterpoint')).toBe('Counterpoint');
    expect(bookCategory('Elementary Counterpoint')).toBe('Counterpoint');
  });

  it('classifies orchestration texts', () => {
    expect(bookCategory('Creative Orchestration')).toBe('Orchestration');
  });

  it('classifies harmony texts', () => {
    expect(bookCategory('Twentieth Century Harmony')).toBe('Harmony');
    expect(bookCategory('Modulation')).toBe('Harmony');
  });

  it('classifies jazz & latin piano texts', () => {
    expect(bookCategory('Latin Jazz Piano')).toBe('Jazz & Latin Piano');
    expect(bookCategory('Jazz Piano The Left Hand')).toBe('Jazz & Latin Piano');
  });

  it('assigns a category to every known book', () => {
    for (const title of BOOK_TITLES) {
      expect(bookCategory(title), title).toBeTruthy();
    }
  });
});
