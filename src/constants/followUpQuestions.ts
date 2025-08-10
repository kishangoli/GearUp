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
        options: [
          { text: 'Beginner', icon: '🌱' },
          { text: 'Intermediate', icon: '📈' },
          { text: 'Advanced', icon: '🏆' }
        ],
        required: true,
        icon: '📊'
      },
      {
        id: 'strength_location',
        type: 'radio',
        question: 'Where do you prefer to work out?',
        options: [
          { text: 'Home', icon: '🏠' },
          { text: 'Gym', icon: '🏋️' },
          { text: 'Both', icon: '🔄' }
        ],
        required: true,
        icon: '📍'
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
        options: [
          { text: 'Weight loss', icon: '⚖️' },
          { text: 'Muscle gain', icon: '💪' },
          { text: 'Performance', icon: '⚡' },
          { text: 'Wellness', icon: '🌿' }
        ],
        required: true,
        icon: '🎯'
      },
      {
        id: 'dietary_preference',
        type: 'radio',
        question: 'Any dietary preferences or restrictions?',
        options: [
          { text: 'None', icon: '✅' },
          { text: 'Vegan', icon: '🌱' },
          { text: 'Vegetarian', icon: '🥬' },
          { text: 'Keto', icon: '🥑' },
          { text: 'Allergies', icon: '⚠️' }
        ],
        required: true,
        icon: '🚫'
      }
    ]
  },
  {
    goalId: 'running',
    title: 'Sports & Activity Details',
    description: 'Tell us about your sports and activity focus',
    icon: '🏃',
    questions: [
      {
        id: 'running_sport',
        type: 'radio',
        question: 'What type of sport or activity?',
        options: [
          { text: 'Basketball', icon: '🏀' },
          { text: 'Soccer', icon: '⚽' },
          { text: 'Baseball', icon: '⚾' },
          { text: 'Football', icon: '🏈' },
          { text: 'Running', icon: '🏃' },
          { text: 'Other', icon: '🎯' }
        ],
        required: true,
        icon: '🏆'
      },
      {
        id: 'running_focus',
        type: 'radio',
        question: 'What skill are you focusing on?',
        options: [
          { text: 'Speed', icon: '💨' },
          { text: 'Strength', icon: '💪' },
          { text: 'Endurance', icon: '🔋' },
          { text: 'Agility', icon: '🤸' },
          { text: 'Technique', icon: '🎯' }
        ],
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
        options: [
          { text: 'Muscle soreness', icon: '🦵' },
          { text: 'Injury rehab', icon: '🩹' },
          { text: 'Mobility & flexibility', icon: '🤸' },
          { text: 'Relaxation', icon: '😌' }
        ],
        required: true,
        icon: '🎯'
      },
      {
        id: 'recovery_method',
        type: 'radio',
        question: 'What recovery method do you prefer?',
        options: [
          { text: 'Massage tools', icon: '🪃' },
          { text: 'Compression gear', icon: '🧤' },
          { text: 'Cold therapy', icon: '🧊' },
          { text: 'Stretching aids', icon: '🤸' },
          { text: 'Supplements', icon: '💊' }
        ],
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
