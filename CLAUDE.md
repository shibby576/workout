# Working in this repo

Two independent apps share one deploy:

- **`/`** — the original routine tracker (`src/App.tsx`, `src/components/`,
  `src/state/`, `src/utils/`). Untouched by the cardio work; do not refactor it
  to suit the cardio app.
- **`/cardio.html`** — the cardio feedback app (`src/cardio/`, `api/coach/`).
  Pick a cardio session, state what it was meant to be, get a coach's note.

They share only the Strava API routes (`api/strava/`) and the design tokens
(`src/styles/tokens.css`).

Read `src/cardio/DESIGN.md` before changing cardio behaviour — it records why
each decision was made. `cardio-feedback-app-spec.md` is the living product
spec. `src/cardio/SETUP.md` covers deployment and the scripts.

## Constraints that will bite you

These were each discovered by breaking production. They pass every local check.

1. **`api/` imports need `.js` extensions.** Vercel compiles these to
   JavaScript and `package.json` sets `"type": "module"`, so the output is ESM
   and requires explicit extensions. Extensionless fails with
   `ERR_MODULE_NOT_FOUND`; `.ts` fails because the file is gone after
   compilation. TypeScript maps `.js` back to the `.ts` source, so `.js` is the
   correct thing to write. The same applies to any `src/cardio/` module an API
   route imports at runtime.
2. **Run TypeScript locally with `tsx`, not `node --experimental-strip-types`.**
   Type stripping cannot resolve extensionless or `.js`-mapped specifiers.
   `npm test` and every script in `scripts/` use tsx.
3. **The PWA service worker rewrites navigations to `index.html`.**
   `/cardio.html` and `/api/` are on the navigation denylist in
   `vite.config.ts`; without that the cardio app is served the tracker, and the
   OAuth callback never reaches the server.
4. **`cardio.html` needs its own manifest.** vite-plugin-pwa injects the
   tracker's manifest (whose `start_url` is `/`) into every HTML entry, so an
   installed icon would open the tracker. A `closeBundle` hook strips it —
   `transformIndexHtml` runs too early to intercept the injection.
5. **A deploy is the only real test of the above.** Fixtures, unit tests, tsc,
   esbuild and even invoking handlers locally all agreed while production was
   broken. When something fails on Vercel, read the runtime log before
   theorising.

## Commands

```bash
npm test          # tsx + node:test
npm run build     # both entry points
npm run lint      # oxlint
npx tsc --noEmit -p tsconfig.app.json    # app
npx tsc --noEmit -p api/tsconfig.json    # serverless
npx tsc --noEmit -p tsconfig.test.json   # tests
```

Scripts (all need `NODE_USE_ENV_PROXY=1` in sandboxes where Node's fetch
ignores the proxy):

```bash
npx tsx scripts/generate-note.mjs --fixture <f> --intent <i> [--dry-run]
npx tsx scripts/run-eval.mjs [--models a,b] [--runs n]
npx tsx scripts/verify-strava.mjs --fixture <f> --intent <i>
npx tsx scripts/import-feedback.mjs <cardio-feedback.json>
node scripts/capture-fixture.mjs <activityId> --token <t>
```

## The architecture that matters

```
Strava ──▶ api/strava/* ──▶ structuring.ts ──▶ SessionSummary ──▶ prompt.ts ──▶ model
           (raw passthrough)  (100% code)       (the contract)     (narration only)
```

**Everything quantitative is computed; the model only narrates.** This is the
single most important rule. Every time a judgement was left to the model it got
it wrong — it recommended running *slower* on a session whose heart rate was too
*low*, and invented "long, slow recoveries" that did not exist. Every time the
judgement was computed and handed over as a signal, the note was right.

So: when a note says something wrong, the fix is usually a new **signal** in
`structuring.ts`, not a longer prompt.

- `sessionSummary.ts` — the versioned contract. Changing it changes evals.
- `intentBands.ts` — the opinionated coaching config: target zones per intent,
  asymmetric faults, pace-target ratios, and what each session type is *for*.
- `structuring.ts` — streams to `SessionSummary`, including interval detection.
- `prompt.ts` — renders the brief. Unavailable metrics are explicitly fenced.
- `provider.ts` — generation behind an interface; model is a config string.

## Domain rules worth knowing

- **Auto-laps are not intervals.** This athlete never presses lap, so every
  session arrives as identical 1-mile splits. Intervals are found in the output
  stream instead. Uniform lap distances are rejected outright.
- **Every run ends with a steep climb home** (7–10% grade). It is terrain, not a
  rep, and is excluded from rep counts.
- **Running power is not cycling power.** Strava's `ftp` is cycling-only;
  banding a run against it would put every easy run in Z5.
- **Heart rate needs 60–90s to climb.** Reps shorter than that read easy on HR
  however hard they were run.
- **The app is cardio-only.** Strength and gym sessions are declined.

## Evals

`evals/RUBRIC.md` defines scoring; `evals/cases.json` holds the cases (each a
`(fixture, intent)` pair, so deliberate mismatches are first-class).
`evals/fixtures/` are real captured sessions with GPS scrubbed.

Build eval cases from **observed failures**, not imagined ones. The eval has
caught real bugs three times; each became a regression test.

In-app **Good/Off** ratings store the full `SessionSummary`, so a complaint stays
replayable after the Strava token expires.

## Conventions

- Comments explain *why*, not what. Several encode a constraint that will
  otherwise be "helpfully" reverted — leave those in place.
- Never commit GPS: `capture-fixture.mjs` strips `latlng` and `map`.
- Secrets live in Vercel env vars. `OPENROUTER_API_KEY` is required server-side.
