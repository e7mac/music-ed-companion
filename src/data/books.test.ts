import { describe, it, expect } from 'vitest';
import { BOOK_TITLES, bookJsonUrl } from './books';

describe('books config', () => {
  it('lists the 15 known books including the orchestration book', () => {
    expect(BOOK_TITLES).toHaveLength(15);
    expect(BOOK_TITLES).toContain('Creative Orchestration');
  });

  it('builds an S3 json url from a title', () => {
    expect(bookJsonUrl('Creative Orchestration')).toBe(
      'https://music-ed.s3.us-east-2.amazonaws.com/Creative Orchestration.json',
    );
  });
});
