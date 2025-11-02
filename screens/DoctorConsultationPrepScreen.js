import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  StatusBar,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
// import Clipboard from '@react-native-clipboard/clipboard'; // --- 1. REMOVED THIS LINE ---

// --- Soft Pink Theme Colors ---
const COLORS = {
  background: '#FFFBFB',
  accent: '#FFB6C1',
  accentLight: '#FFF0F1',
  textPrimary: '#4A4A4A',
  textSecondary: '#8D8D8D',
  white: '#FFFFFF',
  cardBorder: '#F0E4E4',
  shadow: '#FFC0CB',
  outline: '#FFB6C1',
};

// --- Reusable Card Component ---
const ReportCard = ({ icon, title, children }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.cardIcon}>
        <Icon name={icon} size={20} color={COLORS.accent} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <View style={styles.cardContent}>{children}</View>
  </View>
);

export default function DoctorConsultationPrepScreen({ navigation }) {
  // --- State for all dynamic inputs ---
  const [locationQuery, setLocationQuery] = useState('');
  const [cycleNotes, setCycleNotes] = useState('');
  const [symptomNotes, setSymptomNotes] = useState('');
  const [reliefNotes, setReliefNotes] = useState('');

  // --- "Find Doctors" Handler (Works!) ---
  const handleFindDoctors = async () => {
    if (locationQuery.trim() === '') {
      Alert.alert(
        'Location Required',
        'Please enter your city or zip code to find nearby doctors.',
      );
      return;
    }

    const query = `gynecologist near ${locationQuery}`;
    const mapUrl = Platform.select({
      ios: `http://maps.apple.com/?q=${encodeURIComponent(query)}`,
      android: `geo:0,0?q=${encodeURIComponent(query)}`,
    });

    try {
      const supported = await Linking.canOpenURL(mapUrl);
      if (supported) {
        await Linking.openURL(mapUrl);
      } else {
        Alert.alert(
          'Error',
          'Could not open the map application. Please ensure you have Apple Maps or Google Maps installed.',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  // --- 2. "Copy" function removed. Replaced with PDF placeholder ---
  const handleExportPDF = () => {
    Alert.alert(
      'Feature Coming Soon',
      'This will generate a PDF summary of your report for you to share.',
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Doctor Report</Text>
        <Text style={styles.headerSubtitle}>
          Use this space to summarize your logs before your appointment.
        </Text>

        {/* --- DYNAMIC CYCLE SUMMARY CARD --- */}
        <ReportCard icon="calendar-outline" title="Cycle Summary">
          <TextInput
            style={styles.inputField}
            multiline
            placeholder="e.g., My cycles are irregular, ranging from 32-45 days. My last cycle was 45 days long..."
            placeholderTextColor={COLORS.textSecondary}
            value={cycleNotes}
            onChangeText={setCycleNotes}
          />
        </ReportCard>

        {/* --- DYNAMIC SYMPTOM CARD --- */}
        <ReportCard icon="medkit-outline" title="Top Symptoms">
          <TextInput
            style={styles.inputField}
            multiline
            placeholder="e.g., Main symptoms are hot flashes (10-15 times/week, medium intensity) and high brain fog..."
            placeholderTextColor={COLORS.textSecondary}
            value={symptomNotes}
            onChangeText={setSymptomNotes}
          />
        </ReportCard>

        {/* --- DYNAMIC RELIEF CARD --- */}
        <ReportCard icon="sparkles-outline" title="Most Effective Reliefs">
          <TextInput
            style={styles.inputField}
            multiline
            placeholder="e.g., Meditation seems to help with anxiety. Exercise seems to reduce hot flashes..."
            placeholderTextColor={COLORS.textSecondary}
            value={reliefNotes}
            onChangeText={setReliefNotes}
          />
        </ReportCard>

        {/* --- FIND DOCTOR INPUT --- */}
        <Text style={styles.locationLabel}>Find a Specialist</Text>
        <TextInput
          style={styles.locationInput}
          placeholder="Enter your City or Zip Code"
          placeholderTextColor={COLORS.textSecondary}
          value={locationQuery}
          onChangeText={setLocationQuery}
        />

        {/* --- Action Buttons --- */}
        <TouchableOpacity style={styles.actionButton} onPress={handleFindDoctors}>
          <Icon name="navigate-outline" size={20} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Find Nearby Doctors</Text>
        </TouchableOpacity>

        {/* --- 3. This button now calls handleExportPDF --- */}
        <TouchableOpacity style={styles.outlineButton} onPress={handleExportPDF}>
          <Icon name="download-outline" size={20} color={COLORS.accent} />
          <Text style={styles.outlineButtonText}>Export as PDF</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- STYLESHEET ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    paddingBottom: 12,
    marginBottom: 12,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  cardContent: {
    // Content is added via children
  },
  inputField: {
    height: 100, // Give space to write
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 22,
    textAlignVertical: 'top', // For Android
  },
  locationLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  locationInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 16,
    color: COLORS.textPrimary,
  },
  actionButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 12,
    borderWidth: 2,
    borderColor: COLORS.outline,
  },
  outlineButtonText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

