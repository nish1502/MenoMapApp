// navigation/RootNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OnboardingScreen from "../screens/Auth/OnboardingScreen";
import LoginScreen from "../screens/Auth/LoginScreen";
import AppNavigator from "./AppNavigator";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // hide headers for all screens
      }}
    >
      {/* Onboarding Flow */}
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />

      {/* Login / Auth */}
      <Stack.Screen name="LoginScreen" component={LoginScreen} />

      {/* Main App Tabs */}
      <Stack.Screen name="MainApp" component={AppNavigator} />
    </Stack.Navigator>
  );
}
