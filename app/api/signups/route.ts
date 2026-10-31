import { toErrorResponse } from '@/lib/apiError';
import { addSignup } from '@/lib/signups';

export async function POST(req: Request) {
  try {
    await addSignup(await req.json());
    return Response.json({ ok: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
