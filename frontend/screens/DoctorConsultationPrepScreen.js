import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import COLORS from '../constants/colors';
import { API_URL } from '../utils/apiConfig';




const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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

// import Clipboard from '@react-native-clipboard/clipboard'; // --- 1. REMOVED THIS LINE ---

// --- Soft Pink Theme Colors ---


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
  const [loading, setLoading] = useState(false);

  // --- AUTO-SUMMARY LOGIC ---
  useEffect(() => {
    const generateSummary = async () => {
      setLoading(true);
      try {
        const sessionStr = await AsyncStorage.getItem("userSession");
        const userId = sessionStr ? JSON.parse(sessionStr)?.email : "guest@menomap.com";

        // 1. Fetch Relief Data
        const reliefRes = await fetch(`${API_URL}/get_relief_summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });
        const reliefJson = await reliefRes.json();
        if (reliefJson?.status === "success" && reliefJson?.data?.summary?.length > 0) {
          const top = reliefJson.data.summary.slice(0, 2).map(r => r.name).join(' and ');
          setReliefNotes(`Top relief strategies: ${top}. AI Suggestion: ${reliefJson.data.aiSuggestion}`);
        }

        // 2. Fetch Brain Fog
        const fogStr = await AsyncStorage.getItem('@menoMap_fogEntries');
        if (fogStr) {
          const entries = JSON.parse(fogStr).slice(-7);
          const avg = Math.round(entries.reduce((s, e) => s + e.clarity, 0) / (entries.length || 1));
          setSymptomNotes(`Avg clarity past 7 days: ${avg}/10. Triggers: ${entries.map(e => e.notes).filter(n => n).join(', ').substring(0, 100)}`);
        }

        // 3. Cycle stage
        const profileStr = await AsyncStorage.getItem("userProfile");
        if (profileStr) {
          const profile = JSON.parse(profileStr);
          setCycleNotes(`Self-reported stage: ${profile.menstrualStage || 'Unknown'}. Region: ${profile.region || 'Not set'}.`);
        }
      } catch (e) { console.warn("Summary error:", e); }
      setLoading(false);
    };
    const unsubscribe = navigation.addListener('focus', generateSummary);
    return unsubscribe;
  }, [navigation]);

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

  // --- 2. Export to PDF (Now Functional!) ---
  const handleExportPDF = async () => {
    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #4A4A4A; background-color: #FFFBFB; }
            h1 { color: #D9659B; font-size: 28px; margin-bottom: 10px; }
            .date { color: #8D8D8D; font-size: 14px; margin-bottom: 30px; }
            h2 { color: #FFB6C1; border-bottom: 2px solid #F0E4E4; padding-bottom: 8px; margin-top: 25px; font-size: 20px; }
            p { font-size: 16px; line-height: 24px; color: #4A4A4A; white-space: pre-wrap; }
            .footer { margin-top: 50px; font-size: 12px; color: #8D8D8D; text-align: center; border-top: 1px solid #F0E4E4; padding-top: 20px; }
          </style>
        </head>
        <body>
          <h1>MenoMap Consultation Summary</h1>
          <p class="date">Report generated on: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          <div class="section">
            <h2>Cycle Summary</h2>
            <p>${cycleNotes.trim() || 'No specific cycle notes recorded.'}</p>
          </div>

          <div class="section">
            <h2>Top Symptoms & Concerns</h2>
            <p>${symptomNotes.trim() || 'No specific symptom notes recorded.'}</p>
          </div>

          <div class="section">
            <h2>Relief Methods & Efficacy</h2>
            <p>${reliefNotes.trim() || 'No specific relief logs recorded.'}</p>
          </div>

          <div class="footer">
            Generated via MenoMap App &copy; 2026. This report is for informational purposes for your healthcare provider.
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      console.log('PDF saved to:', uri);
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('PDF Export Error:', error);
      Alert.alert('Export Error', 'Failed to generate PDF. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={"#FFFFFF"} />
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

