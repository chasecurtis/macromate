import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Button,
  LinearProgress,
  Divider,
} from "@mui/material";
import {
  Restaurant,
  AccessTime,
  People,
  LocalFireDepartment,
  FitnessCenter,
  Edit,
  ShoppingCart,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const MyMeals = () => {
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTodaysMeals();
  }, []);

  const fetchTodaysMeals = async () => {
    try {
      const token = localStorage.getItem("token");
      const today = new Date().toISOString().split("T")[0];

      const response = await fetch(`/api/v1/meals/plan/?date=${today}`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMealPlan(data);
      } else if (response.status === 404) {
        // No meal plan for today
        setMealPlan(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch today's meals");
      }
    } catch (error) {
      console.error("Error fetching meals:", error);
      setError("Failed to fetch today's meals");
    } finally {
      setLoading(false);
    }
  };

  const generateShoppingList = async () => {
    try {
      const token = localStorage.getItem("token");
      const today = new Date().toISOString().split("T")[0];

      const response = await fetch(
        "/api/v1/meal-planning/shopping-list/generate/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            start_date: today,
            end_date: today,
          }),
        }
      );

      if (response.ok) {
        navigate("/shopping-list");
      } else {
        setError("Failed to generate shopping list");
      }
    } catch (error) {
      setError("Failed to generate shopping list");
    }
  };

  const getProgressPercentage = (current, goal) => {
    if (!goal) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const renderMealCard = (meal, mealType) => {
    if (!meal) {
      return (
        <Card
          sx={{
            height: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CardContent sx={{ textAlign: "center" }}>
            <Restaurant sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No {mealType} selected
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate("/meal-plan")}
              sx={{ mt: 2 }}
            >
              Plan {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card sx={{ height: "300px" }}>
        <CardMedia
          component="img"
          height="120"
          image={meal.image || "/placeholder-recipe.jpg"}
          alt={meal.title}
        />
        <CardContent>
          <Typography variant="h6" component="h3" noWrap gutterBottom>
            {meal.title}
          </Typography>

          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Chip
              icon={<AccessTime />}
              label={`${meal.ready_in_minutes} min`}
              size="small"
            />
            <Chip
              icon={<People />}
              label={`${meal.servings} servings`}
              size="small"
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            <LocalFireDepartment sx={{ fontSize: 16, mr: 0.5 }} />
            {Math.round(meal.calories)} cal •{Math.round(meal.proteins)}g
            protein •{Math.round(meal.carbohydrates)}g carbs •
            {Math.round(meal.fats)}g fat
          </Typography>

          <Button
            size="small"
            variant="text"
            href={
              meal.source_url ||
              `https://spoonacular.com/recipes/${meal.title
                .replace(/\s+/g, "-")
                .toLowerCase()}-${meal.spoonacular_id}`
            }
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mt: 1, p: 0 }}
          >
            View Recipe
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderNutritionSummary = () => {
    if (!mealPlan?.totals) return null;

    const totals = mealPlan.totals.totals;
    const goals = mealPlan.totals.daily_goals;

    return (
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <FitnessCenter color="primary" />
          Today's Nutrition Progress
        </Typography>

        <Grid container spacing={3}>
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
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {Math.round(percentage)}% of goal
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          My Meals Today
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Show nutrition summary if we have meal data */}
      {renderNutritionSummary()}

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, mb: 4, justifyContent: "center" }}>
        <Button
          variant="outlined"
          startIcon={<Edit />}
          onClick={() => navigate("/meal-plan")}
        >
          Edit Meal Plan
        </Button>

        {mealPlan?.breakfast && mealPlan?.lunch && mealPlan?.dinner && (
          <Button
            variant="contained"
            startIcon={<ShoppingCart />}
            onClick={generateShoppingList}
          >
            Generate Shopping List
          </Button>
        )}
      </Box>

      {!mealPlan ? (
        // No meals planned for today
        <Paper elevation={3} sx={{ p: 6, textAlign: "center" }}>
          <Restaurant sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No meals planned for today
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Start by setting your macro goals and planning your meals.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/macro-setup")}
          >
            Plan Your Meals
          </Button>
        </Paper>
      ) : (
        // Show planned meals
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Restaurant color="primary" />
                Breakfast
              </Typography>
              {renderMealCard(mealPlan.breakfast, "breakfast")}
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Restaurant color="primary" />
                Lunch
              </Typography>
              {renderMealCard(mealPlan.lunch, "lunch")}
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Restaurant color="primary" />
                Dinner
              </Typography>
              {renderMealCard(mealPlan.dinner, "dinner")}
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default MyMeals;
