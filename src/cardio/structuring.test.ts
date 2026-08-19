// Unit tests for the structuring step. Run: npm test
//
// Synthetic streams are built to order so each behaviour is tested in
// isolation — real fixtures (captured via scripts/capture-fixture.mjs) will
// back these up once real sessions are pulled.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { INTENT_STRUCTURE } from './intentBands.js';
import { structureSession } from './structuring.js';
import type { StructuringInput } from './structuring.js';
import type { AthleteProfile } from './zones.js';
import type { RawSession, StravaActivityDetail, StravaStreamSet } from './stravaTypes.js';

// 7:00/mi threshold pace. ftp is the CYCLING number; runningFtp is separate.
const ATHLETE: AthleteProfile = {
  zones: null,
  ftp: 250,
  runningFtp: null,
  maxHr: 190,
  thresholdPaceSecPerMi: 420,
};
// maxHr 190 => Z1 <114, Z2 114-133, Z3 133-152, Z4 152-171, Z5 171+
// ftp 250   => Z1 <=137, Z2 138-187, Z3 188-225, Z4 226-262, Z5 263+

function stream(data: number[]) {
  return { data, series_type: 'time', original_size: data.length, resolution: 'high' };
}

function detail(over: Partial<StravaActivityDetail> = {}): StravaActivityDetail {
  return {
    id: 1,
    name: 'Test',
    sport_type: 'Run',
    type: 'Run',
    start_date_local: '2026-08-01T07:00:00Z',
    distance: 8046.72, // 5 miles
    moving_time: 2400,
    elapsed_time: 2450,
    ...over,
  };
}

/** n samples at 1Hz with a constant HR. */
function steady(n: number, hr: number): StravaStreamSet {
  return {
    time: stream(Array.from({ length: n }, (_, i) => i)),
    heartrate: stream(Array.from({ length: n }, () => hr)),
  };
}

function run(streams: StravaStreamSet, intent: StructuringInput['intent'], over: Partial<StravaActivityDetail> = {}) {
  const raw: RawSession = { detail: detail(over), streams };
  return structureSession({ raw, intent, athlete: { ...ATHLETE, ftp: null } });
}

/** Same as run(), but with a distance/time giving a known session pace. */
function runAtPace(paceSecPerMi: number, intent: StructuringInput['intent'], hr = 125) {
  const miles = 5;
  return run(steady(600, hr), intent, {
    distance: miles * 1609.344,
    moving_time: Math.round(paceSecPerMi * miles),
  });
}

describe('intent banding', () => {
  it('marks a Z2 base run as on target', () => {
    const s = run(steady(600, 125), 'base');
    assert.equal(s.intentBand?.fault, 'none');
    assert.equal(s.intentBand?.inBandPct, 100);
    assert.equal(s.intentBand?.primaryMetric, 'hr');
    assert.ok(s.signals.some((x) => x.code === 'on_target'));
  });

  it('flags a base run spent in Z4 as too hard', () => {
    const s = run(steady(600, 160), 'base');
    assert.equal(s.intentBand?.fault, 'too-hard');
    assert.ok(s.signals.some((x) => x.code === 'zone_mismatch' && x.detail?.fault === 'too-hard'));
  });

  it('never faults a recovery run for being too easy', () => {
    const s = run(steady(600, 100), 'recovery');
    assert.equal(s.intentBand?.fault, 'none');
  });

  it('faults a threshold session that stayed easy', () => {
    const s = run(steady(600, 120), 'threshold');
    assert.equal(s.intentBand?.fault, 'too-easy');
  });

  // The correction that matters: threshold is a BOTH-sided band.
  it('faults a threshold session that was overcooked into Z5', () => {
    const s = run(steady(600, 180), 'threshold');
    assert.equal(s.intentBand?.fault, 'too-hard');
  });

  it('does not fault vo2max for being in Z5 (Z5 is the target)', () => {
    const s = run(steady(600, 180), 'vo2max');
    assert.equal(s.intentBand?.fault, 'none');
  });

  it('treats tolerated zones as neither in-band nor a fault', () => {
    // Recovery targets Z1 and tolerates Z2; a fully-Z2 run should not fault.
    const s = run(steady(600, 125), 'recovery');
    assert.equal(s.intentBand?.fault, 'none');
  });
});

