import pandas as pd
import numpy as np
import joblib
import os
import random
import warnings
import json
from pandas.errors import SettingWithCopyWarning
warnings.filterwarnings("ignore", category=SettingWithCopyWarning)

# --- Configuration (Copied from your script) ---
ML_MODELS_DIR = 'ML_MODELS'
SYMPTOM_MODEL_FILE = 'symptom_prediction_model_final.pkl'
SYMPTOM_FEATURE_NAMES_FILE = 'final_feature_names.pkl'
DIET_SUITABILITY_MODEL_FILE = 'diet_suitability_predictor.pkl'
DIET_FEATURE_NAMES_FILE = 'diet_predictor_features.pkl'

DIET_DATA_PROCESSED_DIR = 'DIET_DATA_PROCESSED'
CLEANED_RECIPES_FILE = 'cleaned_indian_recipes_for_ml.csv'

# Mapping Constants
MEAL_TYPES = ['Breakfast', 'Lunch', 'Evening Snacks', 'Dinner']
DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
VEG_MAP = {'Vegetarian': 0, 'Non-Vegetarian': 1}
SYMPTOM_GOALS = {
    'hot_flashes_severity_ternary': {'trigger_avoid': ['caffeine', 'spicy']},
    'acne_severity_ternary': {'trigger_avoid': ['high_sugar', 'dairy']},
    'weight_gain_bellyfat_severity_ternary': {'trigger_avoid': ['high_sugar', 'high_carb']},
    'fatigue_severity_pcos_ternary': {'trigger_avoid': ['high_carb']},
    'hair_growth_on_facebody': {'trigger_avoid': ['dairy']},
    'sleep_disturbances_severity_ternary': {'trigger_avoid': ['caffeine']},
    'mood_swings_severity_ternary': {'trigger_avoid': ['high_sugar']},
    'brain_fog_severity_ternary': {'trigger_avoid': ['high_carb']},
    'fatigue_severity_meno_ternary': {'trigger_avoid': ['high_carb']},
    'mood_swings_irritability_severity_ternary': {'trigger_avoid': ['high_sugar']},
}
FOOD_TAGS = {
    'spicy': 'is_spicy_flag', 'caffeine': 'contains_caffeine_flag',
    'dairy': 'contains_dairy_flag', 'high_sugar': 'is_high_sugar_flag',
    'high_carb': 'is_high_carb_flag', 'alcohol': 'contains_alcohol_flag',
    'processed': 'is_processed_flag'
}

# --- This is the "Answer Key" from your trained_diet_model.py ---
# We use these keys to build the empty feature vector.
BASE_FEATURE_KEYS = [
    'age_group_simplified_40_49', 'bmi_category_overweight', 'stress_level_encoded',
    'caffeine_group_caffeine_moderate_high', 'cycle_regularity_encoded', 'skipped_periods_months',
    'irregular_periods_freq', 'hot_flashes_severity_ternary', 'acne_severity_ternary',
    'weight_gain_bellyfat_severity_ternary', 'fatigue_severity_pcos_ternary',
    'sleep_disturbances_severity_ternary', 'mood_swings_severity_ternary',
    'brain_fog_severity_ternary', 'hair_growth_on_facebody', 'mood_swings_irritability_severity_ternary',
    'self_reported_stage_encoded', 'fatigue_severity_meno_ternary', 'hair_growth_on_facebody_ternary',
    'water_intake_liters', 'bmi_category_normal', 'bmi_category_obese', 'sleep_group_normal_sleep',
    'caffeine_group_caffeine_low', 'screen_group_screen_moderate', 'avoided_none_avoided',
    'avoided_dairy', 'avoided_nan', 'avoided_seafood', 'diet_goal_iron_rich', 'diet_goal_low_gi',
    'diet_goal_low_glycemic_index', 'diet_goal_nan', 'diet_goal_omega_3_rich', 'worsen_food_dairy',
    'worsen_food_highsugar', 'ex_type_cardio', 'ex_type_strength', 'ex_type_strengthtraining',
    'ex_type_yoga', 'remedy_aloeverajuice', 'age_group_simplified_50_59', 'age_group_simplified_younger_than_40',
    'avoided_gluten', 'avoided_soy', 'caffeine_group_caffeine_none'
]


