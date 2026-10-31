import { buildTestKit } from '@/lib/agents/localizer';
import { toErrorResponse } from '@/lib/apiError';
import { getCountries } from '@/lib/evidence';
import { BookTagsSchema, CountryCodeSchema } from '@/lib/types';
import { filesToParts } from '@/lib/uploads';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const book = BookTagsSchema.parse(JSON.parse(String(form.get('book'))));
    const code = CountryCodeSchema.parse(form.get('country'));
    const angle = String(form.get('angle') ?? '');
    const page = form.get('page');
    const pageImage = page instanceof File ? (await filesToParts([page]))[0] : null;
    const country = (await getCountries()).find((c) => c.code === code)!;
    return Response.json({ kit: await buildTestKit(book, country, angle, pageImage) });
  } catch (e) {
    return toErrorResponse(e);
  }
}