describe('band accounting', () => {
  it('partitions the judged time — the four buckets sum to the total', () => {
    const n = 1200;
    // Half Z2 (tolerated on a recovery day), half Z4 (above band).
    const s = run(
      {
        time: stream(Array.from({ length: n }, (_, i) => i)),
        heartrate: stream(Array.from({ length: n }, (_, i) => (i < n / 2 ? 125 : 160))),
      },
      'recovery',
    );
    const b = s.intentBand!;
    assert.equal(b.inBandSec + b.tolerantSec + b.belowBandSec + b.aboveBandSec, n - 1);
  });

  it('reports acceptable time separately from strictly in-band', () => {
    // Mirrors the real Lunch Run: mostly Z2 with a few minutes drifting up.
    const n = 1000;
    const s = run(
      {
        time: stream(Array.from({ length: n }, (_, i) => i)),
        heartrate: stream(Array.from({ length: n }, (_, i) => (i < 800 ? 125 : 160))),
      },
      'recovery',
    );
    const b = s.intentBand!;
    // Strictly in Z1: none. But 80% was at recovery effort or easier.
    assert.equal(b.inBandPct, 0);
    assert.ok(b.acceptablePct >= 79 && b.acceptablePct <= 81, `got ${b.acceptablePct}`);
    assert.equal(b.fault, 'none'); // 20% drift is under the quarter-session bar
  });

  it('still faults when drift exceeds a quarter of the session', () => {
    const n = 1000;
    const s = run(
      {
        time: stream(Array.from({ length: n }, (_, i) => i)),
        heartrate: stream(Array.from({ length: n }, (_, i) => (i < 600 ? 125 : 160))),
      },
      'recovery',
    );
    assert.equal(s.intentBand?.fault, 'too-hard');
    assert.ok(s.signals.some((x) => x.code === 'zone_mismatch' && typeof x.detail?.offBandSec === 'number'));
  });

  // The verdict stays coarse; the note carries the nuance. These signals are
  // what give the generation step something to be nuanced *about*.
  it('flags sub-fault drift so the note can mention it', () => {
    const n = 1000;
    const s = run(
      {
        time: stream(Array.from({ length: n }, (_, i) => i)),
        heartrate: stream(Array.from({ length: n }, (_, i) => (i < 850 ? 125 : 160))), // 15% in Z4
      },
      'recovery',
    );
    assert.equal(s.intentBand?.fault, 'none', 'under the fault bar, as agreed');
    const drift = s.signals.find((x) => x.code === 'time_above_band');
    assert.ok(drift, 'the note still needs to know about it');
    assert.equal(drift?.detail?.peakZone, 4, 'Z4 on a recovery day reads differently from Z3');
    assert.ok((drift?.detail?.sec as number) > 100);
  });

  it('does not double-report drift that already caused a fault', () => {
    const n = 1000;
    const s = run(
      {
        time: stream(Array.from({ length: n }, (_, i) => i)),
        heartrate: stream(Array.from({ length: n }, (_, i) => (i < 600 ? 125 : 160))),
      },
      'recovery',
    );
    assert.equal(s.intentBand?.fault, 'too-hard');
    assert.ok(!s.signals.some((x) => x.code === 'time_above_band'));
  });

  it('keeps acceptable equal to in-band when the intent tolerates nothing', () => {
    const s = run(steady(600, 160), 'threshold'); // Z4, no tolerated zones
    assert.equal(s.intentBand?.tolerantSec, 0);
    assert.equal(s.intentBand?.acceptablePct, s.intentBand?.inBandPct);
  });
});

describe('graceful degradation', () => {
  it('omits intentBand and says so when there is no HR or power', () => {
    const s = run({ time: stream(Array.from({ length: 100 }, (_, i) => i)) }, 'base');
    assert.equal(s.intentBand, undefined);
    assert.ok(s.signals.some((x) => x.code === 'cannot_band'));
    assert.ok(s.signals.some((x) => x.code === 'no_hr_data'));
    // Pace still survives — degradation is per-field.
    assert.ok(s.pace);
    assert.equal(s.distance?.miles, 5);
  });

  it('reports low confidence when banding on HR alone', () => {
    const s = run(steady(600, 125), 'base');
    assert.equal(s.intentBand?.confidence, 'low');
    assert.ok(s.signals.some((x) => x.code === 'low_banding_confidence'));
  });

  const poweredRun: StravaStreamSet = {
    time: stream(Array.from({ length: 600 }, (_, i) => i)),
    heartrate: stream(Array.from({ length: 600 }, () => 150)),
    watts: stream(Array.from({ length: 600 }, () => 160)), // Z2 against a 250 threshold
  };

  it('reports high confidence when banding on power', () => {
    const s = structureSession({
      raw: { detail: detail({ device_watts: true }), streams: poweredRun },
      intent: 'base',
      athlete: { ...ATHLETE, runningFtp: 250 },
    });
    assert.equal(s.intentBand?.primaryMetric, 'power');
    assert.equal(s.intentBand?.confidence, 'high');
    assert.equal(s.availability.powerSource, 'meter');
  });

  // Running power reads far higher than cycling power for the same athlete, so
  // banding a run against a bike FTP would push every easy run toward Z5.
  it('never bands a run against the cycling FTP', () => {
    const s = structureSession({
      raw: { detail: detail({ device_watts: true }), streams: poweredRun },
      intent: 'base',
      athlete: { ...ATHLETE, ftp: 250, runningFtp: null },
    });
    assert.equal(s.intentBand?.primaryMetric, 'hr');
    assert.equal(s.power?.zoneSeconds, undefined);
  });

  it('still reports watts when there is no threshold to band them against', () => {
    const s = structureSession({
      raw: { detail: detail({ device_watts: true }), streams: poweredRun },
      intent: 'base',
      athlete: { ...ATHLETE, ftp: null, runningFtp: null },
    });
    assert.equal(s.power?.avgWatts, 160);
    assert.ok(s.power?.normalizedWatts);
    assert.ok(s.signals.some((x) => x.code === 'power_without_threshold'));
  });

  it('does band a ride against the cycling FTP', () => {
    const s = structureSession({
      raw: { detail: detail({ sport_type: 'Ride', device_watts: true }), streams: poweredRun },
      intent: 'base',
      athlete: { ...ATHLETE, ftp: 250, runningFtp: null },
    });
    assert.equal(s.intentBand?.primaryMetric, 'power');
  });
});

