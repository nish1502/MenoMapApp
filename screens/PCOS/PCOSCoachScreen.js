import React, { useState, useEffect } from "react";
import { ScrollView, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Card, Title, Paragraph } from "react-native-paper";

export default function PCOSCoachScreen({ route }) {
  const { selectedSymptoms } = route.params || [];
  const [advice, setAdvice] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔑 Add your OpenRouter API key here
  const OPENROUTER_API_KEY = "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";

  useEffect(() => {
    if (!selectedSymptoms || !selectedSymptoms.length) return;

    const fetchAdvice = async () => {
      setLoading(true);
      try {
        const prompt = `I have PCOS symptoms: ${selectedSymptoms.join(
          ", "
        )}. Provide actionable advice for each symptom in short sentences.`;
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            messages: [{ role: "user", content: prompt }],
          }),
        });
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "No advice available.";
        // Split by line or symptom
        setAdvice(text.split("\n").filter((t) => t.trim() !== ""));
      } catch (error) {
        Alert.alert("Error", "Failed to fetch advice from AI.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdvice();
  }, [selectedSymptoms]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>🤖 AI PCOS Coach</Text>

      {loading && <ActivityIndicator size="large" color="#FF8FAB" style={{ marginTop: 20 }} />}

      {!loading &&
        advice.length > 0 &&
        advice.map((item, index) => (
          <Card key={index} style={styles.card}>
            <Card.Content>
              <Paragraph style={styles.cardText}>{item}</Paragraph>
            </Card.Content>
          </Card>
        ))}

      {!loading && (!selectedSymptoms || !selectedSymptoms.length) && (
        <Text style={styles.noSymptomsText}>
          No symptoms selected. Please track your PCOS symptoms first.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFE5EC" },
  content: { padding: 16, paddingBottom: 30 },
  header: { fontSize: 26, fontWeight: "bold", color: "#FF8FAB", marginBottom: 16, textAlign: "center" },
  card: { marginVertical: 10, borderRadius: 16, backgroundColor: "#FFB3C6", elevation: 2 },
  cardText: { fontSize: 15, color: "#333" },
  noSymptomsText: { textAlign: "center", fontSize: 16, color: "#FF8FAB", marginTop: 20 },
});
