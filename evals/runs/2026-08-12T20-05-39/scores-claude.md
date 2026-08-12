# Independent scores — Claude

Scored against `evals/RUBRIC.md` before reading any human scores for this run.
0 = fail, 1 = partial, 2 = pass. Faithfulness and domain are gates.

Format: `f d p c v` → faithfulness, domain, prescriptive, calibration, concision.

---

## 6x2-vo2max

| model | f | d | p | c | v | result | reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sonnet-5 | 1 | 2 | 2 | 2 | 1 | 1.67 | **"well inside your 7:03–7:27 target" is wrong — 6:56 is faster than 7:03, and the brief's verdict was too-fast. It then contradicts itself with "you went too hard early". Misstates a given fact.** 66w. |
| deepseek-v3.2 | 2 | 2 | 2 | 2 | 2 | 2.00 | Clean cause→effect→fix. "start 15 seconds per mile slower" is the right lever. 48w. |
| glm-4.7 | 2 | 2 | 2 | 1 | 2 | 1.67 | Correct and very terse (30w) but no hedge on the HR read the brief flagged low-confidence. |
| glm-4.7-flash | 2 | 2 | 2 | 1 | 2 | 1.67 | "slow by 3–5 s/mi" understates the 7s gap. No confidence hedge. 56w. |

## 6x2-as-base

| model | f | d | p | c | v | result | reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sonnet-5 | 2 | 2 | 2 | 2 | 1 | 1.67 | Correct, good "pace problem not fatigue problem" read. 72w. |
| deepseek-v3.2 | 1 | 2 | 2 | 2 | 2 | 1.67 | "45 seconds faster" is derived (real gap 50s to the fast bound); "zone 4 for 45%" not in the brief as stated. |
| glm-4.7 | 2 | 2 | 2 | 2 | 2 | 2.00 | Terse and correct; 10:00 target is inside the band. 35w. |
| glm-4.7-flash | 2 | **0** | 1 | 2 | 2 | **GATED** | **"Run at least 30 seconds slower than your 7:45 threshold pace" = 8:15, still far faster than the 9:14–10:20 base target. Following this advice would not fix the problem.** |

## 2x10-threshold

| model | f | d | p | c | v | result | reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sonnet-5 | 2 | 2 | 2 | 2 | 0 | 1.33 | Best analysis of the four — "hold effort by HR rather than chasing the pace number" is right when the pace anchor is suspect. But **86 words**, over the fail line. |
| deepseek-v3.2 | 2 | 2 | 2 | 2 | 2 | 2.00 | **Best note in the run.** Correctly infers the threshold pace itself may be wrong and prescribes re-testing it — the actual root cause. |
| glm-4.7 | 2 | 1 | 2 | 1 | 2 | 1.67 | "Increase your pace to the lower end of the target range" ignores that HR was already at target; speeding up risks overshooting. |
| glm-4.7-flash | 1 | 1 | 2 | 2 | 2 | 1.67 | "This mismatch caused positive aerobic decoupling" — asserts causation the data does not establish. Same speed-up issue. |

## 1x20-threshold

| model | f | d | p | c | v | result | reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sonnet-5 | 2 | 2 | 2 | 2 | 1 | 1.67 | Strong structural fix (split into 2x15-18min). 80w. |
| deepseek-v3.2 | 2 | 1 | 1 | 1 | 2 | 1.33 | Blames heat with no supporting data; "schedule for a cooler time of day" is weak and near-generic. |
| glm-4.7 | 2 | 2 | 2 | 2 | 2 | 2.00 | Terse, correct, "anchor effort to pace rather than HR" is sound. 36w. |
| glm-4.7-flash | 2 | 1 | 2 | 2 | 2 | 1.67 | Uses the new recovery data, but prescribing a *faster recovery* after a single continuous block is odd coaching. |

## 10x1-vo2max