describe('zone accounting', () => {
  it('accumulates zone time by elapsed sample duration, not sample count', () => {
    // Irregular sampling: 10s gaps. 30 samples => ~290s of Z2.
    const times = Array.from({ length: 30 }, (_, i) => i * 10);
    const s = run({ time: stream(times), heartrate: stream(times.map(() => 125)) }, 'base');
    assert.equal(s.heartRate?.zoneSeconds[2], 290);
  });

  it('excludes non-moving samples', () => {
    const n = 100;
    const s = run(
      {
        time: stream(Array.from({ length: n }, (_, i) => i)),
        heartrate: stream(Array.from({ length: n }, () => 125)),
        // Second half stopped.
        moving: { data: Array.from({ length: n }, (_, i) => i < 50), series_type: 'time', original_size: n, resolution: 'high' },
      },
      'base',
    );
    assert.equal(s.heartRate?.zoneSeconds[2], 49);
  });
});

describe('drift', () => {
  it('detects HR climbing at constant output as positive decoupling', () => {
    const n = 600;
    const s = run(
      {
        time: stream(Array.from({ length: n }, (_, i) => i)),
        heartrate: stream(Array.from({ length: n }, (_, i) => (i < n / 2 ? 140 : 160))),
        velocity_smooth: stream(Array.from({ length: n }, () => 3)),
      },
      'base',
    );
    assert.ok(s.drift);
    assert.equal(s.drift?.method, 'pace:hr-halves');
    assert.ok(s.drift!.decouplingPct > 5, `expected positive drift, got ${s.drift!.decouplingPct}`);
    assert.ok(s.signals.some((x) => x.code === 'high_drift'));
  });
});

describe('interval structure', () => {
  const laps = [
    { lap_index: 1, moving_time: 180, elapsed_time: 180, distance: 800, average_speed: 4.4, average_heartrate: 175 },
    { lap_index: 2, moving_time: 120, elapsed_time: 120, distance: 300, average_speed: 2.5, average_heartrate: 130 },
    { lap_index: 3, moving_time: 180, elapsed_time: 180, distance: 780, average_speed: 4.3, average_heartrate: 176 },
    { lap_index: 4, moving_time: 120, elapsed_time: 120, distance: 300, average_speed: 2.5, average_heartrate: 128 },
    { lap_index: 5, moving_time: 180, elapsed_time: 180, distance: 700, average_speed: 3.9, average_heartrate: 174 },
  ];

  it('detects work reps from device laps', () => {
    const s = run(steady(600, 170), 'vo2max', { laps });
    assert.equal(s.structure?.source, 'device-laps');
    assert.equal(s.structure?.workReps, 3);
    assert.ok(s.signals.some((x) => x.code === 'interval_session'));
  });

  it('flags rep fade for vo2max — the overcooking signal a 5-zone model hides', () => {
    const s = run(steady(600, 170), 'vo2max', { laps });
    const sus = s.structure?.sustainability;
    assert.ok(sus);
    assert.equal(sus!.basis, 'pace');
    assert.ok(sus!.fadePct > 5, `expected fade, got ${sus!.fadePct}`);
    assert.ok(s.signals.some((x) => x.code === 'rep_fade'));
  });

  it('judges rep intensity by HR when power is absent', () => {
    const s = run(steady(600, 170), 'vo2max', { laps });
    const work = s.structure?.reps?.filter((r) => r.kind === 'work') ?? [];
    assert.equal(work.length, 3);
    // Work-rep HRs (174-176) sit in Z5, which vo2max targets.
    assert.ok(work.every((r) => r.hitTarget));
    assert.deepEqual(work[0].reachedTargetBy, ['hr']);
  });

  it('does not treat a steady run as intervals', () => {
    const flat = [1, 2, 3, 4].map((i) => ({
      lap_index: i,
      moving_time: 300,
      elapsed_time: 300,
      distance: 1200,
      average_speed: 3.2,
      average_heartrate: 140,
    }));
    const s = run(steady(600, 140), 'base', { laps: flat });
    assert.equal(s.structure, undefined);
  });

  it('flags when an interval intent produced a steady session', () => {
    const s = run(steady(600, 170), 'vo2max');
    assert.ok(s.signals.some((x) => x.code === 'expected_intervals_but_steady'));
  });
});

