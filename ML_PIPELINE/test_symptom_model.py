import pandas as pd
import numpy as np
import joblib
import os

# --- Configuration ---
# Old: ML_MODELS_DIR = 'ML_MODELS' 
# New: Go up one directory (..) and then look for ML_MODELS
ML_MODELS_DIR = '..\\ML_MODELS' 
MODEL_FILE_NAME = 'symptom_prediction_model_final.pkl'
FEATURE_NAMES_FILE = 'final_feature_names.pkl'

# --- The 11 Ternary Target Columns (0=Mild, 1=Moderate, 2=Severe) ---
TARGET_COLUMNS = [
    'hot_flashes_severity_ternary', 
    'night_sweats_severity_ternary', 
    'mood_swings_severity_ternary', 
    'sleep_disturbances_severity_ternary',
    'fatigue_severity_meno_ternary', 
    'brain_fog_severity_ternary', 
    'hair_growth_on_facebody',
    'acne_severity_ternary', 
    'weight_gain_bellyfat_severity_ternary', 
    'mood_swings_irritability_severity_ternary', 
    'fatigue_severity_pcos_ternary'
]

# Mapping the ternary results back to human-readable labels
SEVERITY_LABELS = {
    0: "Mild/None",
    1: "Moderate",
    2: "Severe"
}

# Mapping of Self-Reported Stage Encoded value back to meaning
STAGE_LABELS = {
    0: "Premenopause",
    1: "Perimenopause",
    2: "Menopause",
    3: "Postmenopause",
    -1: "Unknown"
}


def run_prediction(new_user_data):
    """Loads the model and feature names, ensures input conformity, and runs prediction."""
    
    model_path = os.path.join(ML_MODELS_DIR, MODEL_FILE_NAME)
    feature_names_path = os.path.join(ML_MODELS_DIR, FEATURE_NAMES_FILE)

    if not os.path.exists(model_path) or not os.path.exists(feature_names_path):
        print("❌ Error: Model or feature names file not found. Ensure training ran successfully.")
        return

    # 1. Load Model and Feature Names
    model = joblib.load(model_path)
    feature_names = joblib.load(feature_names_path)
    print("✅ Model loaded successfully.")

    # 2. Prepare Input DataFrame
    input_df = pd.DataFrame([new_user_data])

    # 3. Align Input Features
    # Create a DataFrame with all expected feature columns set to 0
    aligned_input = pd.DataFrame(0, index=[0], columns=feature_names)
    
    # Fill in the specific values provided by the user
    for col, value in input_df.iloc[0].items():
        if col in aligned_input.columns:
            aligned_input[col] = value
        # NOTE: Any feature not manually set below remains at its default encoded value (usually 0).

    # Ensure the columns are in the exact order the model expects
    X_aligned = aligned_input[feature_names]

    # 4. Predict
    predictions = model.predict(X_aligned)
    
    # 5. Decode and Display Results
    print("\n--- Prediction Results ---")
    
    # Extract the predicted stage (which is one of the features used in X)
    predicted_stage_encoded = X_aligned['self_reported_stage_encoded'].iloc[0]
    predicted_stage_label = STAGE_LABELS.get(predicted_stage_encoded, "N/A or Custom Stage")
    
    print(f"**USER PROFILE STAGE (Input Feature):** {predicted_stage_label}")
    print("-" * 30)

    # Decode symptom predictions
    prediction_results = {}
    for i, symptom in enumerate(TARGET_COLUMNS):
        # We need the base symptom name without the '_ternary' suffix
        symptom_base = symptom.replace('_severity_ternary', '').replace('_ternary', '').replace('_', ' ').title()
        severity_score = predictions[0][i]
        prediction_results[symptom_base] = SEVERITY_LABELS.get(severity_score, "Unknown")
        
    for k, v in prediction_results.items():
        print(f"Predicted {k:25s}: {v}")
    print("--------------------------")
    

if __name__ == '__main__':
    # Change CWD to script directory for path resolution
    script_dir = os.path.dirname(os.path.abspath(__file__)) 
    os.chdir(script_dir)
    
    # --- SAMPLE USER INPUT DATA ---
    # This sample represents a 45-49 year old with high stress, overweight,
    # and moderate caffeine intake, currently reporting as Perimenopausal (1).
    # All other one-hot encoded features are assumed to be 0 unless set here.
    
    # NOTE: These keys MUST match the FINAL engineered column names from the preprocessor!
    sample_user_profile = {
        # General/Demographics (Engineered Features)
        'age_group_simplified_40_49': 1,           # Age: 40-49
        'bmi_category_overweight': 1,              # BMI: Overweight
        'stress_level_encoded': 3,                 # Stress: High (3)
        'caffeine_group_caffeine_moderate_high': 1, # Caffeine: Moderate/High
        'sleep_group_short_sleep': 1,              # Sleep: Short (<6 hours)
        
        # Cycle/Stage Features
        'self_reported_stage_encoded': 1,          # Stage: Perimenopause (1)
        'cycle_regularity_encoded': 2,             # Irregular (2)
        'skipped_periods_months': 2,               # Skipped 1-3 months (midpoint 2)
        'irregular_periods_freq': 4,               # Frequent (>3/month)
        
        # Lifestyle/Diet Features (Selected examples)
        'ex_type_yoga': 1,                         # Exercise: Yoga
        'worsen_food_highsugar': 1,                # Worsened by high sugar
        'diet_goal_calcium_rich': 1,               # Diet goal: Calcium rich
        'remedy_turmericmilk': 1,                  # Remedy: Turmeric Milk
    }
    
    run_prediction(sample_user_profile)