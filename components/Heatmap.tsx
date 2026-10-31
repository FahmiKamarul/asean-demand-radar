import type { ReactNode } from 'react';
import { heatBand, type BookResult } from '@/lib/radarState';
import type { CountryCode } from '@/lib/types';
import { COUNTRIES } from '@/lib/useRadar';

type Props = {
  result: BookResult;
  selected: CountryCode | null;
  onSelect: (country: CountryCode) => void;
  // Shown under the selected country's card.
  detail: ReactNode;
};

// One card per country, best demand signal first. Tapping a card opens its reasons and sources.
export function Heatmap({ result, selected, onSelect, detail }: Props) {
  const rows = COUNTRIES.map((c) => ({ ...c, fit: result.fits.find((f) => f.country === c.code) }))
    .sort((a, b) => (b.fit?.score ?? -1) - (a.fit?.score ?? -1));
  return (
    <ul className="countries">
      {rows.map(({ code, name, fit }) => {
        const isSelected = selected === code;
        if (!fit) {
          return (
            <li key={code} className="country heat-pending">
              <span className="country-name">{name}</span>
              <span className="heat-label">{result.incomplete ? 'not checked' : 'Checking…'}</span>
            </li>
          );
        }
        return (
          <li key={code}>
            <button
              type="button"
              className={`country heat-${heatBand(fit.score)}${isSelected ? ' heat-selected' : ''}`}
              aria-expanded={isSelected}
              onClick={() => onSelect(code)}
            >
              <span className="country-name">{name}</span>
              {fit.score === null ? (
                <span className="heat-label">no evidence yet</span>
              ) : (
                <span className="country-score">
                  <span className="heat-num">{fit.score}</span>
                  <span className="heat-label">{fit.confidence} confidence</span>
                </span>
              )}
            </button>
            {isSelected && detail}
          </li>
        );
      })}
    </ul>
  );
}
