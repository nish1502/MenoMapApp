import os
import joblib
import pandas as pd
import numpy as np
import warnings
from sklearn.model_selection import cross_validate, StratifiedKFold
from sklearn.metrics import make_scorer, accuracy_score, f1_score

warnings.filterwarnings("ignore")
os.environ["LOKY_MAX_CPU_COUNT"] = "1"

# Paths
# Note: script is in ML_PIPELINE/cv_eval.py. PROJECT_ROOT is up one level.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
ML_MODELS_DIR = os.path.join(PROJECT_ROOT, "ML_MODELS")
DATA_PATH = os.path.join(PROJECT_ROOT, "ONBOARDING_DATA_PROCESSED", "cleaned_onboarding_data.csv")

def perform_cv():
    print("⏳ Loading Model and Data...")
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
        
        print(f"📊 Dataset prepared: {len(X)} samples, {len(features)} features.")
        
        # 5-Fold Cross Validation
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        scoring = {
            'accuracy': 'accuracy',
            'f1_weighted': 'f1_weighted'
        }
        
        print("🔄 Running 5-fold Cross-Validation...")
        results = cross_validate(model, X, y, cv=skf, scoring=scoring, n_jobs=1)
        
        # Calculate stats
        acc_mean = np.mean(results['test_accuracy'])
        acc_std = np.std(results['test_accuracy'])
        f1_mean = np.mean(results['test_f1_weighted'])
        
        print("\n--- 🏁 Evaluation Results ---")
        print(f"Mean Accuracy: {acc_mean:.4f}")
        print(f"Std Deviation: {acc_std:.4f}")
        print(f"Mean F1-Score: {f1_mean:.4f}")
        print("-----------------------------\n")
        
    except Exception as e:
        print(f"❌ Error during CV: {e}")

if __name__ == "__main__":
    perform_cv()
