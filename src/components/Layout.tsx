import React from "react";
import { useLocation } from "react-router-dom";
import AppHeader from "./AppHeader";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  // Hide global AppHeader on pages that provide their own page-specific header
  const hideHeaderRoutes = ["/dashboard"];
  const shouldShowAppHeader = !isHome && !hideHeaderRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {shouldShowAppHeader && <AppHeader />}
      {children}
    </div>
  );
};

export default Layout;