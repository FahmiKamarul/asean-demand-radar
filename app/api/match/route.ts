import { z } from 'zod';
import { matchCountry } from '@/lib/agents/marketMatcher';
import { toErrorResponse } from '@/lib/apiError';
import { getCountries, readEvidence } from '@/lib/evidence';
import { BookTagsSchema, CountryCodeSchema } from '@/lib/types';

const BodySchema = z.object({ book: BookTagsSchema, country: CountryCodeSchema });

export async function POST(req: Request) {
  try {
    const { book, country } = BodySchema.parse(await req.json());
    const countries = await getCountries();
    const target = countries.find((c) => c.code === country)!;
    const fit = await matchCountry(book, target, await readEvidence(), new Date());
    return Response.json({ fit });
  } catch (e) {
    return toErrorResponse(e);
  }
}
