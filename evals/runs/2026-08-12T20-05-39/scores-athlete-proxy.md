# Coach's Note scores — athlete proxy

Scored against `evals/RUBRIC.md`, calibrated to the athlete's round-1 hand scores
and written feedback (`.claude/agents/athlete-scorer.md`).

Covers two runs:

- **Run A** — `2026-08-12T20-05-39` — claude-sonnet-5, deepseek-v3.2, glm-4.7, glm-4.7-flash
- **Run B** — `2026-08-12T20-22-43` — qwen3-235b-a22b-2507, kimi-k3

Columns: **F** faithfulness (gate), **D** domain (gate), **P** prescriptiveness,
**C** calibration, **Con** concision & voice. Result is `GATED` or
`quality = mean(P, C, Con)`.

Every number in every note was checked against that note's own `brief`, and the
arithmetic of every derived claim and every recommendation was computed against
the target band. Gate failures are stated with the specific error and the true
value.

### Scoring conventions used here (so the columns are comparable)

- **Faithfulness 0** — a number absent from the brief, a derived figure whose
  arithmetic is false, or a claim the brief affirmatively contradicts.
  **1** — numbers correct, but a cause asserted that the brief does not
  establish (or leans on a metric the brief left unflagged).
- **Domain 0** — a recommendation that still lands outside the target band, or
  advice that is wrong rather than thin. **1** — verdict right, reasoning or a
  secondary claim off.
- **Calibration 2** — hedges where the brief flags uncertainty (`LOW CONFIDENCE`
  HR, approximate rep count). **1** — no hedge but claims stay inside what the
  brief states. **0** — asserts a firm conclusion from a metric the brief shows
  as negligible. Quoting the rep count is *not* penalised: the rubric's own
  faithfulness-2 anchor quotes "All 6 reps hit target intensity".
- The athlete's documented complaint about bare decoupling percentages is
  applied on calibration/concision, per his profile.
- `hiit-no-distance` is a robustness case (decline correctly), scored separately
  and excluded from the core-set means.

---

# Run A — `2026-08-12T20-05-39`

## Case: 6x2-vo2max
*(ran 6:56 vs 7:03–7:27 target; fade −7.2%; decoupling 14.7%; 5 of 6 reps on target)*

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| claude-sonnet-5 | 1 | 2 | 2 | 1 | 1 | 1.33 | "6:56, **well inside** your 7:03–7:27 target" states the opposite of the brief's `too-fast` verdict and of its own next sentence; I read "inside" as the racing idiom for "under", so 1 rather than a gate, but it is the sentence he would stop on. Fix (7:03–7:15) lands in band. 66 words. |
| deepseek-v3.2 | 2 | 2 | 2 | 1 | 2 | **1.67** | Cause→effect→fix in three sentences: opened at 6:56, faded 7%, start 15s/mi slower. 6:56+15 = 7:11, inside the band. Names the 7:45 anchor but not the 7:03–7:27 range, which is the "show the working" he asks for. |
| glm-4.7 | 2 | 2 | 2 | 1 | 2 | **1.67** | 30 words, all three links stated, 7:15 lands in band. Calls 7:03 "your target pace" rather than the floor of a range — compression, not error. No hedging anywhere. |
| glm-4.7-flash | 2 | **0** | 2 | 1 | 1 | **GATED** | Domain: "slow your target pace by 3–5 seconds per mile" takes 6:56 to 6:59–7:01 — still faster than the 7:03 floor. He needs ≥7s. The fix does not fix it. Trailing "to improve quality and reduce cardiovascular drift" is the self-explanation he penalises. |

