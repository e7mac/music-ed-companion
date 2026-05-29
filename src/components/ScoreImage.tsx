import { useState } from 'react';

export function ScoreImage({ src, alt }: { src: string | null; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (!src) return null;
  if (errored) return <p className="score-error">Score image unavailable.</p>;
  return <img className="score" src={src} alt={alt} onError={() => setErrored(true)} />;
}
