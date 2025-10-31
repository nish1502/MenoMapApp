// CycleIrregularityTimelineScreen.js
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, ScrollView, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Calendar } from "react-native-calendars";
import { Modalize } from "react-native-modalize";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;

export default function CycleIrregularityTimelineScreen() {
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDay, setSelectedDay] = useState("");
  const [periodStart, setPeriodStart] = useState(null);
  const [periodEnd, setPeriodEnd] = useState(null);
  const [notes, setNotes] = useState("");
  const [mood, setMood] = useState("");
  const [cycleAlert, setCycleAlert] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    loadCycleData();
  }, []);

  const loadCycleData = async () => {
    try {
      const savedData = await AsyncStorage.getItem("cycleData");
      if (savedData) {
        const data = JSON.parse(savedData);
        setMarkedDates(data.markedDates || {});
      }
      const alertStatus = await AsyncStorage.getItem("cycleAlert");
      if (alertStatus) setCycleAlert(alertStatus === "true");
    } catch (err) {
      console.log("Error loading cycle data:", err);
    }
  };

  const saveCycleData = async () => {
    try {
      await AsyncStorage.setItem("cycleData", JSON.stringify({ markedDates }));
      await AsyncStorage.setItem("cycleAlert", cycleAlert ? "true" : "false");
    } catch (err) {
      console.log("Error saving cycle data:", err);
    }
  };

  const onDayPress = (day) => {
    setSelectedDay(day.dateString);
    const dayData = markedDates[day.dateString] || {};
    setNotes(dayData.notes || "");
    setMood(dayData.mood || "");
    modalRef.current?.open();
  };

  const addPeriod = (type) => {
    if (!selectedDay) return;

    let updatedMarked = { ...markedDates };

    if (type === "start") setPeriodStart(selectedDay);
    if (type === "end") setPeriodEnd(selectedDay);

    if (periodStart && periodEnd) {
      // Mark all dates in range
      const start = new Date(periodStart);
      const end = new Date(periodEnd);
      let d = new Date(start);
      while (d <= end) {
        const dateStr = d.toISOString().split("T")[0];
        updatedMarked[dateStr] = { ...updatedMarked[dateStr], period: true };
        d.setDate(d.getDate() + 1);
      }
    }

    setMarkedDates(updatedMarked);
    saveCycleData();
  };

  const saveNotesAndMood = () => {
    let updatedMarked = { ...markedDates };
    updatedMarked[selectedDay] = { ...updatedMarked[selectedDay], notes, mood };
    setMarkedDates(updatedMarked);
    saveCycleData();
    modalRef.current?.close();
  };

  // Generate AI prediction for next cycle (simple example)
  const nextCyclePrediction = () => {
    if (periodStart && periodEnd) {
      const lastStart = new Date(periodStart);
      const lastEnd = new Date(periodEnd);
      const cycleLength = Math.round((lastEnd - lastStart) / (1000 * 60 * 60 * 24)) + 28; // assuming 28-day avg
      const nextStart = new Date(lastStart);
      nextStart.setDate(nextStart.getDate() + cycleLength);
      return `Your next cycle may start around ${nextStart.toDateString()}`;
    }
    return "Log your periods to get AI prediction";
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Cycle Tracker</Text>

      <Calendar
        onDayPress={onDayPress}
        markedDates={markedDates}
        markingType={"period"}
        theme={{
          selectedDayBackgroundColor: "#d46b9a",
          todayTextColor: "#d46b9a",
          arrowColor: "#d46b9a",
        }}
        // swipeable months
        enableSwipeMonths={true}
      />

      <View style={styles.alertContainer}>
        <Text>Enable Cycle Alerts:</Text>
        <Switch value={cycleAlert} onValueChange={(val) => setCycleAlert(val)} />
      </View>

      <View style={styles.aiCard}>
        <Text style={styles.aiText}>{nextCyclePrediction()}</Text>
      </View>

      {/* Bottom Sheet for Logging Notes/Moods */}
      <Modalize ref={modalRef} adjustToContentHeight>
        <View style={{ padding: 20 }}>
          <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Log / Edit for {selectedDay}</Text>
          <TextInput
            placeholder="Notes or triggers"
            value={notes}
            onChangeText={setNotes}
            style={styles.input}
          />
          <TextInput
            placeholder="Mood"
            value={mood}
            onChangeText={setMood}
            style={styles.input}
          />

          <View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: 10 }}>
            <TouchableOpacity style={styles.periodButton} onPress={() => addPeriod("start")}>
              <Text>Set Start</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.periodButton} onPress={() => addPeriod("end")}>
              <Text>Set End</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveNotesAndMood}>
            <Text style={{ color: "#fff" }}>Save</Text>
          </TouchableOpacity>
        </View>
      </Modalize>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff0f5" },
  header: { fontSize: 22, fontWeight: "bold", color: "#d46b9a", padding: 15 },
  alertContainer: { flexDirection: "row", justifyContent: "space-between", padding: 15, alignItems: "center" },
  aiCard: { backgroundColor: "#ffe6f0", padding: 15, margin: 15, borderRadius: 15 },
  aiText: { color: "#a87fa3" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 10, marginBottom: 10 },
  periodButton: { padding: 10, backgroundColor: "#ffd6e8", borderRadius: 10, width: "45%", alignItems: "center" },
  saveButton: { backgroundColor: "#d46b9a", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 10 },
});