import { FitnessGoal, ExperienceLevel } from './fitness';

export interface UserAnswers {
  goals: FitnessGoal[];
  experienceLevels: Record<FitnessGoal, ExperienceLevel>;
  followUps: Record<FitnessGoal, Record<string, unknown>>; // goal-specific Q&A
}