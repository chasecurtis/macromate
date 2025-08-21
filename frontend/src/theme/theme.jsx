import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#667eea",
      dark: "#5a6fd8",
      light: "#7a8df0",
    },
    secondary: {
      main: "#764ba2",
    },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: "#333333",
      secondary: "#888888",
    },
    error: {
      main: "#c33",
      light: "#fee",
    },
    grey: {
      100: "#f8f9fa",
      200: "#e1e5e9",
      300: "#888",
    },
  },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    h1: {
      fontSize: "3.5rem",
      fontWeight: "bold",
      lineHeight: 1.1,
    },
    h2: {
      fontSize: "2.5rem",
      fontWeight: "normal",
      lineHeight: 1.2,
    },
    h3: {
      fontSize: "1.8rem",
      fontWeight: 300,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: "1.3rem",
      fontWeight: "normal",
    },
    h5: {
      fontSize: "1.2rem",
      fontWeight: "normal",
    },
    h6: {
      fontSize: "1.1rem",
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: "1.2rem",
      lineHeight: 1.6,
      opacity: 0.8,
    },
    body1: {
      fontSize: "1.1rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.9rem",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 600,
          transition: "all 0.3s",
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
            transform: "translateY(-2px)",
          },
        },
        sizeLarge: {
          padding: "15px 30px",
          fontSize: "1.1rem",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            fontSize: "1rem",
            "& fieldset": {
              borderColor: "#e1e5e9",
              borderWidth: "2px",
            },
            "&:hover fieldset": {
              borderColor: "#667eea",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#667eea",
            },
          },
          "& .MuiInputBase-input": {
            padding: "12px",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "4px",
        },
      },
    },
  },
  // Custom gradient backgrounds
  customGradients: {
    primary: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    hero: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  // Custom spacing (matches your current CSS)
  spacing: 8, // 1 unit = 8px (MUI default)
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 768,
      lg: 1200,
      xl: 1536,
    },
  },
});

export default theme;
