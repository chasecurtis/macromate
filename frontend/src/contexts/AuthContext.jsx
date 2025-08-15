import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI, tokenManager } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = tokenManager.getToken();
      if (token) {
        try {
          const response = await authAPI.getUserInfo();
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, remove it
          tokenManager.removeToken();
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Allow the user to sign up
  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      const { token, account } = response.data;

      tokenManager.setToken(token);
      const userInfo = await authAPI.getUserInfo();
      setUser(userInfo.data);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || "Signup failed",
      };
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, account } = response.data;

      tokenManager.setToken(token);
      const userInfo = await authAPI.getUserInfo();
      setUser(userInfo.data);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || "Login failed",
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Even if logout fails on backend, clear frontend state
      console.error("Logout error:", error);
    } finally {
      tokenManager.removeToken();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
