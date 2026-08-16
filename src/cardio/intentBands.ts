// Intent → target-band configuration. This is the opinionated coaching core:
// for each intended session type, which zone band you're aiming for and which
// ways of missing it count as faults. Versioned so that a SessionSummary can
// record exactly which mapping produced its intentBand result — evals depend on
// this being reproducible.
//
// Zone model: the 5-zone scale (shared by HR and power; power's native 7-zone
// Coggan model is collapsed by merging Z5/Z6/Z7 → 5). Boundaries themselves come
// from the athlete's own Strava zones where available, else %HRmax estimates —
// this file only defines which zones each *intent* targets, not the bpm/watt
// cut-offs.
//
// Convention notes (why the faults are shaped this way):
//  - recovery/base: the amateur error is going too hard — drifting above the
//    aerobic band ("grey zone" training). Too easy is not a fault.
//  - threshold: a BOTH-sided band. Below Z3 = didn't reach the stimulus; into
//    Z5 = overcooked (threshold work must stay sustainable, ~at lactate
//    threshold — pushing to VO2 intensity ruins it).
//  - vo2max: Z5 IS the target, so "in Z5" is correct. Overcooking (sprinting
//    the reps) can't be seen as a zone once 5/6/7 are merged — it shows up as
//    rep-to-rep fade instead, so sustainability is emphasized here.

import type { HrZone, IntentType } from './sessionSummary.js';

export const INTENT_BAND_CONFIG_VERSION = '1';

export interface IntentBand {
  /** The zones you're aiming to spend the working time in. */
  targetZones: HrZone[];
  /** Easier-than-target zones that are acceptable, not faults (e.g. Z2 on a
   *  recovery day). Time here counts as neither in-band nor a fault. */
  tolerantZones: HrZone[];
  /** Is time BELOW the band a fault (missed the stimulus)? */
  belowIsFault: boolean;
  /** Is time ABOVE the band a fault (overcooked)? Note vo2max is false only
   *  because Z5 is the top of the collapsed model — its "too hard" is caught by
   *  sustainability, not zone. */
  aboveIsFault: boolean;
  /** Weight rep-to-rep sustainability heavily (hard interval intents), so a
   *  session that fades across reps is flagged even if zones look on-target. */
  emphasizeSustainability: boolean;
  /** Human rationale, kept with the config for the audit trail. */
  note: string;
}

// Target pace ranges per intent, as multipliers on THRESHOLD SPEED (higher =
// faster). Threshold pace ~= the pace you could hold for about an hour, and the
// ratios follow the standard Daniels-style relationships between easy /
// marathon / threshold / interval paces. Ratios (not fixed offsets) keep this
// correct across ability levels — 20s/mi means something different to a 6:00
// runner than a 12:00 one.
//
// Kept separate from the zone band because it answers a different question:
// zones say whether the *effort* was right, pace says whether the *speed* was.
// A run can be in the right HR zone but too slow, or on pace but over-cooked.
export interface PaceTarget {
  minSpeedRatio: number; // slow end of the range
  maxSpeedRatio: number; // fast end of the range
}

export const PACE_TARGETS: Record<IntentType, PaceTarget> = {
  recovery: { minSpeedRatio: 0.68, maxSpeedRatio: 0.78 },
  base: { minSpeedRatio: 0.75, maxSpeedRatio: 0.84 },
  threshold: { minSpeedRatio: 0.97, maxSpeedRatio: 1.03 },
  vo2max: { minSpeedRatio: 1.04, maxSpeedRatio: 1.1 },
};

// What each session type's STRUCTURE is for, and which levers change it.
//
// Without this the model only knows the target zones and paces, so whenever a
// session misses it reaches for the one lever it understands — pace. That
// produced a note telling the athlete to run SLOWER on a session whose problem
// was that heart rate never got high enough, which is the opposite of the fix.
// Structure is often the real lever, and it has to be stated.
export interface IntentStructure {
  /** The physiological point of the session. */
  purpose: string;
  /** How the session is normally built. */
  shape: string;
  /** Which levers actually change the outcome, in priority order. */
  levers: string;
}

