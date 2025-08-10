import { useState, useCallback } from 'react';
import { FitnessGoal, ExperienceLevel, UserSelection } from '../types/fitness';

export const useFitnessSelections = () => {
  const [selections, setSelections] = useState<UserSelection>({
    goals: [],
    experienceLevels: {} as Record<FitnessGoal, ExperienceLevel>
  });

  const toggleGoal = useCallback((goal: FitnessGoal) => {
    setSelections(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  }, []);

  const setExperienceLevel = useCallback((goal: FitnessGoal, level: ExperienceLevel) => {
    setSelections(prev => ({
      ...prev,
      experienceLevels: {
        ...prev.experienceLevels,
        [goal]: level
      }
    }));
  }, []);

  const isGoalSelected = useCallback((goal: FitnessGoal) => {
    return selections.goals.includes(goal);
  }, [selections.goals]);

  const getExperienceLevel = useCallback((goal: FitnessGoal) => {
    return selections.experienceLevels[goal] || null;
  }, [selections.experienceLevels]);

  const canProceed = useCallback(() => {
    return selections.goals.length > 0 && 
           selections.goals.every(goal => selections.experienceLevels[goal]);
  }, [selections.goals, selections.experienceLevels]);

  const resetSelections = useCallback(() => {
    setSelections({
      goals: [],
      experienceLevels: {} as Record<FitnessGoal, ExperienceLevel>
    });
  }, []);

  return {
    selections,
    toggleGoal,
    setExperienceLevel,
    isGoalSelected,
    getExperienceLevel,
    canProceed,
    resetSelections
  };
};
