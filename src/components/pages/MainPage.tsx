import { Button, Image } from '@shopify/shop-minis-react';
import React, { useState, useEffect, useRef } from 'react';
import { useFitnessSelections } from '../hooks/useFitnessSelections';
import { FITNESS_GOALS } from '../label-data/fitnessGoals';
import { FitnessGoal, ExperienceLevel } from '../types/fitness';
import { useUserAnswers } from '../context/UserAnswersContext';
import { motion, AnimatePresence } from "motion/react";

interface MainPageProps {
  onBack: () => void;
  onProceed: (selections: any) => void;
}

export const MainPage: React.FC<MainPageProps> = ({ onBack, onProceed }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { selections, toggleGoal, isGoalSelected } = useFitnessSelections();
  const { updateGoals, updateExperience } = useUserAnswers();

  useEffect(() => {
    setIsLoaded(true);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elementId = entry.target.getAttribute('data-animate-id');
            if (elementId) {
              setVisibleElements((prev) => new Set([...prev, elementId]));
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    updateGoals(selections.goals as FitnessGoal[]);
    Object.entries(selections.experienceLevels).forEach(([goal, level]) => {
      updateExperience(goal as FitnessGoal, level as ExperienceLevel);
    });
  }, [selections.goals, selections.experienceLevels, updateGoals, updateExperience]);

  const observeElement = (element: HTMLElement | null, id: string) => {
    if (element && observerRef.current) {
      element.setAttribute('data-animate-id', id);
      observerRef.current.observe(element);
    }
  };

  const handleGoalToggle = (goal: FitnessGoal) => {
    toggleGoal(goal);
  };

  const handleGetRecommendations = () => {
    onProceed(selections);
  };

  const CheckmarkIcon = ({ isSelected }: { isSelected: boolean }) => (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
      isSelected ? 'bg-green-500' : 'border-2 border-white/20'
    }`}>
      {isSelected && (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        html, body {
          background-color: #242331 !important;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        
        #root {
          background-color: #242331;
          min-height: 100vh;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.15); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.25); }
        }

        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmerSweep {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .animated-bg {
          background: linear-gradient(-45deg, #242331, #1d4865ff, #242331, #1c4661ff);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }

        .glow-effect {
          animation: glow 4s ease-in-out infinite;
        }

        .glass-morphism {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
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
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.8s ease;
        }

        .glass-morphism-selected {
          background: rgba(59, 130, 246, 0.15);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(59, 130, 246, 0.3);
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .glass-morphism-selected::before {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
        }

        .slide-in-up {
          animation: slideInUp 0.6s ease-out forwards;
        }

        .scroll-reveal {
          opacity: 0;
          transition: all 0.8s ease-out;
        }

        .scroll-reveal.visible {
          opacity: 1;
        }

        .shimmer-on-scroll.visible::before {
          animation: shimmerSweep 1.5s ease-out;
        }

        .touch-feedback:active {
          transform: scale(0.95);
        }
      `}</style>

      <div className="main-container min-h-screen animated-bg flex flex-col">
        {/* Progress Bar */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-2 bg-gray-800/80">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
              style={{ width: `${selections.goals.length > 0 ? (selections.goals.filter(g => selections.experienceLevels[g]).length / selections.goals.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Back Button */}
        <div className="fixed top-4 left-4 z-50">
          <Button onClick={onBack} className="flex items-center justify-center w-12 h-12 text-white">
            <span className="text-xl">←</span>
          </Button>
        </div>

        {/* Header */}
        <div className="px-4 pt-20 pb-6">
          <div className="text-center">
            <Image 
              src="/gearupshortfinal.png"
              alt="Gear Up Logo" 
              className={`h-16 w-auto mx-auto mb-2 ${isLoaded ? 'slide-in-up' : ''}`}
            />
            <p className={`text-base text-gray-200 max-w-md mx-auto ${isLoaded ? 'slide-in-up' : ''}`}>
              Your personal fitness journey begins here.
            </p>
          </div>
        </div>

        {/* Goals Grid - Reduced gap and taller cards */}
        <div className="flex-1 px-4 pb-24">
          <div className="grid grid-cols-2 gap-3">
            {FITNESS_GOALS.map((goal) => {
              const id = `goal-${goal.id}`;
              const selected = isGoalSelected(goal.id);
              return (
                <div
                  key={goal.id}
                  ref={(el) => observeElement(el, id)}
                  className={`scroll-reveal shimmer-on-scroll ${visibleElements.has(id) ? 'visible' : ''}`}
                  style={{ aspectRatio: '0.95' }}
                >
                  <Button
                    onClick={() => handleGoalToggle(goal.id)}
                    className={`w-full h-full rounded-2xl transition-all duration-300 touch-feedback relative
                      flex flex-col items-center justify-center p-6
                      ${selected ? 'glass-morphism-selected text-white ring-2 ring-blue-400' : 'glass-morphism text-gray-200'}`}
                  >
                    <div className="absolute top-3 right-3">
                      <CheckmarkIcon isSelected={selected} />
                    </div>
                    <div className="text-5xl mb-3">{goal.icon}</div>
                    <div className="text-lg font-semibold mb-2">{goal.label}</div>
                    <div className="text-s opacity-80 text-center leading-tight px-1">{goal.description}</div>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 bg-gradient-to-t from-[#242331] via-[#242331] to-transparent pt-4">
          <AnimatePresence mode="wait">
            {selections.goals.length > 0 ? (
              <motion.button
                key="active"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={handleGetRecommendations}
                className="w-full py-4 rounded-xl font-semibold text-xl glass-morphism-selected text-white glow-effect"
              >
                Continue
              </motion.button>
            ) : (
              <motion.div
                key="inactive"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full py-4 rounded-xl font-semibold text-lg text-center bg-gray-800/50 text-gray-400"
              >
                Pick your goal(s) to continue
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};
