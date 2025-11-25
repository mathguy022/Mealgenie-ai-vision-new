export interface UserNutritionProfile { 
  id: string; 
  age: number; 
  gender: 'male' | 'female'; 
  height: number; // cm 
  weight: number; // kg 
  activityLevel: ActivityLevel; 
  goal: NutritionGoal; 
  dietaryRestrictions?: string[]; 
  bmrCalories?: number; 
  tdeeCalories?: number; 
  goalCalories?: number; 
  activityMultiplier?: number; 
  lastBmrCalculation?: Date; 
} 

export enum ActivityLevel { 
  SEDENTARY = 'sedentary', // 1.2 
  LIGHTLY_ACTIVE = 'lightly_active', // 1.375 
  MODERATELY_ACTIVE = 'moderately_active', // 1.55 
  VERY_ACTIVE = 'very_active', // 1.725 
  EXTREMELY_ACTIVE = 'extremely_active' // 1.9 
} 

export enum NutritionGoal { 
  WEIGHT_LOSS = 'weight_loss', // -500 calories 
  MAINTENANCE = 'maintenance', // TDEE 
  WEIGHT_GAIN = 'weight_gain', // +500 calories 
  MUSCLE_BUILDING = 'muscle_building' // +300 calories 
} 

export interface Ingredient { 
  id: string; 
  name: string; 
  nameArabic?: string; 
  barcode?: string; 
  caloriesPer100g: number; 
  proteinPer100g: number; 
  carbsPer100g: number; 
  fatPer100g: number; 
  fiberPer100g: number; 
  sugarPer100g: number; 
  sodiumPer100g: number; 
  category: string; 
  verified: boolean; 
} 

export interface Recipe { 
  id: string; 
  name: string; 
  nameArabic?: string; 
  description?: string; 
  servings: number; 
  prepTimeMinutes?: number; 
  cookTimeMinutes?: number; 
  difficultyLevel: number; 
  cuisineType?: string; 
  dietaryTags: string[]; 
  instructions: unknown; 
  totalCalories: number; 
  totalProtein: number; 
  totalCarbs: number; 
  totalFat: number; 
  ingredients: RecipeIngredient[]; 
  isAiGenerated: boolean; 
} 

export interface RecipeIngredient { 
  id: string; 
  ingredientId: string; 
  ingredient: Ingredient; 
  quantity: number; 
  unit: string; 
  notes?: string; 
} 

export interface ServingSize { 
  id: string; 
  ingredientId: string; 
  servingDescription: string; 
  servingDescriptionArabic?: string; 
  gramsPerServing: number; 
  isDefault: boolean; 
} 

export interface MealLog { 
  id: string; 
  userId: string; 
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'; 
  ingredientId?: string; 
  recipeId?: string; 
  quantity: number; 
  unit: string; 
  calculatedCalories: number; 
  calculatedProtein: number; 
  calculatedCarbs: number; 
  calculatedFat: number; 
  scanConfidence?: number; 
  loggedAt: Date; 
} 

export interface NutritionCalculation { 
  calories: number; 
  protein: number; 
  carbs: number; 
  fat: number; 
  fiber: number; 
  sugar: number; 
  sodium: number; 
} 

export interface CalorieCalculatorResult { 
  bmr: number; 
  tdee: number; 
  goalCalories: number; 
  macroBreakdown: { 
    protein: { grams: number; calories: number; percentage: number }; 
    carbs: { grams: number; calories: number; percentage: number }; 
    fat: { grams: number; calories: number; percentage: number }; 
  }; 
  explanation: string; 
  constraints?: { 
    dietType?: string; 
    minProteinPerMeal?: number; 
    maxCarbsPerMeal?: number; 
  }; 
}
