import React from 'react';
import { useFollowUpQuestions } from '../hooks/useFollowUpQuestions';
import { FOLLOW_UP_QUESTIONS, DIETARY_ALLERGIES_QUESTION } from '../constants/followUpQuestions';
import { FitnessGoal } from '../types/fitness';
import { useUserAnswers } from '../context/UserAnswersContext';

interface FollowUpQuestionsPageProps {
  selectedGoals: FitnessGoal[];
  onBack: () => void;
  onComplete: (answers: any) => void;
}

export const FollowUpQuestionsPage: React.FC<FollowUpQuestionsPageProps> = ({
  selectedGoals,
  onBack,
  onComplete
}) => {
  const {
    answers,
    currentGoal,
    currentGoalIndex,
    totalGoals,
    updateAnswer,
    goToNextGoal,
    goToPreviousGoal,
    canProceedToNext,
    canFinish,
    getProgress
  } = useFollowUpQuestions(selectedGoals);

  // NEW: hook into global store
  const { updateFollowUps } = useUserAnswers();

  const currentGoalQuestions = FOLLOW_UP_QUESTIONS.find(q => q.goalId === currentGoal);
  const currentGoalAnswers = answers[currentGoal] || {};

  // UPDATED: also push each change to global context
  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    updateAnswer(currentGoal, questionId, value);                                   // local page state
    updateFollowUps(currentGoal as FitnessGoal, { [questionId]: value });           // global store
  };

  const handleNext = () => {
    if (canFinish()) {
      onComplete(answers); // We'll read full answers from context on the next page.
    } else {
      goToNextGoal();
    }
  };

  const handleBack = () => {
    if (currentGoalIndex > 0) {
      goToPreviousGoal();
    } else {
      onBack();
    }
  };

  const renderQuestion = (question: any) => {
    const currentValue = currentGoalAnswers[question.id];

    switch (question.type) {
      case 'radio':
        return (
          <div className="space-y-3">
            {question.options?.map((option: string) => (
              <label
                key={option}
                className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  currentValue === option
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={currentValue === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center w-full">
                  <span className="text-lg mr-3">{question.icon}</span>
                  <span className="font-medium text-gray-800">{option}</span>
                </div>
              </label>
            ))}
          </div>
        );

      case 'text':
        return (
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-3 top-3 text-lg">{question.icon}</span>
              <input
                type="text"
                value={currentValue || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder={question.placeholder}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderConditionalAllergiesQuestion = () => {
    if (currentGoalQuestions?.goalId === 'dietary') {
      const dietaryPreference = currentGoalAnswers['dietary_preference'];
      if (dietaryPreference === 'Allergies') {
        return (
          <div className="bg-white rounded-2xl p-6 shadow-lg mt-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">{DIETARY_ALLERGIES_QUESTION.icon}</span>
              <h3 className="text-lg font-semibold text-gray-800">
                {DIETARY_ALLERGIES_QUESTION.question}
              </h3>
              {DIETARY_ALLERGIES_QUESTION.required && (
                <span className="ml-2 text-red-500 text-sm">*</span>
              )}
            </div>
            {renderQuestion(DIETARY_ALLERGIES_QUESTION)}
          </div>
        );
      }
    }
    return null;
  };

  if (!currentGoalQuestions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❓</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">No Questions Found</h1>
          <p className="text-gray-600">We couldn't find questions for this goal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with Progress */}
      <div className="pt-12 px-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span className="text-lg mr-1">←</span>
            <span className="text-sm">Back</span>
          </button>
          <div className="flex-1 mx-4">
            <div className="bg-white rounded-full p-1 shadow-lg">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {currentGoalIndex + 1} of {totalGoals}
          </div>
        </div>

        {/* Goal Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">{currentGoalQuestions.icon}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {currentGoalQuestions.title}
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            {currentGoalQuestions.description}
          </p>
        </div>
      </div>

      {/* Questions Section */}
      <div className="px-4 mb-8">
        <div className="space-y-8">
          {currentGoalQuestions.questions.map((question) => (
            <div key={question.id} className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">{question.icon}</span>
                <h3 className="text-lg font-semibold text-gray-800">
                  {question.question}
                </h3>
                {question.required && (
                  <span className="ml-2 text-red-500 text-sm">*</span>
                )}
              </div>
              {renderQuestion(question)}
            </div>
          ))}
          {renderConditionalAllergiesQuestion()}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 pb-8">
        <div className="flex gap-3">
          {currentGoalIndex > 0 && (
            <button
              onClick={goToPreviousGoal}
              className="flex-1 py-4 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Previous
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceedToNext(currentGoal)}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
              canProceedToNext(currentGoal)
                ? 'bg-blue-500 text-white shadow-lg hover:bg-blue-600 active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canFinish() ? 'Get Recommendations' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
