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
