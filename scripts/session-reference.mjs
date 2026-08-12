#!/usr/bin/env node
// Writes a reference card for every case in an eval run: the Strava link plus
// the computed facts, so a note can be judged against what the session actually
// was without digging through results.json.
//
//   node --experimental-strip-types scripts/session-reference.mjs evals/runs/<stamp>

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { structureSession } from '../src/cardio/structuring.ts';

const runDir = process.argv[2];
if (!runDir) {
  console.error('Usage: node --experimental-strip-types scripts/session-reference.mjs evals/runs/<stamp>');
  process.exit(1);
}

const spec = JSON.parse(await readFile('evals/cases.json', 'utf8'));

const pace = (s) => (s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : '—');
const dur = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.round(s % 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
};

const out = ['# Session reference', '', 'What each eval case actually was. Judge the note against this.', ''];

for (const c of spec.cases) {
  const raw = JSON.parse(await readFile(`evals/fixtures/${c.fixture}.json`, 'utf8'));
  const s = structureSession({ raw, intent: c.intent, athlete: { ...spec.athlete, ...(c.athlete ?? {}) } });
  const d = raw.detail;

  out.push(`## ${c.id}${c.mismatch ? '  ⚠️ deliberate mismatch' : ''}`);
  out.push('');
  out.push(`**"${d.name}"** · ${d.sport_type} · ${String(d.start_date_local).slice(0, 10)}`);
  out.push(`<https://www.strava.com/activities/${c.fixture}>`);
  out.push('');
  out.push(`**Labelled as:** ${c.intent}${c.mismatch ? '  — *this is deliberately wrong; the note should say so*' : ''}`);
  out.push('');
  out.push('| | |');
  out.push('| --- | --- |');
  out.push(`| Duration | ${dur(s.duration.movingSec)} moving |`);
  out.push(`| Distance | ${s.distance ? `${s.distance.miles} mi` : '— (no distance recorded)'} |`);
  out.push(`| Avg pace | ${s.pace ? `${pace(s.pace.avgPaceSecPerMi)}/mi` : '—'} |`);
  if (s.heartRate) out.push(`| Heart rate | ${s.heartRate.avg} avg, ${s.heartRate.max} max |`);
  if (s.power) out.push(`| Power | ${s.power.avgWatts}W avg${s.power.zoneSeconds ? '' : ' (no threshold — not banded)'} |`);
  if (s.drift) out.push(`| Drift | ${s.drift.decouplingPct}% |`);
  out.push(
    `| Structure | ${s.structure ? `${s.structure.workReps} work reps (${s.structure.source})${s.structure.hillFinish ? `, climb home excluded (${s.structure.hillFinish.gradePct}%)` : ''}` : 'steady, no intervals'} |`,
  );
  if (s.intentBand) {
    const b = s.intentBand;
    out.push(`| Verdict | ${b.fault === 'none' ? 'on target' : b.fault} — ${b.inBandPct}% in Z${b.targetZones.join('/')} by ${b.primaryMetric} (${b.confidence} confidence) |`);
  } else {
    out.push('| Verdict | could not be banded |');
  }
  if (s.paceTarget) {
    out.push(`| Pace vs target | ran ${pace(s.paceTarget.actualSecPerMi)}, target ${pace(s.paceTarget.targetFastSecPerMi)}–${pace(s.paceTarget.targetSlowSecPerMi)} → ${s.paceTarget.verdict} |`);
  }
  out.push('');
  out.push(`**Signals:** ${s.signals.map((x) => x.code).join(', ')}`);
  out.push('');
  out.push(`**This case tests:** ${c.tests}`);
  out.push('');
  out.push('---');
  out.push('');
}

const path = join(runDir, 'sessions.md');
await writeFile(path, `${out.join('\n')}\n`);
console.log(`Wrote ${path}`);
