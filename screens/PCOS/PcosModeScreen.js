import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Text } from "react-native";
import { Card, Button, TextInput, Title, Paragraph } from "react-native-paper";

export default function PcosModeScreen() {
  const [symptom, setSymptom] = useState("");
  const [symptomLog, setSymptomLog] = useState([]);

  const addSymptom = () => {
    if (symptom.trim() === "") return;
    setSymptomLog([...symptomLog, symptom]);
    setSymptom("");
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.header}>PCOS Mode</Title>

      {/* Symptom Input */}
      <Card style={styles.card}>
        <Card.Content>
          <Paragraph style={styles.text}>Log your PCOS symptoms for better tracking.</Paragraph>
          <TextInput
            label="Enter Symptom"
            value={symptom}
            onChangeText={setSymptom}
            style={styles.input}
            mode="outlined"
            outlineColor="#FFC2D1"
            activeOutlineColor="#FF8FAB"
          />
          <Button
            mode="contained"
            buttonColor="#FF8FAB"
            style={styles.button}
            onPress={addSymptom}
          >
            Add Symptom
          </Button>
        </Card.Content>
      </Card>

      {/* Symptom Log */}
      {symptomLog.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={{ color: "#FB6F92" }}>Symptom Log</Title>
            {symptomLog.map((s, index) => (
              <Text key={index} style={styles.logText}>
                • {s}
              </Text>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Tips / Recommendations */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={{ color: "#FB6F92" }}>PCOS Tips</Title>
          <Paragraph style={styles.text}>
            • Maintain a balanced diet rich in fiber and low in sugar.{"\n"}
            • Include regular exercise and stress management.{"\n"}
            • Track your cycle and symptoms for better insights.{"\n"}
            • Consult your doctor regularly for check-ups.
          </Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFE5EC", padding: 15 },
  header: { fontSize: 24, fontWeight: "bold", color: "#FB6F92", marginBottom: 15 },
  card: { marginBottom: 20, backgroundColor: "#FFB3C6", borderRadius: 15, paddingVertical: 10 },
  text: { color: "#000000", marginBottom: 10 },
  input: { marginBottom: 10, backgroundColor: "#FFE5EC" },
  button: { marginTop: 5 },
  logText: { color: "#000000", fontSize: 16, marginBottom: 5 },
});
