import { View } from "react-native";
import { PaperProvider } from "react-native-paper";
import theme from "./constants/theme";
import AppNavigator from "./navigation/AppNavigator";

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <AppNavigator />
      </View>
    </PaperProvider>
  );
}