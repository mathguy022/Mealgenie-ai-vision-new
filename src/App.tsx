import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Welcome from "./pages/Welcome";
import HowItWorks from "./pages/HowItWorks";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import FoodAnalyzer from "./pages/FoodAnalyzer";
import FoodPreview from "./pages/FoodPreview";
import FoodScannerLive from "./pages/FoodScannerLive";
import EnhancedFoodAnalyzer from "./pages/EnhancedFoodAnalyzer";
import BarcodeScanner from "./pages/BarcodeScanner";
import SmartFoodScanners from "./pages/SmartFoodScanners";
import BarcodeResult from "./pages/BarcodeResult";
import NotFound from "./pages/NotFound";
import Layout from "@/components/Layout";
import { GeminiTest } from "@/components/GeminiTest";
import NutriGenieBot from "./pages/NutriGenieBot";
import SmartMealGenie from "./pages/SmartMealGenie";
import BMICalculator from "./pages/BMICalculator";
import SmartCaloriesCalculator from "./pages/SmartCaloriesCalculator";
import SmartBodyCalculator from "./pages/SmartBodyCalculator";
import SecurityPrivacy from "./pages/SecurityPrivacy";
import GLP1Companion from "./pages/GLP1Companion";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 rounded-full gradient-primary animate-pulse" />
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/auth" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/security-privacy" element={<SecurityPrivacy />} />
                <Route path="/glp1" element={<ProtectedRoute><GLP1Companion /></ProtectedRoute>} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/scan" element={<ProtectedRoute><FoodAnalyzer /></ProtectedRoute>} />
                <Route path="/food-analyzer" element={<ProtectedRoute><FoodAnalyzer /></ProtectedRoute>} />
                <Route path="/smart-food-scanners" element={<ProtectedRoute><SmartFoodScanners /></ProtectedRoute>} />
                <Route path="/barcode-scanner" element={<Navigate to="/smart-food-scanners?mode=barcode" replace />} />
                <Route path="/barcode-result/:barcode" element={<ProtectedRoute><BarcodeResult /></ProtectedRoute>} />
                <Route path="/food-preview" element={<ProtectedRoute><FoodPreview /></ProtectedRoute>} />
                <Route path="/scan-live" element={<Navigate to="/smart-food-scanners?mode=live" replace />} />
                <Route path="/gemini-test" element={<ProtectedRoute><GeminiTest /></ProtectedRoute>} />
                <Route path="/enhanced-food-analyzer" element={<ProtectedRoute><EnhancedFoodAnalyzer /></ProtectedRoute>} />
                <Route path="/nutrigenie" element={<ProtectedRoute><NutriGenieBot /></ProtectedRoute>} />
                <Route path="/smart-meal-genie" element={<ProtectedRoute><SmartMealGenie /></ProtectedRoute>} />
                <Route path="/smart-body-calculator" element={<ProtectedRoute><SmartBodyCalculator /></ProtectedRoute>} />
                <Route path="/bmi-calculator" element={<Navigate to="/smart-body-calculator" replace />} />
                <Route path="/smart-calories-calculator" element={<Navigate to="/smart-body-calculator" replace />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
