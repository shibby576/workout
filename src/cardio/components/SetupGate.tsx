import { useState } from 'react';
import { getStravaAuthorizeUrl } from '../../lib/strava';
import type { AthleteProfile } from '../zones.ts';

// One-time setup: connect Strava, then fill the anchors Strava can't give us.
// Zones and FTP arrive automatically with the profile:read_all scope; max HR
// and threshold pace are entered by hand.

interface Props {
  connected: boolean;
  profile: AthleteProfile;
  onSave(profile: AthleteProfile): void;
  redirectNote: string | null;
}

/** "7:30" or "450" -> seconds per mile. */
function parsePace(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const mmss = /^(\d+):([0-5]\d)$/.exec(trimmed);
  if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);
  const plain = Number(trimmed);
  return Number.isFinite(plain) && plain > 0 ? plain : null;
}

export function SetupGate({ connected, profile, onSave, redirectNote }: Props) {
  const [maxHr, setMaxHr] = useState(profile.maxHr ? String(profile.maxHr) : '');
  const [thresholdPace, setThresholdPace] = useState(
    profile.thresholdPaceSecPerMi ? formatPaceInput(profile.thresholdPaceSecPerMi) : '',
  );

  if (!connected) {
    return (
      <div className="card">
        <h2 className="card-title">Connect Strava</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {redirectNote ?? 'Pull in your cardio activities to get feedback on them.'}
        </p>
        <a className="btn" href={getStravaAuthorizeUrl()}>
          Connect Strava
        </a>
      </div>
    );
  }

  const hasStravaZones = Boolean(profile.zones?.heart_rate?.zones?.length);
  const parsedHr = Number(maxHr);
  const canSave = hasStravaZones || (Number.isFinite(parsedHr) && parsedHr > 100);

  return (
    <div className="card">
      <h2 className="card-title">A couple of numbers</h2>
      <p className="muted" style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>
        Set once, used to judge every session.
      </p>

      {hasStravaZones ? (
        <div className="field">
          <label>Heart rate zones</label>
          <div className="hint">Pulled from your Strava zones. Nothing to do here.</div>
        </div>
      ) : (
        <div className="field">
          <label htmlFor="maxhr">Max heart rate</label>
          <div className="hint">
            Your Strava zones weren't available, so zones are estimated from this. The highest number you've
            actually seen in a hard effort beats a formula.
          </div>
          <input
            id="maxhr"
            inputMode="numeric"
            placeholder="190"
            value={maxHr}
            onChange={(e) => setMaxHr(e.target.value)}
          />
        </div>
      )}

      <div className="field">
        <label htmlFor="tpace">Threshold pace (optional)</label>
        <div className="hint">
          Roughly the pace you could hold for an hour — near your 10K race pace. Used to tell you whether a
          session was too fast or too slow, not just too hard. Leave blank to skip pace targets.
        </div>
        <input
          id="tpace"
          inputMode="numeric"
          placeholder="7:30"
          value={thresholdPace}
          onChange={(e) => setThresholdPace(e.target.value)}
        />
      </div>

      {profile.ftp ? (
        <div className="field">
          <label>FTP</label>
          <div className="hint">{profile.ftp} W from Strava — power sessions will be judged on power.</div>
        </div>
      ) : null}

      <button
        type="button"
        className="btn"
        disabled={!canSave}
        onClick={() =>
          onSave({
            ...profile,
            maxHr: Number.isFinite(parsedHr) && parsedHr > 0 ? parsedHr : profile.maxHr,
            thresholdPaceSecPerMi: parsePace(thresholdPace),
          })
        }
      >
        Continue
      </button>
    </div>
  );
}

function formatPaceInput(secPerMi: number): string {
  const m = Math.floor(secPerMi / 60);
  const s = Math.round(secPerMi % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
