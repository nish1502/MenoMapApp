// SplashScreen.js
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("WelcomeScreen");
    }, 2000); // 2 seconds splash
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/splash-icon.png")} // your splash image
        style={styles.logo}
      />
      <Text style={styles.title}>MenoMap</Text>
      <Text style={styles.subtitle}>Your AI Companion for Hormonal Health</Text>
      <ActivityIndicator size="large" color="#d46b9a" style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fce8f0" },
  logo: { width: 120, height: 120, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#d46b9a" },
  subtitle: { fontSize: 16, color: "#a87fa3", marginTop: 5, textAlign: "center", paddingHorizontal: 20 },
});