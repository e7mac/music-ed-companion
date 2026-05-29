import { useEffect, useState, useMemo } from 'react';
import { AudioEngine, type EngineState } from '../audio/AudioEngine';

export function usePlayer(engine: AudioEngine) {
  const [state, setState] = useState<EngineState>(() => engine.getState());

  useEffect(() => {
    setState(engine.getState());
    return engine.subscribe(setState);
  }, [engine]);

  const controls = useMemo(
    () => ({
      load: (midi: ArrayBuffer) => engine.load(midi),
      play: () => engine.play(),
      pause: () => engine.pause(),
      stop: () => engine.stop(),
      seek: (s: number) => engine.seek(s),
      setTempo: (m: number) => engine.setTempo(m),
      setTranspose: (n: number) => engine.setTranspose(n),
      setLoop: (e: boolean) => engine.setLoop(e),
    }),
    [engine],
  );

  return { state, ...controls };
}