describe('auto-lap rejection (values from real captured runs)', () => {
  // Strava auto-laps every mile, so a plain steady run arrives with laps that
  // vary by 10-20% from hills, fatigue or a fast finish. Treating that as an
  // interval session cascades: banding switches to work-reps scope and judges
  // a fraction of the run.
  const autoLap = (dist: number, watts: number, speed: number, i: number) => ({
    lap_index: i + 1,
    moving_time: 500,
    elapsed_time: 500,
    distance: dist,
    average_speed: speed,
    average_heartrate: 150,
    average_watts: watts,
  });

  it('rejects the Lunch Run auto-laps (17.1% watt spread)', () => {
    const laps = [
      autoLap(1609.34, 291.5, 2.46, 0),
      autoLap(1609.34, 291.5, 2.54, 1),
      autoLap(1112.37, 341.3, 2.51, 2), // short final lap, faster finish
    ];
    const s = run(steady(600, 125), 'base', { laps });
    assert.equal(s.structure, undefined, 'a steady run must not read as intervals');
    assert.equal(s.intentBand?.scope, 'whole-session');
  });

  it('rejects the Morning Run auto-laps (13.6% watt spread)', () => {
    const laps = [
      autoLap(1609.34, 362.3, 3.09, 0),
      autoLap(1609.34, 411.6, 3.46, 1),
      autoLap(1609.34, 399.9, 3.35, 2),
      autoLap(992.47, 380.3, 2.79, 3),
    ];
    const s = run(steady(600, 125), 'base', { laps });
    assert.equal(s.structure, undefined);
  });

  // Uniform lap distances are now always treated as auto-laps, whatever the
  // output spread — every captured interval session in this athlete's history
  // arrived as identical mile splits, and a mile split cannot describe a 6x2min
  // workout. Sessions like that are found by stream detection instead.
  it('rejects uniform-distance laps even when the output gap is large', () => {
    const laps = [0, 1, 2, 3, 4, 5].map((i) =>
      autoLap(400, i % 2 === 0 ? 450 : 240, i % 2 === 0 ? 4.5 : 2.4, i),
    );
    const s = run(steady(600, 175), 'vo2max', { laps });
    assert.notEqual(s.structure?.source, 'device-laps');
  });

  it('still detects intervals when lap distances differ', () => {
    const laps = [
      autoLap(800, 450, 4.5, 0),
      autoLap(300, 240, 2.4, 1),
      autoLap(800, 440, 4.4, 2),
      autoLap(300, 240, 2.4, 3),
    ];
    const s = run(steady(600, 175), 'vo2max', { laps });
    assert.equal(s.structure?.workReps, 2);
  });
});

