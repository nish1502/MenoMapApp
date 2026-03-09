import os
import joblib
import pandas as pd
import numpy as np
import warnings
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score

warnings.filterwarnings("ignore")
os.environ["LOKY_MAX_CPU_COUNT"] = "1"

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
ML_MODELS_DIR = os.path.join(PROJECT_ROOT, "ML_MODELS")
DATA_PATH = os.path.join(PROJECT_ROOT, "ONBOARDING_DATA_PROCESSED", "cleaned_onboarding_data.csv")

def run_ablation_study():
    print("⏳ Loading Model and Data for Ablation Study...", flush=True)
    try:
        if not os.path.exists(DATA_PATH):
            print(f"❌ Data path not found: {DATA_PATH}", flush=True)
            return
            
        df = pd.read_csv(DATA_PATH)
        
        model_path = os.path.join(ML_MODELS_DIR, "stage_prediction_model.pkl")
        features_path = os.path.join(ML_MODELS_DIR, "stage_predictor_features.pkl")
        
        if not os.path.exists(model_path):
            print(f"❌ Model path not found: {model_path}", flush=True)
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
        
        # 80/20 Split for evaluation
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        # 1. Baseline Performance
        y_pred_base = model.predict(X_test)
        base_acc = accuracy_score(y_test, y_pred_base)
        base_f1 = f1_score(y_test, y_pred_base, average='weighted')
        
        print(f"✅ Baseline: Acc={base_acc:.4f}, F1={base_f1:.4f}", flush=True)
        
        # 2. Identify Top 3 Features
        if hasattr(model, 'feature_importances_'):
            importances = pd.Series(model.feature_importances_, index=features).sort_values(ascending=False)
            top_3 = importances.head(3).index.tolist()
            print(f"🔍 Top 3 Features: {top_3}", flush=True)
        else:
            print("❌ Model does not have feature_importances_", flush=True)
            return

        # 3. Ablation Loop
        ablation_results = []
        for feature in top_3:
            X_test_ablated = X_test.copy()
            X_test_ablated[feature] = 0 # Temporarily remove by zeroing out
            
            y_pred_ablated = model.predict(X_test_ablated)
            acc = accuracy_score(y_test, y_pred_ablated)
            f1 = f1_score(y_test, y_pred_ablated, average='weighted')
            
            ablation_results.append({
                "Feature": feature,
                "Acc": acc,
                "F1": f1,
                "Acc_Delta": acc - base_acc,
                "F1_Delta": f1 - base_f1
            })
            
        print("\n--- 🏁 Ablation Study Results ---", flush=True)
        print(f"{'Feature':<25} {'Acc':<10} {'F1':<10} {'Acc Delta':<10} {'F1 Delta':<10}", flush=True)
        for r in ablation_results:
            print(f"{r['Feature']:<25} {r['Acc']:<10.4f} {r['F1']:<10.4f} {r['Acc_Delta']:<10.4f} {r['F1_Delta']:<10.4f}", flush=True)
            
        # Summary
        highest_impact = sorted(ablation_results, key=lambda x: x['Acc_Delta'])[0]
        print(f"\n💡 Highest Impact Feature: {highest_impact['Feature']}", flush=True)
        print("---------------------------------\n", flush=True)
        
    except Exception as e:
        print(f"❌ Error during Ablation Study: {e}", flush=True)

if __name__ == "__main__":
    run_ablation_study()
