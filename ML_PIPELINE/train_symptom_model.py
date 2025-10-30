import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score
import joblib
import os
import numpy as np 

# --- Configuration ---
ONBOARDING_PROCESSED_DIR = 'ONBOARDING_DATA_PROCESSED'
ML_MODELS_DIR = 'ML_MODELS'
PROCESSED_FILE_NAME = 'cleaned_onboarding_data.csv' 
MODEL_FILE_NAME = 'symptom_prediction_model_final.pkl' # Renaming file to indicate final model
TOP_FEATURES_FILE = 'top_feature_names.pkl' # File containing the top 20 features

def train_symptom_model():
    """
    Trains the MultiOutputClassifier using only the top 20 most predictive features
    identified in the previous run's importance analysis.
    """
    
    # 1. Define File Paths and Load Top Features
    processed_data_path = os.path.join(ONBOARDING_PROCESSED_DIR, PROCESSED_FILE_NAME)
    model_save_path = os.path.join(ML_MODELS_DIR, MODEL_FILE_NAME)
    top_features_path = os.path.join(ML_MODELS_DIR, TOP_FEATURES_FILE)

    os.makedirs(ML_MODELS_DIR, exist_ok=True)

    try:
        df = pd.read_csv(processed_data_path)
        top_feature_names = joblib.load(top_features_path)
        print(f"✅ Data loaded successfully from: {processed_data_path}")
        print(f"✅ Loaded {len(top_feature_names)} features for training.")
    except FileNotFoundError:
        print(f"❌ Error: Required data or top features file not found. Ensure previous run was successful.")
        return

    # --- 2. DEFINE TARGETS (Y) and Features (X) ---
    target_cols = [
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

    # **Feature selection applied here:** X is now limited to the top 20 names.
    feature_cols = top_feature_names
    
    # Check that all targets are present
    if not all(col in df.columns for col in target_cols):
        missing_targets = [col for col in target_cols if col not in df.columns]
        print(f"\n❌ CRITICAL ERROR: Missing expected ternary target columns: {missing_targets}")
        return

    # 3. Prepare Data
    all_cols_required = feature_cols + target_cols
    df_filtered = df[all_cols_required].copy()

    initial_rows = len(df_filtered)
    df_filtered.dropna(subset=all_cols_required, inplace=True)
    rows_dropped = initial_rows - len(df_filtered)
    print(f"🧹 Dropped {rows_dropped} rows with missing values (expected 0).")

    X = df_filtered[feature_cols]
    Y = df_filtered[target_cols].astype(int) 

    # 4. Split Data
    X_train, X_test, Y_train, Y_test = train_test_split(
        X, Y, test_size=0.2, random_state=42, shuffle=True
    )
    
    print(f"📊 Training on {len(X_train)} samples, testing on {len(X_test)} samples.")
    print(f"Total number of features (X columns): {len(feature_cols)}")


    # 5. Train Model - RE-TUNED
    # Using the same hyperparams that gave the best results
    base_estimator = RandomForestClassifier(
        n_estimators=200, 
        max_depth=10, 
        min_samples_split=5, 
        random_state=42, 
        class_weight='balanced'
    )
    model = MultiOutputClassifier(base_estimator, n_jobs=-1)
    
    print("⏳ Starting FINAL model training with 20 features...")
    model.fit(X_train, Y_train)
    print("✅ FINAL Model training complete.")

    # 6. Evaluate Model
    Y_pred = model.predict(X_test)
    Y_test_np = Y_test.to_numpy()
    Y_pred_np = Y_pred
    
    exact_match_acc = np.all(Y_test_np == Y_pred_np, axis=1).mean()

    print("\n--- FINAL Model Evaluation (on Test Set) ---")
    print("NOTE: Evaluating results after Feature Selection.")
    print(f"Overall Exact Match Accuracy (Strict): {exact_match_acc:.4f}\n")
    
    f1_scores = []
    
    for i, target in enumerate(target_cols):
        f1 = f1_score(Y_test_np[:, i], Y_pred_np[:, i], average='weighted', zero_division=0)
        acc = accuracy_score(Y_test_np[:, i], Y_pred_np[:, i])
        f1_scores.append(f1)
        print(f"- {target.replace('_ternary', ''):35s} | Accuracy: {acc:.4f} | F1-Score (Weighted): {f1:.4f}")

    avg_f1_score = np.mean(f1_scores)
    print(f"\nAverage F1-Score (Mean of all 11 Symptom F1-Scores): {avg_f1_score:.4f}")
    
    # 7. Save Model
    joblib.dump(model, model_save_path)
    print(f"\n💾 FINAL Model successfully saved to: {model_save_path}")

    # 8. Save Feature Names (Saving ONLY the top 20 for deployment)
    joblib.dump(feature_cols, os.path.join(ML_MODELS_DIR, 'final_feature_names.pkl'))
    print(f"💾 Final feature names saved to: ML_MODELS\\final_feature_names.pkl")


if __name__ == '__main__':
    train_symptom_model()