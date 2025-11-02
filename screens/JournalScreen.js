import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Soft Pink Theme Colors ---
const COLORS = {
  background: '#FFFBFB', // Very pale pink
  accent: '#FFB6C1',     // Main "Soft Pink"
  accentLight: '#FFF0F1', // Lightest pink
  textPrimary: '#4A4A4A',
  textSecondary: '#8D8D8D',
  white: '#FFFFFF',
  cardBorder: '#F0E4E4',
  error: '#D9534F',
};

// --- Data ---
const AFFIRMATIONS = [
  "I am calm, capable, and in control.",
  "I embrace the journey with patience and grace.",
  "I am strong, resilient, and ready for what comes.",
  "I listen to my body and give it what it needs.",
  "I am worthy of peace and joy every day.",
  "I honor my feelings and let them pass without judgment."
];

const MOODS = [
  { emoji: '😊', label: 'Happy', color: '#FFF8E1' }, // Pastel Yellow
  { emoji: '😌', label: 'Calm', color: '#E3F2FD' },  // Pastel Blue
  { emoji: '😕', label: 'Neutral', color: '#F3E5F5' }, // Pastel Purple
  { emoji: '😥', label: 'Sad', color: '#EDE7F6' },     // Pastel Lavender
  { emoji: '😬', label: 'Anxious', color: '#FFEFEF' }, // Pastel Red
];

// --- Helper: Get current date string ---
const getCurrentDate = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const ASYNC_STORAGE_KEY = '@journalEntries';

// --- Main Component ---
const JournalScreen = () => {
  const [affirmation, setAffirmation] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [journalEntry, setJournalEntry] = useState('');
  const [pastEntries, setPastEntries] = useState([]);
  const [error, setError] = useState('');

  // --- Load data on component mount ---
  useEffect(() => {
    // 1. Load a random affirmation
    const randomIndex = Math.floor(Math.random() * AFFIRMATIONS.length);
    setAffirmation(AFFIRMATIONS[randomIndex]);

    // 2. Load past entries from AsyncStorage
    loadEntries();
  }, []);

  // --- AsyncStorage Functions ---
  const loadEntries = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
      if (jsonValue !== null) {
        setPastEntries(JSON.parse(jsonValue));
      }
    } catch (e) {
      console.error("Failed to load entries.", e);
      Alert.alert("Error", "Could not load past reflections.");
    }
  };

  const handleSave = async () => {
    if (!selectedMood) {
      setError('Please select a mood.');
      return;
    }
    if (journalEntry.trim() === '') {
      setError('Please write something in your journal.');
      return;
    }
    setError(''); // Clear error

    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mood: selectedMood,
      text: journalEntry.trim(),
    };

    try {
      // Prepend the new entry to show it at the top
      const updatedEntries = [newEntry, ...pastEntries];
      
      const jsonValue = JSON.stringify(updatedEntries);
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, jsonValue);
      
      // Update state and clear inputs
      setPastEntries(updatedEntries);
      setJournalEntry('');
      setSelectedMood(null);
    } catch (e) {
      console.error("Failed to save entry.", e);
      Alert.alert("Error", "Could not save reflection.");
    }
  };

  // --- Render Functions ---

  const renderMoodPicker = () => (
    <View style={styles.moodPickerContainer}>
      {MOODS.map((mood) => {
        const isSelected = selectedMood?.label === mood.label;
        return (
          <TouchableOpacity
            key={mood.label}
            style={[
              styles.moodButton,
              { backgroundColor: mood.color },
              isSelected && styles.moodSelected,
            ]}
            onPress={() => setSelectedMood(mood)}
          >
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // This renders the card for the new entry
  const renderNewEntry = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Today Reflection</Text>
      <Text style={styles.dateText}>{getCurrentDate()}</Text>
      
      <Text style={styles.label}>How are you feeling?</Text>
      {renderMoodPicker()}

      <Text style={styles.label}>What is on your mind?</Text>
      <TextInput
        style={styles.textInput}
        multiline
        placeholder="Write about your day..."
        value={journalEntry}
        onChangeText={setJournalEntry}
      />
      
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Reflection</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  // This renders a single card in the timeline
  const renderTimelineEntry = ({ item }) => (
    <View style={styles.timelineCard}>
      <View style={styles.timelineHeader}>
        <Text style={styles.timelineDate}>
          {new Date(item.date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        <Text style={styles.timelineEmoji}>{item.mood.emoji}</Text>
      </View>
      <Text style={styles.timelineText}>{item.text}</Text>
    </View>
  );

  // This renders the Affirmation card
  const renderAffirmation = () => (
    <View style={styles.affirmationCard}>
      <Text style={styles.affirmationTitle}>Daily Affirmation</Text>
      {/* --- THIS IS THE FIXED LINE --- */}
      <Text style={styles.affirmationText}>{`"${affirmation}"`}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <FlatList
        data={pastEntries}
        keyExtractor={(item) => item.id}
        renderItem={renderTimelineEntry}
        ListHeaderComponent={
          <>
            <Text style={styles.headerTitle}>Daily Reflection</Text>
            {renderAffirmation()}
            {renderNewEntry()}
            <Text style={styles.timelineHeaderTitle}>Past Reflections</Text>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.emptyListText}>No reflections saved yet.</Text>
        }
        contentContainerStyle={styles.container}
      />
    </SafeAreaView>
  );
};

// --- STYLESHEET ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  affirmationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  affirmationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  affirmationText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#FFC0CB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  moodPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  moodButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodSelected: {
    borderColor: COLORS.accent,
    transform: [{ scale: 1.15 }],
  },
  moodEmoji: {
    fontSize: 28,
  },
  textInput: {
    height: 120,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top', // For Android
    backgroundColor: '#FAFAFA',
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 10,
  },
  timelineHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  timelineCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineDate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  timelineEmoji: {
    fontSize: 24,
  },
  timelineText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  emptyListText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 20,
  },
});

export default JournalScreen;

