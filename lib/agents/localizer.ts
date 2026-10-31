import { z } from 'zod';
import { generateJson, type Generate, type Part } from '../gemma';
import type { BookTags, Country, TestKit } from '../types';

const ReplySchema = z.object({
  language: z.string(),
  recipeTitle: z.string(),
  ingredients: z.array(z.string()),
  steps: z.array(z.string()),
  swaps: z.array(z.object({ from: z.string(), to: z.string(), why: z.string() })),
  liveScript: z.string(),
});

export async function buildTestKit(
  book: BookTags,
  country: Country,
  angle: string,
  pageImage: Part | null,
  generate?: Generate,
): Promise<TestKit> {
  const prompt = `Create a market test kit for selling this cookbook in ${country.name}, written in ${country.language}.
Book: ${JSON.stringify(book)}
Test angle: ${angle}
Adapt only what the page image or book details show. Do not invent a recipe the book does not contain.
If no recipe is visible, leave recipeTitle, ingredients and steps empty and write only the live script.
Do not state facts about the country or claims about what its people like.
Every ingredient swap's "why" must include what a local checker should confirm.
Return only JSON with these keys:
language, recipeTitle, ingredients (array), steps (array),
swaps (array of objects with from, to, why), liveScript (a short script for a live selling session).`;
  const parts: Part[] = pageImage ? [{ text: prompt }, pageImage] : [{ text: prompt }];
  const reply = await generateJson(parts, ReplySchema, generate);
  return { ...reply, country: country.code, signupPath: `/signup/${country.code}` };
}
