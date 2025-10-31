import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card, Button, Title } from "react-native-paper";

export default function PCOSHomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>💜 PCOS Mode</Text>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Manage PCOS Symptoms</Title>
        </Card.Content>
        <Card.Actions style={styles.actions}>
          <Button
            mode="contained"
            style={styles.button}
            labelStyle={styles.buttonLabel}
            onPress={() => navigation.navigate("PCOSSymptomTrackerScreen")}
          >
            Track Symptoms
          </Button>
        </Card.Actions>

        <Card.Actions style={styles.actions}>
          <Button
            mode="contained"
            style={styles.button}
            labelStyle={styles.buttonLabel}
            onPress={() => navigation.navigate("PCOSCoachScreen")}
          >
            AI PCOS Coach
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFE5EC", padding: 20, justifyContent: "center" },
  header: { fontSize: 26, fontWeight: "bold", color: "#FF8FAB", textAlign: "center", marginBottom: 20 },
  card: { borderRadius: 16, backgroundColor: "#FFB3C6", paddingVertical: 15 },
  cardTitle: { color: "#FB6F92", fontWeight: "bold", fontSize: 18, textAlign: "center" },
  actions: { justifyContent: "center", marginTop: 10 },
  button: { backgroundColor: "#FF8FAB", width: "90%" },
  buttonLabel: { color: "#FFF", fontWeight: "bold" },
});
