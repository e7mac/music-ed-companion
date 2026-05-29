import type { Example } from '../data/bookTypes';
import { buildAssetUrl } from '../data/assetUrl';
import type { EngineState } from '../audio/AudioEngine';
import { ScoreImage } from './ScoreImage';
import { TransportBar } from './TransportBar';
import { Mp3Fallback } from './Mp3Fallback';

interface Props {
  baseUrl: string;
  chapterName: string;
  example: Example;
  state: EngineState;
  controls: {
    play: () => void; pause: () => void; seek: (s: number) => void;
    setTempo: (m: number) => void; setTranspose: (n: number) => void; setLoop: (e: boolean) => void;
  };
}

export function ExampleView({ baseUrl, chapterName, example, state, controls }: Props) {
  const imageSrc = example.image ? buildAssetUrl(baseUrl, chapterName, example.image) : null;
  return (
    <section className="example">
      <h3>{example.name}</h3>
      {example.midi ? (
        <TransportBar
          status={state.status}
          currentTime={state.currentTime}
          duration={state.duration}
          tempo={state.tempo}
          transpose={state.transpose}
          loop={state.loop}
          onPlay={controls.play}
          onPause={controls.pause}
          onSeek={controls.seek}
          onTempo={controls.setTempo}
          onTranspose={controls.setTranspose}
          onLoop={controls.setLoop}
        />
      ) : example.mp3 ? (
        <Mp3Fallback src={buildAssetUrl(baseUrl, chapterName, example.mp3)} />
      ) : null}
      <ScoreImage src={imageSrc} alt={example.name} />
    </section>
  );
}
