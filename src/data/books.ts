export const S3_BASE = 'https://music-ed.s3.us-east-2.amazonaws.com';

export const BOOK_TITLES = [
  'Applied Counterpoint',
  'Contemporary Harmony',
  'Creative Orchestration',
  'Elementary Counterpoint',
  'Musical Composition Craft And Art',
  'Structural Functions Of Harmony',
  'Twentieth Century Harmony',
  'Modulation',
  'Brahms And The Principle Of Developing Variation',
  'The Shaping Forces In Music',
  'Fundamentals Of Musical Composition',
  'Japanese Music Harmony Vol1',
  'Latin Jazz Piano',
  'Play Latin Piano Like A Pro',
  'Jazz Piano The Left Hand',
] as const;

export function bookJsonUrl(title: string): string {
  return `${S3_BASE}/${title}.json`;
}
