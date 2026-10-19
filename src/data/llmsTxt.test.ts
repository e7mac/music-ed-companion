import { describe, it, expect } from 'vitest';
import { BOOK_TITLES } from './books';
import { buildLlmsTxt, checkLlmsTxt, PUBLIC_DOMAIN_BOOKS } from './llmsTxt';

describe('llms.txt', () => {
  const text = buildLlmsTxt();

  it('passes the structural/privacy check', () => {
    expect(checkLlmsTxt(text)).toEqual([]);
  });

  it('lists exactly the public-domain books, no other book', () => {
    for (const t of BOOK_TITLES) {
      const listed = text.includes(`?book=${encodeURIComponent(t)})`);
      expect(listed, t).toBe(PUBLIC_DOMAIN_BOOKS.some((b) => b.title === t));
    }
  });

  it('the check rejects a copyrighted book and a private path', () => {
    expect(checkLlmsTxt(text + '- [x](https://textbook.realmusictheory.com/?book=Latin%20Jazz%20Piano)\n')).not.toEqual([]);
    expect(checkLlmsTxt(text + '- [x](https://textbook.realmusictheory.com/admin/x)\n')).not.toEqual([]);
    expect(checkLlmsTxt(text + '- [x](http://localhost:5173/)\n')).not.toEqual([]);
  });
});
