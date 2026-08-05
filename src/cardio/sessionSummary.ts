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
  intentBand: IntentBandResult;

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
  intensityFactor?: number; // NP / FTP
  zoneSeconds: Record<HrZone, number>; // time in each power zone over moving time
  zoneBounds: Record<HrZone, { minWatts: number; maxWatts: number }>;
}

export interface DriftSummary {
  // Aerobic decoupling: output:HR ratio in the 2nd half vs the 1st half, as a %.
  // Positive = HR climbing relative to output (fatigue / heat / dehydration).
  decouplingPct: number;
  method: 'power:hr-halves' | 'pace:hr-halves'; // Pw:HR for bikes, pace:HR for runs
}

export interface SessionStructure {
  source: 'device-laps' | 'stream-detected';
  workReps: number; // count of hard efforts detected
  reps?: RepSegment[]; // kept intentionally light for v1
}

export interface RepSegment {
  index: number;
  durationSec: number;
  avgHr?: number;
  paceSecPerMi?: number;
  kind: 'work' | 'recovery';
}

export interface IntentBandResult {
  configVersion: string; // which intent→band mapping produced this
  // Which output metric the band was actually computed against, chosen by
  // availability/sport priority (power > pace for runs; power for bikes; HR last).
  primaryMetric: 'power' | 'pace' | 'hr';
  targetZones: HrZone[]; // the zones this intent implies
  inBandSec: number;
  belowBandSec: number;
  aboveBandSec: number;
  inBandPct: number; // the headline number
}

export interface Signal {
  // e.g. 'negative_split' | 'high_drift' | 'mostly_z2' | 'zone_mismatch'
  code: string;
  // Small, factual payload — no prose. The model turns these into language.
  detail?: Record<string, number | string | boolean>;
}
