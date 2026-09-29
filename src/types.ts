export type AcademicLevel = 
  | 'Explain Like I\'m 5'
  | 'Middle School'
  | 'High School'
  | 'Undergraduate'
  | 'Graduate & Research';

export type SubjectDomain = 
  | 'Mathematics'
  | 'Computer Science & AI'
  | 'Physics'
  | 'Chemistry'
  | 'Biology & Medicine'
  | 'Economics & Finance'
  | 'History & Humanities'
  | 'General Science';

export type TutorMode = 'socratic' | 'deep_dive' | 'feynman' | 'analogies';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode?: TutorMode;
}

export interface ProblemStep {
  stepNumber: number;
  title: string;
  explanation: string;
  formulaOrCalculation: string;
  pitfallToAvoid: string;
}

export interface ProblemSolution {
  problemSummary: string;
  corePrinciples: string[];
  hints: string[];
  steps: ProblemStep[];
  finalAnswer: string;
  userAttemptFeedback?: string;
  checkUnderstandingQuestion: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mnemonicOrTip: string;
  category: string;
  state?: 'new' | 'learning' | 'mastered';
  lastReviewed?: number;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  description: string;
  subject: string;
  createdAt: number;
  cards: Flashcard[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  distractorReasons: string[];
  keyConcept: string;
}

export interface QuizAssessment {
  id: string;
  title: string;
  overview: string;
  difficulty: string;
  questions: QuizQuestion[];
  subject: string;
  createdAt: number;
}

export interface DiagramNode {
  id: string;
  label: string;
  description: string;
  group: string;
  colorVariant: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
}

export interface DiagramLink {
  from: string;
  to: string;
  relationshipLabel: string;
}

export interface ConceptDiagram {
  diagramTitle: string;
  summary: string;
  nodes: DiagramNode[];
  links: DiagramLink[];
  keyTakeaways: string[];
}

export interface StudyMilestone {
  day: number;
  focusTopic: string;
  learningObjectives: string[];
  tasks: string[];
  activeRecallPrompt: string;
  completedTasks?: boolean[];
}

export interface StudyPlan {
  id: string;
  goal: string;
  planTitle: string;
  strategyOverview: string;
  totalEstimatedHours: number;
  milestones: StudyMilestone[];
  retentionTips: string[];
  createdAt: number;
}
