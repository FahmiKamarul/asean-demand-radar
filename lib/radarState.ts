import type { BookTags, CountryFit } from './types';

export type BookResult = { tags: BookTags; fits: CountryFit[]; incomplete?: boolean };
export type AgentStatus = 'waiting' | 'running' | 'done' | 'failed';

const MAX_BOOKS = 2;

export function upsertBook(results: BookResult[], next: BookResult): BookResult[] {
  const others = results.filter((r) => r.tags.title !== next.tags.title);
  return [...others, next].slice(-MAX_BOOKS);
}

export function resultsForNewRun(results: BookResult[], replaying: boolean): BookResult[] {
  return replaying ? [] : results;
}

export function startBookRun(results: BookResult[], tags: BookTags): BookResult[] {
  return results.some((r) => r.tags.title === tags.title) ? results : upsertBook(results, { tags, fits: [] });
}

export function failBookRun(
  results: BookResult[],
  tags: BookTags,
  prior: BookResult | undefined,
  fits: CountryFit[],
): BookResult[] {
  if (prior) return upsertBook(results, prior);
  if (fits.length > 0) return upsertBook(results, { tags, fits, incomplete: true });
  return results.filter((r) => r.tags.title !== tags.title);
}

export function withDisplayTitle(tags: BookTags, fileName: string): BookTags {
  return tags.title === 'unknown' ? { ...tags, title: `Untitled (${fileName})` } : tags;
}

export function createRequestGuard() {
  let current = 0;
  return {
    next: () => ++current,
    isCurrent: (id: number) => id === current,
  };
}

export type HeatBand = 'none' | 'low' | 'some' | 'good' | 'top';

export function heatBand(score: number | null): HeatBand {
  if (score === null) return 'none';
  if (score >= 80) return 'top';
  if (score >= 60) return 'good';
  if (score >= 40) return 'some';
  return 'low';
}
