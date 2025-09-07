import React from "react";
import { StyleSheet } from "react-native";
import { Card, Title, Paragraph, Button } from "react-native-paper";

export default function SymptomCard({ title, description, buttonText, onPress }) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.title}>{title}</Title>
        <Paragraph style={styles.description}>{description}</Paragraph>
      </Card.Content>
      <Card.Actions>
        <Button mode="contained" onPress={onPress} style={styles.button}>
          {buttonText || "Open"}
        </Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFB3C6",
    marginBottom: 15,
    borderRadius: 15,
  },
  title: {
    color: "#FF8FAB",
    fontWeight: "bold",
  },
  description: {
    color: "#000000",
    marginTop: 5,
  },
  button: {
    backgroundColor: "#FB6F92",
    marginTop: 10,
  },
});
