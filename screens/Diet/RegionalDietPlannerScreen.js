import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Card, Title, Paragraph, Button } from "react-native-paper";

const diets = {
  South: [
    "Ragi dosa and idli for calcium.",
    "Moringa (drumstick) dishes for hormonal balance.",
    "Coconut chutneys and sambhar with veggies.",
  ],
  North: [
    "Paneer curries and dals for protein.",
    "Whole wheat rotis with greens.",
    "Lassi and curd for bone health.",
  ],
  East: [
    "Fish curry with rice for omega-3s.",
    "Leafy greens like spinach and mustard leaves.",
    "Lightly spiced lentil soups.",
  ],
  West: [
    "Bajra roti with buttermilk.",
    "Groundnut and jaggery laddoos.",
    "Seasonal vegetable curries.",
  ],
};

export default function RegionalDietPlannerScreen() {
  const [region, setRegion] = useState("South");

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🥗 Regional Diet Planner</Text>

      {/* Region Selector */}
      <View style={styles.buttonRow}>
        {Object.keys(diets).map((r) => (
          <Button
            key={r}
            mode={region === r ? "contained" : "outlined"}
            onPress={() => setRegion(r)}
            buttonColor={region === r ? "#FF8FAB" : "#fff"}
            textColor={region === r ? "white" : "#FF8FAB"}
            style={styles.button}
          >
            {r}
          </Button>
        ))}
      </View>

      {/* Diet Suggestions */}
      {diets[region].map((item, index) => (
        <Card key={index} style={styles.card}>
          <Card.Content>
            <Title>{region} Meal {index + 1}</Title>
            <Paragraph>{item}</Paragraph>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFE5EC", padding: 10 },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF8FAB",
    marginBottom: 16,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 16,
  },
  button: { margin: 4, borderColor: "#FF8FAB" },
  card: { marginVertical: 8, backgroundColor: "#FFB3C6" },
});
