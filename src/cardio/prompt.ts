// Prompt construction for the generation step.
//
// The model's job is to NARRATE facts, never to compute them. Everything
// quantitative is worked out in structuring and handed over here as a rendered
// brief; the model turns it into a coach's note. That split is the main
// anti-hallucination lever and the thing the eval measures as faithfulness.
//
// The brief is rendered as labelled plain text rather than raw JSON on purpose:
// it removes the parsing burden (which matters when comparing smaller
// open-source models), and it means a failing eval case can be read directly to
// see exactly what the model was told.
//
// Pure and isomorphic — the API route and the eval harness build identical
// prompts, so evals score the same text the app sends.

import { INTENT_LABELS, duration, pace, shortDuration } from './format.ts';
import type { HrZone, SessionSummary, Signal } from './sessionSummary.ts';
import { ZONES } from './zones.ts';

export interface CoachPrompt {
  system: string;
  user: string;
}

export const PROMPT_VERSION = '1';

// Voice: direct and analytical — lead with what the data shows. Chosen
// deliberately; it is also the most objectively scoreable tone in the eval.
const SYSTEM = `You are an experienced endurance coach reviewing a single training session.

VOICE
- Direct and analytical. Lead with what the data shows.
- Terse. Short declarative sentences. One idea per sentence.
- No pep talk, no exclamation marks, no praise the data does not support.
- Address the athlete as "you". Plain language, not jargon soup.

LENGTH
- 2 to 4 sentences. 60 words maximum — this is a hard limit, not a target.
- No headings, no bullet points, no markdown.

BE SELECTIVE
- Mention a metric only if it changes the verdict or the advice.
- Say nothing about metrics that are unremarkable. "X is normal" is a wasted sentence.
- Pick the single most useful observation. Do not inventory the session.

CUT THESE
- Hedging and filler: "worth flagging", "the kind of thing that", "it's important to note",
  "that said", "overall", "generally speaking", "keep in mind".
- Throat-clearing openers: "This held together as", "This came in", "Looking at the data".
  Start with the finding itself.
- Restating a number you have already given, or explaining what a metric means.
- Multi-clause sentences chained with dashes and "and ... which ... so".

WHAT TO WRITE
1. How the session went against the stated intent.
2. The one thing that most stands out — prefer a specific detail over a summary.
3. One concrete thing to consider next time.

HARD RULES
- Use ONLY the facts in the brief. Never invent, estimate or recompute a number.
- Never state a metric listed as unavailable. If heart rate or power is missing, do not mention it.
- Do not simply restate the numbers; the athlete can already see them. Say what they mean.
- When the brief flags low confidence, do not write as if the reading were precise.
- When a minor excursion is noted, treat it as nuance worth mentioning, not as a failed session.
- Never prescribe medical advice or specific training loads you were not given.`;

