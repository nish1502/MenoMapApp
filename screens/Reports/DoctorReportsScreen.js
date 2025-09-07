import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Text } from "react-native";
import { Card, Button, Title, Paragraph, Divider } from "react-native-paper";

export default function DoctorReportScreen() {
  const [reportGenerated, setReportGenerated] = useState(false);

  const generateReport = () => {
    // Placeholder: Replace with real data from Firebase or ML backend
    setReportGenerated(true);
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.header}>Doctor Report</Title>

      <Card style={styles.card}>
        <Card.Content>
          <Paragraph style={styles.text}>
            Generate a comprehensive report of your symptoms, diet, cycle timeline, and relief logs.
          </Paragraph>
          <Button
            mode="contained"
            buttonColor="#FF8FAB"
            onPress={generateReport}
            style={styles.button}
          >
            {reportGenerated ? "Regenerate Report" : "Generate Report"}
          </Button>
        </Card.Content>
      </Card>

      {reportGenerated && (
        <Card style={styles.reportCard}>
          <Card.Content>
            <Title style={{ color: "#FB6F92" }}>Your Report</Title>
            <Divider style={{ marginVertical: 10 }} />
            <Text style={styles.reportText}>- Symptoms logged: Headache, Fatigue</Text>
            <Text style={styles.reportText}>- Cycle timeline: Regular</Text>
            <Text style={styles.reportText}>- Diet adherence: 80%</Text>
            <Text style={styles.reportText}>- Relief improvement: 70%</Text>
            <Button
              mode="contained"
              buttonColor="#FB6F92"
              onPress={() => alert("Report saved/downloaded!")}
              style={[styles.button, { marginTop: 15 }]}
            >
              Save / Download
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFE5EC", padding: 15 },
  header: { fontSize: 24, fontWeight: "bold", color: "#FB6F92", marginBottom: 20 },
  card: { marginBottom: 20, backgroundColor: "#FFB3C6", borderRadius: 15 },
  reportCard: { backgroundColor: "#FF8FAB", borderRadius: 15, paddingVertical: 10 },
  text: { color: "#000000", marginBottom: 15 },
  button: { marginTop: 10 },
  reportText: { color: "#000000", fontSize: 16, marginBottom: 5 },
});
