import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  AccessTime,
  People,
  LocalFireDepartment,
  FitnessCenter,
  ArrowBack,
  FavoriteOutlined,
  Favorite,
} from "@mui/icons-material";

const RecipeSelection = () => {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState("");

  const { recipeId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (recipeId) {
      fetchRecipeDetails();
      checkIfFavorite();
    }
  }, [recipeId]);

  const fetchRecipeDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/v1/meals/recipe/${recipeId}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecipe(data);
      } else {
        setError("Recipe not found");
      }
    } catch (error) {
      console.error("Error fetching recipe:", error);
      setError("Failed to load recipe details");
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/v1/meal-planning/favorites/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        const favorites = await response.json();
        const isFav = favorites.some(
          (fav) => fav.spoonacular_id === parseInt(recipe?.spoonacular_id)
        );
        setIsFavorite(isFav);
      }
    } catch (error) {
      console.error("Error checking favorites:", error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const token = localStorage.getItem("token");

      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(
          `/api/v1/meal-planning/favorites/${recipe.spoonacular_id}/`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        if (response.ok) {
          setIsFavorite(false);
        }
      } else {
        // Add to favorites
        const favoriteData = {
          spoonacular_id: recipe.spoonacular_id,
          title: recipe.title,
          image_url: recipe.image,
          ready_in_minutes: recipe.ready_in_minutes,
          servings: recipe.servings,
          calories: recipe.calories,
          protein: recipe.proteins,
          carbohydrates: recipe.carbohydrates,
          fat: recipe.fats,
        };

        const response = await fetch("/api/v1/meal-planning/favorites/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify(favoriteData),
        });

        if (response.ok) {
          setIsFavorite(true);
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleAddToMealPlan = (mealType) => {
    setSelectedMealType(mealType);
    setConfirmDialog(true);
  };

  const confirmAddToMealPlan = async () => {
    try {
      const token = localStorage.getItem("token");
      const today = new Date().toISOString().split("T")[0];

      const response = await fetch("/api/v1/meals/plan/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          date: today,
          [`${selectedMealType}_id`]: recipe.id,
        }),
      });

      if (response.ok) {
        setConfirmDialog(false);
        navigate("/meal-plan");
      } else {
        setError("Failed to add recipe to meal plan");
      }
    } catch (error) {
      console.error("Error adding to meal plan:", error);
      setError("Failed to add recipe to meal plan");
    }
  };

  const parseInstructions = (instructions) => {
    if (!instructions) return [];

    // Remove HTML tags and split by common delimiters
    const cleanInstructions = instructions
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .split(/\d+\.|\n/) // Split by numbered steps or newlines
      .filter((step) => step.trim().length > 10) // Filter out short/empty steps
      .map((step) => step.trim());

    return cleanInstructions;
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!recipe) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">Recipe not found</Alert>
      </Container>
    );
  }

  const instructionSteps = parseInstructions(recipe.instructions);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {recipe.title}
        </Typography>
        <Button
          variant="outlined"
          startIcon={isFavorite ? <Favorite /> : <FavoriteOutlined />}
          onClick={toggleFavorite}
          color={isFavorite ? "error" : "primary"}
        >
          {isFavorite ? "Remove Favorite" : "Add Favorite"}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Recipe Image and Quick Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardMedia
              component="img"
              height="300"
              image={recipe.image || "/placeholder-recipe.jpg"}
              alt={recipe.title}
            />
            <CardContent>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <Chip
                  icon={<AccessTime />}
                  label={`${recipe.ready_in_minutes} minutes`}
                  color="primary"
                />
                <Chip
                  icon={<People />}
                  label={`${recipe.servings} servings`}
                  color="secondary"
                />
              </Box>

              {recipe.summary && (
                <Typography variant="body2" color="text.secondary">
                  {recipe.summary.replace(/<[^>]*>/g, "").substring(0, 200)}...
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Add to Meal Plan Buttons */}
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Add to Meal Plan
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {["breakfast", "lunch", "dinner"].map((mealType) => (
                <Button
                  key={mealType}
                  variant="outlined"
                  onClick={() => handleAddToMealPlan(mealType)}
                  sx={{ textTransform: "capitalize" }}
                >
                  {mealType}
                </Button>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Nutrition and Instructions */}
        <Grid item xs={12} md={6}>
          {/* Nutrition Information */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <FitnessCenter color="primary" />
              Nutrition Information
              <Typography variant="caption" color="text.secondary">
                (per serving)
              </Typography>
            </Typography>

            <Grid container spacing={2}>
              {[
                {
                  key: "calories",
                  label: "Calories",
                  unit: "kcal",
                  value: recipe.calories,
                  color: "primary",
                },
                {
                  key: "proteins",
                  label: "Protein",
                  unit: "g",
                  value: recipe.proteins,
                  color: "success",
                },
                {
                  key: "carbohydrates",
                  label: "Carbs",
                  unit: "g",
                  value: recipe.carbohydrates,
                  color: "warning",
                },
                {
                  key: "fats",
                  label: "Fat",
                  unit: "g",
                  value: recipe.fats,
                  color: "error",
                },
              ].map(({ key, label, unit, value, color }) => (
                <Grid item xs={6} key={key}>
                  <Box sx={{ textAlign: "center", p: 1 }}>
                    <Typography variant="h4" color={`${color}.main`}>
                      {Math.round(value || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {label} ({unit})
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Ingredients
              </Typography>
              <List dense>
                {recipe.ingredients.map((ingredient, index) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={
                        ingredient.original || ingredient.name || ingredient
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Grid>

        {/* Instructions */}
        {instructionSteps.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Instructions
              </Typography>
              <List>
                {instructionSteps.map((step, index) => (
                  <ListItem key={index} alignItems="flex-start">
                    <Box sx={{ mr: 2, mt: 0.5 }}>
                      <Chip label={index + 1} size="small" color="primary" />
                    </Box>
                    <ListItemText primary={step} sx={{ mt: 0 }} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Add to Meal Plan</DialogTitle>
        <DialogContent>
          <Typography>
            Add "{recipe.title}" to your {selectedMealType} for today?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button onClick={confirmAddToMealPlan} variant="contained">
            Add to {selectedMealType}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RecipeSelection;
