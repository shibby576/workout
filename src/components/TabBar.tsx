import { useAppDispatch, useAppState, type Tab } from '../state/AppState';
import { WeekIcon, RoutineIcon, HistoryIcon } from './icons';

const TABS: { id: Tab; label: string; Icon: typeof WeekIcon }[] = [
  { id: 'week', label: 'This Week', Icon: WeekIcon },
  { id: 'routine', label: 'Routine', Icon: RoutineIcon },
  { id: 'history', label: 'History', Icon: HistoryIcon },
];

export function TabBar() {
  const { activeTab } = useAppState();
  const dispatch = useAppDispatch();
  return (
    <nav className="tab-bar" aria-label="Primary">
      <div className="tab-bar-inner">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              className={`tab-btn ${active ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SELECT_TAB', tab: id })}
              aria-current={active ? 'page' : undefined}
            >
              <Icon color={active ? '#fff' : 'var(--color-neutral-500)'} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
