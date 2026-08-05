# Cardio Feedback App — Spec

> **Status: living document.** First-pass scope for the standalone cardio
> feedback app. Kept in sync as the product shape changes. Implementation
> decisions and rationale (data-source comparison, HR-vs-power, storage, the
> `SessionSummary` contract) live in `src/cardio/DESIGN.md`.

## What this is

A small, standalone app that does exactly one thing: you select a cardio
workout, tell it what kind of session you meant it to be, and it gives you AI
feedback on how it went. Nothing else — no routine planning, no adherence
tracking, no history dashboards.

This is deliberately narrow. Two goals:

1. **Personally useful** — get real coaching-style feedback on cardio sessions.
2. **A learning vehicle** — a clean, minimal surface to practice building an AI
   product: splitting work across models by complexity, using hosted
   open-source models, and building an eval process to compare them.

It stands apart from the larger fitness-tracker concept (documented separately).
That larger system may absorb this later, but this app is built and shipped on
its own first.

## Where this is headed (context, not first-pass scope)

This first pass is intentionally tiny, but it's the front end of a larger
direction. None of the below is being built now — it's here so implementation
choices leave room for it.

- **Positioning:** an intelligence layer on top of existing trackers, not a
  replacement. "Mint.com for fitness" — leverage best-in-class tools people
  already use (Hevy, Garmin, Strava) rather than trying to replace their
  logging. This feedback app is the thin end of that: it adds intelligence on
  top of existing activity data without asking anyone to change how they log.
- **Feedback deepens over time** — from single-session notes (this app) →
  cross-workout trends and progression → correctness judgment against a defined
  plan → proactive nudges when a routine goes stale.
- **From feedback to planning** — eventually suggest what to do today/this week
  based on recent training and recovery, and generate full routines from goals,
  equipment, and season.
- **Richer data sources** — beyond Strava to direct Garmin/Hevy/Whoop/Oura
  pulls, unlocking recovery/readiness signals (sleep, HRV, training readiness)
  that make same-day guidance possible.
- **Coaching as a product** — real trainers licensing their methodology as AI
  coach personas, and/or the engine sold to human trainers as a tool for their
  own clients.

The through-line: this app is step one of a coaching intelligence layer. Keep
the model pipeline and data handling modular enough that feedback can later
broaden across workouts, disciplines, and data sources.

## Core flow

1. **Select workout** — pick one cardio activity pulled from Strava.
2. **State intent** — pick the intended session type:
   **recovery / base / threshold / VO2max**. That's the only input required (no
   target pace/HR/power entry for this first pass — the type alone gives the
   model enough context).
3. **Structure it** — compute the objective picture of the session from the
   activity data (pure code; see `SessionSummary`).
4. **Generate feedback** — produce the coach's note (one model call).
5. **Show the card** — structured metrics + coach's note.

## Output: the feedback card (two parts)

- **Structured metrics block** — factual, computed, not generated. Framed
  against the stated intent so the numbers mean something:
  - a **verdict line** — the intent and how the session read against it; a
    mismatch is the headline (e.g. "meant as threshold, reads like base");
  - **intensity** — the banding metric (**power / pace / HR**, labeled which),
    with the zone breakdown shown *relative to the intent's target band*
    (in / below / above band);
  - **cost & drift** — HR average/max and aerobic decoupling (HR climbing
    relative to output over the session);
  - **structure** — steady vs intervals, compared to what the intent implies;
  - splits and duration.
- **Coach's note** — a short generated qualitative write-up: how the session
  went relative to the stated intent, what stands out, and one thing to consider
  next time. Recent/present-oriented — about this session, not long-term trends.
  Includes a **regenerate** action (useful for eyeballing model variance during
  the eval phase).

## Metrics: HR vs. power

Power/pace measure **external load** (work produced); HR measures **internal
load** (physiological cost). Good evaluation uses both, and the relationship
between them (decoupling) is a key quality signal. Banding picks the best
available *output* metric — **power > pace for runs, power for bikes, HR last**.
Power is a first-class *optional* metric (present for cyclists with a meter and
some runners; absent for most runners). See `DESIGN.md` for the full rationale.

