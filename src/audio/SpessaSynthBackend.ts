/**
 * SpessaSynthBackend — wraps spessasynth_lib v4 (WorkletSynthesizer + Sequencer).
 *
 * Discovered v4 API (from node_modules/spessasynth_lib/dist/index.d.ts):
 *   - WorkletSynthesizer(context, config?)          — AudioWorklet-based synth
 *   - synth.soundBankManager.addSoundBank(buf, id)  — load soundfont
 *   - await synth.isReady                           — resolves when ready
 *   - synth.setSystemParameter('keyShift', n)       — transpose in semitones
 *   - new Sequencer(synth, options?)                — MIDI sequencer
 *   - sequencer.loadNewSongList([{ binary: ArrayBuffer }])
 *   - sequencer.play() / pause() / (stop = pause + currentTime=0)
 *   - sequencer.currentTime   — get/set, in SECONDS
 *   - sequencer.duration      — get, in SECONDS
 *   - sequencer.playbackRate  — get/set (1 = normal)
 *   - sequencer.loopCount     — -1 = infinite, 0 = no loop
 *   - sequencer.eventHandler.addEvent('songEnded', id, cb)
 *   - sequencer.eventHandler.addEvent('timeChange', id, cb) — cb receives seconds
 *
 * Worklet processor file: spessasynth_lib/dist/spessasynth_processor.min.js
 * (registered via context.audioWorklet.addModule before constructing WorkletSynthesizer)
 */

import { WorkletSynthesizer, Sequencer } from 'spessasynth_lib';
import type { SynthBackend } from './SynthBackend';

export class SpessaSynthBackend implements SynthBackend {
  private synth: WorkletSynthesizer;
  private seq: Sequencer;

  // Persisted settings — reapplied on every loadSong so they survive song changes
  private _rate = 1;
  private _transpose = 0;
  private _loop = false;

  // User-registered callbacks
  private _progressCb: ((current: number, duration: number) => void) | null = null;
  private _endCb: (() => void) | null = null;

  // rAF handle for the progress polling loop
  private _rafHandle: number | null = null;

  // Whether the end event has fired for the current song (prevents double-fire)
  private _ended = false;

  private constructor(synth: WorkletSynthesizer, seq: Sequencer) {
    this.synth = synth;
    this.seq = seq;
  }

  /**
   * Factory — call after a user gesture so the AudioContext can be resumed by the caller.
   *
   * @param context   A (possibly suspended) AudioContext. The caller should resume it.
   * @param soundfont Raw SF2/SF3/DLS bytes.
   */
  static async create(
    context: AudioContext,
    soundfont: ArrayBuffer,
  ): Promise<SpessaSynthBackend> {
    // Register the AudioWorklet processor shipped with the library.
    // new URL(..., import.meta.url) lets Vite copy/bundle the file correctly.
    await context.audioWorklet.addModule(
      new URL(
        '../../node_modules/spessasynth_lib/dist/spessasynth_processor.min.js',
        import.meta.url,
      ).href,
    );

    const synth = new WorkletSynthesizer(context, { eventsEnabled: false });
    await synth.soundBankManager.addSoundBank(soundfont, 'main');
    await synth.isReady;

    // Wire synth output → speakers
    synth.connect(context.destination);

    // Create the single Sequencer instance here (once per backend lifetime)
    const seq = new Sequencer(synth);
    const backend = new SpessaSynthBackend(synth, seq);

    // Wire events once; the same handlers survive all song changes
    seq.eventHandler.addEvent('songEnded', 'backend', () => {
      backend._ended = true;
      backend._stopRaf();
      if (backend._endCb) {
        backend._endCb();
      }
    });

    seq.eventHandler.addEvent('timeChange', 'backend', (newTime: number) => {
      if (backend._progressCb) {
        backend._progressCb(newTime, seq.duration);
      }
    });

    return backend;
  }

  // ------------------------------------------------------------------ //
  //  SynthBackend interface                                              //
  // ------------------------------------------------------------------ //

  async loadSong(midi: ArrayBuffer): Promise<void> {
    // Stop any ongoing playback and rAF loop
    this._stopRaf();
    this.seq.pause();
    this._ended = false;

    // Reuse the existing sequencer — load the new song into it
    this.seq.loadNewSongList([{ binary: midi }]);

    // The song list is loaded synchronously from the main thread perspective;
    // wait one tick so the worklet has processed the list and midiData is populated.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    // Reapply persisted settings
    this.seq.playbackRate = this._rate;
    this.synth.setSystemParameter('keyShift', this._transpose);
    this.seq.loopCount = this._loop ? -1 : 0;

    // Start paused (loadNewSongList auto-starts; pause immediately)
    this.seq.pause();
    this.seq.currentTime = 0;

    // rAF loop is NOT started here — it starts on play() and stops on pause()/stop()
    // Progress while paused is delivered by the 'timeChange' event wired above
  }

  play(): void {
    this._ended = false;
    this.seq.play();
    // Start the rAF polling loop for smooth progress updates and end-of-song detection
    this._startRaf();
  }

  pause(): void {
    this.seq.pause();
    this._stopRaf();
  }

  stop(): void {
    this.seq.pause();
    this.seq.currentTime = 0;
    this._ended = false;
    this._stopRaf();
    if (this._progressCb) {
      this._progressCb(0, this.seq.duration);
    }
  }

  setCurrentTime(seconds: number): void {
    this.seq.currentTime = seconds;
  }

  getDuration(): number {
    return this.seq.duration;
  }

  setPlaybackRate(rate: number): void {
    this._rate = rate;
    this.seq.playbackRate = rate;
  }

  setTranspose(semitones: number): void {
    this._transpose = semitones;
    this.synth.setSystemParameter('keyShift', semitones);
  }

  setLoop(enabled: boolean): void {
    this._loop = enabled;
    this.seq.loopCount = enabled ? -1 : 0;
  }

  onProgress(cb: (current: number, duration: number) => void): void {
    this._progressCb = cb;
  }

  onEnd(cb: () => void): void {
    this._endCb = cb;
  }

  dispose(): void {
    this._stopRaf();
    this.seq.pause();
  }

  // ------------------------------------------------------------------ //
  //  Internal helpers                                                    //
  // ------------------------------------------------------------------ //

  /**
   * requestAnimationFrame loop — fires the progress callback at display rate
   * and detects end-of-song when no end event was received (safety net).
   */
  private _startRaf(): void {
    this._stopRaf();

    const tick = () => {
      const seq = this.seq;

      const current = seq.currentHighResolutionTime ?? seq.currentTime;
      const duration = seq.duration;

      if (this._progressCb) {
        this._progressCb(current, duration);
      }

      // Safety-net end detection: if playing past the end and no end event fired
      if (
        !this._ended &&
        !this._loop &&
        duration > 0 &&
        current >= duration &&
        !seq.paused
      ) {
        this._ended = true;
        this._stopRaf();
        if (this._endCb) {
          this._endCb();
        }
        return;
      }

      this._rafHandle = requestAnimationFrame(tick);
    };

    this._rafHandle = requestAnimationFrame(tick);
  }

  private _stopRaf(): void {
    if (this._rafHandle !== null) {
      cancelAnimationFrame(this._rafHandle);
      this._rafHandle = null;
    }
  }
}
