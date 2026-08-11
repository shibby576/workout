// SessionSummary — the contract between the structuring step (100% code) and
// the generation step (one model call). It is plain, serializable JSON:
//
//   • structuring EMITS it from Strava streams/laps/detail,
//   • generation CONSUMES it to write the coach's note,
//   • it is snapshotted as-is into eval fixtures.
//
// Everything here is computed and factual. The model reads it; it never writes
// it. `schemaVersion` is bumped when the shape changes so saved fixtures stay
// reproducible across model runs. Units are SI-canonical (meters, seconds, bpm,
// watts) with a few display-convenience fields (miles, sec/mile) derived.
//
// Design rationale (data source, HR-vs-power, intent→band, storage) lives in
// ./DESIGN.md.

export type SchemaVersion = '1';

// Ordered by intensity. `recovery` is the easiest (Z1 / very low Z2), `vo2max`
// the hardest. Intent is the only user input, stated after the workout is picked.
export type IntentType = 'recovery' | 'base' | 'threshold' | 'vo2max';

// A 5-zone model, reused for both HR and power zones.
export type HrZone = 1 | 2 | 3 | 4 | 5;

export interface SessionSummary {
  schemaVersion: SchemaVersion;
  intent: IntentType; // the single user input
  activity: ActivityMeta;

  // What data we actually had. Drives per-field graceful degradation and tells
  // the model which blocks it can trust — which is why most blocks are optional.
  availability: DataAvailability;

  duration: Duration;
  distance?: Distance; // absent: treadmill w/ no GPS, etc.
  pace?: PaceSummary; // needs distance/velocity
  heartRate?: HeartRateSummary; // absent: no HR strap
  power?: PowerSummary; // absent: no power stream (most runners)
  drift?: DriftSummary; // needs an output metric (power/pace) AND HR
  structure?: SessionStructure; // intervals/laps, when detectable

  // The headline "did the execution match the stated intent" computation.
  // Absent when neither HR nor power was recorded — there is nothing to band
  // against, and inventing a verdict would be worse than admitting the gap.
  intentBand?: IntentBandResult;

  // Was the SPEED right for the intent? Complements intentBand, which judges
  // effort. Absent without a threshold-pace anchor.
  paceTarget?: PaceTargetResult;

  // Deterministic, factual observations — the anti-hallucination lever. The
  // model turns these into language; it never recomputes them.
  signals: Signal[];
}

export interface ActivityMeta {
  id: string; // "strava-123456"
  source: 'strava';
  sportType: string; // Strava sport_type: 'Run' | 'Ride' | ...
  name: string;
  startedAt: string; // ISO 8601, local
}

export interface DataAvailability {
  heartRate: boolean;
  velocityOrGps: boolean; // pace/splits derivable
  power: boolean;
  powerSource: 'meter' | 'estimated' | 'none'; // from Strava device_watts
  cadence: boolean;
  altitude: boolean;
  laps: boolean; // device laps present
  streamResolution: 'high' | 'summary-only'; // got streams, or only summary fields?
  zonesSource: 'strava' | 'estimated-from-maxhr'; // basis for HR zone bounds
  ftpSource: 'strava' | 'entered' | 'none'; // basis for power zone bounds
}

export interface Duration {
  movingSec: number;
  elapsedSec: number;
}

export interface Distance {
  meters: number; // canonical
  miles: number; // display convenience
}

export interface PaceSummary {
  avgSpeedMps: number; // canonical (SI)
  avgPaceSecPerMi: number; // display convenience
  splits: Split[]; // per-mile; last split may be short
}

export interface Split {
  index: number; // 1-based
  distanceMeters: number;
  movingSec: number;
  paceSecPerMi: number;
  avgHr?: number;
  elevGainMeters?: number;
}

export interface HeartRateSummary {
  avg: number;
  max: number;
  zoneSeconds: Record<HrZone, number>; // time in each zone over moving time
  zoneBounds: Record<HrZone, { minBpm: number; maxBpm: number }>; // bounds actually used
}

export interface PowerSummary {
  avgWatts: number;
  normalizedWatts?: number; // NP — variability-weighted average (cycling standard)
  intensityFactor?: number; // NP / threshold
  // Zones need a threshold power for the sport. Absent when none is known —
  // the watts are still reported, they just can't be banded.
  zoneSeconds?: Record<HrZone, number>;
  zoneBounds?: Record<HrZone, { minWatts: number; maxWatts: number }>;
}

export interface DriftSummary {
  // Aerobic decoupling: output:HR ratio in the 2nd half vs the 1st half, as a %.
  // Positive = HR climbing relative to output (fatigue / heat / dehydration).
  decouplingPct: number;
  method: 'power:hr-halves' | 'pace:hr-halves'; // Pw:HR for bikes, pace:HR for runs
}

