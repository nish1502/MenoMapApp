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

# 📢 SYMPTOM_GOALS for HARD FILTERING ONLY
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

            # Final Feature Separation Logic
            set_diet = set(self.diet_feature_names)
            set_user = set(self.symptom_feature_names)
            set_recipe_cols = set(self.recipes_full.columns)

            self.user_only_features = sorted(list(set_diet.intersection(set_user)))
            self.recipe_only_features = sorted(list(set_diet.intersection(set_recipe_cols).difference(set_user)))
            
        except Exception as e:
            raise RuntimeError(f"Failed to initialize AdaptiveDietPlanner. Error: {e}. Check all file paths.")

    # 📢 MOVED METHOD: Now correctly part of the class
    def _augment_food_display(self, recipe_row):
        """Creates a detailed, readable string for the output table."""
        
        # 1. Health/Allergy Tags (Based on hard filters)
        tags = []
        if recipe_row.get('contains_dairy_flag', 0) == 1: tags.append("Dairy")
        if recipe_row.get('is_spicy_flag', 0) == 1: tags.append("Spicy")
        if recipe_row.get('is_high_sugar_flag', 0) == 1: tags.append("High Sugar")
        
        # 2. Key Nutrients (Formatted)
        nutrition = (
            f"C:{recipe_row.get('carb_g', 0):.1f}g P:{recipe_row.get('protein_g', 0):.1f}g F:{recipe_row.get('fat_g', 0):.1f}g | "
            f"Fibre:{recipe_row.get('fibre_g', 0):.1f}g Ca:{recipe_row.get('calcium_mg', 0):.0f}mg"
        )
        
        # 3. Combine food name with health info
        tags_str = f" [!{', '.join(tags)}]" if tags else ""
        
        return (
            f"{recipe_row['food_name']}{tags_str} ({recipe_row['Region']})\n"
            f"({nutrition})"
        )

    # 📢 MOVED METHOD: Now correctly part of the class
    def _filter_recipes_by_preference(self, df, hard_constraints, diet_preference):
        """Filters the entire recipe pool by Veg/NonVeg and all hard symptom triggers."""
        
        veg_code = VEG_MAP.get(diet_preference, 0)
        
        filtered = df[df['veg_nonveg_flag'] == veg_code].copy()

        # 2. Apply Hard Constraints (Triggers)
        for trigger in set(hard_constraints):
            tag_col = FOOD_TAGS.get(trigger)
            if tag_col and tag_col in filtered.columns:
                filtered = filtered[filtered[tag_col] == 0]
        
        return filtered

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
        
        # 2. Apply Hard Filters (Veg/NonVeg, Triggers)
        recipes_filtered = self._filter_recipes_by_preference(self.recipes_full, hard_constraints, diet_preference)
        
        if recipes_filtered.empty:
            return {day: {'Remedy': current_remedies_list[i % len(current_remedies_list)], 
                          'Breakfast': "No suitable option found.", 'Lunch': "No suitable option found.",
                          'Evening Snacks': "No suitable option found.", 'Dinner': "No suitable option found."} 
                    for i, day in enumerate(DAYS)}

        
        # 3. Predict Suitability Score using the Trained Model
        X_user_single = self._align_user_features(user_profile_features, self.user_only_features) 
        
        N = len(recipes_filtered)
        
        # Repeat User features N times
        X_user_repeated = np.repeat(X_user_single.values, N, axis=0)
        X_user_repeated_df = pd.DataFrame(X_user_repeated, columns=self.user_only_features)
        
        # Extract recipe features from the filtered set
        X_recipe_features_unaligned = recipes_filtered.copy()
        X_recipe_features = X_recipe_features_unaligned.reindex(columns=self.recipe_only_features, fill_value=0)
        
        # Combine into the full prediction matrix
        X_predict_raw = pd.concat([X_user_repeated_df.reset_index(drop=True), 
                                X_recipe_features.reset_index(drop=True)], axis=1)
        
        # Final alignment and prediction (reorders columns)
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
                # CASCADING FILTERING LOGIC
                
                # A. Prioritize: Exact Meal Type AND User's Region (STRICTEST)
                meal_options = recipes_filtered[
                    (recipes_filtered['Meal_Type'] == meal_type) & 
                    (recipes_filtered['Region'] == region) &
                    (~recipes_filtered['food_code'].isin(recipes_used))
                ].copy()
                
                # B. Fallback 1: Exact Meal Type AND General Region (WIDEN REGION)
                if meal_options.empty:
                    meal_options = recipes_filtered[
                        (recipes_filtered['Meal_Type'] == meal_type) & 
                        (~recipes_filtered['food_code'].isin(recipes_used))
                    ].copy()

                # C. Fallback 2: Any available meal (WIDEN MEAL TYPE)
                if meal_options.empty:
                    meal_options = recipes_filtered[~recipes_filtered['food_code'].isin(recipes_used)].copy()
                    
                if not meal_options.empty:
                    # Rank by the ML-predicted score and select randomly from the top 5
                    ranked_options = meal_options.sort_values(by='suitability_score', ascending=False)
                    top_n = ranked_options.head(5) 
                    selected_recipe = top_n.sample(n=min(1, len(top_n))).iloc[0] 
                    
                    daily_menu[meal_type] = self._augment_food_display(selected_recipe) 
                    recipes_used.add(selected_recipe['food_code'])
                else:
                    daily_menu[meal_type] = "No suitable option found."
            
            plan[day] = daily_menu

        return plan


