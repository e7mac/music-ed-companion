# Soundfont setup

MIDI examples are rendered in the browser by [SpessaSynth](https://github.com/spessasus/SpessaSynth)
using a General MIDI soundfont. Quality of the audio depends entirely on this soundfont, so we use a
rich orchestral one (FluidR3-class) rather than the previous generic Magenta `sgm_plus`.

## How the app loads it

`src/audio/soundfontConfig.ts` points at:

```
https://music-ed.s3.us-east-2.amazonaws.com/soundfonts/FluidR3_GM.sf3
```

On first visit the file is downloaded once (with a progress bar) and stored in the Cache API
(`src/audio/soundfontCache.ts`), so later visits load it instantly / offline.

## One-time hosting step (requires S3 bucket credentials)

1. Obtain a **FluidR3_GM** soundfont and convert it to **SF3** (Ogg-Vorbis compressed) — e.g. with
   the SpessaSynth web tool at https://spessasus.github.io/SpessaSynth/ → "Export → compressed SF3".
   SF3 brings a ~148 MB SF2 down to the tens-of-MB range.
2. Upload it to the existing bucket at `s3://music-ed/soundfonts/FluidR3_GM.sf3`, publicly readable,
   with the same permissive CORS the book JSON already uses.
3. Verify:
   ```
   curl -sI "https://music-ed.s3.us-east-2.amazonaws.com/soundfonts/FluidR3_GM.sf3"
   ```
   Expect `HTTP/1.1 200`, a `Content-Length` header, and `accept-ranges`.

If first-load size proves too heavy on mobile, a future fast-follow can trim the soundfont to only
the GM presets the books actually use (the orchestration book realistically touches <40 of 128).
