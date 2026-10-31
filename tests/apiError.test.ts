import { z } from 'zod';
import { toErrorResponse } from '@/lib/apiError';
import { GemmaError } from '@/lib/gemma';
import { UploadError } from '@/lib/uploads';

test('rate limit maps to 429 with replay offered', async () => {
  const res = toErrorResponse(new GemmaError('rate_limited', 'x'));
  expect(res.status).toBe(429);
  expect(await res.json()).toEqual({ error: 'x', canReplay: true });
});

test('unavailable maps to 503 with replay offered', async () => {
  const res = toErrorResponse(new GemmaError('unavailable', 'x'));
  expect(res.status).toBe(503);
  expect((await res.json()).canReplay).toBe(true);
});

test('upload errors map to 400 without replay', async () => {
  const res = toErrorResponse(new UploadError('bad'));
  expect(res.status).toBe(400);
  expect((await res.json()).canReplay).toBe(false);
});

test('invalid input maps to 400', () => {
  const parsed = z.string().safeParse(1);
  expect(toErrorResponse(parsed.error).status).toBe(400);
});

test('unknown errors do not leak details', async () => {
  const res = toErrorResponse(new Error('secret path'));
  expect(res.status).toBe(500);
  expect((await res.json()).error).not.toContain('secret');
});
