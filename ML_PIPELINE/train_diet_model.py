import pandas as pd
import numpy as np
import joblib
import os
import random 
import warnings
from pandas.errors import SettingWithCopyWarning 
warnings.filterwarnings("ignore", category=SettingWithCopyWarning) 

# --- Configuration (Paths remain the same) ---
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

# 📢 STATIC LIST OF COLUMNS THAT EXIST IN CLEANED_INDIAN_RECIPES_FOR_ML.CSV
# This list is used to guarantee correct indexing.
STATIC_RECIPE_COLS_FOR_ML = [
    'food_code', 'food_name', 'servings_unit', 'veg_nonveg_flag', 'Region', 'Meal_Type', 
    'is_processed_flag', 'is_spicy_flag', 'contains_dairy_flag', 
    'unit_serving_energy_kcal', 'unit_serving_carb_g', 'unit_serving_protein_g',
    'unit_serving_fat_g', 'unit_serving_freesugar_g', 'unit_serving_fibre_g', 
    'unit_serving_sfa_mg', 'unit_serving_mufa_mg', 'unit_serving_pufa_mg',  
    'unit_serving_calcium_mg', 'unit_serving_iron_mg', 'unit_serving_magnesium_mg',  
    'unit_serving_sodium_mg', 'unit_serving_potassium_mg', 'unit_serving_zinc_mg',       
    'unit_serving_vita_mcg', 'unit_serving_folate_mcg', 'unit_serving_vitc_mg',
    'carb_to_fibre_ratio', 'protein_to_carb_ratio', 'unsat_to_sat_fat_ratio'
] # NOTE: Use the exact column names from your final CSV (including unit_serving_ prefix if present)