function fmtSignal(s: Signal): string {
  const d = s.detail ?? {};
  switch (s.code) {
    case 'on_target':
      return `Execution matched the intent (${d.acceptablePct}% of the session at the intended effort or easier).`;
    case 'zone_mismatch':
      return `Execution did NOT match the intent: ${d.fault === 'too-hard' ? 'harder' : 'easier'} than intended, with ${shortDuration(Number(d.offBandSec) || 0)} outside the target band.`;
    case 'time_above_band':
      return `Minor excursion: ${shortDuration(Number(d.sec))} (${d.pct}%) drifted above the target band${d.peakZone ? `, reaching zone ${d.peakZone}` : ''}. Under the threshold that would count as a failed session, but worth a mention.`;
    case 'time_below_band':
      return `Minor excursion: ${shortDuration(Number(d.sec))} (${d.pct}%) sat below the target band.`;
    case 'high_drift':
      return `Heart rate climbed relative to output through the session (decoupling ${d.decouplingPct}%) — typically fatigue, heat or dehydration.`;
    case 'negative_drift':
      return `Output rose relative to heart rate through the session (decoupling ${d.decouplingPct}%) — a strong finish.`;
    case 'negative_split':
      return `Negative split: finished faster than started (${pace(Number(d.firstSplitSecPerMi))} to ${pace(Number(d.lastSplitSecPerMi))} per mile).`;
    case 'positive_split':
      return `Positive split: slowed through the session (${pace(Number(d.firstSplitSecPerMi))} to ${pace(Number(d.lastSplitSecPerMi))} per mile).`;
    case 'dominant_zone':
      return `Most time was spent in zone ${d.zone} (${d.pct}%).`;
    case 'interval_session':
      return d.confidence === 'low'
        ? `Reads as an interval session, roughly ${d.workReps} work efforts — inferred from the pace/power trace rather than marked laps, so treat the count as approximate and do not quote it as exact.`
        : `Detected as an interval session: ${d.workReps} work reps (from the athlete's own lap markers).`;
    case 'hill_finish':
      return `The session ends with a ${d.durationSec}s climb at ${d.gradePct}% grade (+${d.climbMeters}m). This is the route home, not a rep — it is excluded from the rep count. Do not call it an extra interval.`;
    case 'rep_fade':
      return `Work reps faded ${d.fadePct}% from first to last (measured by ${d.basis}) — usually a sign the opening reps were too hard to repeat.`;
    case 'rep_build':
      return `Work reps got stronger across the set (${Math.abs(Number(d.fadePct))}% build).`;
    case 'reps_missed_target':
      return `${d.hit} of ${d.total} work reps reached the target intensity.`;
    case 'expected_intervals_but_steady':
      return `The intent implies intervals, but the session reads as one steady effort — no distinct work reps were detected.`;
    case 'pace_on_target':
      return `Pace was in the target range for this session type.`;
    case 'pace_off_target':
      return `Pace was ${d.verdict === 'too-fast' ? 'FASTER' : 'SLOWER'} than the target range for this session type (ran ${pace(Number(d.actualSecPerMi))}, target ${pace(Number(d.targetFastSecPerMi))}–${pace(Number(d.targetSlowSecPerMi))} per mile).`;
    case 'low_banding_confidence':
      return `LOW CONFIDENCE: intensity was judged on ${d.judgedBy === 'hr' ? 'heart rate alone, which lags the effort and drifts with heat, sleep and fatigue' : String(d.judgedBy)}. Treat the zone split as directional, not exact.`;
    case 'cannot_band':
      return `Intensity could not be judged at all (${d.reason}). Do not comment on effort level or zones.`;
    case 'power_without_threshold':
      return `A power meter recorded ${d.avgWatts}W average, but no threshold power is set, so power could not be used to judge intensity.`;
    case 'summary_data_only':
      return `Only summary data was available for this activity — no per-second detail.`;
    case 'no_hr_data':
      return `No heart rate was recorded. Do not mention heart rate.`;
    case 'no_power_data':
      return `No power was recorded. Do not mention power.`;
    default:
      return `${s.code}${s.detail ? ` ${JSON.stringify(s.detail)}` : ''}`;
  }
}

function zoneLine(zoneSeconds: Record<HrZone, number>, target: HrZone[]): string {
  const total = ZONES.reduce((a, z) => a + zoneSeconds[z], 0);
  if (total <= 0) return '';
  return ZONES.map((z) => {
    const pct = Math.round((zoneSeconds[z] / total) * 100);
    const mark = target.includes(z) ? '*' : ' ';
    return `Z${z}${mark} ${shortDuration(zoneSeconds[z])} (${pct}%)`;
  }).join('  ');
}

