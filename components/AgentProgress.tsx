import type { AgentStatus } from '@/lib/radarState';

const WORDS: Record<AgentStatus, string> = {
  waiting: 'Waiting',
  running: 'Working…',
  done: 'Done',
  failed: 'Stopped',
};

type Props = {
  statuses: { reader: AgentStatus; matcher: AgentStatus; localizer: AgentStatus };
  matching: string | null;
};

export function AgentProgress({ statuses, matching }: Props) {
  const agents = [
    { name: 'Book Reader', job: 'Tags the book from its pages', status: statuses.reader, note: null },
    {
      name: 'Market Matcher', job: 'Compares the book with sourced evidence', status: statuses.matcher,
      note: matching ? `Checking ${matching}…` : null,
    },
    { name: 'Localizer', job: 'Drafts the test kit', status: statuses.localizer, note: null },
  ];
  return (
    <section className="stack" aria-live="polite">
      <h2>Agents</h2>
      <ol className="agents">
        {agents.map((a) => (
          <li key={a.name} className={`agent agent-${a.status}`}>
            <span className="agent-dot" aria-hidden="true" />
            <span className="agent-name">
              {a.name}
              <span className="agent-state">{a.note ?? `${WORDS[a.status]}: ${a.job.toLowerCase()}`}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="muted">Plain code calculates each score, so the same inputs give the same result.</p>
    </section>
  );
}
