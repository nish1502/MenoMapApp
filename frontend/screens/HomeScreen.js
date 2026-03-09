import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons"; // --- We need icons!
import COLORS from "../constants/colors";



// --- Updated features array with icons ---
const features = [
  {
    id: "1",
    title: "Symptom Tracker",
    desc: "Log daily symptoms",
    icon: "medkit-outline"
  },
  {
    id: "5",
    title: "Cycle Tracker",
    desc: "Log & predict cycles",
    icon: "calendar-outline"
  },
  {
    id: "8",
    title: "Journal",
    desc: "Reflect on your day",
    icon: "book-outline"
  },
  {
    id: "7",
    title: "Learn",
    desc: "Read expert articles",
    icon: "information-circle-outline"
  },
  {
    id: "4",
    title: "Brain Fog",
    desc: "Monitor mental clarity",
    icon: "cloudy-outline"
  },
  {
    id: "2",
    title: "Diet Planner",
    desc: "Personalized meals",
    icon: "restaurant-outline"
  },
  {
    id: "3",
    title: "Relief Tracker",
    desc: "Find what helps",
    icon: "sparkles-outline"
  },
  {
    id: "6",
    title: "Doctor Report",
    desc: "Prepare for visits",
    icon: "document-text-outline"
  },
];

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textPrimary
  },
  subGreeting: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 80, // Space for the bottom nav
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    margin: 8,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    minHeight: 160, // Give cards a uniform height
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  desc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  desc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default function HomeDashboard({ route, navigation }) {
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const loadUserName = async () => {
      // 1. Try to get from route params
      if (route.params?.userName) {
        setUserName(route.params.userName);
        return;
      }

      // 2. Try to get from userProfile in AsyncStorage
      try {
        const profileStr = await AsyncStorage.getItem("userProfile");
        if (profileStr) {
          const profile = JSON.parse(profileStr);
          if (profile?.name) {
            setUserName(profile.name);
            return;
          }
        }

        // 3. Fallback to userSession name
        const sessionStr = await AsyncStorage.getItem("userSession");
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (session?.name) {
            setUserName(session.name);
          }
        }
      } catch (e) {
        console.warn("Error loading user name:", e);
      }
    };

    loadUserName();
  }, [route.params?.userName]);

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        switch (item.id) {
          case "1": navigation.navigate("SymptomTrackerScreen"); break;
          case "2": navigation.navigate("DietPlannerScreen"); break;
          case "3": navigation.navigate("ReliefTrackerScreen"); break;
          case "4": navigation.navigate("BrainFogMemoryFogScreen"); break;
          case "5": navigation.navigate("CycleIrregularityTimelineScreen"); break;
          case "6": navigation.navigate("DoctorConsultationPrepScreen"); break;
          case "7": navigation.navigate("LearnFeature"); break;
          case "8": navigation.navigate("JournalScreen"); break;
        }
      }}
    >
      <View style={styles.cardIconContainer}>
        <Icon name={item.icon} size={30} color={COLORS.accent} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc}>{item.desc}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={"#FFFFFF"} />

      {/* --- Header --- */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, {userName} 👋</Text>
        <Text style={styles.subGreeting}>Welcome back to MenoMap</Text>
      </View>

      {/* --- Features Grid --- */}
      <FlatList
        data={features}
        renderItem={renderCard}
        keyExtractor={item => item.id}
        numColumns={2} // This creates the 2-column grid
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

    </SafeAreaView>
  );

}
