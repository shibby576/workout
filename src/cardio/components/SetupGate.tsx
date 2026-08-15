import { useState } from 'react';
import { getStravaAuthorizeUrl } from '../../lib/strava.js';
import { formatPaceInput, parsePaceInput } from '../parsePace.js';
import type { AthleteProfile } from '../zones.js';

// One-time setup: connect Strava, then fill the anchors Strava can't give us.
// Zones and FTP arrive automatically with the profile:read_all scope; max HR
// and threshold pace are entered by hand.

interface Props {
  connected: boolean;
  profile: AthleteProfile;
  /** Highest max HR across recent Strava activities — seeds the field. */
  observedMaxHr: number | null;
  onSave(profile: AthleteProfile): void;
  redirectNote: string | null;
}

export function SetupGate({ connected, profile, observedMaxHr, onSave, redirectNote }: Props) {
  const [maxHr, setMaxHr] = useState(String(profile.maxHr ?? observedMaxHr ?? ''));
  const [thresholdPace, setThresholdPace] = useState(
    profile.thresholdPaceSecPerMi ? formatPaceInput(profile.thresholdPaceSecPerMi) : '',
  );
  const [runningFtp, setRunningFtp] = useState(profile.runningFtp ? String(profile.runningFtp) : '');
  const parsedPace = parsePaceInput(thresholdPace);

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
            {observedMaxHr
              ? `Pre-filled with ${observedMaxHr} bpm — the highest reading across your recent Strava activities. Raise it if you've seen higher in an all-out effort.`
              : "Your Strava zones weren't available, so zones are estimated from this. The highest number you've actually seen in a hard effort beats a formula."}
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
          placeholder="745"
          value={thresholdPace}
          onChange={(e) => setThresholdPace(e.target.value)}
        />
        {/* A phone keypad cannot type a colon, so "745" is accepted — and the
            parsed value is echoed back, because reading it wrongly silently
            skews every pace verdict afterwards. */}
        <div className={parsedPace ? 'hint hint-ok' : 'hint'} style={{ marginTop: 'var(--space-1)' }}>
          {thresholdPace.trim() === ''
            ? 'Optional. Type 745 for 7:45 — no colon needed.'
            : parsedPace
              ? `Reading this as ${formatPaceInput(parsedPace)} per mile.`
              : "Couldn't read that. Type 745 for 7:45, or 1030 for 10:30."}
        </div>
      </div>

      <div className="field">
        <label htmlFor="rftp">Running threshold power (optional)</label>
        <div className="hint">
          If you run with a power meter, the power you could hold for about an hour (Stryd calls this rFTPw).
          Setting it upgrades intensity judging from heart rate — which lags and drifts — to power. Separate
          from cycling FTP{profile.ftp ? ` (${profile.ftp} W from Strava)` : ''}, and a much higher number.
        </div>
        <input
          id="rftp"
          inputMode="numeric"
          placeholder="320"
          value={runningFtp}
          onChange={(e) => setRunningFtp(e.target.value)}
        />
      </div>

      <button
        type="button"
        className="btn"
        disabled={!canSave || (thresholdPace.trim() !== '' && !parsedPace)}
        onClick={() =>
          onSave({
            ...profile,
            maxHr: Number.isFinite(parsedHr) && parsedHr > 0 ? parsedHr : profile.maxHr,
            thresholdPaceSecPerMi: parsedPace,
            runningFtp: Number(runningFtp) > 0 ? Number(runningFtp) : null,
          })
        }
      >
        Continue
      </button>
    </div>
  );
}

