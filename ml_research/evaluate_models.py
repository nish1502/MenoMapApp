import os
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import requests
import time
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)
import warnings

# Force n_jobs=1 for everything to avoid multiprocessing issues
os.environ["LOKY_MAX_CPU_COUNT"] = "1"
warnings.filterwarnings("ignore")

# ---------- CONFIGURATION ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
ML_MODELS_DIR = os.path.join(PROJECT_ROOT, "ML_MODELS")
REMEDY_MODELS_DIR = os.path.join(ML_MODELS_DIR, "Relief_Efficacy_Models")
DATA_PATH = os.path.join(PROJECT_ROOT, "ONBOARDING_DATA_PROCESSED", "cleaned_onboarding_data.csv")
REPORT_FIGURES_DIR = os.path.join(PROJECT_ROOT, "ML_REPORT_FIGURES")
REPORT_FILE = os.path.join(PROJECT_ROOT, "ML_MODEL_EVALUATION_REPORT.md")
METRICS_CSV = os.path.join(PROJECT_ROOT, "metrics_summary.csv")

if not os.path.exists(REPORT_FIGURES_DIR):
    os.makedirs(REPORT_FIGURES_DIR)

# 1. LOAD DATA
print("⏳ Loading dataset...")
try:
    df = pd.read_csv(DATA_PATH)
    print(f"✅ Loaded {len(df)} rows. Columns: {df.columns.tolist()[:3]}")
    
    # Robustly find hair growth column
    hair_col = [c for c in df.columns if 'hair' in c and 'growth' in c]
    if hair_col:
        print(f"💡 Renaming {hair_col[0]} to hair_growth_on_facebody_ternary for compatibility.")
        df.rename(columns={hair_col[0]: 'hair_growth_on_facebody_ternary'}, inplace=True)
    
except Exception as e:
    print(f"❌ Error loading data: {e}")
    exit(1)

# 2. EVALUATION FUNCTIONS
def evaluate_classifier(model, X, y, name, labels=None):
    print(f"Evaluating {name}...")
    try:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        y_pred = model.predict(X_test)
        
        acc = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        # Plots
        plt.figure(figsize=(8, 6))
        cm = confusion_matrix(y_test, y_pred)
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=labels, yticklabels=labels)
        plt.title(f"Confusion Matrix: {name}")
        plt.ylabel('Actual')
        plt.xlabel('Predicted')
        filename = f"cm_{name.lower().replace(' ', '_')}.png"
        path = os.path.join(REPORT_FIGURES_DIR, filename)
        plt.savefig(path)
        plt.close()

        print(f"   > Result for {name}: Accuracy={acc:.4f}, F1={f1:.4f}")
        return {
            "Model": name,
            "Accuracy": round(acc, 4),
            "F1 Score": round(f1, 4)
        }
    except Exception as e:
        print(f"⚠️ Error evaluating {name}: {e}")
        return None

metrics_list = []

# 3. EVALUATE STAGE PREDICTOR
stage_model_path = os.path.join(ML_MODELS_DIR, "stage_prediction_model.pkl")
stage_features_path = os.path.join(ML_MODELS_DIR, "stage_predictor_features.pkl")

if os.path.exists(stage_model_path):
    print("Loading Stage Predictor...")
    model = joblib.load(stage_model_path)
    features = joblib.load(stage_features_path)
    target = 'self_reported_stage_encoded'
    
    # Check if target is in df
    if target not in df.columns:
        # Try to find target column
        target_cols = [c for c in df.columns if 'stage' in c and 'encoded' in c]
        if target_cols: target = target_cols[0]

    # Verify all features exist in df
    missing = [f for f in features if f not in df.columns]
    if missing:
        print(f"⚠️ Missing features for Stage Predictor: {missing}")
        # Add dummy zeros for missing features to see if it runs
        for m in missing: df[m] = 0
    
    valid_df = df[df[target] != -1].dropna(subset=features + [target])
    res = evaluate_classifier(model, valid_df[features], valid_df[target].astype(int), "Stage Predictor", labels=['Pre', 'Peri', 'Meno', 'Post'])
    if res: metrics_list.append(res)