## Case: 6x2-as-base
*(ran 8:24 vs 9:14–10:20; 68% in Z4/Z5; decoupling −0.8%; positive split 8:39→9:39)*

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| claude-sonnet-5 | 1 | 2 | 2 | 1 | 1 | 1.33 | 68% Z4/Z5 computed correctly (45+23). But "stable decoupling shows your aerobic system handled it fine, **not a fatigue problem**" is a cause −0.8% does not establish, and it sits against a recorded 60s/mi slowdown. 9:15 cap is in band. 72 words. |
| deepseek-v3.2 | **0** | 2 | 2 | 1 | 2 | **GATED** | Faithfulness: "**45 seconds per mile** faster than your 9:14-10:20 target range" — the true gap to the near bound is 50s (116s to the far bound). No such figure is in the brief. Exactly the rubric's derived-range failure. The 9:45 fix would have been correct. |
| glm-4.7 | 1 | 1 | 2 | 1 | 2 | 1.67 | Frames the session as a fade problem (8:39→9:39) when the finding is that the whole run sat in Z4/Z5 with 5% in Z2; "pushed your average pace above your target" muddles the direction. Verdict and the 10:00 fix are right. |
| glm-4.7-flash | **0** | **0** | 2 | 1 | 2 | **GATED ×2** | Faithfulness: "your heart rate drifted upward" — decoupling was **−0.8%**, the brief records no drift here. Domain: "at least 30 seconds slower than your 7:45 threshold" = 8:15, still 59s faster than the 9:14 floor. Both gates, independently. |

## Case: 2x10-threshold
*(ran 8:07 vs 7:31–7:59, too slow; HR 100% in Z3/Z4; decoupling 3.5%; output +4.4%)*

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| claude-sonnet-5 | 1 | 1 | 1 | 1 | 0 | **0.67** | Worst note in the run. Leans on 3.5% decoupling as evidence he was "working harder than the pace shows" — the brief does not flag drift on this session at all. Then advises holding effort by HR and "let pace trail below target if needed", which endorses the too-slow pace the note just identified. No pace given. 86 words → over the fail line. |
| deepseek-v3.2 | 2 | 2 | 2 | 2 | 2 | **2.00** | The only note that reconciles HR-on-target with pace-too-slow: threshold pace may be stale, re-test it. Hedged in the right place ("may be overestimated **or** heat/fatigue"), and telling him to fix a missing/stale input is the move he explicitly liked. 51 words. |
| glm-4.7 | 2 | 2 | 2 | 1 | 2 | **1.67** | Names the range, the miss and the direction. "Increase your pace to the lower end of the target range" is ambiguous (7:31 or 7:59 — 28s apart) but either reading lands in band. 126s to generate. |
| glm-4.7-flash | 1 | 2 | 2 | 1 | 2 | 1.67 | "This mismatch **caused** positive aerobic decoupling" is an invented mechanism, and "heart rate rose while your speed stayed low" is a wrong gloss of decoupling. The fix is right: 8:07 − 15 = 7:52, in band. |

## Case: 1x20-threshold
*(ran 7:40, in range; 84% Z3/Z4; decoupling 9.2%; one 1263s rep)*

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| claude-sonnet-5 | 2 | 2 | 2 | 1 | 1 | 1.33 | Every figure checks out, including the derived 84% (39+45) and "21-minute effort" (1263s). Best prescription on this case: cap continuous work at 15–18 min, split into two with 3-min jog. States the drift read flatly on an HR-only session. 80 words. |
| deepseek-v3.2 | 2 | 2 | 1 | 2 | 2 | 1.67 | Nothing wrong and nothing quantified — not one number in 28 words. "Schedule your next hard session for a cooler time of day" is an action but not a training lever, and on a session he executed correctly he wants the next progression. |
| glm-4.7 | 2 | 2 | 1 | 2 | 2 | 1.67 | Glosses decoupling in plain words before quoting it — the right handling of his complaint. "Anchor your effort to pace rather than heart rate" is sound but names no pace. |
| glm-4.7-flash | 2 | **0** | 2 | 1 | 2 | **GATED** | Domain: prescribes running the recoveries at "**8:00 or faster**" — 15s off his 7:45 threshold, not a recovery pace. And on a single continuous 21-minute rep the "recovery" segments are the warm-up and cool-down, so shortening them does nothing about the 9.2% drift the note just diagnosed. |

