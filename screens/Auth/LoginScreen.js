import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext'; // <-- Import the "brain"

const LoginScreen = ({ navigation }) => {
  const { login, isApiLoading } = useAuth(); // <-- Get login function and loading state
  const theme = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLoginPressed = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    // Call the login function from AuthContext
    login(email, password);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>Welcome Back!</Text>
        <Text style={[styles.subtitle, { color: theme.colors.text }]}>
          Log in to your MenoMap account.
        </Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          theme={{ roundness: 10 }}
          mode="outlined"
          autoCapitalize="none"
          keyboardType="email-address"
          left={<TextInput.Icon icon="email-outline" />}
          activeOutlineColor={theme.colors.accent}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          theme={{ roundness: 10 }}
          mode="outlined"
          secureTextEntry
          left={<TextInput.Icon icon="lock-outline" />}
          activeOutlineColor={theme.colors.accent}
        />

        <Button
          mode="contained"
          onPress={onLoginPressed}
          disabled={isApiLoading}
          style={[styles.button, { backgroundColor: theme.colors.accent }]}
          labelStyle={styles.buttonText}
          contentStyle={styles.buttonContent}
        >
          {isApiLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            'Login'
          )}
        </Button>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.registerText, { color: theme.colors.text }]}>
            Dont have an account? <Text style={[styles.registerLink, {color: theme.colors.accent}]}>Register</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },
  button: {
    borderRadius: 30,
    marginTop: 10,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  registerText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  registerLink: {
    fontWeight: 'bold',
  },
});

export default LoginScreen;