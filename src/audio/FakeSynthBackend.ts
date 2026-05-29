import type { SynthBackend } from './SynthBackend';

export class FakeSynthBackend implements SynthBackend {
  duration = 10;
  rate = 1;
  transpose = 0;
  loop = false;
  playing = false;
  current = 0;
  loadCalls = 0;
  private progressCb: ((c: number, d: number) => void) | null = null;
  private endCb: (() => void) | null = null;

  async loadSong(_midi: ArrayBuffer): Promise<void> {
    this.loadCalls += 1;
    this.current = 0;
    this.playing = false;
  }
  play() { this.playing = true; }
  pause() { this.playing = false; }
  stop() { this.playing = false; this.current = 0; }
  setCurrentTime(s: number) { this.current = s; }
  getDuration() { return this.duration; }
  setPlaybackRate(r: number) { this.rate = r; }
  setTranspose(n: number) { this.transpose = n; }
  setLoop(e: boolean) { this.loop = e; }
  onProgress(cb: (c: number, d: number) => void) { this.progressCb = cb; }
  onEnd(cb: () => void) { this.endCb = cb; }

  // test helpers
  emitProgress(c: number) { this.progressCb?.(c, this.duration); }
  emitEnd() { this.endCb?.(); }
}
