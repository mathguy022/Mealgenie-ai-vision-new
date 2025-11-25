import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, ArrowLeft, Sparkles, Check, Square, Circle, X, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGeminiLive } from '@/hooks/use-gemini-live';
import { FoodAnalysisDisplay } from '@/components/FoodAnalysisDisplay';
import type { FoodAnalysis } from '@/lib/food-analysis-parser';
import foodScanDemo from '@/assets/food-scan-demo.jpg';

const FoodScannerLive = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [finalAnalysis, setFinalAnalysis] = useState<FoodAnalysis | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  // Get the Gemini API key from environment variables
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Initialize Gemini Live hook
  const { 
    isStreaming, 
    isAnalyzing,
    error, 
    currentAnalysis, 
    capturedAnalysis,
    startStreaming, 
    stopStreaming,
    captureAnalysis
  } = useGeminiLive({
    apiKey: geminiApiKey,
    onError: (err) => {
      console.error('Gemini analysis error:', err);
      if (/Video is not playing|Video is not ready/i.test(err.message || '')) {
        if (cameraActive) stopCamera();
        return; // suppress repeated toasts when camera is stopped
      }
      toast({
        title: 'Analysis Error',
        description: err.message || 'Failed to analyze food. Please try again.',
        variant: 'destructive',
      });
    },
    onAnalysisUpdate: (analysis) => {
      console.log('New analysis available:', analysis);
    },
    analysisInterval: 3000 // Analyze every 3 seconds for better responsiveness
  });

  // Log any errors from the hook
  useEffect(() => {
    if (error) {
      console.error('Live scanner error:', error);
    }
  }, [error]);

  // Clean up on unmount
  useEffect(() => {
    console.log('FoodScannerLive component mounted');
    return () => {
      console.log('FoodScannerLive component unmounting');
      if (stream) {
        console.log('Stopping video stream tracks');
        stream.getTracks().forEach(track => {
          console.log('Stopping track:', track.kind);
          track.stop();
        });
      }
      console.log('Stopping streaming');
      stopStreaming();
    };
  }, [stream, stopStreaming]);

  const startCamera = async (facingMode: 'environment' | 'user' = 'environment') => {
    console.log('Starting camera with facingMode:', facingMode);
    try {
      setCameraError(null);
      
      // Stop any existing stream
      if (stream) {
        console.log('Stopping existing stream');
        stream.getTracks().forEach(track => track.stop());
      }
      
      console.log('Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });
      console.log('Camera access granted, stream tracks:', mediaStream.getTracks().length);

      if (videoRef.current) {
        console.log('Setting video srcObject');
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          if (videoRef.current) {
            console.log('Playing video');
            videoRef.current.play().catch(err => {
              console.error('Error playing video:', err);
              setCameraError('Failed to start camera. Please try again.');
            });
          }
        };

        const onVideoStop = () => {
          console.log('Video paused or ended, stopping streaming');
          stopStreaming();
          setCameraActive(false);
          setCameraError('Video is not playing');
          // Do not show a toast if we already captured results
          if (!finalAnalysis) {
            toast({ title: 'Analysis Error', description: 'Video is not playing', variant: 'destructive' });
          }
        };
        videoRef.current.addEventListener('pause', onVideoStop);
        videoRef.current.addEventListener('ended', onVideoStop);
      }

      setStream(mediaStream);
      setCameraActive(true);
      setCameraError(null);
      console.log('Camera started successfully');
      
      // Start Gemini streaming after video is ready
      const startStreamingWhenReady = () => {
        console.log('Checking if video is ready for streaming');
        if (videoRef.current && canvasRef.current) {
          // Check if video is actually playing and has dimensions
          if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
            console.log('Video is ready, starting streaming');
            startStreaming(videoRef.current, canvasRef.current);
          } else {
            console.log('Video not ready yet, retrying in 500ms');
            // Retry after a short delay
            setTimeout(startStreamingWhenReady, 500);
          }
        }
      };
      
      // Start streaming after a small delay to ensure video is ready
      console.log('Scheduling streaming start in 800ms');
      setTimeout(startStreamingWhenReady, 800);
    } catch (error: unknown) {
      console.error('Camera error:', error);
      const message = error instanceof Error ? error.message : 'Failed to access camera. Please check permissions.';
      setCameraError(message);
      toast({
        title: 'Camera Error',
        description: message || 'Please allow camera access to scan food.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!cameraActive) {
      // Ensure streaming stops if camera becomes inactive
      stopStreaming();
    }
  }, [cameraActive, stopStreaming]);

  const switchCamera = async () => {
    console.log('Switching camera');
    if (isSwitchingCamera) {
      console.log('Already switching camera, ignoring request');
      return;
    }
    
    setIsSwitchingCamera(true);
    const currentFacingMode = stream?.getVideoTracks()[0]?.getSettings()?.facingMode;
    console.log('Current facing mode:', currentFacingMode);
    const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    console.log('New facing mode:', newFacingMode);
    
    try {
      // Stop current stream
      if (stream) {
        console.log('Stopping current stream for camera switch');
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Start new stream with opposite facing mode
      console.log('Starting new camera with facing mode:', newFacingMode);
      await startCamera(newFacingMode as 'environment' | 'user');
    } catch (error) {
      console.error('Error switching camera:', error);
      toast({
        title: 'Camera Switch Error',
        description: 'Failed to switch camera. Please try again.',
        variant: 'destructive',
      });
    } finally {
      console.log('Camera switch completed');
      setIsSwitchingCamera(false);
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera');
    if (stream) {
      console.log('Stopping stream tracks');
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      setStream(null);
    }
    setCameraActive(false);
    console.log('Stopping streaming');
    stopStreaming();
  };

  const handleCaptureAnalysis = () => {
    console.log('Handling capture analysis');
    const analysis = captureAnalysis();
    console.log('Captured analysis:', analysis);
    if (analysis) {
      setFinalAnalysis(analysis);
      stopCamera();
      toast({
        title: 'Analysis Captured',
        description: 'Your meal analysis has been saved',
      });
    } else {
      toast({
        title: 'No Analysis Available',
        description: 'Please wait for food analysis to complete',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (finalAnalysis) {
      stopCamera();
    }
  }, [finalAnalysis]);

  const handleSaveAndClose = () => {
    // In a real app, this would save the analysis to a database
    // For now, we'll just navigate back to the dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-bold">Live Food Scanner</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Instructions Card */}
          {!cameraActive && !finalAnalysis && (
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>AI Live Food Recognition</CardTitle>
                    <CardDescription>Point your camera at any meal for real-time analysis</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <img
                  src={foodScanDemo}
                  alt="Food scanning demo"
                  className="w-full rounded-lg"
                />

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm">Real-time food identification and portion estimation</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm">Live calorie and macronutrient calculations</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm">Instant health insights and suggestions</p>
                  </div>
                </div>

                {cameraError && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
                    <p className="text-sm">{cameraError}</p>
                  </div>
                )}

                <Button
                  className="w-full gradient-primary text-white"
                  size="lg"
                  onClick={() => startCamera()}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Start Live Camera
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Camera View with Real-time Analysis */}
          {cameraActive && !finalAnalysis && (
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Analysis Overlay */}
                  {currentAnalysis && (
                    <div className="absolute top-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">Live Analysis</h3>
                        <div className="flex items-center gap-1">
                          <Circle className={`w-3 h-3 ${isAnalyzing ? 'text-yellow-400' : 'text-green-400'} fill-current`} />
                          <span className="text-xs">{isAnalyzing ? 'Analyzing...' : 'Ready'}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Calories:</span>
                          <span className="font-medium">{Math.round(currentAnalysis.totalCalories)} kcal</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="text-gray-300">Protein</div>
                            <div className="font-medium">{Math.round(currentAnalysis.totalProtein)}g</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-300">Carbs</div>
                            <div className="font-medium">{Math.round(currentAnalysis.totalCarbs)}g</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-300">Fat</div>
                            <div className="font-medium">{Math.round(currentAnalysis.totalFat)}g</div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/20">
                          <div className="text-xs text-gray-300 mb-1">Detected Items:</div>
                          <div className="flex flex-wrap gap-1">
                            {currentAnalysis.items.map((item, index) => (
                              <span key={index} className="text-xs bg-white/20 rounded px-2 py-1">
                                {item.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scanning Indicator */}
                  {isAnalyzing && (
                    <div className="absolute bottom-4 right-4 bg-yellow-500 text-black rounded-full p-2 animate-pulse">
                      <div className="w-6 h-6 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    </div>
                  )}

                  {/* Camera Controls */}
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={switchCamera}
                      disabled={isSwitchingCamera}
                      className="bg-black/50 hover:bg-black/70"
                    >
                      <RotateCcw className="w-5 h-5 text-white" />
                    </Button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-center text-muted-foreground">
                      {isAnalyzing 
                        ? "Analyzing food items..." 
                        : currentAnalysis 
                          ? "Point your camera at food items for updated analysis" 
                          : "Point your camera at food items for real-time analysis"}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={stopCamera}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 gradient-primary text-white"
                      onClick={handleCaptureAnalysis}
                      disabled={!currentAnalysis}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Capture Analysis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Final Analysis Results */}
          {finalAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Meal Analysis Results</CardTitle>
                <CardDescription>Captured at {new Date(finalAnalysis.timestamp).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FoodAnalysisDisplay analysis={finalAnalysis} />
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setFinalAnalysis(null);
                      startCamera();
                    }}
                  >
                    Scan Again
                  </Button>
                  <Button
                    className="flex-1 gradient-primary text-white"
                    onClick={handleSaveAndClose}
                  >
                    Save & Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default FoodScannerLive;
