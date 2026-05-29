import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchBook } from './fetchBook';

const validBook = {
  name: 'Creative Orchestration',
  baseUrl: 'https://x/CO/',
  chapters: [{ name: 'Chapter 1', examples: [{ name: 'Ex2-1 Piccolo', midi: 'a.mid', image: 'a.png' }] }],
};

afterEach(() => vi.restoreAllMocks());

describe('fetchBook', () => {
  it('fetches and returns a parsed book', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => validBook })));
    const book = await fetchBook('Creative Orchestration');
    expect(book.name).toBe('Creative Orchestration');
    expect(book.chapters[0].examples[0].name).toBe('Ex2-1 Piccolo');
  });

  it('throws a clear error on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })));
    await expect(fetchBook('Nope')).rejects.toThrow(/Failed to load book "Nope".*404/);
  });

  it('throws when the payload is missing chapters', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ name: 'x', baseUrl: 'y' }) })));
    await expect(fetchBook('x')).rejects.toThrow(/invalid book data/i);
  });
});
