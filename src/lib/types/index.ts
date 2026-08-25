export interface User {
  id: string;
  auth_user_id?: string | null;
  telegram_id: number | null;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  school_name?: string | null;
  subject?: string | null;
  region?: string | null;
  district?: string | null;
  additional_subjects?: string[];
  onboarding_completed?: boolean;
  preferences?: AccountPreferences;
  created_at: string;
  updated_at: string;
}

export interface AccountPreferences {
  language: 'uz' | 'ru';
  theme: 'system' | 'light' | 'dark';
  notifications: boolean;
  default_max_score: number;
}

export interface ClassItem {
  id: string;
  teacher_id: string;
  name: string;
  subject: string;
  created_at: string;
  student_count?: number;
  submission_count?: number;
}

export interface Student {
  id: string;
  class_id: string;
  teacher_id?: string;
  full_name: string;
  created_at: string;
}

export type TaskType = 'test' | 'yozma' | 'uy_vazifasi' | 'boshqa';

export interface Submission {
  id: string;
  teacher_id: string;
  class_id?: string | null;
  student_id?: string | null;
  task_type: TaskType;
  instructions?: string | null;
  file_urls: string[];
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  created_at: string;
}

export interface MistakeItem {
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
}

export interface Result {
  id: string;
  submission_id: string;
  
  // AI Suggestions
  ai_score: number | null;
  ai_max_score: number | null;
  ai_grade: number | null;
  ai_summary: string | null;
  ai_mistakes: MistakeItem[];
  ai_feedback: string | null;
  ai_confidence: number | null;
  
  // Teacher Final Decision
  teacher_score: number | null;
  teacher_max_score: number | null;
  teacher_grade: number | null;
  teacher_feedback: string | null;
  
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalysisInput {
  taskType: TaskType;
  instructions?: string;
  imageUrls: string[];
  imageBase64List?: { data: string; mimeType: string }[];
  studentName?: string;
  className?: string;
}

export interface AnalysisResult {
  score: number;
  maxScore: number;
  suggestedGrade: number; // 2, 3, 4, 5
  summary: string;
  mistakes: MistakeItem[];
  feedback: string;
  confidence: number;
}

export interface AIProvider {
  analyzeSubmission(input: AnalysisInput): Promise<AnalysisResult>;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramInitData {
  query_id?: string;
  user?: TelegramUser;
  auth_date: number;
  hash: string;
  [key: string]: any;
}

export interface AuthSession {
  userId: string;
  authUserId?: string;
  telegramId?: number | null;
  fullName: string;
}
