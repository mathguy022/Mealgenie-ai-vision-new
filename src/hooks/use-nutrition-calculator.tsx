import { useState, useEffect } from 'react'; 
import { UserNutritionProfile, Ingredient, NutritionCalculation, CalorieCalculatorResult } from '../types/nutrition'; 
import { calculateNutrition, calculateNutritionFromIngredients, convertToGrams } from '../lib/nutrition-calculator'; 

export const useNutritionCalculator = (userProfile: UserNutritionProfile) => { 
  const [dailyTarget, setDailyTarget] = useState<CalorieCalculatorResult | null>(null); 
  const [isCalculating, setIsCalculating] = useState(false); 

  // Calculate user's daily targets on mount or profile change 
  useEffect(() => { 
    if (userProfile) { 
      const targets = calculateNutrition(userProfile); 
      setDailyTarget(targets); 
    } 
  }, [userProfile]); 

  /** 
   * Calculate nutrition for scanned food item 
   */ 
  const calculateScannedFoodNutrition = async ( 
    ingredient: Ingredient, 
    quantity: number, 
    unit: string 
  ): Promise<NutritionCalculation & { portionAnalysis: string }> => { 
    setIsCalculating(true); 
    
    try { 
      const nutrition = calculateNutritionFromIngredients([{ ingredient, quantity, unit }]); 
      const gramsAmount = convertToGrams(quantity, unit, ingredient); 
      
      const portionAnalysis = generatePortionAnalysis(nutrition, dailyTarget, gramsAmount); 
      
      return { 
        ...nutrition, 
        portionAnalysis 
      }; 
    } finally { 
      setIsCalculating(false); 
    } 
  }; 

  /** 
   * Calculate nutrition for recipe 
   */ 
  const calculateRecipeNutrition = ( 
    ingredients: Array<{ ingredient: Ingredient; quantity: number; unit: string }>, 
    servings: number = 1 
  ): NutritionCalculation => { 
    const totalNutrition = calculateNutritionFromIngredients(ingredients); 
    
    // Calculate per serving 
    return { 
      calories: Math.round(totalNutrition.calories / servings), 
      protein: Math.round((totalNutrition.protein / servings) * 10) / 10, 
      carbs: Math.round((totalNutrition.carbs / servings) * 10) / 10, 
      fat: Math.round((totalNutrition.fat / servings) * 10) / 10, 
      fiber: Math.round((totalNutrition.fiber / servings) * 10) / 10, 
      sugar: Math.round((totalNutrition.sugar / servings) * 10) / 10, 
      sodium: Math.round(totalNutrition.sodium / servings) 
    }; 
  }; 

  /** 
   * Generate behavioral nudge based on scan 
   */ 
  const generateBehavioralNudge = ( 
    scannedNutrition: NutritionCalculation, 
    currentDailyIntake: NutritionCalculation 
  ): string => { 
    if (!dailyTarget) return ''; 

    const remainingCalories = dailyTarget.goalCalories - currentDailyIntake.calories; 
    const plannedCalories = scannedNutrition.calories; 

    if (plannedCalories > remainingCalories * 1.5) { 
      return `⚠️ This meal has ${plannedCalories} calories. You have ${remainingCalories} remaining for today. Consider a smaller portion?`; 
    } 

    if (scannedNutrition.protein < 10 && remainingCalories > 200) { 
      return `💪 Add some protein! Try Greek yogurt or nuts to reach your daily target.`; 
    } 

    if (remainingCalories < 300 && plannedCalories < remainingCalories) { 
      return `✅ Perfect choice! This fits well within your remaining ${remainingCalories} calories.`; 
    } 

    return `📊 This meal provides ${plannedCalories} calories. ${remainingCalories} remaining today.`; 
  }; 

  return { 
    dailyTarget, 
    isCalculating, 
    calculateScannedFoodNutrition, 
    calculateRecipeNutrition, 
    generateBehavioralNudge 
  }; 
}; 

/** 
 * Generate portion analysis text 
 */ 
const generatePortionAnalysis = ( 
  nutrition: NutritionCalculation, 
  dailyTarget: CalorieCalculatorResult | null, 
  gramsAmount: number 
): string => { 
  if (!dailyTarget) return ''; 

  const caloriePercentage = Math.round((nutrition.calories / dailyTarget.goalCalories) * 100); 
  
  let analysis = `${gramsAmount}g portion contains ${nutrition.calories} calories (${caloriePercentage}% of daily goal). `; 
  
  if (caloriePercentage > 40) { 
    analysis += "This is a large portion for one meal."; 
  } else if (caloriePercentage > 25) { 
    analysis += "This is a substantial meal portion."; 
  } else { 
    analysis += "This is a moderate portion size."; 
  } 

  return analysis; 
};