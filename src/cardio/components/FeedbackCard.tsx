import { INTENT_LABELS, duration, miles, pace, paceRange, shortDuration } from '../format.js';
import { NoteFeedbackControls } from './NoteFeedback.js';
import type { HrZone, SessionSummary } from '../sessionSummary.js';
import { ZONES } from '../zones.js';

// The feedback card. Every number is framed against the stated intent — the
// point isn't "here is your data", it's "here is how this session read against
// what you meant it to be".

interface Props {
  summary: SessionSummary;
  note: string | null;
  noteModel: string | null;
  noteLoading: boolean;
  noteError: string | null;
  onRegenerate(): void;
}

const FAULT_HEADLINE: Record<'too-easy' | 'too-hard', string> = {
  'too-easy': 'Easier than the intent called for',
  'too-hard': 'Harder than the intent called for',
};

const METRIC_LABEL: Record<'power' | 'pace' | 'hr', string> = {
  power: 'power',
  pace: 'pace',
  hr: 'heart rate',
};

export function FeedbackCard({ summary, note, noteModel, noteLoading, noteError, onRegenerate }: Props) {
  const { intentBand, paceTarget, heartRate, power, drift, structure } = summary;
  const intentLabel = INTENT_LABELS[summary.intent];
  const onTarget = intentBand?.fault === 'none';

  // Power zones when we banded on power, else HR zones.
  const zoneSeconds =
    intentBand?.primaryMetric === 'power' ? power?.zoneSeconds : heartRate?.zoneSeconds;
  const targetZones = new Set<HrZone>(intentBand?.targetZones ?? []);
  const zoneTotal = zoneSeconds ? ZONES.reduce((a, z) => a + zoneSeconds[z], 0) : 0;

  return (
    <>
      <div className={`verdict ${onTarget ? 'verdict-on' : 'verdict-off'}`}>
        <div className="verdict-label">Intended: {intentLabel}</div>
        <div className="verdict-head">
          {!intentBand
            ? 'No heart rate or power recorded'
            : onTarget
              ? `On target — ${headlinePct(intentBand)}% in the ${intentLabel.toLowerCase()} band`
              : FAULT_HEADLINE[intentBand.fault as 'too-easy' | 'too-hard']}
        </div>
        <div className="verdict-sub">
          {!intentBand
            ? "Without HR or power there's no way to judge intensity — pace and splits below still apply."
            : bandBreakdown(intentBand, intentLabel)}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Session</h3>
        <div className="stats">
          <Stat label="Duration" value={duration(summary.duration.movingSec)} />
          <Stat label="Distance" value={summary.distance ? miles(summary.distance.miles) : '—'} />
          <Stat label="Avg pace" value={summary.pace ? `${pace(summary.pace.avgPaceSecPerMi)}/mi` : '—'} />
          {heartRate && <Stat label="Avg HR" value={`${heartRate.avg} bpm`} note={`max ${heartRate.max}`} />}
          {power && (
            <Stat
              label="Avg power"
              value={`${power.avgWatts} W`}
              note={power.normalizedWatts ? `NP ${power.normalizedWatts}` : undefined}
            />
          )}
        </div>
      </div>

      {paceTarget && (
        <div className="card">
          <div className="note-head">
            <h3 className="card-title" style={{ margin: 0 }}>
              Pace vs. target
            </h3>
            <span className={`pill ${paceTarget.verdict === 'in-range' ? '' : 'pill-warn'}`}>
              {paceTarget.verdict === 'in-range'
                ? 'In range'
                : paceTarget.verdict === 'too-fast'
                  ? 'Too fast'
                  : 'Too slow'}
            </span>
          </div>
          <div className="stats">
            <Stat
              label={paceTarget.basis === 'work-reps' ? 'Work reps' : 'Actual'}
              value={`${pace(paceTarget.actualSecPerMi)}/mi`}
            />
            <Stat
              label={`${intentLabel} target`}
              value={paceRange(paceTarget.targetFastSecPerMi, paceTarget.targetSlowSecPerMi)}
            />
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            {paceTargetCopy(summary.intent, paceTarget.verdict, intentLabel)} Derived from a threshold pace of{' '}
            {pace(paceTarget.thresholdPaceSecPerMi)}/mi.
          </p>
        </div>
      )}

      {zoneSeconds && zoneTotal > 0 && (
        <div className="card">
          <h3 className="card-title">
            Time in zone <span className="muted">({METRIC_LABEL[intentBand!.primaryMetric]})</span>
          </h3>
          {ZONES.map((z) => (
            <div className="zone" key={z}>
              <span className="zone-num">Z{z}</span>
              <span className="zone-track">
                <span
                  className={`zone-fill${targetZones.has(z) ? ' in-band' : ''}`}
                  style={{ width: `${Math.round((zoneSeconds[z] / zoneTotal) * 100)}%` }}
                />
              </span>
              <span className="zone-time">{zoneSeconds[z] > 0 ? shortDuration(zoneSeconds[z]) : '—'}</span>
            </div>
          ))}
          <p className="muted" style={{ marginTop: 'var(--space-3)', marginBottom: 0 }}>
            Green marks the band this session was aiming for. Bars cover the whole session
            {intentBand?.scope === 'work-reps' && ', while the verdict judges the work reps only — recovery jogs are meant to be easy'}
            .
            {intentBand?.confidence === 'low' &&
              ' Judged on heart rate alone, which lags the effort and drifts with heat and fatigue — read it as directional.'}
          </p>
        </div>
      )}

      {drift && (
        <div className="card">
          <h3 className="card-title">Drift</h3>
          <div className="stats">
            <Stat label="Decoupling" value={`${drift.decouplingPct > 0 ? '+' : ''}${drift.decouplingPct}%`} />
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>
            {drift.decouplingPct >= 5
              ? 'Heart rate climbed relative to output through the session — the usual signs are fatigue, heat, or dehydration.'
              : drift.decouplingPct <= -5
                ? 'Output rose relative to heart rate — a strong finish.'
                : 'Output and heart rate stayed coupled — a well-controlled effort.'}
          </p>
        </div>
      )}

      {structure && (
        <div className="card">
          <h3 className="card-title">Structure</h3>
          <div className="stats">
            <Stat label="Work reps" value={String(structure.workReps)} />
            {structure.sustainability && (
              <>
                <Stat
                  label="Hit target"
                  value={`${structure.sustainability.repsHittingTarget}/${structure.sustainability.totalWorkReps}`}
                />
                <Stat
                  label="Fade"
                  value={`${structure.sustainability.fadePct > 0 ? '+' : ''}${structure.sustainability.fadePct}%`}
                  note={`by ${structure.sustainability.basis}`}
                />
              </>
            )}
          </div>
          {structure.sustainability && structure.sustainability.fadePct >= 5 && (
            <p className="muted" style={{ marginBottom: 0 }}>
              Efforts dropped off across the set — usually a sign the first reps went out too hard to repeat.
            </p>
          )}
        </div>
      )}

      <div className="card">
        <div className="note-head">
          <h3 className="card-title" style={{ margin: 0 }}>
            Coach's note
          </h3>
          <button type="button" className="btn-link" onClick={onRegenerate} disabled={noteLoading}>
            {noteLoading ? 'Writing…' : 'Regenerate'}
          </button>
        </div>
        {noteError ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            {noteError}
          </p>
        ) : noteLoading ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            Reading the session…
          </p>
        ) : note ? (
          <>
            <p className="note" style={{ margin: 0 }}>
              {note}
            </p>
            <NoteFeedbackControls summary={summary} note={note} model={noteModel ?? 'unknown'} />
          </>
        ) : (
          <p className="muted" style={{ marginBottom: 0 }}>
            Not wired up yet — the generation step comes next. Everything above is computed, not generated.
          </p>
        )}
      </div>
    </>
  );
}

