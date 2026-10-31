import { z } from 'zod';
import { generateJson, type Generate, type Part } from '../gemma';
import { SourceTypeSchema, type CountryCode, type Evidence } from '../types';

const ReplySchema = z.object({
  finding: z.string(),
  originalLanguage: z.string(),
  sourceType: SourceTypeSchema,
});

export function readEvidenceImage(
  image: Part,
  country: CountryCode,
  generate?: Generate,
): Promise<{ finding: string; originalLanguage: string; sourceType: Evidence['sourceType'] }> {
  const prompt = `This screenshot is market evidence about cooking and food interest in country code ${country}.
Return only JSON with these keys:
finding (one sentence in English stating only what the screenshot shows),
originalLanguage,
sourceType ("search_interest"|"search_volume"|"content"|"comments"|"competitor").
Leave out usernames, names, faces and other personal details.
Never infer anyone's religion, race or health.`;
  return generateJson([{ text: prompt }, image], ReplySchema, generate);
}
