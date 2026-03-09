// AppNavigator.js
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import COLORS from "../constants/colors";

// --- Screens ---
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SplashScreen from "../screens/SplashScreen";
import WelcomeScreen from "../screens/WelcomeScreen";

// --- Features ---
import BrainFogMemoryFogScreen from "../screens/BrainFogMemoryFogScreen";
import CycleIrregularityTimelineScreen from "../screens/CycleIrregularityTimelineScreen";
import DietPlannerScreen from "../screens/DietPlannerScreen";
import DoctorConsultationPrepScreen from "../screens/DoctorConsultationPrepScreen";
import JournalScreen from "../screens/JournalScreen";
import LearnFeature from "../screens/LearnFeature";
import ReliefTrackerScreen from "../screens/ReliefTrackerScreen";
import SymptomTrackerScreen from "../screens/SymptomTrackerScreen";


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = focused ? "home" : "home-outline";
          else if (route.name === "Reports") iconName = focused ? "document-text" : "document-text-outline";
          else if (route.name === "Profile") iconName = focused ? "person" : "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.darkPink,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: { height: 60, paddingBottom: 8, borderTopColor: COLORS.cardBorder },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="Reports" component={DoctorConsultationPrepScreen} options={{ title: "Reports" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}

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

        <Stack.Screen
          name="HomeScreen"
          component={MainTabs}
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