// frontend/src/components/MacroSetup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  useTheme,
  TextField,
  Grid,
} from "@mui/material";

const MacroSetup = () => {
  const [macroData, setMacroData] = useState({
    // Add your macro fields here
    calories: 0,
    carbohydrates: 0,
    proteins: 0,
    fats: 0,
  });

  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    // Handle form input changes
    setMacroData({
      ...macroData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    navigate("/meal-plan");
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" gutterBottom textAlign="center">
          Set Your Macro Goals
        </Typography>

        <Typography
          variant="body1"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          Tell us your daily macro targets to create the perfect meal plan
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Calories"
                type="number"
                name="calories"
                value={macroData.calories}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Carbohydrates"
                type="number"
                name="carbohydrates"
                value={macroData.carbohydrates}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Protein"
                type="number"
                name="proteins"
                value={macroData.proteins}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fats"
                type="number"
                name="fats"
                value={macroData.fats}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? "Generating Meals" : "Generate Meals"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default MacroSetup;
