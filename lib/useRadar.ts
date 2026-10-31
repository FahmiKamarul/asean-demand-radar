'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
  createRequestGuard, failBookRun, resultsForNewRun, startBookRun, upsertBook, withDisplayTitle,
  type AgentStatus, type BookResult,
} from './radarState';
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
  const [replayIsDummy, setReplayIsDummy] = useState(false);
  const pageFiles = useRef(new Map<string, File[]>());
  // Replies that arrive after the user has moved on are dropped, so a kit can't appear under the wrong market.
  const runGuard = useRef(createRequestGuard());
  const kitGuard = useRef(createRequestGuard());
  const latest = useRef({ results, replayedOn });
  latest.current = { results, replayedOn };

  const fail = (e: unknown) => {
    setError(e instanceof Error ? e.message : 'Something went wrong.');
    setCanReplay(e instanceof ApiFailure && e.canReplay);
  };

  // Takes book page images for the Book Reader, or tags the seller typed in, which skip it.
  const analyze = useCallback(async (input: File[] | BookTags) => {
    const files = Array.isArray(input) ? input : [];
    const run = runGuard.current.next();
    kitGuard.current.next();
    const baseline = resultsForNewRun(latest.current.results, latest.current.replayedOn !== null);
    setResults(baseline);
    if (baseline.length === 0) setSelected(null);
    setError(null);
    setCanReplay(false);
    setReplayedOn(null);
    setReplayIsDummy(false);
    setKit(null);
    setStatuses({ ...IDLE, reader: files.length > 0 ? 'running' : 'done' });
    let step: keyof Statuses = 'reader';
    let book: BookTags | null = null;
    let prior: BookResult | undefined;
    const fits: CountryFit[] = [];
    try {
      let tags: BookTags;
      if (Array.isArray(input)) {
        const form = new FormData();
        files.forEach((f) => form.append('pages', f));
        const read = await call<{ book: BookTags }>('/api/book', { method: 'POST', body: form });
        if (!runGuard.current.isCurrent(run)) return;
        if (!read.book.readable) {
          setStatuses({ ...IDLE, reader: 'failed' });
          setError("We couldn't read this page. Try a clearer photo of a book page.");
          return;
        }
        tags = withDisplayTitle(read.book, files[0].name);
      } else {
        tags = input;
      }
      book = tags;
      prior = baseline.find((r) => r.tags.title === tags.title);
      pageFiles.current.set(tags.title, files);
      step = 'matcher';
      setStatuses({ ...IDLE, reader: 'done', matcher: 'running' });
      setResults((prev) => startBookRun(prev, tags));
      for (const c of COUNTRIES) {
        setMatching(c.name);
        const { fit } = await postJson<{ fit: CountryFit }>('/api/match', { book: tags, country: c.code });
        if (!runGuard.current.isCurrent(run)) return;
        fits.push(fit);
        const soFar = [...fits];
        setResults((prev) => upsertBook(prev, { tags, fits: soFar }));
      }
      setMatching(null);
      setStatuses({ ...IDLE, reader: 'done', matcher: 'done' });
      const best = [...fits].sort((a, b) => (b.score ?? -1) - (a.score ?? -1))[0];
      setSelected({ title: tags.title, country: best.country });
    } catch (e) {
      if (!runGuard.current.isCurrent(run)) return;
      setMatching(null);
      setStatuses((s) => ({ ...s, [step]: 'failed' }));
      if (book) {
        const failed = book;
        setResults((prev) => failBookRun(prev, failed, prior, fits));
      }
      fail(e);
    }
  }, []);

  const createKit = useCallback(async (book: BookTags, country: CountryCode, angle: string) => {
    const request = kitGuard.current.next();
    setError(null);
    setCanReplay(false);
    setStatuses((s) => ({ ...s, localizer: 'running' }));
    try {
      const form = new FormData();
      form.set('book', JSON.stringify(book));
      form.set('country', country);
      form.set('angle', angle);
      (pageFiles.current.get(book.title) ?? []).forEach((f) => form.append('pages', f));
      const { kit: next } = await call<{ kit: TestKit }>('/api/kit', { method: 'POST', body: form });
      if (!kitGuard.current.isCurrent(request)) return;
      setKit(next);
      setKitVersion((v) => v + 1);
      setStatuses((s) => ({ ...s, localizer: 'done' }));
    } catch (e) {
      if (!kitGuard.current.isCurrent(request)) return;
      setStatuses((s) => ({ ...s, localizer: 'failed' }));
      fail(e);
    }
  }, []);

  const replay = useCallback(async () => {
    runGuard.current.next();
    kitGuard.current.next();
    setMatching(null);
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
    setReplayIsDummy(saved.isDummy === true);
    setSelected({ title: saved.results[0].tags.title, country: saved.kit.country });
    setStatuses({ reader: 'done', matcher: 'done', localizer: 'done' });
  }, []);

  const select = useCallback((title: string, country: CountryCode) => {
    kitGuard.current.next();
    setSelected({ title, country });
    setKit(null);
    setStatuses((s) => ({ ...s, localizer: 'waiting' }));
  }, []);

  return {
    results, statuses, matching, error, canReplay, selected, kit, kitVersion, replayedOn, replayIsDummy,
    analyze, createKit, replay, select,
  };
}

// Kept above the pages, so moving to Results and back doesn't lose the run.
const RadarContext = createContext<ReturnType<typeof useRadar> | null>(null);
export const RadarProvider = RadarContext.Provider;

export function useRadarContext() {
  const radar = useContext(RadarContext);
  if (!radar) throw new Error('useRadarContext must be used inside RadarProvider');
  return radar;
}
