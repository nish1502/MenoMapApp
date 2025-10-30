import pandas as pd
import joblib
import os
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import f1_score

# --- Configuration ---
ML_MODELS_DIR = 'ML_MODELS'
PROCESSED_FILE_NAME = 'cleaned_onboarding_data.csv' 
REMEDY_MODELS_DIR = os.path.join(ML_MODELS_DIR, 'Relief_Efficacy_Models')
MODEL_BASE_NAME = 'model_'
TOP_FEATURES_FILE = 'final_feature_names.pkl' # File name to load

# Define the treatments/practices that we want to model efficacy for
TREATMENT_COLUMNS = [
    'remedy_turmericmilk', 'remedy_fenugreekseeds', 'remedy_cinnamonwater', 'remedy_aloeverajuice',
    'ex_type_yoga', 'ex_type_cardio', 'ex_type_strengthtraining'
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

def load_top_features_robustly(base_dir, filename):
    """
    Attempts to load the feature names file from the ML_MODELS directory, 
    handling common path structure issues.
    """
    # 1. Start from the current script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 2. Build the path to the ML_MODELS folder relative to the script
    project_root = os.path.abspath(os.path.join(script_dir, '..'))
    
    # 3. Define the absolute path to the feature file
    feature_path_abs = os.path.join(project_root, base_dir, filename)
    
    if os.path.exists(feature_path_abs):
        return joblib.load(feature_path_abs)
    else:
        raise FileNotFoundError(f"Missing required file: {filename} at {feature_path_abs}")


def train_efficacy_model_for_treatment(df, treatment_col, feature_names):
    """
    Filters the data for a specific treatment and trains a MultiOutputClassifier 
    to predict the resulting symptom severity.
    """
    
    df_treatment = df[df[treatment_col] == 1].copy()
    
    if len(df_treatment) < 15:
        return None, len(df_treatment), 0

    # 1. Define X and Y using the filtered DataFrame
    X = df_treatment[feature_names]
    Y = df_treatment[TARGET_COLUMNS].astype(int) 

    # 2. Train/Test Split
    if len(df_treatment) >= 20:
        X_train, X_test, Y_train, Y_test = train_test_split(
            X, Y, test_size=0.2, random_state=42, shuffle=True
        )
    else:
        # If less than 20, train and test on the same data for logging purposes
        X_train, Y_train = X, Y
        X_test, Y_test = X, Y

    # 3. Train Model
    base_estimator = RandomForestClassifier(
        n_estimators=200, max_depth=10, min_samples_split=5, 
        random_state=42, class_weight='balanced'
    )
    model = MultiOutputClassifier(base_estimator, n_jobs=-1)
    model.fit(X_train, Y_train)

    # 4. Evaluate (For logging purposes only)
    Y_pred = model.predict(X_test)
    avg_f1_score = np.mean([f1_score(Y_test.iloc[:, i], Y_pred[:, i], average='weighted', zero_division=0) 
                            for i in range(Y_test.shape[1])])
    
    return model, avg_f1_score, len(df_treatment)

def train_relief_models_pipeline():
    """Manages the pipeline, loading, and saving of all treatment models."""

    # --- Setup Paths ---
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, '..'))
    
    data_path_abs = os.path.join(project_root, 'ONBOARDING_DATA_PROCESSED', PROCESSED_FILE_NAME)
    remedy_models_path_abs = os.path.join(project_root, REMEDY_MODELS_DIR)
    
    os.makedirs(remedy_models_path_abs, exist_ok=True)
    
    try:
        # Load processed data
        df = pd.read_csv(data_path_abs)
        
        # Load the saved top 20 feature list (DYNAMICALLY)
        top_feature_names = load_top_features_robustly(ML_MODELS_DIR, TOP_FEATURES_FILE)

    except FileNotFoundError as e:
        print(f"❌ CRITICAL ERROR: Dependency file not found: {e}")
        print("Please ensure you run 'train_symptom_model.py' successfully to create final_feature_names.pkl.")
        return

    # --- 1. Prepare Feature Set ---
    
    # Isolate the base profile features (non-remedy/exercise columns from the top 20 list)
    treatment_columns_list = TREATMENT_COLUMNS + ['ex_type_strength']
    
    # Filter TOP_FEATURES to create the base profile for all models
    profile_feature_names = [f for f in top_feature_names if f not in treatment_columns_list and f in df.columns]
    
    print(f"Starting pipeline using {len(profile_feature_names)} base profile features.")

    # --- 2. Train Models for Each Treatment ---
    
    efficacy_log = {}
    
    for treatment_col in TREATMENT_COLUMNS:
        if treatment_col not in df.columns:
            continue
            
        # The feature set for this specific model is the base profile + the remedy indicator itself
        current_feature_set = profile_feature_names + [treatment_col]
        
        # Filter the DataFrame to only include the necessary columns
        df_temp = df[[c for c in current_feature_set + TARGET_COLUMNS if c in df.columns]].copy()
        
        # Train the model
        model, f1_score_avg, n_samples = train_efficacy_model_for_treatment(
            df_temp, treatment_col, [f for f in current_feature_set if f in df_temp.columns]
        )
        
        remedy_name = treatment_col.replace('remedy_', '').replace('ex_type_', '')

        if model:
            # SAVE STEP: This uses the robust absolute path to the intended sub-folder
            model_save_path = os.path.join(remedy_models_path_abs, f'{MODEL_BASE_NAME}{remedy_name}.pkl')
            joblib.dump(model, model_save_path)
            
            # Save the features list for the recommender script to use
            features_save_path = os.path.join(remedy_models_path_abs, f'features_{remedy_name}.pkl')
            joblib.dump([f for f in current_feature_set if f in df_temp.columns], features_save_path)
            
            efficacy_log[remedy_name] = {'F1': f1_score_avg, 'Samples': n_samples}
        else:
            efficacy_log[remedy_name] = {'F1': 0.0, 'Samples': n_samples}


    # --- 3. Final Output and Log ---
    print("\n--- Relief Efficacy Model Training Complete ---")
    
    log_df = pd.DataFrame.from_dict(efficacy_log, orient='index')
    log_df.index.name = 'Remedy/Practice'
    log_df = log_df.sort_values(by='F1', ascending=False)
    log_df['F1'] = log_df['F1'].map('{:.3f}'.format)

    print("\nTraining Summary for Individual Remedy Efficacy (based on samples where remedy was used):")
    print("----------------------------------------------------------------")
    print(log_df.to_string())
    print(f"\n✅ All individual models saved ONLY to: {remedy_models_path_abs}")


if __name__ == '__main__':
    train_relief_models_pipeline()