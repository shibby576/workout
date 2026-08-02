import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { initialRoutineItems, initialWeeks } from '../data/mockData';
import { loadPersisted, savePersisted } from './persistence';
import type { Category, CardioSubtype, MatchTag, RoutineItem, Week } from '../types';

export type Tab = 'week' | 'routine' | 'history';

export interface NewItemDraft {
  category: Category;
  subtype: CardioSubtype;
  target: number;
}

export interface AppState {
  activeTab: Tab;
  currentWeekIdx: number;
  reviewId: string | null;
  reviewTag: MatchTag | null;
  attachIdx: number | null;
  addingItem: boolean;
  newItem: NewItemDraft;
  routineItems: RoutineItem[];
  weeks: Week[];
}

type Action =
  | { type: 'SELECT_TAB'; tab: Tab }
  | { type: 'STEP_WEEK'; delta: number }
  | { type: 'SELECT_WEEK'; idx: number }
  | { type: 'OPEN_REVIEW'; matchId: string }
  | { type: 'CLOSE_REVIEW' }
  | { type: 'SET_REVIEW_TAG'; tag: MatchTag }
  | { type: 'CONFIRM_REVIEW' }
  | { type: 'OPEN_ATTACH'; unmatchedIdx: number }
  | { type: 'CLOSE_ATTACH' }
  | { type: 'ATTACH_TO_SLOT'; matchId: string }
  | { type: 'UPDATE_TARGET'; id: string; delta: number }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'TOGGLE_ADD_FORM' }
  | { type: 'SET_NEW_ITEM_FIELD'; field: keyof NewItemDraft; value: NewItemDraft[keyof NewItemDraft] }
  | { type: 'ADD_ITEM' };

function isFreshStart(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('fresh') === '1';
}

function buildInitialState(): AppState {
  const fresh = isFreshStart();
  // fresh=1 is a non-destructive preview: it never reads or writes real
  // saved progress, so it stays safe to link/bookmark without risking
  // whatever's actually stored.
  const persisted = fresh ? null : loadPersisted();
  const routineItems = fresh ? [] : (persisted?.routineItems ?? initialRoutineItems);
  const weeks = fresh ? [] : (persisted?.weeks ?? initialWeeks);
  return {
    activeTab: 'week',
    currentWeekIdx: Math.max(0, weeks.length - 1),
    reviewId: null,
    reviewTag: null,
    attachIdx: null,
    addingItem: false,
    newItem: { category: 'cardio', subtype: 'base', target: 1 },
    routineItems,
    weeks,
  };
}

const initialState: AppState = buildInitialState();

