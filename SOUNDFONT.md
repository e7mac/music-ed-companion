# Soundfont

MIDI examples are rendered in the browser by [SpessaSynth](https://github.com/spessasus/SpessaSynth)
using a General MIDI soundfont. Audio quality depends entirely on this soundfont, so we use a rich
orchestral one (FluidR3) rather than the previous generic Magenta `sgm_plus`.

## What ships

`public/soundfonts/FluidR3_GM.sf3` — FluidR3_GM converted to SF3 (Ogg-Vorbis compressed),
~22 MB (down from a 148 MB SF2). It is a static asset, so it deploys with the GitHub Pages build.

`src/audio/soundfontConfig.ts` resolves its URL via `import.meta.env.BASE_URL`, so it works both in
dev (`/soundfonts/...`) and in the production build under the `/music-ed-companion/` base.

On first visit the file downloads once (with a progress bar) and is stored in the Cache API
(`src/audio/soundfontCache.ts`); later visits load it instantly / offline.

## Regenerating the SF3 from an SF2 (headless, macOS)

`sl-web-ogg` (the encoder SpessaSynth's web app uses) is browser-only and won't run in Node. The
working headless path is `spessasynth_core` (runs in Node) + `oggenc` as the compression function:

1. `brew install vorbis-tools`
2. Load the SF2 with `SoundBankLoader.fromArrayBuffer(...)`.
3. `await bank.setSampleFormat({ format: "compressed", compressionFunction })`, where
   `compressionFunction(float32, sampleRate)` writes a 16-bit-PCM WAV and runs
   `oggenc -Q -q 4 -o out.ogg in.wav`, returning the ogg bytes as a `Uint8Array`.
4. `writeFileSync(out, Buffer.from(bank.writeSF2()))` — `writeSF2()` emits SF3 when the samples are
   flagged compressed.

FluidR3_GM compresses 148 MB → ~22 MB at `-q 4` in ~10s. Validate a sample with
`ogginfo` (extract via `sample.getRawData(true)`); expect valid mono Vorbis at the sample's native
rate. (Decoding SF3 in standalone Node logs "SF3 decoder has not been initialized" — that's a Node
limitation, not a bad file; the app's `WorkletSynthesizer` initializes the decoder on load.)

If the soundfont's size ever becomes a concern, trim it to only the GM presets the books use
(`spessasynth_core` can trim a bank in-place to a given MIDI's presets).
