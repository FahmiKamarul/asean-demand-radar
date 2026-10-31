import type { CountryFit } from '@/lib/types';

type Props = {
  fit: CountryFit;
  countryName: string;
  kitBusy: boolean;
  kitReady: boolean;
  onCreateKit: () => void;
};

export function EvidencePanel({ fit, countryName, kitBusy, kitReady, onCreateKit }: Props) {
  if (fit.score === null) {
    return <div className="detail"><p className="muted">Add sourced evidence for {countryName} to score this market.</p></div>;
  }
  return (
    <div className="detail">
      <p>{fit.reason}</p>
      <p><strong>Recommended test:</strong> {fit.suggestedAngle}</p>
      {fit.gaps.length > 0 && <p className="muted">Still uncertain: {fit.gaps.join('; ')}</p>}
      <details>
        <summary>{fit.evidence.length} source{fit.evidence.length === 1 ? '' : 's'}</summary>
        <ul className="sources">
          {fit.evidence.map((e) => (
            <li key={e.id}>
              {e.finding}{' '}
              <a href={e.sourceUrl} target="_blank" rel="noreferrer">Open source</a>
              <span className="muted"> · {e.collectedOn}</span>
            </li>
          ))}
        </ul>
      </details>
      <button type="button" className="btn btn-block" disabled={kitBusy} onClick={onCreateKit}>
        {kitBusy ? 'Drafting test kit…' : kitReady ? 'Open test kit' : `Create test kit for ${countryName}`}
      </button>
    </div>
  );
}
