"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const AuthContext = createContext<any>({} as any);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: any) => {
  const [isAuthenticated, setIsAuthenticated] = useState<any>(false);
  const navigate = useRouter();

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (token) {
      setIsAuthenticated(true);
      navigate.push("/dashboard"); 
    } else {
      setIsAuthenticated(false);
      navigate.push("/signin"); 
    }
  }, [navigate]);

  const login = () => {
    setIsAuthenticated(true);
    navigate.push("/dashboard");
  };

  const logout = () => {
    setIsAuthenticated(false);
    Cookies.remove("accessToken"); 
    navigate.push("/signin"); 
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
