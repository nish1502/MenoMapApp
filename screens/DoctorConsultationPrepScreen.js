// screens/DoctorConsultationPrepScreen.js
import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

export default function DoctorConsultationPrepScreen({ navigation }) {
  // Dummy data from trackers
  const symptomSummary = ["Hot flashes", "Fatigue", "Mood swings"];
  const reliefSummary = ["Yoga", "Herbal Tea"];
  const dietNotes = ["High protein breakfast", "Magnesium-rich snacks"];
  const aiTips = ["Continue Yoga for 3 more days", "Hydrate well"];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Consultation Prep Report</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🩺 Symptom Summary</Text>
        {symptomSummary.map((s, i) => (
          <Text key={i} style={styles.cardText}>• {s}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌿 Relief Tracker Highlights</Text>
        {reliefSummary.map((r, i) => (
          <Text key={i} style={styles.cardText}>• {r}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🥗 Diet & Lifestyle Notes</Text>
        {dietNotes.map((d, i) => (
          <Text key={i} style={styles.cardText}>• {d}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🤖 AI Suggestions</Text>
        {aiTips.map((a, i) => (
          <Text key={i} style={styles.cardText}>• {a}</Text>
        ))}
      </View>

      <TouchableOpacity
        style={styles.joinBtn}
        onPress={() => navigation.navigate("DoctorConsultationRoomScreen")}
      >
        <Text style={styles.joinText}>Join Consultation</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff0f6", padding: 15 },
  header: { fontSize: 22, fontWeight: "700", color: "#6a0572", marginBottom: 15 },
  card: { backgroundColor: "#ffe6f0", padding: 12, borderRadius: 12, marginBottom: 12 },
  cardTitle: { fontWeight: "700", fontSize: 16, color: "#8a4baf", marginBottom: 6 },
  cardText: { fontSize: 14, color: "#333", marginVertical: 2 },
  joinBtn: { backgroundColor: "#b388eb", padding: 15, borderRadius: 30, alignItems: "center", marginTop: 10 },
  joinText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});