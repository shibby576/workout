import { useAppDispatch, useAppState, itemFor } from '../state/AppState';
import { computeAdherence } from '../utils/adherence';
import { formatWorkoutMetrics } from '../utils/format';
import { MatchCard } from './MatchCard';
import { ProgressRing } from './ProgressRing';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

export function WeekScreen() {
  const { weeks, currentWeekIdx, routineItems } = useAppState();
  const dispatch = useAppDispatch();
  const idx = currentWeekIdx;
  const week = weeks[idx];
  const adh = computeAdherence(week);
  const remaining = week.matches.filter((m) => m.status === 'open').map((m) => itemFor(routineItems, m.routineItemId).label);

  return (
    <div className="screen">
      <div className="header">
        <h1>This Week</h1>

        {week.current && (
          <div
            style={{
              marginTop: 10,
              background: 'var(--color-surface)',
              borderRadius: 16,
              padding: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <ProgressBadge done={adh.done} total={adh.total} pct={adh.pct} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Remaining leads for an in-progress week: a % of a week
                  that isn't over yet reads as "behind" even mid-week
                  (e.g. 2 of 6 done on Tuesday shows 33%), so what's left
                  to do is the more honest headline than a percentage. */}
              <div style={{ fontSize: 15, color: 'var(--color-text)', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                {remaining.length ? `${remaining.length} remaining` : 'All done for this week'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginTop: 3 }}>
                {remaining.length ? remaining.join(', ') : `${adh.done} of ${adh.total} logged`}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <button
            type="button"
            className="icon-chip"
            disabled={idx <= 0}
            onClick={() => dispatch({ type: 'STEP_WEEK', delta: -1 })}
            aria-label="Previous week"
          >
            <ChevronLeftIcon />
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: 'var(--color-text)' }}>
              {week.label}
              {week.current ? ' (in progress)' : ''}
            </div>
            <div className="sub">
              {adh.done} of {adh.total} done · {adh.pct}%
            </div>
          </div>
          <button
            type="button"
            className="icon-chip"
            disabled={idx >= weeks.length - 1}
            onClick={() => dispatch({ type: 'STEP_WEEK', delta: 1 })}
            aria-label="Next week"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className="app-scroll">
        {week.matches.map((m) => (
          <MatchCard key={m.id} match={m} item={itemFor(routineItems, m.routineItemId)} />
        ))}

        {week.unmatched.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-neutral-500)', marginBottom: 8 }}>
              Logged, not part of routine
            </div>
            {week.unmatched.map((u, i) => (
              <div key={u.id} className="card" style={{ opacity: 0.9, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--color-text)' }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginTop: 2 }}>
                    {u.date} · {u.source}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-neutral-500)', marginTop: 4 }}>{formatWorkoutMetrics(u)}</div>
                </div>
                <button
                  type="button"
                  style={{
                    flexShrink: 0,
                    padding: '6px 10px',
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid var(--color-accent)',
                    background: 'transparent',
                    color: 'var(--color-accent)',
                    cursor: 'pointer',
                  }}
                  onClick={() => dispatch({ type: 'OPEN_ATTACH', unmatchedIdx: i })}
                >
                  Attach to slot
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBadge({ done, total, pct }: { done: number; total: number; pct: number }) {
  const size = 64;
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      <ProgressRing pct={pct} size={size} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontFamily: 'var(--font-heading)',
          fontWeight: 600,
          color: 'var(--color-text)',
        }}
      >
        {done}/{total}
      </div>
    </div>
  );
}
