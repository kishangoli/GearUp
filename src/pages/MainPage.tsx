import React, { useState, useEffect, useRef } from 'react';
import { useFitnessSelections } from '../hooks/useFitnessSelections';
import { FITNESS_GOALS } from '../constants/fitnessGoals';
import { FitnessGoal, ExperienceLevel } from '../types/fitness';
import { useUserAnswers } from '../context/UserAnswersContext';
import { Button } from "../components/ui/moving-border";

interface MainPageProps {
  onBack: () => void;
  onProceed: (selections: any) => void;
}

export const MainPage: React.FC<MainPageProps> = ({ onBack, onProceed }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const [isCompactView, setIsCompactView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const {
    selections,
    toggleGoal,
    isGoalSelected
  } = useFitnessSelections();

  // NEW: context helpers to keep global answers in sync
  const { updateGoals, updateExperience } = useUserAnswers();

  // Page load animation and intersection observer setup
  useEffect(() => {
    setIsLoaded(true);
    
    // Set background color on document elements to prevent white flash
    document.documentElement.style.backgroundColor = '#284B63';
    document.body.style.backgroundColor = '#284B63';
    
    // Prevent unnecessary scrolling when content fits on screen
    const preventUnnecessaryScroll = () => {
      const container = document.querySelector('.main-container') as HTMLElement;
      if (container) {
        // Always disable scrolling until user selects at least one goal
        if (selections.goals.length === 0) {
          container.style.overflow = 'hidden';
          return;
        }
        
        const contentHeight = container.scrollHeight;
        const viewportHeight = window.innerHeight;
        
        if (contentHeight <= viewportHeight) {
          container.style.overflow = 'hidden';
        } else {
          container.style.overflowY = 'auto';
          container.style.overflowX = 'hidden';
        }
      }
    };
    
    // Call initially and on resize
    setTimeout(preventUnnecessaryScroll, 100);
    
    // Viewport height detection and responsive layout
        const handleViewportChange = () => {
      const vh = window.visualViewport?.height || window.innerHeight;
      const vw = window.visualViewport?.width || window.innerWidth;
      
      // Detect if we're in a compact view (shorter viewport or iPhone-like aspect ratio)
      const aspectRatio = vh / vw;
      const isCompact = vh < 700 || aspectRatio < 1.5;
      
      setIsCompactView(isCompact);
      
      // Check scroll necessity after layout changes
      setTimeout(preventUnnecessaryScroll, 100);
    };

    handleViewportChange();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);
    
    // Set up intersection observer for mobile-friendly animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elementId = entry.target.getAttribute('data-animate-id');
            if (elementId) {
              setVisibleElements(prev => new Set([...prev, elementId]));
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Observe elements when they mount
  const observeElement = (element: HTMLElement | null, id: string) => {
    if (element && observerRef.current) {
      element.setAttribute('data-animate-id', id);
      observerRef.current.observe(element);
    }
  };

  // Sync selections → global store whenever user changes them
  useEffect(() => {
    updateGoals(selections.goals as FitnessGoal[]);
    Object.entries(selections.experienceLevels).forEach(([goal, level]) => {
      updateExperience(goal as FitnessGoal, level as ExperienceLevel);
    });
    
    // Re-check scroll necessity when selections change
    const preventUnnecessaryScroll = () => {
      const container = document.querySelector('.main-container') as HTMLElement;
      if (container) {
        // Always disable scrolling until user selects at least one goal
        if (selections.goals.length === 0) {
          container.style.overflow = 'hidden';
          return;
        }
        
        const contentHeight = container.scrollHeight;
        const viewportHeight = window.innerHeight;
        
        if (contentHeight <= viewportHeight) {
          container.style.overflow = 'hidden';
        } else {
          container.style.overflowY = 'auto';
          container.style.overflowX = 'hidden';
        }
      }
    };
    
    setTimeout(preventUnnecessaryScroll, 100);
  }, [selections.goals, selections.experienceLevels, updateGoals, updateExperience]);

  const handleGoalToggle = (goal: FitnessGoal) => {
    toggleGoal(goal);
  };

  const handleGetRecommendations = () => {
    onProceed(selections);
  };

  // Simple checkmark component fallback
  const CheckmarkIcon = () => (
    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center animate-bounce">
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );

  return (
    <>
      <style>{`
        html {
          background-color: #284B63 !important;
          min-height: 100%;
          overscroll-behavior: none;
        }
        
        body {
          overflow-x: hidden;
          max-width: 100vw;
          background-color: #284B63 !important;
          min-height: 100vh;
          margin: 0;
          padding: 0;
          overscroll-behavior: none;
          position: fixed;
          width: 100%;
        }
        
        #root {
          background-color: #284B63;
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
          background: linear-gradient(-45deg, #242331, #284B63, #242331, #284B63);
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
        
        /* Mobile-optimized scroll animations */
        .scroll-reveal {
          opacity: 0;
          transition: all 0.8s ease-out;
        }
        
        .scroll-reveal.visible {
          opacity: 1;
        }
        
        .shimmer-on-scroll {
          transition: all 0.3s ease;
        }
        
        .shimmer-on-scroll.visible::before {
          animation: shimmerSweep 1.5s ease-out;
        }
        
        @keyframes shimmerSweep {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        /* Enhanced mobile touch feedback */
        .touch-feedback:active {
          transform: scale(0.95);
          filter: brightness(1.1);
        }
        
        /* Scroll-based glow effect */
        .scroll-glow.visible {
          box-shadow: 
            0 0 20px rgba(59, 130, 246, 0.2),
            0 8px 32px rgba(59, 130, 246, 0.1);
        }
        
        /* Responsive viewport adaptations */
        .compact-layout {
          --header-padding: 0.75rem;
          --section-margin: 1.5rem;
          --button-padding: 1rem;
          --text-size: 0.9rem;
          --icon-size: 2.5rem;
        }
        
        .normal-layout {
          --header-padding: 1rem;
          --section-margin: 2rem;
          --button-padding: 1.25rem;
          --text-size: 1rem;
          --icon-size: 3rem;
        }
        
        /* Dynamic spacing classes */
        .responsive-padding {
          padding-top: var(--header-padding);
          padding-bottom: var(--header-padding);
        }
        
        .responsive-margin {
          margin-bottom: var(--section-margin);
        }
        
        .responsive-button-padding {
          padding: var(--button-padding);
        }
        
        .responsive-text {
          font-size: var(--text-size);
        }
        
        .responsive-icon {
          font-size: var(--icon-size);
        }
        
        /* iPhone-specific optimizations */
        @media screen and (max-height: 900px) {
          .goal-grid {
            gap: 0.5rem;
          }
          
          .experience-section {
            margin-bottom: 1rem;
          }
          
          .header-logo {
            height: 3.5rem;
            margin-bottom: 0.25rem;
          }
        }
        
        @media screen and (min-height: 900px) {
          .goal-grid {
            gap: 0.75rem;
          }
          
          .experience-section {
            margin-bottom: 2rem;
          }
          
          .header-logo {
            height: 4.5rem;
            margin-bottom: 0.5rem;
          }
        }
      `}</style>
      <div className={`main-container h-screen overflow-y-auto overflow-x-hidden max-w-full animated-bg relative flex flex-col ${isCompactView ? 'compact-layout' : 'normal-layout'}`} style={{ overscrollBehavior: 'none' }}>
        {/* Enhanced Progress Bar at Top */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-2 bg-gray-800/80 backdrop-blur-sm border-b border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 shadow-lg shadow-blue-500/30 transition-all duration-500 ease-out glow-effect"
              style={{ 
                width: `${selections.goals.length > 0 ? 
                  (selections.goals.filter(g => selections.experienceLevels[g]).length / selections.goals.length) * 100 : 0
                }%` 
              }}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">

        {/* Header Section with Back Button */}
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={onBack}
              className="flex items-center text-gray-300 hover:text-white transition-all duration-300 transform touch-feedback px-3 py-2 rounded-lg glass-morphism"
            >
              <span className="text-lg mr-1">←</span>
              <span className="text-sm">Back</span>
            </button>
            <div className="flex-1"></div>
          </div>
          
          <div className="text-center">
            <div className="floating-element">
              <img 
                src="https://archive.org/download/gearupshortfinal/gearupshortfinal.png" 
                alt="Gear Up Logo" 
                className={`header-logo w-auto mx-auto mb-1 ${isLoaded ? 'slide-in-up' : ''}`}
              />
            </div>
            <p className={`responsive-text text-gray-200 mb-1 max-w-md mx-auto ${isLoaded ? 'slide-in-up' : ''}`} style={{ animationDelay: '0.2s' }}>
              Tell us your goals. We'll curate gear, nutrition, and recovery picks.
            </p>
          </div>
        </div>

        {/* Goals Selection Section */}
        <div className="px-4 mb-2 flex-1">
          <h2 className={`text-xl font-semibold text-gray-200 mb-3 ${isLoaded ? 'slide-in-up' : ''}`} style={{ animationDelay: '0.3s' }}>
            Pick your goal(s)
          </h2>
          <div className="goal-grid grid grid-cols-2 gap-2 mb-4">
            {FITNESS_GOALS.map((goal, index) => (
              <button
                key={goal.id}
                ref={(el) => observeElement(el, `goal-${goal.id}`)}
                onClick={() => handleGoalToggle(goal.id)}
                className={`p-6 rounded-2xl transition-all duration-300 transform touch-feedback relative scroll-reveal shimmer-on-scroll ${
                  visibleElements.has(`goal-${goal.id}`) ? 'visible' : ''
                } ${
                  isGoalSelected(goal.id)
                    ? 'glass-morphism-selected text-white scroll-glow'
                    : 'glass-morphism text-gray-200'
                } ${isLoaded ? 'fade-in-stagger' : ''} stagger-${index + 1}`}
              >
                {isGoalSelected(goal.id) && (
                  <div className="absolute top-3 right-3">
                    <CheckmarkIcon />
                  </div>
                )}
                <div className={`text-4xl mb-3 ${isCompactView ? 'text-3xl mb-2' : ''}`}>{goal.icon}</div>
                <div className={`text-base font-semibold mb-2 ${isCompactView ? 'text-sm mb-1' : ''}`}>
                  {goal.label}
                </div>
                <div className={`text-sm opacity-80 leading-tight ${isCompactView ? 'text-xs' : ''}`}>
                  {goal.description}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Fixed Action Button at Bottom - Only show when goals are selected */}
        {selections.goals.length > 0 && (
          <div className="px-4 -mt-6 mb-9">
            <Button
              onClick={handleGetRecommendations}
              borderRadius="1rem"
              duration={4000}
              containerClassName="h-16 p-[1px] w-full"
              borderClassName="opacity-70 bg-gradient-to-r from-blue-400 to-purple-500"
              className={`rounded-2xl bg-transparent font-semibold transition-all duration-300 transform touch-feedback relative overflow-hidden ${
                isCompactView ? 'text-base' : 'text-lg'
              } glass-morphism-selected text-white`}
            >
              <div className="relative z-10">
                Continue to Questions
              </div>
            </Button>
          </div>
        )}
        </div>
      </div>
    </>
  );
};
