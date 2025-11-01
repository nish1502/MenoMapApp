import { DefaultTheme } from "react-native-paper";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#FF8FAB",
    accent: "#FB6F92",
    background: "#FFE5EC",
    surface: "#FFB3C6",
    text: "#000000",
    placeholder: "#FFC2D1",
    disabled: "#FFC2D1",
    notification: "#FB6F92",
  },
};

// --- ADD THIS LINE ---
// CRITICAL: Make sure this is your computer's IP address
export const API_URL = 'http://192.168.29.18:5001'; 
// ---------------------

export default theme;
