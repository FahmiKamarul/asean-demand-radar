import { readFile } from 'node:fs/promises';
import { addEvidence } from '../lib/evidence';
import { parseTrendsCsv } from '../lib/trends';

async function main() {
  const [file, term, sourceUrl] = process.argv.slice(2);
  if (!file || !term || !/^https?:\/\//.test(sourceUrl ?? '')) {
    throw new Error('Usage: import-trends <csv file> <search term> <source link>');
  }
  const rows = parseTrendsCsv(await readFile(file, 'utf8'), term, sourceUrl, new Date().toISOString().slice(0, 10));
  for (const row of rows) await addEvidence(row);
  console.log(`Added ${rows.length} rows for "${term}".`);
}

main().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
