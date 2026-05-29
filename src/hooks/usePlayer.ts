import { useEffect, useState, useMemo } from 'react';
import { AudioEngine, IDLE_ENGINE_STATE, type EngineState } from '../audio/AudioEngine';

/**
 * Binds an AudioEngine's state to React. The engine may be null (before the
 * first user gesture creates it); in that case the idle state is returned and
 * controls are no-ops.
 */
export function usePlayer(engine: AudioEngine | null) {
  const [state, setState] = useState<EngineState>(() => engine?.getState() ?? IDLE_ENGINE_STATE);

  useEffect(() => {
    if (!engine) {
      setState(IDLE_ENGINE_STATE);
      return;
    }
    setState(engine.getState());
    return engine.subscribe(setState);
  }, [engine]);

  const controls = useMemo(
    () => ({
      load: (midi: ArrayBuffer) => engine?.load(midi) ?? Promise.resolve(),
      play: () => engine?.play(),
      pause: () => engine?.pause(),
      stop: () => engine?.stop(),
      seek: (s: number) => engine?.seek(s),
      setTempo: (m: number) => engine?.setTempo(m),
      setTranspose: (n: number) => engine?.setTranspose(n),
      setLoop: (e: boolean) => engine?.setLoop(e),
    }),
    [engine],
  );

  return { state, ...controls };
}
