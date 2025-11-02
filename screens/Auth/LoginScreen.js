import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Alert, TouchableOpacity } from "react-native";
import CustomButton from "../../components/CustomButton";
import InputField from "../../components/InputField";

export default function LoginScreen({ navigation, setIsLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    Alert.alert("Login Successful", `Welcome, ${email}!`);
    setIsLoggedIn(true); // Switches to AppNavigator
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Text style={styles.title}>Welcome Back!</Text>

      <InputField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <InputField label="Password" value={password} onChangeText={setPassword} secureTextEntry />

      <CustomButton text="Login" onPress={handleLogin} />

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.registerText}>Don’t have an account? Register</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFE5EC", padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "bold", color: "#FF8FAB", marginBottom: 24, textAlign: "center" },
  registerText: { color: "#FB6F92", marginTop: 16, textAlign: "center", fontWeight: "bold" },
});
