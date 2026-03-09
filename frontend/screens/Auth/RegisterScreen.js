import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import InputField from "../../components/InputField";
import COLORS from "../../constants/colors";
import { API_URL } from "../../utils/apiConfig";



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




export default function RegisterScreen({ navigation }) {
  // We remove the 'setIsLoggedIn' prop
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      console.log("Sending Register Payload:", { name, email: email.toLowerCase(), password });
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email: email.toLowerCase(), password }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        Alert.alert("Success", "Account created successfully! Please login.", [
          { text: "OK", onPress: () => navigation.navigate("LoginScreen") }
        ]);
      } else {
        Alert.alert("Registration Failed", data.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Registration Error:", error);
      Alert.alert("Error", "Unable to connect to the server.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={"#FFFFFF"} />
      <KeyboardAvoidingView style={styles.container} behavior="padding">

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your MenoMap journey today</Text>
        </View>


        <InputField
          label="Full Name"
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

