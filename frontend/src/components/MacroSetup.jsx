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
  InputAdornment,
  Alert,
} from "@mui/material";
import { macroGoalAPI, authAPI } from "../services/api";

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
  const [error, setError] = useState("");

  const handleChange = (e) => {
    // Handle form input changes
    const { name, value } = e.target;

    // Convert to Number and ensure its not negative
    const newValue = value === "" ? 0 : Math.max(0, Number(value));

    setMacroData({
      ...macroData,
      [name]: newValue,
    });
  };

  const handleFocus = (e) => {
    const { name } = e.target;
    // User clicks in number field and the number is 0, clear the 0
    if (macroData[name] === 0) {
      setMacroData({
        ...macroData,
        [name]: "",
      });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    // User clicks in number field and the number is empty, input a 1
    if (value === "") {
      setMacroData({
        ...macroData,
        [name]: 0,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if all values are 0
    if (
      macroData.calories === 0 &&
      macroData.carbohydrates === 0 &&
      macroData.proteins === 0 &&
      macroData.fats === 0
    ) {
      setError("Please enter at least one macro value greater than 0");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await macroGoalAPI.create(macroData);
      navigate("/meal-plan");
    } catch (error) {
      setError(error.response?.data || "Failed to save macro goals");
    }

    setLoading(false);
  };

  const isFormValid = () => {
    return (
      macroData.calories > 0 ||
      macroData.carbohydrates > 0 ||
      macroData.proteins > 0 ||
      macroData.fats > 0
    );
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

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {typeof error === "string"
              ? error
              : "Saving macro goals failed. Please try again."}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Calories"
                type="number"
                name="calories"
                value={macroData.calories}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">kcal</InputAdornment>
                    ),
                  },
                  htmlInput: {
                    min: 0,
                    step: 1,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Carbohydrates"
                type="number"
                name="carbohydrates"
                value={macroData.carbohydrates}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">g</InputAdornment>
                    ),
                  },
                  htmlInput: {
                    min: 0,
                    step: 1,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Proteins"
                type="number"
                name="proteins"
                value={macroData.proteins}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">g</InputAdornment>
                    ),
                  },
                  htmlInput: {
                    min: 0,
                    step: 1,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Fats"
                type="number"
                name="fats"
                value={macroData.fats}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">g</InputAdornment>
                    ),
                  },
                  htmlInput: {
                    min: 0,
                    step: 1,
                  },
                }}
              />
            </Grid>

            <Grid size={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !isFormValid()}
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
