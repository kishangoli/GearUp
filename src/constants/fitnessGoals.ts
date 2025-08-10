import { GoalConfig } from '../types/fitness';

export const FITNESS_GOALS: GoalConfig[] = [
  {
    id: 'strength',
    label: 'Strength Training',
    description: 'Build muscle and increase power',
    icon: '💪'
  },
  {
    id: 'recovery',
    label: 'Recovery',
    description: 'Rest, repair, and rejuvenate',
    icon: '🧘'
  },
  {
    id: 'dietary',
    label: 'Dietary',
    description: 'Nutrition and meal planning',
    icon: '🥗'
  },
  {
    id: 'running',
    label: 'Running/Endurance',
    description: 'Improve stamina and speed',
    icon: '🏃'
  }
];

export const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
] as const;
