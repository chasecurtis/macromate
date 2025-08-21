import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "./RouteGuards";
import { useAuth } from "../contexts/AuthContext";

// Import components
import Signup from "../components/Signup";
import Login from "../components/Login";
import Dashboard from "../components/Dashboard";
import Homepage from "../components/Homepage";
import MacroSetup from "../components/MacroSetup";
import MealPlanSetup from "../components/MealPlanSetup";
import RecipeSelection from "../components/RecipeSelection";
import ShoppingList from "../components/ShoppingList";
import MyMeals from "../components/MyMeals";

// Smart Homepage Component - shows different content based on auth
const SmartHomepage = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return isAuthenticated ? <Navigate to="/dashboard" /> : <Homepage />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/macro-setup"
        element={
          <ProtectedRoute>
            <MacroSetup />
          </ProtectedRoute>
        }
      />

      <Route
        path="/meal-plan"
        element={
          <ProtectedRoute>
            <MealPlanSetup />
          </ProtectedRoute>
        }
      />

      <Route
        path="/recipes/:recipeId"
        element={
          <ProtectedRoute>
            <RecipeSelection />
          </ProtectedRoute>
        }
      />

      <Route
        path="/shopping-list"
        element={
          <ProtectedRoute>
            <ShoppingList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-meals"
        element={
          <ProtectedRoute>
            <MyMeals />
          </ProtectedRoute>
        }
      />

      {/* Smart homepage - shows different content based on auth status */}
      <Route path="/" element={<SmartHomepage />} />

      {/* Catch all route - redirect to homepage */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
