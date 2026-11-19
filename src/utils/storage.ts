import { AppState, TopicProgress } from '../types';

const STORAGE_KEY = 'cka-study-planner-v1';

export const defaultSettings = {
  theme: 'light' as const,
  dailyStudyHours: 2,
  examDate: '',
  activePlanId: '60' as const,
  planStartDate: new Date().toISOString().slice(0, 10),
};

export const defaultState: AppState = {
  topicProgress: {},
  mockExamScores: [],
  settings: defaultSettings,
  weeklyProgress: [],
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...defaultState,
      ...parsed,
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
      topicProgress: parsed.topicProgress || {},
      mockExamScores: parsed.mockExamScores || [],
      weeklyProgress: parsed.weeklyProgress || [],
    };
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function ensureTopicProgress(tp: Record<string, TopicProgress>, topicId: string): TopicProgress {
  return tp[topicId] || { status: 'not_started', studyHours: 0, completedLabIds: [], notes: '', deadline: '' };
}
