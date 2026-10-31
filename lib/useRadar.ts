'use client';

import { useCallback, useRef, useState } from 'react';
import { upsertBook, type AgentStatus, type BookResult } from './radarState';
import { loadReplay } from './replay';
import type { BookTags, CountryCode, CountryFit, TestKit } from './types';

export const COUNTRIES: { code: CountryCode; name: string }[] = [
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'TH', name: 'Thailand' },
];

const IDLE = { reader: 'waiting', matcher: 'waiting', localizer: 'waiting' } as const;
type Statuses = Record<keyof typeof IDLE, AgentStatus>;

class ApiFailure extends Error {
  constructor(message: string, public canReplay: boolean) {
    super(message);
  }
}

async function call<T>(url: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiFailure('The connection failed. Check your network and try again.', true);
  }
  const body = await res.json();
  if (!res.ok) throw new ApiFailure(body.error ?? 'Something went wrong.', Boolean(body.canReplay));
  return body as T;
}

const postJson = <T,>(url: string, data: unknown) =>
  call<T>(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

export function useRadar() {
  const [results, setResults] = useState<BookResult[]>([]);
  const [statuses, setStatuses] = useState<Statuses>({ ...IDLE });
  const [matching, setMatching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canReplay, setCanReplay] = useState(false);
  const [selected, setSelected] = useState<{ title: string; country: CountryCode } | null>(null);
  const [kit, setKit] = useState<TestKit | null>(null);
  const [kitVersion, setKitVersion] = useState(0);
  const [replayedOn, setReplayedOn] = useState<string | null>(null);
  const pageFiles = useRef(new Map<string, File>());

  const fail = (e: unknown) => {
    setError(e instanceof Error ? e.message : 'Something went wrong.');
    setCanReplay(e instanceof ApiFailure && e.canReplay);
  };

  const analyze = useCallback(async (files: File[]) => {
    setError(null);
    setCanReplay(false);
    setReplayedOn(null);
    setKit(null);
    setStatuses({ ...IDLE, reader: 'running' });
    let step: keyof Statuses = 'reader';
    try {
      const form = new FormData();
      files.forEach((f) => form.append('pages', f));
      const { book } = await call<{ book: BookTags }>('/api/book', { method: 'POST', body: form });
      if (!book.readable) {
        setStatuses({ ...IDLE, reader: 'failed' });
        setError("We couldn't read this page. Try a clearer photo of a book page.");
        return;
      }
      pageFiles.current.set(book.title, files[0]);
      step = 'matcher';
      setStatuses({ ...IDLE, reader: 'done', matcher: 'running' });
      const fits: CountryFit[] = [];
      setResults((prev) => upsertBook(prev, { tags: book, fits: [] }));
      for (const c of COUNTRIES) {
        setMatching(c.name);
        const { fit } = await postJson<{ fit: CountryFit }>('/api/match', { book, country: c.code });
        fits.push(fit);
        setResults((prev) => upsertBook(prev, { tags: book, fits: [...fits] }));
      }
      setMatching(null);
      setStatuses({ ...IDLE, reader: 'done', matcher: 'done' });
      const best = [...fits].sort((a, b) => (b.score ?? -1) - (a.score ?? -1))[0];
      setSelected({ title: book.title, country: best.country });
    } catch (e) {
      setMatching(null);
      setStatuses((s) => ({ ...s, [step]: 'failed' }));
      fail(e);
    }
  }, []);

  const createKit = useCallback(async (book: BookTags, country: CountryCode, angle: string) => {
    setError(null);
    setCanReplay(false);
    setStatuses((s) => ({ ...s, localizer: 'running' }));
    try {
      const form = new FormData();
      form.set('book', JSON.stringify(book));
      form.set('country', country);
      form.set('angle', angle);
      const page = pageFiles.current.get(book.title);
      if (page) form.set('page', page);
      const { kit: next } = await call<{ kit: TestKit }>('/api/kit', { method: 'POST', body: form });
      setKit(next);
      setKitVersion((v) => v + 1);
      setStatuses((s) => ({ ...s, localizer: 'done' }));
    } catch (e) {
      setStatuses((s) => ({ ...s, localizer: 'failed' }));
      fail(e);
    }
  }, []);

  const replay = useCallback(async () => {
    const saved = await loadReplay();
    if (!saved) {
      setError('No saved result exists yet. Run the save-replay script first.');
      setCanReplay(false);
      return;
    }
    setError(null);
    setCanReplay(false);
    setResults(saved.results);
    setKit(saved.kit);
    setKitVersion((v) => v + 1);
    setReplayedOn(saved.capturedOn);
    setSelected({ title: saved.results[0].tags.title, country: saved.kit.country });
    setStatuses({ reader: 'done', matcher: 'done', localizer: 'done' });
  }, []);

  const select = useCallback((title: string, country: CountryCode) => {
    setSelected({ title, country });
    setKit(null);
    setStatuses((s) => ({ ...s, localizer: 'waiting' }));
  }, []);

  return {
    results, statuses, matching, error, canReplay, selected, kit, kitVersion, replayedOn,
    analyze, createKit, replay, select,
  };
}
