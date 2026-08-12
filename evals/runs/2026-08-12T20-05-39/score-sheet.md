# Eval score sheet — 2026-08-12T20-05-39

Models: anthropic/claude-sonnet-5, deepseek/deepseek-v3.2, z-ai/glm-4.7, z-ai/glm-4.7-flash

Score each note against `evals/RUBRIC.md`. 0 = fail, 1 = partial, 2 = pass.
Faithfulness and domain are GATES — a 0 on either means the note is GATED
regardless of the rest. Check every number in a note against the brief in
`results.json` before scoring faithfulness.

## 6x2-vo2max  *(core)*

**"6x2"** labelled as **vo2max** · <https://www.strava.com/activities/19036090700>

See `sessions.md` for the full computed picture of this session.

**Tests:** Well-executed interval session. Baseline: does the model read a good session correctly, and exclude the climb home rather than calling it a 7th rep?

### anthropic/claude-sonnet-5 — run 1  *(66 words)*

> You ran reps at 6:56, well inside your 7:03–7:27 target from a 7:45 threshold, and heart rate confirms the cost: it drifted upward relative to output (14.7% decoupling) while power faded 7.2% from first rep to last. You went too hard early and paid for it late. Slow the work reps to the 7:03–7:15 range next time so you can hold output flat across all six.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### deepseek/deepseek-v3.2 — run 1  *(48 words)*

> You opened too fast against your 7:45 threshold pace, averaging 6:56. This caused your output to fade 7% by the last rep and your heart rate to drift upward relative to effort. Next time, start your first few reps 15 seconds per mile slower to sustain the intensity.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7 — run 1  *(30 words)*

> You exceeded your 7:03 target pace, leading to a 7.2% power fade and heart rate drift relative to effort. Start at 7:15 per mile to sustain output across the session.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7-flash — run 1  *(56 words)*

> You hit target intensity in five of six reps, but your pace was too fast at 6:56 versus the 7:03–7:27 goal. This caused a 7.2% fade and positive decoupling, indicating your heart rate rose relative to your effort. Slow your target pace by 3–5 seconds per mile next time to improve quality and reduce cardiovascular drift.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## 6x2-as-base  *(core, deliberate mismatch)*

**"Morning Run"** labelled as **base** *(deliberately wrong — the note should say so)* · <https://www.strava.com/activities/19642518909>

See `sessions.md` for the full computed picture of this session.

**Tests:** Deliberate mismatch. A hard interval session labelled base — the note should say emphatically too hard, not hedge.

### anthropic/claude-sonnet-5 — run 1  *(72 words)*

> You ran this at 8:24/mile against a 9:14–10:20 target built from your 7:45 threshold — nearly a full zone too hard, spending 68% of the run in Z4/Z5 instead of Z2. Stable decoupling shows your aerobic system handled it fine, so this was an easy-run pace problem, not a fatigue problem. Next base run, cap effort by feel and hold pace at 9:15 or slower regardless of how easy it feels early.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### deepseek/deepseek-v3.2 — run 1  *(53 words)*

> You ran this base session 45 seconds per mile faster than your 9:14-10:20 target range, placing you in zone 4 for 45% of the run. This excessive intensity caused a positive split as you slowed from 8:39 to 9:39 pace. Next base run, start at 9:45 pace to enforce the correct aerobic effort.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7 — run 1  *(35 words)*

> You started at 8:39 per mile, which caused a significant fade to 9:39 and pushed your average pace above your target. Start your next run at 10:00 per mile to stay within the prescribed range.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7-flash — run 1  *(44 words)*

> You ran 8:24/mi, nearly a minute faster than the intended 9:14–10:20 range, and your heart rate drifted upward as your pace slowed. This high intensity limits aerobic development. Run at least 30 seconds slower than your 7:45 threshold pace for your next base session.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## 2x10-threshold  *(core)*

**"2x10 threshold"** labelled as **threshold** · <https://www.strava.com/activities/17613929816>

See `sessions.md` for the full computed picture of this session.

**Tests:** Both-sided band with long reps. Does it judge threshold correctly rather than treating harder as better?

### anthropic/claude-sonnet-5 — run 1  *(86 words)*

> Heart rate sat in zone 3-4 for the whole session, so effort-wise this landed on target. But pace tells a different story: you ran 8:07 per mile against a 7:31-7:59 target from your 7:45 threshold pace. That gap plus 3.5% decoupling (heart rate drifting up relative to output) suggests you're working harder than the pace shows, likely fatigue or heat. Next threshold session, hold effort by heart rate (zone 3-4, work reps) rather than chasing the pace number, and let pace trail below target if needed.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### deepseek/deepseek-v3.2 — run 1  *(51 words)*

> You executed the prescribed effort by heart rate, but your pace of 8:07 was slower than your 7:45 threshold target. This suggests your threshold pace may be overestimated or you were affected by heat or fatigue. Re-test your threshold pace with a recent benchmark effort to confirm your correct training zones.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7 — run 1  *(42 words)*

