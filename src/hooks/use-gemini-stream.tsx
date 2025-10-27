import { useState, useCallback, useRef, useEffect } from 'react';
import { geminiClient, GeminiError } from '../integrations/gemini/gemini-client';

interface FoodAnalysis {
  items: Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  healthInsights: string[];
}

interface UseGeminiStreamOptions {
  onError?: (error: Error) => void;
  onAnalysisUpdate?: (analysis: FoodAnalysis) => void;
  intervalMs?: number;
}

export function useGeminiStream(options: UseGeminiStreamOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<FoodAnalysis | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Default interval to 3 seconds between analyses
  const intervalMs = options.intervalMs || 3000;

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Parse JSON response from Gemini
  const parseAnalysisResponse = (response: string): FoodAnalysis | null => {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response');
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Ensure the response has the expected structure
      if (!parsed.items || !Array.isArray(parsed.items)) {
        console.error('Invalid response structure');
        return null;
      }

      // Calculate totals if not provided
      type MaybeNutrients = { calories?: number; protein?: number; carbs?: number; fat?: number };
      const totalCalories = parsed.totalCalories || parsed.items.reduce((sum: number, item: MaybeNutrients) => sum + (item.calories || 0), 0);
      const totalProtein = parsed.totalProtein || parsed.items.reduce((sum: number, item: MaybeNutrients) => sum + (item.protein || 0), 0);
      const totalCarbs = parsed.totalCarbs || parsed.items.reduce((sum: number, item: MaybeNutrients) => sum + (item.carbs || 0), 0);
      const totalFat = parsed.totalFat || parsed.items.reduce((sum: number, item: MaybeNutrients) => sum + (item.fat || 0), 0);

      return {
        items: parsed.items,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        healthInsights: parsed.healthInsights || []
      };
    } catch (err) {
      console.error('Error parsing analysis response:', err);
      return null;
    }
  };

  // Capture current frame from video
  const captureFrame = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !canvasRef.current) {
        reject(new Error('Video or canvas reference not available'));
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Make sure video is playing and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0 || video.paused || video.ended) {
        reject(new Error('Video is not ready or playing'));
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      try {
        // Draw the current video frame to the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        }, 'image/jpeg', 0.8);
      } catch (err) {
        console.error('Error capturing frame:', err);
        reject(new Error('Failed to capture frame from video'));
      }
    });
  }, []);

  // Process a single frame
  const processFrame = useCallback(async () => {
    try {
      // Capture current frame
      const imageBlob = await captureFrame();

      // Process with Gemini
      const prompt = `Analyze this food image and provide a JSON response with the following structure: {
        "items": [{"name": "food name", "calories": number, "protein": number, "carbs": number, "fat": number}],
        "totalCalories": number,
        "totalProtein": number,
        "totalCarbs": number,
        "totalFat": number,
        "healthInsights": ["insight 1", "insight 2"]
      }.
      Focus on identifying all food items and estimating their quantities accurately.`;

      const result = await geminiClient.processImage(imageBlob, prompt);

      if (result) {
        const analysis = parseAnalysisResponse(result);
        if (analysis) {
          setCurrentAnalysis(analysis);
          if (options.onAnalysisUpdate) {
            options.onAnalysisUpdate(analysis);
          }
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      if (options.onError) {
        options.onError(error);
      }
    }
  }, [captureFrame, options.onError, options.onAnalysisUpdate]);

  // Start streaming analysis
  const startStreaming = useCallback((videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) => {
    videoRef.current = videoElement;
    canvasRef.current = canvasElement;

    setIsStreaming(true);
    setError(null);

    // Process first frame immediately
    processFrame();

    // Then process frames at regular intervals
    intervalRef.current = setInterval(processFrame, intervalMs);
  }, [processFrame, intervalMs]);

  // Stop streaming analysis
  const stopStreaming = useCallback(() => {
    setIsStreaming(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return {
    isStreaming,
    error,
    currentAnalysis,
    startStreaming,
    stopStreaming,
    videoRef,
    canvasRef
  };
}