# ----------------------------------------------------------------------
# EXECUTION BLOCK (DEMONSTRATION)
# ----------------------------------------------------------------------
def display_weekly_plan(plan, title):
    """Prints the weekly plan using fixed-width string formatting for clarity."""
    df = pd.DataFrame(plan).T
    
    # 1. Define Column Order and Fixed Widths
    COLUMNS = ['Remedy', 'Breakfast', 'Lunch', 'Evening Snacks', 'Dinner']
    WIDTH = 25 

    if all(col in df.columns for col in COLUMNS):
        df = df[COLUMNS] 
    
    # 2. Print Header
    header = f"| {'Day':<10} | {COLUMNS[0]:<25} | {COLUMNS[1]:<25} | {COLUMNS[2]:<25} | {COLUMNS[3]:<25} | {COLUMNS[4]:<25} |"
    separator = "-" * (10 + 5 * (WIDTH + 3))
    
    print("\n" + "=" * len(separator))
    print(title)
    print("=" * len(separator))
    print(header)
    print(separator)
    
    # 3. Print Data Rows
    for day, row in df.iterrows():
        remedy = str(row['Remedy']).replace('\n', ' ')
        breakfast = str(row['Breakfast']).split('\n')
        lunch = str(row['Lunch']).split('\n')
        snacks = str(row['Evening Snacks']).split('\n')
        dinner = str(row['Dinner']).split('\n')
        
        max_lines = max(len(breakfast), len(lunch), len(snacks), len(dinner), 1)

        for i in range(max_lines):
            line_remedy = remedy if i == 0 else ""
            
            line_breakfast = (breakfast[i].strip() if i < len(breakfast) else "")
            line_lunch = (lunch[i].strip() if i < len(lunch) else "")
            line_snacks = (snacks[i].strip() if i < len(snacks) else "")
            line_dinner = (dinner[i].strip() if i < len(dinner) else "")
            
            # Print the formatted line
            print(
                f"| {day if i == 0 else ' ':<10} | {line_remedy[:WIDTH]:<25} | {line_breakfast[:WIDTH]:<25} | {line_lunch[:WIDTH]:<25} | {line_snacks[:WIDTH]:<25} | {line_dinner[:WIDTH]:<25} |"
            )

    print(separator)

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
        
        # ALL Features from the training set are included
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
        exit()

    
    # --- TEST CASE 1: South India (PCOS/Perimenopause) ---
    remedies_A = ["PCOS Tea", "Spearmint Supplement"]
    plan_pcos = planner.generate_weekly_plan(base_features, remedies_A, 
                                            diet_preference='Vegetarian', region='South')
    display_weekly_plan(plan_pcos, "PLAN 1: SOUTH INDIA (PCOS/PERIMENOPAUSE) | Constraints: NO DAIRY, NO HIGH SUGAR")

    # --- TEST CASE 2: North India (Meno/Postmenopause) ---
    meno_features = base_features.copy()
    meno_features['hot_flashes_severity_ternary'] = 2 
    meno_features['acne_severity_ternary'] = 0 
    meno_features['self_reported_stage_encoded'] = 3 
    remedies_B = ["Magnesium Glycinate", "Hormone Balancing Mix"]
    plan_meno_north = planner.generate_weekly_plan(meno_features, remedies_B, 
                                                   diet_preference='Non-Vegetarian', region='North')
    display_weekly_plan(plan_meno_north, "PLAN 2: NORTH INDIA (POSTMENOPAUSE) | Constraints: NO SPICY, NO CAFFEINE")

    # --- TEST CASE 3: East/West India (General Health) ---
    general_features = base_features.copy()
    general_features['hot_flashes_severity_ternary'] = 0 
    general_features['acne_severity_ternary'] = 0 
    general_features['self_reported_stage_encoded'] = 1
    remedies_C = ["Turmeric Milk"]
    plan_general_ew = planner.generate_weekly_plan(general_features, remedies_C, 
                                                   diet_preference='Vegetarian', region='East/West')
    display_weekly_plan(plan_general_ew, "PLAN 3: EAST/WEST INDIA (GENERAL PERIMENOPAUSE) | Constraints: MILD/NONE")