class AdaptiveDietPlanner:
    def __init__(self, recipe_path, symptom_model_path, symptom_features_path, 
                 diet_model_path, diet_features_path):
        try:
            self.recipes_full = pd.read_csv(recipe_path)
            self.symptom_model = joblib.load(symptom_model_path)
            
            self.symptom_feature_names = joblib.load(symptom_features_path)
            self.diet_model = joblib.load(diet_model_path)
            self.diet_feature_names = joblib.load(diet_features_path)
            
            # Filter out processed foods immediately
            if 'is_processed_flag' in self.recipes_full.columns:
                self.recipes_full = self.recipes_full[self.recipes_full['is_processed_flag'] == 0].copy()
            
            self.symptom_target_cols = list(SYMPTOM_GOALS.keys())

            # 📢 FINAL FEATURE SEPARATION FIX
            set_diet = set(self.diet_feature_names)
            
            # 1. User Features: Intersection of Diet Model and Symptom Model features
            self.user_only_features = sorted(list(set_diet.intersection(set(self.symptom_feature_names))))
            
            # 2. Recipe Features: Intersection of Diet Model features and the actual static recipe columns
            self.recipe_only_features = sorted(list(set_diet.intersection(set(STATIC_RECIPE_COLS_FOR_ML))))
            
            # Final sanity check (Will print out which features are still unassigned if any)
            missing_in_union = set_diet - (set(self.user_only_features) | set(self.recipe_only_features))
            if missing_in_union:
                print(f"🛑 CRITICAL WARNING: {len(missing_in_union)} model features are unassigned: {missing_in_union}")

        except Exception as e:
            raise RuntimeError(f"Failed to initialize AdaptiveDietPlanner. Error: {e}. Check all file paths.")

    def _align_user_features(self, user_profile_features, feature_names_list):
        """Aligns a single user's features to the exact list required by a model."""
        aligned_input = pd.DataFrame(0, index=[0], columns=feature_names_list) 
        for col, value in user_profile_features.items():
            if col in aligned_input.columns:
                aligned_input[col] = value
        return aligned_input[feature_names_list]


    def generate_weekly_plan(self, user_profile_features, current_remedies_list, 
                             region='South', diet_preference='Vegetarian'):
        """Generates a unique 7-day plan using ML-predicted suitability scores."""
        
        # 1. Predict Symptoms (to get Hard Filters)
        X_symptom_aligned = self._align_user_features(user_profile_features, self.symptom_feature_names)
        predicted_severities = self.symptom_model.predict(X_symptom_aligned)[0] 
        
        hard_constraints = [] 
        for i, symptom_col in enumerate(self.symptom_target_cols):
            if predicted_severities[i] == 2:
                hard_constraints.extend(SYMPTOM_GOALS.get(symptom_col, {}).get('trigger_avoid', []))
        
        # 2. Apply Hard Filters (Region, Veg/NonVeg, Triggers)
        recipes_filtered = self._filter_recipes(self.recipes_full, hard_constraints, 
                                                region, diet_preference)
        
        if recipes_filtered.empty:
            return {day: {'Remedy': current_remedies_list[i % len(current_remedies_list)], 
                          'Breakfast': "No suitable option found.", 'Lunch': "No suitable option found.",
                          'Evening Snacks': "No suitable option found.", 'Dinner': "No suitable option found."} 
                    for i, day in enumerate(DAYS)}

        
        # 3. Predict Suitability Score using the Trained Model 📢 FIXED EXECUTION
        
        # 3a. Align the User's features needed by the Diet Model
        X_user_single = self._align_user_features(user_profile_features, self.user_only_features) 

        # 3b. Build Prediction Matrix
        N = len(recipes_filtered)
        
        # Repeat User features N times
        X_user_repeated = np.repeat(X_user_single.values, N, axis=0)
        X_user_repeated_df = pd.DataFrame(X_user_repeated, columns=self.user_only_features)
        
        # Extract recipe features from the filtered set
        X_recipe_features = recipes_filtered[self.recipe_only_features].reset_index(drop=True)
        
        # Combine into the full prediction matrix
        X_predict_raw = pd.concat([X_user_repeated_df.reset_index(drop=True), 
                                X_recipe_features.reset_index(drop=True)], axis=1)
        
        # Final alignment and prediction (Uses .reindex to ensure all columns are present and ordered)
        X_predict_aligned = X_predict_raw.reindex(columns=self.diet_feature_names, fill_value=0) 
        suitability_scores = self.diet_model.predict(X_predict_aligned)
        
        # 4. Assign scores back to the filtered recipes
        recipes_filtered.loc[:, 'suitability_score'] = suitability_scores
        
        # 5. Generate Plan 
        plan = {}
        recipes_used = set()
        
        for day_index, day in enumerate(DAYS):
            remedy_item = current_remedies_list[day_index % len(current_remedies_list)]
            daily_menu = {'Remedy': remedy_item}
            
            for meal_type in MEAL_TYPES: 
                meal_options = recipes_filtered[recipes_filtered['Meal_Type'] == meal_type].copy()
                meal_options = meal_options[~meal_options['food_code'].isin(recipes_used)]
                
                # 📢 FIX: Fallback logic for complete meals (allows filling missing slots)
                if meal_options.empty:
                    # Fall back to any suitable, unused recipe that day
                    meal_options = recipes_filtered[~recipes_filtered['food_code'].isin(recipes_used)].copy()
                    
                if not meal_options.empty:
                    # Rank by the ML-predicted score and select randomly from the top 5
                    ranked_options = meal_options.sort_values(by='suitability_score', ascending=False)
                    top_n = ranked_options.head(5) 
                    selected_recipe = top_n.sample(n=min(1, len(top_n))).iloc[0] 
                    
                    daily_menu[meal_type] = selected_recipe['food_name'] 
                    recipes_used.add(selected_recipe['food_code'])
                else:
                    daily_menu[meal_type] = "No suitable option found."
            
            plan[day] = daily_menu

        return plan

    def _filter_recipes(self, df, hard_constraints, region, diet_preference):
        """Applies region, dietary preference, and hard trigger exclusions."""
        
        veg_code = VEG_MAP.get(diet_preference, 0)
        
        filtered = df[(df['Region'] == region) & 
                      (df['veg_nonveg_flag'] == veg_code)
                      ].copy()

        # 2. Apply Hard Constraints (Triggers)
        for trigger in set(hard_constraints):
            tag_col = FOOD_TAGS.get(trigger)
            if tag_col and tag_col in filtered.columns:
                filtered = filtered[filtered[tag_col] == 0]
        
        return filtered


