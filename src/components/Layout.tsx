import React from "react";
import { useLocation } from "react-router-dom";
import AppHeader from "./AppHeader";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isHome && <AppHeader />}
      {children}
    </div>
  );
};

export default Layout;