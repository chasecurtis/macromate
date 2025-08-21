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
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  ShoppingCart,
  ExpandMore,
  AttachMoney,
  Restaurant,
  ArrowBack,
} from "@mui/icons-material";

const ShoppingList = () => {
  const [shoppingList, setShoppingList] = useState(null);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchShoppingList();
  }, []);

  const fetchShoppingList = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const today = new Date().toISOString().split("T")[0];

      const response = await fetch(
        `/api/v1/meal-planning/shopping-list/?start_date=${today}&end_date=${today}`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setShoppingList(data);
      } else if (response.status === 404) {
        setError("No shopping list found. Please create a meal plan first.");
      } else {
        setError("Failed to load shopping list");
      }
    } catch (error) {
      console.error("Error fetching shopping list:", error);
      setError("Failed to load shopping list");
    } finally {
      setLoading(false);
    }
  };

  const handleItemCheck = (itemKey) => {
    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(itemKey)) {
      newCheckedItems.delete(itemKey);
    } else {
      newCheckedItems.add(itemKey);
    }
    setCheckedItems(newCheckedItems);
  };

  const renderMealBreakdown = () => {
    if (!shoppingList?.meal_breakdown) return null;

    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Restaurant color="primary" />
          Meal Breakdown
        </Typography>

        <Grid container spacing={2}>
          {Object.entries(shoppingList.meal_breakdown).map(
            ([recipeName, breakdown]) => (
              <Grid item xs={12} md={4} key={recipeName}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {recipeName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Meal Type: {breakdown.meal_type || "Unknown"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Estimated cost: $
                      {breakdown.total_recipe_cost?.toFixed(2) || "0.00"}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {breakdown.ingredients?.length || 0} ingredients
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )
          )}
        </Grid>
      </Paper>
    );
  };

  const renderShoppingByAisle = () => {
    if (!shoppingList?.aisles) return null;

    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Shopping List by Aisle
        </Typography>

        {Object.entries(shoppingList.aisles).map(([aisle, items]) => (
          <Accordion key={aisle} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                {aisle} ({items.length} items)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {items.map((item, index) => {
                  const itemKey = `${aisle}-${index}`;
                  const isChecked = checkedItems.has(itemKey);

                  return (
                    <ListItem
                      key={itemKey}
                      sx={{
                        textDecoration: isChecked ? "line-through" : "none",
                        opacity: isChecked ? 0.7 : 1,
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          checked={isChecked}
                          onChange={() => handleItemCheck(itemKey)}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.name}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              {item.amount} {item.unit}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Est. ${item.estimated_cost?.toFixed(2) || "0.00"}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
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

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button onClick={() => navigate("/meal-plan")} variant="contained">
            Create Meal Plan
          </Button>
          <Button onClick={() => navigate("/dashboard")} variant="outlined">
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  if (!shoppingList) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">No shopping list found</Alert>
        <Button onClick={() => navigate("/meal-plan")} sx={{ mt: 2 }}>
          Create Meal Plan
        </Button>
      </Container>
    );
  }

  const completedItems = checkedItems.size;
  const totalItems = shoppingList.total_items || 0;
  const progressPercentage =
    totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/meal-plan")}
          sx={{ mr: 2 }}
        >
          Back to Meal Plan
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Shopping List
        </Typography>
      </Box>

      {/* Shopping Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="primary.main">
                {totalItems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Items
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="success.main">
                {completedItems}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="warning.main">
                ${shoppingList.total_estimated_cost?.toFixed(2) || "0.00"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Estimated Cost
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="info.main">
                {Math.round(progressPercentage)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Meal Breakdown */}
      {renderMealBreakdown()}

      {/* Shopping List by Aisle */}
      {renderShoppingByAisle()}
    </Container>
  );
};

export default ShoppingList;
