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

import type { HrZone, IntentType } from './sessionSummary';

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
