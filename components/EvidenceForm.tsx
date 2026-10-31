'use client';

import { useState, type FormEvent } from 'react';
import { COUNTRIES } from '@/lib/useRadar';
import type { Evidence } from '@/lib/types';

export function EvidenceForm() {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<Evidence | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setSaved(null);
    setError(null);
    try {
      const res = await fetch('/api/evidence', { method: 'POST', body: new FormData(form) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setSaved(body.evidence);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The screenshot could not be read.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="stack" onSubmit={submit}>
      <h2>Add market evidence</h2>
      <label className="field">
        Country
        <select name="country" required>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </label>
      <label className="field">
        Screenshot
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp" required />
      </label>
      <label className="field">
        Source link
        <input name="sourceUrl" type="url" placeholder="https://" required />
      </label>
      <p className="muted">Crop out usernames and faces first.</p>
      <button className="btn btn-quiet" disabled={busy}>{busy ? 'Reading screenshot…' : 'Read and save'}</button>
      {saved && <p className="notice notice-ok" role="status">Saved: {saved.finding} Run the book again to update its score.</p>}
      {error && <p className="notice notice-error" role="alert">{error}</p>}
    </form>
  );
}
