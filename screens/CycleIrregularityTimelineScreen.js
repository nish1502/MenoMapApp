import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/Ionicons';

// --- Soft Pink Theme Colors ---
const COLORS = {
  primaryBackground: '#FFFBFB',
  accent: '#FFB6C1',
  highlight: '#FFE4E1',
  textPrimary: '#4A4A4A',
  textSecondary: '#8D8D8D',
  white: '#FFFFFF',
  lightGrey: '#E0E0E0',
  disabled: '#F0F0F0',
  disabledText: '#BDBDBD',
  modalBackdrop: 'rgba(0,0,0,0.4)',
  statusRegular: '#34C759', // A soft green
  statusIrregular: '#FF9500', // A soft orange
};
// ------------------------------

// --- Irregularity Logic Constants ---
const IRREGULARITY_THRESHOLD_DAYS = 8; // Varies more than 8 days from avg
const MIN_CYCLE_DAYS = 21;
const MAX_CYCLE_DAYS = 35;
// ------------------------------------

// --- Helper Functions ---
const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  // Use T00:00:00 to avoid timezone issues
  let currentDate = new Date(`${startDate}T00:00:00`);
  const stopDate = new Date(`${endDate}T00:00:00`);

  while (currentDate <= stopDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

const daysBetween = (dateString1, dateString2) => {
  const date1 = new Date(`${dateString1}T00:00:00`);
  const date2 = new Date(`${dateString2}T00:00:00`);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
// ------------------------

// --- Reusable UI Components ---
const StatsRow = ({ label, value, unit }) => (
  <View style={styles.statsRow}>
    <Text style={styles.statsLabel}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsUnit}> {unit}</Text>
    </View>
  </View>
);

const IrregularityStatus = ({ status, message }) => {
  const iconName =
    status === 'Regular'
      ? 'checkmark-circle'
      : status === 'Irregular'
      ? 'alert-circle'
      : 'information-circle';
  const iconColor =
    status === 'Regular'
      ? COLORS.statusRegular
      : status === 'Irregular'
      ? COLORS.statusIrregular
      : COLORS.textSecondary;

  return (
    <View style={styles.statusContainer}>
      <Icon name={iconName} size={20} color={iconColor} />
      <View style={styles.statusTextContainer}>
        <Text style={[styles.statusTitle, { color: iconColor }]}>
          {status}
        </Text>
        <Text style={styles.statusMessage}>{message}</Text>
      </View>
    </View>
  );
};
// ------------------------------

const CycleIrregularityTimelineScreen = () => {
  // --- State Hooks ---
  const [isAlertsEnabled, setIsAlertsEnabled] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // This is our single source of truth for all logged data.
  // We use `endDate: null` to signify an active, un-ended period.
  const [allPeriods, setAllPeriods] = useState([
    // Example data so it's not empty
    { id: '1', startDate: '2025-08-16', endDate: '2025-08-20' },
    { id: '2', startDate: '2025-09-15', endDate: '2025-09-19' },
    { id: '3', startDate: '2025-10-14', endDate: '2025-10-18' },
  ]);

  // --- Main Calculation Hook (useMemo) ---
  const cycleData = useMemo(() => {
    const marked = {};
    const cycleLengths = [];
    const periodDurations = [];
    let avgCycleLength = 0;
    let lastCycleLength = 0;
    let avgPeriodDuration = 0;
    let irregularityStatus = {
      status: 'Not Enough Data',
      message: 'Log at least two full cycles for an analysis.',
    };

    // Find the currently active period (if one exists)
    const activePeriod = allPeriods.find(p => p.endDate === null);

    // 1. Mark Dates for Calendar
    allPeriods.forEach(period => {
      // If a period is active, mark all days from start to TODAY
      const endDate = period.endDate || new Date().toISOString().split('T')[0];
      const dates = getDatesInRange(period.startDate, endDate);
      
      dates.forEach((date, index) => {
        const isStart = index === 0;
        const isEnd = date === period.endDate; // Only true if period is finished
        
        marked[date] = {
          textColor: (isStart || isEnd) ? COLORS.white : COLORS.textPrimary,
          color: (isStart || isEnd) ? COLORS.accent : COLORS.highlight,
          startingDay: isStart,
          endingDay: isEnd,
          disableTouchEvent: true, // Prevents logging on an already-logged day
        };
      });
    });

    // Mark the user's selected day
    if (selectedDate && !marked[selectedDate]) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: COLORS.accent,
        selectedTextColor: COLORS.white,
        disableTouchEvent: false,
      };
    }

    // 2. Calculate Cycle and Period Stats
    const completedPeriods = allPeriods
      .filter(p => p.endDate)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (completedPeriods.length > 0) {
      completedPeriods.forEach(p => {
        // +1 to include both start and end day
        periodDurations.push(daysBetween(p.startDate, p.endDate) + 1);
      });
      avgPeriodDuration = Math.round(
        periodDurations.reduce((a, b) => a + b, 0) / periodDurations.length
      );
    }

    if (completedPeriods.length > 1) {
      for (let i = 1; i < completedPeriods.length; i++) {
        cycleLengths.push(
          daysBetween(
            completedPeriods[i].startDate,
            completedPeriods[i - 1].startDate
          )
        );
      }
      avgCycleLength = Math.round(
        cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length
      );
      lastCycleLength = cycleLengths[cycleLengths.length - 1];

      // 3. Determine Irregularity
      if (
        Math.abs(lastCycleLength - avgCycleLength) > IRREGULARITY_THRESHOLD_DAYS
      ) {
        irregularityStatus = {
          status: 'Irregular',
          message: `Your last cycle was ${Math.abs(
            lastCycleLength - avgCycleLength
          )} days different from your average.`,
        };
      } else if (
        avgCycleLength < MIN_CYCLE_DAYS ||
        avgCycleLength > MAX_CYCLE_DAYS
      ) {
        irregularityStatus = {
          status: 'Irregular',
          message: `Your average cycle of ${avgCycleLength} days is outside the typical 21-35 day range.`,
        };
      } else {
        irregularityStatus = {
          status: 'Regular',
          message: 'Your cycle lengths appear to be consistent.',
        };
      }
    }

    return {
      markedDates: marked,
      activePeriod,
      avgCycleLength,
      lastCycleLength,
      avgPeriodDuration,
      irregularityStatus,
    };
  }, [allPeriods, selectedDate]); // Re-calculates when periods or selected day change

  // --- Handlers ---

  const handleDayPress = day => {
    // Don't allow selecting a day that's already part of a logged period
    if (cycleData.markedDates[day.dateString]?.disableTouchEvent) {
      setSelectedDate(null);
      Alert.alert(
        'Date Logged',
        'This date is already part of a logged period.'
      );
    } else {
      setSelectedDate(day.dateString);
    }
  };

  const handleLogStart = () => {
    if (cycleData.activePeriod) {
      Alert.alert(
        'Active Period',
        'You already have an active period. Please log an "End Date" for it first.'
      );
      return;
    }
    setAllPeriods([
      ...allPeriods,
      {
        id: Date.now().toString(),
        startDate: selectedDate,
        endDate: null, // null signifies an active period
      },
    ]);
    setIsModalVisible(false);
  };

  const handleLogEnd = () => {
    if (!cycleData.activePeriod) {
      Alert.alert('No Active Period', 'You must log a "Period Start" first.');
      return;
    }

    const startDate = new Date(`${cycleData.activePeriod.startDate}T00:00:00`);
    const endDate = new Date(`${selectedDate}T00:00:00`);

    if (endDate < startDate) {
      Alert.alert('Error', 'End date must be on or after the start date.');
      return;
    }

    // Update the active period by replacing it in the array
    setAllPeriods(
      allPeriods.map(p =>
        p.id === cycleData.activePeriod.id
          ? { ...p, endDate: selectedDate }
          : p
      )
    );
    setIsModalVisible(false);
  };

  // --- Render ---

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Calendar
          markingType={'period'}
          markedDates={cycleData.markedDates}
          onDayPress={handleDayPress}
          theme={calendarTheme}
          style={styles.calendar}
        />

        <TouchableOpacity
          disabled={!selectedDate}
          style={[
            styles.logButton,
            !selectedDate && styles.logButtonDisabled,
          ]}
          onPress={() => setIsModalVisible(true)}>
          <Text
            style={[
              styles.logButtonText,
              !selectedDate && styles.logButtonTextDisabled,
            ]}>
            + Log Period
          </Text>
        </TouchableOpacity>

        {/* --- DYNAMIC ANALYSIS CARD --- */}
        <View style={styles.aiCard}>
          <IrregularityStatus
            status={cycleData.irregularityStatus.status}
            message={cycleData.irregularityStatus.message}
          />
          <View style={styles.statsGrid}>
            <StatsRow
              label="Avg. Cycle"
              value={cycleData.avgCycleLength || '--'}
              unit="days"
            />
            <View style={styles.statsDivider} />
            <StatsRow
              label="Last Cycle"
              value={cycleData.lastCycleLength || '--'}
              unit="days"
            />
            <View style={styles.statsDivider} />
            <StatsRow
              label="Avg. Period"
              value={cycleData.avgPeriodDuration || '--'}
              unit="days"
            />
          </View>
        </View>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Enable cycle alerts</Text>
          <Switch
            trackColor={{ false: COLORS.lightGrey, true: COLORS.accent }}
            thumbColor={COLORS.white}
            ios_backgroundColor={COLORS.lightGrey}
            onValueChange={() => setIsAlertsEnabled(prev => !prev)}
            value={isAlertsEnabled}
          />
        </View>
      </View>

      {/* --- Logging Modal --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Log Period for:</Text>
            <Text style={styles.modalDate}>{selectedDate}</Text>

            {/* --- "Log Period Start" Button --- */}
            <TouchableOpacity
              style={[
                styles.modalButton,
                // Disable if a period is already active
                cycleData.activePeriod && styles.modalButtonDisabled,
              ]}
              disabled={!!cycleData.activePeriod}
              onPress={handleLogStart}>
              <Text
                style={[
                  styles.modalButtonText,
                  cycleData.activePeriod && styles.modalButtonTextDisabled,
                ]}>
                Log Period Start
              </Text>
            </TouchableOpacity>

            {/* --- "Log Period End" Button --- */}
            <TouchableOpacity
              style={[
                styles.modalButton,
                // Disable if NO period is active
                !cycleData.activePeriod && styles.modalButtonDisabled,
              ]}
              disabled={!cycleData.activePeriod}
              onPress={handleLogEnd}>
              <Text
                style={[
                  styles.modalButtonText,
                  !cycleData.activePeriod && styles.modalButtonTextDisabled,
                ]}>
                Log Period End
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButtonCancel}
              onPress={() => setIsModalVisible(false)}>
              <Text style={styles.modalButtonCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// --- STYLESHEET ---
const calendarTheme = {
  calendarBackground: COLORS.primaryBackground,
  monthTextColor: COLORS.textPrimary,
  arrowColor: COLORS.accent,
  textSectionTitleColor: COLORS.textSecondary,
  dayTextColor: COLORS.textPrimary,
  todayTextColor: COLORS.accent, // Re-enabled today's date highlight
  textDayFontWeight: '500',
  textMonthFontWeight: 'bold',
  textDayHeaderFontWeight: '500',
  textDayFontSize: 16,
  textMonthFontSize: 18,
  textDayHeaderFontSize: 14,
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primaryBackground },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  calendar: { marginBottom: 15, borderRadius: 12 },
  logButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  logButtonDisabled: {
    backgroundColor: COLORS.disabled,
    shadowColor: 'transparent',
    elevation: 0,
  },
  logButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  logButtonTextDisabled: { color: COLORS.disabledText },
  aiCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  statusTextContainer: { marginLeft: 10, flex: 1 },
  statusTitle: { fontSize: 16, fontWeight: 'bold' },
  statusMessage: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginTop: 2 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statsRow: { alignItems: 'center', flex: 1 },
  statsLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 4 },
  statsValue: { fontSize: 22, color: COLORS.textPrimary, fontWeight: 'bold' },
  statsUnit: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500', marginLeft: 2 },
  statsDivider: { width: 1, backgroundColor: '#F0F0F0' },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginTop: 'auto', // Pushes this to the bottom of the screen
  },
  toggleLabel: { color: COLORS.textPrimary, fontSize: 16 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.modalBackdrop,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary },
  modalDate: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginVertical: 10,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 25,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  modalButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  modalButtonTextDisabled: {
    color: COLORS.disabledText,
  },
  modalButtonCancel: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 5,
  },
  modalButtonCancelText: { color: COLORS.textSecondary, fontSize: 16 },
});

export default CycleIrregularityTimelineScreen;