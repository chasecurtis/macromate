import React from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  AppBar,
  Toolbar,
  Chip,
} from "@mui/material";
import {
  Restaurant,
  ShoppingCart,
  FitnessCenter,
  ExitToApp,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Welcome to MacroMate!
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Your meal planning and macro tracking app.
          </Typography>

          {/* Get Started Button - Moved to top */}
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
              mt: 3,
            }}
          >
            Get Started
          </Button>
        </Box>

        {/* Features Preview Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 3,
          }}
        >
          {/* Meal Planning Card */}
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ textAlign: "center", p: 3 }}>
              <Restaurant sx={{ fontSize: 48, color: "#667eea", mb: 2 }} />
              <Typography variant="h5" component="h3" gutterBottom>
                Meal Planning
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Plan your meals based on your macro goals
              </Typography>
              <Chip
                label="Coming Soon"
                color="secondary"
                variant="outlined"
                size="small"
              />
            </CardContent>
          </Card>

          {/* Shopping Lists Card */}
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ textAlign: "center", p: 3 }}>
              <ShoppingCart sx={{ fontSize: 48, color: "#667eea", mb: 2 }} />
              <Typography variant="h5" component="h3" gutterBottom>
                Shopping Lists
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Generate shopping lists from your meal plans
              </Typography>
              <Chip
                label="Coming Soon"
                color="secondary"
                variant="outlined"
                size="small"
              />
            </CardContent>
          </Card>

          {/* Macro Tracking Card */}
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ textAlign: "center", p: 3 }}>
              <FitnessCenter sx={{ fontSize: 48, color: "#667eea", mb: 2 }} />
              <Typography variant="h5" component="h3" gutterBottom>
                Macro Tracking
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Track your daily macro intake
              </Typography>
              <Chip
                label="Coming Soon"
                color="secondary"
                variant="outlined"
                size="small"
              />
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;
