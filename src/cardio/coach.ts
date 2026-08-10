// Client-side call to the generation endpoint. The model key lives server-side,
// so the browser only ever posts the SessionSummary it already computed.

import type { SessionSummary } from './sessionSummary.ts';

export interface CoachNote {
  note: string;
  model: string;
}

export async function generateCoachNote(summary: SessionSummary, model?: string): Promise<CoachNote> {
  const res = await fetch('/api/coach/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary, model }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? 'generation_failed');
  }
  return (await res.json()) as CoachNote;
}

/** Maps the endpoint's error codes to something worth reading on the card. */
export function coachErrorMessage(code: string): string {
  switch (code) {
    case 'rate_limited':
      return 'The model is rate limited right now — try again in a moment.';
    case 'generation_not_configured':
      return 'Note generation is not configured on the server yet.';
    default:
      return "Couldn't write the note. Try regenerating.";
  }
}
