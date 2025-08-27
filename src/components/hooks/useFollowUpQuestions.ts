import { useState, useCallback } from 'react';
import { FollowUpAnswers, GoalFollowUpData } from '../types/followUpQuestions';
import { FitnessGoal } from '../types/fitness';
import { FOLLOW_UP_QUESTIONS, DIETARY_ALLERGIES_QUESTION } from '../label-data/followUpQuestions';

export const useFollowUpQuestions = (selectedGoals: FitnessGoal[]) => {
  const [answers, setAnswers] = useState<GoalFollowUpData>({});
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);

  const currentGoal = selectedGoals[currentGoalIndex];

  const updateAnswer = useCallback((goalId: string, questionId: string, value: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [questionId]: value
      }
    }));
  }, []);

  const goToNextGoal = useCallback(() => {
    if (currentGoalIndex < selectedGoals.length - 1) {
      setCurrentGoalIndex(prev => prev + 1);
    }
  }, [currentGoalIndex, selectedGoals.length]);

  const goToPreviousGoal = useCallback(() => {
    if (currentGoalIndex > 0) {
      setCurrentGoalIndex(prev => prev - 1);
    }
  }, [currentGoalIndex]);

  const canProceedToNext = useCallback((goalId: string) => {
    const goalAnswers = answers[goalId] || {};
    const goalQuestions = FOLLOW_UP_QUESTIONS.find(q => q.goalId === goalId);
    
    if (!goalQuestions) return false;
    
    // Check if all required questions for this goal are answered
    for (const question of goalQuestions.questions) {
      if (question.required && !goalAnswers[question.id]) {
        return false;
      }
    }
    
    // Special case for dietary goal - check allergies question if needed
    if (goalId === 'dietary' && goalAnswers['dietary_preference'] === 'Allergies') {
      if (!goalAnswers[DIETARY_ALLERGIES_QUESTION.id] || goalAnswers[DIETARY_ALLERGIES_QUESTION.id].toString().trim() === '') {
        return false;
      }
    }
    
    return true;
  }, [answers]);

  const canFinish = useCallback(() => {
    return selectedGoals.every(goal => canProceedToNext(goal));
  }, [selectedGoals, canProceedToNext]);

  const getProgress = useCallback(() => {
    // Calculate progress based on questions answered vs total questions across all goals
    let totalQuestions = 0;
    let answeredQuestions = 0;
    
    selectedGoals.forEach(goalId => {
      const goalQuestions = FOLLOW_UP_QUESTIONS.find(q => q.goalId === goalId);
      if (goalQuestions) {
        const goalAnswers = answers[goalId] || {};
        
        // Count main questions
        goalQuestions.questions.forEach(question => {
          if (question.required) {
            totalQuestions += 1;
            if (goalAnswers[question.id]) {
              answeredQuestions += 1;
            }
          }
        });
        
        // Count conditional dietary allergies question if applicable
        if (goalId === 'dietary' && goalAnswers['dietary_preference'] === 'Allergies') {
          totalQuestions += 1; // Add the allergies question
          if (goalAnswers[DIETARY_ALLERGIES_QUESTION.id] && goalAnswers[DIETARY_ALLERGIES_QUESTION.id].toString().trim() !== '') {
            answeredQuestions += 1;
          }
        }
      }
    });
    
    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  }, [selectedGoals, answers]);

  const resetAnswers = useCallback(() => {
    setAnswers({});
    setCurrentGoalIndex(0);
  }, []);

  return {
    answers,
    currentGoal,
    currentGoalIndex,
    totalGoals: selectedGoals.length,
    updateAnswer,
    goToNextGoal,
    goToPreviousGoal,
    canProceedToNext,
    canFinish,
    getProgress,
    resetAnswers
  };
};
