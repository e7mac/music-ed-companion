import type { PlaybackStatus, SynthBackend } from './SynthBackend';

export interface EngineState {
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  tempo: number;
  transpose: number;
  loop: boolean;
}

type Listener = (state: EngineState) => void;

const MIN_TEMPO = 0.1;
const MAX_TEMPO = 5;

export class AudioEngine {
  private listeners = new Set<Listener>();
  private loadToken = 0;
  private state: EngineState = {
    status: 'idle',
    currentTime: 0,
    duration: 0,
    tempo: 1,
    transpose: 0,
    loop: false,
  };

  constructor(private backend: SynthBackend) {
    backend.onProgress((current, duration) => {
      this.patch({ currentTime: current, duration });
    });
    backend.onEnd(() => {
      this.backend.stop();
      this.patch({ status: 'ready', currentTime: 0 });
    });
  }

  getState(): EngineState {
    return { ...this.state };
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  async load(midi: ArrayBuffer): Promise<void> {
    const token = ++this.loadToken;
    this.patch({ status: 'loading', currentTime: 0 });
    try {
      await this.backend.loadSong(midi);
      if (token !== this.loadToken) return; // a newer load superseded this one
      this.backend.setPlaybackRate(this.state.tempo);
      this.backend.setTranspose(this.state.transpose);
      this.backend.setLoop(this.state.loop);
      this.patch({ status: 'ready', duration: this.backend.getDuration() });
    } catch (err) {
      if (token !== this.loadToken) return;
      this.patch({ status: 'error' });
      throw err;
    }
  }

  play(): void {
    this.backend.play();
    this.patch({ status: 'playing' });
  }

  pause(): void {
    this.backend.pause();
    this.patch({ status: 'paused' });
  }

  stop(): void {
    this.backend.stop();
    this.patch({ status: 'ready', currentTime: 0 });
  }

  seek(seconds: number): void {
    this.backend.setCurrentTime(seconds);
    this.patch({ currentTime: seconds });
  }

  setTempo(multiplier: number): void {
    const tempo = Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, multiplier));
    this.backend.setPlaybackRate(tempo);
    this.patch({ tempo });
  }

  setTranspose(semitones: number): void {
    this.backend.setTranspose(semitones);
    this.patch({ transpose: semitones });
  }

  setLoop(enabled: boolean): void {
    this.backend.setLoop(enabled);
    this.patch({ loop: enabled });
  }

  dispose(): void {
    this.backend.dispose();
  }

  private patch(partial: Partial<EngineState>): void {
    this.state = { ...this.state, ...partial };
    const snapshot = this.getState();
    this.listeners.forEach((l) => l(snapshot));
  }
}
