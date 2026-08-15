import { useEffect, useState } from 'react';
import { exportFeedback, findFeedback, saveFeedback, type NoteFeedback as Entry } from '../feedback.js';
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

  function download() {
    const blob = new Blob([exportFeedback()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cardio-feedback.json';
    a.click();
    URL.revokeObjectURL(url);
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
            <button type="button" className="btn-link" onClick={download}>
              Export all feedback
            </button>
          </div>
        </>
      )}
    </div>
  );
}
