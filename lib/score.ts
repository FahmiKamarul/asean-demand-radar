import type { CountryFit, Evidence, TasteMatch } from './types';

const TASTE: Record<TasteMatch, number> = { strong: 1, some: 0.6, weak: 0.25, none: 0 };
const RECENT_MS = 365 * 24 * 60 * 60 * 1000;

export function computeScore(
  input: { tasteMatch: TasteMatch; reach: number; evidence: Evidence[] },
  now: Date,
): { score: number | null; confidence: CountryFit['confidence'] } {
  const { tasteMatch, reach, evidence } = input;
  if (evidence.length === 0) return { score: null, confidence: null };
  const recent = evidence.filter((e) => now.getTime() - Date.parse(e.collectedOn) <= RECENT_MS).length;
  const strength = Math.min(recent / 10, 1);
  const score = Math.round(100 * (0.5 * TASTE[tasteMatch] + 0.25 * reach + 0.25 * strength));
  const confidence = evidence.length >= 10 ? 'high' : evidence.length >= 5 ? 'medium' : 'low';
  return { score, confidence };
}
