export type UserRole = 'student' | 'admin';

export type GameStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'time_expired'
  | 'violation';

export interface StudentProfile {
  rules_accepted: boolean;
  rules_accepted_at: string | null;
  global_timer_started_at: string | null;
  global_time_budget_seconds: number;
  remaining_global_seconds: number;
  elapsed_global_seconds: number;
  is_global_expired: boolean;
  is_completed: boolean;
  completed_at: string | null;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  group: number | null;
  group_name: string;
  role: UserRole;
  is_blocked: boolean;
  profile: StudentProfile;
  created_at: string;
}

export interface GameResultSummary {
  game_order?: number;
  game_title?: string;
  score: number;
  max_score: number;
  correct_answers: number;
  wrong_answers: number;
  accuracy: number;
  time_spent: number;
  status: GameStatus;
  completed_at?: string;
}

export interface GameItem {
  id: number;
  order: number;
  slug: string;
  title: string;
  description: string;
  game_type:
    | 'quiz'
    | 'crossword'
    | 'word_search'
    | 'scramble'
    | 'process_chain'
    | 'matching'
    | 'bingo'
    | 'diagram';
  duration_seconds: number;
  duration_minutes: number;
  max_score: number;
  icon_name: string;
  is_active: boolean;
  questions_count: number;
  user_status: GameStatus;
  user_result: GameResultSummary | null;
  remaining_seconds: number;
}

export interface DashboardData {
  global_timer: {
    started_at: string | null;
    budget_seconds: number;
    remaining_seconds: number;
    elapsed_seconds: number;
    is_expired: boolean;
    is_completed: boolean;
  };
  stats: {
    completed_games: number;
    total_games: number;
    total_score: number;
    max_possible_score: number;
    rules_accepted: boolean;
  };
  games: GameItem[];
}

export interface StudentQuestion {
  id: number;
  game: number;
  question_text: string;
  question_type: string;
  options: Record<string, any>;
  points: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface GameSessionPayload {
  game: {
    id: number;
    order: number;
    slug: string;
    title: string;
    description: string;
    game_type: GameItem['game_type'];
    duration_seconds: number;
    max_score: number;
    icon_name: string;
  };
  session: {
    id: number;
    game: number;
    status: GameStatus;
    started_at: string;
    expires_at: string;
    completed_at: string | null;
    violation_count: number;
    remaining_seconds: number;
    elapsed_seconds: number;
    session_data: Record<string, any>;
  };
  global_remaining_seconds: number;
  questions: StudentQuestion[];
  saved_answers: Record<
    number,
    {
      submitted_answer: any;
      is_correct: boolean;
    }
  >;
}

export interface LeaderboardEntry {
  id: number;
  rank: number;
  group_rank: number;
  user_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  group: number | null;
  group_name: string;
  total_score: number;
  completed_games: number;
  total_time_spent: number;
  average_time: number;
  accuracy: number;
  finished_at: string;
  is_current_user: boolean;
}

export interface GroupRankingItem {
  rank: number;
  group_id: number;
  group_name: string;
  faculty: string;
  course: number;
  student_count: number;
  average_score: number;
  max_possible_score: number;
  performance_percentage: number;
  average_accuracy: number;
  average_time_spent: number;
  average_completed_games: number;
  top_score: number;
  top_student_name: string;
  is_my_group: boolean;
}
