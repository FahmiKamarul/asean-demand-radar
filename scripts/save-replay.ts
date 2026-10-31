import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readBook } from '../lib/agents/bookReader';
import { buildTestKit } from '../lib/agents/localizer';
import { matchCountry } from '../lib/agents/marketMatcher';
import { getCountries, readEvidence } from '../lib/evidence';
import type { Part } from '../lib/gemma';

const MIME: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

async function main() {
  const file = process.argv[2];
  const mimeType = MIME[path.extname(file ?? '').toLowerCase()];
  if (!mimeType) throw new Error('Usage: save-replay <page image: png, jpg or webp>');
  const image: Part = { inlineData: { mimeType, data: (await readFile(file)).toString('base64') } };

  const book = await readBook([image]);
  if (!book.readable) throw new Error('Gemma could not read that page.');
  const now = new Date();
  const countries = await getCountries();
  const evidence = await readEvidence();
  const fits = [];
  for (const c of countries) fits.push(await matchCountry(book, c, evidence, now));
  const best = [...fits].sort((a, b) => (b.score ?? -1) - (a.score ?? -1))[0];
  if (best.score === null) throw new Error('No evidence yet, so there is nothing to replay. Add sourced evidence first.');
  const kit = await buildTestKit(book, countries.find((c) => c.code === best.country)!, best.suggestedAngle, image);

  await mkdir(path.join('data', 'replay'), { recursive: true });
  await writeFile(
    path.join('data', 'replay', 'demo.json'),
    JSON.stringify({ results: [{ tags: book, fits }], kit, capturedOn: now.toISOString().slice(0, 10) }, null, 2),
  );
  console.log(`Saved a replay for "${book.title}", best fit ${best.country} at ${best.score}.`);
}

main().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
