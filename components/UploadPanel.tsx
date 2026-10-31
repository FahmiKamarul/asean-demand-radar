'use client';

import { useState, type FormEvent } from 'react';

export function UploadPanel({ busy, onAnalyze }: { busy: boolean; onAnalyze: (files: File[]) => void }) {
  const [files, setFiles] = useState<File[]>([]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (files.length > 0) onAnalyze(files);
  };

  return (
    <form className="stack" onSubmit={submit}>
      <h2>Add a book</h2>
      <label className="field">
        Cover or sample pages
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
      </label>
      <p className="muted">JPG, PNG or WebP, up to 5 images of 8 MB each.</p>
      <button className="btn" disabled={busy || files.length === 0}>
        {busy ? 'Reading the book…' : 'Find best-fit countries'}
      </button>
    </form>
  );
}
