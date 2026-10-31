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
    const pages = form.getAll('pages') as File[];
    const pageImages = pages.length > 0 ? await filesToParts(pages) : [];
    const country = (await getCountries()).find((c) => c.code === code)!;
    return Response.json({ kit: await buildTestKit(book, country, angle, pageImages) });
  } catch (e) {
    return toErrorResponse(e);
  }
}
