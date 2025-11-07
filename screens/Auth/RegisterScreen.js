import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
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

export default function RegisterScreen({ navigation }) {
  // We remove the 'setIsLoggedIn' prop
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // --- THIS IS THE FIX ---
    // Instead of setIsLoggedIn(true), we navigate to the
    // HomeScreen and pass the new user's name.
    
    // Capitalize the first letter for the greeting
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    
    navigation.navigate("HomeScreen", { userName: formattedName });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView style={styles.container} behavior="padding">

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your MenoMap journey today</Text>
        </View>

        <InputField 
          label="Name" 
          value={name} 
          onChangeText={setName} 
          icon="person-outline"
        />
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

        <CustomButton text="Register" onPress={handleRegister} />

        <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
          <Text style={styles.loginText}>Already have an account? <Text style={styles.loginLink}>Login</Text></Text>
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
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  loginText: {
    color: COLORS.textSecondary,
    marginTop: 24,
    textAlign: "center",
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.darkPink,
    fontWeight: 'bold',
  }
});