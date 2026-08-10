// Athlete profile persistence. Zones and FTP come from Strava when the
// profile:read_all scope is granted; max HR and threshold pace are entered once
// in setup, since Strava exposes neither in a usable form.
//
// localStorage only — no backend in v1 (see DESIGN.md).

import type { StravaAthleteZones } from './stravaTypes.ts';
import type { AthleteProfile } from './zones.ts';

const KEY = 'cardio.profile.v1';

interface StoredProfile {
  maxHr: number | null;
  thresholdPaceSecPerMi: number | null;
  ftp: number | null;
  zones: StravaAthleteZones | null;
}

const EMPTY: StoredProfile = { maxHr: null, thresholdPaceSecPerMi: null, ftp: null, zones: null };

export function loadProfile(): AthleteProfile {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as StoredProfile) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

export function saveProfile(profile: AthleteProfile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // Private browsing / quota — the app still works for this session.
  }
}

/** Setup is complete once we can judge effort at all: HR zones need either
 *  Strava zones or a max HR. Threshold pace and FTP are optional enrichments —
 *  their absence degrades specific blocks, not the whole card. */
export function isProfileReady(profile: AthleteProfile): boolean {
  return Boolean(profile.zones?.heart_rate?.zones?.length || profile.maxHr);
}
