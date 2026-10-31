import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { withFileLock, writeJsonAtomic } from './jsonStore';
import { CountrySchema, EvidenceSchema, type Country, type Evidence } from './types';

const evidenceFile = () => process.env.EVIDENCE_FILE ?? path.join(process.cwd(), 'data', 'evidence.json');

async function readAll(): Promise<Evidence[]> {
  try {
    return z.array(EvidenceSchema).parse(JSON.parse(await readFile(evidenceFile(), 'utf8')));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
}

export function readEvidence(): Promise<Evidence[]> {
  return withFileLock(readAll);
}

export function addEvidence(item: Omit<Evidence, 'id'>): Promise<Evidence> {
  return withFileLock(async () => {
    const saved = EvidenceSchema.parse({ ...item, id: randomUUID() });
    await writeJsonAtomic(evidenceFile(), [...(await readAll()), saved]);
    return saved;
  });
}

export async function getCountries(): Promise<Country[]> {
  const raw = await readFile(path.join(process.cwd(), 'data', 'countries.json'), 'utf8');
  return z.array(CountrySchema).parse(JSON.parse(raw));
}
