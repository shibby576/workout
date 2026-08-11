# Eval score sheet — 2026-08-11T02-10-33

Models: anthropic/claude-sonnet-5

Score each note against `evals/RUBRIC.md`. 0 = fail, 1 = partial, 2 = pass.
Faithfulness and domain are GATES — a 0 on either means the note is GATED
regardless of the rest. Check every number in a note against the brief in
`results.json` before scoring faithfulness.

## 6x2-vo2max  *(core)*

**Tests:** Well-executed interval session. Baseline: does the model read a good session correctly, and exclude the climb home rather than calling it a 7th rep?

### anthropic/claude-sonnet-5 — run 1  *(70 words)*

> You hit the intended zones, but you ran it faster than prescribed (6:56 vs 7:03–7:27) and paid for it: output dropped 7.2% from first rep to last, and heart rate climbed relative to output through the session (14.7% decoupling). That combination points to the opening reps being too hard to hold. Back off to the target pace band on the first two reps so effort is repeatable across all six.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## 6x2-as-base  *(core, deliberate mismatch)*

**Tests:** Deliberate mismatch. A hard interval session labelled base — the note should say emphatically too hard, not hedge.

### anthropic/claude-sonnet-5 — run 1  *(68 words)*

> This ran well above base intensity: 68% of the time sat in zone 4-5, with pace nearly a minute faster than the 9:14–10:20 target. The positive split (8:39 to 9:39) shows the effort wasn't sustainable at that speed. Slow down to the prescribed range from the start — if hitting 9:14+ still pushes HR into zone 4, that's your signal fitness hasn't caught up to easy pace yet.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## 2x10-threshold  *(core)*

**Tests:** Both-sided band with long reps. Does it judge threshold correctly rather than treating harder as better?

### anthropic/claude-sonnet-5 — run 1  *(68 words)*

> Heart rate landed you in zone 3/4 as intended, and output held across both reps. But pace ran 36 seconds per mile slower than target — that's a meaningful gap, not noise. Set a threshold power value in your profile so future sessions can be judged on power, which won't lag like HR does. Next threshold session, target 7:31–7:59 pace directly and let HR confirm rather than lead.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## 1x20-threshold  *(core)*

**Tests:** A single continuous block. Structure edge case — one work rep is not a failed interval session.

### anthropic/claude-sonnet-5 — run 1  *(62 words)*

> Pace and HR both landed in range, so intent matched execution. The standout is 9.2% decoupling over a single 33-minute effort — heart rate drifted up while output held steady, pointing to fatigue or heat rather than pacing error. Next threshold session, hold the same pace target but split the work into two reps with a short break, and check hydration/heat beforehand.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## 10x1-vo2max  *(core)*

**Tests:** Ten short reps. HR lag is worst here, so the note should lean on the output metrics and hedge the HR read.

### anthropic/claude-sonnet-5 — run 1  *(83 words)*

> Only 5 of 10 reps reached target zone, and heart rate spent most of its time in zone 3, not 4-5 — despite you running reps at 6:54/mile, faster than the 7:03-7:27 target. That mismatch (fast pace, under-target HR) suggests reps were too short or recoveries too long to let HR climb into the VO2 max zone. Lengthen work reps or shorten recovery so HR has time to reach zone 4-5, and stop pushing pace below target — it's not buying you intensity.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## easy-run-recovery  *(core)*

**Tests:** Sub-fault excursion: verdict is on-target but ~7min drifted to Z4. The note must carry that nuance without calling the session failed.

### anthropic/claude-sonnet-5 — run 1  *(63 words)*

> Pace and overall effort held in the recovery range, with 79% of the session at or below target. Six minutes drifted into zone 4, likely a hill or brief push rather than a pattern. Next recovery run, if HR climbs into zone 4, slow down immediately rather than holding pace — the point is to keep effort capped, not to hit a time.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## powered-ride-base  *(core)*

**Tests:** Ride with a real power meter but no threshold set. Should surface power without banding it, and recommend setting a threshold.

### anthropic/claude-sonnet-5 — run 1  *(83 words)*

> Only 39% of this ride sat in the target zone, with a third of it drifting into Z3/Z4 — harder than a base ride should run. The 14.5% decoupling backs this up: your heart rate climbed while output didn't hold, pointing to fatigue or heat rather than a controlled aerobic effort. Cap the next base ride at Z2 by feel, backing off whenever HR creeps toward Z3, and stop the ride once decoupling of this size shows up rather than pushing through it.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## hike-recovery  *(core)*

**Tests:** 95 minutes, no power, notable drift, a different sport. Does the advice stay sensible outside running?

### anthropic/claude-sonnet-5 — run 1  *(62 words)*

> Heart rate stayed in zone 1 the whole way, so effort matched the recovery intent. The pace target doesn't apply here — this was a hike, not a run, so 27:01/mile is meaningless against a run-based benchmark. The 8.1% decoupling is worth noting: HR drifted up relative to output, likely heat or dehydration. Carry water and hike in cooler hours next time.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## easy-run-as-threshold  *(core, deliberate mismatch)*

**Tests:** Deliberate mismatch the other way: an easy run labelled threshold should read as well short of the stimulus.

### anthropic/claude-sonnet-5 — run 1  *(57 words)*

> This ran as an easy aerobic effort, not threshold. Pace was over 3 minutes per mile slower than target, and 79% of the session sat in zone 1-2 with no work intervals structured in. Rebuild this as 4-6 x 4 minutes at threshold effort with 2 minutes easy between, and target 7:31-7:59 pace for the work reps.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## hiit-no-distance  *(robustness)*

**Tests:** No distance stream at all. Highest-severity faithfulness check: the model must not invent a pace. Not representative of real use (this is a lifting-based HIIT session), hence robustness rather than core.

### anthropic/claude-sonnet-5 — run 1  *(74 words)*

> This wasn't a VO2 max session. No intervals, no time in zones 4-5, and heart rate sat mostly in zone 1 for a continuous 23-minute effort. Max HR of 154 suggests some intensity happened, but average of 107 shows most of the session had no real stimulus. Restructure this as actual work reps: 4-6 x 3-4 min hard with equal recovery, hard enough to push HR into the 160s+ range and hold it there.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

