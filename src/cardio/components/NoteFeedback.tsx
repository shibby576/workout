import { useEffect, useState } from 'react';
import {
  findFeedback,
  loadFeedback,
  saveFeedback,
  shareFeedback,
  summariseFeedback,
  type NoteFeedback as Entry,
} from '../feedback.js';
import type { SessionSummary } from '../sessionSummary.js';

// Rating lives directly under the note, because the useful reaction happens
// while reading it. Flagging stores the whole SessionSummary so the case can be
// replayed against any model later without Strava access.

interface Props {
  summary: SessionSummary;
  note: string;
  model: string;
}

export function NoteFeedbackControls({ summary, note, model }: Props) {
  const activityId = summary.activity.id;
  const id = `${activityId}:${summary.intent}`;
  const [saved, setSaved] = useState<Entry | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const existing = findFeedback(activityId, summary.intent);
    setSaved(existing);
    setComment(existing?.comment ?? '');
    setOpen(false);
  }, [activityId, summary.intent, note]);

  function record(verdict: 'good' | 'bad', withComment: string) {
    const entry: Entry = {
      id,
      activityId,
      activityName: summary.activity.name,
      intent: summary.intent,
      note,
      model,
      verdict,
      comment: withComment,
      at: new Date().toISOString(),
      summary,
    };
    saveFeedback(entry);
    setSaved(entry);
  }

  async function copyDigest() {
    try {
      await navigator.clipboard.writeText(summariseFeedback());
      setToast(`Copied ${loadFeedback().length} note(s) — paste them anywhere.`);
    } catch {
      setToast('Copy failed — use Share instead.');
    }
  }

  async function share() {
    const how = await shareFeedback();
    if (how === 'shared') setToast('Shared.');
    else if (how === 'downloaded') setToast('Downloaded cardio-feedback.json.');
  }

  return (
    <div className="feedback">
      <div className="feedback-row">
        <span className="feedback-label">{saved ? `Rated ${saved.verdict}` : 'Was this note right?'}</span>
        <span className="feedback-actions">
          <button
            type="button"
            className={`chip${saved?.verdict === 'good' ? ' chip-on' : ''}`}
            onClick={() => record('good', comment)}
          >
            Good
          </button>
          <button
            type="button"
            className={`chip${saved?.verdict === 'bad' ? ' chip-on-bad' : ''}`}
            onClick={() => {
              record('bad', comment);
              setOpen(true);
            }}
          >
            Off
          </button>
          <button type="button" className="btn-link" onClick={() => setOpen((v) => !v)}>
            {open ? 'Hide' : 'Add note'}
          </button>
        </span>
      </div>

      {open && (
        <>
          <textarea
            className="feedback-text"
            rows={3}
            placeholder="What's wrong with it? e.g. 'no long recoveries in this session — it was 10x2 with one 2min break'"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="feedback-row">
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: 'auto', padding: '6px 14px' }}
              onClick={() => record(saved?.verdict ?? 'bad', comment)}
            >
              Save
            </button>
            <span className="feedback-actions">
              {/* Copy gives a short digest to paste into a conversation; Share
                  sends the full JSON, with the SessionSummary the eval harness
                  needs, through the OS share sheet. */}
              <button type="button" className="btn-link" onClick={copyDigest}>
                Copy all
              </button>
              <button type="button" className="btn-link" onClick={share}>
                Share file
              </button>
            </span>
          </div>
          {toast && (
            <div className="hint" style={{ marginTop: 'var(--space-2)' }}>
              {toast}
            </div>
          )}
        </>
      )}
    </div>
  );
}
