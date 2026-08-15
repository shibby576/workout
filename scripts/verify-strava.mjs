#!/usr/bin/env node
// Verify the Strava integration against real data: what came back, and what
// the structuring step made of it.
//
//   Live (needs your token):
//     npx tsx scripts/verify-strava.mjs --token <t>
//     npx tsx scripts/verify-strava.mjs --token <t> --id 19642518909 --intent vo2max
//
//   Offline (a fixture captured earlier):
//     npx tsx scripts/verify-strava.mjs --fixture evals/fixtures/19642518909.json --intent vo2max
//
// Options: --max-hr 190  --threshold-pace 7:30  --ftp 250
//
// With no --id, it lists your recent cardio activities and verifies the most
// recent one. Getting a token: connect in the app, then copy the
// `strava_access_token` cookie from devtools (they last ~6h).

import { readFile } from 'node:fs/promises';
import { structureSession } from '../src/cardio/structuring.ts';

const API = 'https://www.strava.com/api/v3';
const STREAM_KEYS = 'time,heartrate,velocity_smooth,watts,cadence,altitude,distance,moving,grade_smooth';
const CARDIO = new Set([
  'Run', 'TrailRun', 'VirtualRun', 'Ride', 'VirtualRide', 'GravelRide',
  'MountainBikeRide', 'Swim', 'Walk', 'Hike', 'Rowing', 'Elliptical', 'StairStepper',
]);

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function parsePace(v) {
  if (!v) return null;
  const m = /^(\d+):([0-5]\d)$/.exec(v.trim());
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const ok = (s) => `  \x1b[32m✓\x1b[0m ${s}`;
const warn = (s) => `  \x1b[33m!\x1b[0m ${s}`;
const bad = (s) => `  \x1b[31m✗\x1b[0m ${s}`;
const head = (s) => `\n\x1b[1m${s}\x1b[0m`;

async function get(path, token) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const limit = res.headers.get('x-ratelimit-usage');
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`${res.status} ${path}: ${body.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  return { data: await res.json(), limit };
}

const token = arg('token', process.env.STRAVA_ACCESS_TOKEN);
const fixture = arg('fixture');
const intent = arg('intent', 'base');
const athlete = {
  zones: null,
  ftp: arg('ftp') ? Number(arg('ftp')) : null,
  // Running power threshold — separate from cycling FTP, see zones.ts.
  runningFtp: arg('running-ftp') ? Number(arg('running-ftp')) : null,
  maxHr: arg('max-hr') ? Number(arg('max-hr')) : 190,
  thresholdPaceSecPerMi: parsePace(arg('threshold-pace')),
};

if (!token && !fixture) {
  console.error('Need --token <accessToken> (or STRAVA_ACCESS_TOKEN), or --fixture <path>.');
  process.exit(1);
}

let raw;

if (fixture) {
  console.log(head(`Fixture: ${fixture}`));
  raw = JSON.parse(await readFile(fixture, 'utf8'));
  console.log(ok('loaded'));
} else {
  // --- auth + scope ---
  console.log(head('Connection'));
  let me;
  try {
    me = (await get('/athlete', token)).data;
    console.log(ok(`authenticated as ${me.firstname ?? '(unknown)'} (athlete ${me.id})`));
  } catch (e) {
    console.log(bad(`token rejected — ${e.message}`));
    console.log('    Tokens expire in ~6h. Reconnect in the app and copy a fresh one.');
    process.exit(1);
  }

  console.log(head('Profile (needs profile:read_all)'));
  try {
    const zones = (await get('/athlete/zones', token)).data;
    athlete.zones = zones;
    const hr = zones?.heart_rate?.zones;
    if (hr?.length) {
      console.log(ok(`HR zones from Strava (custom_zones: ${zones.heart_rate.custom_zones}) — ${hr.map((z) => `${z.min}-${z.max === -1 ? '∞' : z.max}`).join(', ')}`));
    } else {
      console.log(warn('no HR zones set in Strava — falling back to max-HR estimate'));
    }
    if (zones?.power?.zones?.length) console.log(ok(`power zones present (${zones.power.zones.length} zones)`));
  } catch (e) {
    console.log(warn(`could not read zones (${e.status ?? '?'}) — scope may not be granted; using max-HR estimate`));
    console.log('    Reconnect in the app to re-consent with profile:read_all.');
  }
  if (me.ftp) {
    athlete.ftp = athlete.ftp ?? me.ftp;
    console.log(ok(`FTP ${me.ftp}W — power sessions will band on power`));
  } else {
    console.log(warn('no FTP on the athlete — power banding unavailable'));
  }

  // --- activity selection ---
  let id = arg('id');
  console.log(head('Recent cardio activities'));
  const { data: list, limit } = await get('/athlete/activities?per_page=30', token);
  const cardio = list.filter((a) => CARDIO.has(a.sport_type ?? a.type ?? ''));
  console.log(ok(`${cardio.length} cardio of ${list.length} recent activities`));
  cardio.slice(0, 8).forEach((a) => {
    console.log(`      ${a.id}  ${new Date(a.start_date_local).toISOString().slice(0, 10)}  ${(a.sport_type ?? a.type).padEnd(8)} ${String(a.name).slice(0, 34)}`);
  });
  if (limit) console.log(`    rate limit usage (15min,day): ${limit}`);
  if (!id) {
    if (!cardio.length) {
      console.log(bad('no cardio activities to verify'));
      process.exit(1);
    }
    id = String(cardio[0].id);
    console.log(`    no --id given, verifying most recent: ${id}`);
  }

  // --- the session pull ---
  console.log(head(`Session ${id}`));
  const { data: detail } = await get(`/activities/${id}`, token);
  console.log(ok(`detail: "${detail.name}" — ${detail.sport_type}, ${Math.round(detail.moving_time / 60)}min`));
  console.log(detail.laps?.length ? ok(`laps: ${detail.laps.length}`) : warn('no laps — interval detection will not run'));
  console.log(detail.splits_standard?.length ? ok(`splits_standard: ${detail.splits_standard.length}`) : warn('no per-mile splits'));
  console.log(detail.device_watts ? ok('device_watts: true (real power meter)') : warn(`device_watts: ${detail.device_watts ?? 'absent'}`));

  let streams = {};
  try {
    streams = (await get(`/activities/${id}/streams?keys=${STREAM_KEYS}&key_by_type=true&series_type=time`, token)).data;
    const present = Object.keys(streams);
    console.log(ok(`streams: ${present.join(', ') || '(none)'}`));
    for (const [k, v] of Object.entries(streams)) {
      console.log(`      ${k.padEnd(15)} n=${String(v.data?.length).padEnd(6)} resolution=${v.resolution} series=${v.series_type}`);
    }
    if (!streams.time) console.log(bad('no time stream — zone times cannot be computed'));
    if (!streams.heartrate) console.log(warn('no heartrate stream'));
    if (streams.moving) {
      const t = typeof streams.moving.data?.[0];
      console.log(t === 'boolean' ? ok("moving stream is boolean, as assumed") : bad(`moving stream is ${t}, expected boolean`));
    }
  } catch (e) {
    console.log(warn(`no streams (${e.status ?? '?'}) — expected for manual/stationary entries; degrading to summary`));
  }
  raw = { detail, streams };
}

// --- structuring ---
console.log(head(`Structuring (intent: ${intent})`));
const s = structureSession({ raw, intent, athlete });

console.log(`  availability: ${JSON.stringify(s.availability)}`);
console.log(`  duration    : ${Math.round(s.duration.movingSec / 60)}min moving`);
console.log(`  distance    : ${s.distance ? `${s.distance.miles} mi` : '—'}`);
console.log(`  pace        : ${s.pace ? `${fmtPace(s.pace.avgPaceSecPerMi)}/mi, ${s.pace.splits.length} splits` : '—'}`);
console.log(`  heart rate  : ${s.heartRate ? `avg ${s.heartRate.avg}, max ${s.heartRate.max}` : '—'}`);
if (s.heartRate) console.log(`  HR zone secs: ${JSON.stringify(s.heartRate.zoneSeconds)}`);
console.log(`  power       : ${s.power ? `avg ${s.power.avgWatts}W, NP ${s.power.normalizedWatts ?? '—'}${s.power.zoneSeconds ? '' : ' (no threshold set — not banded)'}` : '—'}`);
console.log(`  drift       : ${s.drift ? `${s.drift.decouplingPct}% (${s.drift.method})` : '—'}`);
console.log(`  structure   : ${s.structure ? `${s.structure.workReps} work reps from ${s.structure.source}, fade ${s.structure.sustainability?.fadePct ?? '—'}%` : 'steady (no intervals detected)'}`);
console.log(`  intent band : ${s.intentBand ? `${s.intentBand.inBandPct}% in Z${s.intentBand.targetZones.join('/')} by ${s.intentBand.primaryMetric}, scope=${s.intentBand.scope}, fault=${s.intentBand.fault}, confidence=${s.intentBand.confidence}` : 'NOT COMPUTED (no HR/power stream time)'}`);
console.log(`  pace target : ${s.paceTarget ? `${fmtPace(s.paceTarget.actualSecPerMi)} vs ${fmtPace(s.paceTarget.targetFastSecPerMi)}-${fmtPace(s.paceTarget.targetSlowSecPerMi)} → ${s.paceTarget.verdict}` : 'none (no threshold pace set — pass --threshold-pace)'}`);
console.log(`  signals     : ${s.signals.map((x) => x.code).join(', ')}`);

console.log(head('Sanity checks'));
const checks = [
  [s.duration.movingSec > 0, 'moving time present'],
  [!s.heartRate || sum(s.heartRate.zoneSeconds) <= s.duration.elapsedSec + 60, 'HR zone time does not exceed session length'],
  [!s.intentBand || s.intentBand.inBandPct >= 0 && s.intentBand.inBandPct <= 100, 'in-band % within 0-100'],
  [!s.structure || s.structure.workReps > 0, 'detected structure has at least one work rep'],
  [s.signals.length > 0, 'signals emitted'],
];
let failed = 0;
for (const [pass, label] of checks) {
  console.log(pass ? ok(label) : bad(label));
  if (!pass) failed++;
}
console.log(failed ? `\n\x1b[31m${failed} check(s) failed.\x1b[0m` : '\n\x1b[32mAll checks passed.\x1b[0m');

function sum(zs) {
  return Object.values(zs).reduce((a, b) => a + b, 0);
}
function fmtPace(sec) {
  if (!sec) return '—';
  return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
}
