import { describe, it, expect } from 'vitest';
import { buildAssetUrl } from './assetUrl';

describe('buildAssetUrl', () => {
  it('joins baseUrl, chapter name and file', () => {
    expect(buildAssetUrl('https://x/CO/', 'Chapter 1', 'Ex2-1.mid')).toBe(
      'https://x/CO/Chapter 1/Ex2-1.mid',
    );
  });
  it('inserts a slash when baseUrl lacks a trailing one', () => {
    expect(buildAssetUrl('https://x/CO', 'Chapter 1', 'a.png')).toBe(
      'https://x/CO/Chapter 1/a.png',
    );
  });
});
