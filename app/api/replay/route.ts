import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function GET() {
  try {
    const raw = await readFile(path.join(process.cwd(), 'data', 'replay', 'demo.json'), 'utf8');
    return new Response(raw, { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return Response.json({ error: 'No saved result yet.' }, { status: 404 });
  }
}
