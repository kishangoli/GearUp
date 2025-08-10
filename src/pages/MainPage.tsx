import React, { useEffect } from 'react';
import { useFitnessSelections } from '../hooks/useFitnessSelections';
import { FITNESS_GOALS, EXPERIENCE_LEVELS } from '../constants/fitnessGoals';
import { FitnessGoal, ExperienceLevel } from '../types/fitness';
import { useUserAnswers } from '../context/UserAnswersContext';

interface MainPageProps {
  onBack: () => void;
  onProceed: (selections: any) => void;
}

export const MainPage: React.FC<MainPageProps> = ({ onBack, onProceed }) => {
  const {
    selections,
    toggleGoal,
    setExperienceLevel,
    isGoalSelected,
    getExperienceLevel,
    canProceed
  } = useFitnessSelections();

  // NEW: context helpers to keep global answers in sync
  const { updateGoals, updateExperience } = useUserAnswers();

  // Sync selections → global store whenever user changes them
  useEffect(() => {
    updateGoals(selections.goals as FitnessGoal[]);
    Object.entries(selections.experienceLevels).forEach(([goal, level]) => {
      updateExperience(goal as FitnessGoal, level as ExperienceLevel);
    });
  }, [selections.goals, selections.experienceLevels, updateGoals, updateExperience]);

  const handleGoalToggle = (goal: FitnessGoal) => {
    toggleGoal(goal);
  };

  const handleExperienceChange = (goal: FitnessGoal, level: ExperienceLevel) => {
    setExperienceLevel(goal, level);
  };

  const handleGetRecommendations = () => {
    onProceed(selections);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Section with Back Button */}
      <div className="pt-12 px-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span className="text-lg mr-1">←</span>
            <span className="text-sm">Back</span>
          </button>
          <div className="flex-1"></div>
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            GearUP
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
            Tell us your goals. We'll curate gear, nutrition, and recovery picks.
          </p>
        </div>
      </div>

      {/* Goals Selection Section */}
      <div className="px-4 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Pick your goal(s)
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {FITNESS_GOALS.map((goal) => (
            <button
              key={goal.id}
              onClick={() => handleGoalToggle(goal.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                isGoalSelected(goal.id)
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{goal.icon}</div>
              <div className="text-sm font-medium text-gray-800 mb-1">
                {goal.label}
              </div>
              <div className="text-xs text-gray-600 leading-tight">
                {goal.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Experience Level Section */}
      {selections.goals.length > 0 && (
        <div className="px-4 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Experience level
          </h2>
          {selections.goals.map((goalId) => {
            const goal = FITNESS_GOALS.find(g => g.id === goalId);
            if (!goal) return null;

            return (
              <div key={goalId} className="mb-6">
                <div className="flex items-center mb-3">
                  <span className="text-lg mr-2">{goal.icon}</span>
                  <span className="font-medium text-gray-800">{goal.label}</span>
                </div>
                <div className="flex gap-2">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => handleExperienceChange(goalId as FitnessGoal, level.value as ExperienceLevel)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        getExperienceLevel(goalId) === level.value
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Button */}
      <div className="px-4 pb-8">
        <button
          onClick={handleGetRecommendations}
          disabled={!canProceed()}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
            canProceed()
              ? 'bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:scale-95'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue to Questions
        </button>
        
        {!canProceed() && selections.goals.length > 0 && (
          <p className="text-sm text-gray-500 text-center mt-3">
            Please select experience levels for all chosen goals
          </p>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="fixed bottom-4 left-4 right-4">
        <div className="bg-white rounded-full p-1 shadow-lg">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${selections.goals.length > 0 ? 
                (selections.goals.filter(g => selections.experienceLevels[g]).length / selections.goals.length) * 100 : 0
              }%` 
            }}
          />
        </div>
      </div>
    </div>
  );
};
