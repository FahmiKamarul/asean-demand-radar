'use client';

import Link from 'next/link';
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

export function SharePanel({ kit, countryName }: { kit: TestKit; countryName: string }) {
  const [approved, setApproved] = useState(false);
  const [copied, setCopied] = useState(false);
  const { canCopy, showLink } = kitActions(approved);

  const copy = async () => {
    await navigator.clipboard.writeText(kitAsText(kit));
    setCopied(true);
  };

  return (
    <section className="stack">
      <h2>Share the test in {countryName}</h2>
      <label className="approve card">
        <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} />
        I&apos;ve reviewed this content
      </label>
      <button type="button" className="btn btn-block" disabled={!canCopy} onClick={copy}>
        {copied ? 'Copied' : 'Copy test kit'}
      </button>
      {showLink ? (
        <a className="btn btn-quiet btn-block" href={kit.signupPath} target="_blank" rel="noreferrer">Open sign-up page</a>
      ) : (
        <p className="muted">Approve the content to copy it and get the sign-up link.</p>
      )}
      <Link href="/dashboard" className="muted">See sign-ups by country</Link>
    </section>
  );
}
