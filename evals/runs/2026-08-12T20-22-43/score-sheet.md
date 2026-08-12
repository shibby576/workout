# Eval score sheet — 2026-08-12T20-22-43

Models: qwen/qwen3-235b-a22b-2507, moonshotai/kimi-k3

Score each note against `evals/RUBRIC.md`. 0 = fail, 1 = partial, 2 = pass.
Faithfulness and domain are GATES — a 0 on either means the note is GATED
regardless of the rest. Check every number in a note against the brief in
`results.json` before scoring faithfulness.

## 6x2-vo2max  *(core)*

**"6x2"** labelled as **vo2max** · <https://www.strava.com/activities/19036090700>

See `sessions.md` for the full computed picture of this session.

**Tests:** Well-executed interval session. Baseline: does the model read a good session correctly, and exclude the climb home rather than calling it a 7th rep?

### qwen/qwen3-235b-a22b-2507 — run 1  *(43 words)*

> You ran the work intervals 7 seconds per mile faster than your target pace range. That pace caused power to fade 7.2% from first to last rep. Run the intervals at 7:10–7:25 per mile and extend recoveries to 3 minutes to sustain intensity.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### moonshotai/kimi-k3 — run 1  *(62 words)*

> You ran the reps at 6:56 against a 7:03–7:27 target, and output faded 7.2% from first to last rep — the opening pace was too hard to repeat. Heart rate also climbed relative to output (14.7% decoupling), consistent with that early overcooking. Next session, start at 7:15 and hold it; all six reps should finish within a few percent of each other.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## 6x2-as-base  *(core, deliberate mismatch)*

**"Morning Run"** labelled as **base** *(deliberately wrong — the note should say so)* · <https://www.strava.com/activities/19642518909>

See `sessions.md` for the full computed picture of this session.

**Tests:** Deliberate mismatch. A hard interval session labelled base — the note should say emphatically too hard, not hedge.

### qwen/qwen3-235b-a22b-2507 — run 1  *(64 words)*

> You ran 50 seconds per mile faster than the target pace for a base session, spending most of the effort in zone 4. The intensity drifted upward, with pacing slowing by 60 seconds per mile over time, indicating accumulated fatigue from starting too hard. For your next base run, start at the back half of the target pace range (9:30–10:20) and hold it steady.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### moonshotai/kimi-k3 — run 1  *(62 words)*

> You ran this base session too hard: 8:24 per mile against a 9:14–10:20 target, with 45% of the time in zone 4 and only 5% in zone 2. You slowed from 8:39 to 9:39 as the effort caught up with you. Heart rate lags and drifts, so treat that split as directional. Next time, cap the pace at 9:14 from the start.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## 2x10-threshold  *(core)*

**"2x10 threshold"** labelled as **threshold** · <https://www.strava.com/activities/17613929816>

See `sessions.md` for the full computed picture of this session.

**Tests:** Both-sided band with long reps. Does it judge threshold correctly rather than treating harder as better?

### qwen/qwen3-235b-a22b-2507 — run 1  *(63 words)*

> You ran 8:07 per mile during work reps, which is 28 seconds per mile slower than your 7:39–7:59 threshold pace target. Despite holding heart rate in zone 3 and 4 for 100% of the session, the pace was too slow to overload the intended system. Next session, run at or within 5 seconds of your threshold pace from the start of each rep.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### moonshotai/kimi-k3 — run 1  *(65 words)*

> Effort was right by heart rate, but your work reps ran 8:07 against a 7:31–7:59 target built off your 7:45 threshold pace — you were roughly 10–30 seconds per mile slow while output still built 4% across reps. Since intensity was judged on heart rate alone, treat that zone split as directional. Next threshold session, pace the reps to 7:45–7:59 and let heart rate follow.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## 1x20-threshold  *(core)*

**"Threshold run 1x20"** labelled as **threshold** · <https://www.strava.com/activities/18568372609>

See `sessions.md` for the full computed picture of this session.

**Tests:** A single continuous block. Structure edge case — one work rep is not a failed interval session.

### qwen/qwen3-235b-a22b-2507 — run 1  *(57 words)*

> You held the target pace range and stayed in zone 3–4 heart rate for nearly the entire session. Most of your work occurred in zone 4, and your heart rate rose 9.2% relative to output, indicating accumulating fatigue. For better specificity, extend the recovery periods to at least 5 minutes to maintain intensity deeper into the interval.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### moonshotai/kimi-k3 — run 1  *(69 words)*

> You hit the intent: work at 7:40 against your 7:45 threshold pace, inside the 7:31–7:59 band. But heart rate climbed 9% relative to output across the 21-minute rep, meaning you were paying more for the same pace late — fatigue, heat or dehydration. Split the next threshold into 2×10 minutes with 2 minutes easy, and hydrate beforehand; if the drift persists, cap the reps at zone 3 heart rate.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## 10x1-vo2max  *(core)*

**"10x1"** labelled as **vo2max** · <https://www.strava.com/activities/17950175059>

See `sessions.md` for the full computed picture of this session.

**Tests:** Ten short reps. HR lag is worst here, so the note should lean on the output metrics and hedge the HR read.

### qwen/qwen3-235b-a22b-2507 — run 1  *(64 words)*

> You ran the work intervals too fast, averaging 6:54 instead of the target 7:03–7:27, which likely pushed you out of VO2 max intensity and into anaerobic territory. Heart rate showed only 26% in zones 4–5, indicating the effort was easier than intended despite the pace. Shorten recoveries to 60 seconds and run the work reps at 7:10–7:20 to stay within the target intensity zone.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### moonshotai/kimi-k3 — run 1  *(62 words)*

