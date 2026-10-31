import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { addSignup, countByCountry } from '@/lib/signups';

const valid = {
  country: 'ID', name: 'Test Person', email: 'person@example.com', favouriteDishes: 'sambal',
  skillLevel: 'beginner', dietaryNeeds: '', consent: true,
};
let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'radar-'));
  process.env.SIGNUPS_FILE = path.join(dir, 'signups.json');
});

afterEach(async () => {
  delete process.env.SIGNUPS_FILE;
  await rm(dir, { recursive: true });
});

test('rejects a sign-up without consent', async () => {
  await expect(addSignup({ ...valid, consent: false })).rejects.toThrow();
  expect((await countByCountry()).ID).toBe(0);
});

test('rejects an invalid email', async () => {
  await expect(addSignup({ ...valid, email: 'nope' })).rejects.toThrow();
});

test('counts by country without exposing people', async () => {
  await addSignup(valid);
  const counts = await countByCountry();
  expect(counts).toEqual({ ID: 1, PH: 0, TH: 0 });
  expect(JSON.stringify(counts)).not.toContain(valid.email);
});
