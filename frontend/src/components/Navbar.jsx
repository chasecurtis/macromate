import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import macroMateLogo from "../assets/macromate_logo.png";
import "./Navbar.css";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo/Brand */}
        <Link to="/" className="nav-logo">
          <img src={macroMateLogo} alt="MacroMate" className="logo-image" />
        </Link>

        {/* Navigation Links */}
        <div className="nav-links">
          {isAuthenticated ? (
            // Authenticated user navigation
            <>
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
              <Link to="/recipes" className="nav-link">
                Recipes
              </Link>
              <Link to="/selected-recipes" className="nav-link">
                Selected Recipes
              </Link>
              <Link to="/meal-plan" className="nav-link">
                Meal Plan
              </Link>
              <Link to="/shopping-list" className="nav-link">
                Shopping List
              </Link>

              {/* User dropdown or info */}
              <div className="user-section">
                <span className="user-greeting">
                  Hi, {user?.first_name || user?.email}
                </span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </>
          ) : (
            // Non-authenticated user navigation
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/signup" className="nav-link nav-signup">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button (for future mobile responsiveness) */}
        <div className="mobile-menu-btn">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
