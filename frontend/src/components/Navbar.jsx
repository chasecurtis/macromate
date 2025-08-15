import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { ExitToApp } from "@mui/icons-material";
import macromatelogo from "../assets/macromate_logo.png";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <AppBar position="static" sx={{ bgcolor: "#667eea" }}>
      <Toolbar>
        <Box
          component={Link}
          to={isAuthenticated ? "/dashboard" : "/"}
          sx={{
            flexGrow: 1,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          <img
            src={macromatelogo}
            alt="MacroMate"
            style={{ height: "110px", marginRight: "10px" }}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {isAuthenticated ? (
            // Authenticated user navbar
            <>
              <Typography variant="body2">
                Welcome, {user?.first_name || user?.email}!
              </Typography>
              <Button
                color="inherit"
                onClick={handleLogout}
                startIcon={<ExitToApp />}
                variant="outlined"
                sx={{
                  borderColor: "white",
                  "&:hover": { borderColor: "white" },
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            // Unauthenticated user navbar
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                component={Link}
                to="/signup"
                sx={{
                  borderColor: "white",
                  "&:hover": { borderColor: "white" },
                }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
