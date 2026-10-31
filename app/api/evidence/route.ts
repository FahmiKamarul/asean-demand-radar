import { z } from 'zod';
import { readEvidenceImage } from '@/lib/agents/evidenceReader';
import { toErrorResponse } from '@/lib/apiError';
import { addEvidence, readEvidence } from '@/lib/evidence';
import { CountryCodeSchema } from '@/lib/types';
import { filesToParts } from '@/lib/uploads';

const SourceUrlSchema = z.string().regex(/^https?:\/\//);

export async function GET() {
  try {
    return Response.json({ evidence: await readEvidence() });
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const country = CountryCodeSchema.parse(form.get('country'));
    const sourceUrl = SourceUrlSchema.parse(form.get('sourceUrl'));
    const [image] = await filesToParts(form.getAll('image') as File[]);
    const read = await readEvidenceImage(image, country);
    const evidence = await addEvidence({
      ...read,
      country,
      sourceUrl,
      collectedOn: new Date().toISOString().slice(0, 10),
    });
    return Response.json({ evidence });
  } catch (e) {
    return toErrorResponse(e);
  }
}
