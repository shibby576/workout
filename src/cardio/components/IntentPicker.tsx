import { INTENT_BLURBS, INTENT_LABELS, activityDate } from '../format.js';
import type { IntentType } from '../sessionSummary.js';
import type { StravaActivitySummary } from '../stravaTypes.js';

const INTENTS: IntentType[] = ['recovery', 'base', 'threshold', 'vo2max'];

interface Props {
  activity: StravaActivitySummary;
  onPick(intent: IntentType): void;
}

export function IntentPicker({ activity, onPick }: Props) {
  return (
    <div className="card">
      <h2 className="card-title">What was this meant to be?</h2>
      <p className="muted" style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>
        {activity.name} · {activityDate(activity.start_date_local)}
      </p>

      {INTENTS.map((intent) => (
        <button key={intent} type="button" className="intent" onClick={() => onPick(intent)}>
          <div className="intent-name">{INTENT_LABELS[intent]}</div>
          <div className="intent-blurb">{INTENT_BLURBS[intent]}</div>
        </button>
      ))}
    </div>
  );
}
