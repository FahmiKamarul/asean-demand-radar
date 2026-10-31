import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { addEvidence, readEvidence } from '@/lib/evidence';
import { parseTrendsCsv } from '@/lib/trends';

test('reads a Trends country CSV', () => {
  const rows = parseTrendsCsv(
    'Category: All categories\n\nCountry,pedas: (11/1/25 - 10/31/26)\nIndonesia,100\nThailand,8\nFrance,<1\n',
    'pedas', 'https://trends.google.com/x', '2026-10-31',
  );
  expect(rows.map((r) => r.country)).toEqual(['ID', 'TH']);
  expect(rows[0].finding).toBe('Relative search interest for "pedas" in Indonesia: 100 out of 100');
  expect(rows[0].sourceType).toBe('search_interest');
});

test('a Trends CSV with no country header gives no rows', () => {
  expect(parseTrendsCsv('nothing useful', 'pedas', 'https://x.com', '2026-10-31')).toEqual([]);
});

test('addEvidence stores an item with a new id', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'radar-'));
  process.env.EVIDENCE_FILE = path.join(dir, 'evidence.json');
  const saved = await addEvidence({
    country: 'PH', sourceType: 'comments', finding: 'Viewers ask for budget meals',
    sourceUrl: 'https://example.com', collectedOn: '2026-10-31',
  });
  expect(saved.id).toBeTruthy();
  expect(await readEvidence()).toEqual([saved]);
  delete process.env.EVIDENCE_FILE;
  await rm(dir, { recursive: true });
});