export interface SessionStructure {
  source: 'device-laps' | 'stream-detected';
  // Device laps are the athlete's own rep markers, so they are exact.
  // Stream-detected reps are inferred from the output trace and can miscount by
  // an effort at either end (a finishing kick reads much like a final rep), so
  // the note should not lean on the exact number.
  confidence: 'high' | 'low';
  workReps: number; // count of hard efforts detected
  reps?: RepSegment[]; // kept intentionally light for v1
  sustainability?: SustainabilitySummary; // present when there are >= 2 work reps
  // A hard effort at the very end of the session that was terrain rather than a
  // rep — typically a climb home. Excluded from workReps so the count matches
  // the session that was actually run, but reported so the number is explainable.
  hillFinish?: { gradePct: number; climbMeters: number; durationSec: number };
}

export interface RepSegment {
  index: number;
  startSec: number; // offset from activity start
  endSec: number;
  durationSec: number;
  avgHr?: number;
  avgWatts?: number;
  paceSecPerMi?: number;
  avgGradePct?: number;
  climbMeters?: number;
  kind: 'work' | 'recovery';
  // Did this rep reach the intent's target intensity? Judged on power/pace AND
  // HR together: output confirms the effort, HR confirms the physiological
  // response. Either can carry the judgement, which also absorbs HR lag (HR
  // takes 60-90s to climb into Z5, so short reps look easy by HR alone).
  reachedTargetBy?: ('power' | 'pace' | 'hr')[];
  hitTarget?: boolean;
}

// Rep-to-rep sustainability — the "went out too hard" signal for interval
// sessions. For vo2max this is the primary overcooking detector, since the
// collapsed 5-zone model can't distinguish VO2 intensity from sprinting.
export interface SustainabilitySummary {
  // Output decline from the first work rep to the last, as a %. Positive =
  // faded; near zero = held; negative = negative split across reps.
  fadePct: number;
  basis: 'power' | 'pace';
  repsHittingTarget: number;
  totalWorkReps: number;
}

export interface IntentBandResult {
  configVersion: string; // which intent→band mapping produced this
  // Which output metric the band was actually computed against, chosen by
  // availability/sport priority (power > pace for runs; power for bikes; HR last).
  primaryMetric: 'power' | 'pace' | 'hr';
  targetZones: HrZone[]; // the zones this intent implies
  // Interval sessions are judged on WORK time only. Counting the recovery jogs
  // would make every correctly-executed interval session read as "too easy" —
  // easy recoveries are the design, not a miss.
  scope: 'work-reps' | 'whole-session';
  // These four partition the judged time, so they always sum to it.
  inBandSec: number; // in the target zones
  tolerantSec: number; // in zones the intent tolerates (e.g. Z2 on a recovery day)
  belowBandSec: number;
  aboveBandSec: number;
  // Percentages of the WHOLE judged time, so they read as honest proportions.
  inBandPct: number; // strictly in the target zones
  // In-band plus tolerated. This is the headline for intents with tolerated
  // zones: a recovery run mostly in Z2 with a few minutes of drift is ~76%
  // acceptable, and reporting only the strict 44% would imply half the run was
  // wrong when it wasn't.
  acceptablePct: number;
  // Which direction the session actually missed, per the intent's fault rules
  // (see intentBands.ts). 'none' when it landed in band. Asymmetric on purpose:
  // an easy day run too hard and a threshold set run too easy are different
  // mistakes, and 'too hard' is a fault for every intent except vo2max.
  fault: 'none' | 'too-easy' | 'too-hard';
  // Low when banding rested on HR alone (or summary data), where lag and
  // day-to-day HR variation make the band read imprecise.
  confidence: 'high' | 'low';
}

// Target pace for the stated intent vs. what was actually run. Pace is in
// seconds per mile, so *lower is faster* — hence "fast"/"slow" bounds rather
// than min/max, which invert confusingly.
export interface PaceTargetResult {
  thresholdPaceSecPerMi: number; // the anchor this was derived from
  targetFastSecPerMi: number; // fast end of the target range
  targetSlowSecPerMi: number; // slow end of the target range
  actualSecPerMi: number;
  // Work reps for interval sessions (recoveries would drag the average down),
  // whole-session average otherwise.
  basis: 'work-reps' | 'session-average';
  verdict: 'in-range' | 'too-fast' | 'too-slow';
}

export interface Signal {
  // e.g. 'negative_split' | 'high_drift' | 'mostly_z2' | 'zone_mismatch'
  code: string;
  // Small, factual payload — no prose. The model turns these into language.
  detail?: Record<string, number | string | boolean>;
}
