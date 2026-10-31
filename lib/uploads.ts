import type { Part } from './gemma';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 5;

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

export async function filesToParts(files: File[]): Promise<Part[]> {
  if (files.length === 0) throw new UploadError('Add at least one image.');
  if (files.length > MAX_FILES) throw new UploadError(`Add no more than ${MAX_FILES} images.`);
  for (const file of files) {
    if (!ALLOWED.includes(file.type)) throw new UploadError(`${file.name}: Use JPG, PNG or WebP.`);
    if (file.size > MAX_BYTES) throw new UploadError(`${file.name} is over the 8 MB limit.`);
  }
  return Promise.all(
    files.map(async (file) => ({
      inlineData: { mimeType: file.type, data: Buffer.from(await file.arrayBuffer()).toString('base64') },
    })),
  );
}
