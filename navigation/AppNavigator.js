// navigation/AppNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Screens
import OnboardingScreen from "../screens/Auth/OnboardingScreen";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";

import HomeScreen from "../screens/Home/HomeScreen";
import RegionalDietPlannerScreen from "../screens/Diet/RegionalDietPlannerScreen";
import SymptomCoachScreen from "../screens/Coach/SymptomCoachScreen";
import ReliefTrackerScreen from "../screens/Reports/ReliefTrackerScreen";
import PcosModeScreen from "../screens/PCOS/PcosModeScreen";
import SymptomTrackerScreen from "../screens/Home/SymptomTrackerScreen";
import BrainFogLogScreen from "../screens/Home/BrainFogLogScreen";
import CycleTimelineScreen from "../screens/Home/CycleTimelineScreen";
import DoctorReportScreen from "../screens/Reports/DoctorReportsScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";

// Stack & Tabs
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tabs
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF8FAB",
        tabBarInactiveTintColor: "#FFC2D1",
        tabBarStyle: { backgroundColor: "#FFE5EC", height: 60, paddingBottom: 5 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Diet"
        component={RegionalDietPlannerScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="food-apple" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Coach"
        component={SymptomCoachScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="robot" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReliefTrackerScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="PCOS"
        component={PcosModeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart-pulse" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Root Stack
export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Onboarding & Auth */}
      <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="RegisterScreen" component={RegisterScreen} />

      {/* Main App Tabs */}
      <Stack.Screen name="MainTabs" component={MainTabs} />

      {/* Additional screens accessible via navigation */}
      <Stack.Screen name="SymptomTrackerScreen" component={SymptomTrackerScreen} />
      <Stack.Screen name="BrainFogLogScreen" component={BrainFogLogScreen} />
      <Stack.Screen name="CycleTimelineScreen" component={CycleTimelineScreen} />
      <Stack.Screen name="DoctorReportScreen" component={DoctorReportScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
