import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { SpessaSynthBackend } from '../audio/SpessaSynthBackend';
import { loadSoundfont, clearSoundfontCache } from '../audio/soundfontCache';
import { SOUNDFONT_URL } from '../audio/soundfontConfig';

export type SoundfontStatus = 'downloading' | 'ready' | 'initializing' | 'error';

/**
 * Manages the orchestral soundfont and the audio engine.
 *
 * The soundfont *download* (the big, slow part) starts immediately on mount and
 * needs no AudioContext, so the rest of the app is usable right away. The
 * AudioContext + synth are created lazily on the first user gesture (via
 * `ensureEngine`), which is also what browser autoplay policies require.
 */
export function useSoundfontEngine() {
  const [status, setStatus] = useState<SoundfontStatus>('downloading');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [engine, setEngine] = useState<AudioEngine | null>(null);

  const bytesPromise = useRef<Promise<ArrayBuffer> | null>(null);
  const enginePromise = useRef<Promise<AudioEngine> | null>(null);
  const reloadToken = useRef(0);

  const download = useCallback(() => {
    const token = ++reloadToken.current;
    setStatus('downloading');
    setProgress(0);
    setError('');
    bytesPromise.current = loadSoundfont(SOUNDFONT_URL, (p) => {
      if (token === reloadToken.current) setProgress(p);
    })
      .then((bytes) => {
        if (token === reloadToken.current) setStatus((s) => (s === 'downloading' ? 'ready' : s));
        return bytes;
      })
      .catch(async (e) => {
        // Evict a possibly-corrupt cached copy so a retry re-downloads it.
        await clearSoundfontCache(SOUNDFONT_URL).catch(() => {});
        if (token === reloadToken.current) {
          setError(e instanceof Error ? e.message : String(e));
          setStatus('error');
        }
        throw e;
      });
  }, []);

  useEffect(() => {
    download();
  }, [download]);

  /**
   * Create (once) the AudioContext + synth + engine. MUST be called from a user
   * gesture so the AudioContext is allowed to start.
   */
  const ensureEngine = useCallback(async (): Promise<AudioEngine> => {
    if (enginePromise.current) return enginePromise.current;
    enginePromise.current = (async () => {
      const context = new AudioContext();
      await context.resume();
      setStatus((s) => (s === 'ready' ? 'initializing' : s));
      const bytes = await bytesPromise.current!;
      const backend = await SpessaSynthBackend.create(context, bytes);
      const created = new AudioEngine(backend);
      setEngine(created);
      setStatus('ready');
      return created;
    })();
    enginePromise.current.catch(() => {
      // Allow a later retry to rebuild the engine.
      enginePromise.current = null;
    });
    return enginePromise.current;
  }, []);

  const retry = useCallback(() => {
    if (status === 'error') download();
  }, [status, download]);

  return { engine, ensureEngine, status, progress, error, retry };
}
