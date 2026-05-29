import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AudioEngine } from '../audio/AudioEngine';
import { FakeSynthBackend } from '../audio/FakeSynthBackend';
import { usePlayer } from './usePlayer';

describe('usePlayer', () => {
  it('exposes engine state and re-renders on change', async () => {
    const engine = new AudioEngine(new FakeSynthBackend());
    const { result } = renderHook(() => usePlayer(engine));
    expect(result.current.state.status).toBe('idle');
    await act(async () => { await engine.load(new ArrayBuffer(8)); });
    expect(result.current.state.status).toBe('ready');
    act(() => result.current.play());
    expect(result.current.state.status).toBe('playing');
  });
});
