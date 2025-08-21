import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  Chip,
  Grid,
  Paper,
  LinearProgress,
  Alert,
} from "@mui/material";
import {
  Restaurant,
  ShoppingCart,
  FitnessCenter,
  Favorite,
  Settings,
  TrendingUp,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { macroGoalAPI, mealsAPI } from "../services/api";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [macroGoals, setMacroGoals] = useState(null);
  const [todaysPlan, setTodaysPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch macro goals
      try {
        const macroResponse = await macroGoalAPI.get();
        setMacroGoals(macroResponse.data);
      } catch (macroError) {
        // User hasn't set macro goals yet
        console.log("No macro goals set yet");
      }

      // Fetch today's meal plan
      try {
        const today = new Date().toISOString().split("T")[0];
        const mealResponse = await mealsAPI.getMealPlan(today);
        setTodaysPlan(mealResponse.data);
      } catch (mealError) {
        // No meal plan for today
        console.log("No meal plan for today");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (current, goal) => {
    if (!goal) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const renderMacroProgress = () => {
    if (!macroGoals || !todaysPlan?.totals) return null;

    const totals = todaysPlan.totals.totals;
    const goals = todaysPlan.totals.daily_goals;

    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <TrendingUp color="primary" />
          Today's Progress
        </Typography>

        <Grid container spacing={2}>
          {[
            {
              key: "calories",
              label: "Calories",
              unit: "kcal",
              color: "primary",
            },
            { key: "proteins", label: "Protein", unit: "g", color: "success" },
            {
              key: "carbohydrates",
              label: "Carbs",
              unit: "g",
              color: "warning",
            },
            { key: "fats", label: "Fat", unit: "g", color: "error" },
          ].map(({ key, label, unit, color }) => {
            const current = totals[key] || 0;
            const goal = goals[key] || 1;
            const percentage = getProgressPercentage(current, goal);

            return (
              <Grid item xs={6} sm={3} key={key}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="h6">
                    {Math.round(current)} / {Math.round(goal)} {unit}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    color={color}
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {Math.round(percentage)}%
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    );
  };

  const renderTodaysMeals = () => {
    if (!todaysPlan) return null;

    const meals = [
      { type: "breakfast", recipe: todaysPlan.breakfast },
      { type: "lunch", recipe: todaysPlan.lunch },
      { type: "dinner", recipe: todaysPlan.dinner },
    ];

    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Restaurant color="primary" />
          Today's Meals
        </Typography>

        <Grid container spacing={2}>
          {meals.map(({ type, recipe }) => (
            <Grid item xs={12} sm={4} key={type}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ textTransform: "capitalize", mb: 1 }}
                  >
                    {type}
                  </Typography>
                  {recipe ? (
                    <>
                      <Typography variant="body2" noWrap>
                        {recipe.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(recipe.calories)} calories
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Not planned yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading dashboard...</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Welcome back to MacroMate!
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Your personalized meal planning and macro tracking dashboard
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Macro Progress */}
        {renderMacroProgress()}

        {/* Today's Meals */}
        {renderTodaysMeals()}

        {/* Quick Actions */}
        {!macroGoals ? (
          <Paper sx={{ p: 4, textAlign: "center", mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Get Started with MacroMate
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Set your macro goals to begin planning your perfect meals
            </Typography>
            <Button
              component={Link}
              to="/macro-setup"
              variant="contained"
              size="large"
              sx={{
                bgcolor: "#667eea",
                "&:hover": { bgcolor: "#5a6fd8" },
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
              }}
            >
              Set Macro Goals
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {/* Meal Planning Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{ height: "100%", cursor: "pointer" }}
                component={Link}
                to="/meal-plan"
              >
                <CardContent sx={{ textAlign: "center", p: 3 }}>
                  <Restaurant sx={{ fontSize: 48, color: "#667eea", mb: 2 }} />
                  <Typography variant="h5" component="h3" gutterBottom>
                    Meal Planning
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Plan your meals based on your macro goals
                  </Typography>
                  <Chip
                    label="Plan Today"
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Shopping Lists Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{ height: "100%", cursor: "pointer" }}
                component={Link}
                to="/shopping-list"
              >
                <CardContent sx={{ textAlign: "center", p: 3 }}>
                  <ShoppingCart
                    sx={{ fontSize: 48, color: "#667eea", mb: 2 }}
                  />
                  <Typography variant="h5" component="h3" gutterBottom>
                    Shopping Lists
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Generate shopping lists from your meal plans
                  </Typography>
                  <Chip
                    label="View List"
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* My Meals Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{ height: "100%", cursor: "pointer" }}
                component={Link}
                to="/my-meals"
              >
                <CardContent sx={{ textAlign: "center", p: 3 }}>
                  <Favorite sx={{ fontSize: 48, color: "#667eea", mb: 2 }} />
                  <Typography variant="h5" component="h3" gutterBottom>
                    My Meals
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    View your selected meals
                  </Typography>
                  <Chip
                    label="Browse"
                    color="error"
                    variant="outlined"
                    size="small"
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Settings Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{ height: "100%", cursor: "pointer" }}
                component={Link}
                to="/macro-setup"
              >
                <CardContent sx={{ textAlign: "center", p: 3 }}>
                  <Settings sx={{ fontSize: 48, color: "#667eea", mb: 2 }} />
                  <Typography variant="h5" component="h3" gutterBottom>
                    Macro Goals
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Update your daily macro targets
                  </Typography>
                  <Chip
                    label="Adjust"
                    color="warning"
                    variant="outlined"
                    size="small"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;
