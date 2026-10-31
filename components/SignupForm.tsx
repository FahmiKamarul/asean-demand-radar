'use client';

import { useState, type FormEvent } from 'react';
import type { CountryCode } from '@/lib/types';

export function SignupForm({ country }: { country: CountryCode }) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const res = await fetch('/api/signups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...Object.fromEntries(data), country, consent: data.get('consent') === 'on' }),
    });
    setBusy(false);
    if (res.ok) setDone(true);
    else setError('Please check your name and email, and tick the consent box.');
  };

  if (done) return <p className="notice notice-ok" role="status">Thanks, you&apos;re signed up.</p>;

  return (
    <form className="stack" onSubmit={submit}>
      <label className="field">Name<input name="name" required autoComplete="name" /></label>
      <label className="field">Email<input name="email" type="email" required autoComplete="email" /></label>
      <label className="field">Favourite dishes<input name="favouriteDishes" /></label>
      <label className="field">
        Cooking skill
        <select name="skillLevel" defaultValue="beginner">
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </label>
      <label className="field">Dietary needs (optional)<input name="dietaryNeeds" /></label>
      <label className="approve" style={{ fontWeight: 400 }}>
        <input name="consent" type="checkbox" required />
        I agree that the seller may contact me about this book.
      </label>
      {error && <p className="notice notice-error" role="alert">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Signing up…' : 'Sign up'}</button>
    </form>
  );
}
