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
  busy?: boolean;
  controls: {
    play: () => void; pause: () => void; seek: (s: number) => void;
    setTempo: (m: number) => void; setTranspose: (n: number) => void; setLoop: (e: boolean) => void;
  };
}

export function ExampleView({ baseUrl, chapterName, example, state, busy, controls }: Props) {
  const imageSrc = example.image ? buildAssetUrl(baseUrl, chapterName, example.image) : null;
  return (
    <section className="example">
      <header className="example-head">
        <p className="example-chapter">{chapterName}</p>
        <h2 className="example-name">{example.name}</h2>
      </header>

      {example.midi ? (
        <TransportBar
          status={state.status}
          currentTime={state.currentTime}
          duration={state.duration}
          tempo={state.tempo}
          transpose={state.transpose}
          loop={state.loop}
          busy={busy}
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

      <div className="score-frame">
        <ScoreImage src={imageSrc} alt={example.name} />
      </div>
    </section>
  );
}
