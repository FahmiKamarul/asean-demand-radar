'use client';

import { useState, type FormEvent } from 'react';
import type { BookTags } from '@/lib/types';

// The seller describes the book directly, which skips the Book Reader and works without Gemma.
export function BookForm({ busy, onSubmit }: { busy: boolean; onSubmit: (tags: BookTags) => void }) {
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const text = (name: string) => String(f.get(name) ?? '').trim();
    if (!text('title') || !text('cuisine')) {
      setError('Add a title and a cuisine.');
      return;
    }
    setError(null);
    onSubmit({
      readable: true,
      title: text('title'),
      cuisine: text('cuisine'),
      spiceLevel: text('spiceLevel') as BookTags['spiceLevel'],
      portion: text('portion') as BookTags['portion'],
      cookingTime: text('cookingTime') || 'unknown',
      ingredientCost: text('ingredientCost') as BookTags['ingredientCost'],
      dietaryFit: text('dietaryFit') ? text('dietaryFit').split(',').map((d) => d.trim()).filter(Boolean) : [],
      language: text('language') || 'unknown',
    });
  };

  return (
    <form className="stack" onSubmit={submit} onChange={() => setError(null)}>
      <label className="field">Title<input name="title" placeholder="CWC Vol 25" /></label>
      <label className="field">Cuisine<input name="cuisine" placeholder="Malaysian home cooking" /></label>
      <div className="field-row">
        <label className="field">Spice
          <select name="spiceLevel" defaultValue="medium">
            <option value="mild">Mild</option><option value="medium">Medium</option>
            <option value="hot">Hot</option><option value="unknown">Not sure</option>
          </select>
        </label>
        <label className="field">Portion
          <select name="portion" defaultValue="family">
            <option value="small">Small</option><option value="family">Family</option><option value="unknown">Not sure</option>
          </select>
        </label>
        <label className="field">Cost
          <select name="ingredientCost" defaultValue="low">
            <option value="low">Low</option><option value="medium">Medium</option>
            <option value="high">High</option><option value="unknown">Not sure</option>
          </select>
        </label>
      </div>
      <div className="field-row">
        <label className="field">Cooking time<input name="cookingTime" placeholder="15–60 minutes" /></label>
        <label className="field">Language<input name="language" placeholder="Malay" /></label>
      </div>
      <label className="field">Dietary fit (optional)<input name="dietaryFit" placeholder="no pork, vegetarian" /></label>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button className="btn btn-block" disabled={busy}>{busy ? 'Checking countries…' : 'Find best-fit countries'}</button>
    </form>
  );
}
