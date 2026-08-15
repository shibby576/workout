#!/usr/bin/env node
// Generate a coach's note from a saved fixture — the prompt-iteration loop.
//
//   Print the exact prompt the model would see, no API call:
//     npx tsx scripts/generate-note.mjs \
//       --fixture evals/fixtures/19574288003.json --intent recovery --dry-run
//
//   Generate for real (needs OPENROUTER_API_KEY):
//     npx tsx scripts/generate-note.mjs \
//       --fixture evals/fixtures/19574288003.json --intent recovery
//
//   Compare models, or sample the same model repeatedly:
//     ... --model deepseek/deepseek-chat  ... --runs 3
//
// Options: --max-hr, --threshold-pace, --running-ftp, --ftp

import { readFile } from 'node:fs/promises';
import { buildCoachPrompt } from '../src/cardio/prompt.ts';
import { DEFAULT_MODEL, openRouterProvider } from '../src/cardio/provider.ts';
import { structureSession } from '../src/cardio/structuring.ts';

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
const has = (name) => process.argv.includes(`--${name}`);

function parsePace(v) {
  if (!v) return null;
  const m = /^(\d+):([0-5]\d)$/.exec(v.trim());
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const fixture = arg('fixture');
const intent = arg('intent', 'base');
if (!fixture) {
  console.error('Usage: --fixture <path> [--intent base] [--dry-run] [--model id] [--runs n]');
  process.exit(1);
}

const raw = JSON.parse(await readFile(fixture, 'utf8'));
const summary = structureSession({
  raw,
  intent,
  athlete: {
    zones: null,
    ftp: arg('ftp') ? Number(arg('ftp')) : null,
    runningFtp: arg('running-ftp') ? Number(arg('running-ftp')) : null,
    maxHr: arg('max-hr') ? Number(arg('max-hr')) : 190,
    thresholdPaceSecPerMi: parsePace(arg('threshold-pace')),
  },
});

const prompt = buildCoachPrompt(summary);

if (has('dry-run')) {
  console.log('=============== SYSTEM ===============');
  console.log(prompt.system);
  console.log('\n=============== USER =================');
  console.log(prompt.user);
  console.log('\n======================================');
  console.log(`(${prompt.system.length + prompt.user.length} chars total)`);
  process.exit(0);
}

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error('OPENROUTER_API_KEY is not set. Use --dry-run to inspect the prompt without calling a model.');
  process.exit(1);
}

const model = arg('model', DEFAULT_MODEL);
const runs = Number(arg('runs', '1'));
const provider = openRouterProvider(apiKey);

console.log(`${summary.activity.name} — intent: ${intent} — model: ${model}\n`);
for (let i = 0; i < runs; i++) {
  const t0 = Date.now();
  try {
    const r = await provider.generate({ ...prompt, model });
    const words = r.text.split(/\s+/).length;
    const sentences = r.text.split(/[.!?]+\s/).filter(Boolean).length;
    if (runs > 1) console.log(`--- run ${i + 1} ---`);
    console.log(r.text);
    console.log(
      `\n[${Date.now() - t0}ms · ${words} words · ~${sentences} sentences · ${r.promptTokens ?? '?'}→${r.completionTokens ?? '?'} tokens]\n`,
    );
  } catch (err) {
    console.error(`run ${i + 1} failed:`, err.message);
  }
}
