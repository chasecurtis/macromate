import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  CardActions,
} from "@mui/material";
import {
  Restaurant,
  AccessTime,
  People,
  Refresh,
  ShoppingCart,
  LocalFireDepartment,
  FitnessCenter,
} from "@mui/icons-material";

const MealPlanSetup = () => {
  const [macroGoals, setMacroGoals] = useState(null);
  const [mealSuggestions, setMealSuggestions] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
  });
  const [selectedMeals, setSelectedMeals] = useState({
    breakfast: null,
    lunch: null,
    dinner: null,
  });
  const [mealTotals, setMealTotals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [shuffledSuggestions, setShuffledSuggestions] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
  });

  const navigate = useNavigate();

  // Fetch user's macro goals and meal suggestions on component mount
  useEffect(() => {
    fetchMacroGoals();
  }, []);

  useEffect(() => {
    setShuffledSuggestions({
      breakfast:
        mealSuggestions.breakfast.length > 0
          ? [...mealSuggestions.breakfast].sort(() => 0.5 - Math.random())
          : [],
      lunch:
        mealSuggestions.lunch.length > 0
          ? [...mealSuggestions.lunch].sort(() => 0.5 - Math.random())
          : [],
      dinner:
        mealSuggestions.dinner.length > 0
          ? [...mealSuggestions.dinner].sort(() => 0.5 - Math.random())
          : [],
    });
  }, [mealSuggestions]);

  const fetchMacroGoals = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/v1/meal-planning/macro-goals/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMacroGoals(data);
        fetchMealSuggestions();
      } else {
        setError("Please set your macro goals first");
        navigate("/macro-setup");
      }
    } catch (error) {
      console.error("Error fetching macro goals:", error);
      setError("Please set your macro goals first");
      navigate("/macro-setup");
    }
  };

  const fetchMealSuggestions = async () => {
    setSuggestionsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/v1/meals/suggestions/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Meal suggestions received:", data);

        setMealSuggestions({
          breakfast: data.suggestions.breakfast || [],
          lunch: data.suggestions.lunch || [],
          dinner: data.suggestions.dinner || [],
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch meal suggestions");
      }
    } catch (error) {
      console.error("Error fetching meal suggestions:", error);
      setError("Failed to fetch meal suggestions. Please try again.");
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleMealSelect = async (mealType, recipe) => {
    const newSelectedMeals = {
      ...selectedMeals,
      [mealType]: recipe,
    };
    setSelectedMeals(newSelectedMeals);

    await saveMealPlan(mealType, recipe.id);
  };

  const saveMealPlan = async (mealType, recipeId) => {
    try {
      const token = localStorage.getItem("token");
      const today = new Date().toISOString().split("T")[0];

      const body = {
        date: today,
        [`${mealType}_id`]: recipeId,
      };

      const response = await fetch("/api/v1/meals/plan/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        setMealTotals(data.totals);
      }
    } catch (error) {
      console.error("Error saving meal plan:", error);
    }
  };

  const generateShoppingList = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (current, goal) => {
    if (!goal) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const renderMealSection = (mealType, recipes) => {
    const mealTitle = mealType.charAt(0).toUpperCase() + mealType.slice(1);
    const selectedRecipe = selectedMeals[mealType];

    return (
      <Box key={mealType} sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Restaurant color="primary" />
          {mealTitle}
          {selectedRecipe && (
            <Chip label="Selected" color="success" size="small" />
          )}
        </Typography>

        {suggestionsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : recipes.length === 0 ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No {mealType} suggestions found. Try refreshing or adjusting your
            macro goals.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {recipes.slice(0, 6).map((recipe) => (
              <Grid item xs={12} sm={6} md={4} key={recipe.id}>
                <Card
                  sx={{
                    height: "400px",
                    width: "400px",
                    cursor: "pointer",
                    border: selectedRecipe?.id === recipe.id ? 2 : 0,
                    borderColor: "success.main",
                    "&:hover": { elevation: 4 },
                  }}
                  onClick={() => handleMealSelect(mealType, recipe)}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={recipe.image || "/placeholder-recipe.jpg"}
                    alt={recipe.title}
                  />
                  <CardContent sx={{ pb: 1 }}>
                    <Typography variant="h6" component="h3" noWrap>
                      {recipe.title}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1, my: 1 }}>
                      <Chip
                        icon={<AccessTime />}
                        label={`${recipe.ready_in_minutes} min`}
                        size="small"
                      />
                      <Chip
                        icon={<People />}
                        label={`${recipe.servings} servings`}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <LocalFireDepartment sx={{ fontSize: 16, mr: 0.5 }} />
                        {Math.round(recipe.calories)} cal •
                        {Math.round(recipe.proteins)}g protein •
                        {Math.round(recipe.carbohydrates)}g carbs •
                        {Math.round(recipe.fats)}g fat
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: "space-between", p: 2 }}>
                    <Button
                      size="small"
                      variant={
                        selectedRecipe?.id === recipe.id
                          ? "contained"
                          : "outlined"
                      }
                      onClick={() => handleMealSelect(mealType, recipe)}
                    >
                      {selectedRecipe?.id === recipe.id ? "Selected" : "Select"}
                    </Button>

                    <Button
                      size="small"
                      variant="text"
                      href={
                        recipe.source_url ||
                        `https://spoonacular.com/recipes/${recipe.title
                          .replace(/\s+/g, "-")
                          .toLowerCase()}-${recipe.spoonacular_id}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ minWidth: "auto" }}
                    >
                      View Original Recipe
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  const renderNutritionSummary = () => {
    if (!mealTotals || !macroGoals) return null;

    const totals = mealTotals.totals;
    const goals = mealTotals.daily_goals;

    return (
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <FitnessCenter color="primary" />
          Daily Nutrition Summary
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

  if (!macroGoals) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
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
          Plan Your Daily Meals
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select recipes that match your macro goals for today
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Nutrition Summary */}
      {renderNutritionSummary()}

      {/* Action Buttons */}
      <Box sx={{ display: "flex", gap: 2, mb: 4, justifyContent: "center" }}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchMealSuggestions}
          disabled={suggestionsLoading}
        >
          Get New Suggestions
        </Button>

        <Button
          variant="contained"
          startIcon={<ShoppingCart />}
          onClick={generateShoppingList}
          disabled={
            loading ||
            !selectedMeals.breakfast ||
            !selectedMeals.lunch ||
            !selectedMeals.dinner
          }
        >
          {loading ? "Generating..." : "Generate Shopping List"}
        </Button>
      </Box>

      {/* Meal Sections */}
      {renderMealSection("breakfast", shuffledSuggestions.breakfast)}
      <Divider sx={{ my: 4 }} />
      {renderMealSection("lunch", shuffledSuggestions.lunch)}
      <Divider sx={{ my: 4 }} />
      {renderMealSection("dinner", shuffledSuggestions.dinner)}
    </Container>
  );
};

export default MealPlanSetup;
