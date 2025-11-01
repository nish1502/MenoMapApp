import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# --- Configuration ---
ONBOARDING_PROCESSED_DIR = '../ONBOARDING_DATA_PROCESSED'
ML_MODELS_DIR = '../ML_MODELS'
PROCESSED_FILE_NAME = 'cleaned_onboarding_data.csv'
MODEL_FILE_NAME = 'stage_prediction_model.pkl' # This is the NEW model
FEATURES_FILE_NAME = 'stage_predictor_features.pkl' # NEW feature list

def train_stage_model():
    """
    Trains a classifier to predict the menopause stage based on 
    user-reported symptom severities.
    """
    
    # 1. Define File Paths
    processed_data_path = os.path.join(ONBOARDING_PROCESSED_DIR, PROCESSED_FILE_NAME)
    model_save_path = os.path.join(ML_MODELS_DIR, MODEL_FILE_NAME)
    features_save_path = os.path.join(ML_MODELS_DIR, FEATURES_FILE_NAME)

    os.makedirs(ML_MODELS_DIR, exist_ok=True)

    try:
        df = pd.read_csv(processed_data_path)
        print(f"✅ Data loaded successfully from: {processed_data_path}")
    except FileNotFoundError:
        print(f"❌ Error: Cleaned data file not found at {processed_data_path}")
        print("Please run the data preprocessing script first.")
        return

    # --- 2. DEFINE FEATURES (X) and TARGET (Y) ---
    
    # INPUT (X): The symptoms. 
    # These are the *outputs* from the other model, but are the *inputs* for this one.
    feature_cols = [
        'hot_flashes_severity_ternary', 
        'night_sweats_severity_ternary', 
        'mood_swings_severity_ternary', 
        'sleep_disturbances_severity_ternary',
        'fatigue_severity_meno_ternary', 
        'brain_fog_severity_ternary', 
        'hair_growth_on_facebody_ternary',
        'acne_severity_ternary', 
        'weight_gain_bellyfat_severity_ternary', 
        'mood_swings_irritability_severity_ternary', 
        'fatigue_severity_pcos_ternary'
    ]

    # OUTPUT (Y): The menopause stage.
    target_col = 'self_reported_stage_encoded'

    # Check if all columns exist
    all_cols = feature_cols + [target_col]
    if not all(col in df.columns for col in all_cols):
        missing_cols = [col for col in all_cols if col not in df.columns]
        print(f"❌ Error: Missing required columns: {missing_cols}")
        return

    # 3. Prepare Data
    
    # Drop rows where the stage is 'Unknown' (encoded as -1)
    df_filtered = df[df[target_col] != -1].copy()
    print(f"Original rows: {len(df)}, Rows after removing 'Unknown' stage: {len(df_filtered)}")
    
    # Drop any remaining NaN values
    df_filtered.dropna(subset=all_cols, inplace=True)

    X = df_filtered[feature_cols]
    Y = df_filtered[target_col].astype(int) 

    # 4. Split Data
    X_train, X_test, Y_train, Y_test = train_test_split(
        X, Y, test_size=0.2, random_state=42, shuffle=True, stratify=Y
    )
    
    print(f"📊 Training on {len(X_train)} samples, testing on {len(X_test)} samples.")
    
    # 5. Train Model
    # Using RandomForest as it's good for this type of problem
    model = RandomForestClassifier(
        n_estimators=100, 
        random_state=42, 
        class_weight='balanced'
    )
    
    print("⏳ Starting STAGE PREDICTOR model training...")
    model.fit(X_train, Y_train)
    print("✅ Model training complete.")

    # 6. Evaluate Model
    Y_pred = model.predict(X_test)
    
    # Define stage labels for the report
    stage_labels = {0: 'Premenopause', 1: 'Perimenopause', 2: 'Menopause', 3: 'Postmenopause'}
    target_names = [stage_labels[key] for key in sorted(Y.unique())]

    print("\n--- STAGE PREDICTOR Model Evaluation (on Test Set) ---")
    print(f"Overall Accuracy: {accuracy_score(Y_test, Y_pred):.4f}\n")
    print(classification_report(Y_test, Y_pred, target_names=target_names, zero_division=0))
    
    # 7. Save Model and Feature List
    joblib.dump(model, model_save_path)
    joblib.dump(feature_cols, features_save_path)
    
    print(f"\n💾 STAGE PREDICTOR model saved to: {model_save_path}")
    print(f"💾 Feature list saved to: {features_save_path}")

if __name__ == '__main__':
    train_stage_model()