describe('stream-based interval detection', () => {
  /** n samples at 1Hz alternating workSec at `hi` and restSec at `lo`. */
  function intervals(workSec: number, restSec: number, reps: number, hi: number, lo: number) {
    const warm = 300;
    const time: number[] = [];
    const watts: number[] = [];
    const hr: number[] = [];
    let t = 0;
    for (let i = 0; i < warm; i++, t++) {
      time.push(t);
      watts.push(lo);
      hr.push(120);
    }
    for (let r = 0; r < reps; r++) {
      for (let i = 0; i < workSec; i++, t++) {
        time.push(t);
        watts.push(hi);
        hr.push(175);
      }
      for (let i = 0; i < restSec; i++, t++) {
        time.push(t);
        watts.push(lo);
        hr.push(130);
      }
    }
    return {
      time: stream(time),
      watts: stream(watts),
      heartrate: stream(hr),
      velocity_smooth: stream(watts.map((w) => w / 100)),
    };
  }

  it('finds reps in the stream when laps are useless', () => {
    const s = run(intervals(120, 90, 6, 450, 220), 'vo2max');
    assert.equal(s.structure?.source, 'stream-detected');
    assert.equal(s.structure?.workReps, 6);
  });

  it('marks stream-detected structure as low confidence', () => {
    const s = run(intervals(120, 90, 6, 450, 220), 'vo2max');
    // The count is inferred, so the note must not quote it as exact.
    assert.equal(s.structure?.confidence, 'low');
    assert.ok(s.signals.some((x) => x.code === 'interval_session' && x.detail?.confidence === 'low'));
  });

  it('recovers rep durations, not just the count', () => {
    const s = run(intervals(120, 90, 5, 450, 220), 'vo2max');
    const work = (s.structure?.reps ?? []).filter((r) => r.kind === 'work');
    work.forEach((r) => assert.ok(Math.abs(r.durationSec - 120) < 25, `rep ${r.index} was ${r.durationSec}s`));
  });

  /** Appends a steep climb — the run home — after the last rep. */
  function withHillFinish(base: StravaStreamSet, hi: number, climbSec: number) {
    const time = [...(base.time!.data)];
    const watts = [...(base.watts!.data)];
    const hr = [...(base.heartrate!.data)];
    const grade = watts.map(() => 0.3); // reps are essentially flat
    let t = time[time.length - 1];
    for (let i = 0; i < climbSec; i++) {
      time.push(++t);
      watts.push(hi);
      hr.push(170);
      grade.push(8.5);
    }
    return {
      time: stream(time),
      watts: stream(watts),
      heartrate: stream(hr),
      grade_smooth: stream(grade),
      velocity_smooth: stream(watts.map((w) => w / 100)),
    };
  }

  it('excludes a steep climb home from the rep count', () => {
    // Measured on real sessions: reps ran at -0.6% to 3.2% grade, the climb
    // home at 6.7-9.7%. Without this the count was consistently one too high.
    const s = run(withHillFinish(intervals(120, 90, 6, 450, 220), 450, 90), 'vo2max');
    assert.equal(s.structure?.workReps, 6);
    assert.ok(s.structure?.hillFinish);
    assert.ok(s.structure!.hillFinish!.gradePct >= 5);
    assert.ok(s.signals.some((x) => x.code === 'hill_finish'));
  });

  it('keeps every rep when the whole session is hill repeats', () => {
    // All reps steep, so none of them is terrain — the exclusion must not fire.
    const base = intervals(120, 90, 5, 450, 220);
    const steep = { ...base, grade_smooth: stream(base.watts.data.map(() => 8)) };
    const s = run(steep, 'vo2max');
    assert.equal(s.structure?.workReps, 5);
    assert.equal(s.structure?.hillFinish, undefined);
  });

  it('reports structure on a steady intent but does not band on it', () => {
    // Detection runs for every intent so "you called this base but ran 6x2" can
    // be surfaced. What stays gated is whether the verdict narrows to the work
    // reps — that only makes sense when reps were the plan.
    const s = run(intervals(120, 90, 6, 450, 220), 'base');
    assert.equal(s.structure?.workReps, 6);
    assert.equal(s.intentBand?.scope, 'whole-session');
    assert.ok(s.signals.some((x) => x.code === 'structure_contradicts_intent'));
  });

  it('ignores brief surges that are too small a share of the session', () => {
    // Found by the eval: an easy run mislabelled "threshold" had its two
    // hardest minutes picked out as reps. Banding scopes to work reps, so the
    // verdict then judged 9% of the run and called it on target.
    const n = 1800;
    const watts = Array.from({ length: n }, (_, i) => (i > 900 && i < 1000 ? 420 : 250));
    const s = run(
      {
        time: stream(Array.from({ length: n }, (_, i) => i)),
        watts: stream(watts),
        heartrate: stream(watts.map((w) => (w > 300 ? 168 : 128))),
      },
      'threshold',
    );
    assert.equal(s.structure, undefined);
    assert.equal(s.intentBand?.scope, 'whole-session');
  });

  it('does not invent reps in a genuinely steady effort', () => {
    const n = 1800;
    const s = run(
      {
        time: stream(Array.from({ length: n }, (_, i) => i)),
        watts: stream(Array.from({ length: n }, () => 300)),
        heartrate: stream(Array.from({ length: n }, () => 150)),
      },
      'vo2max',
    );
    assert.equal(s.structure, undefined);
    assert.ok(s.signals.some((x) => x.code === 'expected_intervals_but_steady'));
  });
});

describe('summary-only activities (no streams)', () => {
  // Strava returns 404/400 for streams on manual entries and some stationary
  // work; the API layer degrades to {} rather than failing the request.
  it('does not fabricate a verdict from zero zone time', () => {
    const raw: RawSession = {
      detail: detail({ average_heartrate: 150, max_heartrate: 165 }),
      streams: {},
    };
    const s = structureSession({ raw, intent: 'base', athlete: ATHLETE });
    assert.equal(s.availability.streamResolution, 'summary-only');
    // The bug this guards: all zone totals are 0, which previously rendered a
    // confident "on target — 0%".
    assert.equal(s.intentBand, undefined);
    assert.ok(s.signals.some((x) => x.code === 'cannot_band'));
    assert.ok(s.signals.some((x) => x.code === 'summary_data_only'));
  });

  it('still reports the summary figures it does have', () => {
    const raw: RawSession = {
      detail: detail({ average_heartrate: 150, max_heartrate: 165 }),
      streams: {},
    };
    const s = structureSession({ raw, intent: 'base', athlete: ATHLETE });
    assert.equal(s.heartRate?.avg, 150);
    assert.equal(s.heartRate?.max, 165);
    assert.equal(s.distance?.miles, 5);
    assert.ok(s.paceTarget); // pace targets need no streams
  });
});

describe('Strava-supplied zones', () => {
  // Real /athlete/zones shape: 5 HR zones, open top bound marked -1.
  const stravaZones = {
    heart_rate: {
      custom_zones: true,
      zones: [
        { min: 0, max: 115 },
        { min: 115, max: 152 },
        { min: 152, max: 171 },
        { min: 171, max: 190 },
        { min: 190, max: -1 },
      ],
    },
  };

  it('prefers the athlete configured zones over the max-HR estimate', () => {
    const raw: RawSession = { detail: detail(), streams: steady(600, 160) };
    const s = structureSession({
      raw,
      intent: 'threshold',
      athlete: { ...ATHLETE, ftp: null, zones: stravaZones },
    });
    assert.equal(s.availability.zonesSource, 'strava');
    // 160bpm sits in Strava Z3 (152-171); the 190 max-HR estimate would put it
    // in Z4 (152-171 vs 133-152 boundaries differ).
    assert.equal(s.heartRate?.zoneBounds[3].minBpm, 152);
    assert.equal(s.intentBand?.fault, 'none'); // threshold targets Z3-Z4
  });

  it('treats the -1 top bound as open-ended', () => {
    const raw: RawSession = { detail: detail(), streams: steady(600, 205) };
    const s = structureSession({
      raw,
      intent: 'vo2max',
      athlete: { ...ATHLETE, ftp: null, zones: stravaZones },
    });
    assert.equal(s.heartRate?.zoneSeconds[5], 599);
  });
});

