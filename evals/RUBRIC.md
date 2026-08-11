# Coach's Note — Evaluation Rubric

**v1.** Used to compare generation models objectively rather than by eye.

## How this rubric was built

Every dimension below comes from a failure that actually occurred while building
this app, not from a list of abstract virtues. That matters: you only need to
measure what genuinely goes wrong, and anchoring each score to a real example
makes two scorers (or a human and a judge model) far more likely to agree.

Each anchor quotes real generated output where one exists.

## Scoring

Three points per dimension — **fail (0) / partial (1) / pass (2)**. Three points
is deliberate: five-point scales sound more precise but the middle grades resist
anchoring, so 2-vs-3 becomes a coin flip and adds noise rather than signal.

**Faithfulness** and **Domain correctness** are **gates**. A fail on either
sinks the note regardless of how well it reads — an invented number or wrong
coaching advice is disqualifying in a way that clumsy prose is not.

The remaining three (Prescriptiveness, Calibration, Concision & voice) average
into a **quality score out of 2**.

A note's result is therefore: `GATED` (failed a gate) or a quality score.

---

## 1. Faithfulness *(GATE)*

Does the note claim only what the brief supports?

The structuring step computes every number; the model's job is to narrate them.
Any number the model produces that isn't in the brief is fabricated, however
plausible it looks.

| Score | Anchor |
| --- | --- |
| **0 — fail** | States a metric listed as unavailable, or a number absent from the brief. Real example: *"pace was a full 30-60 seconds faster than the 8:56-10:00 range"* — the model derived "30-60"; the true gap was 32–96s and no such range was given. |
| **1 — partial** | All numbers correct, but asserts a cause the data doesn't establish. E.g. *"you started too hot and paid for it"* when only a positive split is recorded — plausible, unproven. |
| **2 — pass** | Every number and claim traces to the brief. Causal language is hedged where the data only shows correlation. Real example: *"All 6 reps hit target intensity, output held steady across reps, and HR sat in zone 4-5 for 96% of the session."* |

Check: for each number in the note, find it in the brief. Not found → 0.

## 2. Domain correctness *(GATE)*

Is the coaching judgment right for the stated intent?

| Score | Anchor |
| --- | --- |
| **0 — fail** | Advice contradicts training convention. E.g. treating Z5 time as a problem on a **vo2max** day (Z5 is the target); calling the climb home an extra rep; telling the athlete to push harder on a **recovery** run. |
| **1 — partial** | Verdict right, reasoning muddled or a secondary claim off. |
| **2 — pass** | Verdict and reasoning match how a coach reads that session type. Real example: *"Six minutes drifted into zone 4... recovery days should stay boring throughout."* |

Reference: `src/cardio/intentBands.ts` defines the intended reading per intent.

## 3. Prescriptiveness

Does the note end with something the athlete can act on?

| Score | Anchor |
| --- | --- |
| **0 — fail** | No recommendation, or an inquiry that hands the problem back. Real example: *"check if terrain or heat pushed HR up"*, *"check conditions before assuming pace was the problem"*. |
| **1 — partial** | An action, but without a lever or magnitude: *"go easier next time"*, *"stay controlled"*. |
| **2 — pass** | Specific lever with magnitude. Real examples: *"Slow the reps by 15-20s/mile next time"*; *"if HR climbs into zone 4, slow down immediately"*; *"set your threshold power"*. |

Exemption: a session executed perfectly may say so and stop — but it should
then offer the next progression.

## 4. Calibration

Does stated confidence match the data's confidence?

| Score | Anchor |
| --- | --- |
| **0 — fail** | Asserts a low-confidence reading as exact — e.g. quoting a stream-inferred rep count as fact, or treating an HR-only zone split as precise when the brief says `LOW CONFIDENCE`. |
| **1 — partial** | Hedges, but vaguely or in the wrong place. |
| **2 — pass** | Hedges exactly where the brief flags uncertainty, without hedging everything. Real example: *"HR-based zones are directional here, not exact."* |

## 5. Concision & voice

Terse, direct, analytical. 2–4 sentences, 60 words max.

| Score | Anchor |
| --- | --- |
| **0 — fail** | Over ~85 words, or filler and throat-clearing. Real example (115 words): *"This held together as a recovery run... the kind of excursion that adds up if it becomes a pattern, and heart-rate-based zones lag effort anyway so treat that spike as a signal rather than gospel."* |
| **1 — partial** | 61–85 words, or one filler phrase, or restates numbers already visible in the metrics block. |
| **2 — pass** | ≤60 words, every sentence earns its place, opens with the finding. Real example: *"This ran as a tempo effort, not base."* |

Banned phrasings (any one caps this dimension at 1): "worth flagging", "the kind
of thing that", "it's important to note", "that said", "overall", "generally
speaking", "keep in mind".

---

## Scoring sheet

For each case record:

```
case:        <fixture id> / <intent>
model:       <model id>
faithfulness:  0 | 1 | 2      <- gate
domain:        0 | 1 | 2      <- gate
prescriptive:  0 | 1 | 2
calibration:   0 | 1 | 2
concision:     0 | 1 | 2
result:      GATED | quality = mean(prescriptive, calibration, concision)
notes:       <what specifically went wrong>
```

## Known scoring hazards

- **Do not reward fluency.** A confident, well-written note that invents a number
  is worse than an awkward one that doesn't. The gates exist for this.
- **Score against the brief, not against the truth.** If structuring computed
  something wrong, that's a structuring bug, not a generation failure. Log it
  separately.
- **Sample more than once.** Temperature is 0.7, so a single generation per model
  measures luck as much as quality. Where a result is close, generate 3 and score
  all of them.