/** Where the intent tolerates easier zones, "acceptable" is the honest headline:
 *  a recovery run mostly in Z2 with a few minutes of drift is ~76% fine, and
 *  leading with the strict 44% would imply half of it was wrong. */
function headlinePct(band: NonNullable<SessionSummary['intentBand']>): number {
  return band.tolerantSec > 0 ? band.acceptablePct : band.inBandPct;
}

/** Proportions of the whole session, plus how much drifted and in which
 *  direction — so the numbers add up to what the athlete actually did. */
function bandBreakdown(band: NonNullable<SessionSummary['intentBand']>, label: string): string {
  const judgedOn = `judged on ${METRIC_LABEL[band.primaryMetric]}`;
  const scope = band.scope === 'work-reps' ? ' across the work reps' : '';

  const offSec = band.fault === 'too-hard' ? band.aboveBandSec : band.belowBandSec;
  const direction = band.fault === 'too-hard' ? 'above' : 'below';

  if (band.tolerantSec > 0) {
    const base = `${band.acceptablePct}% at ${label.toLowerCase()} effort or easier${scope}`;
    return band.fault === 'none'
      ? `${base}, ${judgedOn}.`
      : `${base}, but ${duration(offSec)} drifted ${direction} it — ${judgedOn}.`;
  }

  const zones = `zone${band.targetZones.length > 1 ? 's' : ''} ${band.targetZones.join('–')}`;
  const base = `${band.inBandPct}% of time in ${zones}${scope}`;
  return band.fault === 'none'
    ? `${base}, ${judgedOn}.`
    : `${base}, with ${duration(offSec)} ${direction} the band — ${judgedOn}.`;
}

/** Why being off-pace matters depends on the intent: running an easy day hard
 *  costs you recovery, while over-running a hard session costs you the reps. */
function paceTargetCopy(intent: SessionSummary['intent'], verdict: string, label: string): string {
  if (verdict === 'in-range') return 'Speed matched the session type.';

  const easyIntent = intent === 'recovery' || intent === 'base';
  if (verdict === 'too-fast') {
    return easyIntent
      ? `Ran quicker than ${label.toLowerCase()} pace — easy days drifting fast is the most common way to blunt a training week.`
      : `Ran quicker than ${label.toLowerCase()} pace — starting above target usually costs you the later reps.`;
  }
  return easyIntent
    ? `Ran slower than ${label.toLowerCase()} pace — fine if this was deliberate recovery.`
    : `Ran slower than ${label.toLowerCase()} pace called for, so the session may not have hit its intended stimulus.`;
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  );
}
