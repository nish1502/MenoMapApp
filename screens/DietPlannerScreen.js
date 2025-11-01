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
  SafeAreaView, // <-- Added for layout
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient'; // <-- Added for gradient

// Helper component for our new inputs
const LabeledInput = ({ label, value, onChangeText, placeholder, keyboardType = "default" }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      style={styles.input}
      placeholderTextColor="#999" // Added placeholder color
      keyboardType={keyboardType}
    />
  </View>
);

export default function DietPlanScreen() {
  // --- 1. STATE (Unchanged) ---
  const [age, setAge] = useState("42");
  const [mood, setMood] = useState("stressed");
  const [preference, setPreference] = useState("Vegetarian"); 
  const [symptomHotFlashes, setSymptomHotFlashes] = useState("2");
  const [symptomAcne, setSymptomAcne] = useState("1");
  const [symptomFatigue, setSymptomFatigue] = useState("2");
  const [symptomBrainFog, setSymptomBrainFog] = useState("1");
  const [region, setRegion] = useState("South");
  const [bmiCategory, setBmiCategory] = useState("overweight");
  const [cycleEncoded, setCycleEncoded] = useState("2");
  const [stageEncoded, setStageEncoded] = useState("1");
  const [remedies, setRemedies] = useState("PCOS Tea, Spearmint Supplement"); 
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- 2. generatePlan Function (Unchanged) ---
  const generatePlan = async () => {
    setLoading(true);
    setPlan(null);

    const symptomsPayload = {
      "hot_flashes": parseInt(symptomHotFlashes) || 0,
      "acne": parseInt(symptomAcne) || 0,
      "fatigue_severity_pcos": parseInt(symptomFatigue) || 0,
      "brain_fog": parseInt(symptomBrainFog) || 0,
    };

    const extraPayload = {
      "region": region,
      "bmi_category": bmiCategory,
      "cycle_regularity_encoded": parseInt(cycleEncoded) || 0,
      "self_reported_stage_encoded": parseInt(stageEncoded) || 0,
    };

    const body = {
      "user_id": "react-native-user",
      "age": parseInt(age) || 0,
      "mood": mood,
      "remedies": remedies.split(',').map(r => r.trim()),
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

  // --- 3. Render Functions (Unchanged) ---
  const renderPlanItem = ({ item }) => (
    <View style={styles.mealCard}>
      <Text style={styles.mealType}>{item.type}</Text>
      <Text style={styles.mealText}>
        {item.details ? item.details.replace(/\\n/g, '\n') : 'Not available'}
      </Text>
    </View>
  );

  const renderDay = ({ item }) => {
    const meals = [
      { type: "Remedy", details: item.Remedy || "Not available" },
      { type: "Breakfast", details: item.Breakfast || "Not available" },
      { type: "Lunch", details: item.Lunch || "Not available" },
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
          scrollEnabled={false} // <-- Disable inner scroll
        />
      </View>
    );
  };

  // --- 4. RENDER (Updated with Gradient) ---
  return (
    <LinearGradient
      colors={['#FFF0F5', '#E6E6FA']} // Soft Pink to Lavender
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>🥗 Adaptive Diet Planner</Text>
          
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

            <Text style={styles.sectionTitle}>Extra Details (from &apos;extra&apos; obj)</Text>
            <LabeledInput label="Region" value={region} onChangeText={setRegion} placeholder="e.g., South, North" />
            <LabeledInput label="BMI Category" value={bmiCategory} onChangeText={setBmiCategory} placeholder="e.g., overweight, normal" />
            <LabeledInput label="Cycle (Encoded)" value={cycleEncoded} onChangeText={setCycleEncoded} keyboardType="numeric" />
            <LabeledInput label="Stage (Encoded)" value={stageEncoded} onChangeText={setStageEncoded} keyboardType="numeric" />
          </View>

          {/* --- UPDATED BUTTON --- */}
          <TouchableOpacity
            style={styles.button}
            onPress={generatePlan}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#ccc', '#ccc'] : ['#C792C7', '#A076A0']} // Purple Gradient
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Generate Plan</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {plan && (
            <FlatList
              data={plan}
              keyExtractor={(item) => item.day}
              renderItem={renderDay}
              contentContainerStyle={{ paddingBottom: 40 }}
              scrollEnabled={false} // <-- Disable inner scroll
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// --- 5. STYLES (Updated to MenoMap Theme) ---
const styles = StyleSheet.create({
  container: {
    flex: 1, // Full screen
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333", // Darker text
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Soft white card
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#A076A0", // Theme Purple
    marginTop: 10,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E6FA", // Lavender
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
    borderColor: "#E0E0E0", // Light grey
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff", // Solid white
    fontSize: 16,
    color: '#333',
  },
  button: {
    borderRadius: 30, // Rounded pill shape
    height: 56,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonGradient: {
    borderRadius: 30,
    padding: 15,
    alignItems: "center",
    justifyContent: 'center',
    height: '100%',
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  dayCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
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
    color: "#A076A0", // Theme Purple
  },
  mealCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E6E6FA" // Lavender border
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