import pandas as pd
import joblib
import os
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import f1_score

# --- Configuration ---
# --- ABSOLUTE PATH DEFINITION ---
# Base path for all ML model artifacts (where final_feature_names.pkl resides)
ML_MODELS_DIR_ABSOLUTE = r'C:\Users\hp\Desktop\MenoMapApp\ML_MODELS'

# File names (relative to ML_MODELS_DIR_ABSOLUTE)
TOP_FEATURES_FILE = 'final_feature_names.pkl' 
REMEDY_MODELS_SUBDIR = 'Relief_Efficacy_Models'

REMEDY_MODELS_DIR = os.path.join(ML_MODELS_DIR_ABSOLUTE, REMEDY_MODELS_SUBDIR)
MODEL_BASE_NAME = 'model_'
# --- END ABSOLUTE PATH CONFIG ---

# Define the treatments/practices that we want to model efficacy for
TREATMENT_NAMES = [
    'turmericmilk', 'fenugreekseeds', 'cinnamonwater', 'aloeverajuice',
    'yoga', 'cardio', 'strengthtraining'
]

# Define the target symptom columns (Ternary Scale)
TARGET_COLUMNS = [
    'hot_flashes_severity_ternary', 'night_sweats_severity_ternary', 
    'mood_swings_severity_ternary', 'sleep_disturbances_severity_ternary',
    'fatigue_severity_meno_ternary', 'brain_fog_severity_ternary', 
    'hair_growth_on_facebody_ternary', 'acne_severity_ternary', 
    'weight_gain_bellyfat_severity_ternary', 'mood_swings_irritability_severity_ternary', 
    'fatigue_severity_pcos_ternary'
]

SEVERITY_LABELS = {0: "Mild/None", 1: "Moderate", 2: "Severe"}

# --- Expanded Recipe Database (Actionable Steps) ---
RECIPES = {
    'turmericmilk': {
        'name': 'Golden Milk (Turmeric Milk)',
        'type': 'Drink',
        'steps': [
            "1. Combine 1 cup Milk (dairy or non-dairy) and 1/2 tsp Turmeric Powder in a saucepan.",
            "2. Heat gently until warm (do not boil aggressively).",
            "3. Add a pinch of Black Pepper (essential for absorption).",
            "4. Consume 30 mins before bed for anti-inflammatory support."
        ]
    },
    'cinnamonwater': {
        'name': 'Cinnamon Water Detox',
        'type': 'Drink',
        'steps': [
            "1. Boil 1 cup of water with 1/2 tsp of Cinnamon Powder or 1 stick.",
            "2. Simmer for 5 minutes.",
            "3. Strain and drink once per day to help regulate insulin and blood sugar."
        ]
    },
    'fenugreekseeds': {
        'name': 'Fenugreek (Methi Dana) Water',
        'type': 'Drink',
        'steps': [
            "1. Soak 1 tsp Fenugreek Seeds in 1 cup water overnight.",
            "2. In the morning, strain the water and drink on an empty stomach.",
            "3. Helps regulate blood sugar and supports menstrual regularity."
        ]
    },
    'yoga': {
        'name': 'PCOS/Menopause Yoga Routine (e.g., Cobra, Butterfly)',
        'type': 'Exercise',
        'steps': [
            "1. Start with 5 rounds of Surya Namaskar (Sun Salutations).",
            "2. Practice Supta Baddha Konasana (Reclined Butterfly) for 5 minutes (pelvic relief).",
            "3. End with Anulom Vilom Pranayama for 10 minutes (stress reduction)."
        ]
    },
    'cardio': {
        'name': 'Brisk Walking / Cardio',
        'type': 'Exercise',
        'steps': [
            "1. Engage in Brisk Walking or swimming for 30 minutes daily.",
            "2. Maintain a pace where you can talk but not sing.",
            "3. Helps prevent weight gain and supports heart health."
        ]
    }
}


def get_remedy_instructions(remedy_name):
    """Fetches instructions for a recommended remedy."""
    return RECIPES.get(remedy_name.lower(), {"name": remedy_name.title(), "type": "General", "steps": ["Instructions for this remedy are not yet available in the database."]})

