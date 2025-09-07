import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Card, Title, Paragraph } from "react-native-paper";

export default function SymptomCoachScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>🤖 AI Symptom Coach</Text>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>🔥 Hot Flashes</Title>
          <Paragraph style={styles.cardText}>
            Try deep breathing, sipping cold water, or taking a cool shower.
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>💭 Mood Swings</Title>
          <Paragraph style={styles.cardText}>
            Light exercises, meditation, and journaling can bring balance.
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>😴 Sleep Issues</Title>
          <Paragraph style={styles.cardText}>
            Maintain a sleep routine, reduce caffeine, and practice relaxation.
          </Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFE5EC",
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FF8FAB",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    marginVertical: 10,
    borderRadius: 16,
    backgroundColor: "#FFB3C6",
    elevation: 2,
  },
  cardTitle: {
    color: "#FB6F92",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 6,
  },
  cardText: {
    fontSize: 15,
    color: "#333",
  },
});
