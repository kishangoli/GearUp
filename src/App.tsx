import React, { useState } from 'react';
import { OpenerPage } from './pages/OpenerPage';
import { MainPage } from './pages/MainPage';
import { FollowUpQuestionsPage } from './pages/FollowUpQuestionsPage';
import { AnimatePresence, motion } from 'motion/react';

type PageType = 'opener' | 'main' | 'followUp';

export function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('opener');
  const [lastPage, setLastPage] = useState<PageType | null>(null);
  const [goalSelections, setGoalSelections] = useState<any>(null);

  const go = (next: PageType) => { setLastPage(currentPage); setCurrentPage(next); };

  const handleGetStarted = () => go('main');
  const handleBackToOpener = () => { setGoalSelections(null); go('opener'); };
  const handleBackToMain = () => go('main');
  const handleProceedToQuestions = (selections: any) => { setGoalSelections(selections); go('followUp'); };
  const handleQuestionsComplete = (answers: any) => { console.log({ goalSelections, answers }); setGoalSelections(null); go('opener'); };

  // Generic (non-special) transitions
  const variants = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: -16, filter: 'blur(4px)' }
  };
  const transition = { duration: 0.4, ease: 'easeOut' as const };

  // Special: main enters with a radial iris reveal if coming from opener
  const useRadialReveal = lastPage === 'opener' && currentPage === 'main';

  return (
    <div className="min-h-screen relative">
      <AnimatePresence mode="wait">
        {currentPage === 'opener' && (
          <motion.div
            key="opener"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(6px)' }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <OpenerPage onGetStarted={handleGetStarted} />
          </motion.div>
        )}

        {currentPage === 'main' && (
          useRadialReveal ? (
            // Radial reveal wrapper ONLY for opener → main
            <motion.div
              key="main-iris"
              initial={{ clipPath: 'circle(0% at 50% 86%)' }}   // near the Get Started button
              animate={{ clipPath: 'circle(150% at 50% 86%)' }} // expands to cover screen
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute inset-0 will-change-[clip-path]"
              style={{ background: 'transparent' }}
            >
              {/* slight shine sweep overlay during reveal (optional flair) */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                initial={{ opacity: 0.0, x: '-30%' }}
                animate={{ opacity: 0.25, x: '130%' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{
                  background:
                    'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.6) 12%, transparent 24%)'
                }}
              />
              <MainPage onBack={handleBackToOpener} onProceed={handleProceedToQuestions} />
            </motion.div>
          ) : (
            // Fallback animation for other entries to main
            <motion.div
              key="main"
              initial="initial" animate="animate" exit="exit"
              variants={variants} transition={transition}
            >
              <MainPage onBack={handleBackToOpener} onProceed={handleProceedToQuestions} />
            </motion.div>
          )
        )}

        {currentPage === 'followUp' && goalSelections && (
          <motion.div key="followUp" initial="initial" animate="animate" exit="exit" variants={variants} transition={transition}>
            <FollowUpQuestionsPage
              selectedGoals={goalSelections.goals}
              onBack={handleBackToMain}
              onComplete={handleQuestionsComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
