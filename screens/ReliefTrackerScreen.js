import { API_URL } from '../utils/apiConfig';
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// Note: You will need a chart library like 'react-native-chart-kit' for the graph
// Run: npm install react-native-chart-kit

// --- Configuration ---
//const API_URL = 'http://10.187.204.118:5001'; // Base URL
const USER_ID = 'nishita_test_user'; // Get this from your auth state
// ---------------------

// Main Screen Component
const ReliefTrackerScreen = ({ navigation }) => {
  const [reliefData, setReliefData] = useState(null); // Start with null
  const [isLoading, setIsLoading] = useState(true); // Start in loading state
  const [isModalVisible, setModalVisible] = useState(false);

  // --- This hook fetches real data when the screen loads ---
  useEffect(() => {
    // Call fetchReliefHistory when the screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchReliefHistory();
    });

    return unsubscribe; // Unsubscribe when the component is unmounted
  }, [navigation]);

  const fetchReliefHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/get_relief_summary`, { // Call new endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID }),
      });
      const json = await response.json();
      if (response.ok) {
        setReliefData(json); // Set data from the API
      } else {
        Alert.alert('Error', 'Could not fetch relief history.');
      }
    } catch (e) {
      Alert.alert('Network Error', 'Could not connect to API.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const downloadReport = () => {
      Alert.alert('Download Report', 'This will generate a PDF of your symptom and relief history.');
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <LinearGradient colors={['#FFF0F5', '#E6E6FA']} style={styles.container}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#A076A0" />
          <Text style={{marginTop: 10, color: '#555'}}>Loading Your Insights...</Text>
        </View>
      </LinearGradient> 
    );
  }

  // --- Empty State ---
  if (!reliefData || reliefData.summary.length === 0) {
    return (
      <LinearGradient colors={['#FFF0F5', '#E6E6FA']} style={styles.container}>
        <SafeAreaView style={styles.container}>
            <View style={styles.emptyContainer}>
                <Text style={styles.headerTitle}>🌿 Relief Tracker</Text>
                <Text style={styles.aiText}>No relief history found.</Text>
                <Text style={styles.subtitle}>
                    Log symptoms in the Symptom Tracker and give feedback on remedies to see your insights here!
                </Text>
            </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // --- Main Content ---
  return (
    <LinearGradient colors={['#FFF0F5', '#E6E6FA']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.headerTitle}>🌿 Relief Tracker</Text>
          <Text style={styles.subtitle}>Track what’s helping you feel better.</Text>

          {/* --- Main 2-Column Grid --- */}
          <View style={styles.gridContainer}>
            {reliefData.summary.map((item, index) => (
              <View key={index} style={styles.card}>
                <Text style={styles.cardTitle}>{item.name} {item.emoji}</Text>
                <Text style={styles.cardEffectiveness}>+{item.effectiveness}%</Text>
                <Text style={styles.cardNote}>{item.note}</Text>
              </View>
            ))}
          </View>

          {/* --- Weekly Summary Chart --- */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Weekly Summary</Text>
            <Text style={styles.cardNote}>Effectiveness Trend (%)</Text>
            <View style={styles.chartPlaceholder}>
                <Text>Chart will go here</Text>
            </View>
          </View>

          {/* --- AI Suggestion Card --- */}
          <View style={styles.aiCard}>
            <Text style={styles.aiTitle}>💡 AI Suggestion</Text>
            <Text style={styles.aiText}>{reliefData.aiSuggestion}</Text>
          </View>
          
          {/* --- Download Report Button --- */}
          <TouchableOpacity onPress={downloadReport} style={styles.downloadButton}>
             <Text style={styles.downloadButtonText}>Download Report</Text>
          </TouchableOpacity>

        </ScrollView>

        {/* --- Floating Action Button (FAB) --- */}
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {/* --- Add New Relief Modal --- */}
        <Modal
          transparent={true}
          animationType="slide"
          visible={isModalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Add New Relief</Text>
              <Text style={styles.modalText}>
                  To add a new entry, please use the Symptom Tracker and respond to the Find Relief prompt.
              </Text>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
};

// --- STYLES (Same as before) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100, // Make space for FAB
  },
  emptyContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    width: '48%', // Two columns with a small gap
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
  },
  cardEffectiveness: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#A076A0', // Purple
    marginVertical: 8,
  },
  cardNote: {
    fontSize: 14,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  chartPlaceholder: {
    height: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  aiCard: {
    backgroundColor: 'rgba(230, 230, 250, 0.9)', // Soft Lavender
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 15,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A076A0',
  },
  aiText: {
    fontSize: 16,
    color: '#444',
    marginTop: 5,
    lineHeight: 22,
    textAlign: 'center',
  },
  downloadButton: {
    backgroundColor: '#A076A0',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF69B4', // Hot Pink
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabText: {
    color: 'white',
    fontSize: 30,
    lineHeight: 30,
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtonPrimary: {
    backgroundColor: '#A076A0',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonTextPrimary: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    borderColor: '#A076A0',
    borderWidth: 1.5,
  },
  modalButtonTextSecondary: {
    color: '#A076A0',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReliefTrackerScreen;