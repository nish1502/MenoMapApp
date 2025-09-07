import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Card, Title, Paragraph } from "react-native-paper";

export default function ReliefTrackerScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Relief Tracker</Text>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Yoga</Title>
          <Paragraph>Hot flashes reduced by 30% after 5 days of yoga.</Paragraph>
        </Card.Content>
      </Card>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Herbal Tea</Title>
          <Paragraph>Ashwagandha tea helped reduce fatigue and stress.</Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFE5EC", padding: 10 },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF8FAB",
    marginBottom: 10,
    textAlign: "center",
  },
  card: { marginVertical: 8, backgroundColor: "#FFB3C6" },
});

