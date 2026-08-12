// Zone boundary resolution. The intent→band config (intentBands.ts) says which
// zones an intent targets; this file resolves what those zones actually mean in
// bpm and watts for a given athlete.
//
// Preference order is always "the athlete's own configured zones" over an
// estimate — a real max-HR-derived or FTP-derived boundary beats a formula.

import type { HrZone } from './sessionSummary';
import type { StravaAthleteZones } from './stravaTypes';

export interface AthleteProfile {
  zones: StravaAthleteZones | null; // from Strava, when profile:read_all is granted
  ftp: number | null; // CYCLING functional threshold power, watts (Strava's `ftp`)
  // Running threshold power (rFTPw / critical power), watts. A separate number
  // from cycling FTP and typically far higher for the same athlete — running
  // power meters report ~300-400W where that athlete's bike FTP might be 250.
  // Banding running power against a cycling FTP would put every easy run in Z5,
  // so the two are never interchanged.
  runningFtp: number | null;
  maxHr: number | null; // fallback for HR zones when Strava zones are absent
  // ~1-hour race pace, in seconds per mile. The anchor for pace targets;
  // Strava doesn't expose it, so it's entered once in setup.
  thresholdPaceSecPerMi: number | null;
}

export function isRunning(sportType: string): boolean {
  return /run/i.test(sportType);
}

export function isRide(sportType: string): boolean {
  return /ride|cycl/i.test(sportType);
}

/** Threshold power for the sport at hand, or null when we don't have one.
 *  Strava's `ftp` field is cycling-only. */
export function thresholdPowerFor(sportType: string, profile: AthleteProfile): number | null {
  return /ride|cycl/i.test(sportType) ? profile.ftp : profile.runningFtp;
}

export interface ZoneBoundsBpm {
  minBpm: number;
  maxBpm: number;
}
export interface ZoneBoundsWatts {
  minWatts: number;
  maxWatts: number;
}

export const ZONES: HrZone[] = [1, 2, 3, 4, 5];

// Standard 5-zone %HRmax model — the consumer convention (Strava/Garmin/Polar)
// and the fallback when the athlete hasn't configured zones in Strava.
const HR_PCT_MAX: Record<HrZone, number> = { 1: 0.6, 2: 0.7, 3: 0.8, 4: 0.9, 5: Infinity };

// Coggan %FTP power zones, collapsed 7 -> 5 by merging Z5/Z6/Z7 (see DESIGN.md):
// Z1 active recovery <=55, Z2 endurance 56-75, Z3 tempo 76-90, Z4 threshold
// 91-105, Z5 VO2max and above >105.
const POWER_PCT_FTP: Record<HrZone, number> = { 1: 0.55, 2: 0.75, 3: 0.9, 4: 1.05, 5: Infinity };

function boundsFromUpperEdges<T>(edges: Record<HrZone, number>, make: (min: number, max: number) => T): Record<HrZone, T> {
  let lower = 0;
  const out = {} as Record<HrZone, T>;
  for (const z of ZONES) {
    const upper = edges[z];
    out[z] = make(lower, upper);
    lower = upper;
  }
  return out;
}

export interface ResolvedHrZones {
  bounds: Record<HrZone, ZoneBoundsBpm>;
  source: 'strava' | 'estimated-from-maxhr';
}

/** Athlete HR zones from Strava if configured, else estimated from max HR.
 *  Returns null when we have neither — HR banding is then impossible. */
export function resolveHrZones(profile: AthleteProfile): ResolvedHrZones | null {
  const stravaZones = profile.zones?.heart_rate?.zones;
  if (stravaZones && stravaZones.length >= 5) {
    const bounds = {} as Record<HrZone, ZoneBoundsBpm>;
    ZONES.forEach((z, i) => {
      const range = stravaZones[i];
      // Strava marks the open top bound as -1.
      bounds[z] = { minBpm: Math.max(0, range.min), maxBpm: range.max === -1 ? Infinity : range.max };
    });
    return { bounds, source: 'strava' };
  }

  if (profile.maxHr && profile.maxHr > 0) {
    const maxHr = profile.maxHr;
    return {
      bounds: boundsFromUpperEdges(HR_PCT_MAX, (min, max) => ({
        minBpm: Math.round(min * maxHr),
        maxBpm: max === Infinity ? Infinity : Math.round(max * maxHr),
      })),
      source: 'estimated-from-maxhr',
    };
  }

  return null;
}

export interface ResolvedPowerZones {
  bounds: Record<HrZone, ZoneBoundsWatts>;
  ftp: number;
}

/** Power zones from a threshold power (Coggan %FTP, collapsed to 5). Null
 *  without one — we don't guess, since an invented threshold would silently
 *  skew every band. Pass the sport-appropriate value (see thresholdPowerFor). */
export function resolvePowerZones(threshold: number | null): ResolvedPowerZones | null {
  if (!threshold || threshold <= 0) return null;
  const ftp = threshold;
  return {
    bounds: boundsFromUpperEdges(POWER_PCT_FTP, (min, max) => ({
      minWatts: Math.round(min * ftp),
      maxWatts: max === Infinity ? Infinity : Math.round(max * ftp),
    })),
    ftp,
  };
}

/** Which zone a value falls in, given resolved bounds. Values at a boundary
 *  belong to the higher zone (bounds are [min, max)). */
export function zoneOf(value: number, bounds: Record<HrZone, { minBpm: number; maxBpm: number } | ZoneBoundsWatts>): HrZone {
  for (const z of ZONES) {
    const b = bounds[z] as { maxBpm?: number; maxWatts?: number };
    const max = b.maxBpm ?? b.maxWatts ?? Infinity;
    if (value < max) return z;
  }
  return 5;
}
