import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, Alert } from "react-native";
import { Card, Checkbox, Button, Title, Paragraph } from "react-native-paper";

export default function SymptomTrackerScreen() {
  // Example symptoms list
  const [symptoms, setSymptoms] = useState([
    { id: 1, name: "🔥 Hot Flashes", checked: false },
    { id: 2, name: "😔 Mood Swings", checked: false },
    { id: 3, name: "😴 Sleep Disturbance", checked: false },
    { id: 4, name: "🥱 Fatigue", checked: false },
    { id: 5, name: "🧠 Brain Fog", checked: false },
  ]);

  const toggleSymptom = (id) => {
    setSymptoms((prev) =>
      prev.map((symptom) =>
        symptom.id === id ? { ...symptom, checked: !symptom.checked } : symptom
      )
    );
  };

  const saveSymptoms = () => {
    const selected = symptoms.filter((s) => s.checked).map((s) => s.name);
    Alert.alert(
      "✅ Symptoms Saved!",
      selected.length ? selected.join(", ") : "No symptoms selected today."
    );
    // 🔧 Here you can integrate Firebase/AsyncStorage to persist data
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.header}>Daily Symptom Tracker</Title>
      <Paragraph style={styles.subHeader}>
        Check the symptoms you are experiencing today.
      </Paragraph>

      {symptoms.map((symptom) => (
        <Card key={symptom.id} style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.symptomText}>{symptom.name}</Text>
            <Checkbox
              status={symptom.checked ? "checked" : "unchecked"}
              onPress={() => toggleSymptom(symptom.id)}
              color="#FF8FAB"
            />
          </Card.Content>
        </Card>
      ))}

      <Button
        mode="contained"
        style={styles.saveButton}
        labelStyle={{ color: "white", fontWeight: "bold" }}
        onPress={saveSymptoms}
      >
        Save Symptoms
      </Button>
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#FB6F92",
    marginBottom: 5,
    textAlign: "center",
  },
  subHeader: {
    fontSize: 16,
    color: "#FF8FAB",
    marginBottom: 15,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFB3C6",
    marginBottom: 10,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  symptomText: {
    fontSize: 16,
    color: "#000",
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: "#FF8FAB",
    borderRadius: 10,
    paddingVertical: 5,
  },
});
