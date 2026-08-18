# How the cardio app works, end to end

`DESIGN.md` records *why* each decision was made. This is *what happens*, in
order, with the file that does it.

## The one thing you label

The athlete provides a single input: what the session was **meant** to be.

| Value | Shown as | Meaning |
| --- | --- | --- |
| `recovery` | Recovery | Easy shakeout. Staying easy is the point. |
| `base` | Base | Aerobic base — conversational, sustainable. |
| `threshold` | Threshold | Comfortably hard, around your one-hour effort. |
| `vo2max` | VO2 max | Hard intervals near max, repeatable across reps. |

Defined as `IntentType` in `sessionSummary.ts`; display strings in `format.ts`.

That one choice determines: the target zone band, which direction counts as a
fault, the target pace range, whether the verdict is scoped to work reps, and
whether intervals are expected at all. All of it lives in **`intentBands.ts`**,
in three tables:

- `INTENT_BANDS` — target zones, tolerated zones, which misses are faults.
- `PACE_TARGETS` — target pace as a ratio of the athlete's threshold speed.
- `INTENT_STRUCTURE` — what the session type is *for*, its usual shape, which
  levers actually change it, and what *progressing* it means when it went well.
  This is what stops the note recommending "run slower" when the problem is that
  heart rate never got high enough. The progression field exists because
  "recommend the next progression" is incoherent for recovery — there isn't one
  — and the model filled the gap by endorsing the session's duration, which
  nothing here judges.

Everything else in the app is derived, not entered.

## Order of operations

### 1. Setup, once — `components/SetupGate.tsx`

Connect Strava (OAuth via `api/strava/callback.ts`), then resolve the anchors
that make judgement possible:

| Anchor | Where it comes from |
| --- | --- |
| HR zones | `/athlete/zones` if configured in Strava |
| Max HR | Highest `max_heartrate` across 200 recent activities, pre-filled and editable |
| Cycling FTP | `/athlete` |
| Threshold pace | Entered by hand (Strava exposes nothing usable) |
| Running threshold power | Entered by hand, optional |

Stored per user in `localStorage` (`profile.ts`). Reachable later via Settings.

### 2. Pick a workout — `components/SelectWorkout.tsx`

`api/strava/list.ts` returns recent activities, filtered to cardio sport types.
Strength and gym sessions never appear.

### 3. State the intent — `components/IntentPicker.tsx`

One tap. This is the only input.

### 4. Fetch the session — `api/strava/session.ts`

Activity detail plus the time-series streams (`time`, `heartrate`,
`velocity_smooth`, `watts`, `cadence`, `altitude`, `distance`, `moving`,
`grade_smooth`). Returned raw; no interpretation happens server-side. GPS is
never requested.

### 5. Structure it — `structuring.ts` *(no LLM)*

This is the bulk of the work, and it is all deterministic:

1. Build a time base from the `time` stream, so zone time is weighted by real
   elapsed seconds rather than sample count.
2. Resolve HR and power zone boundaries (`zones.ts`).
3. Accumulate time in zone across moving samples only.
4. Compute pace and per-mile splits; normalized power; aerobic decoupling.
5. Detect intervals — device laps if the athlete pressed lap, otherwise from the
   output stream (smoothing → 2-means to find the work and recovery levels →
   threshold crossing with hysteresis → minimum durations). Uniform-distance
   auto-laps are rejected outright, and a steep climb at the very end is
   excluded as terrain rather than counted as a rep.
6. Judge each rep against the target intensity, on power **and** heart rate.
7. Compute the intent band: how much time was in, tolerated, below or above the
   target, and which direction — if any — counts as a fault.
8. Emit `signals[]`: the factual observations that anchor the note.

Output is a `SessionSummary` — the versioned contract in `sessionSummary.ts`.

The signals it can emit:

`on_target`, `zone_mismatch`, `time_above_band`, `time_below_band`,
`dominant_zone`, `interval_session`, `structure_contradicts_intent`,
`expected_intervals_but_steady`, `reps_too_short_for_hr`, `recoveries_too_long`,
`reps_missed_target`, `rep_fade`, `rep_build`, `hill_finish`, `high_drift`,
`negative_drift`, `interval_strain`, `negative_split`, `positive_split`, `pace_on_target`,
`pace_off_target`, `low_banding_confidence`, `cannot_band`, `no_pace_target`,
`power_without_threshold`, `no_hr_data`, `no_power_data`, `summary_data_only`,
`not_cardio`.

#### How signals are decided

All of them are threshold rules in `deriveSignals()` in `structuring.ts`. No
model is involved, and each one is a single line to change.

