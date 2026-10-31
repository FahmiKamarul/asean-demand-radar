import sample from '@/data/sample-results.json';
import { countByCountry } from '@/lib/signups';
import { COUNTRY_NAMES } from '@/lib/countryNames';
import type { CountryCode } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const counts = await countByCountry();
  const codes = Object.keys(counts) as CountryCode[];
  return (
    <main className="page">
      <div className="intro">
        <h1>Results by country</h1>
        <p>Compare what each market test produced, so real results can replace assumptions.</p>
      </div>

      <section className="stack" style={{ marginBottom: 40 }}>
        <h2>Real sign-ups</h2>
        <table className="results">
          <thead><tr><th scope="col">Country</th><th scope="col">Sign-ups</th></tr></thead>
          <tbody>
            {codes.map((c) => <tr key={c}><td>{COUNTRY_NAMES[c]}</td><td>{counts[c]}</td></tr>)}
          </tbody>
        </table>
      </section>

      <section className="stack">
        <h2>Sample data for illustration</h2>
        <p className="notice notice-warn">These numbers are made up to show what the full product would report.</p>
        <table className="results">
          <thead>
            <tr><th scope="col">Country</th><th scope="col">Leads</th><th scope="col">Replies</th><th scope="col">Meetings</th></tr>
          </thead>
          <tbody>
            {sample.rows.map((r) => (
              <tr key={r.country}>
                <td>{COUNTRY_NAMES[r.country as CountryCode]}</td><td>{r.leads}</td><td>{r.replies}</td><td>{r.meetings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
