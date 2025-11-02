import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Alert, TouchableOpacity } from "react-native";
import CustomButton from "../../components/CustomButton";
import InputField from "../../components/InputField";

export default function RegisterScreen({ navigation, setIsLoggedIn }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    Alert.alert("Registration Successful", `Welcome, ${name}!`);
    setIsLoggedIn(true);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Text style={styles.title}>Create Account</Text>

      <InputField label="Name" value={name} onChangeText={setName} />
      <InputField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <InputField label="Password" value={password} onChangeText={setPassword} secureTextEntry />

      <CustomButton text="Register" onPress={handleRegister} />

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.loginText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFE5EC", padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "bold", color: "#FF8FAB", marginBottom: 24, textAlign: "center" },
  loginText: { color: "#FB6F92", marginTop: 16, textAlign: "center", fontWeight: "bold" },
});
