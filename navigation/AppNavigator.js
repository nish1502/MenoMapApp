// AppNavigator.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// --- Screens ---
import SplashScreen from "../screens/SplashScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import ProfileScreen from "../screens/ProfileScreen";
import HomeScreen from "../screens/HomeScreen";

// --- Features ---
import ReliefTrackerScreen from "../screens/ReliefTrackerScreen";
import BrainFogMemoryFogScreen from "../screens/BrainFogMemoryFogScreen";
import CycleIrregularityTimelineScreen from "../screens/CycleIrregularityTimelineScreen";
import DoctorConsultationPrepScreen from "../screens/DoctorConsultationPrepScreen";
import DietPlannerScreen from "../screens/DietPlannerScreen";
import SymptomTrackerScreen from "../screens/SymptomTrackerScreen";
import LearnFeature from "../screens/LearnFeature";
import JournalScreen from "../screens/JournalScreen";


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SplashScreen">
        {/* Pre-Home / Auth */}
        <Stack.Screen
          name="SplashScreen"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="WelcomeScreen"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OnboardingScreen"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{ title: "Login" }}
        />
        <Stack.Screen
          name="RegisterScreen"
          component={RegisterScreen}
          options={{ title: "Register" }}
        />

        {/* Profile setup */}
        <Stack.Screen
          name="ProfileScreen"
          component={ProfileScreen}
          options={{ title: "Your Profile" }}
        />

        {/* Main Home */}
        <Stack.Screen
          name="HomeScreen"
          component={HomeScreen}
          options={{ headerShown: false }}
        />

        {/* Relief Tracker */}
        <Stack.Screen
          name="ReliefTrackerScreen"
          component={ReliefTrackerScreen}
          options={{ title: "Relief Tracker" }}
        />

        {/* BrainFogMemoryFogScreen */}
        <Stack.Screen
          name="BrainFogMemoryFogScreen"
          component={BrainFogMemoryFogScreen}
          options={{ title: "Brain & Memory Fog" }}
        />

        {/* CycleIrregularityTimelineScreen */}
        <Stack.Screen
          name="CycleIrregularityTimelineScreen"
          component={CycleIrregularityTimelineScreen}
          options={{ title: "Cycle Irregularity Timeline" }}
        />

        <Stack.Screen
        name="DoctorConsultationPrepScreen"
        component={DoctorConsultationPrepScreen}
        options={{ headerShown: false }}
        />

       <Stack.Screen
        name="DietPlannerScreen"
        component={DietPlannerScreen}
        options={{ headerShown: false }}
        />  

       <Stack.Screen
        name="SymptomTrackerScreen"
        component={SymptomTrackerScreen}
        options={{ headerShown: false }}
        />

       <Stack.Screen
        name="LearnFeature"
        component={LearnFeature}
        options={{ headerShown: false }}
        />

        <Stack.Screen
        name="JournalScreen"
        component={JournalScreen}
        options={{ headerShown: false }}
        />


      </Stack.Navigator>
    </NavigationContainer>
  );
}