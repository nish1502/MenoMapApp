import requests
import json
import time
import os
import joblib
import pandas as pd
import numpy as np
import sqlite3

BASE_URL = "http://localhost:5002"
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def check_structure():
    print("--- 1. PROJECT STRUCTURE ANALYSIS ---")
    critical_files = [
        "ML_PIPELINE/app.py",
        "ML_PIPELINE/database.py",
        "ML_PIPELINE/requirements.txt",
        "ML_MODELS/stage_prediction_model.pkl",
        "screens/Auth/LoginScreen.js",
        "screens/Auth/RegisterScreen.js",
        "utils/apiConfig.js"
    ]
    missing = []
    for f in critical_files:
        path = os.path.join(PROJECT_ROOT, f)
        if os.path.exists(path):
            print(f"✅ Found: {f}")
        else:
            print(f"❌ Missing: {f}")
            missing.append(f)
    return missing

def check_backend():
    print("\n--- 2. BACKEND SERVER VALIDATION ---")
    try:
        res = requests.get(f"{BASE_URL}/", timeout=5)
        if res.status_code == 200:
            print("✅ Backend is alive and responding on port 5002.")
            return True
        else:
            print(f"❌ Backend responded with {res.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend is not reachable: {e}")
        return False

def check_db():
    print("\n--- 4. DATABASE VALIDATION ---")
    db_path = os.path.join(PROJECT_ROOT, "menomap.db")
    if not os.path.exists(db_path):
        db_path = os.path.join(PROJECT_ROOT, "ML_PIPELINE", "menomap.db")
    
    print(f"Checking DB at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    tables = [t[0] for t in cursor.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]
    print(f"Tables found: {tables}")
    required = ["users", "user_profile", "symptom_logs"]
    missing = [t for t in required if t not in tables]
    if not missing:
        print("✅ All required tables exist.")
    else:
        print(f"❌ Missing tables: {missing}")
    
    # Check index
    indexes = [i[0] for i in cursor.execute("SELECT name FROM sqlite_master WHERE type='index';").fetchall()]
    if "idx_user_id" in indexes:
        print("✅ Index idx_user_id exists.")
    else:
        print("❌ Index idx_user_id missing.")
    conn.close()
    return missing

def test_api():
    print("\n--- 5. API ENDPOINT TESTING ---")
    endpoints = [
        ("/", "GET", None),
        ("/register", "POST", {"email": f"audit_{int(time.time())}@example.com", "password": "password123"}),
        ("/login", "POST", {"email": "debug_v4@example.com", "password": "password123"}),
        ("/profile", "GET", {"user_id": "audit_test"}),
        ("/predict-stage", "POST", {"hot_flashes": 5, "mood_swings": 5, "fatigue": 5, "sleep_issues": 5, "brain_fog": 5, "user_id": "audit_test"}),
        ("/predict-relief", "POST", {"user_id": "audit_test", "log_id": 1, "target_symptom_key": "hot_flashes_severity_ternary", "current_severity_ternary": 2})
    ]
    results = []
    for path, method, payload in endpoints:
        start = time.time()
        try:
            if method == "POST":
                res = requests.post(f"{BASE_URL}{path}", json=payload, timeout=5)
            else:
                res = requests.get(f"{BASE_URL}{path}", params=payload, timeout=5)
            lat = (time.time() - start) * 1000
            status = "✅" if res.status_code in [200, 201] else "❌"
            results.append({"path": path, "status": status, "code": res.status_code, "latency": lat})
            print(f"{status} {method} {path} - {res.status_code} ({lat:.2f}ms)")
        except Exception as e:
            results.append({"path": path, "status": "❌", "code": "ERR", "latency": 0})
            print(f"❌ {method} {path} - ERROR: {e}")
    return results

def check_models():
    print("\n--- 7. ML PIPELINE VALIDATION ---")
    model_dir = os.path.join(PROJECT_ROOT, "ML_MODELS")
    if not os.path.exists(model_dir):
        print(f"❌ Model directory not found at {model_dir}")
        return
    models = [f for f in os.listdir(model_dir) if f.endswith(".pkl")]
    print(f"Found {len(models)} models in ML_MODELS")
    for m in models:
        try:
            joblib.load(os.path.join(model_dir, m))
            print(f"✅ Loaded: {m}")
        except Exception as e:
            print(f"❌ Failed to load {m}: {e}")

if __name__ == "__main__":
    missing_struct = check_structure()
    backend_up = check_backend()
    missing_tables = check_db()
    api_results = test_api()
    check_models()
    
    # Generate reports
    with open(os.path.join(PROJECT_ROOT, "SYSTEM_HEALTH_REPORT.md"), "w") as f:
        f.write("# SYSTEM HEALTH REPORT\n\n")
        f.write("## Status Summary\n")
        f.write(f"- Project Structure: {'✅ Healthy' if not missing_struct else '❌ Missing components'}\n")
        f.write(f"- Backend: {'✅ Online' if backend_up else '❌ Offline'}\n")
        f.write(f"- Database: {'✅ Validated' if not missing_tables else '❌ Table mismatch'}\n\n")
        f.write("## Findings\n")
        if missing_struct: f.write(f"- Missing files: {missing_struct}\n")
        avg_lat = sum(r['latency'] for r in api_results if r['latency'] > 0)/len([r for r in api_results if r['latency'] > 0])
        f.write(f"- API average latency: {avg_lat:.2f}ms\n")

    with open(os.path.join(PROJECT_ROOT, "API_TEST_RESULTS.md"), "w") as f:
        f.write("# API TEST RESULTS\n\n")
        f.write("| Endpoint | Status | Code | Latency |\n")
        f.write("| --- | --- | --- | --- |\n")
        for r in api_results:
            f.write(f"| {r['path']} | {r['status']} | {r['code']} | {r['latency']:.2f}ms |\n")

    print("\n✅ Audit complete. Reports generated.")