def recommend_relief(user_profile_data, target_symptom, current_severity):
    """
    Predicts the efficacy of all trained remedies for a single target symptom 
    and recommends the remedy resulting in the lowest predicted severity.
    """
    
    # 1. Robustly Load Profile Feature Names using the absolute path
    try:
        model_names_path = os.path.join(ML_MODELS_DIR_ABSOLUTE, TOP_FEATURES_FILE)
        profile_feature_names = joblib.load(model_names_path)
    except FileNotFoundError:
        return {"error": f"Feature names file not found. Script looked for: {model_names_path}"}

    best_remedy = None
    min_predicted_severity = 3
    
    # DataFrame for user input and alignment
    user_df = pd.DataFrame([user_profile_data])
    
    # --- Dynamic Efficacy Testing Loop ---
    
    for remedy_name in TREATMENT_NAMES:
        
        # Build absolute paths for the remedy models
        model_path = os.path.join(REMEDY_MODELS_DIR, f'{MODEL_BASE_NAME}{remedy_name}.pkl')
        features_path = os.path.join(REMEDY_MODELS_DIR, f'features_{remedy_name}.pkl')
        
        if not os.path.exists(model_path):
            continue
            
        model = joblib.load(model_path)
        remedy_feature_names = joblib.load(features_path)
        
        # 2. Align Input Data for the current remedy model
        X_aligned = pd.DataFrame(0, index=[0], columns=remedy_feature_names)
        
        # Fill profile features
        for col, value in user_df.iloc[0].items():
            if col in X_aligned.columns:
                X_aligned.loc[0, col] = value
        
        # Set the current remedy feature to 1 to simulate its use
        remedy_feature_col = [f for f in remedy_feature_names if f.startswith(remedy_name)]
        if remedy_feature_col:
             X_aligned.loc[0, remedy_feature_col[0]] = 1
        
        # 3. Predict Severity for the Target Symptom
        predictions = model.predict(X_aligned)
        
        # Find the index of the target symptom in the TARGET_COLUMNS list
        try:
            symptom_index = TARGET_COLUMNS.index(target_symptom)
            predicted_severity = predictions[0][symptom_index]

            # 4. Determine Best Remedy (Lowest Predicted Score)
            if predicted_severity < min_predicted_severity:
                min_predicted_severity = predicted_severity
                best_remedy = remedy_name

        except ValueError:
            return {"error": f"Target symptom '{target_symptom}' not found in model targets."}

    # --- Final Recommendation Output ---
    if best_remedy:
        final_recommendation = {
            "target_symptom": target_symptom.replace('_ternary', '').replace('_', ' ').title(),
            "initial_severity": SEVERITY_LABELS[current_severity],
            "best_remedy": best_remedy.title(),
            "predicted_outcome": SEVERITY_LABELS[min_predicted_severity],
            "instructions": get_remedy_instructions(best_remedy)
        }
        return final_recommendation
    else:
        return {"error": "No trained remedy models were found to make a recommendation."}


# --- Simulation Execution ---
if __name__ == '__main__':
    # NOTE: CWD change is only for standard output pathing, not for model loading now
    script_dir = os.path.dirname(os.path.abspath(__file__)) 
    os.chdir(script_dir)

    CURRENT_SYMPTOM_SEVERITY = 2 
    target_symptom_key = 'fatigue_severity_meno_ternary'

    # SIMULATED USER PROFILE (Matching the features in final_feature_names.pkl)
    sample_user_profile = {
        'stress_level_encoded': 3,
        'self_reported_stage_encoded': 1,
        'cycle_regularity_encoded': 2,
        'flow_intensity_encoded': 2,
        'exercise_frequency_wk': 1.5,
        'age_group_simplified_40_49': 1,
        'cycle_length_days': 26.0,
        'diet_goal_high_protein': 1,
        'age_group_simplified_50_59': 0, 
        'worsen_food_friedfoods': 1,
        'avoided_gluten': 0,
        'ex_type_none_reported': 0,
        'remedy_turmericmilk': 0,
        'diet_goal_calcium_rich': 1,
        'avoided_soy': 0,
        'remedy_cinnamonwater': 0,
        'remedy_fenugreekseeds': 0,
        'age_group_simplified_younger_than_40': 0,
        
        # Explicitly setting the currently selected remedy to 0 in the profile 
        'remedy_aloeverajuice': 0,
        'ex_type_yoga': 0,
        'ex_type_cardio': 0,
        'ex_type_strengthtraining': 0
    }

    # 2. Run the dynamic recommendation engine
    recommendation = recommend_relief(sample_user_profile, target_symptom_key, CURRENT_SYMPTOM_SEVERITY)

    print("\n" + "="*60)
    print("PERSONALIZED RELIEF RECOMMENDATION REPORT")
    print("="*60)
    
    if "error" in recommendation:
        print(f"ERROR: {recommendation['error']}")
    else:
        print(f"Symptom Tracked: {recommendation['target_symptom']}")
        print(f"Initial Severity: {recommendation['initial_severity']}")
        print("-" * 30)
        print(f"BEST ACTION: {recommendation['best_remedy']}")
        print(f"Predicted Outcome: Severity expected to drop to {recommendation['predicted_outcome']}\n")
        
        # --- Print Actionable Steps ---
        if recommendation['instructions']:
            print(f"Actionable Steps for {recommendation['instructions']['name']}:")
            print("-" * 40)
            for step in recommendation['instructions']['steps']:
                print(f" {step}")
        else:
            print("Actionable steps not found in the recipe database.")