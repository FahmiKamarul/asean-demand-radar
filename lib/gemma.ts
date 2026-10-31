import { GoogleGenAI } from '@google/genai';
import type { z } from 'zod';

export type Part = { text: string } | { inlineData: { mimeType: string; data: string } };
export type Generate = (parts: Part[]) => Promise<string>;
export type GemmaErrorKind = 'bad_output' | 'rate_limited' | 'unavailable';

export class GemmaError extends Error {
  constructor(public kind: GemmaErrorKind, message: string) {
    super(message);
    this.name = 'GemmaError';
  }
}

export function parseModelJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = (fenced ? fenced[1] : raw).trim();
  try {
    return JSON.parse(text);
  } catch {
    throw new GemmaError('bad_output', 'Gemma did not return valid JSON.');
  }
}

export const defaultGenerate: Generate = async (parts) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMMA_MODEL;
  if (!apiKey || !model) {
    throw new GemmaError('unavailable', 'Set GEMINI_API_KEY and GEMMA_MODEL in .env.local.');
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Instructions go in the user prompt because Gemma support for system instructions and JSON mode is unconfirmed.
    const res = await ai.models.generateContent({ model, contents: [{ role: 'user', parts }] });
    return res.text ?? '';
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status === 429) throw new GemmaError('rate_limited', 'Gemma is rate limited. Wait a moment and try again.');
    throw new GemmaError('unavailable', `Gemma could not be reached${status ? ` (HTTP ${status})` : ''}.`);
  }
};

export async function generateJson<T>(
  parts: Part[],
  schema: z.ZodType<T>,
  generate: Generate = defaultGenerate,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await generate(parts);
    try {
      return schema.parse(parseModelJson(raw));
    } catch (e) {
      lastError = e;
    }
  }
  throw new GemmaError('bad_output', `Gemma returned an unusable reply: ${String(lastError)}`);
}
