import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { CountryCodeSchema, type CountryCode } from './types';

export const SignupSchema = z.object({
  country: CountryCodeSchema,
  name: z.string().trim().min(1),
  email: z.string().email(),
  favouriteDishes: z.string(),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  dietaryNeeds: z.string(),
  consent: z.literal(true),
});
export type Signup = z.infer<typeof SignupSchema>;

const signupsFile = () => process.env.SIGNUPS_FILE ?? path.join(process.cwd(), 'data', 'signups.json');

async function readSignups(): Promise<Signup[]> {
  try {
    return z.array(SignupSchema).parse(JSON.parse(await readFile(signupsFile(), 'utf8')));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
}

export async function addSignup(input: unknown): Promise<void> {
  const signup = SignupSchema.parse(input);
  await writeFile(signupsFile(), JSON.stringify([...(await readSignups()), signup], null, 2));
}

export async function countByCountry(): Promise<Record<CountryCode, number>> {
  const counts: Record<CountryCode, number> = { ID: 0, PH: 0, TH: 0 };
  for (const s of await readSignups()) counts[s.country] += 1;
  return counts;
}
