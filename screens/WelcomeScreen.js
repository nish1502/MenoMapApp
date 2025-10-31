// WelcomeScreen.js
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/welcome.jpg")} // your welcome illustration
        style={styles.image}
      />
      <Text style={styles.title}>Welcome to MenoMap</Text>
      <Text style={styles.subtitle}>Your AI Companion for Hormonal Health</Text>

      <TouchableOpacity
        style={styles.getStartedButton}
        onPress={() => navigation.navigate("OnboardingScreen")}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.learnMoreButton}>
        <Text style={styles.learnMoreText}>Learn More</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffe6f0", padding: 20 },
  image: { width: 250, height: 250, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "bold", color: "#d46b9a", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#a87fa3", marginVertical: 10, textAlign: "center" },
  getStartedButton: { backgroundColor: "#d46b9a", padding: 15, borderRadius: 10, marginTop: 20, width: "80%" },
  buttonText: { color: "#fff", fontSize: 16, textAlign: "center" },
  learnMoreButton: { marginTop: 15 },
  learnMoreText: { color: "#d46b9a", fontSize: 14 },
});