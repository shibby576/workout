// Tests for prompt construction. The point is not prose quality — that is what
// the eval step is for — but that the brief is FAITHFUL: it must never present
// a number the athlete didn't produce, and must explicitly fence off metrics
// that weren't recorded so the model can't invent them.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildCoachPrompt } from './prompt.js';
import { structureSession } from './structuring.js';
import type { IntentType } from './sessionSummary.js';
import type { RawSession, StravaActivityDetail, StravaStreamSet } from './stravaTypes.js';
import type { AthleteProfile } from './zones.js';

const ATHLETE: AthleteProfile = {
  zones: null,
  ftp: null,
  runningFtp: null,
  maxHr: 190,
  thresholdPaceSecPerMi: 450,
};

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
    distance: 8046.72,
    moving_time: 2400,
    elapsed_time: 2450,
    ...over,
  };
}

function promptFor(streams: StravaStreamSet, intent: IntentType, over: Partial<StravaActivityDetail> = {}) {
  const raw: RawSession = { detail: detail(over), streams };
  return buildCoachPrompt(structureSession({ raw, intent, athlete: ATHLETE }));
}

function steady(n: number, hr: number): StravaStreamSet {
  return {
    time: stream(Array.from({ length: n }, (_, i) => i)),
    heartrate: stream(Array.from({ length: n }, () => hr)),
  };
}

describe('prompt faithfulness', () => {
  it('states the intended session type', () => {
    const p = promptFor(steady(600, 125), 'threshold');
    assert.match(p.user, /INTENDED SESSION TYPE: THRESHOLD/);
  });

  it('fences off metrics that were never recorded', () => {
    const p = promptFor(steady(600, 125), 'base'); // HR only, no power
    assert.match(p.user, /DATA NOT AVAILABLE \(never mention these\).*power/);
    assert.match(p.user, /No power was recorded\. Do not mention power\./);
    // And must not present a power figure anywhere.
    assert.doesNotMatch(p.user, /- Power:/);
  });

  it('omits heart rate entirely when there is none', () => {
    const p = promptFor(
      { time: stream(Array.from({ length: 600 }, (_, i) => i)) },
      'base',
    );
    assert.doesNotMatch(p.user, /- Heart rate:/);
    assert.match(p.user, /Do not mention heart rate/);
  });

  it('tells the model not to comment on effort when nothing could be banded', () => {
    const p = promptFor({ time: stream([0, 1, 2]) }, 'base');
    assert.match(p.user, /Intensity could not be judged at all/);
    assert.match(p.user, /Do not comment on effort level or zones/);
  });

  it('flags low confidence so the note does not imply precision', () => {
    const p = promptFor(steady(600, 125), 'base');
    assert.match(p.user, /LOW CONFIDENCE/);
    assert.match(p.user, /directional, not exact/);
  });

  it('passes sub-fault excursions through as nuance, not failure', () => {
    const n = 1000;
    const p = promptFor(
      {
        time: stream(Array.from({ length: n }, (_, i) => i)),
        heartrate: stream(Array.from({ length: n }, (_, i) => (i < 850 ? 125 : 160))),
      },
      'recovery',
    );
    assert.match(p.user, /Minor excursion/);
    assert.match(p.user, /reaching zone 4/);
    assert.match(p.user, /worth a mention/);
  });

  it('renders signals as prose rather than raw codes', () => {
    const p = promptFor(steady(600, 180), 'base');
    assert.doesNotMatch(p.user, /zone_mismatch/);
    assert.match(p.user, /Execution did NOT match the intent/);
  });

  it('marks the target zones in the time-in-zone line', () => {
    const p = promptFor(steady(600, 125), 'base');
    assert.match(p.user, /\* = target/);
    assert.match(p.user, /Z2\*/); // base targets Z2
  });

  it('says when banding covered only the work reps', () => {
    // Distances must differ, or these read as auto-laps and are rejected —
    // this is what real device laps look like when the athlete presses lap.
    const laps = [0, 1, 2, 3, 4, 5].map((i) => ({
      lap_index: i + 1,
      moving_time: 100,
      elapsed_time: 100,
      distance: i % 2 === 0 ? 800 : 300,
      average_speed: i % 2 === 0 ? 4.5 : 2.4,
      average_heartrate: i % 2 === 0 ? 178 : 130,
    }));
    const n = 600;
    const p = promptFor(
      {
        time: stream(Array.from({ length: n }, (_, i) => i)),
        heartrate: stream(Array.from({ length: n }, (_, i) => (Math.floor(i / 100) % 2 === 0 ? 178 : 130))),
      },
      'vo2max',
      { laps },
    );
    assert.match(p.user, /work reps only — recovery periods excluded/);
  });
});

describe('prompt system instructions', () => {
  it('pins the voice and length the athlete chose', () => {
    const p = promptFor(steady(600, 125), 'base');
    assert.match(p.system, /Direct and analytical/);
    assert.match(p.system, /2 to 4 sentences/);
    assert.match(p.system, /60 words maximum/);
    assert.match(p.system, /No pep talk/);
  });

  it('bans the filler that made early drafts wordy', () => {
    const p = promptFor(steady(600, 125), 'base');
    assert.match(p.system, /Terse\. Short declarative sentences\./);
    assert.match(p.system, /worth flagging/); // listed as a phrase to cut
    assert.match(p.system, /Mention a metric only if it changes the verdict or the advice/);
  });

  it('requires a prescriptive recommendation, not an inquiry', () => {
    const p = promptFor(steady(600, 125), 'base');
    assert.match(p.system, /a prescriptive recommendation\. This is required\./);
    assert.match(p.system, /hand the problem back/);
    assert.match(p.system, /a pace, a heart-rate ceiling/);
  });

  it('does not apply running logic to other sports', () => {
    const p = promptFor(steady(600, 130), 'base', { sport_type: 'Ride', type: 'Ride' });
    // Threshold pace is a running number; a ride should get no pace target at
    // all rather than one the note has to explain away.
    assert.doesNotMatch(p.user, /PACE VS TARGET/);
    assert.match(p.user, /this is not a run/);
    assert.match(p.user, /Average speed: .* mph/);
  });

  it('tells the model not to blame weather on an indoor session', () => {
    const p = promptFor(steady(600, 150), 'vo2max', {
      sport_type: 'HighIntensityIntervalTraining',
      type: 'Workout',
    });
    assert.match(p.user, /INDOOR\/GYM/);
    assert.match(p.user, /heat, terrain or weather/);
  });

  it('requires unfamiliar metrics to be explained rather than quoted', () => {
    const p = promptFor(steady(600, 125), 'base');
    assert.match(p.system, /aerobic decoupling, say what it means in plain words/);
    assert.match(p.system, /Never quote it bare/);
  });

  it('forbids inventing or recomputing numbers', () => {
    const p = promptFor(steady(600, 125), 'base');
    assert.match(p.system, /Never invent, estimate or recompute a number/);
    assert.match(p.system, /Use ONLY the facts in the brief/);
  });
});

describe('non-cardio sessions', () => {
  it('instructs the model to decline rather than coach', () => {
    const p = promptFor(steady(600, 140), 'vo2max', {
      sport_type: 'WeightTraining',
      type: 'WeightTraining',
    });
    assert.match(p.user, /NOT A CARDIO SESSION/);
    assert.match(p.user, /Do not write a coaching note/);
    assert.match(p.system, /reviews cardio only/);
  });

  it('still treats recognised cardio sports normally', () => {
    for (const sport of ['Run', 'Ride', 'Swim', 'Hike', 'Rowing', 'Elliptical']) {
      const p = promptFor(steady(600, 140), 'base', { sport_type: sport, type: sport });
      assert.doesNotMatch(p.user, /NOT A CARDIO SESSION/, `${sport} should be supported`);
    }
  });
});

describe('metrics that are not findings', () => {
  it('labels negligible decoupling so it is not reported as drift', () => {
    // A real note claimed heart rate "drifted upward" on a session with 2.3%
    // decoupling, which the card itself calls well-controlled.
    const n = 600;
    const p = promptFor(
      {
        time: stream(Array.from({ length: n }, (_, i) => i)),
        heartrate: stream(Array.from({ length: n }, () => 150)),
        velocity_smooth: stream(Array.from({ length: n }, () => 3)),
      },
      'threshold',
    );
    assert.match(p.user, /AEROBIC DECOUPLING: .*NEGLIGIBLE/);
    assert.match(p.user, /Do not describe this as drift/);
  });

  it('does not invite commentary on ordinary recoveries', () => {
    const p = promptFor(steady(600, 150), 'threshold');
    assert.match(p.system, /Only comment on the recovery periods if the brief explicitly flags them/);
    assert.match(p.system, /normal recoveries are what an interval session is\n  supposed to have/);
  });

  it('forbids inventing a mechanism between unrelated facts', () => {
    const p = promptFor(steady(600, 150), 'threshold');
    assert.match(p.system, /Do not invent a mechanism/);
    assert.match(p.system, /A wrong explanation is worse than no explanation/);
  });
});

describe('zone boundaries in the brief', () => {
  // From real feedback: the note told the athlete to keep heart rate "below 150"
  // on a recovery run whose target zone tops out at 114. The brief carried no bpm
  // bounds at all, so the model interpolated one between the average and the max.
  // The bounds were in the SessionSummary the whole time and simply unrendered.
  it('states the target band in bpm and names the ceiling', () => {
    const p = promptFor(steady(600, 120), 'recovery');
    // 60% of a 190 max — the top of Z1, not the top of the tolerated Z2.
    assert.match(p.user, /That band is anything up to 114 bpm/);
    assert.match(p.user, /A ceiling you recommend must be 114 bpm/);
    assert.doesNotMatch(p.user, /A floor you recommend/);
  });

  it('names the floor, not a ceiling, where the top zone has no bound', () => {
    const p = promptFor(steady(600, 175), 'vo2max');
    assert.match(p.user, /has no upper bound/);
    assert.match(p.user, /A floor you recommend must be \d+ bpm/);
    assert.doesNotMatch(p.user, /A ceiling you recommend/);
  });

  it('names both ends on a both-sided band', () => {
    const p = promptFor(steady(600, 160), 'threshold');
    assert.match(p.user, /That band is \d+–\d+ bpm/);
    assert.match(p.user, /A ceiling you recommend must be/);
    assert.match(p.user, /A floor you recommend must be/);
  });

  it('forbids inventing a heart-rate number', () => {
    const p = promptFor(steady(600, 120), 'recovery');
    assert.match(p.system, /Never state a heart-rate or power number that is not written in the brief/);
    assert.match(p.system, /Do not\n  interpolate one from the average and the max/);
  });
});
