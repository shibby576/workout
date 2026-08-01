import { useAppDispatch } from '../state/AppState';
import type { RoutineItem, WorkoutMatch } from '../types';
import { CATEGORY_LABEL, SUBTYPE_LABEL } from '../constants';
import { formatWorkoutMetrics } from '../utils/format';
import { Tag } from './Tag';

export function MatchCard({ match, item }: { match: WorkoutMatch; item: RoutineItem }) {
  const dispatch = useAppDispatch();
  const isOpen = match.status === 'open';
  const needsReview = match.needsTag;
  const subtypeLabel =
    item.category === 'cardio'
      ? SUBTYPE_LABEL[(match.tag as keyof typeof SUBTYPE_LABEL) || item.subtype!]
      : match.tag === 'cross-train'
        ? 'Cross-train'
        : item.label;

  return (
    <div
      className="card"
      style={{
        opacity: isOpen ? 0.6 : 1,
        border: needsReview ? '1px solid var(--color-accent)' : '1px solid transparent',
        cursor: needsReview ? 'pointer' : 'default',
      }}
      onClick={needsReview ? () => dispatch({ type: 'OPEN_REVIEW', matchId: match.id }) : undefined}
      role={needsReview ? 'button' : undefined}
      tabIndex={needsReview ? 0 : undefined}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag text={CATEGORY_LABEL[item.category]} tone="muted" />
          <span style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>{subtypeLabel}</span>
        </div>
        {needsReview ? (
          <Tag text="Needs tag" tone="accent" />
        ) : isOpen ? (
          <Tag text="Remaining" tone="muted" />
        ) : (
          <Tag text="Done" tone="accent" />
        )}
      </div>

      {isOpen ? (
        <div style={{ fontSize: 13, color: 'var(--color-neutral-600)', marginTop: 8 }}>Not logged yet</div>
      ) : (
        <div style={{ marginTop: 8 }}>
          {match.workouts.map((w, i) => (
            <div
              key={w.id}
              style={{
                marginTop: i ? 8 : 0,
                paddingTop: i ? 8 : 0,
                borderTop: i ? '1px solid var(--color-divider)' : 'none',
              }}
            >
              <div style={{ fontSize: 14, color: 'var(--color-text)' }}>{w.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginTop: 2 }}>
                {w.date} · {w.source}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-neutral-500)', marginTop: 4 }}>{formatWorkoutMetrics(w)}</div>
            </div>
          ))}
          {match.workouts.length > 1 && (
            <div style={{ fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 8 }}>
              Combined — logged as separate activities, counted as one session
            </div>
          )}
        </div>
      )}
    </div>
  );
}