# ----------------------------------------------------------------------
# EXECUTION BLOCK (DEMONSTRATION)
# ----------------------------------------------------------------------
# ... (display_weekly_plan and __main__ remains the same, using the complete base_features)
def display_weekly_plan(plan, title):
    df = pd.DataFrame(plan).T
    print("\n" + "=" * 100)
    print(title)
    print("=" * 100)
    
    if all(col in df.columns for col in ['Remedy'] + MEAL_TYPES):
        df = df[['Remedy'] + MEAL_TYPES] 
    
    print(df.to_string(max_cols=None))
    print("-" * 100)


if __name__ == '__main__':
    # Determine paths
    script_dir = os.path.dirname(os.path.abspath(__file__)) 
    project_root = os.path.dirname(script_dir)
    
    recipe_path = os.path.join(project_root, DIET_DATA_PROCESSED_DIR, CLEANED_RECIPES_FILE)
    symptom_model_path = os.path.join(project_root, ML_MODELS_DIR, SYMPTOM_MODEL_FILE)
    symptom_features_path = os.path.join(project_root, ML_MODELS_DIR, SYMPTOM_FEATURE_NAMES_FILE)
    
    diet_model_path = os.path.join(project_root, ML_MODELS_DIR, DIET_SUITABILITY_MODEL_FILE)
    diet_features_path = os.path.join(project_root, ML_MODELS_DIR, DIET_FEATURE_NAMES_FILE)
    
    # 📢 SIMULATE USER PROFILES: Must be complete for the Diet Model
    base_features = {
        'age_group_simplified_40_49': 1, 'bmi_category_overweight': 1, 'stress_level_encoded': 3, 
        'caffeine_group_caffeine_moderate_high': 1, 'cycle_regularity_encoded': 2, 'skipped_periods_months': 2, 
        'irregular_periods_freq': 4, 'hot_flashes_severity_ternary': 1, 'acne_severity_ternary': 2, 
        'weight_gain_bellyfat_severity_ternary': 1, 'fatigue_severity_pcos_ternary': 2,
        'sleep_disturbances_severity_ternary': 1, 'mood_swings_severity_ternary': 0, 
        'brain_fog_severity_ternary': 0, 'hair_growth_on_facebody': 0, 'mood_swings_irritability_severity_ternary': 0,
        'self_reported_stage_encoded': 1, 
        
        # 📢 ALL Features from the training set are included
        'fatigue_severity_meno_ternary': 0, 'hair_growth_on_facebody_ternary': 0, 'water_intake_liters': 0, 
        'bmi_category_normal': 0, 'bmi_category_obese': 0, 'sleep_group_normal_sleep': 0, 'caffeine_group_caffeine_low': 0, 
        'screen_group_screen_moderate': 0, 'avoided_none_avoided': 0, 'avoided_dairy': 0, 'avoided_nan': 0, 
        'avoided_seafood': 0, 'diet_goal_iron_rich': 0, 'diet_goal_low_gi': 0, 'diet_goal_low_glycemic_index': 0, 
        'diet_goal_nan': 0, 'diet_goal_omega_3_rich': 0, 'worsen_food_dairy': 0, 'worsen_food_highsugar': 0, 
        'ex_type_cardio': 0, 'ex_type_strength': 0, 'ex_type_strengthtraining': 0, 'ex_type_yoga': 0, 
        'remedy_aloeverajuice': 0, 'age_group_simplified_50_59': 0, 'age_group_simplified_younger_than_40': 0, 
        'avoided_gluten': 0, 'avoided_soy': 0, 'caffeine_group_caffeine_none': 0,
    }
    
    try:
        planner = AdaptiveDietPlanner(recipe_path, symptom_model_path, symptom_features_path, 
                                      diet_model_path, diet_features_path)
        print("✅ Diet Planner Initialized Successfully.")

    except Exception as e:
        print(f"\n❌ Initialization Failed. Error: {e}")
        print("💡 Check Action: Ensure all six .pkl and .csv files exist and the base_features list is complete.")
        exit()

    
    # Case A Run: PCOS/Perimenopause
    remedies_A = ["PCOS Tea", "Spearmint Supplement"]
    plan_pcos = planner.generate_weekly_plan(base_features, remedies_A, 
                                            diet_preference='Vegetarian', region='South')
    display_weekly_plan(plan_pcos, "PLAN A: PERIMENOPAUSE (ML-RANKED) | Preference: VEGETARIAN | Region: SOUTH")