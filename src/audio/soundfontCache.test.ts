import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadSoundfont } from './soundfontCache';

function streamResponse(bytes: Uint8Array, total: number) {
  let sent = false;
  const body = new ReadableStream({
    pull(controller) {
      if (sent) { controller.close(); return; }
      sent = true;
      controller.enqueue(bytes);
    },
  });
  return new Response(body, { headers: { 'Content-Length': String(total) } });
}

describe('loadSoundfont', () => {
  beforeEach(() => {
    const store = new Map<string, Response>();
    vi.stubGlobal('caches', {
      open: async () => ({
        match: async (k: string) => store.get(k),
        put: async (k: string, v: Response) => { store.set(k, v); },
      }),
    });
  });

  it('downloads, reports progress, and caches on a miss', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    vi.stubGlobal('fetch', vi.fn(async () => streamResponse(bytes, 4)));
    const progress: number[] = [];
    const buf = await loadSoundfont('https://x/sf.sf3', (p) => progress.push(p));
    expect(new Uint8Array(buf)).toEqual(bytes);
    expect(progress.at(-1)).toBe(1); // 100%
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('serves from cache without fetching on a hit', async () => {
    const cached = new Response(new Uint8Array([9, 9]).buffer);
    vi.stubGlobal('caches', {
      open: async () => ({ match: async () => cached.clone(), put: async () => {} }),
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const buf = await loadSoundfont('https://x/sf.sf3', () => {});
    expect(new Uint8Array(buf)).toEqual(new Uint8Array([9, 9]));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
