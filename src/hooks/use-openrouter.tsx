import { useState, useCallback } from 'react';
import { openRouterClient, OpenRouterError } from '../integrations/openrouter/openrouter-client';
import type { FoodAnalysis } from '@/lib/food-analysis-parser';

interface UseOpenRouterOptions {
  onError?: (error: Error) => void;
}

export function useOpenRouter(options: UseOpenRouterOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Generate text from a prompt
  const generateText = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await openRouterClient.generateText(prompt);
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
      const result = await openRouterClient.processImage(imageData, prompt);
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

  const analyzeFoodImage = useCallback(async (imageData: File | Blob): Promise<FoodAnalysis | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await openRouterClient.analyzeFoodImage(imageData);
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