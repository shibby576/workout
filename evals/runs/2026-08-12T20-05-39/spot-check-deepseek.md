# DeepSeek v3.2 — spot check

Free-form review of the model we are shipping. No rubric, no scores — just write
what you would change under each note. Anything you flag becomes a prompt fix.

Useful questions: Is the verdict right? Would the recommendation actually help?
Is anything stated that you cannot verify or do not understand? What is missing?

---

## 6x2-vo2max

**"6x2"** labelled as **vo2max** · <https://www.strava.com/activities/19036090700>

*Tests: Well-executed interval session. Baseline: does the model read a good session correctly, and exclude the climb home rather than calling it a 7th rep?*

> You opened too fast against your 7:45 threshold pace, averaging 6:56. This caused your output to fade 7% by the last rep and your heart rate to drift upward relative to effort. Next time, start your first few reps 15 seconds per mile slower to sustain the intensity.

**Your notes:**


---

## 6x2-as-base  ⚠️ *(intent deliberately wrong)*

**"Morning Run"** labelled as **base** · <https://www.strava.com/activities/19642518909>

*Tests: Deliberate mismatch. A hard interval session labelled base — the note should say emphatically too hard, not hedge.*

> You ran this base session 45 seconds per mile faster than your 9:14-10:20 target range, placing you in zone 4 for 45% of the run. This excessive intensity caused a positive split as you slowed from 8:39 to 9:39 pace. Next base run, start at 9:45 pace to enforce the correct aerobic effort.

**Your notes:**


---

## 2x10-threshold

**"2x10 threshold"** labelled as **threshold** · <https://www.strava.com/activities/17613929816>

*Tests: Both-sided band with long reps. Does it judge threshold correctly rather than treating harder as better?*

> You executed the prescribed effort by heart rate, but your pace of 8:07 was slower than your 7:45 threshold target. This suggests your threshold pace may be overestimated or you were affected by heat or fatigue. Re-test your threshold pace with a recent benchmark effort to confirm your correct training zones.

**Your notes:**


---

## 1x20-threshold

**"Threshold run 1x20"** labelled as **threshold** · <https://www.strava.com/activities/18568372609>

*Tests: A single continuous block. Structure edge case — one work rep is not a failed interval session.*

> Your execution matched the intent. Heart rate drifted upward relative to effort, indicating fatigue or heat stress. Schedule your next hard session for a cooler time of day.

**Your notes:**


---

## 10x1-vo2max

**"10x1"** labelled as **vo2max** · <https://www.strava.com/activities/17950175059>

*Tests: Ten short reps. HR lag is worst here, so the note should lean on the output metrics and hedge the HR read.*

> You ran the work reps too fast at 6:54/mile, against a 7:03-7:27 target. This caused you to spend most of the session in zone 3, not the intended zones 4 and 5. Run your next set at the prescribed pace to hit the correct intensity.

**Your notes:**


---

## easy-run-recovery

**"Lunch Run"** labelled as **recovery** · <https://www.strava.com/activities/19574288003>

*Tests: Sub-fault excursion: verdict is on-target but ~7min drifted to Z4. The note must carry that nuance without calling the session failed.*

> You ran a recovery session but your heart rate drifted upward, indicating rising effort. This caused 21% of the session to exceed the target intensity. Next time, reduce your initial pace to keep your heart rate from climbing.

**Your notes:**


---

## powered-ride-base

**"Morning Ride"** labelled as **base** · <https://www.strava.com/activities/19285811951>

*Tests: Ride with a real power meter but no threshold set. Should surface power without banding it, and recommend setting a threshold.*

> You rode harder than your base intent, causing your heart rate to drift upward as you slowed. Next time, cap your early effort to keep your heart rate from rising through the session.

**Your notes:**


---

## hike-recovery

**"Lunch Hike"** labelled as **recovery** · <https://www.strava.com/activities/19287767523>

*Tests: 95 minutes, no power, notable drift, a different sport. Does the advice stay sensible outside running?*

> Your recovery effort was correctly executed, but your heart rate drifted upward over the hike. This suggests accumulating fatigue or heat stress. Prioritize hydration and cooling before your next similar effort.

**Your notes:**


---

## easy-run-as-threshold  ⚠️ *(intent deliberately wrong)*

**"Lunch Run"** labelled as **threshold** · <https://www.strava.com/activities/19574288003>

*Tests: Deliberate mismatch the other way: an easy run labelled threshold should read as well short of the stimulus.*

> You ran this threshold session at 10:42 per mile, well below your 7:45 threshold pace target. This kept your effort primarily in zone 2, so the session did not stress your intended intensity. Structure it as intervals next time, aiming for the 7:31-7:59 pace range.

**Your notes:**


---

## hiit-no-distance

**"Lunch HIIT"** labelled as **vo2max** · <https://www.strava.com/activities/19422777332>

*Tests: Non-cardio session (lifting-based HIIT). Must DECLINE with a single sentence rather than coach it, and must not invent a pace from absent distance data. Robustness, not core.*

> This tool only reviews cardio sessions, and this one cannot be assessed.

**Your notes:**


---

