
export enum EnglishLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export enum PersonaType {
  EMMA = 'Emma'
}

export type LearningGoal = 'Speaking Fluency' | 'Vocabulary' | 'Grammar' | 'Business English' | 'Exam Practice';

export interface UserProfile {
  name: string;
  level: EnglishLevel;
  goals: LearningGoal[];
  persona: PersonaType;
  streak: number;
  lastActive: string;
}

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  correction?: Correction;
}

export interface SessionReport {
  summary: string;
  mistakes: string[];
  vocabularyTips: string[];
  newWords: string[];
  score: number;
  fluencyScore: number;
}
