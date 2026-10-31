import { heatBand, type BookResult } from '@/lib/radarState';
import type { CountryCode } from '@/lib/types';
import { COUNTRIES } from '@/lib/useRadar';

type Props = {
  results: BookResult[];
  selected: { title: string; country: CountryCode } | null;
  onSelect: (title: string, country: CountryCode) => void;
};

export function Heatmap({ results, selected, onSelect }: Props) {
  if (results.length === 0) {
    return <p className="empty">Add a book page to see how it fits each country.</p>;
  }
  return (
    <table className="heatmap">
      <caption className="muted" style={{ textAlign: 'left', padding: '0 6px 6px' }}>
        Demand signal out of 100, based on the saved evidence. A guide for what to test, not a market prediction.
      </caption>
      <thead>
        <tr>
          <th scope="col" className="book-col">Book</th>
          {COUNTRIES.map((c) => <th key={c.code} scope="col">{c.name}</th>)}
        </tr>
      </thead>
      <tbody>
        {results.map((r) => (
          <tr key={r.tags.title}>
            <th scope="row">{r.tags.title}</th>
            {COUNTRIES.map((c) => {
              const fit = r.fits.find((f) => f.country === c.code);
              if (!fit) {
                return <td key={c.code}><div className="heat heat-pending"><span className="heat-label">Checking…</span></div></td>;
              }
              const isSelected = selected?.title === r.tags.title && selected.country === c.code;
              return (
                <td key={c.code}>
                  <button
                    type="button"
                    className={`heat heat-${heatBand(fit.score)}${isSelected ? ' heat-selected' : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => onSelect(r.tags.title, c.code)}
                  >
                    {fit.score === null ? (
                      <span className="heat-label">no evidence yet</span>
                    ) : (
                      <>
                        <span className="heat-num">{fit.score}</span>
                        <span className="heat-label">{fit.confidence} confidence</span>
                      </>
                    )}
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
