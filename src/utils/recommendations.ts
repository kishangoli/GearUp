import { UserSelection } from '../types/fitness';

export const generateRecommendations = (selections: UserSelection) => {
  // TODO: This will integrate with Shopify's product catalog
  // For now, return a mock structure
  const recommendations = {
    goals: selections.goals,
    experienceLevels: selections.experienceLevels,
    products: [],
    bundles: [],
    message: `Based on your ${selections.goals.join(', ')} goals and experience levels, we've curated personalized recommendations for you.`
  };

  return recommendations;
};

export const validateSelections = (selections: UserSelection): boolean => {
  return selections.goals.length > 0 && 
         selections.goals.every(goal => selections.experienceLevels[goal]);
};
