export type FitnessGoal = 'strength' | 'recovery' | 'dietary' | 'running';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface GoalConfig {
  id: FitnessGoal;
  label: string;
  description: string;
  icon: string;
}

export interface UserSelection {
  goals: FitnessGoal[];
  experienceLevels: Record<FitnessGoal, ExperienceLevel>;
}

export interface GoalOption {
  value: FitnessGoal;
  label: string;
  selected: boolean;
}
