import React from "react";
import { View, Text, StyleSheet } from "react-native";
import CustomButton from "../../components/CustomButton";

export default function OnboardingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MenoMap</Text>
      <Text style={styles.subtitle}>Track your symptoms, diet, and wellness easily.</Text>

      <CustomButton text="Get Started" onPress={() => navigation.replace("Login")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFE5EC", justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "bold", color: "#FF8FAB", marginBottom: 12, textAlign: "center" },
  subtitle: { fontSize: 16, color: "#FB6F92", marginBottom: 24, textAlign: "center" },
});
