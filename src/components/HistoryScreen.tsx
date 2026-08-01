import { useAppDispatch, useAppState } from '../state/AppState';
import { computeAdherence, computeStreak } from '../utils/adherence';
import { Tag } from './Tag';
import { EmptyState } from './EmptyState';
import { HistoryIcon } from './icons';

export function HistoryScreen() {
  const { weeks } = useAppState();
  const dispatch = useAppDispatch();
  const streak = computeStreak(weeks);
  const maxBar = 80;

  return (
    <div className="screen">
      <div className="header">
        <h1>History</h1>
        <div className="sub">{streak > 0 ? `${streak}-week streak` : 'No active streak'}</div>
      </div>

      <div className="app-scroll">
        {weeks.length === 0 ? (
          <EmptyState icon={<HistoryIcon color="var(--color-neutral-500)" />} title="No history yet" body="Once a week wraps up, its adherence will show up here." />
        ) : (
          <>
            <div className="card" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: maxBar + 30 }}>
              {weeks.map((w, i) => {
                const adh = computeAdherence(w);
                return (
                  <button
                    key={w.id}
                    type="button"
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                    }}
                    onClick={() => dispatch({ type: 'SELECT_WEEK', idx: i })}
                  >
                    <div style={{ fontSize: 10, color: 'var(--color-neutral-500)' }}>{adh.pct}%</div>
                    <div
                      style={{
                        width: 14,
                        maxWidth: '40%',
                        height: Math.max(14, maxBar * (adh.pct / 100)),
                        background: w.current ? 'var(--color-accent-300)' : 'var(--color-accent)',
                        borderRadius: 999,
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {weeks
              .slice()
              .reverse()
              .map((w, ri) => {
                const i = weeks.length - 1 - ri;
                const adh = computeAdherence(w);
                return (
                  <button
                    key={w.id}
                    type="button"
                    className="card"
                    style={{ cursor: 'pointer', width: '100%', textAlign: 'left', border: 'none' }}
                    onClick={() => dispatch({ type: 'SELECT_WEEK', idx: i })}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 14, color: 'var(--color-text)' }}>
                        {w.label}
                        {w.current ? ' · in progress' : ''}
                      </div>
                      <Tag text={`${adh.done}/${adh.total}`} tone={adh.pct === 100 ? 'accent' : 'muted'} />
                    </div>
                  </button>
                );
              })}
          </>
        )}
      </div>
    </div>
  );
}
