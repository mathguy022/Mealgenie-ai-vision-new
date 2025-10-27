import { useState, useCallback } from 'react';
import { geminiClient, GeminiError } from '../integrations/gemini/gemini-client';
import { FoodAnalysis } from '@/lib/food-analysis-parser';

interface UseGeminiOptions {
  onError?: (error: Error) => void;
}

export function useGemini(options: UseGeminiOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Generate text from a prompt
  const generateText = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await geminiClient.generateText(prompt);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      if (options.onError) {
        options.onError(error);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options.onError]);

  // Process an image with a text prompt
  const processImage = useCallback(async (imageData: File | Blob, prompt: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await geminiClient.processImage(imageData, prompt);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      if (options.onError) {
        options.onError(error);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options.onError]);

  // Analyze a food image and return structured food analysis
  const analyzeFoodImage = useCallback(async (imageData: File | Blob) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await geminiClient.analyzeFoodImage(imageData);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      if (options.onError) {
        options.onError(error);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options.onError]);

  return {
    generateText,
    processImage,
    analyzeFoodImage,
    isLoading,
    error
  };
}