import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";

// Helper component for our new inputs
const LabeledInput = ({ label, value, onChangeText, placeholder, keyboardType = "default" }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      style={styles.input}
      keyboardType={keyboardType}
    />
  </View>
);

export default function DietPlanScreen() {
  // --- 1. STATE IS NOW MORE COMPLEX ---
  // Basic Info
  const [age, setAge] = useState("42");
  const [mood, setMood] = useState("stressed"); // e.g., stressed, moderate, calm
  const [preference, setPreference] = useState("Vegetarian"); // e.g., Vegetarian, Non-Vegetarian

  // Symptoms (as severities 0, 1, or 2)
  const [symptomHotFlashes, setSymptomHotFlashes] = useState("2");
  const [symptomAcne, setSymptomAcne] = useState("1");
  const [symptomFatigue, setSymptomFatigue] = useState("2");
  const [symptomBrainFog, setSymptomBrainFog] = useState("1");

  // Extra Info (for the 'extra' object)
  const [region, setRegion] = useState("South"); // e.g., South, North, East/West
  const [bmiCategory, setBmiCategory] = useState("overweight"); // e.g., overweight, normal
  const [cycleEncoded, setCycleEncoded] = useState("2");
  const [stageEncoded, setStageEncoded] = useState("1");
  const [remedies, setRemedies] = useState("PCOS Tea, Spearmint Supplement"); // Comma-separated

  // App State
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    setLoading(true);
    setPlan(null);

    // --- 2. BUILD THE CORRECT JSON PAYLOAD ---
    const symptomsPayload = {
      // These keys MUST match the ones in _build_feature_vector_from_request
      "hot_flashes": parseInt(symptomHotFlashes) || 0,
      "acne": parseInt(symptomAcne) || 0,
      "fatigue_severity_pcos": parseInt(symptomFatigue) || 0,
      "brain_fog": parseInt(symptomBrainFog) || 0,
      // 💡 Add other symptoms here as needed
    };

    const extraPayload = {
      "region": region,
      "bmi_category": bmiCategory,
      "cycle_regularity_encoded": parseInt(cycleEncoded) || 0,
      "self_reported_stage_encoded": parseInt(stageEncoded) || 0,
      // 💡 Add other 'extra' fields here
    };

    const body = {
      "user_id": "react-native-user", // Example user_id
      "age": parseInt(age) || 0,
      "mood": mood,
      "remedies": remedies.split(',').map(r => r.trim()), // Split comma-separated string into array
      "preferences": [preference],
      "symptoms": symptomsPayload,
      "extra": extraPayload
    };

    console.log("Sending payload:", JSON.stringify(body, null, 2));

    try {
      const response = await fetch("http://192.168.29.18:5001/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log("🟢 API Response:", data);

      // --- 3. PARSE THE NEW RESPONSE ---
      if (data.week_plan && Array.isArray(data.week_plan)) {
        setPlan(data.week_plan);
      } else if (data.error) {
        Alert.alert("Error", `Backend error: ${data.error}`);
      } else {
        Alert.alert("Error", "Received an unexpected response from the backend.");
      }
    } catch (error) {
      console.error("❌ Error fetching plan:", error);
      Alert.alert("Error", "Failed to fetch plan. Is the backend server running?");
    } finally {
      setLoading(false);
    }
  };

  // --- 4. RENDER THE NEW PLAN STRUCTURE (WITH FIXES) ---
  const renderPlanItem = ({ item }) => (
    <View style={styles.mealCard}>
      <Text style={styles.mealType}>{item.type}</Text>
      {/* 💡 FIX: Add check for item.details to prevent crash if data is missing */}
      <Text style={styles.mealText}>
        {item.details ? item.details.replace(/\\n/g, '\n') : 'Not available'}
      </Text>
    </View>
  );

  const renderDay = ({ item }) => {
    // 'item' is now { day: "Monday", Remedy: "...", Breakfast: "...", ... }
    const meals = [
      { type: "Remedy", details: item.Remedy || "Not available" },
      { type: "Breakfast", details: item.Breakfast || "Not available" },
      { type: "Lunch", details: item.Lunch || "Not available" },
      // 💡 FIX: Use correct key "Evening Snacks" and provide fallback
      { type: "Evening Snacks", details: item["Evening Snacks"] || "Not available" },
      { type: "Dinner", details: item.Dinner || "Not available" },
    ];

    return (
      <View style={styles.dayCard}>
        <Text style={styles.dayTitle}>🗓 {item.day}</Text>
        <FlatList
          data={meals}
          keyExtractor={(meal) => meal.type}
          renderItem={renderPlanItem}
        />
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🥗 Adaptive Diet Planner</Text>
      
      {/* --- 5. UPDATED UI --- */}
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>User Profile</Text>
        <LabeledInput label="Age" value={age} onChangeText={setAge} placeholder="e.g., 42" keyboardType="numeric" />
        <LabeledInput label="Mood" value={mood} onChangeText={setMood} placeholder="e.g., stressed, calm" />
        <LabeledInput label="Diet Preference" value={preference} onChangeText={setPreference} placeholder="e.g., Vegetarian" />
        <LabeledInput label="Remedies" value={remedies} onChangeText={setRemedies} placeholder="e.g., PCOS Tea, Spearmint" />

        <Text style={styles.sectionTitle}>Symptoms (Severity 0-2)</Text>
        <LabeledInput label="Hot Flashes" value={symptomHotFlashes} onChangeText={setSymptomHotFlashes} keyboardType="numeric" />
        <LabeledInput label="Acne" value={symptomAcne} onChangeText={setSymptomAcne} keyboardType="numeric" />
        <LabeledInput label="Fatigue" value={symptomFatigue} onChangeText={setSymptomFatigue} keyboardType="numeric" />
        <LabeledInput label="Brain Fog" value={symptomBrainFog} onChangeText={setSymptomBrainFog} keyboardType="numeric" />

        {/* 💡 FIX: Replaced ' with &apos; to fix linting error */}
        <Text style={styles.sectionTitle}>Extra Details (from &apos;extra&apos; obj)</Text>
        <LabeledInput label="Region" value={region} onChangeText={setRegion} placeholder="e.g., South, North" />
        <LabeledInput label="BMI Category" value={bmiCategory} onChangeText={setBmiCategory} placeholder="e.g., overweight, normal" />
        <LabeledInput label="Cycle (Encoded)" value={cycleEncoded} onChangeText={setCycleEncoded} keyboardType="numeric" />
        <LabeledInput label="Stage (Encoded)" value={stageEncoded} onChangeText={setStageEncoded} keyboardType="numeric" />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={generatePlan}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Generate Plan</Text>
        )}
      </TouchableOpacity>

      {plan && (
        <FlatList
          data={plan}
          keyExtractor={(item) => item.day}
          renderItem={renderDay}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#3a3a3a",
  },
  formContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4a8f54",
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
  },
  button: {
    backgroundColor: "#5DB075",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: "#a5d8b5",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  dayCard: {
    backgroundColor: "#f4f9f4",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#4a8f54",
  },
  mealCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0"
  },
  mealType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  mealText: {
    fontSize: 15,
    color: "#555",
    marginTop: 5,
    lineHeight: 22,
  },
});