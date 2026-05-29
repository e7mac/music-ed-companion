import type { Book } from './bookTypes';
import { bookJsonUrl } from './books';

export async function fetchBook(title: string): Promise<Book> {
  const res = await fetch(bookJsonUrl(title), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to load book "${title}" (HTTP ${res.status})`);
  }
  const data = (await res.json()) as Partial<Book>;
  if (!data || typeof data.name !== 'string' || typeof data.baseUrl !== 'string' || !Array.isArray(data.chapters)) {
    throw new Error(`Received invalid book data for "${title}"`);
  }
  return data as Book;
}
