import type { BookResult } from './radarState';
import type { TestKit } from './types';

// isDummy marks made-up rehearsal data from scripts/make-dummy-replay.ts.
export type ReplayData = { results: BookResult[]; kit: TestKit; capturedOn: string; isDummy?: boolean };

export async function loadReplay(): Promise<ReplayData | null> {
  const res = await fetch('/api/replay');
  return res.ok ? ((await res.json()) as ReplayData) : null;
}
