export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity?: string;
}

export interface FoodAnalysis {
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  healthInsights: string[];
  timestamp: Date;
}

// Parse JSON response from Gemini with improved error handling
export const parseFoodAnalysisResponse = (response: string): FoodAnalysis | null => {
  try {
    // First try to extract JSON from markdown code blocks
    let jsonString = response;
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1];
    } else {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
    }

    const parsed = JSON.parse(jsonString);

    // Ensure the response has the expected structure
    if (!parsed.items || !Array.isArray(parsed.items)) {
      console.error('Invalid response structure');
      return null;
    }

    // Process items to ensure they have all required fields
    const processedItems = parsed.items.map((item: Partial<FoodItem>) => ({
      name: item.name || 'Unknown food',
      calories: typeof item.calories === 'number' ? item.calories : 0,
      protein: typeof item.protein === 'number' ? item.protein : 0,
      carbs: typeof item.carbs === 'number' ? item.carbs : 0,
      fat: typeof item.fat === 'number' ? item.fat : 0,
      quantity: item.quantity || '1 serving'
    }));

    // Calculate totals if not provided or if they're not numbers
    const totalCalories = typeof parsed.totalCalories === 'number' ? 
      parsed.totalCalories : 
      processedItems.reduce((sum: number, item: FoodItem) => sum + item.calories, 0);
      
    const totalProtein = typeof parsed.totalProtein === 'number' ? 
      parsed.totalProtein : 
      processedItems.reduce((sum: number, item: FoodItem) => sum + item.protein, 0);
      
    const totalCarbs = typeof parsed.totalCarbs === 'number' ? 
      parsed.totalCarbs : 
      processedItems.reduce((sum: number, item: FoodItem) => sum + item.carbs, 0);
      
    const totalFat = typeof parsed.totalFat === 'number' ? 
      parsed.totalFat : 
      processedItems.reduce((sum: number, item: FoodItem) => sum + item.fat, 0);

    return {
      items: processedItems,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      healthInsights: Array.isArray(parsed.healthInsights) ? parsed.healthInsights : [],
      timestamp: new Date()
    };
  } catch (err) {
    console.error('Error parsing analysis response:', err);
    console.error('Response was:', response);
    return null;
  }
};
