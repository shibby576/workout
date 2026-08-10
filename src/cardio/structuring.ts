// The structuring step: RawSession -> SessionSummary. 100% deterministic code,
// no LLM (see DESIGN.md). Pure and isomorphic on purpose — the same functions
// run in the browser for the live card and in the Node eval harness over saved
// fixtures, so evals score exactly the code the app runs.
//
// Everything degrades per-field: a run with no HR strap still yields pace,
// splits and signals, and `availability` tells the model what was missing.

import {
  INTENT_BANDS,
  INTENT_BAND_CONFIG_VERSION,
  PACE_TARGETS,
} from './intentBands.ts';
import type {
  DataAvailability,
  DriftSummary,
  HeartRateSummary,
  HrZone,
  IntentBandResult,
  IntentType,
  PaceSummary,
  PaceTargetResult,
  PowerSummary,
  RepSegment,
  SessionStructure,
  SessionSummary,
  Signal,
  Split,
  SustainabilitySummary,
} from './sessionSummary';
import type { RawSession, StravaLap, StravaSplit, StravaStreamSet } from './stravaTypes';
import {
  ZONES,
  resolveHrZones,
  resolvePowerZones,
  thresholdPowerFor,
  zoneOf,
  type AthleteProfile,
  type ResolvedHrZones,
  type ResolvedPowerZones,
} from './zones.ts';

const METERS_PER_MILE = 1609.344;

export interface StructuringInput {
  raw: RawSession;
  intent: IntentType;
  athlete: AthleteProfile;
}

// ---------------------------------------------------------------------------
// Stream helpers
// ---------------------------------------------------------------------------

interface Sample {
  t: number; // seconds from start
  dt: number; // seconds this sample represents
  moving: boolean;
}

/** Builds the per-sample time base. Each sample carries the duration since the
 *  previous one, so zone time is accumulated correctly even when streams aren't
 *  a clean 1Hz (Strava down-samples long activities). */
function buildSamples(streams: StravaStreamSet): Sample[] {
  const time = streams.time?.data;
  if (!time || time.length === 0) return [];
  const moving = streams.moving?.data;
  return time.map((t, i) => ({
    t,
    dt: i === 0 ? 0 : Math.max(0, t - time[i - 1]),
    // Absent `moving` stream means we can't tell — count everything.
    moving: moving ? moving[i] !== false : true,
  }));
}