## Case: 10x1-vo2max
*(ran 6:54 vs 7:03–7:27; 56.9% in target zones, easier than intended; 5 of 10 reps on target; reps 48–66s; decoupling 1.3%)*

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| claude-sonnet-5 | 1 | 1 | 2 | 1 | 1 | 1.33 | Best diagnosis in Run A — short reps don't give HR time to climb, so he got a tempo session not a VO2 stimulus. But "50-65 second efforts" restates the brief's 48–66s as a range that is wrong at both ends, and "at the same or slightly easier pace" endorses staying at 6:54, outside the band. 81 words. |
| deepseek-v3.2 | 1 | 1 | 1 | 1 | 2 | 1.33 | "You ran too fast … **this caused** you to spend most of the session in zone 3" is backwards — running faster does not lower HR. Misses the rep-length cause entirely. "Run at the prescribed pace" points back at a range instead of naming it. |
| glm-4.7 | — | — | — | — | — | **NO OUTPUT** | Model returned an empty note. Counted as a hard failure. |
| glm-4.7-flash | 1 | 1 | 2 | 0 | 2 | 1.33 | "Your aerobic decoupling indicates rising fatigue" — decoupling was **1.3%**, i.e. nil, and the brief deliberately omits a drift observation here; that is the invented-conclusion-from-noise he objects to. 7:15 lands in band, but claiming a slower pace will raise him into Z4/Z5 is the wrong mechanism. |

## Case: easy-run-recovery
*(pace 10:42 in 9:56–11:24; 79.1% at or below intent; 6m/20.9% above band reaching Z4; decoupling 4.9%)*

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| claude-sonnet-5 | 2 | 2 | 2 | 2 | 1 | **1.67** | Matches the rubric's own domain-2 anchor almost word for word, and is the only Run-A note that hedges exactly where the brief says to: "heart rate readings here are directional given lag effects". 65 words is the only thing keeping it off a clean sweep. |
| deepseek-v3.2 | 1 | 1 | 1 | 1 | 2 | 1.33 | Says the HR drift "caused" the 21% excursion — unproven, and 4.9% is not flagged. Then tells him to reduce pace when pace was already in range and the brief's verdict was `on target`; wrong lever, no magnitude. |
| glm-4.7 | 1 | 2 | 2 | 1 | 2 | **1.67** | "This rise in heart rate at a steady pace indicates fatigue" overreads an unflagged 4.9%. But "walk hills or slow down to keep your heart rate in zone one" is the most route-aware advice in the run — every run of his ends on a 7–10% climb. |
| glm-4.7-flash | 1 | 1 | 1 | 0 | 2 | 1.00 | Quotes "the 4.9% positive decoupling" as a bare number and reads fatigue off it — his exact documented complaint. "Trust perceived exertion over the power meter" assumes he was pacing on power; the brief says power is unusable because no threshold is set, which is the moment to tell him to set it. |

## Case: powered-ride-base *(Ride — no run logic)*
*(28% above Z2; 71.1% at or below intent; decoupling 14.5%; 133W avg, no threshold power)*

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| claude-sonnet-5 | 2 | 2 | 2 | 1 | 1 | 1.33 | 28% derived correctly (22+6). Ride-appropriate fix: HR ceiling at the top of Z2, back off watts if HR drifts. "Pace slowed sharply" imports running vocabulary onto a bike — he marked the ride domain 1 in round 1 for exactly this family of slip, so this may be a 1 to him. 67 words. |
| deepseek-v3.2 | 2 | 2 | 1 | 1 | 2 | 1.33 | Correct and completely unquantified — 33 words with no number in them. "Cap your early effort" has no lever and no magnitude. |
| glm-4.7 | 2 | 2 | 2 | 1 | 2 | **1.67** | "Exceeded target Zone 2 for 14 minutes" is the brief's own figure, the drift is glossed in plain words, and the cap is stated. Cleanest ride note in Run A. |
| glm-4.7-flash | **0** | 1 | 2 | 1 | 2 | **GATED** | Faithfulness: "spending **22%** of the time above zone two" — above Z2 is **28%** (Z3 22 + Z4 6); 22% is the zone-3 row relabelled. Domain also weak: "reduce your target power by 10%" invents a power target on a session where the brief says power cannot be banded at all. |

