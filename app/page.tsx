'use client';

import { useEffect, useState } from 'react';
import { AgentProgress } from '@/components/AgentProgress';
import { BookForm } from '@/components/BookForm';
import { EvidenceForm } from '@/components/EvidenceForm';
import { EvidencePanel } from '@/components/EvidencePanel';
import { Heatmap } from '@/components/Heatmap';
import { SharePanel } from '@/components/SharePanel';
import { StepNav, type Step } from '@/components/StepNav';
import { TestKitPanel } from '@/components/TestKitPanel';
import { UploadPanel } from '@/components/UploadPanel';
import { COUNTRY_NAMES } from '@/lib/countryNames';
import { useRadarContext } from '@/lib/useRadar';

export default function Home() {
  const radar = useRadarContext();
  const { replay } = radar;
  const [step, setStep] = useState<Step>(1);
  const [bookInput, setBookInput] = useState<'pages' | 'typed'>('pages');

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('replay')) void replay();
  }, [replay]);

  // Move forward on their own when an agent finishes, so the seller only taps to go back.
  useEffect(() => {
    if (radar.statuses.matcher === 'done' && radar.statuses.localizer === 'waiting') setStep(2);
  }, [radar.statuses.matcher, radar.statuses.localizer]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);
  useEffect(() => {
    if (radar.kit) setStep(radar.replayedOn ? 2 : 3);
  }, [radar.kit, radar.kitVersion, radar.replayedOn]);

  const book = radar.results.find((r) => r.tags.title === radar.selected?.title) ?? radar.results.at(-1);
  const fit = book?.fits.find((f) => f.country === radar.selected?.country);
  const busy = [radar.statuses.reader, radar.statuses.matcher, radar.statuses.localizer].includes('running');
  const reachable = (s: Step) => s === 1 || (s === 2 && Boolean(book)) || (s >= 3 && Boolean(radar.kit));

  return (
    <main className="page">
      {radar.replayedOn && (
        <p className="notice notice-warn" role="status">
          {radar.replayIsDummy
            ? 'Dummy data for rehearsal. The market evidence, sources, scores and test kit are made up.'
            : `Replaying a saved result from ${radar.replayedOn}`}
        </p>
      )}

      <StepNav current={step} reachable={reachable} onGo={setStep} />
      <AgentProgress statuses={radar.statuses} matching={radar.matching} />
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

      {step === 1 && (
        <section className="stack">
          <div>
            <h1>Which country should you test your book in?</h1>
            <p className="muted">Add your book. We compare it with sourced market evidence for Indonesia, the Philippines and Thailand.</p>
          </div>
          <div className="segmented" role="tablist" aria-label="How to add your book">
            <button type="button" role="tab" aria-selected={bookInput === 'pages'} onClick={() => setBookInput('pages')}>Upload pages</button>
            <button type="button" role="tab" aria-selected={bookInput === 'typed'} onClick={() => setBookInput('typed')}>Describe it</button>
          </div>
          {bookInput === 'pages'
            ? <UploadPanel busy={busy} onAnalyze={radar.analyze} />
            : <BookForm busy={busy} onSubmit={radar.analyze} />}
        </section>
      )}

      {step === 2 && book && (
        <section className="stack">
          {radar.results.length > 1 && (
            <div className="chips" role="tablist" aria-label="Books">
              {radar.results.map((r) => {
                const best = [...r.fits].sort((a, b) => (b.score ?? -1) - (a.score ?? -1))[0];
                return (
                  <button
                    key={r.tags.title}
                    type="button"
                    role="tab"
                    aria-selected={r === book}
                    onClick={() => best && radar.select(r.tags.title, best.country)}
                  >
                    {r.tags.title}
                  </button>
                );
              })}
            </div>
          )}
          <div>
            <h2>{book.tags.title}</h2>
            <p className="muted">{[book.tags.cuisine, `${book.tags.spiceLevel} spice`, book.tags.portion, `${book.tags.ingredientCost} cost`].join(' · ')}</p>
          </div>
          <p className="muted">Demand signal out of 100 from the saved evidence. Tap a country for the reasons and sources.</p>
          <Heatmap
            result={book}
            selected={radar.selected?.title === book.tags.title ? radar.selected.country : null}
            onSelect={(c) => {
              if (radar.selected?.title !== book.tags.title || radar.selected.country !== c) radar.select(book.tags.title, c);
            }}
            detail={fit && (
              <EvidencePanel
                fit={fit}
                countryName={COUNTRY_NAMES[fit.country]}
                kitBusy={radar.statuses.localizer === 'running'}
                kitReady={radar.kit?.country === fit.country}
                onCreateKit={() => {
                  if (radar.kit?.country === fit.country) setStep(3);
                  else void radar.createKit(book.tags, fit.country, fit.suggestedAngle);
                }}
              />
            )}
          />
          <details className="card">
            <summary>Add market evidence</summary>
            <EvidenceForm />
          </details>
        </section>
      )}

      {step === 3 && radar.kit && (
        <>
          <TestKitPanel key={radar.kitVersion} kit={radar.kit} countryName={COUNTRY_NAMES[radar.kit.country]} />
          <button type="button" className="btn btn-block" onClick={() => setStep(4)}>Next: review and share</button>
        </>
      )}

      {step === 4 && radar.kit && (
        <SharePanel key={radar.kitVersion} kit={radar.kit} countryName={COUNTRY_NAMES[radar.kit.country]} />
      )}
    </main>
  );
}