class AdaptiveDietPlanner:
    def __init__(self, recipe_path, symptom_model_path, symptom_features_path,
                 diet_model_path, diet_features_path):
        try:
            self.recipes_full = pd.read_csv(recipe_path)
            self.symptom_model = joblib.load(symptom_model_path)
            self.symptom_feature_names = joblib.load(symptom_features_path)
            self.diet_model = joblib.load(diet_model_path)
            self.diet_feature_names = joblib.load(diet_features_path)

            if 'is_processed_flag' in self.recipes_full.columns:
                self.recipes_full = self.recipes_full[self.recipes_full['is_processed_flag'] == 0].copy()

            self.symptom_target_cols = list(SYMPTOM_GOALS.keys())

            # Feature Separation Logic
            set_diet = set(self.diet_feature_names)
            set_user = set(self.symptom_feature_names)
            set_recipe_cols = set(self.recipes_full.columns)

            self.user_only_features = sorted(list(set_diet.intersection(set_user)))
            self.recipe_only_features = sorted(list(set_diet.intersection(set_recipe_cols).difference(set_user)))

        except Exception as e:
            raise RuntimeError(f"Failed to initialize AdaptiveDietPlanner. Error: {e}. Check all file paths.")

    # -------------------------
    # 'TRANSLATION' FUNCTION (No changes)
    # -------------------------
    def _build_feature_vector_from_request(self, raw_data: dict) -> dict:
        """
        Translates raw JSON request data into the feature-engineered
        dictionary that the ML models expect.
        """
        print(f"Starting feature vector translation for data: {raw_data}")

        # 1. Start with a dictionary of all 0s for all user-related features
        # We use the keys from your `base_features` dictionary.
        features = {key: 0 for key in BASE_FEATURE_KEYS if key in self.symptom_feature_names}

        # --- 2. MAP RAW DATA TO ENGINEERED FEATURES ---
        # Your frontend must send this data!

        # === MAPPING 'age' ===
        age = raw_data.get('age')
        if age:
            try:
                age_val = int(age)
                if age_val < 40:
                    features['age_group_simplified_younger_than_40'] = 1
                elif 40 <= age_val <= 49:
                    features['age_group_simplified_40_49'] = 1
                elif 50 <= age_val <= 59:
                    features['age_group_simplified_50_59'] = 1
            except ValueError:
                print(f"Warning: Could not parse age '{age}'")

        # === MAPPING 'mood' ===
        mood = raw_data.get('mood')
        if mood == 'stressed':
            features['stress_level_encoded'] = 3
        elif mood == 'moderate':
            features['stress_level_encoded'] = 2
        elif mood == 'calm':
            features['stress_level_encoded'] = 1

        # === MAPPING 'symptoms' ===
        # Your frontend MUST send symptoms as a dictionary of severities:
        # e.g., "symptoms": {"hot_flashes": 2, "acne": 1, "brain_fog": 0}
        symptoms_data = raw_data.get('symptoms', {})
        if isinstance(symptoms_data, dict):
            for symptom_name, severity in symptoms_data.items():
                
                # Check for ternary keys (e.g., 'hot_flashes_severity_ternary')
                feature_key_ternary = f"{symptom_name}_severity_ternary"
                if feature_key_ternary in features:
                    features[feature_key_ternary] = int(severity)
                
                # Check for other symptom keys (e.g., 'hair_growth_on_facebody')
                elif symptom_name in features:
                    features[symptom_name] = int(severity)

        # === MAPPING 'extra' data (e.g., BMI, Cycle, etc.) ===
        # Your frontend MUST send this in an 'extra' object
        extra = raw_data.get('extra', {})

        # Map BMI
        bmi_cat = extra.get('bmi_category')  # e.g., "overweight"
        if bmi_cat:
            bmi_feature_key = f"bmi_category_{bmi_cat.lower()}"  # "bmi_category_overweight"
            if bmi_feature_key in features:
                features[bmi_feature_key] = 1

        # Map Cycle Regularity
        cycle = extra.get('cycle_regularity_encoded') # e.g., 2
        if cycle:
             features['cycle_regularity_encoded'] = int(cycle)

        # Map Stage
        stage = extra.get('self_reported_stage_encoded') # e.g., 1
        if stage:
            features['self_reported_stage_encoded'] = int(stage)
        
        # 📢 --- YOU MUST ADD MAPPINGS FOR ALL OTHER FEATURES ---
        # e.g., 'caffeine_group_...', 'skipped_periods_months', etc.
        # The frontend must send them, and you must map them here.

        print(f"Built features (non-zero): { {k: v for k, v in features.items() if v > 0} }")
        return features


    # -------------------------
    # "CONTROLLER" FUNCTION (No changes)
    # -------------------------
    def get_diet_recommendation(self, request_data=None, user_row=None):
        """
        Generate weekly diet plan based on DYNAMIC user data.
        """
        # 1. Get the raw JSON data from the request
        data = request_data or {}
        if not data and user_row:
            # This logic is for reading from the DB if needed
            try:
                data['age'] = user_row.get('age')
                data['mood'] = user_row.get('mood')
                data['symptoms'] = json.loads(user_row.get('symptoms', '{}'))
                data['preferences'] = json.loads(user_row.get('preferences', '[]'))
                data['extra'] = json.loads(user_row.get('extra_json', '{}'))
            except json.JSONDecodeError as e:
                return {"error": f"Corrupt data in database: {e}"}

        if not data:
            return {"error": "No input data provided."}
        
        print(f"Service processing new data: {data}")

        # --- 2. Translate Raw Data to ML Feature Vector ---
        try:
            # This is the NEW, critical step
            user_profile_features = self._build_feature_vector_from_request(data)
        except Exception as e:
            return {"error": f"Failed to build feature vector: {e}"}

        # --- 3. Extract OTHER dynamic arguments ---
        preferences_list = data.get('preferences', [])
        
        diet_preference = 'Vegetarian' # Default
        if 'Non-Vegetarian' in preferences_list:
            diet_preference = 'Non-Vegetarian'
        
        # Frontend must send 'region' and 'remedies'
        region = data.get('extra', {}).get('region', 'South') # Default
        remedies = data.get('remedies', ['Herbal Tea']) # Default

        # --- 4. Call the core ML logic ---
        try:
            weekly_plan_dict = self.generate_weekly_plan(
                user_profile_features=user_profile_features,
                current_remedies_list=remedies,
                region=region,
                diet_preference=diet_preference
            )
            
            # Format the output for JSON
            weekly_plan_list = []
            for day, day_data in weekly_plan_dict.items():
                plan_day = day_data.copy()
                plan_day['day'] = day
                weekly_plan_list.append(plan_day)

            print("✅ Recommendation generated successfully.")
            return {"week_plan": weekly_plan_list}

        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"error": f"Error in generate_weekly_plan: {e}"}

    
    # --- HELPER FUNCTIONS (No changes) ---

    def _align_user_features(self, user_profile_features, feature_names_list):
        """Aligns a single user's features to the exact list required by a model."""
        aligned_input = pd.DataFrame(0, index=[0], columns=feature_names_list)
        for col, value in user_profile_features.items():
            if col in aligned_input.columns:
                aligned_input[col] = value
        return aligned_input[feature_names_list]

    # -------------------------
    # ✅ UPDATED FILTER FUNCTION ↓↓↓
    # -------------------------
    def _filter_recipes(self, df, hard_constraints, diet_preference):
        """
        Applies ONLY essential filters (diet pref, triggers).
        Region filter is now handled inside generate_weekly_plan.
        """
        veg_code = VEG_MAP.get(diet_preference, 0)
        
        # 💡 REMOVED: (df['Region'] == region)
        filtered = df[df['veg_nonveg_flag'] == veg_code].copy()

        for trigger in set(hard_constraints):
            tag_col = FOOD_TAGS.get(trigger)
            if tag_col and tag_col in filtered.columns:
                filtered = filtered[filtered[tag_col] == 0]
        
        return filtered
        
    def _augment_food_display(self, recipe_row):
        """Creates a detailed, readable string for the output table."""
        tags = []
        if recipe_row.get('contains_dairy_flag', 0) == 1: tags.append("Dairy")
        if recipe_row.get('is_spicy_flag', 0) == 1: tags.append("Spicy")
        # Check for 'freesugar_g' or the renamed 'is_high_sugar_flag'
        if recipe_row.get('is_high_sugar_flag', 0) == 1 or recipe_row.get('unit_serving_freesugar_g', 0) > 10:
             tags.append("High Sugar")
        
        nutrition = "Details not available" # Placeholder
        # Check for renamed columns
        carb_col = 'carb_g' if 'carb_g' in recipe_row else 'unit_serving_carb_g'
        prot_col = 'protein_g' if 'protein_g' in recipe_row else 'unit_serving_protein_g'
        fat_col = 'fat_g' if 'fat_g' in recipe_row else 'unit_serving_fat_g'

        if carb_col in recipe_row:
            nutrition = (
                f"C:{recipe_row.get(carb_col, 0):.1f}g "
                f"P:{recipe_row.get(prot_col, 0):.1f}g "
                f"F:{recipe_row.get(fat_col, 0):.1f}g"
            )

        tags_str = f" [!{', '.join(tags)}]" if tags else ""
        
        # Check for 'Region' column
        region_str = f" ({recipe_row['Region']})" if 'Region' in recipe_row else ""
        
        return (
            f"{recipe_row['food_name']}{region_str}{tags_str}\n"
            f"({nutrition})"
        )

    # -------------------------
    # ✅ UPDATED PLAN GENERATION FUNCTION ↓↓↓
    # -------------------------
    def generate_weekly_plan(self, user_profile_features, current_remedies_list,
                             region='South', diet_preference='Vegetarian'):
        """
        Generates a unique 7-day plan with CASCADING logic
        to prevent "No suitable options" errors.
        """
        
        # 1. Predict Symptoms
        X_symptom_aligned = self._align_user_features(user_profile_features, self.symptom_feature_names)
        predicted_severities = self.symptom_model.predict(X_symptom_aligned)[0]

        hard_constraints = []
        for i, symptom_col in enumerate(self.symptom_target_cols):
            if predicted_severities[i] == 2:
                hard_constraints.extend(SYMPTOM_GOALS.get(symptom_col, {}).get('trigger_avoid', []))
        
        # 2. Apply ONLY ESSENTIAL Hard Filters
        # 💡 We no longer filter by region here.
        recipes_filtered = self._filter_recipes(self.recipes_full, hard_constraints,
                                                diet_preference)

        if recipes_filtered.empty:
            print("🛑 Error: No recipes found matching basic diet preference and triggers. Check dataset.")
            return {day: {'Remedy': "No options", 'Breakfast': "No options", 
                          'Lunch': "No options", 'Evening Snacks': "No options", 
                          'Dinner': "No options"} for day in DAYS}

        # 3. Predict Suitability Score for ALL suitable recipes
        X_user_single = self._align_user_features(user_profile_features, self.user_only_features)
        N = len(recipes_filtered)
        X_user_repeated = np.repeat(X_user_single.values, N, axis=0)
        X_user_repeated_df = pd.DataFrame(X_user_repeated, columns=self.user_only_features)
        
        X_recipe_features_aligned = recipes_filtered.reindex(columns=self.recipe_only_features, fill_value=0)

        X_predict_raw = pd.concat([X_user_repeated_df.reset_index(drop=True),
                                   X_recipe_features_aligned.reset_index(drop=True)], axis=1)

        X_predict_aligned = X_predict_raw.reindex(columns=self.diet_feature_names, fill_value=0)
        suitability_scores = self.diet_model.predict(X_predict_aligned)

        recipes_filtered.loc[:, 'suitability_score'] = suitability_scores

        # 5. Generate Plan with CASCADING LOGIC
        plan = {}
        recipes_used = set()
        
        if not current_remedies_list:
             current_remedies_list = ["Stay Hydrated"]

        for day_index, day in enumerate(DAYS):
            remedy_item = current_remedies_list[day_index % len(current_remedies_list)]
            daily_menu = {'Remedy': remedy_item}

            for meal_type in MEAL_TYPES:
                
                # --- This is the new logic ---
                
                # A. Prioritize: Exact Meal Type + User's Region
                meal_options = recipes_filtered[
                    (recipes_filtered['Meal_Type'] == meal_type) &
                    (recipes_filtered['Region'] == region) &
                    (~recipes_filtered['food_code'].isin(recipes_used))
                ].copy()

                # B. Fallback 1: Exact Meal Type + ANY Region
                if meal_options.empty:
                    print(f"Fallback 1: No {meal_type} in {region}. Widening region.")
                    meal_options = recipes_filtered[
                        (recipes_filtered['Meal_Type'] == meal_type) &
                        (~recipes_filtered['food_code'].isin(recipes_used))
                    ].copy()

                # C. Fallback 2: ANY Meal Type + ANY Region (to fill the slot)
                if meal_options.empty:
                    print(f"Fallback 2: No {meal_type} found at all. Using any suitable recipe.")
                    meal_options = recipes_filtered[~recipes_filtered['food_code'].isin(recipes_used)].copy()

                # ---
                
                if not meal_options.empty:
                    # Rank by ML score and pick from top 5
                    ranked_options = meal_options.sort_values(by='suitability_score', ascending=False)
                    top_n = ranked_options.head(5)
                    selected_recipe_row = top_n.sample(n=min(1, len(top_n))).iloc[0]
                    
                    daily_menu[meal_type] = self._augment_food_display(selected_recipe_row)
                    recipes_used.add(selected_recipe_row['food_code'])
                else:
                    # This should rarely happen now
                    daily_menu[meal_type] = "No suitable option found."

            plan[day] = daily_menu

        return plan
