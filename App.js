import React, { useState } from "react";
import { Provider as PaperProvider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";

import theme from "./constants/theme";
import RootNavigator from "./navigation/RootNavigator";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <RootNavigator isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      </NavigationContainer>
    </PaperProvider>
  );
}