describe('interval banding scope', () => {
  // 4 x (300s hard @ Z5, 300s easy @ Z2). A correctly-executed VO2 session:
  // the recoveries are supposed to be easy.
  const n = 2400;
  const streams: StravaStreamSet = {
    time: stream(Array.from({ length: n }, (_, i) => i)),
    heartrate: stream(Array.from({ length: n }, (_, i) => (i % 600 < 300 ? 178 : 130))),
  };
  const laps = Array.from({ length: 8 }, (_, i) => ({
    lap_index: i + 1,
    moving_time: 300,
    elapsed_time: 300,
    distance: i % 2 === 0 ? 1300 : 500,
    average_speed: i % 2 === 0 ? 4.33 : 1.67,
    average_heartrate: i % 2 === 0 ? 178 : 130,
  }));

  it('judges interval sessions on work reps, not recovery jogs', () => {
    const s = run(streams, 'vo2max', { laps });
    assert.equal(s.intentBand?.scope, 'work-reps');
    // Without this, the easy recoveries would drag it to ~50% and fault it.
    assert.equal(s.intentBand?.inBandPct, 100);
    assert.equal(s.intentBand?.fault, 'none');
  });

  it('still judges steady sessions over the whole session', () => {
    const s = run(steady(600, 125), 'base');
    assert.equal(s.intentBand?.scope, 'whole-session');
  });

  it('builds rep windows from cumulative elapsed time', () => {
    const s = run(streams, 'vo2max', { laps });
    const reps = s.structure?.reps ?? [];
    assert.equal(reps[0].startSec, 0);
    assert.equal(reps[0].endSec, 300);
    assert.equal(reps[1].startSec, 300);
    assert.equal(reps[2].startSec, 600);
  });

  it('still faults an interval session whose work reps were too easy', () => {
    const easyStreams: StravaStreamSet = {
      time: stream(Array.from({ length: n }, (_, i) => i)),
      // Work reps only reach Z3 — genuinely under-cooked for vo2max.
      heartrate: stream(Array.from({ length: n }, (_, i) => (i % 600 < 300 ? 140 : 120))),
    };
    const s = run(easyStreams, 'vo2max', { laps });
    assert.equal(s.intentBand?.scope, 'work-reps');
    assert.equal(s.intentBand?.fault, 'too-easy');
  });
});

describe('pace targets', () => {
  // Threshold pace 7:00/mi (420s). base = 0.75-0.84x speed => 8:20-9:20/mi.
  it('accepts a base run inside the target pace range', () => {
    const s = runAtPace(520, 'base'); // 8:40/mi
    assert.equal(s.paceTarget?.verdict, 'in-range');
    assert.equal(s.paceTarget?.basis, 'session-average');
    assert.ok(s.signals.some((x) => x.code === 'pace_on_target'));
  });

  it('tells you when an easy run was run too fast', () => {
    const s = runAtPace(460, 'base'); // 7:40/mi — quicker than the fast bound
    assert.equal(s.paceTarget?.verdict, 'too-fast');
    assert.ok(s.signals.some((x) => x.code === 'pace_off_target' && x.detail?.verdict === 'too-fast'));
  });

  it('tells you when a session was run too slow', () => {
    const s = runAtPace(600, 'base'); // 10:00/mi
    assert.equal(s.paceTarget?.verdict, 'too-slow');
  });

  it('derives the target range from threshold pace, fast bound first', () => {
    const pt = runAtPace(520, 'base').paceTarget;
    assert.equal(pt?.thresholdPaceSecPerMi, 420);
    assert.equal(pt?.targetFastSecPerMi, 500); // 420 / 0.84
    assert.equal(pt?.targetSlowSecPerMi, 560); // 420 / 0.75
    assert.ok(pt!.targetFastSecPerMi < pt!.targetSlowSecPerMi);
  });

  it('scales the range with the intent — vo2max targets faster than threshold', () => {
    const vo2 = runAtPace(400, 'vo2max').paceTarget;
    const thr = runAtPace(420, 'threshold').paceTarget;
    assert.ok(vo2!.targetFastSecPerMi < thr!.targetFastSecPerMi);
    assert.equal(thr?.verdict, 'in-range');
  });

  it('judges intervals on work reps, not the session average', () => {
    const laps = [
      { lap_index: 1, moving_time: 180, elapsed_time: 180, distance: 800, average_speed: 4.4, average_heartrate: 175 },
      { lap_index: 2, moving_time: 120, elapsed_time: 120, distance: 300, average_speed: 2.5, average_heartrate: 130 },
      { lap_index: 3, moving_time: 180, elapsed_time: 180, distance: 780, average_speed: 4.3, average_heartrate: 176 },
    ];
    const s = run(steady(600, 170), 'vo2max', { laps });
    assert.equal(s.paceTarget?.basis, 'work-reps');
    // Work reps ~4.35 m/s => ~6:10/mi, faster than the session average would be.
    assert.ok(s.paceTarget!.actualSecPerMi < 400);
  });

  it('omits pace targets when no threshold pace is set', () => {
    const raw: RawSession = { detail: detail(), streams: steady(600, 125) };
    const s = structureSession({
      raw,
      intent: 'base',
      athlete: { ...ATHLETE, ftp: null, thresholdPaceSecPerMi: null },
    });
    assert.equal(s.paceTarget, undefined);
    assert.ok(s.signals.some((x) => x.code === 'no_pace_target'));
  });
});

