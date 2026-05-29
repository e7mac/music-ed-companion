import type { PlaybackStatus } from '../audio/SynthBackend';

interface Props {
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  tempo: number;
  transpose: number;
  loop: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (s: number) => void;
  onTempo: (m: number) => void;
  onTranspose: (n: number) => void;
  onLoop: (e: boolean) => void;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function TransportBar(props: Props) {
  const playing = props.status === 'playing';
  return (
    <div className="transport">
      <button type="button" aria-label={playing ? 'Pause' : 'Play'} onClick={playing ? props.onPause : props.onPlay}>
        {playing ? '⏸' : '▶'}
      </button>

      <input
        type="range" aria-label="Seek"
        min={0} max={props.duration || 0} step={0.1} value={props.currentTime}
        onChange={(e) => props.onSeek(Number(e.target.value))}
      />

      <span className="tempo">
        Tempo
        <button type="button" aria-label="Slower" onClick={() => props.onTempo(round1(props.tempo - 0.1))}>−</button>
        {props.tempo.toFixed(1)}x
        <button type="button" aria-label="Faster" onClick={() => props.onTempo(round1(props.tempo + 0.1))}>+</button>
      </span>

      <span className="transpose">
        Transpose
        <button type="button" aria-label="Transpose down" onClick={() => props.onTranspose(props.transpose - 1)}>−</button>
        {props.transpose > 0 ? `+${props.transpose}` : props.transpose}
        <button type="button" aria-label="Transpose up" onClick={() => props.onTranspose(props.transpose + 1)}>+</button>
      </span>

      <label className="loop">
        <input type="checkbox" checked={props.loop} onChange={(e) => props.onLoop(e.target.checked)} /> Loop
      </label>
    </div>
  );
}
