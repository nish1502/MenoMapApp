import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext'; // <-- Import the "brain"

const RegisterScreen = ({ navigation }) => {
  const { register, isApiLoading } = useAuth(); // <-- Get register function
  const theme = useTheme();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const onRegisterPressed = () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    // Call the register function from AuthContext
    register(name, email, password, navigation);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: theme.colors.text }]}>
          Start your wellness journey today.
        </Text>

        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          theme={{ roundness: 10 }}
          mode="outlined"
          autoCapitalize="words"
          left={<TextInput.Icon icon="account-outline" />}
          activeOutlineColor={theme.colors.accent}
        />

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

        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
          theme={{ roundness: 10 }}
          mode="outlined"
          secureTextEntry
          left={<TextInput.Icon icon="lock-check-outline" />}
          activeOutlineColor={theme.colors.accent}
        />

        <Button
          mode="contained"
          onPress={onRegisterPressed}
          disabled={isApiLoading}
          style={[styles.button, { backgroundColor: theme.colors.accent }]}
          labelStyle={styles.buttonText}
          contentStyle={styles.buttonContent}
        >
          {isApiLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            'Register'
          )}
        </Button>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.loginText, { color: theme.colors.text }]}>
            Already have an account? <Text style={[styles.loginLink, {color: theme.colors.accent}]}>Login</Text>
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
  loginText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  loginLink: {
    fontWeight: 'bold',
  },
});

export default RegisterScreen;