// URL of the orchestral soundfont (SF3, Vorbis-compressed) used for MIDI playback.
// Shipped as a static asset in public/soundfonts/ so it deploys with the GitHub Pages
// build. BASE_URL resolves to '/' in dev and '/music-ed-companion/' in the production
// build, so this works in both. See SOUNDFONT.md.
export const SOUNDFONT_URL = `${import.meta.env.BASE_URL}soundfonts/FluidR3_GM.sf3`;
