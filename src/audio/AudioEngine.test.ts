import { describe, it, expect, beforeEach } from 'vitest';
import { AudioEngine } from './AudioEngine';
import { FakeSynthBackend } from './FakeSynthBackend';

describe('AudioEngine', () => {
  let backend: FakeSynthBackend;
  let engine: AudioEngine;

  beforeEach(() => {
    backend = new FakeSynthBackend();
    engine = new AudioEngine(backend);
  });

  it('starts idle and becomes ready after loading a song', async () => {
    expect(engine.getState().status).toBe('idle');
    await engine.load(new ArrayBuffer(8));
    expect(engine.getState().status).toBe('ready');
    expect(backend.loadCalls).toBe(1);
  });

  it('transitions to playing and paused', async () => {
    await engine.load(new ArrayBuffer(8));
    engine.play();
    expect(engine.getState().status).toBe('playing');
    engine.pause();
    expect(engine.getState().status).toBe('paused');
  });

  it('reapplies tempo, transpose and loop to a newly loaded song', async () => {
    engine.setTempo(1.5);
    engine.setTranspose(-2);
    engine.setLoop(true);
    await engine.load(new ArrayBuffer(8));
    expect(backend.rate).toBe(1.5);
    expect(backend.transpose).toBe(-2);
    expect(backend.loop).toBe(true);
  });

  it('clamps tempo to the 0.1x..5x range', () => {
    engine.setTempo(99);
    expect(engine.getState().tempo).toBe(5);
    engine.setTempo(0);
    expect(engine.getState().tempo).toBe(0.1);
  });

  it('notifies subscribers of progress', async () => {
    await engine.load(new ArrayBuffer(8));
    const seen: number[] = [];
    engine.subscribe((s) => seen.push(s.currentTime));
    backend.emitProgress(3);
    expect(seen.at(-1)).toBe(3);
  });

  it('returns to ready (currentTime 0) when the song ends', async () => {
    await engine.load(new ArrayBuffer(8));
    engine.play();
    backend.emitEnd();
    expect(engine.getState().status).toBe('ready');
    expect(engine.getState().currentTime).toBe(0);
  });
});
