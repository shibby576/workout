#!/usr/bin/env node
// Capture a real Strava session as an eval fixture.
//
//   node scripts/capture-fixture.mjs <activityId> [--token <accessToken>]
//
// Activity data is private, so this needs YOUR Strava access token. Either pass
// --token or set STRAVA_ACCESS_TOKEN. The quickest way to get one: connect in
// the running app, then copy the `strava_access_token` cookie value from
// devtools. (Tokens expire in ~6h; the app refreshes them, this script doesn't.)
//
// GPS is never requested or written — latlng is excluded from the stream keys
// so committed fixtures can't leak home addresses.

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const STREAM_KEYS = 'time,heartrate,velocity_smooth,watts,cadence,altitude,distance,moving,grade_smooth';
const OUT_DIR = 'evals/fixtures';

function parseArgs(argv) {
  const args = argv.slice(2);
  const tokenIdx = args.indexOf('--token');
  const token = tokenIdx >= 0 ? args[tokenIdx + 1] : process.env.STRAVA_ACCESS_TOKEN;
  const id = args.find((a) => /^\d+$/.test(a));
  return { id, token };
}

async function get(path, token) {
  const res = await fetch(`https://www.strava.com/api/v3${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Strava ${res.status} on ${path}: ${await res.text()}`);
  }
  return res.json();
}

// Defensive: strip anything location-bearing even if Strava adds fields later.
function scrub(detail) {
  const {
    start_latlng: _s, end_latlng: _e, map: _m, segment_efforts: _se, ...rest
  } = detail;
  return rest;
}

const { id, token } = parseArgs(process.argv);

if (!id || !token) {
  console.error('Usage: node scripts/capture-fixture.mjs <activityId> [--token <accessToken>]');
  console.error('       (or set STRAVA_ACCESS_TOKEN)');
  process.exit(1);
}

const [detail, streams] = await Promise.all([
  get(`/activities/${id}`, token),
  get(`/activities/${id}/streams?keys=${STREAM_KEYS}&key_by_type=true`, token),
]);

await mkdir(OUT_DIR, { recursive: true });
const file = join(OUT_DIR, `${id}.json`);
await writeFile(file, `${JSON.stringify({ detail: scrub(detail), streams }, null, 2)}\n`);

const kinds = Object.keys(streams).join(', ');
console.log(`Wrote ${file}`);
console.log(`  ${detail.name} — ${detail.sport_type}, ${Math.round(detail.moving_time / 60)} min`);
console.log(`  streams: ${kinds || '(none)'}`);
console.log(`  laps: ${detail.laps?.length ?? 0}, device_watts: ${detail.device_watts ?? false}`);
