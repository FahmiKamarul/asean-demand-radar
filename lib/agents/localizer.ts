import { z } from 'zod';
import { generateJson, type Generate, type Part } from '../gemma';
import type { BookTags, Country, TestKit } from '../types';

const text = z.string().nullish().transform((v) => v ?? '');
const strings = z.array(z.string()).nullish().transform((v) => v ?? []);

const ReplySchema = z.object({
  language: z.string().nullish(),
  recipeTitle: text,
  ingredients: strings,
  steps: strings,
  swaps: z
    .array(z.object({ from: z.string(), to: z.string(), why: text }))
    .nullish()
    .transform((v) => v ?? []),
  liveScript: z.string().min(1),
});

export async function buildTestKit(
  book: BookTags,
  country: Country,
  angle: string,
  pageImages: Part[],
  generate?: Generate,
): Promise<TestKit> {
  const prompt = `Create a market test kit for selling this cookbook in ${country.name}, written in ${country.language}.
Book: ${JSON.stringify(book)}
Test angle: ${angle}
Adapt only what the page images or book details show. Do not invent a recipe the book does not contain.
If no recipe is visible, leave recipeTitle, ingredients and steps empty and write only the live script.
Do not state facts about the country or claims about what its people like.
Never infer anyone's religion, race or health.
Every ingredient swap's "why" must include what a local checker should confirm.
Return only JSON with these keys:
language, recipeTitle, ingredients (array), steps (array),
swaps (array of objects with from, to, why), liveScript (a short script for a live selling session).`;
  const reply = await generateJson([{ text: prompt }, ...pageImages], ReplySchema, generate);
  return {
    ...reply,
    language: reply.language || country.language,
    country: country.code,
    signupPath: `/signup/${country.code}`,
  };
}