| model | f | d | p | c | v | result | reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sonnet-5 | 2 | 2 | 2 | 2 | 1 | 1.67 | **Best coaching insight in the whole run** — identifies that 50–65s reps are too short for HR to reach Z4/5, so the session became tempo rather than VO2. Prescribes lengthening reps. 81w. |
| deepseek-v3.2 | 2 | 1 | 2 | 2 | 2 | 1.67 | Correct on pace but misses the real issue: rep *length*, not pace, is why HR stayed low. |
| glm-4.7 | — | — | — | — | — | **FAILED** | Returned no note. |
| glm-4.7-flash | 2 | 1 | 2 | 2 | 2 | 1.67 | Same miss as deepseek — treats it as a pace problem. |

## easy-run-recovery

| model | f | d | p | c | v | result | reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sonnet-5 | 2 | 2 | 2 | 2 | 1 | 1.67 | Carries the sub-fault nuance correctly and hedges HR. 65w. |
| deepseek-v3.2 | 2 | 2 | 2 | 1 | 2 | 1.67 | Fine, but no hedge on the low-confidence HR read. |
| glm-4.7 | 2 | 2 | 2 | 1 | 2 | 1.67 | "Walk hills" is a nice concrete lever. No confidence hedge. |
| glm-4.7-flash | 2 | 1 | 1 | 2 | 2 | 1.67 | "Trust perceived exertion over the power meter" — power was never used to judge this session, so the advice is aimed at the wrong instrument. |

## powered-ride-base

| model | f | d | p | c | v | result | reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sonnet-5 | 2 | 1 | 2 | 2 | 1 | 1.67 | Still says "pace slowed sharply" on a ride. 67w. |
| deepseek-v3.2 | 2 | 2 | 2 | 2 | 2 | 2.00 | Sport-appropriate, no pace language, correct lever. 33w. |
| glm-4.7 | 2 | 2 | 2 | 2 | 2 | 2.00 | "Cap intensity at the top of Zone 2" — right advice, right units. 38w. |
| glm-4.7-flash | 2 | 1 | 1 | 2 | 2 | 1.67 | "Reduce your target power by 10%" — no power threshold is set, so there is no target power to reduce. |

## hike-recovery

| model | f | d | p | c | v | result | reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sonnet-5 | 2 | 2 | 2 | 2 | 2 | 2.00 | Correctly attributes drift on a long easy hike to heat/hydration rather than fitness. 63w. |
| deepseek-v3.2 | 2 | 2 | 2 | 2 | 2 | 2.00 | Concise and correct. 31w. |
| glm-4.7 | 2 | 2 | 2 | 2 | 2 | 2.00 | Correct. 33w. |
| glm-4.7-flash | 2 | 2 | 2 | 2 | 2 | 2.00 | Correct. 38w. |

## easy-run-as-threshold

| model | f | d | p | c | v | result | reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sonnet-5 | 2 | 2 | 2 | 2 | 2 | 2.00 | "This wasn't a threshold session, it was an aerobic run" — exactly the right call, and prescribes the structural fix. 56w. |
| deepseek-v3.2 | 2 | 2 | 2 | 2 | 2 | 2.00 | Correct and concise. |
| glm-4.7 | 2 | 2 | 2 | 2 | 2 | 2.00 | Correct. |
| glm-4.7-flash | **0** | 1 | 2 | 2 | 2 | **GATED** | **"10:42 per mile, which is 36 seconds per mile slower than the intended range" — the real gap is 163 seconds. Off by more than 4x, and no such number is in the brief.** |

## hiit-no-distance *(robustness)*

All four correctly declined with a single sentence and none invented a pace.
Sonnet's was marginally wordier. **All pass.**

---

## Totals (core set, 9 cases)

| model | gated | mean quality | notes |
| --- | --- | --- | --- |
| deepseek-v3.2 | 0 | **1.81** | Most consistent. Best single note in the run. |
| claude-sonnet-5 | 0 | 1.70 | Best domain insight, dragged down by concision (median 67w). |
| glm-4.7 | 0 (1 hard failure) | 1.90 of 8 scored | Terse and accurate, but one empty response and ~40s latency. |
| glm-4.7-flash | **2** | 1.79 | Two gate failures, both actively misleading advice. |
