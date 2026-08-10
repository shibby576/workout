import { useCallback, useEffect, useState } from 'react';
import { isStravaConnected } from '../lib/strava';
import { FeedbackCard } from './components/FeedbackCard.tsx';
import { IntentPicker } from './components/IntentPicker.tsx';
import { SelectWorkout } from './components/SelectWorkout.tsx';
import { SetupGate } from './components/SetupGate.tsx';
import { isProfileReady, loadProfile, saveProfile } from './profile.ts';
import type { IntentType, SessionSummary } from './sessionSummary.ts';
import { stravaSource } from './source.ts';
import { structureSession } from './structuring.ts';
import type { StravaActivitySummary } from './stravaTypes.ts';
import type { AthleteProfile } from './zones.ts';

type Step = 'setup' | 'select' | 'intent' | 'card';

export function App() {
  const [connected, setConnected] = useState(isStravaConnected());
  const [profile, setProfile] = useState<AthleteProfile>(loadProfile());
  const [setupDone, setSetupDone] = useState(() => isProfileReady(loadProfile()));
  const [redirectNote, setRedirectNote] = useState<string | null>(null);
  const [observedMaxHr, setObservedMaxHr] = useState<number | null>(null);

  const [activities, setActivities] = useState<StravaActivitySummary[]>([]);
  const [listState, setListState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [listError, setListError] = useState<string | null>(null);

  const [activity, setActivity] = useState<StravaActivitySummary | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);

  const step: Step = !connected || !setupDone ? 'setup' : summary || building ? 'card' : activity ? 'intent' : 'select';

  // Handle the OAuth redirect back from Strava.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('strava');
    if (!status) return;
    window.history.replaceState(null, '', window.location.pathname);
    if (status === 'connected') setConnected(true);
    else if (status === 'denied') setRedirectNote('Strava authorization was cancelled.');
    else if (status === 'error') setRedirectNote('Something went wrong connecting to Strava — try again.');
  }, []);

  // Zones and FTP come from Strava once connected; they beat manual entry.
  useEffect(() => {
    if (!connected) return;
    let cancelled = false;
    stravaSource
      .getProfile()
      .then((p) => {
        if (cancelled) return;
        setObservedMaxHr(p.observedMaxHr ?? null);
        setProfile((prev) => {
          const merged = { ...prev, zones: p.zones ?? prev.zones, ftp: p.ftp ?? prev.ftp };
          saveProfile(merged);
          return merged;
        });
      })
      .catch(() => {
        // Scope not granted — the setup gate falls back to manual max HR.
      });
    return () => {
      cancelled = true;
    };
  }, [connected]);

  const loadActivities = useCallback(() => {
    setListState('loading');
    setListError(null);
    stravaSource
      .listActivities()
      .then((list) => {
        setActivities(list);
        setListState('idle');
      })
      .catch((err: Error) => {
        setListError(err.message);
        setListState('error');
      });
  }, []);

  useEffect(() => {
    if (connected && setupDone && activities.length === 0 && listState === 'idle' && !listError) {
      loadActivities();
    }
  }, [connected, setupDone, activities.length, listState, listError, loadActivities]);

  function handleSaveProfile(next: AthleteProfile) {
    saveProfile(next);
    setProfile(next);
    setSetupDone(true);
  }

  async function handlePickIntent(intent: IntentType) {
    if (!activity) return;
    setBuilding(true);
    setCardError(null);
    try {
      const raw = await stravaSource.getSession(String(activity.id));
      setSummary(structureSession({ raw, intent, athlete: profile }));
    } catch {
      setCardError("Couldn't load that session from Strava.");
    } finally {
      setBuilding(false);
    }
  }

  function reset() {
    setActivity(null);
    setSummary(null);
    setCardError(null);
  }

  return (
    <div className="wrap">
      <h1 className="app-title">Cardio feedback</h1>
      <p className="app-sub">Pick a session, say what it was meant to be, see how it went.</p>

      {step !== 'setup' && step !== 'select' && (
        <button type="button" className="back" onClick={step === 'card' ? reset : () => setActivity(null)}>
          ‹ {step === 'card' ? 'Start over' : 'Back to workouts'}
        </button>
      )}

      {step === 'setup' && (
        <SetupGate
          connected={connected}
          profile={profile}
          observedMaxHr={observedMaxHr}
          onSave={handleSaveProfile}
          redirectNote={redirectNote}
        />
      )}

      {step === 'select' && (
        <SelectWorkout
          activities={activities}
          loading={listState === 'loading'}
          error={listError}
          onSelect={setActivity}
          onRetry={loadActivities}
        />
      )}

      {step === 'intent' && activity && <IntentPicker activity={activity} onPick={handlePickIntent} />}

      {step === 'card' && (
        <>
          {building && <div className="card">Reading the session…</div>}
          {cardError && <div className="card">{cardError}</div>}
          {summary && (
            <FeedbackCard
              summary={summary}
              note={null}
              noteLoading={false}
              noteError={null}
              onRegenerate={() => {
                /* wired up in the generation step */
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
