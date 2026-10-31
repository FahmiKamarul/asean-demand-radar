const ctor = vi.hoisted(() => vi.fn());

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: async () => ({ text: '{}' }) };
    constructor(options: unknown) {
      ctor(options);
    }
  },
}));

import { defaultGenerate } from '@/lib/gemma';

test('a stalled Gemma call times out after 60 seconds', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  process.env.GEMMA_MODEL = 'test-model';
  await defaultGenerate([{ text: 'hi' }]);
  expect(ctor.mock.calls[0][0]).toMatchObject({ httpOptions: { timeout: 60000 } });
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMMA_MODEL;
});
