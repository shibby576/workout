// Pace entry parsing.
//
// Mobile numeric keypads have no colon, so "7:45" cannot be typed on a phone.
// Entry therefore accepts the digits-only form as well, and the caller shows
// the parsed value back so a misread is visible before it is saved — an earlier
// version read "745" as 745 seconds (12:25/mi) and silently skewed every pace
// verdict that followed.

/** Plausible running/cycling pace bounds, in seconds per mile. Anything outside
 *  this is far more likely to be a typo than a real pace. */
const MIN_SEC_PER_MI = 3 * 60;
const MAX_SEC_PER_MI = 30 * 60;

export function parsePaceInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // "7:45" — the canonical form.
  const colon = /^(\d{1,2}):([0-5]\d)$/.exec(trimmed);
  if (colon) return within(Number(colon[1]) * 60 + Number(colon[2]));

  // "745" or "1045" — what a numeric keypad allows. The last two digits are
  // seconds, which is unambiguous for any real pace.
  const digits = /^(\d{3,4})$/.exec(trimmed);
  if (digits) {
    const raw = digits[1];
    const mins = Number(raw.slice(0, raw.length - 2));
    const secs = Number(raw.slice(-2));
    if (secs < 60) return within(mins * 60 + secs);
    return null;
  }

  return null;
}

function within(sec: number): number | null {
  return sec >= MIN_SEC_PER_MI && sec <= MAX_SEC_PER_MI ? sec : null;
}

/** Seconds per mile back to "7:45", for echoing entry and pre-filling. */
export function formatPaceInput(secPerMi: number): string {
  const m = Math.floor(secPerMi / 60);
  const s = Math.round(secPerMi % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
