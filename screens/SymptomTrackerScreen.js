import { API_URL } from '../utils/apiConfig';
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
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

// --- Configuration ---
//const API_URL = 'http://10.187.204.118:5001'; // Base URL for your API
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
        // --- THIS IS THE FIX ---
        onValueChange={onValueChange} 
        // ----------------------
        minimumTrackTintColor="#C792C7"
        maximumTrackTintColor="#F0F0F0"
        thumbTintColor="#A076A0"
      />
    </View>
  );
};

// The main screen
const SymptomTrackerScreen = ({ navigation }) => {
  // States for all sliders
  const [hotFlashes, setHotFlashes] = useState(0);
  const [moodSwings, setMoodSwings] = useState(0);
  const [fatigue, setFatigue] = useState(0);
  const [sleepIssues, setSleepIssues] = useState(0);
  const [brainFog, setBrainFog] = useState(0);

  // States for Date Picker
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // States for API flow
  const [notes, setNotes] = useState('');
  const [isModalVisible, setModalVisible] = useState(false); // "AI Insight" modal
  const [apiResult, setApiResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- NEW STATES FOR RELIEF FLOW ---
  const [userId, setUserId] = useState("nishita_test_user"); // Example user_id, get this from auth
  const [latestLogId, setLatestLogId] = useState(null); // Stores the log_id from stage prediction
  const [latestHistoryId, setLatestHistoryId] = useState(null); // Stores the history_id from remedy
  const [remedyResult, setRemedyResult] = useState(null); // Stores the remedy response
  const [isRemedyModalVisible, setRemedyModalVisible] = useState(false); // "Remedy" modal

  // --- Date Picker Functions ---
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };
  
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // --- 1. STAGE PREDICTION (Called by "Save & Predict") ---
  const onSaveAndPredict = async () => {
    setIsLoading(true);

    const logData = {
      user_id: userId, // Send the user_id
      log_date: date.toISOString(), // Send the selected date
      hot_flashes: hotFlashes,
      mood_swings: moodSwings,
      fatigue: fatigue,
      sleep_issues: sleepIssues,
      brain_fog: brainFog,
      notes: notes,
    };

    console.log("Sending to /predict_menopause_stage:", JSON.stringify(logData, null, 2));

    try {
      const response = await fetch(`${API_URL}/predict_menopause_stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
      });

      const jsonResponse = await response.json();
      console.log("Received from /predict_menopause_stage:", jsonResponse);


      if (response.ok) {
        setApiResult(jsonResponse);
        setLatestLogId(jsonResponse.log_id); // <-- SAVE THE LOG_ID
        setModalVisible(true); // Show "AI Insight" modal
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

  // --- 2. GET REMEDY (Called by "Find Relief") ---
  
  // Helper to find the worst symptom to target
  const getWorstSymptom = () => {
    const symptoms = [
        { key: 'hot_flashes_severity_ternary', value: hotFlashes },
        { key: 'mood_swings_severity_ternary', value: moodSwings },
        { key: 'fatigue_severity_meno_ternary', value: fatigue },
        { key: 'sleep_disturbances_severity_ternary', value: sleepIssues },
        { key: 'brain_fog_severity_ternary', value: brainFog },
    ];
    
    // Find the one with the highest 0-10 slider value
    const worst = symptoms.sort((a, b) => b.value - a.value)[0];
    
    // Convert 0-10 value to 0-2 ternary scale for the model
    let ternaryVal = 0;
    if (worst.value > 7) ternaryVal = 2;
    else if (worst.value > 3) ternaryVal = 1;
    
    return { 
        target_symptom_key: worst.key, 
        current_severity_ternary: ternaryVal 
    };
  };

  const fetchRemedy = async () => {
    setIsLoading(true);
    const { target_symptom_key, current_severity_ternary } = getWorstSymptom();

    const remedyPayload = { 
      log_id: latestLogId,
      user_id: userId,
      target_symptom_key: target_symptom_key,
      current_severity_ternary: current_severity_ternary
    };

    console.log("Sending to /get_remedy:", JSON.stringify(remedyPayload, null, 2));

    try {
      const response = await fetch(`${API_URL}/get_remedy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(remedyPayload),
      });
      const json = await response.json();
      console.log("Received from /get_remedy:", json);
      
      if (response.ok) {
        setRemedyResult(json); // Save the full remedy object
        setLatestHistoryId(json.history_id); // Save the history_id for feedback
        setRemedyModalVisible(true); // Show "Remedy" modal
      } else {
        Alert.alert('Error', json.error || 'Could not fetch remedy.');
      }
    } catch (e) {
      Alert.alert('Network Error', 'Could not connect to API.');
    }
    setIsLoading(false);
  };

  // --- 3. LOG FEEDBACK (Called by "Yes/No" buttons) ---
  const submitRemedyFeedback = async (wasEffective) => {
    setRemedyModalVisible(false); // Close the modal
    if (!latestHistoryId) return; // Don't do anything if we don't have a history_id

    const feedbackPayload = {
      history_id: latestHistoryId,
      was_effective: wasEffective,
    };

    console.log("Sending to /log_remedy_feedback:", JSON.stringify(feedbackPayload, null, 2));

    try {
      await fetch(`${API_URL}/log_remedy_feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackPayload),
      });
      Alert.alert("Feedback Saved", "Thank you! Your insights help us learn.");
    } catch (e) {
      Alert.alert('Network Error', 'Could not save feedback.');
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

          {/* Date Selector */}
          <TouchableOpacity onPress={showDatepicker} style={styles.dateCard}>
            <Text style={styles.dateText}>📅 Select Date: </Text>
            <Text style={styles.dateValue}>{formattedDate}</Text>
          </TouchableOpacity>

          {/* Date Picker Modal */}
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode={'date'}
              is24Hour={true}
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
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

          {/* --- Modal 1: AI Insight (Stage) --- */}
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

                {/* --- NEW "FIND RELIEF" BUTTON --- */}
                <TouchableOpacity
                  style={styles.modalButtonPrimary}
                  onPress={() => {
                    setModalVisible(false); // Close this modal
                    fetchRemedy(); // Call the remedy function
                  }}
                >
                  <Text style={styles.modalButtonTextPrimary}>Find Relief</Text>
                </TouchableOpacity>
                
                {/* --- NAVIGATION BUTTONS --- */}
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate('DietPlannerScreen');
                  }}
                >
                  <Text style={styles.modalButtonTextSecondary}>View Diet Plan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate('ReliefTrackerScreen');
                  }}
                >
                  <Text style={styles.modalButtonTextSecondary}>See Relief Tracker</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          
          {/* --- Modal 2: Remedy Recommendation --- */}
          <Modal
            transparent={true}
            animationType="slide"
            visible={isRemedyModalVisible}
            onRequestClose={() => setRemedyModalVisible(false)}
          >
            <View style={styles.modalBackdrop}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Relief Suggestion</Text>
                    <Text style={styles.modalText}>
                        For your {remedyResult?.target_symptom}, we recommend:
                    </Text>
                    <Text style={styles.remedyName}>{remedyResult?.best_remedy_name}</Text>
                    
                    <View style={styles.instructionsBox}>
                        {(remedyResult?.instructions?.steps || []).map((step, index) => (
                            <Text key={index} style={styles.instructionStep}>{step}</Text>
                        ))}
                    </View>
                    <Text style={styles.modalSubText}>Initial Severity: {remedyResult?.initial_severity}</Text>
                    <Text style={styles.modalSubText}>Predicted Outcome: {remedyResult?.predicted_outcome}</Text>

                    <Text style={styles.modalConfidence}>Was this remedy helpful?</Text>

                    {/* --- Feedback Buttons --- */}
                    <TouchableOpacity
                        style={styles.modalButtonPrimary}
                        onPress={() => submitRemedyFeedback(true)}
                    >
                        <Text style={styles.modalButtonTextPrimary}>Yes, it was helpful</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.modalButtonSecondary}
                        onPress={() => submitRemedyFeedback(false)}
                    >
                        <Text style={styles.modalButtonTextSecondary}>No, not really</Text>
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
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A076A0',
    marginLeft: 5,
    flexShrink: 1,
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
  modalSubText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  modalConfidence: {
    fontSize: 16,
    color: '#555',
    marginBottom: 25,
    marginTop: 15,
    fontWeight: '600',
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
    marginBottom: 10,
  },
  modalButtonTextSecondary: {
    color: '#A076A0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // New Styles for Remedy Modal
  remedyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#A076A0',
    marginBottom: 15,
    textAlign: 'center',
  },
  instructionsBox: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  instructionStep: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
});

export default SymptomTrackerScreen;