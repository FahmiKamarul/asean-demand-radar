import type { BookResult } from './radarState';
import type { TestKit } from './types';

export type ReplayData = { results: BookResult[]; kit: TestKit; capturedOn: string };

export async function loadReplay(): Promise<ReplayData | null> {
  const res = await fetch('/api/replay');
  return res.ok ? ((await res.json()) as ReplayData) : null;
}
