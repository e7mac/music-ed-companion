import { useState } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { SpessaSynthBackend } from '../audio/SpessaSynthBackend';
import { loadSoundfont, clearSoundfontCache } from '../audio/soundfontCache';
import { SOUNDFONT_URL } from '../audio/soundfontConfig';

type Phase = 'idle' | 'loading' | 'ready' | 'error';

export function SoundfontGate({ children }: { children: (engine: AudioEngine) => React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [engine, setEngine] = useState<AudioEngine | null>(null);
  const [error, setError] = useState('');

  async function start() {
    setPhase('loading'); setError('');
    try {
      const context = new AudioContext();
      await context.resume(); // iOS unlock — start() is called from a click
      const sf = await loadSoundfont(SOUNDFONT_URL, setProgress);
      const backend = await SpessaSynthBackend.create(context, sf);
      setEngine(new AudioEngine(backend));
      setPhase('ready');
    } catch (e) {
      // Attempt to evict a potentially corrupt cached soundfont so "Retry" re-downloads it.
      // Swallow any cache-clearing error so the original error is preserved.
      await clearSoundfontCache(SOUNDFONT_URL).catch(() => {});
      setError(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  }

  if (phase === 'ready' && engine) return <>{children(engine)}</>;
  return (
    <div className="sf-gate">
      {phase === 'idle' && <button type="button" onClick={start}>Start (loads instrument sounds)</button>}
      {phase === 'loading' && <p>Loading instrument sounds… {Math.round(progress * 100)}%</p>}
      {phase === 'error' && (
        <div>
          <p className="error">Could not load instrument sounds: {error}</p>
          <button type="button" onClick={start}>Retry</button>
        </div>
      )}
    </div>
  );
}
