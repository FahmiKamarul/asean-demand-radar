import { ZodError } from 'zod';
import { GemmaError } from './gemma';
import { UploadError } from './uploads';

const GEMMA_STATUS = { rate_limited: 429, unavailable: 503, bad_output: 502 } as const;

export function toErrorResponse(e: unknown): Response {
  if (e instanceof GemmaError) {
    return Response.json({ error: e.message, canReplay: true }, { status: GEMMA_STATUS[e.kind] });
  }
  if (e instanceof UploadError) {
    return Response.json({ error: e.message, canReplay: false }, { status: 400 });
  }
  if (e instanceof ZodError) {
    return Response.json({ error: 'The request was missing or had invalid details.', canReplay: false }, { status: 400 });
  }
  console.error(e);
  return Response.json({ error: 'Something went wrong.', canReplay: false }, { status: 500 });
}
