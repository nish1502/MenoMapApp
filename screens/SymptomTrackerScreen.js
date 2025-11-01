import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Platform, // <-- Import Platform
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker'; // <-- Import DatePicker

// --- Configuration ---
const API_URL = 'http://192.168.29.18:5001/predict_menopause_stage';
// ---------------------

// A reusable component for each symptom slider
const SymptomSlider = ({ label, value, onValueChange }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.symptomLabel}>{label}</Text>
        <Text style={styles.symptomValue}>{Math.round(value)}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor="#C792C7"
        maximumTrackTintColor="#F0F0F0"
        thumbTintColor="#A076A0"
      />
    </View>
  );
};

// The main screen
// --- FIX: Added navigation prop ---
const SymptomTrackerScreen = ({ navigation }) => { 
  // States for all sliders
  const [hotFlashes, setHotFlashes] = useState(0);
  const [moodSwings, setMoodSwings] = useState(0);
  const [fatigue, setFatigue] = useState(0);
  const [sleepIssues, setSleepIssues] = useState(0);
  const [brainFog, setBrainFog] = useState(0);

  // --- NEW: States for Date Picker ---
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  // ---------------------------------

  const [notes, setNotes] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [apiResult, setApiResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- NEW: Function to handle date change ---
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios'); // On Android, it hides automatically
    setDate(currentDate);
  };

  // --- NEW: Function to show the date picker ---
  const showDatepicker = () => {
    setShowDatePicker(true);
  };
  
  // --- NEW: Format date for display ---
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  // This will show as "November 1, 2025"

  const onSaveAndPredict = async () => {
    setIsLoading(true);

    const logData = {
      hot_flashes: hotFlashes,
      mood_swings: moodSwings,
      fatigue: fatigue,
      sleep_issues: sleepIssues,
      brain_fog: brainFog,
      notes: notes,
      log_date: date.toISOString(), // <-- Send selected date to API
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });

      const jsonResponse = await response.json();

      if (response.ok) {
        setApiResult(jsonResponse);
        setModalVisible(true);
      } else {
        Alert.alert('Error', jsonResponse.error || 'Prediction failed.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Network Error', `Could not connect to API. Is it running at ${API_URL}?`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FFF0F5', '#E6E6FA']}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.headerTitle}>Symptom Tracker</Text>

          {/* --- UPDATED: Date Selector --- */}
          <TouchableOpacity onPress={showDatepicker} style={styles.dateCard}>
            <Text style={styles.dateText}>📅 Select Date: </Text>
            <Text style={styles.dateValue}>{formattedDate}</Text>
          </TouchableOpacity>

          {/* --- NEW: Date Picker Modal --- */}
          {/* This component will show when showDatePicker is true */}
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode={'date'}
              is24Hour={true}
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()} // Users can't log for the future
            />
          )}

          {/* Symptom Sliders */}
          <SymptomSlider label="Hot Flashes" value={hotFlashes} onValueChange={setHotFlashes} />
          <SymptomSlider label="Mood Swings" value={moodSwings} onValueChange={setMoodSwings} />
          <SymptomSlider label="Fatigue" value={fatigue} onValueChange={setFatigue} />
          <SymptomSlider label="Sleep Issues" value={sleepIssues} onValueChange={setSleepIssues} />
          <SymptomSlider label="Brain Fog" value={brainFog} onValueChange={setBrainFog} />
          
          {/* Notes Field */}
          <View style={styles.card}>
            <Text style={styles.symptomLabel}>Add Notes</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Had caffeine before bed"
              placeholderTextColor="#999"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          {/* Action Button */}
          <TouchableOpacity onPress={onSaveAndPredict} disabled={isLoading}>
            <LinearGradient
              colors={['#C792C7', '#A076A0']}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Predicting...' : '💫 Save & Predict'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* --- AI Result Modal (with navigation) --- */}
          <Modal
            transparent={true}
            animationType="slide"
            visible={isModalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalView}>
                <Text style={styles.modalTitle}>AI Insight</Text>
                <Text style={styles.modalText}>
                  You may be entering{' '}
                  <Text style={{ fontWeight: 'bold' }}>{apiResult?.predicted_stage}</Text>.
                </Text>
                <Text style={styles.modalConfidence}>
                  (Confidence: {apiResult?.confidence}%)
                </Text>

                <TouchableOpacity
                  style={styles.modalButtonPrimary}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate('DietPlannerScreen'); // <-- Make sure 'DietPlannerScreen' is the correct name
                  }}
                >
                  <Text style={styles.modalButtonTextPrimary}>View Diet Plan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate('ReliefTrackerScreen'); // <-- Make sure 'ReliefTrackerScreen' is the correct name
                  }}
                >
                  <Text style={styles.modalButtonTextSecondary}>See Relief Tracker</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  dateValue: { // <-- NEW Style for the date
    fontSize: 16,
    fontWeight: '600',
    color: '#A076A0', // Purple color
    marginLeft: 5,
    flexShrink: 1, // Allows text to wrap if date is long
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  symptomLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
  },
  symptomValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A076A0',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  textInput: {
    height: 80,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  modalConfidence: {
    fontSize: 14,
    color: '#888',
    marginBottom: 25,
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

export default SymptomTrackerScreen;