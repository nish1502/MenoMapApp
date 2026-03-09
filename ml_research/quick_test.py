import requests
import json
import time

BASE_URL = "http://localhost:5002"

def test_endpoint(path, method="GET", payload=None):
    url = f"{BASE_URL}{path}"
    print(f"Testing {method} {url}...")
    start_time = time.time()
    try:
        if method == "POST":
            response = requests.post(url, json=payload, timeout=5)
        else:
            response = requests.get(url, params=payload, timeout=5)
        
        latency = (time.time() - start_time) * 1000
        print(f"  Status: {response.status_code}")
        print(f"  Latency: {latency:.2f}ms")
        try:
            res_json = response.json()
            print(f"  Response: {json.dumps(res_json, indent=2)}")
            return res_json, latency
        except:
            print(f"  Response: {response.text[:200]}")
            return None, latency
    except Exception as e:
        print(f"  Error: {e}")
        return None, 0

if __name__ == "__main__":
    results = []
    
    # 1. Health check
    res, lat = test_endpoint("/")
    results.append(("Home", res, lat))
    
    # 2. Register
    res, lat = test_endpoint("/register", "POST", {"email": f"audit_{int(time.time())}@example.com", "password": "password123"})
    results.append(("Register", res, lat))
    
    # 3. Login
    res, lat = test_endpoint("/login", "POST", {"email": "audit_test@example.com", "password": "password123"})
    results.append(("Login", res, lat))
    
    # 4. Predict Stage
    payload_stage = {"hot_flashes": 5, "mood_swings": 5, "fatigue": 5, "sleep_issues": 5, "brain_fog": 5, "user_id": "audit_test"}
    res, lat = test_endpoint("/predict-stage", "POST", payload_stage)
    results.append(("Predict Stage", res, lat))
    
    # 5. Predict Relief
    payload_relief = {"user_id": "audit_test", "log_id": 1, "target_symptom_key": "hot_flashes", "current_severity_ternary": 2}
    res, lat = test_endpoint("/predict-relief", "POST", payload_relief)
    results.append(("Predict Relief", res, lat))
    
    # 6. Profile
    res, lat = test_endpoint("/profile", "GET", {"user_id": "audit_test"})
    results.append(("Profile", res, lat))

    print("\n--- Summary ---")
    for name, res, lat in results:
        status = "✅ PASS" if res and res.get("status") == "success" else "❌ FAIL"
        print(f"{name:15} | {status} | {lat:.2f}ms")
