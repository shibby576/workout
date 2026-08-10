// Raw Strava payload shapes — only the fields the structuring step consumes.
// These are the *input* boundary: the API endpoints return these verbatim and
// the structuring module (step 2) turns them into a SessionSummary. Kept
// separate from SessionSummary so the two never leak into each other.

export interface StravaActivitySummary {
  id: number;
  name: string;
  sport_type: string; // 'Run' | 'TrailRun' | 'Ride' | 'Swim' | ...
  type: string; // legacy activity type (fallback for older activities)
  start_date_local: string; // ISO 8601, local
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain?: number; // meters
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  device_watts?: boolean; // true = real power meter, false = estimated
  has_heartrate?: boolean;
}

export interface StravaSplit {
  split: number; // 1-based
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  average_speed: number; // m/s
  average_heartrate?: number;
  elevation_difference?: number; // meters
}

export interface StravaLap {
  lap_index: number;
  moving_time: number;
  elapsed_time: number;
  distance: number; // meters
  average_speed: number; // m/s
  average_heartrate?: number;
  average_watts?: number;
  average_cadence?: number;
}

export interface StravaActivityDetail extends StravaActivitySummary {
  splits_standard?: StravaSplit[]; // per-mile
  splits_metric?: StravaSplit[]; // per-km
  laps?: StravaLap[];
  weighted_average_watts?: number; // ~ normalized power
  calories?: number;
}

export interface StravaStream {
  data: number[];
  series_type: string; // 'distance' | 'time'
  original_size: number;
  resolution: string; // 'low' | 'medium' | 'high'
}

// `moving` carries booleans rather than numbers.
export interface StravaMovingStream {
  data: boolean[];
  series_type: string;
  original_size: number;
  resolution: string;
}

// Response of the streams endpoint with key_by_type=true. Any stream may be
// absent depending on what the source device recorded.
export interface StravaStreamSet {
  time?: StravaStream;
  heartrate?: StravaStream;
  velocity_smooth?: StravaStream; // m/s → pace
  watts?: StravaStream;
  cadence?: StravaStream;
  altitude?: StravaStream;
  distance?: StravaStream;
  moving?: StravaMovingStream;
  grade_smooth?: StravaStream;
}

export interface StravaZoneRange {
  min: number; // -1 or 0 for the open lower bound of zone 1
  max: number; // -1 for the open upper bound of the top zone
}

export interface StravaAthleteZones {
  heart_rate?: { custom_zones: boolean; zones: StravaZoneRange[] };
  power?: { zones: StravaZoneRange[] };
}

// What /api/strava/profile returns. Either field may be null when the
// profile:read_all scope is absent — callers fall back to manual entry.
export interface StravaProfile {
  zones: StravaAthleteZones | null;
  ftp: number | null;
  // Highest max_heartrate seen across recent activities. Strava has no athlete
  // max-HR field, so this seeds the setup entry from real data.
  observedMaxHr: number | null;
}

// What /api/strava/session returns for a single activity.
export interface RawSession {
  detail: StravaActivityDetail;
  streams: StravaStreamSet;
}