| Signal | Fires when |
| --- | --- |
| `zone_mismatch` / `on_target` | Time in a fault direction exceeds 25% of the judged time |
| `time_above_band` / `time_below_band` | Off-band time that did *not* trip the 25% bar — the nuance the verdict deliberately tolerates |
| `high_drift` / `negative_drift` | Decoupling ≥ +5% or ≤ −5%, **steady sessions only** |
| `interval_strain` | An interval set drifted ≥ +5% or faded ≥ 5%. Carries the one lever to pull, already chosen |
| `negative_split` / `positive_split` | First and last split differ by ≥ 3%, steady sessions only. A fast finish carries `againstIntent` on easy-day intents, where it is drift in the fault direction rather than a strong finish |
| `reps_too_short_for_hr` | Median work rep < 90s **and** ≥ 20% of reps missed target |
| `recoveries_too_long` | Median recovery > 1.5× median work |
| `rep_fade` / `rep_build` | Output changed ≥ 5% from first work rep to last |
| `reps_missed_target` | Any work rep failed to reach the target band |
| `hill_finish` | Final effort ≥ 5% grade **and** ≥ 3 points steeper than earlier reps |
| `structure_contradicts_intent` | ≥ 3 work reps detected on an intent that expects steady running |
| `expected_intervals_but_steady` | An interval intent with no reps detected |
| `dominant_zone` | Whichever zone holds the most time |
| `low_banding_confidence` | Banding fell back to heart rate instead of power |
| `cannot_band`, `no_hr_data`, `no_power_data`, `summary_data_only`, `no_pace_target`, `power_without_threshold`, `not_cardio` | Presence checks on what the session and profile actually contained |

Decoupling is deliberately **not** read on interval sessions. Friel's Pw:HR test
and its 5% bar are defined for one continuous effort; on a set of reps the
work/recovery duty cycle, heart-rate lag and the climb home all move the number
for reasons unrelated to fatigue. Interval sets are judged by `interval_strain`
instead, which keys on what coaching actually asks of a set — did *output* hold?
Heart rate rising across reps at held output is the expected response, not a
fault, so that branch prescribes nothing.

Two of these thresholds are grounded in physiology — 90s for heart-rate lag, and
the grade split that separates a climb from a rep. **The rest are judgement
calls**, tuned when real sessions proved them wrong: the 20% work-fraction floor
exists because an easy run's two hardest minutes were being read as an interval
session, and the 25% fault bar was set by the athlete, who considers ~15% of a
recovery run in Z4 tolerable.

### 6. Render the metrics — `components/FeedbackCard.tsx`

Renders immediately, before any model call. Verdict line, pace vs. target, time
in zone, drift, structure. Every number framed against the stated intent.

### 7. Generate the note — the only LLM call

```
FeedbackCard ─▶ coach.ts ─▶ POST /api/coach/generate ─▶ provider.ts ─▶ OpenRouter
                                     │
                                     └─▶ prompt.ts builds the brief
```

- **`prompt.ts`** — where the prompt lives. Two parts: a fixed `SYSTEM` string
  (voice, length, the recommendation rules, the hard rules) and a `user` brief
  rendered from the `SessionSummary`.
- **`api/coach/generate.ts`** — runs server-side so the API key never reaches
  the browser. Accepts a model override so the eval harness can drive it.
- **`provider.ts`** — generation behind `GenerationProvider`. Swapping models is
  a string; swapping vendors is one implementation. Default is
  `deepseek/deepseek-v3.2`, chosen by the eval.

### 8. Rate it — `components/NoteFeedback.tsx`

Good/Off plus a comment, stored with the full `SessionSummary` so the case stays
replayable after the Strava token expires.

## What the model actually receives

`prompt.ts` renders labelled plain text, not JSON — it removes the parsing
burden when comparing smaller models, and a failing eval case can be read
directly. Sections:

```
INTENDED SESSION TYPE: THRESHOLD

WHAT THIS SESSION TYPE IS FOR      <- purpose, shape, levers
SESSION                            <- duration, distance, pace, HR, power
INTENSITY VS INTENT                <- target zones, % in band, verdict, time in
                                      zone, and the band's actual bpm/watt
                                      bounds with the end that is actionable
                                      for this intent named explicitly
PACE VS TARGET                     <- ran, target range, the anchor it came from
STRUCTURE                          <- reps, durations, recoveries, fade
AEROBIC DECOUPLING                 <- value WITH its reading, so a nothing-number
                                      is not mistaken for a finding
KEY OBSERVATIONS                   <- signals[], rendered as prose
DATA NOT AVAILABLE                 <- metrics it must never mention
```

Inspect the exact text for any session:

```bash
npx tsx scripts/generate-note.mjs --fixture evals/fixtures/<id>.json \
  --intent threshold --dry-run
```

## The rule the design rests on

**Everything quantitative is computed; the model only narrates.**

Every judgement left to the model came back wrong — it recommended running
*slower* on a session whose heart rate was too *low*, and invented "long, slow
recoveries" that did not exist. Every judgement computed and handed over as a
signal came back right.

So when a note says something wrong, the fix is usually **a new signal in
`structuring.ts`**, not a longer prompt.
