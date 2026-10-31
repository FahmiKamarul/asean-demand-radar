import { heatBand, upsertBook, type BookResult } from '@/lib/radarState';
import type { BookTags, CountryFit } from '@/lib/types';

const tags = (title: string): BookTags => ({
  readable: true, title, cuisine: 'c', spiceLevel: 'hot', portion: 'family',
  cookingTime: 't', ingredientCost: 'low', dietaryFit: [], language: 'l',
});
const book = (title: string): BookResult => ({ tags: tags(title), fits: [] });
const fit = { country: 'ID' } as CountryFit;

test('replaces a book with the same title', () => {
  const a = book('A');
  const out = upsertBook([a], { ...a, fits: [fit] });
  expect(out).toHaveLength(1);
  expect(out[0].fits).toEqual([fit]);
});

test('keeps the newest two books', () => {
  expect(upsertBook([book('A'), book('B')], book('C')).map((r) => r.tags.title)).toEqual(['B', 'C']);
});

test('heatBand groups scores and keeps no evidence separate', () => {
  expect(heatBand(null)).toBe('none');
  expect(heatBand(39)).toBe('low');
  expect(heatBand(40)).toBe('some');
  expect(heatBand(60)).toBe('good');
  expect(heatBand(80)).toBe('top');
});
