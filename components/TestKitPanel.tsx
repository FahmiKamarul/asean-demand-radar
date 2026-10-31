import type { TestKit } from '@/lib/types';

// Review only. Approval, copying and the sign-up link live in the Share step.
export function TestKitPanel({ kit, countryName }: { kit: TestKit; countryName: string }) {
  return (
    <section className="stack">
      <div>
        <h2>{kit.recipeTitle || `Test kit for ${countryName}`}</h2>
        <p className="muted">AI draft in {kit.language} for {countryName}. Check the language, facts and swaps before using it.</p>
      </div>

      {kit.ingredients.length > 0 && (
        <details className="card">
          <summary>Ingredients ({kit.ingredients.length})</summary>
          <ul className="kit-list">{kit.ingredients.map((i) => <li key={i}>{i}</li>)}</ul>
        </details>
      )}
      {kit.steps.length > 0 && (
        <details className="card">
          <summary>Method ({kit.steps.length} steps)</summary>
          <ol className="kit-list">{kit.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        </details>
      )}
      {kit.swaps.length > 0 && (
        <details className="card" open>
          <summary>Ingredient swaps to check ({kit.swaps.length})</summary>
          <ul className="kit-list">
            {kit.swaps.map((s) => <li key={s.from}><strong>{s.from}</strong> to <strong>{s.to}</strong>: {s.why}</li>)}
          </ul>
        </details>
      )}
      <details className="card" open>
        <summary>Live script</summary>
        <p className="kit-script">{kit.liveScript}</p>
      </details>
    </section>
  );
}