## Case: hike-recovery *(Hike — no run logic, no power)*
*(93.2% Z1, 100% at or below intent, on target; decoupling 8.1%; 1:34:53)*

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| claude-sonnet-5 | 2 | 2 | 1 | 2 | 1 | 1.33 | Correct read, no pace advice, power never mentioned, cause hedged ("usually points to"). "Bring water and fluids" is a redundant phrase and not a training lever on a session he executed perfectly. 63 words. |
| deepseek-v3.2 | 2 | 2 | 1 | 2 | 2 | 1.67 | Right verdict, right hedge, 31 words. "Prioritize hydration and cooling" is direction without magnitude. |
| glm-4.7 | 2 | 1 | 2 | 1 | 2 | 1.67 | "Shorten the duration next time" treats normal cardiac drift over a 95-minute walk as a fault to correct, on a session the brief scored 100% at or below intent. Fix for a non-problem. |
| glm-4.7-flash | 2 | 1 | 2 | 1 | 2 | 1.67 | Same over-correction (shorten the hike). Handles the no-power constraint well — "relative to your movement" rather than to power. |

## Case: easy-run-as-threshold
*(ran 10:42 vs 7:31–7:59; 20.9% in Z3/Z4; one steady effort, intent implies intervals)*

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| claude-sonnet-5 | 2 | 2 | 2 | 1 | 2 | **1.67** | "Nearly three minutes off" checks out (2:43 to the near bound), 79% below Z3 derived correctly (29+50). Names the miss and prescribes the structural fix — intervals at 7:31–7:59 with full recoveries. 56 words. Best sonnet note in the run. |
| deepseek-v3.2 | 2 | 2 | 2 | 1 | 2 | **1.67** | Same call in 45 words, with the range named in the fix. Slightly thinner on why it matters. |
| glm-4.7 | 2 | 1 | 2 | 1 | 2 | 1.67 | Arithmetic right (10:42 − 7:45 = 2:57). But "lock your pace to 7:45" for the session ignores the brief's point that the intent implies intervals — holding 7:45 continuously for 29 minutes is not the fix. |
| glm-4.7-flash | **0** | 2 | 2 | 1 | 2 | **GATED** | Faithfulness: "**36 seconds per mile** slower than the intended range" — the true gap is **2:43** to 7:59 and 3:11 to 7:31. The figure is invented and off by more than two minutes. The 7:45 interval target itself was right. |

## Robustness case: hiit-no-distance *(must decline in one sentence)*

| Model | Words | Result | Reason |
| --- | --- | --- | --- |
| claude-sonnet-5 | 19 | PASS | Declines in one sentence; naming "HighIntensityIntervalTraining" back at him is clumsy but harmless. |
| deepseek-v3.2 | 12 | PASS | Exact. |
| glm-4.7 | 12 | PASS | Exact. |
| glm-4.7-flash | 13 | PASS (sloppy) | "…cardio sessions **and that** this one cannot be assessed" — copied the instruction's syntax verbatim, ungrammatical. |

---

# Run B — `2026-08-12T20-22-43`

## Case: 6x2-vo2max

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| qwen3-235b | 2 | 2 | 2 | 1 | 2 | **1.67** | "7 seconds per mile faster than your target pace range" is computed correctly (6:56 vs 7:03) — the only model that did that subtraction and got it right. 7:10–7:25 lands in band. Never names the range or the threshold anchor, which is the working he asks to see. 43 words. |
| kimi-k3 | 2 | 2 | 2 | 1 | 1 | **1.67** | Full chain: 6:56 against 7:03–7:27, faded 7.2%, opening pace too hard to repeat, start at 7:15 and hold. Decoupling glossed in plain words before the number. 62 words — just over the cap. |

