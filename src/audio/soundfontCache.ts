const CACHE_NAME = 'music-ed-soundfont-v1';

export async function clearSoundfontCache(url: string): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  await cache.delete(url);
}

export async function loadSoundfont(
  url: string,
  onProgress: (fraction: number) => void,
): Promise<ArrayBuffer> {
  const cache = await caches.open(CACHE_NAME);
  const hit = await cache.match(url);
  if (hit) {
    onProgress(1);
    return hit.arrayBuffer();
  }

  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download soundfont (HTTP ${res.status})`);
  }
  const total = Number(res.headers.get('Content-Length')) || 0;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total) onProgress(Math.min(1, received / total));
  }
  onProgress(1);

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) { merged.set(c, offset); offset += c.length; }

  await cache.put(url, new Response(merged.slice().buffer));
  return merged.buffer;
}
