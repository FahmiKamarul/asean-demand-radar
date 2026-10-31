import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { CountrySchema, EvidenceSchema, type Country, type Evidence } from './types';

const evidenceFile = () => process.env.EVIDENCE_FILE ?? path.join(process.cwd(), 'data', 'evidence.json');

export async function readEvidence(): Promise<Evidence[]> {
  try {
    return z.array(EvidenceSchema).parse(JSON.parse(await readFile(evidenceFile(), 'utf8')));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
}

export async function addEvidence(item: Omit<Evidence, 'id'>): Promise<Evidence> {
  const saved = EvidenceSchema.parse({ ...item, id: randomUUID() });
  await writeFile(evidenceFile(), JSON.stringify([...(await readEvidence()), saved], null, 2));
  return saved;
}

export async function getCountries(): Promise<Country[]> {
  const raw = await readFile(path.join(process.cwd(), 'data', 'countries.json'), 'utf8');
  return z.array(CountrySchema).parse(JSON.parse(raw));
}
