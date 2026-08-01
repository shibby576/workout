import { useAppDispatch, useAppState, itemFor } from '../state/AppState';
import type { MatchTag } from '../types';
import { SUBTYPE_LABEL } from '../constants';
import { formatWorkoutMetrics } from '../utils/format';

const CARDIO_OPTIONS = Object.keys(SUBTYPE_LABEL) as MatchTag[];
const LIFT_OR_CROSS_OPTIONS: MatchTag[] = ['lift', 'cross-train'];
const OPTION_LABEL: Record<MatchTag, string> = { ...SUBTYPE_LABEL, lift: 'Lift', 'cross-train': 'Cross-train' };

export function ReviewSheet() {
  const { weeks, currentWeekIdx, reviewId, reviewTag, routineItems } = useAppState();
  const dispatch = useAppDispatch();
  if (!reviewId) return null;

  const week = weeks[currentWeekIdx];
  const match = week.matches.find((m) => m.id === reviewId);
  if (!match) return null;
  const item = itemFor(routineItems, match.routineItemId);
  const isCardio = item.category === 'cardio';
  const options = isCardio ? CARDIO_OPTIONS : LIFT_OR_CROSS_OPTIONS;

  return (
    <div className="sheet-backdrop" onClick={() => dispatch({ type: 'CLOSE_REVIEW' })}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {match.workouts.map((w, i) => (
          <div key={w.id} style={{ marginBottom: i === match.workouts.length - 1 ? 0 : 10 }}>
            <div className="sheet-title" style={{ marginBottom: 2 }}>
              {w.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginBottom: 8 }}>
              {w.date} · {w.source}
            </div>
            <div className="sheet-metrics" style={{ marginBottom: i === match.workouts.length - 1 ? 16 : 0 }}>
              {formatWorkoutMetrics(w)}
            </div>
          </div>
        ))}

        <div style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginBottom: 8 }}>
          {isCardio ? 'What kind of run was this?' : 'Was this a lift or cross-training?'}
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {options.map((o) => (
            <button
              key={o}
              type="button"
              className={`seg ${reviewTag === o ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_REVIEW_TAG', tag: o })}
            >
              {OPTION_LABEL[o]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="pill-btn-outline" style={{ flex: 1 }} onClick={() => dispatch({ type: 'CLOSE_REVIEW' })}>
            Later
          </button>
          <button
            type="button"
            className="pill-btn"
            style={{ flex: 1 }}
            disabled={!reviewTag}
            onClick={() => dispatch({ type: 'CONFIRM_REVIEW' })}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