## Case: 6x2-as-base

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| qwen3-235b | 1 | 2 | 2 | 1 | 1 | 1.33 | "50 seconds per mile faster" and "slowing by 60 seconds per mile" both check out. But "the intensity drifted upward" is not what happened — decoupling was −0.8% and he slowed. Fix (9:30–10:20) is in band. 64 words. |
| kimi-k3 | 2 | 2 | 2 | 2 | 1 | **1.67** | Every figure traced (8:24, 9:14–10:20, 45% Z4, 5% Z2, 8:39→9:39), and it hedges precisely where the brief says to: "heart rate lags and drifts, so treat that split as directional". Cap at 9:14 is the band floor. 62 words. |

## Case: 2x10-threshold

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| qwen3-235b | **0** | 2 | 2 | 1 | 1 | **GATED** | Faithfulness, twice over: the target is **7:31**–7:59, not "**7:39**–7:59", and "28 seconds per mile slower" is only true against the invented bound (true gap 8s to 7:59, 36s to 7:31). Fabricating the edge of his threshold band is the single worst error this app can make. |
| kimi-k3 | 1 | 2 | 2 | 2 | 1 | **1.67** | "Roughly 10–30 seconds per mile slow" is a derived range not in the brief; true is 8–36s. Hedged with "roughly" and materially close, so 1 rather than a gate — but it is the number he would check. Everything else is right, including the LOW-CONFIDENCE hedge and a 7:45–7:59 target that lands in band. |

## Case: 1x20-threshold

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| qwen3-235b | 2 | 1 | 1 | 1 | 1 | **1.00** | "Extend the recovery periods to at least 5 minutes" on a session with **one** 21-minute rep — the only gaps are the warm-up (339s) and cool-down (283s), and the warm-up is already over 5 minutes. The advice is inert and does not touch the 9.2% drift it was offered for. "For better specificity" is throat-clearing. |
| kimi-k3 | 2 | 2 | 2 | 1 | 1 | **1.67** | 7:40 inside 7:31–7:59, 9% drift across "the 21-minute rep" (1263s) — all correct. Prescribes 2×10 with 2 min easy plus hydration, in his own session vocabulary, with a conditional fallback. Slightly overloaded at 69 words. |

## Case: 10x1-vo2max

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| qwen3-235b | 1 | 1 | 2 | 1 | 1 | 1.33 | "26% in zones 4–5" is derived correctly (25+1). But "pushed you out of VO2 max intensity and into anaerobic territory" contradicts the brief's `easier than intended` verdict, and "shorten recoveries to 60 seconds" is already true — they were 48–66s. Misses the rep-length cause. |
| kimi-k3 | 2 | 2 | 2 | 1 | 1 | **1.67** | The best note on this case in either run: 6:54 vs the band, only half the reps reached Z4/Z5 **because 60-second efforts are too short for heart rate to catch up**, most of the session in Z3 — then run at the prescribed pace *and* extend the reps to 2–3 minutes. Correct cause, and the fix lands in band. |

## Case: easy-run-recovery

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| qwen3-235b | 2 | 2 | 2 | 1 | 2 | **1.67** | Figures all trace (79%, 21%, 5% decoupling). "Hold the first mile 5–10 seconds/mile slower" keeps him inside 9:56–11:24. Calls 4.9% "mild drift", which softens the bare-percentage problem without explaining it. 54 words. |
| kimi-k3 | 2 | 2 | 2 | 2 | 1 | **1.67** | Names the recovery band, the 6-minute excursion into Z4, hedges the HR read explicitly, and prescribes a hard rule ("slow down the moment you cross it, even if pace feels easy") that matches the rubric's prescriptive anchor. 66 words. |

## Case: powered-ride-base *(Ride)*

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| qwen3-235b | **0** | 1 | 2 | 1 | 2 | **GATED** | Faithfulness: "**Most of your time was spent above the target base intensity**" — the brief says most time was in zone 2 (38.8%) and **71.1%** was at the intended effort or easier; only 28% was above. Also prescribes "power below 130W" against a 133W average on a session where the brief says power cannot be banded. |
| kimi-k3 | 2 | 2 | 2 | 1 | 1 | **1.67** | "39% in zone 2, with 14 minutes above it" both trace exactly. Says "speed fell off", not pace-per-mile — correctly avoids run logic on a bike. Cap HR at the top of Z2 and back off when it drifts. 65 words. |

