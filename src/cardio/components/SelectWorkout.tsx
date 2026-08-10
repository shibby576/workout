import { activityDate, duration, miles } from '../format.ts';
import type { StravaActivitySummary } from '../stravaTypes.ts';

const METERS_PER_MILE = 1609.344;

interface Props {
  activities: StravaActivitySummary[];
  loading: boolean;
  error: string | null;
  onSelect(activity: StravaActivitySummary): void;
  onRetry(): void;
}

export function SelectWorkout({ activities, loading, error, onSelect, onRetry }: Props) {
  return (
    <div className="card">
      <h2 className="card-title">Pick a workout</h2>

      {loading && <p className="muted">Loading your recent activities…</p>}

      {error && (
        <>
          <p className="muted">
            {error === 'not_connected'
              ? 'Your Strava connection expired — reconnect to continue.'
              : "Couldn't load activities."}
          </p>
          <button type="button" className="btn btn-secondary" onClick={onRetry}>
            Try again
          </button>
        </>
      )}

      {!loading && !error && activities.length === 0 && (
        <p className="muted">No recent cardio activities found in Strava.</p>
      )}

      {activities.map((a) => (
        <button key={a.id} type="button" className="row" onClick={() => onSelect(a)}>
          <span>
            <span className="row-name">{a.name}</span>
            <span className="row-meta" style={{ display: 'block' }}>
              {activityDate(a.start_date_local)} · {a.sport_type || a.type} ·{' '}
              {a.distance > 0 ? miles(a.distance / METERS_PER_MILE) : duration(a.moving_time)}
              {a.average_heartrate ? ` · ${Math.round(a.average_heartrate)} bpm` : ''}
            </span>
          </span>
          <span className="chev">›</span>
        </button>
      ))}
    </div>
  );
}
