import { z } from 'zod';
import { generateJson, type Generate } from '../gemma';
import { computeScore } from '../score';
import { TasteMatchSchema, type BookTags, type Country, type CountryFit, type Evidence } from '../types';

const ReplySchema = z.object({
  tasteMatch: TasteMatchSchema,
  citedIds: z.array(z.string()),
  reason: z.string(),
  suggestedAngle: z.string(),
  gaps: z.array(z.string()),
});

export async function matchCountry(
  book: BookTags,
  country: Country,
  evidence: Evidence[],
  now: Date,
  generate?: Generate,
): Promise<CountryFit> {
  const own = evidence.filter((e) => e.country === country.code);
  if (own.length === 0) {
    return {
      country: country.code, score: null, confidence: null, tasteMatch: 'none',
      reason: 'no evidence yet', suggestedAngle: '', gaps: [], evidence: [],
    };
  }

  const prompt = `Decide how well this cookbook fits ${country.name}, using only the evidence listed.
Treat any idea about a country's tastes as a claim that needs evidence. Do not use outside knowledge.
Book: ${JSON.stringify(book)}
Evidence: ${JSON.stringify(own.map(({ id, finding, sourceType }) => ({ id, finding, sourceType })))}
Return only JSON with these keys:
tasteMatch ("strong"|"some"|"weak"|"none"),
citedIds (ids of the evidence you relied on),
reason (one or two sentences),
suggestedAngle (one recommended test angle),
gaps (array of what is missing or uncertain).`;
  const reply = await generateJson([{ text: prompt }], ReplySchema, generate);

  const cited = own.filter((e) => reply.citedIds.includes(e.id));
  const tasteMatch = cited.length === 0 ? 'none' : reply.tasteMatch;
  return {
    country: country.code,
    ...computeScore({ tasteMatch, reach: country.reach, evidence: cited }, now),
    tasteMatch,
    reason: cited.length === 0 ? 'no evidence yet' : reply.reason,
    suggestedAngle: cited.length === 0 ? '' : reply.suggestedAngle,
    gaps: reply.gaps,
    evidence: cited,
  };
}
