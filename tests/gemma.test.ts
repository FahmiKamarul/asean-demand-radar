import { z } from 'zod';
import { GemmaError, generateJson, parseModelJson } from '@/lib/gemma';

test('parses fenced JSON', () => {
  expect(parseModelJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
});

test('retries once, then succeeds', async () => {
  const gen = vi.fn().mockResolvedValueOnce('nope').mockResolvedValueOnce('{"a":1}');
  await expect(generateJson([], z.object({ a: z.number() }), gen)).resolves.toEqual({ a: 1 });
  expect(gen).toHaveBeenCalledTimes(2);
});

test('throws bad_output after two invalid replies', async () => {
  const gen = vi.fn().mockResolvedValue('nope');
  await expect(generateJson([], z.object({ a: z.number() }), gen)).rejects.toMatchObject({ kind: 'bad_output' });
  expect(gen).toHaveBeenCalledTimes(2);
});

test('does not retry rate limits', async () => {
  const gen = vi.fn().mockRejectedValue(new GemmaError('rate_limited', 'slow down'));
  await expect(generateJson([], z.object({}), gen)).rejects.toMatchObject({ kind: 'rate_limited' });
  expect(gen).toHaveBeenCalledTimes(1);
});
