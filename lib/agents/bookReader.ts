import { generateJson, type Generate, type Part } from '../gemma';
import { BookTagsSchema, type BookTags } from '../types';

const PROMPT = `You are reading photos of a cookbook's cover or pages.
Return only JSON with these keys:
readable (boolean), title, cuisine, spiceLevel ("mild"|"medium"|"hot"|"unknown"),
portion ("small"|"family"|"unknown"), cookingTime, ingredientCost ("low"|"medium"|"high"|"unknown"),
dietaryFit (array of strings), language.
Use only what the images show. Use "unknown" rather than guessing.
dietaryFit describes the recipes only, never the people who might read them.
If the images are not a readable book page, set readable to false and every other text value to "unknown".`;

export function readBook(images: Part[], generate?: Generate): Promise<BookTags> {
  return generateJson([{ text: PROMPT }, ...images], BookTagsSchema, generate);
}
