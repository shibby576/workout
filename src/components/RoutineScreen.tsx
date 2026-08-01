import { useAppDispatch, useAppState, itemHasHistory } from '../state/AppState';
import type { Category, CardioSubtype } from '../types';
import { CATEGORY_LABEL, SUBTYPE_LABEL } from '../constants';
import { Tag } from './Tag';
import { EmptyState } from './EmptyState';
import { ClipboardIcon } from './icons';

const CATEGORIES: Category[] = ['cardio', 'lift', 'cross-train'];
const SUBTYPES = Object.keys(SUBTYPE_LABEL) as CardioSubtype[];

export function RoutineScreen() {
  const { routineItems, weeks, addingItem, newItem } = useAppState();
  const dispatch = useAppDispatch();

  return (
    <div className="screen">
      <div className="header">
        <h1>Routine</h1>
        <div className="sub">Your weekly template</div>
      </div>

      <div className="app-scroll">
        {routineItems.length === 0 && !addingItem && (
          <EmptyState
            icon={<ClipboardIcon color="var(--color-neutral-500)" />}
            title="No routine yet"
            body="Add your first routine item below — a lift, a run type, or a cross-train slot — to start tracking adherence."
          />
        )}

        {routineItems.map((item) => {
          const inUse = itemHasHistory(weeks, item.id);
          return (
            <div key={item.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--color-text)' }}>{item.label}</div>
                  <div style={{ marginTop: 4 }}>
                    <Tag text={CATEGORY_LABEL[item.category]} tone="muted" />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button type="button" className="stepper-btn" onClick={() => dispatch({ type: 'UPDATE_TARGET', id: item.id, delta: -1 })} aria-label={`Decrease ${item.label} target`}>
                    –
                  </button>
                  <span style={{ fontSize: 14, color: 'var(--color-text)', minWidth: 14, textAlign: 'center' }}>{item.target}x</span>
                  <button type="button" className="stepper-btn" onClick={() => dispatch({ type: 'UPDATE_TARGET', id: item.id, delta: 1 })} aria-label={`Increase ${item.label} target`}>
                    +
                  </button>
                  <button
                    type="button"
                    disabled={inUse}
                    title={inUse ? 'Has logged workouts — remove not available yet' : undefined}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: inUse ? 'var(--color-neutral-300)' : 'var(--color-neutral-500)',
                      cursor: inUse ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      marginLeft: 4,
                    }}
                    onClick={() => dispatch({ type: 'REMOVE_ITEM', id: item.id })}
                    aria-label={`Remove ${item.label}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {addingItem ? (
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginBottom: 6 }}>Category</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`seg ${newItem.category === c ? 'active' : ''}`}
                  onClick={() => dispatch({ type: 'SET_NEW_ITEM_FIELD', field: 'category', value: c })}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>

            {newItem.category === 'cardio' && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--color-neutral-600)', marginBottom: 6 }}>Subtype</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {SUBTYPES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`seg ${newItem.subtype === s ? 'active' : ''}`}
                      onClick={() => dispatch({ type: 'SET_NEW_ITEM_FIELD', field: 'subtype', value: s })}
                    >
                      {SUBTYPE_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>Target / week</span>
              <button
                type="button"
                className="stepper-btn"
                onClick={() => dispatch({ type: 'SET_NEW_ITEM_FIELD', field: 'target', value: Math.max(1, newItem.target - 1) })}
              >
                –
              </button>
              <span style={{ fontSize: 14, color: 'var(--color-text)' }}>{newItem.target}</span>
              <button type="button" className="stepper-btn" onClick={() => dispatch({ type: 'SET_NEW_ITEM_FIELD', field: 'target', value: newItem.target + 1 })}>
                +
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="pill-btn" style={{ flex: 1 }} onClick={() => dispatch({ type: 'ADD_ITEM' })}>
                Add
              </button>
              <button type="button" className="pill-btn-outline" style={{ flex: 1 }} onClick={() => dispatch({ type: 'TOGGLE_ADD_FORM' })}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="pill-btn-outline" style={{ width: '100%', marginTop: 4, borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }} onClick={() => dispatch({ type: 'TOGGLE_ADD_FORM' })}>
            + Add routine item
          </button>
        )}
      </div>
    </div>
  );
}
