import { FollowUpSection } from '../types/followUpQuestions';

export const FOLLOW_UP_QUESTIONS: FollowUpSection[] = [
  {
    goalId: 'strength',
    title: 'Strength Training Details',
    description: 'Let\'s get specific about your strength training needs',
    icon: '💪',
    questions: [
      {
        id: 'strength_experience',
        type: 'radio',
        question: 'What\'s your experience level?',
        options: ['Beginner', 'Intermediate', 'Advanced'],
        required: true,
        icon: '📊'
      },
      {
        id: 'strength_location',
        type: 'radio',
        question: 'Where do you prefer to work out?',
        options: ['Home', 'Gym', 'Both'],
        required: true,
        icon: '🏠'
      }
    ]
  },
  {
    goalId: 'dietary',
    title: 'Nutrition & Dietary Preferences',
    description: 'Help us understand your nutrition goals and restrictions',
    icon: '🥗',
    questions: [
      {
        id: 'dietary_goal',
        type: 'radio',
        question: 'What\'s your primary nutrition goal?',
        options: ['Weight loss', 'Muscle gain', 'Performance', 'Wellness'],
        required: true,
        icon: '🎯'
      },
      {
        id: 'dietary_preference',
        type: 'radio',
        question: 'Any dietary preferences or restrictions?',
        options: ['None', 'Vegan', 'Vegetarian', 'Keto', 'Allergies'],
        required: true,
        icon: '🚫'
      }
    ]
  },
  {
    goalId: 'running',
    title: 'Running & Endurance Details',
    description: 'Tell us about your running and sports focus',
    icon: '🏃',
    questions: [
      {
        id: 'running_sport',
        type: 'radio',
        question: 'What type of sport or activity?',
        options: ['Basketball', 'Soccer', 'Baseball', 'Football', 'Running', 'Other'],
        required: true,
        icon: '⚽'
      },
      {
        id: 'running_focus',
        type: 'radio',
        question: 'What skill are you focusing on?',
        options: ['Speed', 'Strength', 'Endurance', 'Agility', 'Technique'],
        required: true,
        icon: '⚡'
      }
    ]
  },
  {
    goalId: 'recovery',
    title: 'Recovery & Wellness',
    description: 'Help us understand your recovery needs',
    icon: '🧘',
    questions: [
      {
        id: 'recovery_focus',
        type: 'radio',
        question: 'What type of recovery do you need?',
        options: ['Muscle soreness', 'Injury rehab', 'Mobility & flexibility', 'Relaxation'],
        required: true,
        icon: '🩹'
      },
      {
        id: 'recovery_method',
        type: 'radio',
        question: 'What recovery method do you prefer?',
        options: ['Massage tools', 'Compression gear', 'Cold therapy', 'Stretching aids', 'Supplements'],
        required: true,
        icon: '🛠️'
      }
    ]
  }
];

// Separate constant for the conditional allergies question
export const DIETARY_ALLERGIES_QUESTION = {
  id: 'dietary_allergies',
  type: 'text' as const,
  question: 'What allergies do you have?',
  placeholder: 'e.g., nuts, dairy, gluten...',
  required: true,
  icon: '⚠️'
};
