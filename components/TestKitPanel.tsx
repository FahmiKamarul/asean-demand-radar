'use client';

import { useState } from 'react';
import { kitActions } from '@/lib/kitApproval';
import type { TestKit } from '@/lib/types';

function kitAsText(kit: TestKit): string {
  return [
    kit.recipeTitle,
    kit.ingredients.join('\n'),
    kit.steps.join('\n'),
    kit.swaps.map((s) => `${s.from} -> ${s.to}: ${s.why}`).join('\n'),
    kit.liveScript,
  ].filter(Boolean).join('\n\n');
}

export function TestKitPanel({ kit, countryName }: { kit: TestKit; countryName: string }) {
  const [approved, setApproved] = useState(false);
  const [copied, setCopied] = useState(false);
  const { canCopy, showLink } = kitActions(approved);

  const copy = async () => {
    await navigator.clipboard.writeText(kitAsText(kit));
    setCopied(true);
  };

  return (
    <section className="detail">
      <div>
        <h2>Test kit for {countryName}</h2>
        <p className="muted">AI draft in {kit.language}. Check the language, facts and swaps before using it.</p>
      </div>

      {kit.recipeTitle && (
        <div className="kit-grid">
          <div>
            <h3>{kit.recipeTitle}</h3>
            <ul className="kit-list">{kit.ingredients.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
          <div>
            <h3>Method</h3>
            <ol className="kit-list">{kit.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          </div>
        </div>
      )}

      {kit.swaps.length > 0 && (
        <div>
          <h3>Ingredient swaps to check</h3>
          <ul className="kit-list">
            {kit.swaps.map((s) => <li key={s.from}><strong>{s.from}</strong> to <strong>{s.to}</strong>: {s.why}</li>)}
          </ul>
        </div>
      )}

      <div className="stack">
        <h3>Live script</h3>
        <p className="kit-script">{kit.liveScript}</p>
      </div>

      <label className="approve">
        <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} />
        I&apos;ve reviewed this content
      </label>

      <div className="actions">
        <button type="button" className="btn" disabled={!canCopy} onClick={copy}>
          {copied ? 'Copied' : 'Copy test kit'}
        </button>
        {showLink ? (
          <a href={kit.signupPath}>Open sign-up page</a>
        ) : (
          <span className="muted">Approve the content to copy it and get the sign-up link.</span>
        )}
      </div>
    </section>
  );
}
