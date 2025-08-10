export interface FollowUpQuestion {
  id: string;
  type: 'radio' | 'text' | 'multi-select';
  question: string;
  options?: string[];
  placeholder?: string;
  required: boolean;
  icon: string;
}

export interface FollowUpSection {
  goalId: string;
  title: string;
  description: string;
  icon: string;
  questions: FollowUpQuestion[];
}

export interface FollowUpAnswers {
  [questionId: string]: string | string[];
}

export interface GoalFollowUpData {
  [goalId: string]: FollowUpAnswers;
}
