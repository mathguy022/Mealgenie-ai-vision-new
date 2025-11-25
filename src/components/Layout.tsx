import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import AppHeader from "./AppHeader";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  // Hide global AppHeader on pages that provide their own page-specific header
  const hideHeaderRoutes = ["/dashboard"];
  const shouldShowAppHeader = !isHome && !hideHeaderRoutes.includes(location.pathname);
  const showBackButton = !["/dashboard", "/", "/auth"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {shouldShowAppHeader && <AppHeader />}
      {showBackButton && (
        <div className="fixed top-4 right-4 z-50">
          <Button className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      )}
      {children}
    </div>
  );
};

export default Layout;
