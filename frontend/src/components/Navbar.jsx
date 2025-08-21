import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  Restaurant,
  ShoppingCart,
  Favorite,
  Settings,
  ExitToApp,
  FitnessCenter,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import macromatelogo from "../assets/macromate_logo.png";

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleClose();
    navigate("/");
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Navigation items for authenticated users
  const navigationItems = [
    { label: "Dashboard", path: "/dashboard", icon: <Dashboard /> },
    { label: "Meal Planning", path: "/meal-plan", icon: <Restaurant /> },
    { label: "Shopping List", path: "/shopping-list", icon: <ShoppingCart /> },
    { label: "My Meals", path: "/my-meals", icon: <Favorite /> },
    { label: "Macro Goals", path: "/macro-setup", icon: <FitnessCenter /> },
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  // Mobile drawer content
  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box sx={{ p: 2, textAlign: "center" }}>
        <img src={macromatelogo} alt="MacroMate" style={{ height: "60px" }} />
      </Box>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem
            button
            key={item.label}
            component={Link}
            to={item.path}
            onClick={handleDrawerToggle}
            sx={{
              backgroundColor: isActivePath(item.path)
                ? "action.selected"
                : "transparent",
            }}
          >
            <ListItemIcon
              sx={{
                color: isActivePath(item.path) ? "primary.main" : "inherit",
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              sx={{
                color: isActivePath(item.path) ? "primary.main" : "inherit",
              }}
            />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="static"
        sx={{ bgcolor: "white", color: "text.primary", boxShadow: 1 }}
      >
        <Toolbar>
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <img
              src={macromatelogo}
              alt="MacroMate"
              style={{ height: "120px", marginRight: "10px" }}
              to="/"
            />
          </Box>

          {/* Desktop Navigation */}
          {isAuthenticated && !isMobile && (
            <Box sx={{ display: "flex", gap: 1, mr: 2 }}>
              {navigationItems.map((item) => (
                <Button
                  key={item.label}
                  component={Link}
                  to={item.path}
                  color="inherit"
                  startIcon={item.icon}
                  sx={{
                    backgroundColor: isActivePath(item.path)
                      ? "action.selected"
                      : "transparent",
                    color: isActivePath(item.path)
                      ? "primary.main"
                      : "text.primary",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* Authentication Buttons */}
          {isAuthenticated ? (
            <>
              {isMobile ? (
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                >
                  <MenuIcon />
                </IconButton>
              ) : (
                <>
                  <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    color="inherit"
                  >
                    <Settings />
                  </IconButton>
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "right",
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    <MenuItem onClick={handleLogout}>
                      <ExitToApp sx={{ mr: 1 }} />
                      Logout
                    </MenuItem>
                  </Menu>
                </>
              )}
            </>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button component={Link} to="/login" color="inherit">
                Login
              </Button>
              <Button
                component={Link}
                to="/signup"
                variant="contained"
                sx={{
                  bgcolor: "#667eea",
                  "&:hover": { bgcolor: "#5a6fd8" },
                }}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      {isAuthenticated && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: 250 },
          }}
        >
          {drawer}
        </Drawer>
      )}
    </>
  );
};

export default Navbar;
