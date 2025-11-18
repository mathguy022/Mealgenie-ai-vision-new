import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-3" onClick={() => navigate("/")}> 
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">MealGenie AI</h1>
              <p className="text-sm text-muted-foreground">Transform your life with AI</p>
            </div>
          </button>
          <div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
