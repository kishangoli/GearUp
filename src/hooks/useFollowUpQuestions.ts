import { useState, useCallback } from 'react';
import { FollowUpAnswers, GoalFollowUpData } from '../types/followUpQuestions';
import { FitnessGoal } from '../types/fitness';
import { FOLLOW_UP_QUESTIONS } from '../constants/followUpQuestions';

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
    // Check if all required questions for this goal are answered
    // This will be implemented when we integrate with the questions data
    return Object.keys(goalAnswers).length > 0;
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
        // Count main questions
        totalQuestions += goalQuestions.questions.length;
        
        // Count conditional dietary allergies question if applicable
        if (goalId === 'dietary') {
          const goalAnswers = answers[goalId] || {};
          if (goalAnswers['dietary_preference'] === 'Allergies') {
            totalQuestions += 1; // Add the allergies question
          }
        }
        
        // Count answered questions for this goal
        const goalAnswers = answers[goalId] || {};
        answeredQuestions += Object.keys(goalAnswers).length;
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
