import type { CountryCode, Evidence } from './types';

const CODES: Record<string, CountryCode> = { Indonesia: 'ID', Philippines: 'PH', Thailand: 'TH' };

export function parseTrendsCsv(
  csv: string,
  term: string,
  sourceUrl: string,
  collectedOn: string,
): Omit<Evidence, 'id'>[] {
  const lines = csv.split(/\r?\n/);
  const header = lines.findIndex((l) => /^(Country|Region),/.test(l));
  if (header === -1) return [];
  return lines.slice(header + 1).flatMap((line) => {
    const [name, value] = line.split(',');
    const country = CODES[name?.trim()];
    if (!country || !/^\d+$/.test(value?.trim() ?? '')) return [];
    return [{
      country,
      sourceType: 'search_interest' as const,
      finding: `Relative search interest for "${term}" in ${name.trim()}: ${value.trim()} out of 100`,
      sourceUrl,
      collectedOn,
    }];
  });
}
