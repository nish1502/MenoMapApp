// ProfileScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

export default function ProfileScreen({ navigation }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [region, setRegion] = useState("");
  const [menstrualStage, setMenstrualStage] = useState("Pre");
  const [image, setImage] = useState(null);

  // Pick profile image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const saveProfile = async () => {
    const profileData = { name, age, region, menstrualStage, image };
    try {
      await AsyncStorage.setItem("userProfile", JSON.stringify(profileData));
      navigation.replace("HomeScreen"); // Go to Home after first setup
    } catch (err) {
      console.log("Error saving profile:", err);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Set Up Your Profile</Text>

      <TouchableOpacity onPress={pickImage}>
        <Image
          source={image ? { uri: image } : require("../assets/images/profile-placeholder.png")}
          style={styles.profileImage}
        />
        <Text style={styles.pickText}>Tap to choose profile picture</Text>
      </TouchableOpacity>

      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Age" keyboardType="numeric" value={age} onChangeText={setAge} />
      <TextInput style={styles.input} placeholder="Region" value={region} onChangeText={setRegion} />

      <Text style={styles.label}>Menstrual Stage:</Text>
      <View style={styles.stageContainer}>
        {["Pre", "Peri", "Post"].map(stage => (
          <TouchableOpacity
            key={stage}
            style={[styles.stageButton, menstrualStage === stage && styles.stageButtonSelected]}
            onPress={() => setMenstrualStage(stage)}
          >
            <Text style={[styles.stageText, menstrualStage === stage && styles.stageTextSelected]}>{stage}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button title="Save Profile" onPress={saveProfile} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#fff", alignItems: "center" },
  header: { fontSize: 24, fontWeight: "bold", marginVertical: 20, color: "#d46b9a" },
  profileImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#eee" },
  pickText: { fontSize: 12, color: "#888", marginVertical: 5 },
  input: { width: "100%", borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 10, marginVertical: 10 },
  label: { fontSize: 16, marginTop: 15, marginBottom: 5 },
  stageContainer: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 15 },
  stageButton: { padding: 10, borderWidth: 1, borderColor: "#ccc", borderRadius: 10 },
  stageButtonSelected: { backgroundColor: "#f7c7d9", borderColor: "#d46b9a" },
  stageText: { color: "#000" },
  stageTextSelected: { color: "#d46b9a", fontWeight: "bold" },
});