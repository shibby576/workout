# AI Cardio Coach

Pick a cardio workout, say what you meant it to be, get a coach's note. One screen, one model call — built as a learning vehicle for eval-driven AI product development.

**The through-line:** almost every hard problem turned out to be domain modelling and data quality, not model quality. The model was the easy part.

## How it works

Strava → deterministic structuring → versioned `SessionSummary` contract → model narrates a coach's note.

The single most important design decision: **everything quantitative is computed in code; the model only narrates.** The structuring step (100% deterministic, no LLM) computes zone time, detects intervals, and judges reps against the target — the model never invents a number because it never computes one. Faithfulness as a property of the system, not a hope.

That decision was load-bearing. Early on, a model told an athlete their "pace was a full 30–60 seconds faster than the 8:56–10:00 range" — the true gap was 32–96s, and no such range existed in the data. The fix wasn't a better prompt; it was removing the model's ability to do arithmetic at all.

## The eval process

A [custom rubric](evals/RUBRIC.md) built from observed failures, not abstract virtues:

- **Anchored 3-point scales** — every score tied to a real example; five-point middles are coin flips
- **Gates, not averages** — a fabricated number or wrong coaching advice is disqualifying, however well it reads
- **Cases are (fixture, intent) pairs** — deliberate mismatches are free and among the most valuable tests

**Model bake-off (round 2):** six models, 60 generations, 30× cost spread.

| Model | Verdict |
|---|---|
| `deepseek/deepseek-v3.2` | **Shipped.** Most consistent, ~10× cheaper than the Sonnet baseline, comparable latency, zero failed generations |
| `anthropic/claude-sonnet-5` | Baseline. Produced the single best coaching insight — and was the wordiest, at 10× the price |
| `glm-4.7-flash`, `qwen3-235b` | Cheapest options. Produced actively wrong advice: invented threshold ranges, gaps misstated 4.5× |

The hypothesis this tested: narrating pre-computed facts isn't a reasoning task, so model size should matter less than instruction-following. It largely held.

**What the evals caught:**
- **First run found a shipping bug.** An easy run mislabelled "threshold" had its two hardest minutes detected as reps — the verdict judged 155 seconds of a 29-minute run and concluded the session hit its target. Exactly backwards.
- **Real data broke the interval detector.** Every run ends with a climb back to the house, and stream detection counted it as a rep. Grade data separated it cleanly (real reps −0.6% to 3.2%, trailing climb 6.7–9.7%) — detection went from 2/6 exact to 6/6. The domain expert's offhand remark beat another day of threshold tuning.
- **LLM judge, validated against human scores.** A judge calibrated on human scoring caught two faithfulness failures the human review missed — a fabricated pace band and a misattributed percentage. The division that emerged: automated judges for mechanical verification, humans for whether the advice is any good. Disagreement between them is the signal.

## Repo map

- `src/cardio/` — the coach app (`ARCHITECTURE.md`, `DESIGN.md`)
- `api/` — Strava + coach serverless routes
- `evals/` — rubric, fixtures, case set, run history
- `scripts/` — `run-eval.mjs` (bake-offs), `generate-note.mjs`, `verify-strava.mjs`
- `/` — the original routine tracker (separate app, same deploy)

## Run it

See `src/cardio/SETUP.md`. Needs Strava API credentials and an OpenRouter key.
