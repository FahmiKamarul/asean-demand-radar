import type { BookTags, CountryFit } from '@/lib/types';

type Props = {
  book: BookTags;
  fit: CountryFit;
  countryName: string;
  kitBusy: boolean;
  onCreateKit: () => void;
};

const TAGS: [string, keyof BookTags][] = [
  ['Cuisine', 'cuisine'], ['Spice', 'spiceLevel'], ['Portion', 'portion'],
  ['Time', 'cookingTime'], ['Cost', 'ingredientCost'], ['Language', 'language'],
];

export function EvidencePanel({ book, fit, countryName, kitBusy, onCreateKit }: Props) {
  return (
    <section className="detail">
      <div className="detail-head">
        <div>
          <h2>{book.title} in {countryName}</h2>
          <p className="muted">
            {fit.score === null
              ? 'no evidence yet'
              : `Demand signal ${fit.score} out of 100, ${fit.confidence} confidence, from ${fit.evidence.length} cited source${fit.evidence.length === 1 ? '' : 's'}`}
          </p>
        </div>
        {fit.score !== null && (
          <button type="button" className="btn" disabled={kitBusy} onClick={onCreateKit}>
            {kitBusy ? 'Drafting test kit…' : 'Create test kit'}
          </button>
        )}
      </div>

      <dl className="tags" style={{ margin: 0 }}>
        {TAGS.map(([label, key]) => (
          <div key={key}><dt>{label}</dt><dd>{String(book[key])}</dd></div>
        ))}
      </dl>

      {fit.score === null ? (
        <p>Add sourced evidence for {countryName} to score this market.</p>
      ) : (
        <>
          <div className="stack">
            <h3>Why this score</h3>
            <p style={{ maxWidth: '70ch' }}>{fit.reason}</p>
            <p style={{ maxWidth: '70ch' }}><strong>Recommended test:</strong> {fit.suggestedAngle}</p>
            {fit.gaps.length > 0 && (
              <p className="muted" style={{ maxWidth: '70ch' }}>Still uncertain: {fit.gaps.join('; ')}</p>
            )}
          </div>
          <div>
            <h3 style={{ marginBottom: 8 }}>Sources</h3>
            <ul className="sources">
              {fit.evidence.map((e) => (
                <li key={e.id}>
                  {e.finding}{' '}
                  <a href={e.sourceUrl} target="_blank" rel="noreferrer">Open source</a>
                  <span className="muted"> · collected {e.collectedOn}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
