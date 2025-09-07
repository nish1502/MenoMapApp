import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, Dimensions, View } from "react-native";
import { Card, Title, Button } from "react-native-paper";
import Slider from "@react-native-community/slider"; // ✅ install if not already
import { LineChart } from "react-native-chart-kit";

export default function CycleTimelineScreen() {
  const [severityData, setSeverityData] = useState([]);
  const [currentSeverity, setCurrentSeverity] = useState(3);

  const logDay = () => {
    if (severityData.length >= 30) {
      alert("30 days already logged!");
      return;
    }
    setSeverityData([...severityData, currentSeverity]);
    alert(`Day ${severityData.length + 1} logged with severity: ${currentSeverity}`);
  };

  const data = {
    labels: severityData.map((_, i) => `Day ${i + 1}`),
    datasets: [
      {
        data: severityData,
        color: (opacity = 1) => `rgba(251, 111, 146, ${opacity})`,
        strokeWidth: 3,
      },
    ],
    legend: ["Symptom Severity"],
  };

  const chartConfig = {
    backgroundGradientFrom: "#FFE5EC",
    backgroundGradientTo: "#FFB3C6",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 143, 171, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#FB6F92",
    },
  };

  const screenWidth = Dimensions.get("window").width - 30;

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.header}>📊 Cycle Timeline</Title>
      <Text style={styles.subHeader}>
        Log daily symptom severity (1–5) and track trends.
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          {severityData.length > 0 ? (
            <LineChart
              data={data}
              width={screenWidth}
              height={250}
              chartConfig={chartConfig}
              bezier
              style={{ borderRadius: 16 }}
            />
          ) : (
            <Text style={styles.noData}>No data logged yet. Start today!</Text>
          )}

          <View style={styles.sliderBox}>
            <Text style={styles.sliderLabel}>Severity: {currentSeverity}</Text>
            <Slider
              style={{ width: "100%", height: 40 }}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={currentSeverity}
              onValueChange={setCurrentSeverity}
              minimumTrackTintColor="#FB6F92"
              maximumTrackTintColor="#ddd"
              thumbTintColor="#FF8FAB"
            />
          </View>

          <Button mode="contained" style={styles.button} onPress={logDay}>
            Log Day {severityData.length + 1}
          </Button>
        </Card.Content>
      </Card>
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
  },
  noData: {
    textAlign: "center",
    color: "#777",
    marginVertical: 10,
  },
  sliderBox: {
    marginTop: 20,
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FB6F92",
    marginBottom: 5,
  },
  button: {
    marginTop: 10,
    backgroundColor: "#FF8FAB",
  },
});