function zeroZoneSeconds(): Record<HrZone, number> {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

interface TimeWindow {
  startSec: number;
  endSec: number;
}

/** Time-weighted zone accumulation over moving samples. When `windows` is
 *  given, only samples falling inside them count — used to judge interval
 *  sessions on work time alone. */
function accumulateZoneSeconds(
  samples: Sample[],
  values: number[] | undefined,
  bounds: Record<HrZone, { minBpm: number; maxBpm: number } | { minWatts: number; maxWatts: number }>,
  windows?: TimeWindow[],
): Record<HrZone, number> {
  const out = zeroZoneSeconds();
  if (!values) return out;
  samples.forEach((s, i) => {
    if (!s.moving || s.dt <= 0) return;
    if (windows && !windows.some((w) => s.t >= w.startSec && s.t < w.endSec)) return;
    const v = values[i];
    if (typeof v !== 'number' || Number.isNaN(v)) return;
    out[zoneOf(v, bounds)] += s.dt;
  });
  return out;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Normalized Power: 30s rolling average, 4th power, mean, 4th root. Computed
 *  time-aware rather than index-aware so down-sampled streams don't distort it. */
function normalizedPower(samples: Sample[], watts: number[]): number | undefined {
  if (samples.length < 2) return undefined;
  const rolled: number[] = [];
  let start = 0;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < samples.length; i++) {
    const w = watts[i];
    if (typeof w === 'number' && !Number.isNaN(w)) {
      sum += w;
      count++;
    }
    while (samples[i].t - samples[start].t > 30) {
      const dropped = watts[start];
      if (typeof dropped === 'number' && !Number.isNaN(dropped)) {
        sum -= dropped;
        count--;
      }
      start++;
    }
    if (count > 0) rolled.push(sum / count);
  }
  if (rolled.length === 0) return undefined;
  const fourth = mean(rolled.map((w) => w ** 4));
  return Math.round(fourth ** 0.25);
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

function buildSplits(raw: StravaSplit[] | undefined): Split[] {
  if (!raw) return [];
  return raw.map((s) => ({
    index: s.split,
    distanceMeters: s.distance,
    movingSec: s.moving_time,
    paceSecPerMi: s.average_speed > 0 ? METERS_PER_MILE / s.average_speed : 0,
    avgHr: s.average_heartrate,
    elevGainMeters: s.elevation_difference,
  }));
}

/** Aerobic decoupling: output:HR ratio in the second half vs the first, over
 *  moving time. Positive = HR climbing relative to output (fatigue/heat). */
function computeDrift(
  samples: Sample[],
  hr: number[] | undefined,
  output: number[] | undefined,
  method: DriftSummary['method'],
): DriftSummary | undefined {
  if (!hr || !output || samples.length < 4) return undefined;
  const movingIdx = samples.map((s, i) => (s.moving ? i : -1)).filter((i) => i >= 0);
  if (movingIdx.length < 4) return undefined;
  const mid = Math.floor(movingIdx.length / 2);

  const ratio = (idx: number[]): number | undefined => {
    const pairs = idx.filter(
      (i) => typeof hr[i] === 'number' && hr[i] > 0 && typeof output[i] === 'number' && output[i] > 0,
    );
    if (pairs.length < 2) return undefined;
    const avgHr = mean(pairs.map((i) => hr[i]));
    const avgOut = mean(pairs.map((i) => output[i]));
    return avgHr > 0 ? avgOut / avgHr : undefined;
  };

  const first = ratio(movingIdx.slice(0, mid));
  const second = ratio(movingIdx.slice(mid));
  if (first === undefined || second === undefined || first === 0) return undefined;
  return { decouplingPct: Math.round(((first - second) / first) * 1000) / 10, method };
}

/** Classifies laps/segments into work vs recovery by splitting at the midpoint
 *  between the easiest and hardest effort. Deterministic and good enough for
 *  the alternating work/rest pattern real interval sessions produce. */
function classifyEfforts(outputs: number[]): boolean[] {
  const min = Math.min(...outputs);
  const max = Math.max(...outputs);
  const midpoint = (min + max) / 2;
  return outputs.map((o) => o >= midpoint);
}

function spreadRatio(outputs: number[]): number {
  const min = Math.min(...outputs);
  const max = Math.max(...outputs);
  return min > 0 ? (max - min) / min : 0;
}

/** Auto-lap sessions trigger a lap every fixed distance (1mi / 1km), so every
 *  lap but the last carries an identical distance. Real interval sessions have
 *  work and recovery laps of differing length — unless the recoveries happen to
 *  match the reps, which is why the caller still checks output spread. */
function looksLikeAutoLaps(laps: StravaLap[]): boolean {
  const full = laps.slice(0, -1).map((l) => l.distance);
  if (full.length < 2) return false;
  return spreadRatio(full) < 0.02;
}

/** True when efforts vary enough to look like intervals rather than a steady
 *  effort with normal noise.
 *
 *  Auto-lapped runs need a much higher bar: a real mile-split run drifts 10-20%
 *  across splits from hills, fatigue or a fast finish, which is not an interval
 *  session. Genuine repeats (e.g. 400s at 4.5m/s off 2.5m/s jogs) clear 25%
 *  comfortably. */
function hasIntervalSpread(outputs: number[], autoLapped: boolean): boolean {
  return spreadRatio(outputs) > (autoLapped ? 0.25 : 0.15);
}

function detectStructureFromLaps(
  laps: StravaLap[],
  usePower: boolean,
): SessionStructure | undefined {
  if (laps.length < 3) return undefined;
  const outputs = laps.map((l) => (usePower ? (l.average_watts ?? 0) : l.average_speed));
  if (outputs.some((o) => !o) || !hasIntervalSpread(outputs, looksLikeAutoLaps(laps))) return undefined;

  const isWork = classifyEfforts(outputs);
  // Stream timestamps are elapsed seconds from the start, so rep windows are
  // built from cumulative elapsed time to line the two up.
  let cursor = 0;
  const reps: RepSegment[] = laps.map((l, i) => {
    const startSec = cursor;
    cursor += l.elapsed_time;
    return {
      index: i + 1,
      startSec,
      endSec: cursor,
      durationSec: l.moving_time,
      avgHr: l.average_heartrate,
      avgWatts: l.average_watts,
      paceSecPerMi: l.average_speed > 0 ? METERS_PER_MILE / l.average_speed : undefined,
      kind: isWork[i] ? 'work' : 'recovery',
    };
  });

  return { source: 'device-laps', workReps: reps.filter((r) => r.kind === 'work').length, reps };
}

/** Marks which reps reached the intent's target intensity. Judged on power AND
 *  HR together: output confirms the effort was made, HR confirms the body
 *  responded, and either alone is enough. That dual test also absorbs HR lag —
 *  HR needs 60-90s to climb into Z5, so short reps read easy on HR alone. */
function judgeReps(
  structure: SessionStructure,
  intent: IntentType,
  hrZones: ResolvedHrZones | null,
  powerZones: ResolvedPowerZones | null,
): void {
  const target = new Set<HrZone>(INTENT_BANDS[intent].targetZones);
  structure.reps?.forEach((rep) => {
    if (rep.kind !== 'work') return;
    const by: ('power' | 'pace' | 'hr')[] = [];
    if (powerZones && typeof rep.avgWatts === 'number' && target.has(zoneOf(rep.avgWatts, powerZones.bounds))) {
      by.push('power');
    }
    if (hrZones && typeof rep.avgHr === 'number' && target.has(zoneOf(rep.avgHr, hrZones.bounds))) {
      by.push('hr');
    }
    rep.reachedTargetBy = by;
    rep.hitTarget = by.length > 0;
  });
}

/** Rep-to-rep fade — the "went out too hard" detector. For vo2max this is the
 *  primary overcooking signal, since the collapsed 5-zone model can't tell VO2
 *  intensity from sprinting. */
function computeSustainability(structure: SessionStructure): SustainabilitySummary | undefined {
  const work = structure.reps?.filter((r) => r.kind === 'work') ?? [];
  if (work.length < 2) return undefined;

  const usePower = work.every((r) => typeof r.avgWatts === 'number' && r.avgWatts > 0);
  const usePace = !usePower && work.every((r) => typeof r.paceSecPerMi === 'number' && r.paceSecPerMi > 0);
  if (!usePower && !usePace) return undefined;

  // Normalize so higher always means more output (pace is inverted: lower is faster).
  const output = work.map((r) => (usePower ? r.avgWatts! : 1 / r.paceSecPerMi!));
  const first = output[0];
  const last = output[output.length - 1];
  const fadePct = first > 0 ? Math.round(((first - last) / first) * 1000) / 10 : 0;

  return {
    fadePct,
    basis: usePower ? 'power' : 'pace',
    repsHittingTarget: work.filter((r) => r.hitTarget).length,
    totalWorkReps: work.length,
  };
}

/** Target pace for the intent vs. what was actually run. Answers "did I go too
 *  fast or too slow", which zone banding can't: a run can sit in the right HR
 *  zone but be well off the pace the session called for. */
function computePaceTarget(
  intent: IntentType,
  thresholdPaceSecPerMi: number | null,
  pace: PaceSummary | undefined,
  structure: SessionStructure | undefined,
): PaceTargetResult | undefined {
  if (!thresholdPaceSecPerMi || thresholdPaceSecPerMi <= 0 || !pace || pace.avgPaceSecPerMi <= 0) return undefined;

  // For intervals, judge the work reps — recoveries would drag the average
  // toward "too slow" and hide what the hard efforts actually did.
  const workPaces =
    structure?.reps?.filter((r) => r.kind === 'work' && typeof r.paceSecPerMi === 'number').map((r) => r.paceSecPerMi!) ??
    [];
  const useWork = workPaces.length > 0;
  const actualSecPerMi = Math.round(useWork ? mean(workPaces) : pace.avgPaceSecPerMi);

  // pace = thresholdPace / speedRatio, so the FAST bound comes from the
  // HIGHER ratio.
  const t = PACE_TARGETS[intent];
  const targetFastSecPerMi = Math.round(thresholdPaceSecPerMi / t.maxSpeedRatio);
  const targetSlowSecPerMi = Math.round(thresholdPaceSecPerMi / t.minSpeedRatio);

  let verdict: PaceTargetResult['verdict'] = 'in-range';
  if (actualSecPerMi < targetFastSecPerMi) verdict = 'too-fast';
  else if (actualSecPerMi > targetSlowSecPerMi) verdict = 'too-slow';

  return {
    thresholdPaceSecPerMi,
    targetFastSecPerMi,
    targetSlowSecPerMi,
    actualSecPerMi,
    basis: useWork ? 'work-reps' : 'session-average',
    verdict,
  };
}

/** The headline "did execution match intent" computation. Faults are
 *  asymmetric per intentBands.ts — an easy day run hard and a threshold set run
 *  easy are different mistakes. */
function computeIntentBand(
  intent: IntentType,
  zoneSeconds: Record<HrZone, number>,
  primaryMetric: 'power' | 'pace' | 'hr',
  scope: IntentBandResult['scope'],
): IntentBandResult {
  const band = INTENT_BANDS[intent];
  const target = new Set<HrZone>(band.targetZones);
  const tolerant = new Set<HrZone>(band.tolerantZones);
  const lowest = Math.min(...band.targetZones);
  const highest = Math.max(...band.targetZones);

  let inBandSec = 0;
  let tolerantSec = 0;
  let belowBandSec = 0;
  let aboveBandSec = 0;
  for (const z of ZONES) {
    const sec = zoneSeconds[z];
    if (sec <= 0) continue;
    // Tolerated zones are acceptable but not the target — tracked separately so
    // they can be reported without being counted as a miss.
    if (target.has(z)) inBandSec += sec;
    else if (tolerant.has(z)) tolerantSec += sec;
    else if (z < lowest) belowBandSec += sec;
    else if (z > highest) aboveBandSec += sec;
  }

  const total = inBandSec + tolerantSec + belowBandSec + aboveBandSec;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

  // Faults are measured against the whole session: drifting above band for a
  // quarter of the time is a miss regardless of how the rest is classified.
  const overSec = band.aboveIsFault ? aboveBandSec : 0;
  const underSec = band.belowIsFault ? belowBandSec : 0;
  let fault: IntentBandResult['fault'] = 'none';
  if (Math.max(overSec, underSec) > total * 0.25) {
    fault = overSec >= underSec ? 'too-hard' : 'too-easy';
  }

  return {
    configVersion: INTENT_BAND_CONFIG_VERSION,
    primaryMetric,
    targetZones: band.targetZones,
    scope,
    inBandSec: Math.round(inBandSec),
    tolerantSec: Math.round(tolerantSec),
    belowBandSec: Math.round(belowBandSec),
    aboveBandSec: Math.round(aboveBandSec),
    inBandPct: pct(inBandSec),
    acceptablePct: pct(inBandSec + tolerantSec),
    fault,
    // HR-only banding is imprecise: HR lags the effort and drifts with heat,
    // sleep and hydration, so we say so rather than implying false precision.
    confidence: primaryMetric === 'power' ? 'high' : 'low',
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function structureSession(input: StructuringInput): SessionSummary {
  const { raw, intent, athlete } = input;
  const { detail, streams } = raw;

  const samples = buildSamples(streams);
  const hrData = streams.heartrate?.data;
  const wattsData = streams.watts?.data;
  const speedData = streams.velocity_smooth?.data;

  const sportType = detail.sport_type || detail.type;
  const hrZones = resolveHrZones(athlete);
  const powerZones = resolvePowerZones(thresholdPowerFor(sportType, athlete));

  const hasHr = Boolean(hrData?.length) || Boolean(detail.average_heartrate);
  const hasPower = Boolean(wattsData?.length) || typeof detail.average_watts === 'number';
  const hasStreams = samples.length > 0;

  const availability: DataAvailability = {
    heartRate: hasHr,
    velocityOrGps: Boolean(speedData?.length) || detail.distance > 0,
    power: hasPower,
    powerSource: hasPower ? (detail.device_watts ? 'meter' : 'estimated') : 'none',
    cadence: Boolean(streams.cadence?.data?.length),
    altitude: Boolean(streams.altitude?.data?.length),
    laps: Boolean(detail.laps?.length),
    streamResolution: hasStreams ? 'high' : 'summary-only',
    zonesSource: hrZones?.source ?? 'estimated-from-maxhr',
    // FTP only ever arrives from Strava's /athlete today; 'entered' is reserved
    // for a manual FTP field if one is added.
    ftpSource: powerZones ? 'strava' : 'none',
  };

  // --- pace / distance ---
  const distanceMeters = detail.distance ?? 0;
  const splits = buildSplits(detail.splits_standard);
  const avgSpeedMps = detail.moving_time > 0 ? distanceMeters / detail.moving_time : 0;
  const pace: PaceSummary | undefined =
    distanceMeters > 0
      ? {
          avgSpeedMps: Math.round(avgSpeedMps * 100) / 100,
          avgPaceSecPerMi: avgSpeedMps > 0 ? Math.round(METERS_PER_MILE / avgSpeedMps) : 0,
          splits,
        }
      : undefined;

  // --- heart rate ---
  let heartRate: HeartRateSummary | undefined;
  if (hasHr && hrZones) {
    const values = hrData ?? [];
    const valid = values.filter((v) => typeof v === 'number' && v > 0);
    heartRate = {
      avg: Math.round(valid.length ? mean(valid) : (detail.average_heartrate ?? 0)),
      max: Math.round(valid.length ? Math.max(...valid) : (detail.max_heartrate ?? 0)),
      zoneSeconds: accumulateZoneSeconds(samples, hrData, hrZones.bounds),
      zoneBounds: hrZones.bounds,
    };
  }

  // --- power ---
  // Reported whenever watts exist, even with no threshold to band against:
  // average and normalized power are useful facts on their own, and silently
  // dropping a power meter's data because no FTP is set loses real signal.
  let power: PowerSummary | undefined;
  if (hasPower) {
    const values = wattsData ?? [];
    const valid = values.filter((v) => typeof v === 'number' && v >= 0);
    const np = wattsData ? normalizedPower(samples, wattsData) : detail.weighted_average_watts;
    power = {
      avgWatts: Math.round(valid.length ? mean(valid) : (detail.average_watts ?? 0)),
      normalizedWatts: np,
      intensityFactor: np && powerZones ? Math.round((np / powerZones.ftp) * 100) / 100 : undefined,
      zoneSeconds: powerZones ? accumulateZoneSeconds(samples, wattsData, powerZones.bounds) : undefined,
      zoneBounds: powerZones?.bounds,
    };
  }

  // --- drift (needs HR plus an output metric) ---
  const drift = wattsData
    ? computeDrift(samples, hrData, wattsData, 'power:hr-halves')
    : computeDrift(samples, hrData, speedData, 'pace:hr-halves');

  // --- structure / intervals ---
  let structure = detail.laps ? detectStructureFromLaps(detail.laps, Boolean(wattsData?.length)) : undefined;
  if (structure) {
    judgeReps(structure, intent, hrZones, powerZones);
    structure = { ...structure, sustainability: computeSustainability(structure) };
  }

  // --- intent band ---
  // Power is the better judge (direct, instantaneous); HR is the fallback.
  // Pace banding is deliberately absent: it needs a threshold-pace/VDOT anchor
  // that Strava doesn't expose, and guessing one would skew every result.
  //
  // For interval sessions, band the WORK reps only: the recovery jogs are
  // meant to be easy, so counting them would make every well-executed interval
  // session read as "too easy".
  const workWindows = structure?.reps?.filter((r) => r.kind === 'work').map((r) => ({ startSec: r.startSec, endSec: r.endSec }));
  const scope: IntentBandResult['scope'] = workWindows?.length ? 'work-reps' : 'whole-session';

  // Banding needs actual time in zones. Summary-only activities (no streams —
  // manual entries, some treadmill work) have an average HR but no per-record
  // data, so every zone total is 0; banding that would render a confident
  // "on target, 0%" verdict out of nothing.
  const totalZoneSec = (zs: Record<HrZone, number>) => ZONES.reduce((a, z) => a + zs[z], 0);

  let intentBand: IntentBandResult | undefined;
  if (power?.zoneSeconds && powerZones) {
    const zs = scope === 'work-reps' ? accumulateZoneSeconds(samples, wattsData, powerZones.bounds, workWindows) : power.zoneSeconds;
    if (totalZoneSec(zs) > 0) intentBand = computeIntentBand(intent, zs, 'power', scope);
  }
  if (!intentBand && heartRate && hrZones) {
    const zs = scope === 'work-reps' ? accumulateZoneSeconds(samples, hrData, hrZones.bounds, workWindows) : heartRate.zoneSeconds;
    if (totalZoneSec(zs) > 0) intentBand = computeIntentBand(intent, zs, 'hr', scope);
  }

  const summary: SessionSummary = {
    schemaVersion: '1',
    intent,
    activity: {
      id: `strava-${detail.id}`,
      source: 'strava',
      sportType: detail.sport_type || detail.type,
      name: detail.name,
      startedAt: detail.start_date_local,
    },
    availability,
    duration: { movingSec: detail.moving_time, elapsedSec: detail.elapsed_time },
    distance:
      distanceMeters > 0
        ? { meters: Math.round(distanceMeters), miles: Math.round((distanceMeters / METERS_PER_MILE) * 100) / 100 }
        : undefined,
    pace,
    heartRate,
    power,
    drift,
    structure,
    intentBand,
    paceTarget: computePaceTarget(intent, athlete.thresholdPaceSecPerMi, pace, structure),
    signals: [],
  };

  summary.signals = deriveSignals(summary, intent);
  return summary;
}

// ---------------------------------------------------------------------------
// Signals — deterministic factual observations that anchor the coach's note.
// The model narrates these; it never recomputes them.
// ---------------------------------------------------------------------------

function deriveSignals(s: SessionSummary, intent: IntentType): Signal[] {
  const signals: Signal[] = [];
  const band = INTENT_BANDS[intent];

  if (s.intentBand) {
    const ib = s.intentBand;
    if (ib.fault !== 'none') {
      signals.push({
        code: 'zone_mismatch',
        detail: {
          intent,
          fault: ib.fault,
          inBandPct: ib.inBandPct,
          acceptablePct: ib.acceptablePct,
          offBandSec: ib.fault === 'too-hard' ? ib.aboveBandSec : ib.belowBandSec,
          judgedBy: ib.primaryMetric,
        },
      });
    } else {
      signals.push({
        code: 'on_target',
        detail: { intent, inBandPct: ib.inBandPct, acceptablePct: ib.acceptablePct },
      });
    }
    if (ib.confidence === 'low') {
      signals.push({ code: 'low_banding_confidence', detail: { judgedBy: ib.primaryMetric } });
    }
  } else {
    signals.push({ code: 'cannot_band', detail: { reason: 'no HR or power data' } });
  }

  if (s.paceTarget) {
    const pt = s.paceTarget;
    signals.push({
      code: pt.verdict === 'in-range' ? 'pace_on_target' : 'pace_off_target',
      detail: {
        verdict: pt.verdict,
        actualSecPerMi: pt.actualSecPerMi,
        targetFastSecPerMi: pt.targetFastSecPerMi,
        targetSlowSecPerMi: pt.targetSlowSecPerMi,
        basis: pt.basis,
      },
    });
  } else {
    signals.push({ code: 'no_pace_target', detail: { reason: 'no threshold pace set' } });
  }

  // A power meter we can't band against — worth surfacing, since setting a
  // threshold would move this session from low- to high-confidence judging.
  if (s.availability.power && !s.power?.zoneSeconds) {
    signals.push({
      code: 'power_without_threshold',
      detail: { sport: s.activity.sportType, avgWatts: s.power?.avgWatts ?? 0 },
    });
  }

  // Dominant zone — the "what did this session actually look like" read.
  const zoneSeconds = s.power?.zoneSeconds ?? s.heartRate?.zoneSeconds;
  if (zoneSeconds) {
    const total = ZONES.reduce((a, z) => a + zoneSeconds[z], 0);
    if (total > 0) {
      const dominant = ZONES.reduce((best, z) => (zoneSeconds[z] > zoneSeconds[best] ? z : best), 1 as HrZone);
      signals.push({
        code: 'dominant_zone',
        detail: { zone: dominant, pct: Math.round((zoneSeconds[dominant] / total) * 1000) / 10 },
      });
    }
  }

  if (s.drift && Math.abs(s.drift.decouplingPct) >= 5) {
    signals.push({
      code: s.drift.decouplingPct > 0 ? 'high_drift' : 'negative_drift',
      detail: { decouplingPct: s.drift.decouplingPct, method: s.drift.method },
    });
  }

  // Split trend, for steady sessions where it's meaningful.
  const splits = s.pace?.splits ?? [];
  if (splits.length >= 2 && !s.structure) {
    const first = splits[0].paceSecPerMi;
    const last = splits[splits.length - 1].paceSecPerMi;
    if (first > 0 && Math.abs(last - first) / first >= 0.03) {
      signals.push({
        code: last < first ? 'negative_split' : 'positive_split',
        detail: { firstSplitSecPerMi: Math.round(first), lastSplitSecPerMi: Math.round(last) },
      });
    }
  }

  if (s.structure) {
    signals.push({
      code: 'interval_session',
      detail: { workReps: s.structure.workReps, source: s.structure.source },
    });
    const sus = s.structure.sustainability;
    if (sus) {
      // Fade matters most where the config says sustainability is the point —
      // for vo2max it's the only way "went out too hard" is visible.
      if (sus.fadePct >= 5 && band.emphasizeSustainability) {
        signals.push({ code: 'rep_fade', detail: { fadePct: sus.fadePct, basis: sus.basis } });
      } else if (sus.fadePct <= -5) {
        signals.push({ code: 'rep_build', detail: { fadePct: sus.fadePct, basis: sus.basis } });
      }
      if (sus.repsHittingTarget < sus.totalWorkReps) {
        signals.push({
          code: 'reps_missed_target',
          detail: { hit: sus.repsHittingTarget, total: sus.totalWorkReps },
        });
      }
    }
  } else if (band.emphasizeSustainability) {
    // Intent implies intervals but the data reads steady — a structural mismatch.
    signals.push({ code: 'expected_intervals_but_steady', detail: { intent } });
  }

  if (!s.availability.heartRate) signals.push({ code: 'no_hr_data' });
  if (!s.availability.power) signals.push({ code: 'no_power_data' });
  if (s.availability.streamResolution === 'summary-only') signals.push({ code: 'summary_data_only' });

  return signals;
}
