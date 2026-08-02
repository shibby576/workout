import { useEffect, useState } from 'react';
import type { Workout } from '../types';
import { fetchStravaActivities, getStravaAuthorizeUrl, isStravaConnected } from '../lib/strava';
import { formatWorkoutMetrics } from '../utils/format';

type PullState = 'idle' | 'loading' | 'loaded' | 'error';

export function ConnectStrava() {
  const [connected, setConnected] = useState(isStravaConnected());
  const [pullState, setPullState] = useState<PullState>('idle');
  const [activities, setActivities] = useState<Workout[]>([]);
  const [redirectNote, setRedirectNote] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('strava');
    if (!status) return;
    window.history.replaceState(null, '', window.location.pathname);
    if (status === 'connected') {
      setConnected(true);
      setRedirectNote('Connected.');
    } else if (status === 'denied') {
      setRedirectNote('Strava authorization was cancelled.');
    } else if (status === 'error') {
      setRedirectNote('Something went wrong connecting to Strava — try again.');
    }
  }, []);

  async function pull() {
    setPullState('loading');
    try {
      const workouts = await fetchStravaActivities();
      setActivities(workouts);
      setPullState('loaded');
    } catch {
      setPullState('error');
    }
  }

  if (!connected) {
    return (
      <div className="card">
        <div style={{ fontSize: 14, color: 'var(--color-text)', marginBottom: 4 }}>Connect Strava</div>
        <div style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginBottom: 12 }}>
          {redirectNote ?? "Pull in your logged workouts so they can be matched against this week's routine."}
        </div>
        <a href={getStravaAuthorizeUrl()} className="pill-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          Connect Strava
        </a>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 14, color: 'var(--color-text)' }}>Strava connected</div>
        <a href="/api/strava/disconnect" style={{ fontSize: 12, color: 'var(--color-neutral-500)' }}>
          Disconnect
        </a>
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginBottom: 12 }}>
        Matching pulled activities into routine slots is coming next — for now this just confirms the pull works.
      </div>

      <button type="button" className="pill-btn" style={{ width: '100%' }} onClick={pull} disabled={pullState === 'loading'}>
        {pullState === 'loading' ? 'Pulling…' : 'Pull latest activities'}
      </button>

      {pullState === 'error' && (
        <div style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginTop: 10 }}>Couldn't pull activities — try again.</div>
      )}

      {pullState === 'loaded' && (
        <div style={{ marginTop: 12 }}>
          {activities.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>No recent activities found.</div>
          ) : (
            activities.map((w, i) => (
              <div key={w.id} style={{ marginTop: i ? 8 : 0, paddingTop: i ? 8 : 0, borderTop: i ? '1px solid var(--color-divider)' : 'none' }}>
                <div style={{ fontSize: 13, color: 'var(--color-text)' }}>{w.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 2 }}>
                  {w.date} · {w.source}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 2 }}>{formatWorkoutMetrics(w)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
