import { useAppDispatch, useAppState, itemFor } from '../state/AppState';
import { CATEGORY_LABEL } from '../constants';
import { formatWorkoutMetrics } from '../utils/format';
import { Tag } from './Tag';

// Cross-train and lift slots are the most likely target for a manually
// attached activity (per the split-session scenario from the design
// chat — a cross-train session Strava/Hevy logs as separate run + lift
// activities), so they sort first. Every slot still stays selectable —
// filtering some out could hide the exact slot a genuinely cross-category
// combination needs.
const CATEGORY_PRIORITY: Record<string, number> = { 'cross-train': 0, lift: 1, cardio: 2 };

export function AttachSheet() {
  const { weeks, currentWeekIdx, attachIdx, routineItems } = useAppState();
  const dispatch = useAppDispatch();
  if (attachIdx == null) return null;

  const week = weeks[currentWeekIdx];
  const workout = week.unmatched[attachIdx];
  if (!workout) return null;

  const candidates = week.matches
    .map((m) => ({ match: m, item: itemFor(routineItems, m.routineItemId) }))
    .sort((a, b) => CATEGORY_PRIORITY[a.item.category] - CATEGORY_PRIORITY[b.item.category]);

  return (
    <div className="sheet-backdrop" onClick={() => dispatch({ type: 'CLOSE_ATTACH' })}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title">Attach {workout.name}</div>
        <div className="sheet-sub">{formatWorkoutMetrics(workout)}</div>
        <div style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginBottom: 14 }}>
          Same-day session split across two logs? Combine it into a routine slot — you'll confirm what it counts as next.
        </div>

        {candidates.map(({ match, item }) => (
          <button
            key={match.id}
            type="button"
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 12px',
              marginBottom: 8,
              borderRadius: 10,
              border: '1px solid var(--color-divider)',
              background: 'transparent',
              color: 'var(--color-text)',
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}
            onClick={() => dispatch({ type: 'ATTACH_TO_SLOT', matchId: match.id })}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag text={CATEGORY_LABEL[item.category]} tone="muted" />
              {item.label}
            </span>
            <span style={{ color: 'var(--color-neutral-500)', fontSize: 11 }}>{match.workouts.length ? 'add to logged' : 'not logged yet'}</span>
          </button>
        ))}

        <button type="button" className="pill-btn-outline" style={{ width: '100%', marginTop: 4 }} onClick={() => dispatch({ type: 'CLOSE_ATTACH' })}>
          Cancel
        </button>
      </div>
    </div>
  );
}
