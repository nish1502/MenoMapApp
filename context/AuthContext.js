import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/theme'; // We will add this in the next step

// Create the context
const AuthContext = createContext();

// Create the AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Is app loading from storage?
  const [isApiLoading, setIsApiLoading] = useState(false); // Is API busy?
  const [hasOnboarded, setHasOnboarded] = useState(false);

  // Check storage on app load
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    setIsLoading(true);
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');
      const storedOnboarding = await AsyncStorage.getItem('hasOnboarded');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedOnboarding === 'true') {
            setHasOnboarded(true);
        }
      }
    } catch (e) {
      console.error('Failed to load user from storage', e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- API FUNCTIONS ---

  const login = async (email, password) => {
    setIsApiLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // --- LOGIN SUCCESS ---
        setUser(data.user);
        setToken(data.access_token);
        
        // Save to secure storage
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        await AsyncStorage.setItem('userToken', data.access_token);
        
        // Check if user has a profile (onboarded)
        // We do this *after* setting the token
        await checkOnboardingStatus(data.access_token);
        
      } else {
        Alert.alert('Login Failed', data.error || 'Invalid email or password');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Network Error', 'Could not connect to server.');
    } finally {
      setIsApiLoading(false);
    }
  };

  const register = async (name, email, password, navigation) => {
    setIsApiLoading(true);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // --- REGISTER SUCCESS ---
        Alert.alert('Success', 'Account created! Please log in.');
        navigation.navigate('Login'); // Go to login screen
      } else {
        Alert.alert('Registration Failed', data.error || 'Could not create account');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Network Error', 'Could not connect to server.');
    } finally {
      setIsApiLoading(false);
    }
  };
  
  // This is the function for the OnboardingScreen
  const saveOnboardingProfile = async (profileData) => {
    if (!token) return; // Not logged in
    
    setIsApiLoading(true);
    try {
      const response = await fetch(`${API_URL}/save_onboarding_profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send the auth token
        },
        body: JSON.stringify(profileData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // --- ONBOARDING SUCCESS ---
        Alert.alert('Profile Saved!', 'Welcome to MenoMap.');
        setHasOnboarded(true);
        await AsyncStorage.setItem('hasOnboarded', 'true');
      } else {
        Alert.alert('Error', data.error || 'Could not save profile.');
      }
      
    } catch (e) {
       console.error(e);
       Alert.alert('Network Error', 'Could not save profile.');
    } finally {
       setIsApiLoading(false);
    }
  };

  // Helper function to check if user has a profile on the server
  const checkOnboardingStatus = async (userToken) => {
     // We will use the /get_remedy's 404 error to check
     // This is a simple way, a better way is a dedicated /check_profile route
    const currentToken = token || userToken;
    if (!currentToken) return;

    try {
        const response = await fetch(`${API_URL}/get_remedy`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}` 
            },
            // Send a test payload
            body: JSON.stringify({ log_id: 0, target_symptom_key: 'test', current_severity_ternary: 0 })
        });
        
        const data = await response.json();
        
        // If profile is NOT found, backend returns 404
        if (response.status === 404 && data.error && data.error.includes('User profile not found')) {
            console.log("Onboarding check: Profile NOT found.");
            setHasOnboarded(false);
            await AsyncStorage.setItem('hasOnboarded', 'false');
        } else {
            // Any other response (even an error) means the profile *exists*
            console.log("Onboarding check: Profile FOUND.");
            setHasOnboarded(true);
            await AsyncStorage.setItem('hasOnboarded', 'true');
        }
    } catch (e) {
        console.error("Onboarding check failed", e);
    }
  };


  const logout = async () => {
    setIsLoading(true); // Use the main loader
    setUser(null);
    setToken(null);
    setHasOnboarded(false);
    try {
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('hasOnboarded');
    } catch (e) {
      console.error('Failed to clear storage', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading, // Is app loading?
        isApiLoading, // Is an API call happening?
        hasOnboarded,
        login,
        logout,
        register,
        saveOnboardingProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a hook to use the context easily
export const useAuth = () => {
  return useContext(AuthContext);
};