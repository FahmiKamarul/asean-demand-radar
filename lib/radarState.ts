import type { BookTags, CountryFit } from './types';

export type BookResult = { tags: BookTags; fits: CountryFit[]; pageImage?: string };
export type AgentStatus = 'waiting' | 'running' | 'done' | 'failed';

const MAX_BOOKS = 2;

export function upsertBook(results: BookResult[], next: BookResult): BookResult[] {
  const others = results.filter((r) => r.tags.title !== next.tags.title);
  return [...others, next].slice(-MAX_BOOKS);
}

export type HeatBand = 'none' | 'low' | 'some' | 'good' | 'top';

export function heatBand(score: number | null): HeatBand {
  if (score === null) return 'none';
  if (score >= 80) return 'top';
  if (score >= 60) return 'good';
  if (score >= 40) return 'some';
  return 'low';
}
