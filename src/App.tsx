import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import FoodAnalyzer from "./pages/FoodAnalyzer";
import FoodPreview from "./pages/FoodPreview";
import FoodScannerLive from "./pages/FoodScannerLive";
import EnhancedFoodAnalyzer from "./pages/EnhancedFoodAnalyzer";
import BarcodeScanner from "./pages/BarcodeScanner";
import BarcodeResult from "./pages/BarcodeResult";
import NotFound from "./pages/NotFound";
import Layout from "@/components/Layout";
import { GeminiTest } from "@/components/GeminiTest";

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
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/scan" element={<ProtectedRoute><FoodAnalyzer /></ProtectedRoute>} />
                <Route path="/food-analyzer" element={<ProtectedRoute><FoodAnalyzer /></ProtectedRoute>} />
                <Route path="/barcode-scanner" element={<ProtectedRoute><BarcodeScanner /></ProtectedRoute>} />
                <Route path="/barcode-result/:barcode" element={<ProtectedRoute><BarcodeResult /></ProtectedRoute>} />
                <Route path="/food-preview" element={<ProtectedRoute><FoodPreview /></ProtectedRoute>} />
                <Route path="/scan-live" element={<ProtectedRoute><FoodScannerLive /></ProtectedRoute>} />
                <Route path="/gemini-test" element={<ProtectedRoute><GeminiTest /></ProtectedRoute>} />
                <Route path="/enhanced-food-analyzer" element={<ProtectedRoute><EnhancedFoodAnalyzer /></ProtectedRoute>} />
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
