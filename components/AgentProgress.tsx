import type { AgentStatus } from '@/lib/radarState';

type Props = {
  statuses: { reader: AgentStatus; matcher: AgentStatus; localizer: AgentStatus };
  matching: string | null;
};

// One line instead of a list: which agent is working now, and how far along the run is.
export function AgentProgress({ statuses, matching }: Props) {
  const agents = [
    { name: 'Book Reader', status: statuses.reader, note: 'reading the book' },
    { name: 'Market Matcher', status: statuses.matcher, note: matching ? `checking ${matching}` : 'comparing with evidence' },
    { name: 'Localizer', status: statuses.localizer, note: 'drafting the test kit' },
  ];
  const active = agents.find((a) => a.status === 'running') ?? agents.find((a) => a.status === 'failed');
  if (!active) return null;
  const done = agents.filter((a) => a.status === 'done').length;
  return (
    <p className={`progress progress-${active.status}`} aria-live="polite">
      <span className="agent-dot" aria-hidden="true" />
      {active.status === 'failed' ? `${active.name} stopped` : `${active.name}: ${active.note}…`}
      <span className="muted"> {done}/3</span>
    </p>
  );
}
