export type PlaybackStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error';

export interface SynthBackend {
  /** Load a MIDI song from raw bytes; resolves when ready to play. */
  loadSong(midi: ArrayBuffer): Promise<void>;
  play(): void;
  pause(): void;
  stop(): void;
  /** Seek to an absolute time in seconds. */
  setCurrentTime(seconds: number): void;
  getDuration(): number;
  /** 1 = normal speed; 2 = twice as fast. */
  setPlaybackRate(rate: number): void;
  /** Semitone offset applied to all channels. */
  setTranspose(semitones: number): void;
  setLoop(enabled: boolean): void;
  /** Fired periodically with (currentSeconds, durationSeconds). */
  onProgress(cb: (current: number, duration: number) => void): void;
  /** Fired once when the song reaches its end (and loop is off). */
  onEnd(cb: () => void): void;
  /** Release resources (stop rAF loop, silence output). */
  dispose(): void;
}
