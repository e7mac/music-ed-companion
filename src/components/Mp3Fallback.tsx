export function Mp3Fallback({ src }: { src: string }) {
  return <audio className="mp3" src={src} controls />;
}
