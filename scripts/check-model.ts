import { GoogleGenAI } from '@google/genai';
import { defaultGenerate } from '../lib/gemma';

// A 1x1 red PNG, enough to prove the model accepts images.
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const pager = await ai.models.list();
  console.log('Gemma models:');
  for await (const m of pager) {
    if (m.name?.toLowerCase().includes('gemma')) console.log(' ', m.name);
  }
  if (!process.env.GEMMA_MODEL) {
    console.log('Set GEMMA_MODEL to one of these in .env.local, then run this again.');
    return;
  }
  const start = Date.now();
  const reply = await defaultGenerate([
    { text: 'What colour is this image? Answer in one word.' },
    { inlineData: { mimeType: 'image/png', data: PNG } },
  ]);
  console.log(`Reply from ${process.env.GEMMA_MODEL} in ${Date.now() - start} ms: ${reply}`);
}

main().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
