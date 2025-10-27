import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useGemini } from '@/hooks/useGemini';
import { FoodAnalysisDisplay } from '@/components/FoodAnalysisDisplay';
import type { FoodAnalysis } from '@/lib/food-analysis-parser';

const FoodPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scanning, setScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysis | string | null>(null);
  
  // Get the captured image data from location state
  const { imageDataUrl, imageBlob } = location.state || {};
  
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

  const handleAnalyze = async () => {
    if (!imageBlob) {
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
      const result = await analyzeFoodImage(imageBlob);
      
      if (result) {
        setAnalysisResult(result);
        toast({
          title: 'Food Analyzed Successfully',
          description: 'Your meal has been analyzed by AI',
        });
      } else {
        // Fallback to text-based analysis if structured analysis fails
        const prompt = "Analyze this food image and provide: 1) What food items are present, 2) Estimated calories, 3) Macronutrients breakdown (protein, carbs, fat), 4) Any health insights or suggestions.";
        const textResult = await processImage(imageBlob, prompt);
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

  // If no image data is available, redirect back to the analyzer page
  if (!imageDataUrl) {
    navigate('/food-analyzer');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/food-analyzer')}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-bold">Food Preview</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Preview Card */}
          {!analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle>Ready to Analyze</CardTitle>
                <CardDescription>Review your food image and analyze when ready</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <img
                    src={imageDataUrl}
                    alt="Captured food"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Scanning Overlay */}
                  {scanning && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 rounded-full gradient-primary mx-auto animate-pulse" />
                        <p className="text-white font-medium">Analyzing food with Gemini AI...</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-center text-muted-foreground">
                    Ready to analyze your food
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate('/food-analyzer')}
                    disabled={scanning}
                  >
                    Retake Photo
                  </Button>
                  
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
                  <FoodAnalysisDisplay analysis={analysisResult} />
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
                      navigate('/food-analyzer');
                    }}
                  >
                    Analyze Another
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

export default FoodPreview;