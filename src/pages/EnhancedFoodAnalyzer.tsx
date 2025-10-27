import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, ArrowLeft, Sparkles, Check, Square, Circle, Upload, Calculator } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useGemini } from '@/hooks/use-gemini';
import { useCalorieCalculator } from '@/hooks/use-calorie-calculator';
import { useAuth } from '@/contexts/AuthContext';
import foodScanDemo from '@/assets/food-scan-demo.jpg';
import { FoodAnalysisDisplay } from '@/components/FoodAnalysisDisplay';
import type { FoodAnalysis } from '@/lib/food-analysis-parser';
import { FoodLogEntry } from '@/components/FoodLogEntry';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalorieCalculator } from '@/components/CalorieCalculator';

const EnhancedFoodAnalyzer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const capturedImageBlobRef = useRef<Blob | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysis | string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('scanner');
  
  // Initialize Gemini API hook
  const { processImage, analyzeFoodImage, isLoading, error } = useGemini({
    onError: (err) => {
      toast({
        title: 'Analysis Error',
        description: err.message || 'Failed to analyze food image',
        variant: 'destructive',
      });
    }
  });

  // Initialize calorie calculator hook
  const { profile, calculationResult } = useCalorieCalculator(user?.id);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
        setStream(mediaStream);
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast({
        title: 'Camera access denied',
        description: 'Please allow camera access to analyze food.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
    setScanning(false);
  };

  const captureImage = async (): Promise<{blob: Blob, dataUrl: string}> => {
    if (!videoRef.current || !canvasRef.current) {
      throw new Error('Video or canvas reference not available');
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas context not available');
    }
    
    // Make sure video is playing and has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      throw new Error('Video dimensions not available');
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      try {
        // Get data URL for preview
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({blob, dataUrl});
          } else {
            reject(new Error('Failed to create image blob'));
          }
        }, 'image/jpeg', 0.8);
      } catch (err) {
        console.error('Error capturing image:', err);
        reject(new Error('Failed to capture image from video'));
      }
    });
  };

  const handleCapture = async () => {
    setScanning(true);
    
    try {
      // Capture image from camera
      const {blob, dataUrl} = await captureImage();
      
      // Store the captured image
      setCapturedImage(dataUrl);
      
      // Store the blob in a ref for later analysis
      capturedImageBlobRef.current = blob;
      
      toast({
        title: 'Photo Captured',
        description: 'Ready to analyze your food',
      });
    } catch (err) {
      console.error('Error capturing image:', err);
      toast({
        title: 'Capture Failed',
        description: err instanceof Error ? err.message : 'Failed to capture image',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  const handleAnalyze = async () => {
    if (!capturedImageBlobRef.current) {
      toast({
        title: 'No Image Available',
        description: 'Please capture or upload an image first',
        variant: 'destructive',
      });
      return;
    }
    
    setScanning(true);
    setAnalysisResult(null);
    
    try {
      // Analyze food image with structured analysis
      const result = await analyzeFoodImage(capturedImageBlobRef.current);
      
      if (result) {
        setAnalysisResult(result);
        toast({
          title: 'Food Analyzed Successfully',
          description: 'Your meal has been analyzed by AI',
        });
      } else {
        // Fallback to text-based analysis if structured analysis fails
        const prompt = "Analyze this food image and provide: 1) What food items are present, 2) Estimated calories, 3) Macronutrients breakdown (protein, carbs, fat), 4) Any health insights or suggestions.";
        const textResult = await processImage(capturedImageBlobRef.current, prompt);
        if (textResult) {
          setAnalysisResult(textResult);
          toast({
            title: 'Food Analyzed Successfully',
            description: 'Your meal has been analyzed by AI',
          });
        }
      }
    } catch (err) {
      console.error('Error during food analysis:', err);
      toast({
        title: 'Analysis Failed',
        description: err instanceof Error ? err.message : 'Failed to analyze food image',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    setScanning(true);
    
    try {
      // Create a blob from the file
      const blob = file;
      
      // Create a data URL for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCapturedImage(e.target.result as string);
          capturedImageBlobRef.current = blob;
        }
      };
      reader.readAsDataURL(file);
      
      toast({
        title: 'Image Uploaded',
        description: 'Ready to analyze your food',
      });
    } catch (err) {
      console.error('Error uploading file:', err);
      toast({
        title: 'Upload Failed',
        description: 'Failed to process the uploaded image',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    capturedImageBlobRef.current = null;
    setAnalysisResult(null);
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Extract food name and nutrition info from analysis result
  const extractFoodInfo = () => {
    if (!analysisResult) return null;
    
    try {
      // Try to extract structured data
      if (analysisResult.foodItems && analysisResult.foodItems.length > 0) {
        const mainFood = analysisResult.foodItems[0];
        return {
          foodName: mainFood.name || 'Unknown Food',
          calories: mainFood.calories || 0,
          protein: mainFood.protein?.value || 0,
          carbs: mainFood.carbs?.value || 0,
          fat: mainFood.fat?.value || 0,
          confidence: mainFood.confidence || 0.7
        };
      }
      
      // Fallback to parsing text result
      if (typeof analysisResult === 'string') {
        // Simple regex-based extraction (this is a basic implementation)
        const caloriesMatch = analysisResult.match(/calories?:?\s*(\d+)/i);
        const proteinMatch = analysisResult.match(/protein:?\s*(\d+)/i);
        const carbsMatch = analysisResult.match(/carbs?:?\s*(\d+)/i);
        const fatMatch = analysisResult.match(/fat:?\s*(\d+)/i);
        
        // Try to extract food name from first line or sentence
        const firstLine = analysisResult.split('\n')[0];
        const foodName = firstLine.split(':').pop()?.trim() || 'Analyzed Food';
        
        return {
          foodName,
          calories: caloriesMatch ? parseInt(caloriesMatch[1]) : 0,
          protein: proteinMatch ? parseInt(proteinMatch[1]) : 0,
          carbs: carbsMatch ? parseInt(carbsMatch[1]) : 0,
          fat: fatMatch ? parseInt(fatMatch[1]) : 0,
          confidence: 0.5 // Lower confidence for text-based extraction
        };
      }
    } catch (err) {
      console.error('Error extracting food info:', err);
    }
    
    return null;
  };

  const foodInfo = extractFoodInfo();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">AI Food Analyzer</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scanner">
            <Camera className="mr-2 h-4 w-4" />
            Food Scanner
          </TabsTrigger>
          <TabsTrigger value="calculator">
            <Calculator className="mr-2 h-4 w-4" />
            Calorie Calculator
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="scanner" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              {!capturedImage ? (
                <div className="space-y-4">
                  {cameraActive ? (
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                        muted
                      />
                    </div>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
                      <img
                        src={foodScanDemo}
                        alt="Food scan demo"
                        className="w-full h-full object-cover opacity-50"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-center text-muted-foreground">
                          Start camera or upload an image to analyze food
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    {cameraActive ? (
                      <>
                        <Button
                          onClick={handleCapture}
                          disabled={scanning}
                          className="flex-1"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Capture
                        </Button>
                        <Button
                          onClick={stopCamera}
                          variant="outline"
                          className="flex-1"
                        >
                          Stop Camera
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={startCamera}
                          className="flex-1"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Start Camera
                        </Button>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          className="flex-1"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                    <img
                      src={capturedImage}
                      alt="Captured food"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    {!analysisResult ? (
                      <>
                        <Button
                          onClick={handleAnalyze}
                          disabled={isLoading || scanning}
                          className="flex-1"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          {isLoading || scanning ? 'Analyzing...' : 'Analyze Food'}
                        </Button>
                        <Button
                          onClick={handleReset}
                          variant="outline"
                          className="flex-1"
                        >
                          Reset
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="w-full"
                      >
                        Analyze Another Image
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Hidden canvas for image capture */}
              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>
          
          {analysisResult && (
            <>
              <FoodAnalysisDisplay result={analysisResult} />
              
              {foodInfo && user && (
                <FoodLogEntry
                  foodName={foodInfo.foodName}
                  calories={foodInfo.calories}
                  protein={foodInfo.protein}
                  carbs={foodInfo.carbs}
                  fat={foodInfo.fat}
                  confidence={foodInfo.confidence}
                  onSuccess={() => {
                    toast({
                      title: 'Added to your daily log',
                      description: 'You can view your nutrition dashboard to see your progress',
                    });
                  }}
                />
              )}
              
              {!user && (
                <Card className="mt-4">
                  <CardContent className="p-6">
                    <p className="text-center text-muted-foreground">
                      Sign in to track your calories and nutrition
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="calculator">
          <CalorieCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedFoodAnalyzer;