import React from "react";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>MacroMate Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome to MacroMate!</h2>
          <p>Your meal planning and macro tracking app.</p>
        </div>

        <div className="features-preview">
          <div className="feature-card">
            <h3>Meal Planning</h3>
            <p>Plan your meals based on your macro goals</p>
            <span className="coming-soon">Coming Soon</span>
          </div>

          <div className="feature-card">
            <h3>Shopping Lists</h3>
            <p>Generate shopping lists from your meal plans</p>
            <span className="coming-soon">Coming Soon</span>
          </div>

          <div className="feature-card">
            <h3>Macro Tracking</h3>
            <p>Track your daily macro intake</p>
            <span className="coming-soon">Coming Soon</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
