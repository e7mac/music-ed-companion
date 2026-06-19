// URL of the orchestral soundfont (SF3, Vorbis-compressed) used for MIDI playback.
// Shipped as a static asset in public/soundfonts/ so it deploys with the GitHub Pages
// build. BASE_URL resolves to '/' in dev and '/music-ed-companion/' in the production
// build, so this works in both. See SOUNDFONT.md.
export const SOUNDFONT_URL = `${import.meta.env.BASE_URL}soundfonts/FluidR3_GM.sf3`;

// Master output gain for MIDI playback (0–1). FluidR3_GM plays hot, so we
// attenuate the synth before the speakers to keep playback at a comfortable
// level (users reported the piano was too loud). Lower = quieter; 0.5 ≈ −6 dB.
export const MASTER_GAIN = 0.5;
