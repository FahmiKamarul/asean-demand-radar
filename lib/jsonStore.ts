import { randomUUID } from 'node:crypto';
import { rename, writeFile } from 'node:fs/promises';

// Shared across route bundles, so all access to a data file runs one at a time.
const store = globalThis as typeof globalThis & { radarQueue?: Promise<unknown> };

export function withFileLock<T>(work: () => Promise<T>): Promise<T> {
  const run = (store.radarQueue ?? Promise.resolve()).then(work, work);
  store.radarQueue = run.catch(() => undefined);
  return run;
}

export async function writeJsonAtomic(file: string, data: unknown): Promise<void> {
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(data, null, 2));
  await rename(temp, file);
}
