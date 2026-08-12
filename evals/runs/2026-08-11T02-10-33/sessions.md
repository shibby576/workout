# Session reference

What each eval case actually was. Judge the note against this.

## 6x2-vo2max

**"6x2"** · Run · 2026-06-23
<https://www.strava.com/activities/19036090700>

**Labelled as:** vo2max

| | |
| --- | --- |
| Duration | 35:01 moving |
| Distance | 4.09 mi |
| Avg pace | 8:33/mi |
| Heart rate | 155 avg, 179 max |
| Power | 379W avg (no threshold — not banded) |
| Drift | 14.7% |
| Structure | 6 work reps (stream-detected), climb home excluded (9.2%) |
| Verdict | on target — 83.5% in Z4/5 by hr (low confidence) |
| Pace vs target | ran 6:56, target 7:03–7:27 → too-fast |

**Signals:** on_target, low_banding_confidence, time_below_band, pace_off_target, power_without_threshold, dominant_zone, high_drift, interval_session, hill_finish, rep_fade, reps_missed_target

**This case tests:** Well-executed interval session. Baseline: does the model read a good session correctly, and exclude the climb home rather than calling it a 7th rep?

---

## 6x2-as-base  ⚠️ deliberate mismatch

**"Morning Run"** · Run · 2026-08-07
<https://www.strava.com/activities/19642518909>

**Labelled as:** base  — *this is deliberately wrong; the note should say so*

| | |
| --- | --- |
| Duration | 30:23 moving |
| Distance | 3.62 mi |
| Avg pace | 8:24/mi |
| Heart rate | 160 avg, 186 max |
| Power | 387W avg (no threshold — not banded) |
| Drift | -0.8% |
| Structure | steady, no intervals |
| Verdict | too-hard — 5.3% in Z2 by hr (low confidence) |
| Pace vs target | ran 8:24, target 9:14–10:20 → too-fast |

**Signals:** zone_mismatch, low_banding_confidence, pace_off_target, power_without_threshold, dominant_zone, positive_split

**This case tests:** Deliberate mismatch. A hard interval session labelled base — the note should say emphatically too hard, not hedge.

---

## 2x10-threshold

**"2x10 threshold"** · Run · 2026-03-05
<https://www.strava.com/activities/17613929816>

**Labelled as:** threshold

| | |
| --- | --- |
| Duration | 35:53 moving |
| Distance | 4.09 mi |
| Avg pace | 8:47/mi |
| Heart rate | 153 avg, 180 max |
| Power | 364W avg (no threshold — not banded) |
| Drift | 3.5% |
| Structure | 2 work reps (stream-detected) |
| Verdict | on target — 100% in Z3/4 by hr (low confidence) |
| Pace vs target | ran 8:07, target 7:31–7:59 → too-slow |

**Signals:** on_target, low_banding_confidence, pace_off_target, power_without_threshold, dominant_zone, interval_session

**This case tests:** Both-sided band with long reps. Does it judge threshold correctly rather than treating harder as better?

---

## 1x20-threshold

**"Threshold run 1x20"** · Run · 2026-05-19
<https://www.strava.com/activities/18568372609>

**Labelled as:** threshold

| | |
| --- | --- |
| Duration | 33:35 moving |
| Distance | 4.02 mi |
| Avg pace | 8:22/mi |
| Heart rate | 151 avg, 176 max |
| Power | 383W avg (no threshold — not banded) |
| Drift | 9.2% |
| Structure | 1 work reps (stream-detected) |
| Verdict | on target — 99.9% in Z3/4 by hr (low confidence) |
| Pace vs target | ran 7:40, target 7:31–7:59 → in-range |

**Signals:** on_target, low_banding_confidence, time_below_band, pace_on_target, power_without_threshold, dominant_zone, high_drift, interval_session

**This case tests:** A single continuous block. Structure edge case — one work rep is not a failed interval session.

---

## 10x1-vo2max

**"10x1"** · Run · 2026-04-02
<https://www.strava.com/activities/17950175059>

**Labelled as:** vo2max

| | |
| --- | --- |
| Duration | 40:26 moving |
| Distance | 4.53 mi |
| Avg pace | 8:55/mi |
| Heart rate | 144 avg, 179 max |
| Power | 366W avg (no threshold — not banded) |
| Drift | 1.3% |
| Structure | 10 work reps (stream-detected), climb home excluded (6.7%) |
| Verdict | too-easy — 56.9% in Z4/5 by hr (low confidence) |
| Pace vs target | ran 6:54, target 7:03–7:27 → too-fast |

