#!/usr/bin/env node
// Eval harness: generate a coach's note for every case, for one or more models.
//
//   node --experimental-strip-types scripts/run-eval.mjs
//   node --experimental-strip-types scripts/run-eval.mjs --models anthropic/claude-sonnet-5,deepseek/deepseek-chat
//   node --experimental-strip-types scripts/run-eval.mjs --runs 3 --set core
//
// Writes evals/runs/<timestamp>/ containing:
//   results.json  — every generation with its case and model
//   score-sheet.md — a blank sheet to score by hand against evals/RUBRIC.md
//
// Scoring is deliberately NOT automated here. The first pass is scored by hand
// against the rubric: it is how you find out whether the rubric itself
// discriminates. An LLM judge comes after, and is validated against the human
// scores rather than trusted in place of them.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildCoachPrompt } from '../src/cardio/prompt.ts';
import { DEFAULT_MODEL, openRouterProvider } from '../src/cardio/provider.ts';
import { structureSession } from '../src/cardio/structuring.ts';

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error('OPENROUTER_API_KEY is not set.');
  process.exit(1);
}

const spec = JSON.parse(await readFile('evals/cases.json', 'utf8'));
const models = arg('models', DEFAULT_MODEL).split(',').map((m) => m.trim()).filter(Boolean);
const runs = Number(arg('runs', '1'));
const setFilter = arg('set');
const cases = spec.cases.filter((c) => !setFilter || c.set === setFilter);

const provider = openRouterProvider(apiKey);
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = join('evals/runs', stamp);
await mkdir(outDir, { recursive: true });

console.log(`${cases.length} cases x ${models.length} model(s) x ${runs} run(s) = ${cases.length * models.length * runs} generations\n`);

const results = [];

for (const c of cases) {
  const raw = JSON.parse(await readFile(`evals/fixtures/${c.fixture}.json`, 'utf8'));
  const athlete = { ...spec.athlete, ...(c.athlete ?? {}) };
  const summary = structureSession({ raw, intent: c.intent, athlete });
  const prompt = buildCoachPrompt(summary);

  for (const model of models) {
    for (let r = 0; r < runs; r++) {
      const t0 = Date.now();
      try {
        const res = await provider.generate({ ...prompt, model });
        const words = res.text.split(/\s+/).filter(Boolean).length;
        results.push({
          case: c.id,
          set: c.set,
          fixture: c.fixture,
          intent: c.intent,
          activity: summary.activity.name,
          model,
          run: r + 1,
          note: res.text,
          words,
          ms: Date.now() - t0,
          promptTokens: res.promptTokens,
          completionTokens: res.completionTokens,
          // Kept so a scorer can check every claim against what the model was
          // actually told, without regenerating anything.
          brief: prompt.user,
        });
        console.log(`  ${c.id.padEnd(22)} ${model.padEnd(30)} run${r + 1}  ${words}w`);
      } catch (err) {
        results.push({ case: c.id, set: c.set, model, run: r + 1, error: String(err.message ?? err) });
        console.log(`  ${c.id.padEnd(22)} ${model.padEnd(30)} run${r + 1}  FAILED: ${err.message}`);
      }
    }
  }
}

await writeFile(join(outDir, 'results.json'), `${JSON.stringify({ spec: spec.version, models, runs, results }, null, 2)}\n`);

// --- blank scoring sheet -------------------------------------------------
const byCase = new Map();
for (const r of results) {
  if (!byCase.has(r.case)) byCase.set(r.case, []);
  byCase.get(r.case).push(r);
}

const lines = [
  `# Eval score sheet — ${stamp}`,
  '',
  `Models: ${models.join(', ')}`,
  '',
  'Score each note against `evals/RUBRIC.md`. 0 = fail, 1 = partial, 2 = pass.',
  'Faithfulness and domain are GATES — a 0 on either means the note is GATED',
  'regardless of the rest. Check every number in a note against the brief in',
  '`results.json` before scoring faithfulness.',
  '',
];

for (const [caseId, rows] of byCase) {
  const c = spec.cases.find((x) => x.id === caseId);
  lines.push(`## ${caseId}  *(${c.set}${c.mismatch ? ', deliberate mismatch' : ''})*`, '');
  // A note can't be judged without knowing what the session actually was.
  const first = rows.find((r) => !r.error);
  lines.push(
    `**"${first?.activity ?? '?'}"** labelled as **${c.intent}**${c.mismatch ? ' *(deliberately wrong — the note should say so)*' : ''} · <https://www.strava.com/activities/${c.fixture}>`,
    '',
    `See \`sessions.md\` for the full computed picture of this session.`,
    '',
  );
  lines.push(`**Tests:** ${c.tests}`, '');
  for (const r of rows) {
    if (r.error) {
      lines.push(`### ${r.model} — run ${r.run}`, '', `FAILED: ${r.error}`, '');
      continue;
    }
    lines.push(`### ${r.model} — run ${r.run}  *(${r.words} words)*`, '', '> ' + r.note.replace(/\n/g, '\n> '), '');
    lines.push(
      '| faithfulness | domain | prescriptive | calibration | concision | result |',
      '| --- | --- | --- | --- | --- | --- |',
      '|  |  |  |  |  |  |',
      '',
      'Notes: ',
      '',
    );
  }
}

await writeFile(join(outDir, 'score-sheet.md'), `${lines.join('\n')}\n`);

const ok = results.filter((r) => !r.error);
console.log(`\nWrote ${outDir}/results.json and score-sheet.md`);
if (ok.length) {
  console.log(`median words: ${ok.map((r) => r.words).sort((a, b) => a - b)[Math.floor(ok.length / 2)]}`);
}