> You ran 8:07, missing the target range of 7:31 to 7:59. Heart rate hit the target zones despite the slower pace, indicating high aerobic stress for the output produced. Increase your pace to the lower end of the target range next time.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7-flash — run 1  *(49 words)*

> Your heart rate zones were correct, but pace was too slow at 8:07 against the 7:31–7:59 target. This mismatch caused positive aerobic decoupling, indicating your heart rate rose while your speed stayed low. Run the work reps at least 15 seconds faster per mile to match your threshold effort.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## 1x20-threshold  *(core)*

**"Threshold run 1x20"** labelled as **threshold** · <https://www.strava.com/activities/18568372609>

See `sessions.md` for the full computed picture of this session.

**Tests:** A single continuous block. Structure edge case — one work rep is not a failed interval session.

### anthropic/claude-sonnet-5 — run 1  *(80 words)*

> You held 7:40/mile against a 7:31-7:59 target, spending 84% of the session in zones 3-4. But heart rate climbed 9.2% relative to output over the effort — you had to work harder to hold the same pace as the rep went on. For a single 21-minute effort, that's fatigue accumulating faster than it should. Cap continuous threshold work at 15-18 minutes per rep and split into two reps with a 3-minute jog recovery to hold pace without the late drift.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### deepseek/deepseek-v3.2 — run 1  *(28 words)*

> Your execution matched the intent. Heart rate drifted upward relative to effort, indicating fatigue or heat stress. Schedule your next hard session for a cooler time of day.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7 — run 1  *(36 words)*

> You hit the target pace, but your heart rate rose relative to your output, showing 9.2% decoupling. This drift indicates fatigue or heat stress. Anchor your effort to pace rather than heart rate to maintain consistency.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7-flash — run 1  *(37 words)*

> You met the target, but a 9.2% decoupling shows heart rate rising relative to output, indicating fatigue. Your recovery pace was slow at 9:34, softening the stimulus. Shorten recovery to 8:00 or faster to maintain threshold stress.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## 10x1-vo2max  *(core)*

**"10x1"** labelled as **vo2max** · <https://www.strava.com/activities/17950175059>

See `sessions.md` for the full computed picture of this session.

**Tests:** Ten short reps. HR lag is worst here, so the note should lean on the output metrics and hedge the HR read.

### anthropic/claude-sonnet-5 — run 1  *(81 words)*

> Reps were run too fast for their length: 50-65 second efforts at 6:54 pace against a 7:03–7:27 target left heart rate mostly parked in zone 3, only hitting zone 4/5 in 5 of 10 reps. Short, fast reps don't give HR time to climb, so you got a tempo-ish aerobic session instead of a VO2 max stimulus. Stretch reps to 2–3 minutes at the same or slightly easier pace, with full recoveries, so heart rate has time to reach zone 4/5.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### deepseek/deepseek-v3.2 — run 1  *(45 words)*

> You ran the work reps too fast at 6:54/mile, against a 7:03-7:27 target. This caused you to spend most of the session in zone 3, not the intended zones 4 and 5. Run your next set at the prescribed pace to hit the correct intensity.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7 — run 1

FAILED: Model returned an empty note

### z-ai/glm-4.7-flash — run 1  *(41 words)*

> You ran faster than intended at 6:54 per mile, keeping your heart rate low despite the effort. Your aerobic decoupling indicates rising fatigue. Slow your pace to 7:15 per mile next session to ensure you stay in the correct intensity zone.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## easy-run-recovery  *(core)*

**"Lunch Run"** labelled as **recovery** · <https://www.strava.com/activities/19574288003>

See `sessions.md` for the full computed picture of this session.

**Tests:** Sub-fault excursion: verdict is on-target but ~7min drifted to Z4. The note must carry that nuance without calling the session failed.

### anthropic/claude-sonnet-5 — run 1  *(65 words)*

> Pace and overall effort matched a recovery session, with 79% of the time at or below target intensity. Six minutes drifted into zone 4, likely a brief surge rather than a pattern, but heart rate readings here are directional given lag effects. Next easy run, hold effort down early to keep the whole session in zone 1-2 rather than let it climb into zone 4.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### deepseek/deepseek-v3.2 — run 1  *(38 words)*

> You ran a recovery session but your heart rate drifted upward, indicating rising effort. This caused 21% of the session to exceed the target intensity. Next time, reduce your initial pace to keep your heart rate from climbing.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7 — run 1  *(46 words)*

> You hit the recovery pace target, but your heart rate drifted above zone one for twenty percent of the run. This rise in heart rate at a steady pace indicates fatigue. Walk hills or slow down to keep your heart rate in zone one next time.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7-flash — run 1  *(45 words)*

> You hit the recovery pace and kept effort easy for 79% of the run. The 4.9% positive decoupling shows your heart rate rising relative to your pace, pointing to fatigue. Trust perceived exertion over the power meter next time to ensure you remain truly easy.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## powered-ride-base  *(core)*

**"Morning Ride"** labelled as **base** · <https://www.strava.com/activities/19285811951>

See `sessions.md` for the full computed picture of this session.

**Tests:** Ride with a real power meter but no threshold set. Should surface power without banding it, and recommend setting a threshold.