/** Renders the SessionSummary into the brief the model reads. */
export function buildCoachPrompt(s: SessionSummary): CoachPrompt {
  const L: string[] = [];
  const intentLabel = INTENT_LABELS[s.intent];

  L.push(`INTENDED SESSION TYPE: ${intentLabel.toUpperCase()}`);
  L.push('');
  L.push('SESSION');
  L.push(`- Activity: ${s.activity.sportType}`);
  L.push(`- Moving time: ${duration(s.duration.movingSec)}`);
  if (s.distance) L.push(`- Distance: ${s.distance.miles} mi`);
  if (s.pace) L.push(`- Average pace: ${pace(s.pace.avgPaceSecPerMi)} per mile`);
  if (s.heartRate) L.push(`- Heart rate: ${s.heartRate.avg} avg, ${s.heartRate.max} max`);
  if (s.power) {
    L.push(
      `- Power: ${s.power.avgWatts}W avg${s.power.normalizedWatts ? `, ${s.power.normalizedWatts}W normalized` : ''}`,
    );
  }

  if (s.intentBand) {
    const b = s.intentBand;
    L.push('');
    L.push('INTENSITY VS INTENT');
    L.push(`- Target zones for a ${intentLabel.toLowerCase()} session: ${b.targetZones.join(' and ')}`);
    L.push(`- Judged on: ${b.primaryMetric}${b.scope === 'work-reps' ? ' (work reps only — recovery periods excluded)' : ''}`);
    L.push(`- In target zones: ${b.inBandPct}% of the session`);
    if (b.tolerantSec > 0) L.push(`- At the intended effort or easier: ${b.acceptablePct}%`);
    L.push(`- Verdict: ${b.fault === 'none' ? 'on target' : b.fault === 'too-hard' ? 'harder than intended' : 'easier than intended'}`);
    const zs = b.primaryMetric === 'power' ? s.power?.zoneSeconds : s.heartRate?.zoneSeconds;
    if (zs) {
      const line = zoneLine(zs, b.targetZones);
      if (line) L.push(`- Time in zone (* = target): ${line}`);
    }
  }

  if (s.paceTarget) {
    const p = s.paceTarget;
    L.push('');
    L.push('PACE VS TARGET');
    L.push(`- Ran: ${pace(p.actualSecPerMi)} per mile${p.basis === 'work-reps' ? ' across the work reps' : ''}`);
    L.push(`- Target for this session type: ${pace(p.targetFastSecPerMi)}–${pace(p.targetSlowSecPerMi)} per mile`);
    L.push(`- Verdict: ${p.verdict}`);
  }

  if (s.structure) {
    L.push('');
    L.push('STRUCTURE');
    L.push(`- ${s.structure.workReps} work reps detected (${s.structure.source})`);
    if (s.structure.sustainability) {
      const su = s.structure.sustainability;
      L.push(`- Reps reaching target intensity: ${su.repsHittingTarget} of ${su.totalWorkReps}`);
      L.push(`- Output change first rep to last: ${su.fadePct > 0 ? `-${su.fadePct}% (faded)` : `+${Math.abs(su.fadePct)}% (held or built)`}`);
    }
  } else {
    L.push('');
    L.push('STRUCTURE');
    L.push('- One continuous effort; no intervals detected.');
  }

  if (s.drift) {
    L.push('');
    L.push(`AEROBIC DECOUPLING: ${s.drift.decouplingPct}% (positive = heart rate rising relative to output)`);
  }

  L.push('');
  L.push('KEY OBSERVATIONS (already computed — narrate these, do not recalculate)');
  s.signals.forEach((sig) => L.push(`- ${fmtSignal(sig)}`));

  const missing: string[] = [];
  if (!s.availability.heartRate) missing.push('heart rate');
  if (!s.availability.power) missing.push('power');
  if (!s.availability.velocityOrGps) missing.push('pace/distance');
  if (s.availability.streamResolution === 'summary-only') missing.push('per-second detail');
  if (missing.length) {
    L.push('');
    L.push(`DATA NOT AVAILABLE (never mention these): ${missing.join(', ')}`);
  }

  L.push('');
  L.push(`Write the coach's note for this ${intentLabel.toLowerCase()} session.`);

  return { system: SYSTEM, user: L.join('\n') };
}
