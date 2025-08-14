import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Homepage.css";

const Homepage = () => {
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleQuickLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(loginData);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>MacroMate</h1>
            <h2>Your Intelligent Meal Planning Companion</h2>
            <p className="hero-subtitle">
              Plan perfect meals that hit your macro goals, generate smart
              shopping lists, and take the guesswork out of nutrition tracking.
            </p>

            <div className="hero-features">
              <div className="feature">
                <span className="feature-icon">🎯</span>
                <span>Macro-Perfect Meal Plans</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🛒</span>
                <span>Auto-Generated Shopping Lists</span>
              </div>
              <div className="feature">
                <span className="feature-icon">💡</span>
                <span>Smart Recipe Suggestions</span>
              </div>
            </div>
          </div>

          {/* Quick Login Form */}
          <div className="hero-login">
            <div className="login-card">
              <h3>Get Started</h3>

              {error && (
                <div className="error-message">
                  {typeof error === "string"
                    ? error
                    : "Login failed. Please try again."}
                </div>
              )}

              <form onSubmit={handleQuickLogin}>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                />
                <button type="submit" disabled={loading} className="login-btn">
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </form>

              <div className="auth-links">
                <p>
                  Don't have an account? <Link to="/signup">Sign up here</Link>
                </p>
                <p>
                  <Link to="/login">Go to full login page</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-content">
          <h2>How MacroMate Works</h2>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-number">1</div>
              <h3>Set Your Goals</h3>
              <p>
                Tell us your daily macro targets - protein, carbs, and fats.
                Whether you're cutting, bulking, or maintaining.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-number">2</div>
              <h3>Get Meal Plans</h3>
              <p>
                Receive personalized breakfast, lunch, and dinner suggestions
                that perfectly fit your macro goals.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-number">3</div>
              <h3>Shop Smarter</h3>
              <p>
                Generate complete shopping lists with quantities and estimated
                prices for all your meal ingredients.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="benefits-content">
          <h2>Why Choose MacroMate?</h2>

          <div className="benefits-grid">
            <div className="benefit">
              <h3>🎯 Precision Nutrition</h3>
              <p>
                Hit your macros exactly with scientifically-backed meal
                combinations
              </p>
            </div>

            <div className="benefit">
              <h3>⏰ Save Time</h3>
              <p>
                No more hours spent meal planning or calculating nutrition facts
              </p>
            </div>

            <div className="benefit">
              <h3>💰 Budget-Friendly</h3>
              <p>Get estimated prices and optimize your grocery spending</p>
            </div>

            <div className="benefit">
              <h3>🔄 Variety</h3>
              <p>
                Discover new recipes that fit your goals and taste preferences
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content">
          <h2>Ready to Master Your Macros?</h2>
          <p>
            Join thousands of users who've simplified their nutrition journey
          </p>
          <div className="cta-buttons">
            <Link to="/signup" className="cta-btn primary">
              Start Free Today
            </Link>
            <Link to="/login" className="cta-btn secondary">
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
