import { z } from 'zod';
import { generateJson, type Generate, type Part } from '../gemma';
import type { BookTags } from '../types';

const PROMPT = `You are reading photos of a cookbook's cover or pages.
Return only JSON with these keys:
readable (boolean), title, cuisine, spiceLevel ("mild"|"medium"|"hot"|"unknown"),
portion ("small"|"family"|"unknown"), cookingTime, ingredientCost ("low"|"medium"|"high"|"unknown"),
dietaryFit (array of strings), language.
Use only what the images show. Use "unknown" rather than guessing.
dietaryFit describes the recipes only, never the people who might read them.
Never infer anyone's religion, race or health.
If the images are not a readable book page, set readable to false and every other text value to "unknown".`;

const text = z.string().nullish().transform((v) => v?.trim() || 'unknown');
const list = z.array(z.string()).nullish().transform((v) => v ?? []);

const BLANK: Omit<BookTags, 'readable'> = {
  title: 'unknown', cuisine: 'unknown', spiceLevel: 'unknown', portion: 'unknown', cookingTime: 'unknown',
  ingredientCost: 'unknown', dietaryFit: [], language: 'unknown',
};

// Gemma may leave out or null any field, and an unreadable page must never carry invented tags.
const ReplySchema = z
  .object({
    readable: z.boolean().catch(false),
    title: text,
    cuisine: text,
    spiceLevel: z.enum(['mild', 'medium', 'hot', 'unknown']).catch('unknown'),
    portion: z.enum(['small', 'family', 'unknown']).catch('unknown'),
    cookingTime: text,
    ingredientCost: z.enum(['low', 'medium', 'high', 'unknown']).catch('unknown'),
    dietaryFit: list,
    language: text,
  })
  .transform((tags): BookTags => (tags.readable ? tags : { ...BLANK, readable: false }));

export function readBook(images: Part[], generate?: Generate): Promise<BookTags> {
  return generateJson([{ text: PROMPT }, ...images], ReplySchema, generate);
}
