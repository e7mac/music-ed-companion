// Light, hand-assigned classification for the landing-page book grid. Kept
// deliberately conservative — a category we can stand behind from the title
// alone, with no authors or example counts (not reliably known here).

export type BookCategory =
  | 'Counterpoint'
  | 'Harmony'
  | 'Orchestration'
  | 'Composition & Form'
  | 'Analysis'
  | 'Jazz & Latin Piano';

const CATEGORIES: Record<string, BookCategory> = {
  'Applied Counterpoint': 'Counterpoint',
  'Elementary Counterpoint': 'Counterpoint',
  'Contemporary Harmony': 'Harmony',
  'Structural Functions Of Harmony': 'Harmony',
  'Twentieth Century Harmony': 'Harmony',
  'Modulation': 'Harmony',
  'Japanese Music Harmony Vol1': 'Harmony',
  'Creative Orchestration': 'Orchestration',
  'Musical Composition Craft And Art': 'Composition & Form',
  'The Shaping Forces In Music': 'Composition & Form',
  'Fundamentals Of Musical Composition': 'Composition & Form',
  'Brahms And The Principle Of Developing Variation': 'Analysis',
  'Latin Jazz Piano': 'Jazz & Latin Piano',
  'Play Latin Piano Like A Pro': 'Jazz & Latin Piano',
  'Jazz Piano The Left Hand': 'Jazz & Latin Piano',
};

export function bookCategory(title: string): BookCategory {
  return CATEGORIES[title] ?? 'Composition & Form';
}