export const INTENT_STRUCTURE: Record<IntentType, IntentStructure> = {
  recovery: {
    purpose: 'Promote blood flow and recovery without adding training stress.',
    shape: 'One continuous easy effort. Duration is modest; there are no reps.',
    levers:
      'Slow down, shorten, or walk the hills. There is no such thing as too easy here, so never recommend more intensity. A little heart-rate drift late in a long easy session is normal and not a problem on its own.',
  },
  base: {
    purpose:
      'Accumulate aerobic volume at low intensity. The adaptation comes from TIME at easy effort, not from speed.',
    shape:
      'One continuous steady effort at an even pace from the first mile. No reps, no surges, no fast finish.',
    levers:
      'Hold one pace for the whole run rather than drifting up. Start at target pace instead of easing into it. If holding target pace still drives heart rate above the band, the honest read is that easy pace is currently slower than expected — slow down further rather than pushing.',
  },
  threshold: {
    purpose:
      'Accumulate time at lactate threshold. Total time IN the band is what drives the adaptation, so volume at the right effort beats hitting an exact pace.',
    shape:
      'Either one sustained block (e.g. 1x20min) or a few long reps with short recoveries (e.g. 2x10min, 3x8min off 2min jog). Recoveries are short by design — the point is to keep lactate elevated, not to fully recover.',
    levers:
      'Change total time in the band, rep length, or recovery length. Splitting one long block into two shorter reps (1x20 becomes 2x10) is the standard fix when the single block cannot be held to the end. Going HARDER is almost never the fix: it shortens what can be sustained and defeats the session.',
  },
  vo2max: {
    purpose:
      'Accumulate time at or near VO2max. The adaptation needs the athlete to actually REACH that intensity and stay there, so time spent at the top end is what counts.',
    shape:
      'Repeated hard efforts of roughly 2-5 minutes with recoveries short enough that heart rate stays elevated (e.g. 6x2min off 90s, 5x3min off 2min).',
    levers:
      'Rep length and recovery length come first, pace second — but which way to move them depends entirely on what went wrong, and the two cases point in OPPOSITE directions. (a) Heart rate never REACHED the target band: heart rate takes 60-90 seconds to climb, so reps shorter than about 90 seconds end before it arrives, and the session reads easy however fast the running was. There the fix is longer reps or shorter/faster recoveries, never slower running. (b) Heart rate CLIMBED through the session (drift): that is accumulating strain, and shortening the recoveries would add to it. There the fix is longer or easier recoveries, fewer reps, or a slower work pace. Never prescribe shorter recoveries for a session that drifted upward.',
  },
};

export const INTENT_BANDS: Record<IntentType, IntentBand> = {
  recovery: {
    targetZones: [1],
    tolerantZones: [2],
    belowIsFault: false,
    aboveIsFault: true,
    emphasizeSustainability: false,
    note: 'Active recovery. Staying easy is the point; drifting hard defeats it.',
  },
  base: {
    targetZones: [2],
    tolerantZones: [1],
    belowIsFault: false,
    aboveIsFault: true,
    emphasizeSustainability: false,
    note: 'Aerobic base. Classic error is creeping into the Z3 grey zone.',
  },
  threshold: {
    targetZones: [3, 4],
    tolerantZones: [],
    belowIsFault: true,
    aboveIsFault: true,
    emphasizeSustainability: true,
    note: 'Sustainably hard at/near lactate threshold. Below Z3 misses the stimulus; into Z5 is overcooked.',
  },
  vo2max: {
    targetZones: [4, 5],
    tolerantZones: [],
    belowIsFault: true,
    aboveIsFault: false, // Z5 is the ceiling of the 5-zone model; overcooking shows as rep fade.
    emphasizeSustainability: true,
    note: 'Near-max intervals. Below Z4 misses the stimulus; overcooking shows as rep-to-rep fade, not zone.',
  },
};
