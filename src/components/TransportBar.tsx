import { useEffect, useRef, useState } from 'react';
import type { PlaybackStatus } from '../audio/SynthBackend';

interface Props {
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  tempo: number;
  transpose: number;
  loop: boolean;
  /** Master playback volume, 0–1. */
  volume: number;
  /** True while the audio engine is being created/initialized after a Play tap. */
  busy?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (s: number) => void;
  onTempo: (m: number) => void;
  onTranspose: (n: number) => void;
  onLoop: (e: boolean) => void;
  onVolume: (v: number) => void;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);

function VolumeIcon({ level }: { level: number }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M3 9v6h4l5 4V5L7 9H3z" />
      {level <= 0.001 ? (
        <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : level < 0.5 ? (
        <path d="M16 9.5a3.5 3.5 0 010 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <path d="M16 8a6 6 0 010 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M16.5 11a2 2 0 010 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/** A master-volume button that reveals a slider popover. */
function VolumeControl({ volume, onVolume }: { volume: number; onVolume: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pct = Math.round(volume * 100);
  return (
    <div className="volume" ref={ref}>
      <button
        type="button"
        className="volume-btn"
        aria-label={`Volume ${pct}%`}
        aria-expanded={open}
        title="Volume"
        onClick={() => setOpen((o) => !o)}
      >
        <VolumeIcon level={volume} />
      </button>
      {open && (
        <div className="volume-popover" role="group" aria-label="Volume">
          <input
            type="range"
            className="volume-slider"
            aria-label="Volume"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            autoFocus
            onChange={(e) => onVolume(Number(e.target.value))}
          />
          <span className="volume-value">{pct}%</span>
        </div>
      )}
    </div>
  );
}

function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TransportBar(props: Props) {
  const playing = props.status === 'playing';
  return (
    <div className="transport">
      <button
        type="button"
        className="play-btn"
        aria-label={playing ? 'Pause' : 'Play'}
        onClick={playing ? props.onPause : props.onPlay}
      >
        {props.busy ? <span className="spinner" aria-hidden="true" /> : playing ? <PauseIcon /> : <PlayIcon />}
      </button>

      <VolumeControl volume={props.volume} onVolume={props.onVolume} />

      <div className="seek">
        <input
          type="range"
          aria-label="Seek"
          min={0}
          max={props.duration || 0}
          step={0.1}
          value={props.currentTime}
          onChange={(e) => props.onSeek(Number(e.target.value))}
        />
        <span className="time">
          {fmtTime(props.currentTime)} / {fmtTime(props.duration)}
        </span>
      </div>

      <div className="stepper" role="group" aria-label="Tempo">
        <span className="stepper-label">Tempo</span>
        <button type="button" aria-label="Slower" onClick={() => props.onTempo(round1(props.tempo - 0.1))}>−</button>
        <span className="stepper-value">{props.tempo.toFixed(1)}×</span>
        <button type="button" aria-label="Faster" onClick={() => props.onTempo(round1(props.tempo + 0.1))}>+</button>
      </div>

      <div className="stepper" role="group" aria-label="Transpose">
        <span className="stepper-label">Transpose</span>
        <button type="button" aria-label="Transpose down" onClick={() => props.onTranspose(props.transpose - 1)}>−</button>
        <span className="stepper-value">{props.transpose > 0 ? `+${props.transpose}` : props.transpose}</span>
        <button type="button" aria-label="Transpose up" onClick={() => props.onTranspose(props.transpose + 1)}>+</button>
      </div>

      <label className={`loop-toggle ${props.loop ? 'on' : ''}`}>
        <input type="checkbox" checked={props.loop} onChange={(e) => props.onLoop(e.target.checked)} />
        Loop
      </label>
    </div>
  );
}
