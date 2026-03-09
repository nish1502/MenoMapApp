import os
import joblib
import pandas as pd
import numpy as np
import warnings
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

warnings.filterwarnings("ignore")
os.environ["LOKY_MAX_CPU_COUNT"] = "1"

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
ML_MODELS_DIR = os.path.join(PROJECT_ROOT, "ML_MODELS")
DATA_PATH = os.path.join(PROJECT_ROOT, "ONBOARDING_DATA_PROCESSED", "cleaned_onboarding_data.csv")
ORIGINAL_ACCURACY = 0.7059

def run_drift_test():
    print("⏳ Loading Model and Data for Drift Test...")
    try:
        if not os.path.exists(DATA_PATH):
            print(f"❌ Data path not found: {DATA_PATH}")
            return
            
        df = pd.read_csv(DATA_PATH)
        
        model_path = os.path.join(ML_MODELS_DIR, "stage_prediction_model.pkl")
        features_path = os.path.join(ML_MODELS_DIR, "stage_predictor_features.pkl")
        
        if not os.path.exists(model_path):
            print(f"❌ Model path not found: {model_path}")
            return
            
        model = joblib.load(model_path)
        features = joblib.load(features_path)
        
        # Robust column handling
        hair_col = [c for c in df.columns if 'hair' in c and 'growth' in c]
        if hair_col:
            df.rename(columns={hair_col[0]: 'hair_growth_on_facebody_ternary'}, inplace=True)
            df['hair_growth_on_facebody'] = df['hair_growth_on_facebody_ternary']
            
        target = 'self_reported_stage_encoded'
        if target not in df.columns:
            target_cols = [c for c in df.columns if 'stage' in c and 'encoded' in c]
            if target_cols: target = target_cols[0]
            
        # Filter and Align
        valid_df = df[df[target] != -1].dropna(subset=[target])
        for f in features:
            if f not in valid_df.columns:
                valid_df[f] = 0
            valid_df[f] = valid_df[f].fillna(0)
            
        X = valid_df[features]
        y = valid_df[target].astype(int)
        
        # 80/20 Split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        print(f"📊 Dataset split: Train={len(X_train)}, Test={len(X_test)}")
        
        # Evaluate existing model on test set
        y_pred = model.predict(X_test)
        test_acc = accuracy_score(y_test, y_pred)
        
        diff = test_acc - ORIGINAL_ACCURACY
        is_significant = abs(diff) > 0.05
        
        print("\n--- 🏁 Drift Test Results ---")
        print(f"Original Accuracy: {ORIGINAL_ACCURACY:.4f}")
        print(f"Current Test Accuracy: {test_acc:.4f}")
        print(f"Difference: {diff:+.4f}")
        print(f"Significant Drift (>5%): {'🔴 YES' if is_significant else '🟢 NO'}")
        print("-----------------------------\n")
        
    except Exception as e:
        print(f"❌ Error during Drift Test: {e}")

if __name__ == "__main__":
    run_drift_test()