describe('splits', () => {
  it('derives per-mile splits and flags a negative split', () => {
    const s = run(steady(600, 125), 'base', {
      splits_standard: [
        { split: 1, distance: 1609, moving_time: 540, elapsed_time: 540, average_speed: 2.98 },
        { split: 2, distance: 1609, moving_time: 480, elapsed_time: 480, average_speed: 3.35 },
      ],
    });
    assert.equal(s.pace?.splits.length, 2);
    assert.ok(s.pace!.splits[0].paceSecPerMi > s.pace!.splits[1].paceSecPerMi);
    assert.ok(s.signals.some((x) => x.code === 'negative_split'));
  });

  // From real feedback: on a recovery hike the note praised "a strong finishing
  // effort". Finishing harder is a virtue on a hard session and a drift in the
  // fault direction on an easy one, so the valence has to travel with the signal.
  it('marks a fast finish as against the intent on easy sessions', () => {
    const splits_standard = [
      { split: 1, distance: 1609, moving_time: 540, elapsed_time: 540, average_speed: 2.98 },
      { split: 2, distance: 1609, moving_time: 480, elapsed_time: 480, average_speed: 3.35 },
    ];
    for (const intent of ['recovery', 'base'] as const) {
      const s = run(steady(600, 125), intent, { splits_standard });
      const sig = s.signals.find((x) => x.code === 'negative_split');
      assert.equal(sig?.detail?.againstIntent, true, `${intent} should flag a fast finish`);
    }
  });

  // Threshold is a both-sided band, and a controlled negative split there is
  // decent execution — so the flag keys on the easy-day intents, not on
  // "too hard is a fault", which threshold also satisfies.
  it('leaves a fast finish unflagged on a hard session', () => {
    const s = run(steady(600, 125), 'threshold', {
      splits_standard: [
        { split: 1, distance: 1609, moving_time: 540, elapsed_time: 540, average_speed: 2.98 },
        { split: 2, distance: 1609, moving_time: 480, elapsed_time: 480, average_speed: 3.35 },
      ],
    });
    const sig = s.signals.find((x) => x.code === 'negative_split');
    assert.ok(sig);
    assert.equal(sig?.detail?.againstIntent, undefined);
  });
});

describe('progression guidance', () => {
  // The note endorsed a 90-minute duration nothing in the app judges. Root cause
  // was telling the model to "recommend the next progression" on an intent that
  // has none, leaving duration as the only dial it could reach for.
  it('states a progression for every intent', () => {
    for (const intent of ['recovery', 'base', 'threshold', 'vo2max'] as const) {
      assert.ok(INTENT_STRUCTURE[intent].progression.length > 0);
    }
  });

  it('tells the model recovery has no progression and fences duration', () => {
    assert.match(INTENT_STRUCTURE.recovery.progression, /NONE/);
    assert.match(INTENT_STRUCTURE.recovery.progression, /not prescribe a duration/i);
  });
});

