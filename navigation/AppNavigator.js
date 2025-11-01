import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; // <-- 1. Import the Auth "brain"

// --- Import ALL Screens ---
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
// Correct paths to Auth screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import OnboardingScreen from '../screens/Auth/OnboardingScreen';

// Main App Screens
import HomeScreen from '../screens/HomeScreen';
import SymptomTrackerScreen from '../screens/SymptomTrackerScreen';
import DietPlannerScreen from '../screens/DietPlannerScreen';
import ReliefTrackerScreen from '../screens/ReliefTrackerScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Other Screens
import BrainFogMemoryFogScreen from "../screens/BrainFogMemoryFogScreen";
import CycleIrregularityTimelineScreen from "../screens/CycleIrregularityTimelineScreen";
import DoctorConsultationPrepScreen from "../screens/DoctorConsultationPrepScreen";
import DoctorConsultationRoomScreen from "../screens/DoctorConsultationRoomScreen";


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- STACK 1: The Main App (with tabs) ---
// This is what a logged-in, onboarded user sees
function AppStack() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'SymptomTracker') {
            iconName = focused ? 'clipboard' : 'clipboard-outline';
          } else if (route.name === 'DietPlanner') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'ReliefTracker') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#A076A0', // MenoMap Purple
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: '#FFFFFF' },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="SymptomTracker" component={SymptomTrackerScreen} />
      <Tab.Screen name="DietPlanner" component={DietPlannerScreen} />
      <Tab.Screen name="ReliefTracker" component={ReliefTrackerScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// --- STACK 2: The Auth Flow (Login/Register) ---
// This is what a logged-out user sees
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      {/* Use the correct screen components */}
      <Stack.Screen name="Login" component={LoginScreen} /> 
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// --- STACK 3: The Onboarding Flow ---
// This is what a new user sees after logging in for the first time
function OnboardingStack() {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

// --- The Main Navigator (The "Traffic Cop") ---
// This component decides which stack to show
// It no longer needs a NavigationContainer
export default function AppNavigator() {
  // Get all state from the AuthContext
  const { token, isLoading, hasOnboarded } = useAuth();

  // 1. Show a loading screen while checking storage
  if (isLoading) {
    return <SplashScreen />; // Show your splash screen
  }

  // 2. No token? Show Auth flow.
  if (!token) {
    return <AuthStack />;
  }

  // 3. Token exists, but no onboarding? Show Onboarding flow.
  if (token && !hasOnboarded) {
    return <OnboardingStack />;
  }

  // 4. Token exists AND onboarded? Show the main app.
  // We wrap the AppStack (Tabs) in a StackNavigator to allow for
  // modal screens or other screens outside the tab bar (like Doctor Consultation)
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainAppTabs" component={AppStack} />
        
        {/* Add other full-screen modals/screens here */}
        <Stack.Screen
          name="BrainFogMemoryFogScreen"
          component={BrainFogMemoryFogScreen}
          options={{ headerShown: true, title: "Brain & Memory Fog" }}
        />
        <Stack.Screen
          name="CycleIrregularityTimelineScreen"
          component={CycleIrregularityTimelineScreen}
          options={{ headerShown: true, title: "Cycle Irregularity Timeline" }}
        />
         <Stack.Screen
          name="DoctorConsultationPrepScreen"
          component={DoctorConsultationPrepScreen}
          options={{ headerShown: true, title: "Consultation Prep" }}
        />
        <Stack.Screen
          name="DoctorConsultationRoomScreen"
          component={DoctorConsultationRoomScreen}
          options={{ headerShown: true, title: "Consultation Room" }}
        />
    </Stack.Navigator>
  );
};
