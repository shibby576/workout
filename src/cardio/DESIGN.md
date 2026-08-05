# Cardio Feedback App — Design Notes

A small, standalone app: pick a cardio workout, state the intended session type,
get AI coaching feedback on how it went. Deliberately narrow — no routine
planning, adherence, or history dashboards. Also a learning vehicle for splitting
work across models by complexity and building an eval process.

This app is built in an isolated area of this repo (`src/cardio/`, `api/coach/`)
and reuses the existing Strava OAuth plumbing (`api/strava/*`, `_lib.ts`). It does
not import or modify the older routine-tracker code, which stays untouched.

## Decisions on record

### Data source — Strava (for v1)
Strava exposes the rich per-session data the structuring step needs — HR/pace
streams (`/activities/{id}/streams`), plus `splits_*` and `laps` on the activity
detail. Setup is self-serve OAuth2 (already working in this repo). Garmin offers
higher-fidelity FIT data and unlocks recovery/readiness signals (HRV, sleep) —
but those are out of v1 scope, and its API has approval friction, OAuth1.0a, and
is webhook-based. So: Strava now, with ingestion behind a source interface so
Garmin/Whoop/Oura can slot in when readiness signals become real.

Note: the existing integration pulls **summary activities only**. Streams, laps,
detail, athlete zones, and FTP endpoints are new work on top of the reused auth.

### The structuring↔generation seam — `SessionSummary`
A clean, serializable JSON contract (`sessionSummary.ts`) is the load-bearing
decision. Structuring emits it; generation consumes it; eval fixtures snapshot
it. Everything downstream (model swaps, evals, new data sources) hangs off this
seam. Versioned via `schemaVersion` for eval reproducibility.

### Structuring is 100% code
No LLM in structuring — not even the "cheap classifier for interval
disambiguation" the spec floats. Interval detection is a deterministic
signal-processing problem (threshold + hysteresis, or device laps). Adding a
model here is manufactured complexity that undercuts the point of splitting work
by *genuine* complexity.

### HR vs. power — use both, they measure different things
- **Power / pace = external load** — the work produced. Direct and instantaneous;
  unaffected by heat/fatigue/sleep.
- **HR = internal load** — what that work cost physiologically. A lagging,
  drifting *response*.
- **Cycling:** power (via FTP zones) is the gold standard for intensity/banding.
- **Running:** pace + HR are traditional; running power is not standardized, so
  it's secondary/optional.
- **The quality signal is the relationship between them** — output flat while HR
  climbs = decoupling (fatigue/heat). For cycling that's canonical Pw:HR.

Design rule: band by the best available *output* metric (power > pace for runs,
power for bikes, HR last), use HR for cost/drift, surface decoupling as quality.
Power is a first-class *optional* field. Power zones need FTP the way HR zones
need max-HR — both pulled from Strava, with a one-time manual fallback.

### `signals[]` — deterministic factual observations
Structuring emits pre-computed factual observations (negative split, high drift,
mostly-Z2, zone mismatch…), not just raw numbers. The model narrates anchored
facts rather than inferring them — the biggest anti-hallucination lever, and the
thing evals will measure as *faithfulness*.

### Intent → band mapping is explicit and versioned
"How much of the session fell into the band implied by the intent" requires a
defined mapping (recovery ≈ Z1/low-Z2, base ≈ Z2, threshold ≈ tempo/Z3–low-Z4,
vo2max ≈ Z4–Z5). It lives in one version-controlled config; `intentBand`
records `configVersion` and `primaryMetric` so results are reproducible.

### Storage — two-tier, no database in v1
- **Eval tier (version-controlled):** on card generation, save raw Strava payload
  + `SessionSummary` + note as JSON fixtures under `evals/fixtures/`. The eval set
  builds itself from real sessions. Strip `latlng`/GPS before committing.
- **User tier (localStorage):** persist `SessionSummary` + note keyed by activity
  id for saved cards and future trend features. No backend.

Defer a real datastore until cross-device / multi-user matters.

## User flow & screens
`setup gate → select workout → state intent → feedback card`

1. **Setup gate (one-time):** connect Strava (reuse existing). Resolve HR zones
   (Strava `/athlete/zones`, else one-time max-HR) and FTP (Strava, else skip).
2. **Select workout:** list of recent cardio activities (lifting filtered out).
3. **State intent:** pick recovery / base / threshold / vo2max — one tap.
4. **Feedback card:** fetch streams+laps+detail → structure → generate → render.

### Card layout — frame every number against the stated intent
1. **Verdict line:** the intent + how it read against it. Mismatch is the
   headline (`zone_mismatch`), e.g. "Meant as threshold, reads like base."
2. **Intensity block:** the banding metric (power/pace/HR, labeled which), zone
   breakdown shown *relative to the target band* (in / below / above).
3. **Cost & drift block:** HR avg/max + decoupling, read as cost.
4. **Structure block:** steady vs intervals, compared to what the intent implies.
5. **Coach's note:** generated, below the facts, with a "regenerate" button.

## Build sequence
0. `SessionSummary` contract + these notes ✅ (this commit)
1. Extend Strava ingestion behind a source interface: streams + laps + detail +
   zones + FTP endpoints (reuse `_lib.ts`).
2. Structuring module — pure, unit-tested → `SessionSummary`; save fixtures.
3. Select-workout + intent UI.
4. Generation — server-side `/api/coach/generate`, provider-abstracted, one-shot.
5. Feedback card UI.
6. **Collaborative eval session** (not before generation exists): define rubric
   with anchored examples, pick coverage cases from real fixtures, build a Node
   harness, score human + LLM-judge, compare strong default vs hosted
   open-source (OpenRouter). Built together — not auto-generated.
