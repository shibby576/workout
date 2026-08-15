import { useCallback, useEffect, useState } from 'react';
import { isStravaConnected } from '../lib/strava.js';
import { coachErrorMessage, generateCoachNote } from './coach.js';
import { FeedbackCard } from './components/FeedbackCard.js';
import { IntentPicker } from './components/IntentPicker.js';
import { SelectWorkout } from './components/SelectWorkout.js';
import { SetupGate } from './components/SetupGate.js';
import { isProfileReady, loadProfile, saveProfile } from './profile.js';
import type { IntentType, SessionSummary } from './sessionSummary.js';
import { stravaSource } from './source.js';
import { structureSession } from './structuring.js';
import type { StravaActivitySummary } from './stravaTypes.js';
import type { AthleteProfile } from './zones.js';

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

  const [note, setNote] = useState<string | null>(null);
  const [noteModel, setNoteModel] = useState<string | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

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

  const writeNote = useCallback(async (forSummary: SessionSummary) => {
    setNoteLoading(true);
    setNoteError(null);
    try {
      const result = await generateCoachNote(forSummary);
      setNote(result.note);
      setNoteModel(result.model);
    } catch (err) {
      setNoteError(coachErrorMessage(err instanceof Error ? err.message : ''));
    } finally {
      setNoteLoading(false);
    }
  }, []);

  async function handlePickIntent(intent: IntentType) {
    if (!activity) return;
    setBuilding(true);
    setCardError(null);
    setNote(null);
    setNoteError(null);
    try {
      const raw = await stravaSource.getSession(String(activity.id));
      const built = structureSession({ raw, intent, athlete: profile });
      setSummary(built);
      // Structuring is instant; generation is the slow part, so the metrics
      // render immediately and the note fills in behind it.
      void writeNote(built);
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
    setNote(null);
    setNoteError(null);
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
              note={note}
              noteModel={noteModel}
              noteLoading={noteLoading}
              noteError={noteError}
              onRegenerate={() => void writeNote(summary)}
            />
          )}
        </>
      )}
    </div>
  );
}
