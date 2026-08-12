# Post outline — building an AI cardio coach

Working title options:
- *What a coaching app learns when you give it real data*
- *The model wasn't the hard part*
- *Building an AI product where 90% of the work isn't the AI*

---

## The frame

A deliberately tiny product: pick a cardio workout, say what you meant it to be,
get coaching feedback. One screen, one model call. Built as a learning vehicle
for three specific things — splitting work across models by complexity, using
hosted open-source models, and building a real eval process.

**The through-line of the whole post:** almost every hard problem turned out to
be domain modelling and data quality, not model quality. The model was the easy
part.

---

## Part 1 — Decisions made before writing code

Worth its own section because these were the ones that mattered most.

**Data source: Strava over Garmin.** Both expose HR/pace streams, splits and
laps. Garmin has higher fidelity and unlocks recovery signals (HRV, sleep) — but
none of that was in scope, and it comes with an approval process, OAuth1.0a and
webhook infrastructure. Strava was self-serve OAuth2. *Lesson: pick the source
that serves the scope you actually have, and abstract ingestion so the richer
one can slot in later.*

**The seam is the product.** One decision carried more weight than any other: a
clean, versioned JSON contract (`SessionSummary`) between the deterministic step
and the generative one. Everything downstream — swapping models, running evals,
adding data sources — hangs off it. *If the seam is clean, an eval is just
"feed saved summaries to N models".*

**Splitting by complexity, honestly.** Structuring is 100% code. The spec floated
a "cheap classifier" for interval detection; that would have been manufactured
complexity. The point of splitting by complexity is to use models where
reasoning is genuinely needed — inventing a model-shaped job defeats it.

---

## Part 2 — Domain modelling nobody warns you about

This is the part that will surprise readers who think this is an LLM project.

**There is no single standard for training zones.** Five-zone HR (consumer),
seven-zone Coggan %FTP (cycling), Daniels VDOT paces (running), three-zone
polarized (research). We picked one and recorded which config produced each
result, so results stay reproducible.

**"Too hard" is a failure for almost every intent.** The naive model is "did you
hit the target". Real coaching is asymmetric: on an easy day, going hard is the
error; on a threshold day, both too easy *and* too hard are errors, because
threshold work must stay sustainable. On a VO2max day, being in the top zone is
correct — so overcooking shows up as *fade across reps*, not as a zone.

**Power and heart rate answer different questions.** Power is what you produced;
HR is what it cost. The relationship between them (decoupling) is the quality
signal. Running power is not cycling power — banding a run against a bike FTP
would put every easy run in the top zone.

---

## Part 3 — Where real data broke the assumptions

The strongest section. Every one of these was invisible until real sessions
arrived, and each is a concrete before/after.

1. **Auto-laps aren't intervals.** Every interval session in 300 activities
   arrived as identical one-mile auto-laps, because the athlete never presses the
   lap button. A `6x2` workout read as "2 work reps". Worse, that cascaded:
   banding scopes to work reps, so the verdict judged a fraction of the run.
   Fix: detect intervals from the output stream, and reject uniform-distance laps
   outright.

2. **The hill home.** Stream detection was consistently one rep too high. The
   athlete explained it in one sentence: every run ends with a climb back to the
   house. The grade data separated it cleanly — real reps at −0.6% to 3.2%, every
   trailing climb at 6.7–9.7%. Detection went from 2/6 exact to **6/6**.
   *Lesson: the domain expert's offhand remark was worth more than another day of
   threshold tuning.*

3. **You cannot classify intervals by amplitude.** A 95-minute hike separated its
   two halves more strongly than any genuine interval workout. So detection was
   gated on stated intent instead — we're judging against what you meant to do
   anyway.

4. **Percentages that mislead.** A recovery run reported "43.9% in the recovery
   band" when 90%+ of it was fine — the tolerated zone had been excluded from the
   denominator. Honest proportions matter more than technically-correct ones.

5. **Silent failure modes:** streams 404 on treadmill activities; zero zone-time
   producing a confident "on target — 0%" verdict out of nothing.

---

## Part 4 — The eval, and what it actually caught

**Build the rubric from observed failures, not abstract virtues.** Every
dimension came from something that had actually gone wrong: a fabricated number,
an inquiry masquerading as advice, a 115-word note. Anchor each score to a real
example — "accurate" is not checkable, "contains a number not in the brief" is.

**Three points, not five.** Middle grades of a five-point scale resist anchoring,
so 2-vs-3 becomes a coin flip and adds noise.

**Gates, not averages.** An invented number is disqualifying in a way clumsy
prose is not.

**An eval case is a (fixture, intent) pair.** The same run becomes a different
test depending on the intent attached. Deliberate mismatches are free and among
the most valuable cases.

**It found a bug on its first run.** An easy run mislabelled "threshold" had its
two hardest minutes detected as reps; the verdict then judged 155 seconds of a
29-minute run and concluded the session hit its target. Exactly backwards.

---

## Part 5 — The model comparison

Six models, 60 generations, 30× cost spread.

- The **10× cheaper open model matched or beat** the frontier baseline on this
  task, and shipped.
- The most expensive model wrote the single best note — and was also the
  wordiest.
- The **cheapest models produced actively wrong advice**: a recommendation that
  still landed outside the target band, a gap misstated by 4.5×, an invented
  threshold range.
- One "failure" was ours: a reasoning model returned empty notes because it billed
  thinking against `max_tokens`. *Always check whether a bad result is the model
  or your configuration.*

**The hypothesis this tested:** narration of pre-computed facts is not a
reasoning task, so model size should matter less than instruction-following. It
largely held.

---

## Part 6 — The meta-lesson: who should score

Built an LLM judge calibrated on the athlete's own scoring notes. It caught two
faithfulness failures the human review missed — a fabricated pace band and a
misattributed percentage — and applied the rubric more consistently than its
author did.

**The division that emerged:** automated judges are better at *mechanical
verification* (does every number trace to the source). Humans are better at
*whether the advice is any good*. Use both, and treat their disagreement as the
signal.

Caveat worth keeping: a judge calibrated to you agrees with you by construction.
Its agreement isn't evidence — validate it against a sample you scored yourself.

---

## Closing

What the project actually taught, in one line each:

- The seam between deterministic and generative code is the most important
  design decision, and it's not an AI decision.
- Real data invalidates assumptions that synthetic tests happily confirm.
- The domain expert's throwaway comment beats another day of parameter tuning.
- Evals earn their cost the first time they catch a bug you were about to ship.
- Cheap models are often good enough for narration; the failures that matter are
  wrong advice, not clumsy prose.
