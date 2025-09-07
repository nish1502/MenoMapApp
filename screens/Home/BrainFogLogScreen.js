import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Card, Title, TextInput, Button, Paragraph } from "react-native-paper";

export default function BrainFogLogScreen() {
  const [memory, setMemory] = useState("");
  const [focus, setFocus] = useState("");
  const [confusion, setConfusion] = useState("");
  const [logs, setLogs] = useState([]);

  const handleSubmit = () => {
    if (!memory && !focus && !confusion) {
      alert("Please enter at least one symptom before logging.");
      return;
    }

    const newLog = {
      id: Date.now(),
      memory,
      focus,
      confusion,
      date: new Date().toLocaleDateString(),
    };

    setLogs([newLog, ...logs]); // prepend new log
    setMemory("");
    setFocus("");
    setConfusion("");
    alert("Symptoms logged successfully!");
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.header}>🧠 Brain Fog & Memory Log</Title>
      <Paragraph style={styles.subHeader}>
        Track your cognitive symptoms daily to see patterns and improvements.
      </Paragraph>

      {/* Input Form */}
      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Memory Issues (e.g., forgetfulness)"
            value={memory}
            onChangeText={setMemory}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Focus & Attention"
            value={focus}
            onChangeText={setFocus}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Confusion or Disorientation"
            value={confusion}
            onChangeText={setConfusion}
            mode="outlined"
            style={styles.input}
          />
          <Button
            mode="contained"
            style={styles.button}
            onPress={handleSubmit}
          >
            Log Symptoms
          </Button>
        </Card.Content>
      </Card>

      {/* Logged Entries */}
      <Title style={styles.logTitle}>📌 Previous Logs</Title>
      {logs.length === 0 ? (
        <Paragraph style={{ color: "#777", textAlign: "center" }}>
          No logs yet. Start tracking your symptoms!
        </Paragraph>
      ) : (
        logs.map((log) => (
          <Card key={log.id} style={styles.logCard}>
            <Card.Content>
              <Paragraph style={{ fontWeight: "bold" }}>Date: {log.date}</Paragraph>
              {log.memory ? <Paragraph>📝 Memory: {log.memory}</Paragraph> : null}
              {log.focus ? <Paragraph>🎯 Focus: {log.focus}</Paragraph> : null}
              {log.confusion ? <Paragraph>😵 Confusion: {log.confusion}</Paragraph> : null}
            </Card.Content>
          </Card>
        ))
      )}
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
  },
  subHeader: {
    fontSize: 16,
    color: "#FF8FAB",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#FFB3C6",
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
    backgroundColor: "#FFE5EC",
  },
  button: {
    backgroundColor: "#FF8FAB",
  },
  logTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    color: "#FB6F92",
  },
  logCard: {
    backgroundColor: "#FFC2D1",
    marginVertical: 6,
    borderRadius: 10,
  },
});
