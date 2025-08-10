import { useState, useCallback } from 'react';
import { FollowUpAnswers, GoalFollowUpData } from '../types/followUpQuestions';
import { FitnessGoal } from '../types/fitness';

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
    const totalGoals = selectedGoals.length;
    const completedGoals = selectedGoals.filter(goal => canProceedToNext(goal)).length;
    return totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
  }, [selectedGoals, canProceedToNext]);

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
