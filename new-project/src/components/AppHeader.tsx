import React from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";

const AppHeader: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">MealGenie AI</h1>
              <p className="text-sm text-muted-foreground">Transform your life with AI</p>
            </div>
          </div>
          <div>
            <Button variant="outline" onClick={signOut}>Sign Out</Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;