### anthropic/claude-sonnet-5 — run 1  *(67 words)*

> You spent 28% of the ride above target zone 2, and heart rate climbed 14.5% relative to output through the session while pace slowed sharply. That combination points to fatigue or dehydration rather than a controlled base effort. Cap effort next time by riding to a hard ceiling around the top of zone 2 and back off on power if HR drifts, rather than holding steady watts.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### deepseek/deepseek-v3.2 — run 1  *(33 words)*

> You rode harder than your base intent, causing your heart rate to drift upward as you slowed. Next time, cap your early effort to keep your heart rate from rising through the session.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7 — run 1  *(38 words)*

> You exceeded the target Zone 2 effort for 14 minutes. Your heart rate drifted upward relative to output as you slowed, indicating fatigue. Cap your intensity at the top of Zone 2 next time to prevent this drift.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7-flash — run 1  *(42 words)*

> You executed this base ride harder than intended, spending 22% of the time above zone two. Your heart rate climbed relative to your output, resulting in a positive split. Reduce your target power by 10% to stay in zone two next time.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## hike-recovery  *(core)*

**"Lunch Hike"** labelled as **recovery** · <https://www.strava.com/activities/19287767523>

See `sessions.md` for the full computed picture of this session.

**Tests:** 95 minutes, no power, notable drift, a different sport. Does the advice stay sensible outside running?

### anthropic/claude-sonnet-5 — run 1  *(63 words)*

> This did what it needed to: 93% of the time in zone 1, effort matched the recovery intent throughout. Heart rate did climb relative to output over the session (8% decoupling), which usually points to heat or dehydration on a long, easy hike rather than a fitness issue. Bring water and fluids for next time out and keep the same easy effort target.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### deepseek/deepseek-v3.2 — run 1  *(31 words)*

> Your recovery effort was correctly executed, but your heart rate drifted upward over the hike. This suggests accumulating fatigue or heat stress. Prioritize hydration and cooling before your next similar effort.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7 — run 1  *(33 words)*

> You maintained the target zone, but your heart rate rose relative to output by 8%, indicating fatigue or heat stress. Shorten the duration next time to ensure the effort stays truly easy throughout.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7-flash — run 1  *(38 words)*

> You stayed in zone one for 93% of the hike, matching the recovery intent. Your heart rate climbed 8.1% relative to your movement, suggesting accumulating fatigue. Shorten the duration of your next recovery hike to prevent this drift.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## easy-run-as-threshold  *(core, deliberate mismatch)*

**"Lunch Run"** labelled as **threshold** *(deliberately wrong — the note should say so)* · <https://www.strava.com/activities/19574288003>

See `sessions.md` for the full computed picture of this session.

**Tests:** Deliberate mismatch the other way: an easy run labelled threshold should read as well short of the stimulus.

### anthropic/claude-sonnet-5 — run 1  *(56 words)*

> You ran this as one continuous effort at 10:42/mile, nearly three minutes off your 7:31–7:59 threshold pace, and heart rate spent 79% of the session below zone 3. This wasn't a threshold session, it was an aerobic run. Next time, structure it as work intervals at 7:31–7:59 pace with full recoveries, rather than steady continuous running.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### deepseek/deepseek-v3.2 — run 1  *(45 words)*

> You ran this threshold session at 10:42 per mile, well below your 7:45 threshold pace target. This kept your effort primarily in zone 2, so the session did not stress your intended intensity. Structure it as intervals next time, aiming for the 7:31-7:59 pace range.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7 — run 1  *(47 words)*

> You ran this session in Zone 2 at a 10:42 pace, missing your 7:45 threshold target by nearly three minutes. This low effort kept your heart rate from entering the necessary training range. Next time, lock your pace to 7:45 to ensure you hit the correct intensity.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7-flash — run 1  *(42 words)*

> You ran 10:42 per mile, which is 36 seconds per mile slower than the intended range. Your heart rate stayed in zone 2 for nearly 50% of the effort, confirming it was aerobic. Target 7:45 pace for the work intervals next time.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

## hiit-no-distance  *(robustness)*

**"Lunch HIIT"** labelled as **vo2max** · <https://www.strava.com/activities/19422777332>

See `sessions.md` for the full computed picture of this session.

**Tests:** Non-cardio session (lifting-based HIIT). Must DECLINE with a single sentence rather than coach it, and must not invent a pace from absent distance data. Robustness, not core.

### anthropic/claude-sonnet-5 — run 1  *(19 words)*

> This tool only reviews cardio sessions, and a HighIntensityIntervalTraining session like this one cannot be assessed on those terms.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### deepseek/deepseek-v3.2 — run 1  *(12 words)*

> This tool only reviews cardio sessions, and this one cannot be assessed.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7 — run 1  *(12 words)*

> This tool only reviews cardio sessions and this one cannot be assessed.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

### z-ai/glm-4.7-flash — run 1  *(13 words)*

> This tool only reviews cardio sessions and that this one cannot be assessed.

| faithfulness | domain | prescriptive | calibration | concision | result |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Notes: 

