import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider } from './context/AuthContext'; // <-- 1. IMPORT
import { PaperProvider } from 'react-native-paper'; // <-- Import PaperProvider
import theme from './constants/theme'; // <-- Import your theme

const App = () => {
  return (
    <PaperProvider theme={theme}> {/* <-- Wrap with your theme */}
      <AuthProvider> {/* <-- 2. WRAP HERE */}
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider> {/* <-- 3. AND HERE */}
    </PaperProvider>
  );
};

export default App;