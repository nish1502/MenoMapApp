import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, useTheme, ActivityIndicator, RadioButton, Checkbox, TextInput as PaperTextInput } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext'; // <-- Import the "brain"

// Helper Component for Radio Buttons
const RadioGroup = ({ label, value, onValueChange, options }) => {
  const theme = useTheme();
  return (
    <View style={styles.questionGroup}>
      <Text style={styles.label}>{label}</Text>
      <RadioButton.Group onValueChange={onValueChange} value={value}>
        {options.map(option => (
          <View key={option.value} style={styles.radioOption}>
            <RadioButton value={option.value} color={theme.colors.accent} />
            <Text style={styles.optionLabel}>{option.label}</Text>
          </View>
        ))}
      </RadioButton.Group>
    </View>
  );
};

// Helper Component for Checkboxes
const CheckGroup = ({ label, values, onToggle, options }) => {
  const theme = useTheme();
  return (
    <View style={styles.questionGroup}>
      <Text style={styles.label}>{label}</Text>
      {options.map(option => (
        <View key={option.key} style={styles.radioOption}>
          <Checkbox
            status={values[option.key] ? 'checked' : 'unchecked'}
            onPress={() => onToggle(option.key)}
            color={theme.colors.accent}
          />
          <Text style={styles.optionLabel}>{option.label}</Text>
        </View>
      ))}
    </View>
  );
};


const OnboardingScreen = () => {
  const { saveOnboardingProfile, isApiLoading } = useAuth(); // <-- Get the save function
  const theme = useTheme();

  // --- State for all form questions ---
  // These values map directly to the ML model's needs
  const [ageGroup, setAgeGroup] = useState('40_49'); // 'age_group_simplified_...'
  const [stress, setStress] = useState('3'); // 'stress_level_encoded'
  const [cycleStage, setCycleStage] = useState('1'); // 'self_reported_stage_encoded'
  const [cycleRegularity, setCycleRegularity] = useState('2'); // 'cycle_regularity_encoded'
  const [cycleLength, setCycleLength] = useState('26'); // 'cycle_length_days'
  const [flow, setFlow] = useState('2'); // 'flow_intensity_encoded'
  const [exercise, setExercise] = useState('1.5'); // 'exercise_frequency_wk'
  
  const [dietGoals, setDietGoals] = useState({
    'diet_goal_high_protein': true,
    'diet_goal_calcium_rich': true,
  });
  
  const [worsenFoods, setWorsenFoods] = useState({
    'worsen_food_friedfoods': true,
  });

  const [avoidedFoods, setAvoidedFoods] = useState({
    'avoided_gluten': false,
    'avoided_soy': false,
  });

  // --- Handler Functions ---
  const handleToggle = (setter, state, key) => {
    setter(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const onSubmit = () => {
    // 1. Convert state into the final JSON profile
    const profileData = {
      // Age
      'age_group_simplified_40_49': ageGroup === '40_49' ? 1 : 0,
      'age_group_simplified_50_59': ageGroup === '50_59' ? 1 : 0,
      'age_group_simplified_younger_than_40': ageGroup === 'younger_than_40' ? 1 : 0,
      // Stress
      'stress_level_encoded': parseInt(stress),
      // Cycle
      'self_reported_stage_encoded': parseInt(cycleStage),
      'cycle_regularity_encoded': parseInt(cycleRegularity),
      'cycle_length_days': parseFloat(cycleLength) || 0,
      'flow_intensity_encoded': parseInt(flow),
      // Lifestyle
      'exercise_frequency_wk': parseFloat(exercise),
      // Diet & Foods (merge checkbox states)
      ...dietGoals,
      ...worsenFoods,
      ...avoidedFoods,
      
      // Set defaults for other keys your model expects
      'ex_type_none_reported': 0,
      'remedy_turmericmilk': 0,
      'remedy_cinnamonwater': 0,
      'remedy_fenugreekseeds': 0,
    };
    
    console.log("Saving Onboarding Profile:", JSON.stringify(profileData, null, 2));
    
    // 2. Call the save function from AuthContext
    saveOnboardingProfile(profileData);
  };

  return (
    <View style={{flex: 1, backgroundColor: theme.colors.background}}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>Welcome to MenoMap!</Text>
        <Text style={[styles.subtitle, { color: theme.colors.text }]}>
          Lets personalize your experience. This data helps our AI give you the best advice.
        </Text>

        {/* --- Form --- */}
        <RadioGroup
          label="What is your age range?"
          value={ageGroup}
          onValueChange={setAgeGroup}
          options={[
            { label: 'Under 40', value: 'younger_than_40' },
            { label: '40 - 49', value: '40_49' },
            { label: '50 - 59', value: '50_59' },
          ]}
        />

        <RadioGroup
          label="What is your current stress level?"
          value={stress}
          onValueChange={setStress}
          options={[
            { label: 'Low', value: '1' },
            { label: 'Moderate', value: '2' },
            { label: 'High', value: '3' },
          ]}
        />
        
        <RadioGroup
          label="Which stage feels most accurate right now?"
          value={cycleStage}
          onValueChange={setCycleStage}
          options={[
            { label: 'Premenopause (Regular cycles)', value: '0' },
            { label: 'Perimenopause (Irregular cycles, symptoms)', value: '1' },
            { label: 'Postmenopause (No period > 12 months)', value: '3' },
          ]}
        />
        
        <RadioGroup
          label="How regular are your cycles?"
          value={cycleRegularity}
          onValueChange={setCycleRegularity}
          options={[
            { label: 'Regular', value: '1' },
            { label: 'Irregular', value: '2' },
            { label: 'No Periods', value: '999' },
          ]}
        />

        <PaperTextInput
          label="Average Cycle Length (e.g., 28)"
          value={cycleLength}
          onChangeText={setCycleLength}
          style={styles.input}
          theme={{ roundness: 10 }}
          mode="outlined"
          keyboardType="numeric"
          activeOutlineColor={theme.colors.accent}
        />

        <RadioGroup
          label="What is your typical flow intensity?"
          value={flow}
          onValueChange={setFlow}
          options={[
            { label: 'Light', value: '1' },
            { label: 'Medium', value: '2' },
            { label: 'Heavy', value: '3' },
          ]}
        />

        <RadioGroup
          label="How often do you exercise?"
          value={exercise}
          onValueChange={setExercise}
          options={[
            { label: 'Rarely / None', value: '0' },
            { label: '1-2 times/week', value: '1.5' },
            { label: '3-4 times/week', value: '3.5' },
          ]}
        />

        <CheckGroup
          label="What are your diet goals? (Select all)"
          values={dietGoals}
          onToggle={(key) => handleToggle(setDietGoals, dietGoals, key)}
          options={[
            { label: 'High Protein', key: 'diet_goal_high_protein' },
            { label: 'Calcium Rich', key: 'diet_goal_calcium_rich' },
          ]}
        />
        
        <CheckGroup
          label="Do you avoid any of these? (Select all)"
          values={avoidedFoods}
          onToggle={(key) => handleToggle(setAvoidedFoods, avoidedFoods, key)}
          options={[
            { label: 'Gluten', key: 'avoided_gluten' },
            { label: 'Soy', key: 'avoided_soy' },
          ]}
        />

        <CheckGroup
          label="Do any foods worsen your symptoms? (Select all)"
          values={worsenFoods}
          onToggle={(key) => handleToggle(setWorsenFoods, worsenFoods, key)}
          options={[
            { label: 'Fried Foods', key: 'worsen_food_friedfoods' },
          ]}
        />
        
        <Button
          mode="contained"
          onPress={onSubmit}
          disabled={isApiLoading}
          style={[styles.button, { backgroundColor: theme.colors.accent }]}
          labelStyle={styles.buttonText}
          contentStyle={styles.buttonContent}
        >
          {isApiLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            'Finish & Start My Journey'
          )}
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  questionGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },
  button: {
    borderRadius: 30,
    marginTop: 20,
    marginBottom: 40,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default OnboardingScreen;