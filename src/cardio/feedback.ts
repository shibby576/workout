// Feedback capture: turns real use into eval cases.
//
// The athlete reads a note, spots something wrong, and that reaction is the most
// valuable signal available — but it evaporates unless it is caught at the
// moment of reading. Worse, reproducing the session later needs the raw Strava
// data, and access tokens expire within hours; by the time feedback is relayed
// the evidence can be gone.
//
// So a flagged note stores the full SessionSummary alongside the comment. That
// is everything the eval harness needs to replay the case against any model,
// with no Strava call and no token.

import type { SessionSummary } from './sessionSummary.js';

export interface NoteFeedback {
  id: string; // activity id + intent, so re-rating the same case overwrites
  activityId: string;
  activityName: string;
  intent: string;
  note: string;
  model: string;
  verdict: 'good' | 'bad';
  comment: string;
  at: string; // ISO
  summary: SessionSummary; // the exact input the note came from
}

const KEY = 'cardio.feedback.v1';

export function loadFeedback(): NoteFeedback[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as NoteFeedback[]) : [];
  } catch {
    return [];
  }
}

export function saveFeedback(entry: NoteFeedback): void {
  try {
    const all = loadFeedback().filter((f) => f.id !== entry.id);
    all.unshift(entry);
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Private browsing or quota — the note itself still works.
  }
}

export function findFeedback(activityId: string, intent: string): NoteFeedback | undefined {
  return loadFeedback().find((f) => f.id === `${activityId}:${intent}`);
}

/** Everything collected, as a file the eval harness can consume directly. */
export function exportFeedback(): string {
  return `${JSON.stringify({ exportedAt: new Date().toISOString(), entries: loadFeedback() }, null, 2)}\n`;
}

/** A short human-readable digest, small enough to paste into a message.
 *  The full export carries each SessionSummary and runs to kilobytes per entry,
 *  which is right for the eval harness and wrong for a phone conversation. */
export function summariseFeedback(): string {
  const all = loadFeedback();
  if (all.length === 0) return 'No feedback saved yet.';
  const lines = all.map((f) => {
    const when = f.at.slice(0, 10);
    return [
      `## ${f.activityName} — ${f.intent} (${f.verdict.toUpperCase()}) ${when}`,
      `https://www.strava.com/activities/${f.activityId.replace(/^strava-/, '')}`,
      `model: ${f.model}`,
      `note: ${f.note}`,
      f.comment ? `said: ${f.comment}` : '(no comment)',
    ].join('\n');
  });
  return `${all.length} rated note(s)\n\n${lines.join('\n\n')}\n`;
}

/** Share the full export through the OS share sheet where available — on a
 *  phone that means AirDrop, Messages or mail, which actually gets the file
 *  somewhere useful. Falls back to a download on desktop. */
export async function shareFeedback(): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const text = exportFeedback();
  const file = new File([text], 'cardio-feedback.json', { type: 'application/json' });

  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean;
    share?: (data: { files?: File[]; title?: string }) => Promise<void>;
  };

  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'Cardio feedback' });
      return 'shared';
    } catch {
      // The user dismissed the sheet, or the platform refused the file.
      return 'cancelled';
    }
  }

  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cardio-feedback.json';
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
