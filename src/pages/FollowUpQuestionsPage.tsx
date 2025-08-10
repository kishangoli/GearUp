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
    canFinish,
    getProgress
  } = useFollowUpQuestions(selectedGoals);

  // NEW: hook into global store
  const { updateFollowUps } = useUserAnswers();

  const [showValidationErrors, setShowValidationErrors] = React.useState(false);

  const currentGoalQuestions = FOLLOW_UP_QUESTIONS.find(q => q.goalId === currentGoal);
  const currentGoalAnswers = answers[currentGoal] || {};

  // Helper function to check if a question is answered
  const isQuestionAnswered = (questionId: string) => {
    const answer = currentGoalAnswers[questionId];
    if (typeof answer === 'string') {
      return answer.trim() !== '';
    }
    return !!answer;
  };

  // Scroll to top when currentGoal changes
  React.useEffect(() => {
    // Scroll the root container instead of window since body is position: fixed
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Fallback to window scroll
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentGoal]);

  // UPDATED: also push each change to global context + auto-scroll to next question
  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    updateAnswer(currentGoal, questionId, value);                                   // local page state
    updateFollowUps(currentGoal as FitnessGoal, { [questionId]: value });           // global store
    
    // Auto-scroll to next question after a short delay
    setTimeout(() => {
      scrollToNextQuestion(questionId);
    }, 300);
  };

  // Helper function to scroll to the next question
  const scrollToNextQuestion = (currentQuestionId: string) => {
    if (!currentGoalQuestions) return;
    
    // Find current question index
    const currentIndex = currentGoalQuestions.questions.findIndex(q => q.id === currentQuestionId);
    
    // Check if there's a next question in the current goal
    if (currentIndex >= 0 && currentIndex < currentGoalQuestions.questions.length - 1) {
      // Scroll to next question in current goal
      const nextQuestionId = currentGoalQuestions.questions[currentIndex + 1].id;
      scrollToQuestion(nextQuestionId);
    } else if (currentQuestionId === 'dietary_preference' && currentGoalAnswers['dietary_preference'] === 'Allergies') {
      // Special case: if we just answered dietary_preference with "Allergies", scroll to allergies question
      setTimeout(() => {
        scrollToQuestion(DIETARY_ALLERGIES_QUESTION.id);
      }, 100);
    } else {
      // If it's the last question of current goal, scroll to the navigation button
      const navigationElement = document.querySelector('[data-navigation]');
      if (navigationElement) {
        navigationElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  };

  // Helper function to scroll to a specific question
  const scrollToQuestion = (questionId: string) => {
    const questionElement = document.querySelector(`[data-question-id="${questionId}"]`);
    if (questionElement) {
      questionElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  };

  const handleNext = () => {
    // Check if all required questions are answered
    const unansweredQuestions: string[] = [];
    
    // Check main questions
    if (currentGoalQuestions) {
      for (const question of currentGoalQuestions.questions) {
        if (question.required && !isQuestionAnswered(question.id)) {
          unansweredQuestions.push(question.id);
        }
      }
    }
    
    // Check conditional allergies question
    if (currentGoal === 'dietary' && currentGoalAnswers['dietary_preference'] === 'Allergies') {
      if (DIETARY_ALLERGIES_QUESTION.required && !isQuestionAnswered(DIETARY_ALLERGIES_QUESTION.id)) {
        unansweredQuestions.push(DIETARY_ALLERGIES_QUESTION.id);
      }
    }
    
    if (unansweredQuestions.length > 0) {
      // Show validation errors and scroll to first unanswered question
      setShowValidationErrors(true);
      
      // Find and scroll to the first unanswered question
      setTimeout(() => {
        const firstUnansweredElement = document.querySelector(
          `[data-question-id="${unansweredQuestions[0]}"]`
        );
        if (firstUnansweredElement) {
          firstUnansweredElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      
      return; // Don't proceed
    }
    
    if (canFinish()) {
      onComplete(answers); // We'll read full answers from context on the next page.
    } else {
      setShowValidationErrors(false); // Reset validation errors on successful proceed
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
            {question.options?.map((option: string | { text: string; icon: string }) => {
              const optionText = typeof option === 'string' ? option : option.text;
              const optionIcon = typeof option === 'string' ? question.icon : option.icon;
              
              return (
                <label
                  key={optionText}
                  className={`flex items-center p-4 rounded-xl cursor-pointer touch-feedback transition-all duration-300 ${
                    currentValue === optionText
                      ? 'radio-option-selected'
                      : 'radio-option hover:radio-option-hover'
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={optionText}
                    checked={currentValue === optionText}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center w-full">
                    <span className="text-lg mr-3">{optionIcon}</span>
                    <span className="font-medium text-white">{optionText}</span>
                  </div>
                </label>
              );
            })}
          </div>
        );

      case 'text':
        return (
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-3 top-3 text-lg text-gray-300">{question.icon}</span>
              <input
                type="text"
                value={currentValue || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder={question.placeholder}
                className="glass-input w-full pl-12 pr-4 py-4 rounded-xl transition-all duration-300"
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
        const isAnswered = isQuestionAnswered(DIETARY_ALLERGIES_QUESTION.id);
        const showWarning = DIETARY_ALLERGIES_QUESTION.required && !isAnswered && showValidationErrors;
        
        return (
          <div 
            data-question-id={DIETARY_ALLERGIES_QUESTION.id}
            className={`question-card rounded-2xl p-6 mt-6 fade-in-stagger ${showWarning ? 'border-red-400/50 bg-red-500/5' : ''}`} 
            style={{ animationDelay: '0.4s' }}
          >
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">{DIETARY_ALLERGIES_QUESTION.icon}</span>
              <h3 className="text-lg font-semibold text-white">
                {DIETARY_ALLERGIES_QUESTION.question}
              </h3>
            </div>
            {showWarning && (
              <div className="mb-3 text-sm text-red-400 flex items-center">
                <span className="mr-1">*</span>
                This field is required
              </div>
            )}
            {renderQuestion(DIETARY_ALLERGIES_QUESTION)}
          </div>
        );
      }
    }
    return null;
  };

  if (!currentGoalQuestions) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="text-center question-card rounded-2xl p-8">
          <div className="text-6xl mb-4">❓</div>
          <h1 className="text-2xl font-bold text-white mb-2">No Questions Found</h1>
          <p className="text-gray-300">We couldn't find questions for this goal.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        html {
          background-color: #242331 !important;
          min-height: 100%;
          overscroll-behavior: none;
        }
        
        body {
          overflow-x: hidden;
          max-width: 100vw;
          background-color: #242331 !important;
          min-height: 100vh;
          margin: 0;
          padding: 0;
          overscroll-behavior: none;
          position: fixed;
          width: 100%;
        }
        
        #root {
          background-color: #242331;
          height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: none;
        }
        
        /* Ensure consistent background throughout */
        * {
          box-sizing: border-box;
        }
        
        /* Enhanced Glassmorphism Animations */
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.15); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.25); }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animated-bg {
          background: linear-gradient(-45deg, #242331, #1d4763ff, #242331, #18415dff);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }
        
        .floating-element {
          animation: float 6s ease-in-out infinite;
        }
        
        .glow-effect {
          animation: glow 4s ease-in-out infinite;
        }
        
        .glass-morphism {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .glass-morphism::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          transition: left 0.8s ease;
        }
        
        .glass-morphism.animate-shimmer::before {
          left: 100%;
        }
        
        .glass-morphism:active {
          transform: scale(0.98);
        }
        
        .glass-morphism-selected {
          background: rgba(59, 130, 246, 0.15);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(59, 130, 246, 0.3);
          box-shadow: 
            0 8px 32px rgba(59, 130, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .glass-morphism-selected::before {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.15),
            transparent
          );
        }
        
        .slide-in-up {
          animation: slideInUp 0.6s ease-out forwards;
        }
        
        .fade-in-stagger {
          opacity: 0;
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .stagger-animation {
          opacity: 0;
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        
        /* Enhanced mobile touch feedback */
        .touch-feedback:active {
          transform: scale(0.95);
          filter: brightness(1.1);
        }
        
        /* Enhanced Glassmorphism Question Cards */
        .question-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .question-card:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }
        
        /* Glassmorphism Radio Options */
        .radio-option {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .radio-option:hover {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .radio-option-selected {
          background: rgba(59, 130, 246, 0.15);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(59, 130, 246, 0.3);
          box-shadow: 
            0 4px 20px rgba(59, 130, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        /* Glassmorphism Text Input */
        .glass-input {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          transition: all 0.3s ease;
        }
        
        .glass-input:focus {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
          outline: none;
        }
        
        .glass-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
      `}</style>
      <div className="min-h-screen animated-bg">
        {/* Enhanced Progress Bar at Top */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-gray-800/80 backdrop-blur-sm border-b border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 shadow-lg shadow-blue-500/30 transition-all duration-500 ease-out glow-effect"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>

        {/* Header with Progress */}
        <div className="pt-6 px-4 pb-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <span className="text-xl">←</span>
            </button>
            <div className="w-10" />
          </div>

          {/* Goal Header */}
          <div className="text-center">
            <div className="text-4xl mb-3 floating-element">{currentGoalQuestions.icon}</div>
            <h1 className="text-2xl font-bold text-white mb-2 slide-in-up">
              {currentGoalQuestions.title}
            </h1>
            <p className="text-gray-300 max-w-md mx-auto slide-in-up" style={{ animationDelay: '0.2s' }}>
              {currentGoalQuestions.description}
            </p>
          </div>
        </div>

        {/* Questions Section */}
        <div className="px-4 mb-8">
          <div className="space-y-8">
            {currentGoalQuestions.questions.map((question, index) => {
              const isAnswered = isQuestionAnswered(question.id);
              const showWarning = question.required && !isAnswered && showValidationErrors;
              
              return (
                <div 
                  key={question.id} 
                  data-question-id={question.id}
                  className={`question-card rounded-2xl p-6 fade-in-stagger ${showWarning ? 'border-red-400/50 bg-red-500/5' : ''}`} 
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-3">{question.icon}</span>
                    <h3 className="text-lg font-semibold text-white">
                      {question.question}
                    </h3>
                  </div>
                  {showWarning && (
                    <div className="mb-3 text-sm text-red-400 flex items-center">
                      <span className="mr-1">*</span>
                      This field is required
                    </div>
                  )}
                  {renderQuestion(question)}
                </div>
              );
            })}
            {renderConditionalAllergiesQuestion()}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 pb-8" data-navigation>
          <div className="flex gap-3">
            <button
              onClick={handleNext}
              className="w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 touch-feedback glass-morphism-selected text-white glow-effect hover:brightness-110"
            >
              {totalGoals === 1 || canFinish() ? 'Get Recommendations' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
