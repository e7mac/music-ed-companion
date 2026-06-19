import { useCallback, useEffect, useState } from 'react';
import type { AudioEngine } from '../audio/AudioEngine';
import { DEFAULT_VOLUME, VOLUME_STORAGE_KEY } from '../audio/soundfontConfig';

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** Read the persisted volume (0–1) from localStorage, falling back to the default. */
function loadVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (raw === null) return DEFAULT_VOLUME;
    const n = Number(raw);
    return Number.isFinite(n) ? clamp(n) : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
}

/**
 * Owns the user's playback volume: persisted in localStorage and re-applied to
 * the audio engine whenever one exists (including right after it's created, so
 * the saved level takes effect before the first note plays). The slider value
 * is independent of engine lifecycle, so it shows the saved level immediately.
 */
export function useVolume(engine: AudioEngine | null) {
  const [volume, setVolumeState] = useState<number>(loadVolume);

  // Apply to the engine on mount, when the engine appears, and on every change.
  useEffect(() => {
    engine?.setVolume(volume);
  }, [engine, volume]);

  const setVolume = useCallback((v: number) => {
    const next = clamp(v);
    setVolumeState(next);
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(next));
    } catch {
      // localStorage unavailable (private mode / blocked) — keep in-memory only.
    }
  }, []);

  return { volume, setVolume };
}
