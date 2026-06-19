import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransportBar } from './TransportBar';

const baseProps = {
  status: 'ready' as const,
  currentTime: 0, duration: 10, tempo: 1, transpose: 0, loop: false, volume: 0.5,
  onPlay: vi.fn(), onPause: vi.fn(), onSeek: vi.fn(),
  onTempo: vi.fn(), onTranspose: vi.fn(), onLoop: vi.fn(), onVolume: vi.fn(),
};

describe('TransportBar', () => {
  it('calls onPlay when play is clicked while not playing', async () => {
    const onPlay = vi.fn();
    render(<TransportBar {...baseProps} onPlay={onPlay} />);
    await userEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(onPlay).toHaveBeenCalled();
  });

  it('shows pause and calls onPause when playing', async () => {
    const onPause = vi.fn();
    render(<TransportBar {...baseProps} status="playing" onPause={onPause} />);
    await userEvent.click(screen.getByRole('button', { name: /pause/i }));
    expect(onPause).toHaveBeenCalled();
  });

  it('changes tempo via the tempo control', async () => {
    const onTempo = vi.fn();
    render(<TransportBar {...baseProps} onTempo={onTempo} />);
    await userEvent.click(screen.getByRole('button', { name: /faster/i }));
    expect(onTempo).toHaveBeenCalledWith(1.1);
  });

  it('reveals the volume slider behind the volume button and reports changes', async () => {
    const onVolume = vi.fn();
    render(<TransportBar {...baseProps} volume={0.5} onVolume={onVolume} />);
    // Slider is hidden until the master button is clicked.
    expect(screen.queryByRole('slider', { name: /^volume$/i })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /volume/i }));
    const slider = screen.getByRole('slider', { name: /^volume$/i });
    expect(slider).toBeTruthy();
    fireEvent.change(slider, { target: { value: '0.2' } });
    expect(onVolume).toHaveBeenCalledWith(0.2);
  });
});
