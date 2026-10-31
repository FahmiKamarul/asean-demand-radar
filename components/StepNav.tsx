export type Step = 1 | 2 | 3 | 4;

const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: 'Book' },
  { step: 2, label: 'Countries' },
  { step: 3, label: 'Test kit' },
  { step: 4, label: 'Share' },
];

type Props = { current: Step; reachable: (step: Step) => boolean; onGo: (step: Step) => void };

export function StepNav({ current, reachable, onGo }: Props) {
  return (
    <nav className="steps" aria-label="Steps">
      {STEPS.map(({ step, label }) => (
        <button
          key={step}
          type="button"
          className={`step${step === current ? ' step-current' : ''}`}
          aria-current={step === current ? 'step' : undefined}
          disabled={!reachable(step)}
          onClick={() => onGo(step)}
        >
          <span className="step-num">{step}</span>
          {label}
        </button>
      ))}
    </nav>
  );
}
