import { useState, useCallback, useRef, useEffect } from 'react';
import { FoodAnalysis as StructuredFoodAnalysis } from '@/lib/food-analysis-parser';
import { openRouterClient, OpenRouterError } from '@/integrations/openrouter/openrouter-client';

interface UseGeminiLiveOptions {
  apiKey: string;
  onError?: (error: Error) => void;
  onAnalysisUpdate?: (analysis: StructuredFoodAnalysis) => void;
  analysisInterval?: number; // in milliseconds
}

export function useGeminiLive(options: UseGeminiLiveOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<StructuredFoodAnalysis | null>(null);
  const [capturedAnalysis, setCapturedAnalysis] = useState<StructuredFoodAnalysis | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // No custom parser here; openRouterClient.analyzeFoodImage returns a structured analysis

  // Convert video frame to blob with improved error handling
  const captureFrame = useCallback(async (): Promise<Blob> => {
    console.log('Capturing frame...');
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
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('Video dimensions not ready:', video.videoWidth, 'x', video.videoHeight);
        reject(new Error('Video is not ready - no dimensions'));
        return;
      }

      // Check if video is actually playing
      if (video.paused || video.ended) {
        console.log('Video is not playing - paused:', video.paused, 'ended:', video.ended);
        reject(new Error('Video is not playing'));
        return;
      }

      console.log('Video ready with dimensions:', video.videoWidth, 'x', video.videoHeight);
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      try {
        // Draw the current video frame to the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        console.log('Frame drawn to canvas');

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            console.log('Canvas converted to blob, size:', blob.size);
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        }, 'image/jpeg', 0.8);
      } catch (err) {
        console.error('Error capturing frame:', err);
        reject(new Error('Failed to capture frame from video: ' + (err instanceof Error ? err.message : 'Unknown error')));
      }
    });
  }, []);

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    console.log('Converting blob to base64, size:', blob.size);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        console.log('Blob read completed');
        // Extract the base64 data part
        const base64Data = result.split(',')[1];
        if (base64Data) {
          console.log('Base64 data extracted, length:', base64Data.length);
          resolve(base64Data);
        } else {
          console.error('Failed to extract base64 data from result:', result);
          reject(new Error('Failed to extract base64 data'));
        }
      };
      reader.onerror = (err) => {
        console.error('Error reading blob:', err);
        reject(err);
      };
      reader.readAsDataURL(blob);
    });
  };

  // Process a single frame with error handling and retry logic via OpenRouter
  const processFrame = useCallback(async (retryCount = 0) => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Capture current frame
      const imageBlob = await captureFrame();
      try {
        const analysis = await openRouterClient.analyzeFoodImage(imageBlob);
        if (analysis) {
          setCurrentAnalysis(analysis);
          if (options.onAnalysisUpdate) {
            options.onAnalysisUpdate(analysis);
          }
        } else if (retryCount < 2) {
          console.log('Retrying analysis, attempt:', retryCount + 1);
          // Retry up to 2 times if parsing fails
          setTimeout(() => processFrame(retryCount + 1), 1000);
        } else {
          // If all retries failed, show a user-friendly error
          throw new Error('Unable to analyze food image. Please try again with a clearer image.');
        }
      } catch (err: unknown) {
        console.error('Error during OpenRouter API call:', err);
        const msg = err instanceof Error ? err.message : 'Request failed';
        if (err instanceof OpenRouterError && /API key|not initialized/i.test(msg)) {
          throw new Error('OpenRouter API key missing. Please provide it to enable live scanning.');
        }
        throw new Error(msg);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred: ' + String(err));
      console.error('Error in processFrame:', error);
      setError(error);
      if (options.onError) {
        options.onError(error);
      }
      // Retry up to 2 times on error
      if (retryCount < 2) {
        console.log('Retrying processFrame, attempt:', retryCount + 1);
        setTimeout(() => processFrame(retryCount + 1), 2000);
      } else {
        console.log('Max retries reached, giving up on this frame');
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [captureFrame, isAnalyzing, options]);

  // Start streaming analysis
  const startStreaming = useCallback((videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) => {
    console.log('Starting streaming...');
    // Ensure OpenRouter API key exists
    if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
      const error = new Error('OpenRouter API key is missing');
      console.error(error.message);
      setError(error);
      return;
    }

    videoRef.current = videoElement;
    canvasRef.current = canvasElement;

    console.log('Setting up streaming...');
    setIsStreaming(true);
    setError(null);

    // Process first frame immediately
    console.log('Scheduling first frame processing...');
    setTimeout(() => {
      processFrame();
    }, 500); // Small delay to ensure video is ready

    // Then process frames at regular intervals
    const interval = options.analysisInterval || 3000; // Default to 3 seconds for better responsiveness
    console.log('Setting up interval for frame processing every', interval, 'ms');
    intervalRef.current = setInterval(processFrame, interval);

    return () => {
      stopStreaming();
    };
  }, [processFrame, options]);

  // Stop streaming analysis
  const stopStreaming = useCallback(() => {
    console.log('Stopping streaming');
    setIsStreaming(false);
    setIsAnalyzing(false);

    if (intervalRef.current) {
      console.log('Clearing analysis interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Capture the current analysis for logging
  const captureAnalysis = useCallback(() => {
    console.log('Capturing analysis');
    if (currentAnalysis) {
      console.log('Analysis captured:', currentAnalysis);
      setCapturedAnalysis({...currentAnalysis});
      return currentAnalysis;
    } else {
      console.log('No analysis to capture');
      return null;
    }
  }, [currentAnalysis]);

  return {
    isStreaming,
    isAnalyzing,
    error,
    currentAnalysis,
    capturedAnalysis,
    startStreaming,
    stopStreaming,
    captureAnalysis,
    videoRef,
    canvasRef
  };
}
