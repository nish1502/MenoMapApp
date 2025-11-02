import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Alert, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from "react-native";
import CustomButton from "../../components/CustomButton";
import InputField from "../../components/InputField";

// --- Soft Pink Theme Colors ---
const COLORS = {
  background: '#FFFBFB',
  accent: '#FFB6C1',
  textPrimary: '#4A4A4A',
  textSecondary: '#8D8D8D',
  darkPink: '#FB6F92',
  white: '#FFFFFF',
};

// --- 1. UPDATED USER "ALLOW LIST" ---
// This now stores emails as keys and passwords as values.
// NOTE: This is not secure for a real app, but works for frontend-only.
// --- Please change these default passwords! ---
const ALLOWED_USERS = {
  'aditi@example.com': 'aditi123',
  'mrunmai@example.com': 'mrunmai123',
  'test@menomap.com': 'testpass',
  'specific.user@gmail.com': 'password'
};
// ------------------------------

// --- Helper Function to Extract Name ---
const getNameFromEmail = (email) => {
  if (!email) return "User";
  const namePart = email.split('@')[0];
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- 2. FULLY UPDATED LOGIN LOGIC ---
  const handleLogin = () => {
    // Check 1: Are fields empty?
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    const lowerCaseEmail = email.toLowerCase();
    
    // Check 2: Does this email exist in our allowed list?
    if (!ALLOWED_USERS[lowerCaseEmail]) {
      Alert.alert(
        "Login Failed", 
        "This email address is not authorized to use this app."
      );
      return;
    }

    // Check 3 (NEW): Does the entered password match the stored password?
    if (ALLOWED_USERS[lowerCaseEmail] !== password) {
      Alert.alert(
        "Login Failed", 
        "Incorrect password. Please try again."
      );
      return;
    }

    // --- If all checks pass, login is successful ---
    const userName = getNameFromEmail(email);
    navigation.navigate("HomeScreen", { userName: userName });
  };
  // ---------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        
        <View style={styles.header}>
          {/* You can add an icon or image here */}
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Log in to continue your MenoMap journey</Text>
        </View>

        <InputField 
          label="Email" 
          value={email} 
          onChangeText={setEmail} 
          keyboardType="email-address" 
          icon="mail-outline"
        />
        <InputField 
          label="Password" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
          icon="lock-closed-outline"
        />

        <CustomButton text="Login" onPress={handleLogin} />

        <TouchableOpacity onPress={() => navigation.navigate("RegisterScreen")}>
          <Text style={styles.registerText}>Don’t have an account? <Text style={styles.registerLink}>Register</Text></Text>
        </TouchableOpacity>
        
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: { 
    flex: 1, 
    padding: 24, 
    justifyContent: "center",
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: { 
    fontSize: 32, 
    fontWeight: "bold", 
    color: COLORS.textPrimary, 
    marginTop: 16,
    textAlign: "center" 
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  registerText: { 
    color: COLORS.textSecondary, 
    marginTop: 24, 
    textAlign: "center", 
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.darkPink,
    fontWeight: 'bold',
  }
});
