// Unit tests for the structuring step. Run: npm test
//
// Synthetic streams are built to order so each behaviour is tested in
// isolation — real fixtures (captured via scripts/capture-fixture.mjs) will
// back these up once real sessions are pulled.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { structureSession } from './structuring.ts';
import type { StructuringInput } from './structuring.ts';
import type { AthleteProfile } from './zones.ts';
import type { RawSession, StravaActivityDetail, StravaStreamSet } from './stravaTypes.ts';

const ATHLETE: AthleteProfile = { zones: null, ftp: 250, maxHr: 190, thresholdPaceSecPerMi: 420 }; // 7:00/mi
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

  it('reports high confidence when banding on power', () => {
    const streams: StravaStreamSet = {
      time: stream(Array.from({ length: 600 }, (_, i) => i)),
      heartrate: stream(Array.from({ length: 600 }, () => 150)),
      watts: stream(Array.from({ length: 600 }, () => 160)), // Z2
    };
    const s = structureSession({
      raw: { detail: detail({ device_watts: true }), streams },
      intent: 'base',
      athlete: ATHLETE,
    });
    assert.equal(s.intentBand?.primaryMetric, 'power');
    assert.equal(s.intentBand?.confidence, 'high');
    assert.equal(s.availability.powerSource, 'meter');
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
});
