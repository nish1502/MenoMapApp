import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, ScrollView } from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function BrainFogTrackerScreen() {
  const [clarity, setClarity] = useState(5);
  const [notes, setNotes] = useState("");
  const [weeklyData, setWeeklyData] = useState([6, 7, 5, 8, 4, 7, 6]);
  const [tip, setTip] = useState("Try magnesium-rich snacks to improve focus.");

  const updateClarity = (value) => {
    setClarity(value);
    // Example AI-based tip logic
    if (value <= 4) setTip("Try a short walk or a 5-min breathing exercise for better focus.");
    else if (value <= 7) setTip("Stay hydrated and take short screen breaks.");
    else setTip("Great clarity! Maintain it with good sleep and nutrition.");
  };

  const saveEntry = () => {
    const newData = [...weeklyData];
    newData.shift();
    newData.push(clarity);
    setWeeklyData(newData);
    setNotes("");
    alert("Clarity entry saved!");
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Brain Fog Tracker</Text>

      {/* Clarity Rating Section */}
      <View style={styles.section}>
        <Text style={styles.label}>How clear did your mind feel today?</Text>
        <Text style={styles.clarityValue}>{clarity}/10</Text>

        <View style={styles.sliderContainer}>
          {[...Array(10)].map((_, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.circle, clarity === i + 1 && styles.activeCircle]}
              onPress={() => updateClarity(i + 1)}
            >
              <Text style={styles.circleText}>{i + 1}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Notes or Triggers</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Didn’t sleep well last night"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={saveEntry}>
        <Text style={styles.buttonText}>Save Entry</Text>
      </TouchableOpacity>

      {/* Weekly Trend Chart */}
      <View style={styles.section}>
        <Text style={styles.label}>Weekly Clarity Trend</Text>
        <LineChart
          data={{
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{ data: weeklyData }],
          }}
          width={screenWidth - 40}
          height={220}
          yAxisSuffix=""
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: "#fff0f5",
            backgroundGradientFrom: "#ffe6f0",
            backgroundGradientTo: "#fff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(212, 107, 154, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(80, 50, 70, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: "5",
              strokeWidth: "2",
              stroke: "#d46b9a",
            },
          }}
          style={styles.chart}
        />
      </View>

      {/* AI Tip Section */}
      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>AI Coach Tip</Text>
        <Text style={styles.tipText}>{tip}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff0f5", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: "#d46b9a", marginBottom: 20, textAlign: "center" },
  section: { marginBottom: 25 },
  label: { fontSize: 16, fontWeight: "bold", color: "#a87fa3", marginBottom: 10 },
  clarityValue: { fontSize: 18, color: "#8c5c80", textAlign: "center", marginBottom: 10 },

  sliderContainer: { flexDirection: "row", justifyContent: "space-between" },
  circle: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: "#d46b9a",
    justifyContent: "center", alignItems: "center",
  },
  activeCircle: { backgroundColor: "#d46b9a" },
  circleText: { color: "#8c5c80", fontWeight: "bold" },

  input: {
    borderWidth: 1, borderColor: "#d8a7b1", borderRadius: 10, padding: 10,
    backgroundColor: "#fff", minHeight: 60, textAlignVertical: "top",
  },

  button: {
    backgroundColor: "#d46b9a", padding: 12, borderRadius: 10, alignItems: "center",
    marginBottom: 30, marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },

  chart: { borderRadius: 16, marginVertical: 10 },

  tipCard: {
    backgroundColor: "#ffe6f0", borderRadius: 15, padding: 15,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5, elevation: 3,
  },
  tipTitle: { fontSize: 16, fontWeight: "bold", color: "#d46b9a", marginBottom: 5 },
  tipText: { fontSize: 14, color: "#8c5c80" },
});