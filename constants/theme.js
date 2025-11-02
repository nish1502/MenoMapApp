// constants/theme.js
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

export default theme;
