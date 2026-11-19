export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Domain {
  id: string;
  name: string;
  nameMm: string;
  weight: number; // percentage
  description: string;
  descriptionMm: string;
  competencies: string[];
  examVersionNote?: string;
}

export interface Topic {
  id: string;
  domainId: string;
  name: string;
  description: string;
  descriptionMm: string;
  theory: string;
  theoryMm: string;
  concepts: string[];
  commands: string[];
  yamlExample: string;
  practicalExercises: string[];
  labIds: string[];
  expectedOutcomes: string[];
  estimatedHours: number;
  difficulty: Difficulty;
  examRequired: boolean;
  supplementaryNote?: string;
}

export interface Lab {
  id: string;
  topicId: string;
  title: string;
  objective: string;
  objectiveMm: string;
  prerequisites: string[];
  environmentSetup: string;
  steps: string[];
  yamlManifests: { name: string; content: string }[];
  commands: string[];
  expectedOutput: string;
  troubleshooting: string[];
  verificationChecklist: string[];
}

export interface CourseResource {
  id: string;
  name: string;
  provider: string;
  url: string;
  type: 'free' | 'paid';
  duration: string;
  domainIds: string[]; // empty means general
  recommendedOrder: number;
  notes: string;
  verified: boolean;
}

export interface LearningResource {
  id: string;
  title: string;
  url: string;
  kind: 'documentation' | 'course' | 'lab' | 'github' | 'video' | 'mock-exam' | 'tool';
  provider: string;
  free: boolean;
  domainIds: string[];
  topicIds: string[];
  notes: string;
}

export interface PlanTask {
  day: number;
  title: string;
  topicIds: string[];
  theoryHours: number;
  labHours: number;
  revisionHours: number;
  notes: string;
}

export interface StudyPlanTemplate {
  id: '30' | '60' | '90';
  name: string;
  totalDays: number;
  description: string;
  weeklyAssessmentDay: number; // 7
  mockExamDays: number[];
  tasks: PlanTask[];
}

export interface TopicProgress {
  status: ProgressStatus;
  studyHours: number;
  completedLabIds: string[];
  notes: string;
  deadline?: string;
}

export interface MockExamScore {
  id: string;
  date: string;
  score: number; // 0-100
  notes?: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  dailyStudyHours: number;
  examDate?: string;
  activePlanId: '30' | '60' | '90';
  planStartDate?: string;
}

export interface AppState {
  topicProgress: Record<string, TopicProgress>;
  mockExamScores: MockExamScore[];
  settings: UserSettings;
  weeklyProgress: { week: string; hours: number; topicsCompleted: number }[];
}
