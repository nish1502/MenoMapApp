// BrainFogMemoryFogScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get screen width for chart
const screenWidth = Dimensions.get('window').width;

// --- NEW: Pink Soft Theme Color Palette ---
const colors = {
  primary: '#D9659B', // Soft Pink
  primaryDark: '#B44A81', // Darker Pink (for text/accents)
  primaryLight: '#FCE4EC', // Very Light Pink (for backgrounds)
  background: '#FFF9FB', // Main app background
  card: '#FFFFFF', // Card background
  text: '#333333',
  textSecondary: '#666666',
  gray: '#BDBDBD',
};

// Storage Keys
const ENTRIES_STORAGE_KEY = '@menoMap_fogEntries';
const TIP_STORAGE_KEY = '@menoMap_aiTip';

// Default tip
const DEFAULT_TIP =
  'Try magnesium-rich snacks like almonds or spinach. Magnesium plays a key role in brain function and can help reduce fatigue.';

const BrainFogMemoryFogScreen = () => {
  // State for the form inputs
  const [clarity, setClarity] = useState(5);
  const [notes, setNotes] = useState('');

  // State for saved data
  const [allEntries, setAllEntries] = useState([]);
  const [aiTip, setAiTip] = useState(DEFAULT_TIP);

  // Load data on component mount
  useEffect(() => {
    loadEntries();
    loadAiTip();
  }, []);

  // --- Load Functions (unchanged) ---
  const loadEntries = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(ENTRIES_STORAGE_KEY);
      if (jsonValue !== null) {
        setAllEntries(JSON.parse(jsonValue));
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load past entries.');
    }
  };

  const loadAiTip = async () => {
    try {
      const savedTip = await AsyncStorage.getItem(TIP_STORAGE_KEY);
      if (savedTip !== null) {
        setAiTip(savedTip);
      }
    } catch (e) {
      console.error('Failed to load tip.', e);
    }
  };

  // --- Save Functions (unchanged) ---
  const saveEntries = async (newEntries) => {
    try {
      const jsonValue = JSON.stringify(newEntries);
      await AsyncStorage.setItem(ENTRIES_STORAGE_KEY, jsonValue);
    } catch (e) {
      Alert.alert('Error', 'Failed to save entry.');
    }
  };

  const saveAiTip = async (tip) => {
    try {
      await AsyncStorage.setItem(TIP_STORAGE_KEY, tip);
    } catch (e) {
      console.error('Failed to save tip.', e);
    }
  };

  // --- "AI" Tip Logic (unchanged) ---
  const generateDynamicTip = (clarity, notes) => {
    const lowerCaseNotes = notes.toLowerCase();

    // 1. Keyword-based rules
    if (lowerCaseNotes.includes('sleep') || lowerCaseNotes.includes('tired')) {
      return 'Poor sleep is a major fog trigger. Try to establish a relaxing bedtime routine tonight, away from screens.';
    }
    if (
      lowerCaseNotes.includes('stress') ||
      lowerCaseNotes.includes('meeting') ||
      lowerCaseNotes.includes('anxious')
    ) {
      return "High stress impacts clarity. Try a 5-minute 'box breathing' exercise: inhale for 4s, hold for 4s, exhale for 4s, hold for 4s.";
    }
    if (
      lowerCaseNotes.includes('food') ||
      lowerCaseNotes.includes('ate') ||
      lowerCaseNotes.includes('sugar')
    ) {
      return 'Hydration is key! Even mild dehydration can cause brain fog. Are you drinking enough water today?';
    }

    // 2. Clarity-score-based rules
    if (clarity <= 4) {
      return 'Your clarity is low. Be kind to yourself. A short 10-minute walk in fresh air can help clear your mind.';
    }
    if (clarity >= 8) {
      return "Great clarity score! Whatever you did today (like good sleep or hydration), let's try to repeat it tomorrow.";
    }

    // 3. Default/Fallback general tips
    const generalTips = [
      'Omega-3s (found in walnuts or flaxseeds) are excellent for brain health. Consider adding some to your next meal.',
      "Try a 'brain dump'—write down all your tasks. Getting them out of your head and onto paper can reduce mental clutter.",
      'A quick puzzle, like a sudoku or crossword, can act like a warm-up for your brain. Try one for 10 minutes.',
      DEFAULT_TIP,
    ];

    let newTip = aiTip;
    while (newTip === aiTip) {
      newTip = generalTips[Math.floor(Math.random() * generalTips.length)];
    }
    return newTip;
  };

  // --- Handle Log Entry (unchanged) ---
  const handleLogEntry = async () => {
    const newEntry = {
      id: new Date().toISOString(),
      clarity: Math.round(clarity),
      notes: notes,
    };

    const updatedEntries = [...allEntries, newEntry];
    setAllEntries(updatedEntries);
    await saveEntries(updatedEntries);

    const newTip = generateDynamicTip(newEntry.clarity, newEntry.notes);
    setAiTip(newTip);
    await saveAiTip(newTip);

    setClarity(5);
    setNotes('');
  };

  // --- UPDATED: Chart Data Function (uses new colors) ---
  const getDynamicChartData = () => {
    const chartLineColor = (opacity = 1) =>
      `rgba(217, 101, 155, ${opacity})`; // #D9659B

    if (allEntries.length === 0) {
      return {
        labels: ['...'],
        datasets: [
          {
            data: [5],
            color: chartLineColor,
            strokeWidth: 3,
          },
        ],
      };
    }
    const last7Entries = allEntries.slice(-7);
    const labels = last7Entries.map((entry) => {
      const date = new Date(entry.id);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const data = last7Entries.map((entry) => entry.clarity);
    return {
      labels: labels,
      datasets: [
        {
          data: data,
          color: chartLineColor,
          strokeWidth: 3,
        },
      ],
    };
  };

  // --- UPDATED: Chart Config (uses new colors) ---
  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(217, 101, 155, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`, // colors.text
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.primaryDark, // #B44A81
    },
  };

  const dynamicChartData = getDynamicChartData();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Brain Fog & Memory Log</Text>

        {/* --- Card 1: Slider --- */}
        <View style={styles.card}>
          <Text style={styles.title}>How clear did your mind feel today?</Text>
          <Text style={styles.clarityValue}>{Math.round(clarity)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={clarity}
            onValueChange={setClarity}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.gray}
            thumbTintColor={colors.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>1 (Foggy)</Text>
            <Text style={styles.sliderLabel}>10 (Very Clear)</Text>
          </View>
        </View>

        {/* --- Card 2: Notes --- */}
        <View style={styles.card}>
          <Text style={styles.title}>Notes or Triggers</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="e.g., Didn’t sleep well, stressful meeting, forgot keys..."
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            placeholderTextColor="#999"
          />
        </View>

        {/* --- Log Button --- */}
        <TouchableOpacity style={styles.logButton} onPress={handleLogEntry}>
          <Text style={styles.logButtonText}>Log Today Entry</Text>
        </TouchableOpacity>

        {/* --- Card 3: Chart --- */}
        <View style={styles.card}>
          <Text style={styles.title}>Weekly Clarity Trend</Text>
          <LineChart
            data={dynamicChartData}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            fromZero={true}
            yAxisMin={0}
            yAxisMax={10}
          />
        </View>

        {/* --- Card 4: AI Tip --- */}
        <View style={[styles.card, styles.tipCard]}>
          <Text style={styles.tipTitle}>💡 AI Coach Tip</Text>
          <Text style={styles.tipText}>{aiTip}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- UPDATED: Stylesheet (uses new colors) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: colors.text,
  },
  // Slider styles
  clarityValue: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.primary,
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  sliderLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  // Notes styles
  notesInput: {
    backgroundColor: '#f9f9f9',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    color: colors.text,
  },
  // Log Button
  logButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  logButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Chart styles
  chart: {
    borderRadius: 12,
    alignItems: 'center',
  },
  // AI Tip styles
  tipCard: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 10,
  },
  tipText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
});

export default BrainFogMemoryFogScreen;