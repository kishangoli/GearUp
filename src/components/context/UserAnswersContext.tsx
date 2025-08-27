import React, { createContext, useContext, useState } from 'react';
import type { UserAnswers } from '../types/answers';

type Ctx = {
  answers: UserAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<UserAnswers>>;
  // helpers (optional, convenient)
  updateGoals: (goals: UserAnswers['goals']) => void;
  updateExperience: (goal: keyof UserAnswers['experienceLevels'], level: any) => void;
  updateFollowUps: (goal: keyof UserAnswers['followUps'], data: Record<string, unknown>) => void;
};

const UserAnswersContext = createContext<Ctx | undefined>(undefined);

export const UserAnswersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [answers, setAnswers] = useState<UserAnswers>({
    goals: [],
    experienceLevels: {} as UserAnswers['experienceLevels'],
    followUps: {} as UserAnswers['followUps'],
  });

  const updateGoals: Ctx['updateGoals'] = (goals) =>
    setAnswers((prev) => ({ ...prev, goals }));

  const updateExperience: Ctx['updateExperience'] = (goal, level) =>
    setAnswers((prev) => ({
      ...prev,
      experienceLevels: { ...prev.experienceLevels, [goal]: level },
    }));

  const updateFollowUps: Ctx['updateFollowUps'] = (goal, data) =>
    setAnswers((prev) => ({
      ...prev,
      followUps: { ...prev.followUps, [goal]: { ...(prev.followUps[goal] || {}), ...data } },
    }));

  return (
    <UserAnswersContext.Provider value={{ answers, setAnswers, updateGoals, updateExperience, updateFollowUps }}>
      {children}
    </UserAnswersContext.Provider>
  );
};

export function useUserAnswers() {
  const ctx = useContext(UserAnswersContext);
  if (!ctx) throw new Error('useUserAnswers must be used within <UserAnswersProvider>');
  return ctx;
}
