import { 
  ActivityLevel, 
  NutritionGoal, 
  UserNutritionProfile,
  CalorieCalculatorResult
} from '../types/nutrition';

/**
 * Activity level multipliers for TDEE calculation
 */
export const ACTIVITY_MULTIPLIERS = {
  [ActivityLevel.SEDENTARY]: 1.2,
  [ActivityLevel.LIGHTLY_ACTIVE]: 1.375,
  [ActivityLevel.MODERATELY_ACTIVE]: 1.55,
  [ActivityLevel.VERY_ACTIVE]: 1.725,
  [ActivityLevel.EXTREMELY_ACTIVE]: 1.9
};

/**
 * Goal calorie adjustments
 */
export const GOAL_ADJUSTMENTS = {
  [NutritionGoal.WEIGHT_LOSS]: -500,
  [NutritionGoal.MAINTENANCE]: 0,
  [NutritionGoal.WEIGHT_GAIN]: 500,
  [NutritionGoal.MUSCLE_BUILDING]: 300
};

/**
 * Calculate Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation
 * @param profile User nutrition profile
 * @returns BMR in calories per day
 */
export function calculateBMR(profile: UserNutritionProfile): number {
  const { gender, weight, height, age } = profile;
  
  // Mifflin-St Jeor Equation
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  
  return Math.round(bmr);
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 * @param bmr Basal Metabolic Rate
 * @param activityLevel User activity level
 * @returns TDEE in calories per day
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  return Math.round(bmr * activityMultiplier);
}

/**
 * Calculate goal calories based on TDEE and nutrition goal
 * @param tdee Total Daily Energy Expenditure
 * @param goal User nutrition goal
 * @returns Goal calories per day
 */
export function calculateGoalCalories(tdee: number, goal: NutritionGoal): number {
  const adjustment = GOAL_ADJUSTMENTS[goal];
  return Math.round(tdee + adjustment);
}

/**
 * Calculate macro nutrient breakdown based on goal calories
 * @param goalCalories Daily calorie goal
 * @param goal User nutrition goal
 * @returns Macro breakdown with grams, calories and percentages
 */
export function calculateMacroBreakdown(goalCalories: number, goal: NutritionGoal, dietaryRestrictions?: string[]) {
  let proteinPercentage = 0;
  let fatPercentage = 0;
  let carbsPercentage = 0;
  
  // Dietary overrides (e.g., keto)
  const isKeto = Array.isArray(dietaryRestrictions) && dietaryRestrictions.includes('keto');
  if (isKeto) {
    // Typical keto macro ratios
    proteinPercentage = 0.20; // 20% protein
    fatPercentage = 0.75;     // 75% fat
    carbsPercentage = 0.05;   // 5% carbs
  } else {
  // Adjust macro ratios based on goal
  switch (goal) {
    case NutritionGoal.WEIGHT_LOSS:
      proteinPercentage = 0.40; // 40% protein
      fatPercentage = 0.30;     // 30% fat
      carbsPercentage = 0.30;   // 30% carbs
      break;
    case NutritionGoal.MAINTENANCE:
      proteinPercentage = 0.30; // 30% protein
      fatPercentage = 0.30;     // 30% fat
      carbsPercentage = 0.40;   // 40% carbs
      break;
    case NutritionGoal.WEIGHT_GAIN:
      proteinPercentage = 0.25; // 25% protein
      fatPercentage = 0.25;     // 25% fat
      carbsPercentage = 0.50;   // 50% carbs
      break;
    case NutritionGoal.MUSCLE_BUILDING:
      proteinPercentage = 0.35; // 35% protein
      fatPercentage = 0.25;     // 25% fat
      carbsPercentage = 0.40;   // 40% carbs
      break;
  }
  }
  
  // Calculate calories for each macro
  const proteinCalories = goalCalories * proteinPercentage;
  const fatCalories = goalCalories * fatPercentage;
  const carbsCalories = goalCalories * carbsPercentage;
  
  // Convert calories to grams (protein: 4 cal/g, carbs: 4 cal/g, fat: 9 cal/g)
  const proteinGrams = Math.round(proteinCalories / 4);
  const carbsGrams = Math.round(carbsCalories / 4);
  const fatGrams = Math.round(fatCalories / 9);
  
  return {
    protein: {
      grams: proteinGrams,
      calories: Math.round(proteinCalories),
      percentage: Math.round(proteinPercentage * 100)
    },
    carbs: {
      grams: carbsGrams,
      calories: Math.round(carbsCalories),
      percentage: Math.round(carbsPercentage * 100)
    },
    fat: {
      grams: fatGrams,
      calories: Math.round(fatCalories),
      percentage: Math.round(fatPercentage * 100)
    }
  };
}