## Case: hike-recovery *(Hike)*

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| qwen3-235b | 2 | 1 | 1 | 1 | 1 | **1.00** | "Keep effort so easy that heart rate stays flat" is not achievable over 95 minutes and treats normal drift as a fault on a session that was 100% at or below intent. "Monitor how you feel throughout" hands the problem back — the rubric's prescriptive-0 shape. |
| kimi-k3 | 2 | 2 | 2 | 2 | 1 | **1.67** | Says the session was right and why, attributes 8.1% over 95 minutes to dehydration or fatigue "rather than lost fitness" (properly hedged), then gives a concrete action with a conditional escalation. No power mentioned. 64 words. |

## Case: easy-run-as-threshold

| Model | F | D | P | C | Con | Result | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| qwen3-235b | 2 | 2 | 2 | 1 | 1 | 1.33 | 10:42 vs 7:31–7:59, 21% in Z3/Z4, 125 avg, half in Z2 — all correct. "3 × 10 minutes at 7:45" is in band but is 30 minutes of threshold work off a 29-minute easy run; a jump from his 1×20 / 2×10 norms. 66 words. |
| kimi-k3 | 2 | 2 | 2 | 2 | 1 | **1.67** | "6 minutes in zones 3–4" derived correctly (5+1), hedges the HR-only judgement, then prescribes 3×8 at 7:45 with 2-minute jog recoveries — right structure, right pace, sane volume. 62 words. |

## Robustness case: hiit-no-distance

| Model | Words | Result | Reason |
| --- | --- | --- | --- |
| qwen3-235b | 12 | PASS | Exact. |
| kimi-k3 | 15 | PASS | One sentence, declines cleanly. |

---

# Per-model summary

Core set = the 9 cardio cases. `hiit-no-distance` is scored pass/fail only and
excluded from the means.

| Model | Gate failures (of 9) | Mean quality (non-gated) | F | D | P | C | Con | Mean words | Median latency | $/note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **kimi-k3** | **0** | **1.52** | 1.89 | **2.00** | **2.00** | 1.56 | 1.00 | 64 | 6.2s | $0.0068 |
| claude-sonnet-5 | 0 | 1.33 | 1.56 | 1.78 | 1.78 | 1.22 | 1.00 | 72 | 5.4s | $0.0051 |
| deepseek-v3.2 | 1 | 1.58 | 1.56 | 1.78 | 1.44 | 1.33 | **2.00** | 41 | 6.2s | $0.0005 |
| glm-4.7 | 1 (empty output) | 1.67 | 1.75 | 1.63 | 1.88 | 1.13 | 2.00 | 38 | 39.7s | $0.0036 |
| qwen3-235b | 2 | 1.33 | 1.33 | 1.56 | 1.78 | 1.00 | 1.33 | 58 | **2.9s** | **$0.0002** |
| glm-4.7-flash | **5** | 1.42 | 1.00 | 0.89 | 1.89 | 0.78 | 1.89 | 44 | 25.6s | $0.0007 |

### Every gate failure, with the specific error