const SUBTYPE_LABEL: Record<CardioSubtype, string> = { base: 'Base run', threshold: 'Threshold run', vo2max: 'VO2max run' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SELECT_TAB':
      return { ...state, activeTab: action.tab };

    case 'STEP_WEEK': {
      const idx = Math.max(0, Math.min(state.weeks.length - 1, state.currentWeekIdx + action.delta));
      return { ...state, currentWeekIdx: idx };
    }

    case 'SELECT_WEEK':
      return { ...state, currentWeekIdx: action.idx, activeTab: 'week' };

    case 'OPEN_REVIEW': {
      const week = state.weeks[state.currentWeekIdx];
      const m = week.matches.find((x) => x.id === action.matchId);
      return { ...state, reviewId: action.matchId, reviewTag: m?.tag ?? null };
    }

    case 'CLOSE_REVIEW':
      return { ...state, reviewId: null, reviewTag: null };

    case 'SET_REVIEW_TAG':
      return { ...state, reviewTag: action.tag };

    case 'CONFIRM_REVIEW': {
      if (!state.reviewId || !state.reviewTag) return state;
      const weeks = state.weeks.map((week, i) => {
        if (i !== state.currentWeekIdx) return week;
        return {
          ...week,
          matches: week.matches.map((m) =>
            m.id === state.reviewId ? { ...m, tag: state.reviewTag, needsTag: false, confirmed: true } : m,
          ),
        };
      });
      return { ...state, weeks, reviewId: null, reviewTag: null };
    }

    case 'OPEN_ATTACH':
      return { ...state, attachIdx: action.unmatchedIdx };

    case 'CLOSE_ATTACH':
      return { ...state, attachIdx: null };

    case 'ATTACH_TO_SLOT': {
      if (state.attachIdx == null) return state;
      const weekIdx = state.currentWeekIdx;
      const week = state.weeks[weekIdx];
      const workout = week.unmatched[state.attachIdx];
      const unmatched = week.unmatched.filter((_, i) => i !== state.attachIdx);
      const matches = week.matches.map((m) => {
        if (m.id !== action.matchId) return m;
        // Every attach lands as unconfirmed + needs-tag, regardless of the
        // slot's category. A manual attach hasn't gone through the same
        // tag review an auto-match does; pre-filling the tag from the
        // slot (as the exported prototype did for cardio) would let a
        // cardio attach skip the base/threshold/VO2max confirmation the
        // whole matching model depends on manual judgment for.
        return { ...m, workouts: [...m.workouts, workout], status: 'done' as const, tag: null, needsTag: true, confirmed: false };
      });
      const weeks = state.weeks.map((w, i) => (i === weekIdx ? { ...week, matches, unmatched } : w));
      return { ...state, weeks, attachIdx: null };
    }

    case 'UPDATE_TARGET':
      return {
        ...state,
        routineItems: state.routineItems.map((r) => (r.id === action.id ? { ...r, target: Math.max(1, r.target + action.delta) } : r)),
      };

    case 'REMOVE_ITEM': {
      // Refuse to delete a routine item any week's matches still
      // reference (done or open slots) — hard-deleting it would orphan
      // those matches (itemFor() has nothing to look up). Real build
      // should offer deactivation instead; for v1 this guard just keeps
      // the UI from crashing on a dangling reference.
      if (itemHasHistory(state.weeks, action.id)) return state;
      return { ...state, routineItems: state.routineItems.filter((r) => r.id !== action.id) };
    }

    case 'TOGGLE_ADD_FORM':
      return { ...state, addingItem: !state.addingItem };

    case 'SET_NEW_ITEM_FIELD':
      return { ...state, newItem: { ...state.newItem, [action.field]: action.value } };

    case 'ADD_ITEM': {
      const n = state.newItem;
      const id = 'ri-' + Date.now();
      const label = n.category === 'cardio' ? SUBTYPE_LABEL[n.subtype] : n.category === 'lift' ? 'Lift' : 'Cross-train';
      const item: RoutineItem = {
        id,
        category: n.category,
        subtype: n.category === 'cardio' ? n.subtype : undefined,
        label,
        target: n.target,
        prescription: null,
      };
      return {
        ...state,
        routineItems: [...state.routineItems, item],
        addingItem: false,
        newItem: { category: 'cardio', subtype: 'base', target: 1 },
      };
    }

    default:
      return state;
  }
}

const StateCtx = createContext<AppState | null>(null);
const DispatchCtx = createContext<React.Dispatch<Action> | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateValue = useMemo(() => state, [state]);

  useEffect(() => {
    if (isFreshStart()) return;
    savePersisted(state.routineItems, state.weeks);
  }, [state.routineItems, state.weeks]);

  return (
    <StateCtx.Provider value={stateValue}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(StateCtx);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

export function useAppDispatch(): React.Dispatch<Action> {
  const ctx = useContext(DispatchCtx);
  if (!ctx) throw new Error('useAppDispatch must be used within AppStateProvider');
  return ctx;
}

export function itemFor(routineItems: RoutineItem[], id: string): RoutineItem {
  const item = routineItems.find((r) => r.id === id);
  if (!item) throw new Error(`No routine item ${id}`);
  return item;
}

/** True if any week (done or still-open slots) references this routine
 * item. Routine items are a single global list with no per-week
 * snapshotting, so removing one that any match — past or present —
 * points at would leave a dangling reference. */
export function itemHasHistory(weeks: Week[], routineItemId: string): boolean {
  return weeks.some((w) => w.matches.some((m) => m.routineItemId === routineItemId));
}
