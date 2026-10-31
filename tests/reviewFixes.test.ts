import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import { readBook } from '@/lib/agents/bookReader';
import { readEvidenceImage } from '@/lib/agents/evidenceReader';
import { buildTestKit } from '@/lib/agents/localizer';
import { matchCountry } from '@/lib/agents/marketMatcher';
import { addEvidence, readEvidence } from '@/lib/evidence';
import { generateJson } from '@/lib/gemma';
import {
  createRequestGuard, failBookRun, resultsForNewRun, startBookRun, withDisplayTitle, type BookResult,
} from '@/lib/radarState';
import { addSignup, countByCountry } from '@/lib/signups';
import type { BookTags, Country, CountryFit, Evidence } from '@/lib/types';

const now = new Date('2026-10-31');
const reply = (o: unknown) => vi.fn().mockResolvedValue(JSON.stringify(o));
const img = { inlineData: { mimeType: 'image/png', data: 'x' } };
const tags = (title: string): BookTags => ({
  readable: true, title, cuisine: 'c', spiceLevel: 'hot', portion: 'family',
  cookingTime: 't', ingredientCost: 'low', dietaryFit: [], language: 'l',
});
const fit = { country: 'ID' } as CountryFit;
const row = (title: string, fits: CountryFit[] = []): BookResult => ({ tags: tags(title), fits });
const indonesia: Country = { code: 'ID', name: 'Indonesia', language: 'Indonesian', reach: 0.8, reachReason: 'r' };
const ev: Evidence = {
  id: 'e1', country: 'ID', sourceType: 'comments', finding: 'f',
  sourceUrl: 'https://example.com', collectedOn: '2026-10-01',
};

// C1
test('a new run clears replayed results', () => {
  expect(resultsForNewRun([row('A')], true)).toEqual([]);
});
test('a new run keeps real results', () => {
  expect(resultsForNewRun([row('A')], false)).toHaveLength(1);
});

// C2
test('the request guard rejects replies from older requests', () => {
  const guard = createRequestGuard();
  const first = guard.next();
  expect(guard.isCurrent(first)).toBe(true);
  guard.next();
  expect(guard.isCurrent(first)).toBe(false);
});

// I1
test('readBook treats a bare unreadable reply as unreadable', async () => {
  const out = await readBook([img], reply({ readable: false }));
  expect(out.readable).toBe(false);
});
test('readBook removes anything invented on an unreadable page', async () => {
  const out = await readBook([img], reply({ ...tags('Invented'), readable: false }));
  expect(out.title).toBe('unknown');
  expect(out.spiceLevel).toBe('unknown');
});
test('readBook turns nulls on a readable page into unknown', async () => {
  const gen = reply({ ...tags('T'), cookingTime: null, spiceLevel: null, dietaryFit: null });
  const out = await readBook([img], gen);
  expect(out).toMatchObject({ title: 'T', cookingTime: 'unknown', spiceLevel: 'unknown', dietaryFit: [] });
  expect(gen).toHaveBeenCalledTimes(1);
});
test('buildTestKit accepts nulls when no recipe is visible', async () => {
  const kit = await buildTestKit(tags('T'), indonesia, 'a', [], reply({
    language: null, recipeTitle: null, ingredients: null, steps: null, swaps: null, liveScript: 'script',
  }));
  expect(kit).toMatchObject({ language: 'Indonesian', recipeTitle: '', ingredients: [], steps: [], swaps: [] });
});
test('matchCountry accepts nulls in optional fields', async () => {
  const fitOut = await matchCountry(tags('T'), indonesia, [ev], now, reply({
    tasteMatch: 'some', citedIds: ['e1'], reason: 'r', suggestedAngle: null, gaps: null,
  }));
  expect(fitOut).toMatchObject({ suggestedAngle: '', gaps: [] });
});

// I2
test('invalid replies give a clear error without validation details', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  await expect(generateJson([], z.object({ a: z.number() }), reply({ a: 'x' })))
    .rejects.toThrow(/^Gemma's reply couldn't be used\. Please try again\.$/);
  spy.mockRestore();
});

// I3
test('a re-run keeps the old scores until new ones arrive', () => {
  const prior = row('A', [fit]);
  expect(startBookRun([prior], tags('A'))).toEqual([prior]);
});
test('a first run adds an empty row', () => {
  expect(startBookRun([], tags('A'))[0].fits).toEqual([]);
});
test('a failed re-run restores the old scores', () => {
  const prior = row('A', [fit]);
  const out = failBookRun([row('A', [])], tags('A'), prior, []);
  expect(out).toEqual([prior]);
});
test('a failed first run with some scores is marked incomplete', () => {
  const out = failBookRun([row('A', [fit])], tags('A'), undefined, [fit]);
  expect(out[0]).toMatchObject({ fits: [fit], incomplete: true });
});
test('a failed first run with no scores removes the row', () => {
  expect(failBookRun([row('A')], tags('A'), undefined, [])).toEqual([]);
});

// I4
test('an unknown title falls back to the file name', () => {
  expect(withDisplayTitle(tags('unknown'), 'page1.jpg').title).toBe('Untitled (page1.jpg)');
});
test('a known title is kept', () => {
  expect(withDisplayTitle(tags('Spicy'), 'page1.jpg').title).toBe('Spicy');
});

// I5
test('buildTestKit sends every uploaded page', async () => {
  const gen = reply({ language: 'x', recipeTitle: '', ingredients: [], steps: [], swaps: [], liveScript: 's' });
  await buildTestKit(tags('T'), indonesia, 'a', [img, img], gen);
  expect(gen.mock.calls[0][0]).toHaveLength(3);
});

// I6
describe('concurrent writes', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'radar-'));
    process.env.SIGNUPS_FILE = path.join(dir, 'signups.json');
    process.env.EVIDENCE_FILE = path.join(dir, 'evidence.json');
  });
  afterEach(async () => {
    delete process.env.SIGNUPS_FILE;
    delete process.env.EVIDENCE_FILE;
    await rm(dir, { recursive: true });
  });
  test('parallel sign-ups are all saved', async () => {
    const valid = {
      country: 'ID', name: 'P', email: 'p@example.com', favouriteDishes: '',
      skillLevel: 'beginner', dietaryNeeds: '', consent: true,
    };
    await Promise.all(Array.from({ length: 20 }, () => addSignup(valid)));
    expect((await countByCountry()).ID).toBe(20);
  });
  test('parallel evidence is all saved', async () => {
    await Promise.all(Array.from({ length: 20 }, () => addEvidence(ev)));
    expect(await readEvidence()).toHaveLength(20);
  });
});

// Binding constraint: never infer religion, race or health
test('every agent prompt forbids inferring personal traits', async () => {
  const match = reply({ tasteMatch: 'some', citedIds: [], reason: 'r', suggestedAngle: 'a', gaps: [] });
  await matchCountry(tags('T'), indonesia, [ev], now, match);
  const kit = reply({ language: 'x', recipeTitle: '', ingredients: [], steps: [], swaps: [], liveScript: 's' });
  await buildTestKit(tags('T'), indonesia, 'a', [], kit);
  const evidence = reply({ finding: 'f', originalLanguage: 'x', sourceType: 'comments' });
  await readEvidenceImage(img, 'ID', evidence);
  const book = reply(tags('T'));
  await readBook([img], book);
  for (const gen of [match, kit, evidence, book]) {
    expect(JSON.stringify(gen.mock.calls[0][0])).toMatch(/religion, race or health/);
  }
});
