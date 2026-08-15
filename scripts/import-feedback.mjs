#!/usr/bin/env node
// Turn feedback exported from the app into eval cases.
//
//   npx tsx scripts/import-feedback.mjs ~/Downloads/cardio-feedback.json
//
// Each rated note carries the SessionSummary it was generated from, so a case
// can be replayed against any model with no Strava call and no token — which
// matters because access tokens expire within hours of the run that produced
// the complaint.
//
// Writes evals/feedback-cases/<activityId>-<intent>.json and prints what the
// athlete said, so the comments can be read in one place.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const src = process.argv[2];
if (!src) {
  console.error('Usage: npx tsx scripts/import-feedback.mjs <cardio-feedback.json>');
  process.exit(1);
}

const OUT = 'evals/feedback-cases';
const { entries } = JSON.parse(await readFile(src, 'utf8'));
if (!Array.isArray(entries) || entries.length === 0) {
  console.error('No entries in that file.');
  process.exit(1);
}

await mkdir(OUT, { recursive: true });

let bad = 0;
for (const e of entries) {
  const id = `${String(e.activityId).replace(/^strava-/, '')}-${e.intent}`;
  await writeFile(
    join(OUT, `${id}.json`),
    `${JSON.stringify(
      {
        id,
        activityName: e.activityName,
        intent: e.intent,
        verdict: e.verdict,
        comment: e.comment,
        ratedAt: e.at,
        modelThatWrote: e.model,
        noteAsWritten: e.note,
        // The exact input, so the case is replayable.
        summary: e.summary,
      },
      null,
      2,
    )}\n`,
  );
  if (e.verdict === 'bad') bad++;
  console.log(`${e.verdict === 'bad' ? '✗' : '✓'} ${id}  ${e.activityName}`);
  if (e.comment) console.log(`    "${e.comment}"`);
}

console.log(`\n${entries.length} case(s) written to ${OUT}/ — ${bad} flagged as off.`);
console.log('Each carries its SessionSummary, so they can be replayed without Strava.');
