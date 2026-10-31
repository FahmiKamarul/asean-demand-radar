import { computeScore } from '@/lib/score';
import type { Evidence } from '@/lib/types';

const now = new Date('2026-10-31');
const base: Evidence = {
  id: 'e', country: 'ID', sourceType: 'comments', finding: 'f',
  sourceUrl: 'https://example.com', collectedOn: '2026-10-01',
};
const recent = (n: number) => Array.from({ length: n }, () => ({ ...base }));

test('strong match', () => {
  expect(computeScore({ tasteMatch: 'strong', reach: 0.8, evidence: recent(10) }, now))
    .toEqual({ score: 95, confidence: 'high' });
});

test('some match', () => {
  expect(computeScore({ tasteMatch: 'some', reach: 0.4, evidence: recent(4) }, now))
    .toEqual({ score: 50, confidence: 'low' });
});

test('medium confidence from five sources', () => {
  expect(computeScore({ tasteMatch: 'weak', reach: 0, evidence: recent(5) }, now).confidence).toBe('medium');
});

test('no evidence has no score', () => {
  expect(computeScore({ tasteMatch: 'none', reach: 0.8, evidence: [] }, now))
    .toEqual({ score: null, confidence: null });
});

test('old evidence does not add strength', () => {
  const old = recent(10).map((e) => ({ ...e, collectedOn: '2024-01-01' }));
  expect(computeScore({ tasteMatch: 'strong', reach: 0.8, evidence: old }, now).score).toBe(70);
});