/**
 * Generate explanation text for the calorie calculation
 */
export function generateExplanation(profile: UserNutritionProfile, result: CalorieCalculatorResult): string {
  const { gender, age, weight, height, activityLevel, goal } = profile;
  const { bmr, tdee, goalCalories, macroBreakdown } = result;
  
  const activityText = {
    [ActivityLevel.SEDENTARY]: 'sedentary (little or no exercise)',
    [ActivityLevel.LIGHTLY_ACTIVE]: 'lightly active (light exercise 1-3 days/week)',
    [ActivityLevel.MODERATELY_ACTIVE]: 'moderately active (moderate exercise 3-5 days/week)',
    [ActivityLevel.VERY_ACTIVE]: 'very active (hard exercise 6-7 days/week)',
    [ActivityLevel.EXTREMELY_ACTIVE]: 'extremely active (very hard exercise, physical job or training twice a day)'
  };
  
  const goalText = {
    [NutritionGoal.WEIGHT_LOSS]: 'weight loss',
    [NutritionGoal.MAINTENANCE]: 'weight maintenance',
    [NutritionGoal.WEIGHT_GAIN]: 'weight gain',
    [NutritionGoal.MUSCLE_BUILDING]: 'muscle building'
  };
  const dietText = (profile.dietaryRestrictions && profile.dietaryRestrictions.length)
    ? `\n\nDietary preference: ${profile.dietaryRestrictions.join(', ')}. ${profile.dietaryRestrictions.includes('keto') ? 'Macros adjusted for keto (very low carbs).' : ''}`
    : '';
  
  return `Based on your profile as a ${age}-year-old ${gender} weighing ${weight}kg at ${height}cm tall with a ${activityText[activityLevel]} lifestyle, your Basal Metabolic Rate (BMR) is ${bmr} calories per day. This is the energy your body needs at complete rest.

With your activity level, your Total Daily Energy Expenditure (TDEE) is ${tdee} calories per day. For your goal of ${goalText[goal]}, your daily calorie target is ${goalCalories} calories.${dietText}

For optimal results, aim for:
• ${macroBreakdown.protein.grams}g of protein (${macroBreakdown.protein.percentage}% of calories)
• ${macroBreakdown.carbs.grams}g of carbohydrates (${macroBreakdown.carbs.percentage}% of calories)
• ${macroBreakdown.fat.grams}g of fat (${macroBreakdown.fat.percentage}% of calories)`;
}

/**
 * Calculate complete nutrition profile including BMR, TDEE, goal calories and macro breakdown
 * @param profile User nutrition profile
 * @returns Complete calorie calculation result
 */
export function calculateNutrition(profile: UserNutritionProfile): CalorieCalculatorResult {
  // Calculate BMR
  const bmr = calculateBMR(profile);
  
  // Calculate TDEE
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  
  // Calculate goal calories
  const goalCalories = calculateGoalCalories(tdee, profile.goal);
  
  // Calculate macro breakdown
  const macroBreakdown = calculateMacroBreakdown(goalCalories, profile.goal, profile.dietaryRestrictions);
  
  // Generate explanation
  const result = {
    bmr,
    tdee,
    goalCalories,
    macroBreakdown,
    explanation: ''
  };
  
  result.explanation = generateExplanation(profile, result);
  
  return result;
}