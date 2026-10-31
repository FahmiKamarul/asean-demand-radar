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
      <label className="dropzone">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
        <span className="dropzone-title">
          {files.length > 0 ? `${files.length} page${files.length === 1 ? '' : 's'} chosen` : 'Choose book pages'}
        </span>
        <span className="muted">Cover or a recipe page. JPG, PNG or WebP, up to 5 images of 8 MB each.</span>
      </label>
      <button className="btn btn-block" disabled={busy || files.length === 0}>
        {busy ? 'Agents are working…' : 'Find best-fit countries'}
      </button>
    </form>
  );
}
