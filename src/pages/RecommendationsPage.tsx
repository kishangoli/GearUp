import React from 'react';
import { useUserAnswers } from '../context/UserAnswersContext';

interface RecommendationsPageProps {
  onBack: () => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({ onBack }) => {
  const { answers } = useUserAnswers();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="pt-12 px-4 pb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span className="text-lg mr-1">←</span>
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Your Recommendations</h1>
        <div className="w-10" />
      </div>

      {/* Placeholder: show collected answers for now */}
      <div className="px-4 pb-10">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Inputs we’ll use</h2>
          <pre className="text-sm text-gray-700 overflow-x-auto">
{JSON.stringify(answers, null, 2)}
          </pre>
        </div>

        {/* Placeholder product grid we’ll fill in next */}
        <div className="mt-6">
          <h3 className="text-md font-semibold text-gray-800 mb-2">Products (coming next)</h3>
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-xl bg-white/60 border border-gray-200 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
