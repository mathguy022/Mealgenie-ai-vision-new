import React from "react";
import { useLocation } from "react-router-dom";
import AppHeader from "./AppHeader";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAuth = location.pathname === "/auth";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isAuth && <AppHeader />}
      {children}
    </div>
  );
};

export default Layout;