import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from "react-native-vector-icons/Ionicons";
import { API_URL } from "../utils/apiConfig";

// --- Import our custom components ---
import CustomButton from "../components/CustomButton";
import InputField from "../components/InputField";
import COLORS from "../constants/colors";




const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    textAlign: "center"
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageWrapper: {
    position: 'relative',
    width: 140,
    height: 140,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.accentLight,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 5,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginTop: 10,
  },
  stageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 30,
  },
  stageButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: COLORS.white,
  },
  stageButtonSelected: {
    backgroundColor: COLORS.accentLight,
    borderColor: COLORS.accent,
  },
  stageText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  stageTextSelected: {
    color: COLORS.accent,
    fontWeight: "bold"
  },
});

// --- Soft Pink Theme Colors ---


// --- Menstrual Stage Options ---
const STAGES = [
  { key: "Pre", label: "Pre-Menopause" },
  { key: "Peri", label: "Peri-Menopause" },
  { key: "Post", label: "Post-Menopause" },
];

export default function ProfileScreen({ navigation }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [region, setRegion] = useState("");
  const [menstrualStage, setMenstrualStage] = useState("Peri"); // Default to Peri
  const [image, setImage] = useState(null);

  // --- 1. Ask for Image Permission (Better UX) ---
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Sorry', 'We need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

  // --- 2. Pick Profile Image ---
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Allow user to crop
      aspect: [1, 1], // Force a square
      quality: 0.5,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // --- 3. Save Profile and Pass Name to Home ---
  const saveProfile = async () => {
    if (!name || !age || !menstrualStage) {
      Alert.alert("Error", "Please fill in all required fields (Name, Age, Stage).");
      return;
    }
    const profileData = { name, age, region, menstrualStage, image };
    try {
      await AsyncStorage.setItem("userProfile", JSON.stringify(profileData));

      const sessionStr = await AsyncStorage.getItem("userSession");
      const session = JSON.parse(sessionStr);
      const user_id = session?.email || "guest@menomap.com";

      // Sync with backend
      const response = await fetch(`${API_URL}/update_profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id,
          profile_data: {
            age_group_simplified_40_49: parseInt(age) >= 40 && parseInt(age) < 50 ? 1 : 0,
            age_group_simplified_50_59: parseInt(age) >= 50 && parseInt(age) < 60 ? 1 : 0,
            age_group_simplified_younger_than_40: parseInt(age) < 40 ? 1 : 0,
            self_reported_stage_encoded: menstrualStage === "Pre" ? 0 : menstrualStage === "Peri" ? 1 : 2,
            stress_level_encoded: 2, // Default
            cycle_regularity_encoded: 1, // Default
            flow_intensity_encoded: 2, // Default
            exercise_frequency_wk: 1.5, // Default
            cycle_length_days: 28.0, // Default
          }
        }),
      });

      const resData = await response.json();
      console.log("Profile Sync Response:", resData);

      if (response.ok && resData?.status === "success") {
        console.log("Profile synced successfully with backend.");
      } else {
        console.warn("Backend profile sync failed:", resData?.message || "Unknown error");
      }

      navigation.replace("HomeScreen", { userName: name });

    } catch (err) {
      console.log("Error saving profile:", err);
      Alert.alert("Error", "Could not save profile.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={"#FFFFFF"} />
      <ScrollView contentContainerStyle={styles.container}>

        {/* --- Header --- */}
        <View style={styles.header}>
          <Text style={styles.title}>Set Up Your Profile</Text>
          <Text style={styles.subtitle}>This helps us personalize your experience</Text>
        </View>

        {/* --- Image Picker --- */}
        <View style={styles.imagePickerContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
            <Image
              source={image ? { uri: image } : require("../assets/images/profile-placeholder.png")} // Make sure this path is correct!
              style={styles.profileImage}
            />
            <View style={styles.editIcon}>
              <Icon name="camera-outline" size={20} color={COLORS.accent} />
            </View>
          </TouchableOpacity>
        </View>

        {/* --- Input Fields --- */}
        <InputField
          label="Name"
          icon="person-outline"
          value={name}
          onChangeText={setName}
        />
        <InputField
          label="Age"
          icon="calendar-outline"
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />
        <InputField
          label="Region (Optional)"
          icon="map-outline"
          value={region}
          onChangeText={setRegion}
        />

        {/* --- Menstrual Stage Selector --- */}
        <Text style={styles.label}>Menstrual Stage:</Text>
        <View style={styles.stageContainer}>
          {STAGES.map(stage => (
            <TouchableOpacity
              key={stage.key}
              style={[
                styles.stageButton,
                menstrualStage === stage.key && styles.stageButtonSelected
              ]}
              onPress={() => setMenstrualStage(stage.key)}
            >
              <Text style={[
                styles.stageText,
                menstrualStage === stage.key && styles.stageTextSelected
              ]}>
                {stage.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- Save Button --- */}
        <CustomButton text="Save & Continue" onPress={saveProfile} />

      </ScrollView>
    </SafeAreaView>
  );

}

// --- New Aesthetic Stylesheet ---