| Model | Case | Gate | Error | Truth |
| --- | --- | --- | --- | --- |
| deepseek-v3.2 | 6x2-as-base | F | "45 seconds per mile faster than your 9:14-10:20 target range" | 50s to the near bound; figure not in brief |
| glm-4.7 | 10x1-vo2max | — | returned an empty note | — |
| glm-4.7-flash | 6x2-vo2max | D | "slow by 3–5 s/mi" → 6:59–7:01 | band floor is 7:03; needs ≥7s |
| glm-4.7-flash | 6x2-as-base | F | "heart rate drifted upward" | decoupling was −0.8% |
| glm-4.7-flash | 6x2-as-base | D | "30s slower than your 7:45 threshold" → 8:15 | band is 9:14–10:20 |
| glm-4.7-flash | 1x20-threshold | D | "shorten recovery to 8:00 or faster" | 8:00 is 15s off threshold pace; no inter-rep recoveries exist on a 1×20 |
| glm-4.7-flash | powered-ride-base | F | "22% of the time above zone two" | 28% (Z3 22 + Z4 6) |
| glm-4.7-flash | easy-run-as-threshold | F | "36 seconds per mile slower than the intended range" | 2:43 slower |
| qwen3-235b | 2x10-threshold | F | "7:39–7:59 threshold pace target"; "28 seconds slower" | band is 7:31–7:59; gap is 8–36s |
| qwen3-235b | powered-ride-base | F | "most of your time was spent above the target base intensity" | 71.1% was at intent or easier |

### Reading the numbers

- **Mean quality is misleading on its own.** glm-4.7 posts the highest mean
  (1.67) only because it is uniformly bland: it scored exactly 1.67 on all eight
  notes it produced, never reaching a 2 on calibration and never below 1. It
  also took 40 seconds a note and returned nothing at all once.
- **Concision splits the field cleanly.** deepseek (41 words) and glm (38) clear
  the 60-word cap every time. kimi lands at 62–69 on all nine — it scores 1 on
  concision nine times out of nine purely on length, not on filler. Sonnet
  averages 72 and broke 85 once. If the cap were 70 words, kimi's quality would
  be **1.85** and sonnet's 1.48.
- **kimi is the only model that never got a fix wrong.** Domain 2 and
  prescriptive 2 on all nine cases — every recommendation named a lever with a
  magnitude and every pace landed inside the target band. It is also the only
  model that reliably hedged the `LOW CONFIDENCE` HR flag (5 of 9 notes) instead
  of ignoring it.
- **Ignore glm-4.7-flash's P and Con columns.** It scores 1.89 on both — the
  highest prescriptiveness in the field — because it always names a specific
  number. The numbers are just wrong. Prescriptiveness measures the *shape* of
  the advice; the gates measure whether it is true. This is the clearest example
  in the run of why the gates exist.
- **Cheap models fail in the most expensive way.** qwen and glm-4.7-flash are the
  two cheapest and they produce the errors that matter most: an invented
  threshold band (7:39), a false "most of your time", a 36-second gap that was
  really 2:43. A note that gets prose slightly wrong is survivable; one that
  misquotes his threshold band is not.

### Recommendation

**Use kimi-k3.** It is the only model with zero gate failures across nine cases,
the only one whose every recommendation both named a magnitude and landed inside
the target band, and the only one that consistently hedged where the brief said
to. Its single defect is length — 62–69 words against a 60-word cap — which is a
prompt fix, not a model fix (tell it 50 words and drop one clause per note).
Cost is the argument against it, and it is a weak one: at $0.0068 a note, a
thousand activities a year is $6.80. The gap to deepseek is $6.30 a year.

**Fallback: deepseek-v3.2**, if terseness and cost dominate. It writes the
tightest notes in the set (41 words, concision 2 on all nine) and produced the
single best note anywhere — the 2x10 threshold note that spotted a stale
threshold pace and told him to re-test it. But it fabricated a derived gap once
in nine, and it has a habit of dropping numbers entirely (28 words with no
figure at all on the 1×20; 33 with none on the ride), which is the opposite of
the "show the working" he asked for. Add an explicit prompt rule — *never
compute a new number; quote the brief's figures only* — and re-run before
trusting it.

**Do not use glm-4.7-flash** (5 of 9 gated, including two recommendations that
would leave him outside the band and a 36-second error that was really 2:43),
**or qwen3-235b** (invented the edge of his threshold band), **or glm-4.7**
(40-second median latency and one empty response, for prose that never rises
above adequate). **claude-sonnet-5** is safe but not good value here: no gates,
but it over-reads small decoupling figures into causal stories three times, and
it is the wordiest model in the set.

### Where I disagree with `scores-claude.md`

Read only after the above was written. It scores Run A only. Its means run about
0.4 higher than mine; the substantive differences:

| Case / model | scores-claude | this file | Why I differ |
| --- | --- | --- | --- |
| deepseek — 6x2-as-base | f=1, 1.67 | **f=0, GATED** | "45 seconds per mile faster" is a derived figure that is not in the brief and is arithmetically wrong (50s). That is the rubric's own faithfulness-0 anchor, quoted almost verbatim. Marking it 1 while gating flash for the same species of error on `easy-run-as-threshold` is inconsistent. (Its second complaint on this note is also wrong: "zone 4 for 45%" **is** in the brief.) |
| flash — 6x2-vo2max | d=2, 1.67 | **d=0, GATED** | It notes "slow by 3–5 s/mi understates the 7s gap" and then passes it. The fix leaves him at 6:59–7:01, outside the band. Same test it applied to gate the base case. |
| flash — powered-ride-base | f=2 | **f=0, GATED** | It missed the number entirely: "22% of the time above zone two" when above-Z2 is 28%. |
| flash — 1x20-threshold | d=1, "odd coaching" | **d=0, GATED** | 8:00/mi is 15 seconds off his threshold pace. Prescribing that as a recovery is not odd, it is wrong, and there are no inter-rep recoveries on a 1×20 anyway. |
| sonnet — 6x2-as-base | f=2, praises the read | **f=1** | "Aerobic system handled it fine, not a fatigue problem" is inferred from −0.8% decoupling and sits against a recorded 60s/mi slowdown. |
| sonnet — 2x10-threshold | d=2, "best analysis of the four" | **d=1, p=1** | "Let pace trail below target if needed" endorses the too-slow pace the note just identified, and it names no pace. The stale-threshold argument it credits sonnet with is deepseek's note, not sonnet's — sonnet never says re-test. |
| sonnet — 10x1 | f=2 | **f=1, d=1** | Agreed that the rep-length insight is the best in Run A, but "50-65 second efforts" misstates the brief's 48–66s, and "at the same or slightly easier pace" leaves the band open. |
| glm-4.7 / flash — hike-recovery | both 2.00 | **d=1** | Both prescribe shortening a hike that the brief scored 100% at or below intent. Drift over 95 minutes of walking is not a fault to fix. |
| glm-4.7 — 2x10-threshold | d=1 (speeding up risks overshoot) | **d=2** | Genuine coin-flip. Its argument is reasonable — HR was already 100% in band — but the brief's verdict is `too-slow` and the band is the stated target. |
| Calibration generally | many 2s | mostly 1 | It gives calibration 2 to notes with no hedge at all (sonnet and deepseek on 6x2) while docking glm and flash to 1 on the same case for exactly that omission. |

Net effect: it found 2 gate failures in Run A, I found 6 (plus glm's empty
note). Its top pick, deepseek-v3.2, is my fallback — the disagreement rests
almost entirely on whether the "45 seconds" figure gates. I think it does, and I
think he would check that subtraction.

### Where I am unsure

- The sonnet 6x2 line "6:56, **well inside** your 7:03–7:27 target". I scored
  faithfulness 1 on the reading that "inside" is the racing idiom for "under".
  Read literally it is a false statement about his own pace band, and he might
  gate it. This is the single score most likely to be wrong.
- I did **not** penalise quoting the stream-inferred rep count, because the
  rubric's own faithfulness-2 anchor quotes "All 6 reps hit target intensity"
  even though the briefs say not to quote the count as exact. If he intends the
  brief's instruction to bind, sonnet, glm-4.7-flash and kimi all lose a
  calibration point on the interval cases.
- Sonnet's ride note says "pace slowed sharply". He marked the ride domain 1 in
  round 1, so he may well take that to 1; I left it at 2 because no
  pace-per-mile figure is actually given.
- Nearly no note hedges the `LOW CONFIDENCE` HR flag. Applied strictly, the
  rubric would put most calibration scores at 1 or below, which is far under his
  round-1 mean of 1.90. I used the looser rule stated at the top; a stricter
  reading would lower every model except kimi.