describe('strain on an interval session', () => {
  // From real feedback: on a vo2max session where heart rate climbed across the
  // reps, the note recommended SHORTENING the recoveries. Two things were wrong.
  // Decoupling is a steady-state measure that should not be read on an interval
  // set at all, and rising heart rate at HELD output is the expected response
  // rather than a fault — so there was no correction to make in the first place.

  it('reads rising heart rate at held output as normal, not a fault', () => {
    const n = 2400;
    const cycle = (i: number) => Math.floor(i / 200) % 2 === 0;
    const s = run(
      {
        time: stream(Array.from({ length: n }, (_, i) => i)),
        watts: stream(Array.from({ length: n }, (_, i) => (cycle(i) ? 450 : 220))),
        // Same output, steadily rising heart rate.
        heartrate: stream(Array.from({ length: n }, (_, i) => (cycle(i) ? 170 : 140) + Math.floor(i / 120))),
        velocity_smooth: stream(Array.from({ length: n }, (_, i) => (cycle(i) ? 4.5 : 2.4))),
      },
      'vo2max',
    );
    // The steady-state reading must not be emitted on an interval session.
    assert.equal(s.signals.find((x) => x.code === 'high_drift'), undefined);
    const strain = s.signals.find((x) => x.code === 'interval_strain');
    assert.ok(strain, 'interval strain should be assessed');
    assert.equal(strain?.detail?.verdict, 'output-held');
  });

  it('blames the opening pace when output faded and recoveries were conventional', () => {
    const n = 2400;
    const cycle = (i: number) => Math.floor(i / 200) % 2 === 0;
    // Work reps decline 450 -> 390W across the set; recoveries match rep length.
    const workWatts = (i: number) => 450 - Math.floor(i / 400) * 12;
    const s = run(
      {
        time: stream(Array.from({ length: n }, (_, i) => i)),
        watts: stream(Array.from({ length: n }, (_, i) => (cycle(i) ? workWatts(i) : 220))),
        heartrate: stream(Array.from({ length: n }, (_, i) => (cycle(i) ? 170 : 140))),
        velocity_smooth: stream(Array.from({ length: n }, (_, i) => (cycle(i) ? 4.5 : 2.4))),
      },
      'vo2max',
    );
    const strain = s.signals.find((x) => x.code === 'interval_strain');
    assert.equal(strain?.detail?.verdict, 'opened-too-fast');
  });

  it('blames recovery length only when the recoveries were genuinely short', () => {
    const n = 1800;
    // 240s work / 60s recovery — well under the rep length it follows.
    const cycle = (i: number) => i % 300 < 240;
    const workWatts = (i: number) => 450 - Math.floor(i / 300) * 12;
    const s = run(
      {
        time: stream(Array.from({ length: n }, (_, i) => i)),
        watts: stream(Array.from({ length: n }, (_, i) => (cycle(i) ? workWatts(i) : 200))),
        heartrate: stream(Array.from({ length: n }, (_, i) => (cycle(i) ? 172 : 150))),
        velocity_smooth: stream(Array.from({ length: n }, (_, i) => (cycle(i) ? 4.5 : 2.2))),
      },
      'vo2max',
    );
    const strain = s.signals.find((x) => x.code === 'interval_strain');
    assert.equal(strain?.detail?.verdict, 'recovery-too-short');
  });

  it('still reads decoupling on a steady session', () => {
    const n = 1200;
    const s = run(
      {
        time: stream(Array.from({ length: n }, (_, i) => i)),
        heartrate: stream(Array.from({ length: n }, (_, i) => 140 + Math.floor(i / 60))),
        velocity_smooth: stream(Array.from({ length: n }, () => 3)),
      },
      'base',
    );
    assert.ok(s.signals.find((x) => x.code === 'high_drift'));
    assert.equal(s.signals.find((x) => x.code === 'interval_strain'), undefined);
  });
});

describe('threshold banding and the structural lever', () => {
  // From real feedback: the note said 94% was "at the correct effort" but that
  // most of it sat in "the harder zone 4", and recommended shifting work into
  // Z3. Z4 IS the threshold zone — LT2 sits on the Z3/Z4 boundary — so that was
  // advice to stop doing the session. Z3 is tolerated as the climb-in, not aimed at.
  it('targets Z4 alone and tolerates Z3', () => {
    const inZ4 = run(steady(1200, 160), 'threshold');
    assert.deepEqual(inZ4.intentBand?.targetZones, [4]);
    assert.equal(inZ4.intentBand?.inBandPct, 100);

    const inZ3 = run(steady(1200, 140), 'threshold');
    // Tolerated, so not a fault — but honestly reported as 0% at threshold
    // rather than counted as on-target the way the old [3,4] band did.
    assert.equal(inZ3.intentBand?.inBandPct, 0);
    assert.equal(inZ3.intentBand?.acceptablePct, 100);
    assert.equal(inZ3.intentBand?.fault, 'none');
  });

  // The athlete faded and wanted a structural answer, which the config already
  // knew (1x20 becomes 2x10) but the model did not reach for.
  it('names a concrete split when a sustained threshold block fades', () => {
    const s = run(steady(1500, 160), 'threshold', {
      splits_standard: [
        { split: 1, distance: 1609, moving_time: 420, elapsed_time: 420, average_speed: 3.83 },
        { split: 2, distance: 1609, moving_time: 470, elapsed_time: 470, average_speed: 3.42 },
      ],
    });
    const sig = s.signals.find((x) => x.code === 'sustained_block_faded');
    assert.ok(sig, 'a faded sustained block should name the structural lever');
    assert.equal(sig?.detail?.inBandMin, 25);
    assert.equal(sig?.detail?.suggestReps, 3);
    assert.equal(sig?.detail?.suggestRepMin, 8);
  });

  it('stays quiet when the block held', () => {
    const s = run(steady(1500, 160), 'threshold', {
      splits_standard: [
        { split: 1, distance: 1609, moving_time: 470, elapsed_time: 470, average_speed: 3.42 },
        { split: 2, distance: 1609, moving_time: 420, elapsed_time: 420, average_speed: 3.83 },
      ],
    });
    assert.equal(s.signals.find((x) => x.code === 'sustained_block_faded'), undefined);
  });
});
