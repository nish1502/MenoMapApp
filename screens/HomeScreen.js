import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  StatusBar 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons"; // --- We need icons!

// --- Soft Pink Theme Colors ---
const COLORS = {
  background: '#FFFBFB', // Very pale pink
  accent: '#FFB6C1',     // Main "Soft Pink"
  accentLight: '#FFF0F1', // Lightest pink for cards
  textPrimary: '#4A4A4A',  // Dark Grey
  textSecondary: '#8D8D8D', // Medium Grey
  white: '#FFFFFF',
  cardBorder: '#F0E4E4',
  shadow: '#FFC0CB',     // Soft pink shadow
};

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

export default function HomeScreen({ navigation }) {
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* --- Header --- */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, Aditi 👋</Text>
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

      {/* --- Bottom Navigation --- */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("HomeScreen")}>
          <Icon name="home" size={24} color={COLORS.accent} />
          <Text style={[styles.navText, { color: COLORS.accent }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("DoctorConsultationPrepScreen")}>
          <Icon name="analytics-outline" size={24} color={COLORS.textSecondary} />
          <Text style={styles.navText}>Contact Doc</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("ProfileScreen")}>
          <Icon name="person-outline" size={24} color={COLORS.textSecondary} />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- New Aesthetic Stylesheet ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background, 
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
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70, // Slightly taller for a modern feel
    backgroundColor: COLORS.white,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    // Removed the old pink background and border radius
  },
  navButton: { 
    justifyContent: "center", 
    alignItems: "center" 
  },
  navText: { 
    fontSize: 12, 
    color: COLORS.textSecondary, 
    marginTop: 2 
  },
});