**Signals:** zone_mismatch, low_banding_confidence, pace_off_target, power_without_threshold, dominant_zone, interval_session, hill_finish, reps_missed_target

**This case tests:** Ten short reps. HR lag is worst here, so the note should lean on the output metrics and hedge the HR read.

---

## easy-run-recovery

**"Lunch Run"** · Run · 2026-08-02
<https://www.strava.com/activities/19574288003>

**Labelled as:** recovery

| | |
| --- | --- |
| Duration | 28:49 moving |
| Distance | 2.69 mi |
| Avg pace | 10:42/mi |
| Heart rate | 125 avg, 162 max |
| Power | 304W avg (no threshold — not banded) |
| Drift | 4.9% |
| Structure | steady, no intervals |
| Verdict | on target — 29.3% in Z1 by hr (low confidence) |
| Pace vs target | ran 10:42, target 9:56–11:24 → in-range |

**Signals:** on_target, low_banding_confidence, time_above_band, pace_on_target, power_without_threshold, dominant_zone

**This case tests:** Sub-fault excursion: verdict is on-target but ~7min drifted to Z4. The note must carry that nuance without calling the session failed.

---

## powered-ride-base

**"Morning Ride"** · Ride · 2026-07-12
<https://www.strava.com/activities/19285811951>

**Labelled as:** base

| | |
| --- | --- |
| Duration | 47:20 moving |
| Distance | 9.02 mi |
| Avg pace | 5:15/mi |
| Heart rate | 124 avg, 166 max |
| Power | 133W avg (no threshold — not banded) |
| Drift | 14.5% |
| Structure | steady, no intervals |
| Verdict | too-hard — 38.8% in Z2 by hr (low confidence) |
| Pace vs target | ran 5:15, target 9:14–10:20 → too-fast |

**Signals:** zone_mismatch, low_banding_confidence, pace_off_target, power_without_threshold, dominant_zone, high_drift, positive_split

**This case tests:** Ride with a real power meter but no threshold set. Should surface power without banding it, and recommend setting a threshold.

---

## hike-recovery

**"Lunch Hike"** · Hike · 2026-07-12
<https://www.strava.com/activities/19287767523>

**Labelled as:** recovery

| | |
| --- | --- |
| Duration | 1:34:53 moving |
| Distance | 3.51 mi |
| Avg pace | 27:01/mi |
| Heart rate | 93 avg, 133 max |
| Drift | 8.1% |
| Structure | steady, no intervals |
| Verdict | on target — 93.2% in Z1 by hr (low confidence) |
| Pace vs target | ran 27:01, target 9:56–11:24 → too-slow |

**Signals:** on_target, low_banding_confidence, pace_off_target, dominant_zone, high_drift, no_power_data

**This case tests:** 95 minutes, no power, notable drift, a different sport. Does the advice stay sensible outside running?

---

## easy-run-as-threshold  ⚠️ deliberate mismatch

**"Lunch Run"** · Run · 2026-08-02
<https://www.strava.com/activities/19574288003>

**Labelled as:** threshold  — *this is deliberately wrong; the note should say so*

| | |
| --- | --- |
| Duration | 28:49 moving |
| Distance | 2.69 mi |
| Avg pace | 10:42/mi |
| Heart rate | 125 avg, 162 max |
| Power | 304W avg (no threshold — not banded) |
| Drift | 4.9% |
| Structure | steady, no intervals |
| Verdict | too-easy — 20.9% in Z3/4 by hr (low confidence) |
| Pace vs target | ran 10:42, target 7:31–7:59 → too-slow |

**Signals:** zone_mismatch, low_banding_confidence, pace_off_target, power_without_threshold, dominant_zone, expected_intervals_but_steady

**This case tests:** Deliberate mismatch the other way: an easy run labelled threshold should read as well short of the stimulus.

---

## hiit-no-distance

**"Lunch HIIT"** · HighIntensityIntervalTraining · 2026-07-22
<https://www.strava.com/activities/19422777332>

**Labelled as:** vo2max

| | |
| --- | --- |
| Duration | 23:35 moving |
| Distance | — (no distance recorded) |
| Avg pace | — |
| Heart rate | 107 avg, 154 max |
| Structure | steady, no intervals |
| Verdict | too-easy — 0% in Z4/5 by hr (low confidence) |

**Signals:** zone_mismatch, low_banding_confidence, no_pace_target, dominant_zone, expected_intervals_but_steady, no_power_data

**This case tests:** No distance stream at all. Highest-severity faithfulness check: the model must not invent a pace. Not representative of real use (this is a lifting-based HIIT session), hence robustness rather than core.

---

