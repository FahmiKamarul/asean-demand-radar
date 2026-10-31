import { buildTestKit } from '@/lib/agents/localizer';
import { matchCountry } from '@/lib/agents/marketMatcher';
import { readBook } from '@/lib/agents/bookReader';
import { readEvidenceImage } from '@/lib/agents/evidenceReader';
import type { BookTags, Country, Evidence } from '@/lib/types';

const now = new Date('2026-10-31');
const img = { inlineData: { mimeType: 'image/png', data: 'x' } };
const book: BookTags = {
  readable: true, title: 'Spicy Home Meals', cuisine: 'Malaysian', spiceLevel: 'hot', portion: 'family',
  cookingTime: '30 min', ingredientCost: 'low', dietaryFit: [], language: 'Malay',
};
const indonesia: Country = { code: 'ID', name: 'Indonesia', language: 'Indonesian', reach: 0.8, reachReason: 'r' };
const ev = (id: string): Evidence => ({
  id, country: 'ID', sourceType: 'comments', finding: `finding ${id}`,
  sourceUrl: 'https://example.com', collectedOn: '2026-10-01',
});
const reply = (o: unknown) => vi.fn().mockResolvedValue(JSON.stringify(o));

test('matchCountry skips Gemma without evidence', async () => {
  const gen = vi.fn();
  const fit = await matchCountry(book, indonesia, [], now, gen);
  expect(gen).not.toHaveBeenCalled();
  expect(fit).toMatchObject({ score: null, confidence: null, tasteMatch: 'none', reason: 'no evidence yet' });
});

test('matchCountry only sends that country its own evidence', async () => {
  const gen = reply({ tasteMatch: 'some', citedIds: ['e1'], reason: 'r', suggestedAngle: 'a', gaps: [] });
  await matchCountry(book, indonesia, [ev('e1'), { ...ev('th'), country: 'TH' }], now, gen);
  expect(JSON.stringify(gen.mock.calls[0][0])).not.toContain('finding th');
});

test('matchCountry drops unknown citations', async () => {
  const gen = reply({ tasteMatch: 'strong', citedIds: ['fake'], reason: 'r', suggestedAngle: 'a', gaps: [] });
  const fit = await matchCountry(book, indonesia, [ev('e1')], now, gen);
  expect(fit.tasteMatch).toBe('none');
  expect(fit.evidence).toEqual([]);
  expect(fit.score).toBeNull();
});

test('matchCountry keeps only cited evidence', async () => {
  const gen = reply({ tasteMatch: 'strong', citedIds: ['e1'], reason: 'r', suggestedAngle: 'a', gaps: [] });
  const fit = await matchCountry(book, indonesia, [ev('e1'), ev('e2')], now, gen);
  expect(fit.evidence.map((e) => e.id)).toEqual(['e1']);
  expect(fit.score).toBe(73);
});

test('readBook passes through an unreadable page', async () => {
  const gen = reply({ ...book, readable: false });
  expect((await readBook([img], gen)).readable).toBe(false);
});

test('readEvidenceImage asks for English with no personal details', async () => {
  const gen = reply({ finding: 'Viewers want cheaper meals', originalLanguage: 'Thai', sourceType: 'comments' });
  const out = await readEvidenceImage(img, 'TH', gen);
  expect(out.finding).toBe('Viewers want cheaper meals');
  expect(JSON.stringify(gen.mock.calls[0][0])).toMatch(/usernames/);
});

test('buildTestKit sets its own sign-up path and country', async () => {
  const gen = reply({
    language: 'Indonesian', recipeTitle: 't', ingredients: ['a'], steps: ['b'], swaps: [],
    liveScript: 's', signupPath: '/evil', country: 'TH',
  });
  const kit = await buildTestKit(book, indonesia, 'spicy', [], gen);
  expect(kit.signupPath).toBe('/signup/ID');
  expect(kit.country).toBe('ID');
});
