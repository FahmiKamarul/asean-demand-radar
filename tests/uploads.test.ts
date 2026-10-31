import { UploadError, filesToParts } from '@/lib/uploads';

const png = (size = 1) => new File([new Uint8Array(size)], 'a.png', { type: 'image/png' });

test('rejects HEIC with a helpful message', async () => {
  await expect(filesToParts([new File(['x'], 'a.heic', { type: 'image/heic' })])).rejects.toThrow('Use JPG, PNG or WebP');
});

test('rejects files over 8 MB', async () => {
  await expect(filesToParts([png(8 * 1024 * 1024 + 1)])).rejects.toThrow('8 MB');
});

test('rejects more than 5 files', async () => {
  await expect(filesToParts(Array(6).fill(png()))).rejects.toThrow('5');
});

test('rejects no files', async () => {
  await expect(filesToParts([])).rejects.toBeInstanceOf(UploadError);
  await expect(filesToParts([])).rejects.toThrow('at least one');
});

test('converts an image to base64 inline data', async () => {
  const [part] = await filesToParts([new File(['hi'], 'a.png', { type: 'image/png' })]);
  expect(part).toEqual({ inlineData: { mimeType: 'image/png', data: 'aGk=' } });
});
