// URL of the orchestral soundfont (SF3, Vorbis-compressed) used for MIDI playback.
// Shipped as a static asset in public/soundfonts/ so it deploys with the GitHub Pages
// build. BASE_URL resolves to '/' in dev and '/music-ed-companion/' in the production
// build, so this works in both. See SOUNDFONT.md.
export const SOUNDFONT_URL = `${import.meta.env.BASE_URL}soundfonts/FluidR3_GM.sf3`;

// Default master output gain for MIDI playback (0–1). FluidR3_GM plays hot, so
// we attenuate the synth before the speakers (users reported the piano was too
// loud). This is just the default — users can adjust it via the volume control,
// and their choice is persisted in localStorage under VOLUME_STORAGE_KEY.
// Lower = quieter; 0.5 ≈ −6 dB.
export const DEFAULT_VOLUME = 0.5;

// localStorage key for the user's persisted playback volume (0–1).
export const VOLUME_STORAGE_KEY = 'mec-volume';
