import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../utils/apiConfig';

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center", color: "#333" },
  formContainer: { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 15, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#A076A0", marginTop: 10, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: "#E6E6FA", paddingBottom: 5 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 14, color: "#555", marginBottom: 5, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: "#fff", fontSize: 16, color: '#333' },
  button: { borderRadius: 30, height: 56, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
  buttonGradient: { borderRadius: 30, padding: 15, alignItems: "center", justifyContent: 'center', height: '100%' },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  dayCard: { backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: 15, padding: 15, marginBottom: 15, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  dayTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#A076A0" },
  mealCard: { backgroundColor: "#fff", borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#E6E6FA" },
  mealType: { fontSize: 16, fontWeight: "bold", color: "#333" },
  mealText: { fontSize: 15, color: "#555", marginTop: 5, lineHeight: 22 },
});

// Helper component for our new inputs
const LabeledInput = ({ label, value, onChangeText, placeholder, keyboardType = "default" }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      style={styles.input}
      placeholderTextColor="#999"
      keyboardType={keyboardType}
    />
  </View>
);

export default function DietPlanScreen() {
  // --- 1. STATE ---
  const [age, setAge] = useState("");
  const [mood, setMood] = useState("Neutral");
  const [preference, setPreference] = useState("Vegetarian");
  const [symptomHotFlashes, setSymptomHotFlashes] = useState("1");
  const [symptomAcne, setSymptomAcne] = useState("0");
  const [symptomFatigue, setSymptomFatigue] = useState("1");
  const [symptomBrainFog, setSymptomBrainFog] = useState("0");
  const [region, setRegion] = useState("Global");
  const [bmiCategory, setBmiCategory] = useState("normal");
  const [cycleEncoded, setCycleEncoded] = useState("1");
  const [stageEncoded, setStageEncoded] = useState("1");
  const [remedies, setRemedies] = useState("");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("guest@menomap.com");
  const [isExtraVisible, setIsExtraVisible] = useState(false); // Collapse by default

  // Load profile from storage 
  useEffect(() => {
    const loadData = async () => {
      try {
        const profileStr = await AsyncStorage.getItem("userProfile");
        if (profileStr) {
          const profile = JSON.parse(profileStr);
          if (profile.age) setAge(profile.age.toString());
          if (profile.menstrualStage) {
            const stageMap = { "Pre": 0, "Peri": 1, "Post": 2 };
            setStageEncoded(stageMap[profile.menstrualStage]?.toString() || "1");
          }
          if (profile.region) setRegion(profile.region);
        }

        const sessionStr = await AsyncStorage.getItem("userSession");
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (session?.email) setUserId(session.email);
        }
      } catch (e) {
        console.warn("Error loading storage in DietPlanner:", e);
      }
    };
    loadData();
  }, []);

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
      "user_id": userId,
      "age": parseInt(age) || 0,
      "mood": mood,
      "remedies": remedies.split(',').map(r => r.trim()),
      "preferences": [preference],
      "symptoms": symptomsPayload,
      "extra": extraPayload
    };

    console.log("Sending payload:", JSON.stringify(body, null, 2));

    try {
      const response = await fetch(`${API_URL}/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log("🟢 API Response:", data);

      if (data?.status === "success" && data?.data?.week_plan) {
        console.log("Weekly Plan:", data.data.week_plan);
        setPlan(data.data.week_plan);
      } else if (data?.status === "error") {
        Alert.alert("Error", `Backend error: ${data.message || data.error}`);
      } else {
        Alert.alert("Error", "Received an unexpected response structure from the backend.");
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
        {item.details ? item.details.toString().replace(/\\n/g, '\n') : 'Not available'}
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

            <Text style={styles.sectionTitle}>Symptom Overview (0-2)</Text>
            <LabeledInput label="Hot Flashes" value={symptomHotFlashes} onChangeText={setSymptomHotFlashes} keyboardType="numeric" />
            <LabeledInput label="Acne" value={symptomAcne} onChangeText={setSymptomAcne} keyboardType="numeric" />
            <LabeledInput label="Fatigue" value={symptomFatigue} onChangeText={setSymptomFatigue} keyboardType="numeric" />
            <LabeledInput label="Brain Fog" value={symptomBrainFog} onChangeText={setSymptomBrainFog} keyboardType="numeric" />

            <TouchableOpacity
              onPress={() => setIsExtraVisible(!isExtraVisible)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingVertical: 10 }}
            >
              <Text style={[styles.sectionTitle, { marginBottom: 0, borderBottomWidth: 0, marginTop: 0 }]}>Advanced Personalization</Text>
              <Text style={{ fontSize: 18, color: "#A076A0" }}>{isExtraVisible ? "−" : "+"}</Text>
            </TouchableOpacity>

            {isExtraVisible && (
              <View style={{ marginTop: 10 }}>
                <LabeledInput label="Region" value={region} onChangeText={setRegion} placeholder="e.g., South, North" />
                <LabeledInput label="BMI Category" value={bmiCategory} onChangeText={setBmiCategory} placeholder="e.g., overweight, normal" />
                <LabeledInput label="Cycle Regularity (0-2)" value={cycleEncoded} onChangeText={setCycleEncoded} keyboardType="numeric" />
                <LabeledInput label="Life Stage (0-2)" value={stageEncoded} onChangeText={setStageEncoded} keyboardType="numeric" />
              </View>
            )}
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
