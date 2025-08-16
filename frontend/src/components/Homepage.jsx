// frontend/src/components/Homepage.jsx
import macromatelogo from "../assets/macromate_logo.png";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material";

const Homepage = () => {
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: theme.customGradients.hero,
          color: "white",
          py: 10,
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={7.5} alignItems="center">
            {/* Hero Text */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <img
                  src={macromatelogo}
                  alt="MacroMate"
                  style={{ height: "250px", marginRight: "20px" }}
                />
              </Box>
              <Typography variant="h3" sx={{ opacity: 0.9, mb: 2 }}>
                Your Intelligent Meal Planning Companion
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 4 }}>
                Plan perfect meals that hit your macro goals, generate smart
                shopping lists, and take the guesswork out of nutrition
                tracking.
              </Typography>

              {/* Hero Features */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography sx={{ fontSize: "1.5rem" }}>🎯</Typography>
                  <Typography variant="body1">
                    Macro-Perfect Meal Plans
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography sx={{ fontSize: "1.5rem" }}>🛒</Typography>
                  <Typography variant="body1">
                    Auto-Generated Shopping Lists
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography sx={{ fontSize: "1.5rem" }}>💡</Typography>
                  <Typography variant="body1">
                    Smart Recipe Suggestions
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Login Card */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 2 }}>
                <CardContent>
                  <Typography
                    variant="h4"
                    textAlign="center"
                    color="text.primary"
                    gutterBottom
                  >
                    Get Started
                  </Typography>

                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {typeof error === "string"
                        ? error
                        : "Login failed. Please try again."}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleQuickLogin}>
                    <TextField
                      fullWidth
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      required
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      required
                      sx={{ mb: 2 }}
                    />
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading}
                      sx={{ mb: 3 }}
                    >
                      {loading ? "Signing In..." : "Sign In"}
                    </Button>
                  </Box>

                  <Box textAlign="center">
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Don't have an account?{" "}
                      <Link
                        to="/signup"
                        style={{
                          color: theme.palette.primary.main,
                          textDecoration: "none",
                        }}
                      >
                        Sign up here
                      </Link>
                    </Typography>
                    <Typography variant="body2">
                      <Link
                        to="/login"
                        style={{
                          color: theme.palette.primary.main,
                          textDecoration: "none",
                        }}
                      >
                        Go to full login page
                      </Link>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 10, bgcolor: "grey.100" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            textAlign="center"
            color="text.primary"
            gutterBottom
            sx={{ mb: 6 }}
          >
            How MacroMate Works
          </Typography>

          <Grid container spacing={4}>
            {[
              {
                number: "1",
                title: "Set Your Goals",
                description:
                  "Tell us your daily macro targets - protein, carbs, and fats. Whether you're cutting, bulking, or maintaining.",
              },
              {
                number: "2",
                title: "Get Meal Plans",
                description:
                  "Receive personalized breakfast, lunch, and dinner suggestions that perfectly fit your macro goals.",
              },
              {
                number: "3",
                title: "Shop Smarter",
                description:
                  "Generate complete shopping lists with quantities and estimated prices for all your meal ingredients.",
              },
            ].map((feature, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Card sx={{ height: "100%", textAlign: "center" }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: "primary.main",
                        color: "white",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        mx: "auto",
                        mb: 2,
                      }}
                    >
                      {feature.number}
                    </Box>
                    <Typography variant="h4" gutterBottom color="text.primary">
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.primary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Box sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            textAlign="center"
            color="text.primary"
            gutterBottom
            sx={{ mb: 6 }}
          >
            Why Choose MacroMate?
          </Typography>

          <Grid container spacing={4}>
            {[
              {
                icon: "🎯",
                title: "Precision Nutrition",
                description:
                  "Hit your macros exactly with scientifically-backed meal combinations",
              },
              {
                icon: "⏰",
                title: "Save Time",
                description:
                  "No more hours spent meal planning or calculating nutrition facts",
              },
              {
                icon: "💰",
                title: "Budget-Friendly",
                description:
                  "Get estimated prices and optimize your grocery spending",
              },
              {
                icon: "🔄",
                title: "Variety",
                description:
                  "Discover new recipes that fit your goals and taste preferences",
              },
            ].map((benefit, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <Typography sx={{ fontSize: "2rem", mb: 2 }}>
                    {benefit.icon}
                  </Typography>
                  <Typography variant="h5" gutterBottom color="text.primary">
                    {benefit.title}
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    {benefit.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: theme.customGradients.primary,
          color: "white",
          py: 10,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" gutterBottom>
            Ready to Master Your Macros?
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 4 }}>
            Join thousands of users who've simplified their nutrition journey
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexDirection: isMobile ? "column" : "row",
              alignItems: "center",
            }}
          >
            <Button
              component={Link}
              to="/signup"
              variant="contained"
              size="large"
              sx={{
                bgcolor: "white",
                color: "primary.main",
                width: isMobile ? 200 : "auto",
                "&:hover": {
                  bgcolor: "grey.100",
                },
              }}
            >
              Start Free Today
            </Button>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              size="large"
              sx={{
                borderColor: "white",
                color: "white",
                width: isMobile ? 200 : "auto",
                "&:hover": {
                  borderColor: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              Sign In
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Homepage;
