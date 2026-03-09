import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import InputField from "../../components/InputField";
import COLORS from "../../constants/colors";
import { API_URL } from "../../utils/apiConfig";



// --- Helper Function to Extract Name ---
const getNameFromEmail = (email) => {
  if (!email) return "User";
  const namePart = email.split('@')[0];
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
};

import AsyncStorage from '@react-native-async-storage/async-storage';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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


export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- 2. FULLY UPDATED LOGIN LOGIC ---
  // --- 2. FULLY UPDATED LOGIN LOGIC ---
  const handleLogin = async () => {
    // Check 1: Are fields empty?
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        const user = data.data?.user;
        if (user) {
          await AsyncStorage.setItem("userSession", JSON.stringify(user));
          navigation.navigate("HomeScreen", { userName: user.name || "User" });
        } else {
          Alert.alert("Error", "User data missing from server response.");
        }
      } else {
        Alert.alert("Login Failed", data.message || "Invalid email or password.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Error", "Unable to connect to the server. Please check your network.");
    }
  };
  // ---------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={"#FFFFFF"} />
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


