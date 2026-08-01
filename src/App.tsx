import { AppStateProvider, useAppState } from './state/AppState';
import { WeekScreen } from './components/WeekScreen';
import { RoutineScreen } from './components/RoutineScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { TabBar } from './components/TabBar';
import { ReviewSheet } from './components/ReviewSheet';
import { AttachSheet } from './components/AttachSheet';

function Screens() {
  const { activeTab } = useAppState();
  if (activeTab === 'routine') return <RoutineScreen />;
  if (activeTab === 'history') return <HistoryScreen />;
  return <WeekScreen />;
}

function AppShell() {
  return (
    <div className="app-shell">
      <Screens />
      <TabBar />
      <ReviewSheet />
      <AttachSheet />
    </div>
  );
}

function App() {
  return (
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  );
}

export default App;