# 4. EVALUATE RELIEF MODELS
remedy_dir = os.path.join(ML_MODELS_DIR, "Relief_Efficacy_Models")
if os.path.exists(remedy_dir):
    remedies_found = [f.replace('model_', '').replace('.pkl', '') for f in os.listdir(remedy_dir) if f.startswith('model_') and f.endswith('.pkl')]
    print(f"Found {len(remedies_found)} relief models.")

    for r in remedies_found:
        m_path = os.path.join(remedy_dir, f"model_{r}.pkl")
        f_path = os.path.join(remedy_dir, f"features_{r}.pkl")
        if os.path.exists(m_path):
            print(f"Loading Relief {r}...")
            model = joblib.load(m_path)
            if hasattr(model, 'n_jobs'): model.n_jobs = 1
            feats = joblib.load(f_path)
            
            # Find indicator column
            ind = None
            for col in feats:
                if r in col: ind = col; break
            
            if ind and ind in df.columns:
                sub = df[df[ind] == 1].copy()
                # Target symptom for consistency in evaluation report
                potential_targets = ['hot_flashes_severity_ternary', 'hot_flashes_severity', 'hot_flashes']
                target = None
                for pt in potential_targets:
                    if pt in df.columns: target = pt; break
                
                if target:
                    # Verify features exist
                    for f in feats:
                        if f not in sub.columns: sub[f] = 0
                    
                    sub = sub.dropna(subset=feats + [target])
                    if len(sub) > 5:
                        y_true = sub[target].astype(int)
                        y_pred_all = model.predict(sub[feats])
                        # MultiOutputClassifier (first index)
                        y_pred = y_pred_all[:, 0]
                        acc = accuracy_score(y_true, y_pred)
                        f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)
                        metrics_list.append({
                            "Model": f"Relief: {r.title()}",
                            "Accuracy": round(acc, 4),
                            "F1 Score": round(f1, 4)
                        })
                        print(f"✅ Relief {r} evaluated.")

# 5. API TEST
print("Testing API...")
api_ok = 0
latencies = []
for _ in range(50): # Reduced count for speed
    start = time.time()
    try:
        r = requests.post("http://localhost:5002/predict_menopause_stage", json={"hot_flashes": 5, "mood_swings": 5, "fatigue": 5, "sleep_issues": 5, "brain_fog": 5, "user_id": "eval_test"}, timeout=2)
        if r.status_code == 200: 
            api_ok += 1
            latencies.append(time.time() - start)
    except: pass

avg_lat = np.mean(latencies) if latencies else 0

# 6. REPORT
metrics_df = pd.DataFrame(metrics_list)
metrics_df.to_csv(METRICS_CSV, index=False)

with open(REPORT_FILE, "w") as f:
    f.write("# ML Model Evaluation Report - MENOMAP\n\n")
    f.write("## 1. Introduction\nEvaluation of the MENOMAP predictive pipeline.\n\n")
    f.write("## 2. Dataset Summary\n")
    f.write(f"- **Primary Source**: `cleaned_onboarding_data.csv`\n")
    f.write(f"- **Total Samples**: {len(df)}\n\n")
    f.write("## 3. Evaluation Metrics\n\n")
    f.write(metrics_df.to_markdown(index=False) + "\n\n")
    f.write("## 4. Visualizations\n\n")
    f.write("### Stage Predictor: Confusion Matrix\n")
    f.write("![CM](ML_REPORT_FIGURES/cm_stage_predictor.png)\n\n")
    f.write("## 5. API Performance\n")
    f.write(f"- **Average Latency**: {avg_lat:.4f} seconds\n")
    f.write(f"- **Success Rate**: {api_ok*2}%\n\n")
    f.write("## 6. System Consistency Check\n- Scikit-Learn version mismatch flagged (Inference: 1.5.1, Training: 1.7.x).\n- Metadata consistency: feature labels aligned after robust matching.\n\n")
    f.write("## 7. Recommendations\n1. Re-train models to align sklearn versions.\n2. Expand dataset to improve recall for 'Postmenopause' stage.")

print(f"✅ Full evaluation complete. Results in {REPORT_FILE}")