## Model architecture — two tasks, matched to complexity

The whole point of the two-step split is to practice using cheaper models for
simple tasks and stronger ones where reasoning matters.

1. **Structuring step (low complexity)** — raw Strava data (pace, HR, power,
   splits, streams) → structured metrics block (`SessionSummary`). **100% code,
   no LLM** — including no "cheap classifier" for interval detection in v1;
   that's a deterministic signal-processing job (thresholds + hysteresis, or
   device laps).
2. **Generation step (higher complexity)** — structured metrics + stated intent
   → coach's note. This is the real reasoning/writing task and the one worth
   investing model quality in. Single model call, one-shot (not chat),
   server-side (the model key must stay secret).

## Model experimentation & evals

- Start with one model per task: none for structuring, a strong model for
  generation. Don't compare multiple models until the single-model version works
  end to end.
- Open-source models run via a hosted API — **OpenRouter** is the pick for the
  comparison phase (one OpenAI-compatible endpoint, many models behind a
  model-id string, so comparison is a config loop).
- Once generation is stable, **build the eval set collaboratively** (not
  auto-generated): a handful of sample workouts (varied types and quality of
  execution, drawn from real saved fixtures) plus a scoring rubric —
  **faithfulness** (does the note only claim what the metrics/signals support),
  **intent-alignment**, **usefulness** (is the "next time" actionable), **tone**
  (coach, not robot). Use it to compare candidate generation models objectively.
  This eval habit is itself one of the things to learn here.

## Scope

**In scope (first pass):**

- Cardio workouts only
- Single intent type input (recovery/base/threshold/VO2max), no target entry
- Strava as the data source (ingestion behind a source interface so
  Garmin/Whoop/Oura can slot in later)
- Power as a first-class optional metric alongside HR/pace
- One workout at a time, one-shot feedback
- Structured metrics + coach's note output
- **Two-tier storage:** version-controlled JSON fixtures (raw payload +
  `SessionSummary` + note, GPS stripped) for the eval set, and localStorage for
  saved cards / future trends

**Out of scope (first pass):**

- Lifting or any non-cardio feedback
- Multi-turn / chat interface
- Cross-workout trend analysis or long-term progression narrative
- Routine definition, matching, or adherence tracking (the separate larger app)
- Target-pace/HR/power entry and precise actual-vs-target scoring (intent type
  only for now)
- Automated multi-model eval harness (manual, collaborative eval set first)
- A database / cross-device or multi-user storage

## Build sequence

0. **`SessionSummary` contract** + design notes. ✅
1. **Strava ingestion** behind a source interface: streams + laps + activity
   detail endpoints, plus athlete zones + FTP for the one-time setup gate
   (reuse existing OAuth/token plumbing).
2. **Structuring step** — compute `SessionSummary` in pure code; save raw
   fixtures as we go. Add a model only if a genuine need appears (default: no).
3. **Select + intent UI** — pick a workout, then pick the session type.
4. **Generation step** — server-side model call: structured metrics + intent →
   coach's note.
5. **Feedback card UI** — metrics block (intent-framed) + coach's note +
   regenerate.
6. **(Then) model comparison** — swap in hosted open-source model(s) via
   OpenRouter and build the eval rubric to compare, collaboratively.

## Open technical items

- **Resolved:** Strava exposes HR/pace/power/cadence/altitude **streams**
  (`/activities/{id}/streams`) plus `splits_*` and `laps` on the activity
  detail — this is what makes the structuring step rich.
- **Scope:** reading athlete HR/power **zones** and **FTP** needs the
  `profile:read_all` OAuth scope. Where it's absent, fall back to a one-time
  max-HR entry (HR zones) and skip power banding.
- Strava OAuth for a personal-use app (already implemented; reused).
- Hosted-inference provider for the open-source model step: OpenRouter.
