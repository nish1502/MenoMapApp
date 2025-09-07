import React from "react";
import { View, ScrollView, StyleSheet, Text } from "react-native";
import { Card, Title, Button } from "react-native-paper";
import SymptomCard from "../../components/SymptomCard";
import ChartCard from "../../components/ChartCard";

export default function HomeScreen({ navigation }) {
  // 👉 Later you can replace this with Firebase user data
  const userName = "Nishita";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      {/* Greeting */}
      <Text style={styles.header}>👋 Welcome, {userName}!</Text>

      {/* Symptom Tracker Card */}
      <SymptomCard
        title="Symptom Tracker"
        description="Log your daily menopause symptoms and track patterns."
        buttonText="Track Now"
        onPress={() => navigation.navigate("SymptomTrackerScreen")}
      />

      {/* Cycle Timeline Card */}
      <ChartCard
        title="Cycle Timeline"
        description="View your period and menopause transition timeline."
        chartType="line"
        onPress={() => navigation.navigate("CycleTimelineScreen")}
      />

      {/* Brain Fog Log Card */}
      <SymptomCard
        title="Brain Fog & Memory"
        description="Log cognitive symptoms and get tips to improve focus."
        buttonText="Log Now"
        onPress={() => navigation.navigate("BrainFogLogScreen")}
      />

      {/* Quick Access Buttons */}
      <Card style={styles.quickCard}>
        <Card.Content>
          <Title style={styles.quickTitle}>⚡ Quick Actions</Title>
          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              style={styles.button}
              labelStyle={styles.buttonLabel}
              onPress={() => navigation.navigate("RegionalDietPlannerScreen")}
            >
              Diet Planner
            </Button>
            <Button
              mode="contained"
              style={styles.button}
              labelStyle={styles.buttonLabel}
              onPress={() => navigation.navigate("SymptomCoachScreen")}
            >
              Symptom Coach
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFE5EC",
    padding: 15,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#FB6F92",
    textAlign: "center",
  },
  quickCard: {
    marginTop: 20,
    backgroundColor: "#FFB3C6",
    borderRadius: 15,
    padding: 10,
  },
  quickTitle: {
    color: "#FF8FAB",
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    fontSize: 18,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: "#FF8FAB",
    borderRadius: 8,
  },
  buttonLabel: {
    color: "white",
    fontWeight: "bold",
  },
});
