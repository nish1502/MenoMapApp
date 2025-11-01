// HomeScreen.js
import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const features = [
  { id: "1", title: "SymptomTrackerScreen", desc: "Track your transition stage" },
  { id: "2", title: "AI Symptom Coach", desc: "Get AI guidance for symptoms" },
  { id: "3", title: "Diet Planner", desc: "Personalized meal plans" },
  { id: "4", title: "Relief Tracker", desc: "Track what helps you feel better" },
  { id: "5", title: "Brain Fog Tracker", desc: "Monitor mental clarity" },
  { id: "6", title: "Cycle Irregularity Timeline", desc: "Log & predict your cycles" },
  { id: "7", title: "Doctor Consultation Report", desc: "Prepare for appointments" },
];

export default function HomeScreen({ navigation }) {
  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        switch (item.id) {
          case "1": navigation.navigate("SymptomTrackerScreen"); break;
          case "2": navigation.navigate("AISymptomCoachScreen"); break;
          case "3": navigation.navigate("DietPlannerScreen"); break;
          case "4": navigation.navigate("ReliefTrackerScreen"); break;
          case "5": navigation.navigate("BrainFogMemoryFogScreen"); break;
          case "6": navigation.navigate("CycleIrregularityTimelineScreen"); break;
          case "7": navigation.navigate("DoctorConsultationRoomScreen"); break;
        }
      }}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc}>{item.desc}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, Aditi 👋</Text>
        <Text style={styles.subGreeting}>Welcome back to MenoMap</Text>
      </View>

      <FlatList
        data={features}
        renderItem={renderCard}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("HomeScreen")}>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("ReliefTrackerScreen")}>
          <Text style={styles.navText}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("ProfileScreen")}>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff0f5", padding: 15 },
  header: { marginBottom: 15 },
  greeting: { fontSize: 24, fontWeight: "bold", color: "#d46b9a" },
  subGreeting: { fontSize: 14, color: "#a87fa3", marginTop: 3 },

  card: {
    backgroundColor: "#ffe6f0",
    width: "100%", // full width for single column
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: "flex-start", // align text to the left
    justifyContent: "center",
  },
  title: { fontSize: 16, fontWeight: "bold", color: "#a87fa3", marginBottom: 5 },
  desc: { fontSize: 14, color: "#8c5c80" },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 60,
    backgroundColor: "#ffd6e8",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 5,
    elevation: 5,
  },
  navButton: { justifyContent: "center", alignItems: "center" },
  navText: { fontSize: 12, color: "#d46b9a", marginTop: 2 },
});