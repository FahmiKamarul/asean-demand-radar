import { readBook } from '@/lib/agents/bookReader';
import { toErrorResponse } from '@/lib/apiError';
import { filesToParts } from '@/lib/uploads';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const parts = await filesToParts(form.getAll('pages') as File[]);
    return Response.json({ book: await readBook(parts) });
  } catch (e) {
    return toErrorResponse(e);
  }
}
