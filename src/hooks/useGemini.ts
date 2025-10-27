import { useState } from 'react';

interface UseGeminiOptions {
  onError?: (error: Error) => void;
}

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
}

interface FoodAnalysis {
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  healthInsights: string[];
}

export function useGemini(options?: UseGeminiOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Mock function to process image with text prompt
  const processImage = async (imageBlob: Blob, prompt: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the Gemini API
      // For now, we'll simulate a delay and return mock data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return `
Food Items Detected:
- Grilled Chicken Breast (4oz)
- Brown Rice (1 cup)
- Steamed Broccoli (1 cup)

Estimated Calories: 450

Macronutrients:
- Protein: 35g
- Carbs: 45g
- Fat: 10g

Health Insights:
- This is a balanced meal with good protein content
- The meal is rich in fiber from brown rice and broccoli
- Consider adding healthy fats like avocado or olive oil
- This meal supports muscle recovery and provides sustained energy
      `;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Mock function to analyze food image with structured output
  const analyzeFoodImage = async (imageBlob: Blob): Promise<FoodAnalysis> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the Gemini API
      // For now, we'll simulate a delay and return mock data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockAnalysis: FoodAnalysis = {
        items: [
          {
            name: 'Grilled Chicken Breast',
            calories: 165,
            protein: 31,
            carbs: 0,
            fat: 3.6,
            portion: '4oz (113g)'
          },
          {
            name: 'Brown Rice',
            calories: 216,
            protein: 5,
            carbs: 45,
            fat: 1.8,
            portion: '1 cup cooked (195g)'
          },
          {
            name: 'Steamed Broccoli',
            calories: 55,
            protein: 3.7,
            carbs: 11.2,
            fat: 0.6,
            portion: '1 cup (156g)'
          }
        ],
        totalCalories: 436,
        totalProtein: 39.7,
        totalCarbs: 56.2,
        totalFat: 6,
        healthInsights: [
          'This is a balanced meal with good protein content',
          'The meal is rich in fiber from brown rice and broccoli',
          'Consider adding healthy fats like avocado or olive oil',
          'This meal supports muscle recovery and provides sustained energy'
        ]
      };
      
      return mockAnalysis;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    processImage,
    analyzeFoodImage,
    isLoading,
    error
  };
}