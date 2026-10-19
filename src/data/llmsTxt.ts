// Builds /llms.txt (llmstxt.org) for textbook.realmusictheory.com.
//
// PRIVACY / COPYRIGHT: the public index (BOOK_TITLES) currently shows every
// book, but only the public-domain ones may be described to assistants. So
// this is an ALLOWLIST: a book added to BOOK_TITLES is NOT listed here until
// someone adds it to PUBLIC_DOMAIN_BOOKS. Status last checked 2026-10-12
// (Copyright Office records + CCE renewals): Goetschius x2 and Reger are PD.
import { BOOK_TITLES } from './books';
import { bookCategory } from './bookMeta';

export const ORIGIN = 'https://textbook.realmusictheory.com';

export const PUBLIC_DOMAIN_BOOKS = [
  { title: 'Elementary Counterpoint', author: 'Percy Goetschius', year: 1910 },
  { title: 'Applied Counterpoint', author: 'Percy Goetschius', year: 1902 },
  { title: 'Modulation', author: 'Max Reger', year: 1904 },
] as const;

const RELATED: ReadonlyArray<readonly [string, string, string]> = [
  ['Real Ear Trainer', 'https://realeartrainer.com/', 'free online ear training — intervals, chords, scales and progressions, with lessons and scaffolded drills.'],
  ['Real Sight Reader', 'https://realsightreader.com/', 'free sight-reading practice on real piano music, with on-screen keys or a MIDI keyboard; no account.'],
  ['RealMusicTheory', 'https://realmusictheory.com/', 'free, open music-theory textbook whose harmony examples come from real repertoire by composers you choose.'],
  ['Playable Books', 'https://playablebook.com/', 'classic music textbooks (Fux, Rameau, Rimsky-Korsakov, Schoenberg and others) in reading editions whose examples play in the browser, beside the original scans where available.'],
  ['Jazz Changes', 'https://jazzchanges.app/', 'learn jazz standards by ear — essential recordings in listening order, what to listen for, and the chord changes.'],
  ['Music Tutor', 'https://musictutor.app/', 'MCP connector that gives Claude and ChatGPT playable notation, chords, harmony examples, sight-reading and ear-training tools.'],
  ['Whozart', 'https://whozart.com/', 'a classical-music listening quiz — hear a piece, name it, share the score.'],
  ['MIDI Memos', 'https://midimemos.com/', 'one-tap MIDI recorder for iPhone and iPad that exports .mid files to any DAW.'],
  ['PianoCam', 'https://pianocam.app/', 'iPhone studio that turns piano videos into shareable performances with falling notes and sheet music.'],
  ['RealJam', 'https://realjam.app/', 'jam over real chord changes in the browser with guided ladders for melody, harmony and time; no signup.'],
  ['GrainProc', 'https://grainproc.com/', 'live granular processor for iPhone and iPad — real-time granular delay and feedback, playable as an instrument.'],
  ['Mayank Sanganeria', 'https://e7mac.com/', 'personal site of the engineer and computer musician who builds these apps.'],
];

export function buildLlmsTxt(): string {
  const known = new Set<string>(BOOK_TITLES);
  for (const b of PUBLIC_DOMAIN_BOOKS) {
    if (!known.has(b.title)) throw new Error(`llms.txt: "${b.title}" is not in BOOK_TITLES`);
  }
  const lines: string[] = [];
  lines.push('# Music Ed', '');
  lines.push(
    '> Music Ed plays the musical examples from classic music-theory textbooks in the browser, with orchestral playback shown alongside each score. It is free and needs no account. This list covers the public-domain books: two counterpoint texts by Percy Goetschius and a modulation text by Max Reger.',
    '',
  );
  lines.push('The player needs JavaScript. Each book opens at its own link below; pick an example to hear it.', '');
  lines.push('## Main pages', '');
  lines.push(`- [Music Ed](${ORIGIN}/): the book index and player`, '');
  lines.push('## Books', '');
  for (const b of PUBLIC_DOMAIN_BOOKS) {
    lines.push(
      `- [${b.title}](${ORIGIN}/?book=${encodeURIComponent(b.title)}): ${b.author} (${b.year}), ${bookCategory(b.title).toLowerCase()}; playable examples with scores.`,
    );
  }
  lines.push('', '## Related', '');
  for (const [name, url, desc] of RELATED) lines.push(`- [${name}](${url}): ${desc}`);
  return lines.join('\n') + '\n';
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const PRIVATE_PREFIXES = ['/admin', '/api', '/review', '/staging', '/private'];

/** Returns a list of problems (empty = ok). */
export function checkLlmsTxt(text: string): string[] {
  const errs: string[] = [];
  if (!text.trim()) return ['llms.txt is empty'];
  if (!text.startsWith('# ')) errs.push('does not start with "# "');
  if (!/^> .+/m.test(text)) errs.push('missing "> " summary line');
  if (!/^## Related$/m.test(text)) errs.push('missing "## Related" section');
  if (UUID.test(text)) errs.push('contains a UUID');
  if (/localhost|workers\.dev/i.test(text)) errs.push('contains localhost or workers.dev');
  // Copyright: no book outside the allowlist may be named anywhere.
  const allowed = new Set<string>(PUBLIC_DOMAIN_BOOKS.map((b) => b.title));
  for (const t of BOOK_TITLES) {
    if (!allowed.has(t) && text.toLowerCase().includes(t.toLowerCase())) errs.push(`non-public-domain book named: ${t}`);
  }
  const relatedHosts = new Set(RELATED.map(([, u]) => new URL(u).host));
  for (const m of text.matchAll(/\]\((https?:[^)\s]+)\)/g)) {
    const u = new URL(m[1]);
    if (u.protocol !== 'https:') errs.push(`non-https link ${m[1]}`);
    if (u.host === new URL(ORIGIN).host) {
      if (PRIVATE_PREFIXES.some((p) => u.pathname === p || u.pathname.startsWith(p + '/'))) errs.push(`private path ${m[1]}`);
      const book = u.searchParams.get('book');
      if (book !== null && !allowed.has(book)) errs.push(`book link not allowlisted: ${m[1]}`);
    } else if (!relatedHosts.has(u.host)) {
      errs.push(`link outside this site and Related list: ${m[1]}`);
    }
  }
  if (/\]\((?!https:\/\/)/.test(text)) errs.push('relative or non-https link present');
  return errs;
}