> You ran the reps at 6:54, faster than the 7:03–7:27 target off your 7:45 threshold, yet only half reached zone 4–5 because 60-second efforts are too short for heart rate to catch up. Most of the session sat in zone 3. Run the reps at the prescribed pace and extend them to 2–3 minutes so heart rate actually climbs into zone 5.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## easy-run-recovery  *(core)*

**"Lunch Run"** labelled as **recovery** · <https://www.strava.com/activities/19574288003>

See `sessions.md` for the full computed picture of this session.

**Tests:** Sub-fault excursion: verdict is on-target but ~7min drifted to Z4. The note must carry that nuance without calling the session failed.

### qwen/qwen3-235b-a22b-2507 — run 1  *(54 words)*

> You ran within the target pace range, and 79% of the session was at or below the intended effort. Heart rate spent 21% of the time above zone 1, with a 5% aerobic decoupling suggesting mild drift in intensity. Next recovery run, hold the first mile 5–10 seconds/mile slower to stabilize heart rate earlier.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### moonshotai/kimi-k3 — run 1  *(66 words)*

> Pace sat in range against your 9:56–11:24 recovery target, but heart rate drifted above the band for 6 minutes, reaching zone 4 — too much for a recovery day. Heart rate alone is a lagging read, so treat that split as directional. Cap the next recovery run at the top of zone 1 and slow down the moment you cross it, even if pace feels easy.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## powered-ride-base  *(core)*

**"Morning Ride"** labelled as **base** · <https://www.strava.com/activities/19285811951>

See `sessions.md` for the full computed picture of this session.

**Tests:** Ride with a real power meter but no threshold set. Should surface power without banding it, and recommend setting a threshold.

### qwen/qwen3-235b-a22b-2507 — run 1  *(50 words)*

> You rode harder than intended, with heart rate rising 14.5% relative to effort, indicating accumulating fatigue. Most of your time was spent above the target base intensity, with only 39% in zone 2. Next ride, start 5-10 bpm lower and hold steady; use power below 130W if heart rate drifts.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### moonshotai/kimi-k3 — run 1  *(65 words)*

> You rode harder than a base session calls for: only 39% in zone 2, with 14 minutes above it. Heart rate climbed 14.5% relative to power as the ride went on, meaning the early effort cost you — speed fell off through the session. Cap heart rate at the top of zone 2 from the start and back off the moment it drifts above it.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## hike-recovery  *(core)*

**"Lunch Hike"** labelled as **recovery** · <https://www.strava.com/activities/19287767523>

See `sessions.md` for the full computed picture of this session.

**Tests:** 95 minutes, no power, notable drift, a different sport. Does the advice stay sensible outside running?

### qwen/qwen3-235b-a22b-2507 — run 1  *(64 words)*

> You hiked within the target heart rate zone for 93% of the session, staying at or below the intended effort. Your heart rate rose 8.1% relative to pace over time, suggesting some drift from fatigue, heat, or hydration. For recovery hikes, keep effort so easy that heart rate stays flat. Next time, aim to hold a conversational pace and monitor how you feel throughout.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### moonshotai/kimi-k3 — run 1  *(64 words)*

> You kept this in zone 1 for 93% of the session, which is exactly what a recovery hike should look like. Heart rate did climb relative to output by 8.1% over the 95 minutes, which usually points to dehydration or accumulated fatigue rather than lost fitness. Next time, bring fluids and sip regularly; if the drift persists, shorten the hike to around an hour.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## easy-run-as-threshold  *(core, deliberate mismatch)*

**"Lunch Run"** labelled as **threshold** *(deliberately wrong — the note should say so)* · <https://www.strava.com/activities/19574288003>

See `sessions.md` for the full computed picture of this session.

**Tests:** Deliberate mismatch the other way: an easy run labelled threshold should read as well short of the stimulus.

### qwen/qwen3-235b-a22b-2507 — run 1  *(66 words)*

> You ran 10:42 pace, well below the 7:31–7:59 target range for threshold, and only 21% of the session was in zones 3–4. Your heart rate stayed low—125 average—with half the run in zone 2, indicating an aerobic effort, not a threshold one. For a true threshold stimulus, break the work into intervals (e.g., 3 x 10 minutes at 7:45 pace) with short recoveries to sustain intensity.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### moonshotai/kimi-k3 — run 1  *(62 words)*

> This ran as a steady zone 2 effort, not a threshold session: 10:42 per mile against your 7:31–7:59 target, with only 6 minutes in zones 3–4. Heart rate is the only judge here, so treat that split as directional, but the pace gap is real. Next time, structure it as intervals — say 3×8 minutes at 7:45 pace with 2-minute jog recoveries.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## hiit-no-distance  *(robustness)*

**"Lunch HIIT"** labelled as **vo2max** · <https://www.strava.com/activities/19422777332>

See `sessions.md` for the full computed picture of this session.

**Tests:** Non-cardio session (lifting-based HIIT). Must DECLINE with a single sentence rather than coach it, and must not invent a pace from absent distance data. Robustness, not core.

### qwen/qwen3-235b-a22b-2507 — run 1  *(12 words)*

> This tool only reviews cardio sessions and this one cannot be assessed.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### moonshotai/kimi-k3 — run 1  *(15 words)*

> This tool reviews cardio sessions only, and this session cannot be assessed on those terms.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

