import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, MockExamScore, ProgressStatus, TopicProgress } from '../types';
import { loadState, saveState, defaultSettings, ensureTopicProgress } from '../utils/storage';

interface AppContextValue {
  state: AppState;
  setTheme: (theme: 'light' | 'dark') => void;
  updateSettings: (patch: Partial<AppState['settings']>) => void;
  setTopicStatus: (topicId: string, status: ProgressStatus) => void;
  setTopicHours: (topicId: string, hours: number) => void;
  setTopicNotes: (topicId: string, notes: string) => void;
  setTopicDeadline: (topicId: string, deadline: string) => void;
  toggleLabCompleted: (topicId: string, labId: string) => void;
  addMockScore: (score: Omit<MockExamScore, 'id'>) => void;
  replaceState: (next: AppState) => void;
  resetProgress: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => { saveState(state); }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [state.settings.theme]);

  const api = useMemo<AppContextValue>(() => ({
    state,
    setTheme: (theme) => setState(s => ({ ...s, settings: { ...s.settings, theme } })),
    updateSettings: (patch) => setState(s => ({ ...s, settings: { ...s.settings, ...patch } })),
    setTopicStatus: (topicId, status) => setState(s => {
      const cur = ensureTopicProgress(s.topicProgress, topicId);
      return { ...s, topicProgress: { ...s.topicProgress, [topicId]: { ...cur, status } } };
    }),
    setTopicHours: (topicId, hours) => setState(s => {
      const cur = ensureTopicProgress(s.topicProgress, topicId);
      return { ...s, topicProgress: { ...s.topicProgress, [topicId]: { ...cur, studyHours: Math.max(0, hours) } } };
    }),
    setTopicNotes: (topicId, notes) => setState(s => {
      const cur = ensureTopicProgress(s.topicProgress, topicId);
      return { ...s, topicProgress: { ...s.topicProgress, [topicId]: { ...cur, notes } } };
    }),
    setTopicDeadline: (topicId, deadline) => setState(s => {
      const cur = ensureTopicProgress(s.topicProgress, topicId);
      return { ...s, topicProgress: { ...s.topicProgress, [topicId]: { ...cur, deadline } } };
    }),
    toggleLabCompleted: (topicId, labId) => setState(s => {
      const cur = ensureTopicProgress(s.topicProgress, topicId);
      const has = cur.completedLabIds.includes(labId);
      const completedLabIds = has ? cur.completedLabIds.filter(x => x !== labId) : [...cur.completedLabIds, labId];
      return { ...s, topicProgress: { ...s.topicProgress, [topicId]: { ...cur, completedLabIds } } };
    }),
    addMockScore: (score) => setState(s => ({ ...s, mockExamScores: [...s.mockExamScores, { ...score, id: `mock-${Date.now()}` }] })),
    replaceState: (next) => setState({ ...next, settings: { ...defaultSettings, ...next.settings } }),
    resetProgress: () => setState(s => ({ ...s, topicProgress: {}, mockExamScores: [], weeklyProgress: [] })),
  }), [state]);

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
