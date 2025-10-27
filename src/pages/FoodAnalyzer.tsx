import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Camera, Circle, Square, Sparkles, Upload, Calculator, Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import foodScanDemo from '@/assets/food-scan-demo.jpg';
import { useGemini } from '@/hooks/use-gemini';
import { useCalorieCalculator } from '@/hooks/use-calorie-calculator';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FoodAnalysisDisplay } from '@/components/FoodAnalysisDisplay';
import type { FoodAnalysis } from '@/lib/food-analysis-parser';
import { CalorieCalculator } from '@/components/CalorieCalculator';
import { FoodLogEntry } from '@/components/FoodLogEntry';

const FoodAnalyzer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysis | string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Get tab from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(tabParam === 'calculator' ? 'calculator' : 'scanner');
  const capturedImageBlobRef = useRef<Blob | null>(null);
  
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
          
          // Set camera active to show the UI with the image
          setCameraActive(true);
          
          toast({
            title: 'Photo Uploaded',
            description: 'Ready to analyze your food',
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error during file upload:', err);
      toast({
        title: 'Upload Failed',
        description: err instanceof Error ? err.message : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Effect to clean up camera resources when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
  // Initialize calorie calculator hook
  const { calculateCalories } = useCalorieCalculator();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Hidden file input for image upload */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileUpload} 
      />
      
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-bold">Food Analyzer</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scanner" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Food Scanner
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Calorie Calculator
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="scanner" className="space-y-6">
          {/* Instructions Card */}
          {!cameraActive && !analysisResult && (
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>AI Food Recognition</CardTitle>
                    <CardDescription>Analyze any meal with AI</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <img 
                  src={foodScanDemo} 
                  alt="Food analysis demo" 
                  className="w-full rounded-lg"
                />
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm">Automatically identifies foods and estimates portions</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm">Calculates calories and macronutrients instantly</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm">Provides smart suggestions before you eat</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    className="flex-1 gradient-primary text-white"
                    size="lg"
                    onClick={startCamera}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Take a Photo
                  </Button>
                  
                  <Button 
                    className="flex-1"
                    size="lg"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Photo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Camera View */}
          {cameraActive && !analysisResult && (
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  {!capturedImage ? (
                    <video
                      ref={videoRef}
                      autoPlay={true}
                      playsInline={true}
                      muted={true}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={capturedImage}
                      alt="Captured food"
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Scanning Overlay */}
                  {scanning && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 rounded-full gradient-primary mx-auto animate-pulse" />
                        <p className="text-white font-medium">Analyzing food with Gemini AI...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Scanning Frame */}
                  {!capturedImage && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-64 border-2 border-primary rounded-2xl" />
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-center text-muted-foreground">
                      {capturedImage ? "Ready to analyze your food" : "Position your food within the frame for best results"}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={stopCamera}
                      disabled={scanning}
                    >
                      Cancel
                    </Button>
                    
                    {capturedImage ? (
                      <>
                        <Button
                          className="flex-1 gradient-primary text-white"
                          onClick={handleAnalyze}
                          disabled={scanning || isLoading}
                        >
                          {scanning || isLoading ? (
                            <>Analyzing...</>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Analyze Food
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCapturedImage(null);
                            capturedImageBlobRef.current = null;
                          }}
                        >
                          Retake
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          className="flex-1 gradient-primary text-white"
                          onClick={handleCapture}
                          disabled={scanning || isLoading}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Take Photo
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={scanning || isLoading}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle>Food Analysis Results</CardTitle>
                <CardDescription>Powered by Google Gemini 2.5 Pro Vision</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Check if analysisResult is a structured FoodAnalysis object or plain text */}
                {'items' in analysisResult ? (
                  <>
                    <FoodAnalysisDisplay analysis={analysisResult} />
                    {capturedImage && (
                      <FoodLogEntry 
                        foodName={analysisResult.items?.[0]?.name || "Unknown Food"}
                        calories={analysisResult.totalCalories}
                        protein={analysisResult.totalProtein}
                        carbs={analysisResult.totalCarbs}
                        fat={analysisResult.totalFat}
                        imageUrl={capturedImage}
                        userId={user?.id}
                      />
                    )}
                  </>
                ) : (
                  <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-wrap">
                    {analysisResult}
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setAnalysisResult(null);
                      navigate('/dashboard');
                    }}
                  >
                    Save & Close
                  </Button>
                  <Button
                    className="flex-1 gradient-primary text-white"
                    onClick={() => {
                      setAnalysisResult(null);
                      if (cameraActive) {
                        startCamera();
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    Analyze Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          </TabsContent>
          
          <TabsContent value="calculator" className="space-y-6">
            <CalorieCalculator />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FoodAnalyzer;
