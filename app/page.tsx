'use client';

import { useEffect } from 'react';
import { AgentProgress } from '@/components/AgentProgress';
import { EvidenceForm } from '@/components/EvidenceForm';
import { EvidencePanel } from '@/components/EvidencePanel';
import { Heatmap } from '@/components/Heatmap';
import { TestKitPanel } from '@/components/TestKitPanel';
import { UploadPanel } from '@/components/UploadPanel';
import { COUNTRY_NAMES } from '@/lib/countryNames';
import { useRadarContext } from '@/lib/useRadar';

export default function Home() {
  const radar = useRadarContext();
  const { replay } = radar;

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('replay')) void replay();
  }, [replay]);

  const book = radar.results.find((r) => r.tags.title === radar.selected?.title);
  const fit = book?.fits.find((f) => f.country === radar.selected?.country);
  const countryName = radar.selected ? COUNTRY_NAMES[radar.selected.country] : '';
  const busy = [radar.statuses.reader, radar.statuses.matcher, radar.statuses.localizer].includes('running');

  return (
    <main className="page">
      <div className="intro">
        <h1>Which book should you test in which country?</h1>
        <p>Upload a book page, compare it with sourced market evidence, then create a test kit for the best fit.</p>
      </div>

      {radar.replayedOn && (
        <p className="notice notice-warn" role="status" style={{ marginBottom: 24 }}>
          Replaying a saved result from {radar.replayedOn}
        </p>
      )}

      <div className="workspace">
        <aside className="rail">
          <UploadPanel busy={busy} onAnalyze={radar.analyze} />
          <AgentProgress statuses={radar.statuses} matching={radar.matching} />
          <EvidenceForm />
        </aside>

        <div className="main">
          {radar.error && (
            <div className="notice notice-error actions" role="alert">
              <span>{radar.error}</span>
              {radar.canReplay && (
                <button type="button" className="btn btn-quiet" onClick={() => void radar.replay()}>
                  Replay saved result
                </button>
              )}
            </div>
          )}
          <Heatmap results={radar.results} selected={radar.selected} onSelect={radar.select} />
          {book && fit && (
            <EvidencePanel
              book={book.tags}
              fit={fit}
              countryName={countryName}
              kitBusy={radar.statuses.localizer === 'running'}
              onCreateKit={() => void radar.createKit(book.tags, fit.country, fit.suggestedAngle)}
            />
          )}
          {radar.kit && (
            <TestKitPanel key={radar.kitVersion} kit={radar.kit} countryName={COUNTRY_NAMES[radar.kit.country]} />
          )}
        </div>
      </div>
    </main>
  );
}
