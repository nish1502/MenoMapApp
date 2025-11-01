import joblib
import os
import pandas as pd
import numpy as np

# --- Configuration ---
# Uses paths relative to this file's location (in ML_PIPELINE)
# os.path.dirname(__file__) gets the current folder: 'ML_PIPELINE'
# os.path.join(..., '..', 'ML_MODELS') goes up one level and into 'ML_MODELS'
ML_MODELS_DIR_ABSOLUTE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ML_MODELS'))
TOP_FEATURES_FILE = 'final_feature_names.pkl' 
REMEDY_MODELS_SUBDIR = 'Relief_Efficacy_Models'
REMEDY_MODELS_DIR = os.path.join(ML_MODELS_DIR_ABSOLUTE, REMEDY_MODELS_SUBDIR)
MODEL_BASE_NAME = 'model_'

# This list must match the remedies you trained
TREATMENT_NAMES = [
    'turmericmilk', 'fenugreekseeds', 'cinnamonwater', 'aloeverajuice',
    'yoga', 'cardio', 'strengthtraining'
]

# This list MUST match the output of your relief models
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
# This is from your script, ready to be sent to the app
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
        'name': 'PCOS/Menopause Yoga Routine',
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
    },
    'aloeverajuice': {
        'name': 'Aloe Vera Juice',
        'type': 'Drink',
        'steps': [
            "1. Mix 2 tbsp of food-grade Aloe Vera Juice with 1 cup of water.",
            "2. Drink once a day, preferably in the morning.",
            "3. Supports digestion and hydration."
        ]
    },
    'strengthtraining': {
        'name': 'Strength Training',
        'type': 'Exercise',
        'steps': [
            "1. Perform 3 sets of 12 repetitions of bodyweight squats.",
            "2. Add 3 sets of 10 push-ups (can be on knees).",
            "3. Aim for 2-3 sessions per week to build muscle mass and boost metabolism."
        ]
    }
}


class ReliefRecommender:
    """
    A service class that loads all efficacy models and provides
    a single recommendation function.
    """
    def __init__(self):
        self.models = {}
        self.model_features = {}
        try:
            # Load the main feature list used for user profiles
            self.profile_feature_names = joblib.load(os.path.join(ML_MODELS_DIR_ABSOLUTE, TOP_FEATURES_FILE))
            print("✅ ReliefRecommender: Loaded base profile features.")
        except Exception as e:
            print(f"❌ ReliefRecommender: CRITICAL ERROR loading base features: {e}")
            self.profile_feature_names = []

        # Load all individual remedy models
        print("⏳ Loading individual relief models...")
        for remedy_name in TREATMENT_NAMES:
            model_path = os.path.join(REMEDY_MODELS_DIR, f'{MODEL_BASE_NAME}{remedy_name}.pkl')
            features_path = os.path.join(REMEDY_MODELS_DIR, f'features_{remedy_name}.pkl')
            
            if os.path.exists(model_path) and os.path.exists(features_path):
                try:
                    self.models[remedy_name] = joblib.load(model_path)
                    self.model_features[remedy_name] = joblib.load(features_path)
                    print(f"  > Loaded relief model: {remedy_name}")
                except Exception as e:
                    # Inconsistent sklearn versions can cause this
                    print(f"  > FAILED to load model {remedy_name}: {e}")
            else:
                # This is not an error, some models might not exist yet
                print(f"  > Skipping model (not found): {remedy_name}.pkl")

    def get_remedy_instructions(self, remedy_name):
        """Fetches the recipe/steps for a given remedy ID."""
        return RECIPES.get(remedy_name.lower(), {
            "name": remedy_name.title(), 
            "type": "General", 
            "steps": ["Instructions not yet available."]
        })

    def recommend_relief(self, user_profile_data: dict, target_symptom: str, current_severity_ternary: int):
        """
        Runs the "what-if" simulation to find the best remedy.
        
        Args:
            user_profile_data (dict): The user's base profile from the 'user_profile' table.
            target_symptom (str): The symptom key, e.g., 'hot_flashes_severity_ternary'.
            current_severity_ternary (int): The user's current severity (0, 1, or 2).
        """
        if not self.models:
            return {"error": "No relief models are loaded."}
            
        best_remedy_id = None
        min_predicted_severity = 3 # Start with worse than "Severe" (2)
        
        # Convert the user_profile dictionary to a DataFrame for scikit-learn
        user_df = pd.DataFrame([user_profile_data])

        print(f"\n--- Running Relief Simulation for {target_symptom} ---")

        for remedy_name, model in self.models.items():
            remedy_feature_names = self.model_features[remedy_name]
            
            # 1. Align Input Data: Create an all-zero DataFrame with the model's expected columns
            X_aligned = pd.DataFrame(0, index=[0], columns=remedy_feature_names)
            
            # 2. Fill in the user's profile data
            for col in user_df.columns:
                if col in X_aligned.columns:
                    X_aligned.loc[0, col] = user_df.loc[0, col]
            
            # 3. Simulate using this remedy
            # Find the remedy column name (e.g., 'remedy_turmericmilk' or 'ex_type_yoga')
            remedy_col_name = None
            for col in remedy_feature_names:
                if col.endswith(remedy_name):
                    remedy_col_name = col
                    break
            
            if remedy_col_name:
                X_aligned.loc[0, remedy_col_name] = 1 # Set this "what-if" feature to 1
            else:
                print(f"  > Skipping {remedy_name}: feature not in model list.")
                continue 

            # 4. Predict Severity
            try:
                predictions = model.predict(X_aligned)
            except Exception as e:
                print(f"  > ERROR predicting with {remedy_name}: {e}")
                continue

            try:
                # Find the index of the symptom we're targeting
                symptom_index = TARGET_COLUMNS.index(target_symptom)
                predicted_severity = predictions[0][symptom_index]
                
                print(f"  > SIM: {remedy_name} -> {SEVERITY_LABELS.get(predicted_severity)}")

                # 5. Check if this is the best outcome so far
                if predicted_severity < min_predicted_severity:
                    min_predicted_severity = predicted_severity
                    best_remedy_id = remedy_name
                # Tie-breaker: if severities are equal, pick the one with 'remedy' over 'ex_type' (simpler)
                elif predicted_severity == min_predicted_severity and best_remedy_id and 'ex_type' in best_remedy_id:
                     best_remedy_id = remedy_name


            except ValueError:
                return {"error": f"Target symptom '{target_symptom}' not found."}
            except Exception as e:
                return {"error": f"Prediction failed for {remedy_name}: {str(e)}"}


        # 6. Final Output
        if best_remedy_id:
            remedy_details = self.get_remedy_instructions(best_remedy_id)
            print(f"--- RECOMMENDED: {best_remedy_id} ---")
            return {
                "target_symptom": target_symptom.replace('_ternary', '').replace('_', ' ').title(),
                "initial_severity": SEVERITY_LABELS.get(current_severity_ternary, "N/A"),
                "best_remedy_id": best_remedy_id,
                "best_remedy_name": remedy_details['name'],
                "predicted_outcome": SEVERITY_LABELS.get(min_predicted_severity, "N/A"),
                "instructions": remedy_details # Send the full instructions object
            }
        else:
            print(f"--- NO RECOMMENDATION FOUND ---")
            return {"error": "No suitable remedy recommendation could be generated."}