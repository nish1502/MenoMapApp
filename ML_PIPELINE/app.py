from flask import Flask, request, jsonify
from diet_planner_service import AdaptiveDietPlanner
from flask_cors import CORS
from database import init_db, insert_user_data, get_latest_user_record
import joblib  # <-- ADDED
import pandas as pd  # <-- ADDED
import numpy as np   # <-- ADDED

app = Flask(__name__)
# allow all origins for local dev
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})

# ---------- PATH CONFIG ----------
# (Ensure these relative paths are correct from where you run app.py)
recipe_path = "../DIET_DATA_PROCESSED/cleaned_indian_recipes_for_ml.csv"
symptom_model_path = "../ML_MODELS/symptom_prediction_model_final.pkl"
symptom_features_path = "../ML_MODELS/final_feature_names.pkl"
diet_model_path = "../ML_MODELS/diet_suitability_predictor.pkl"
diet_features_path = "../ML_MODELS/diet_predictor_features.pkl"

# --- NEW: Add paths for the stage predictor model ---
stage_model_path = "../ML_MODELS/stage_prediction_model.pkl"
stage_features_path = "../ML_MODELS/stage_predictor_features.pkl"


# init local sqlite db
init_db()

# ---------- INITIALIZE THE PLANNER ----------
try:
    planner = AdaptiveDietPlanner(
        recipe_path=recipe_path,
        symptom_model_path=symptom_model_path,
        symptom_features_path=symptom_features_path,
        diet_model_path=diet_model_path,
        diet_features_path=diet_features_path,
    )
    print("✅ AdaptiveDietPlanner initialized successfully!")
except Exception as e:
    print(f"❌ Failed to initialize AdaptiveDietPlanner: {e}")
    print("💡 Check: Are your file paths correct? The app is running from the 'backend' folder, so '../ML_MODELS/' should be right.")
    planner = None

# ---------- NEW: INITIALIZE THE STAGE PREDICTOR MODEL ----------
try:
    stage_model = joblib.load(stage_model_path)
    stage_model_features = joblib.load(stage_features_path)
    print("✅ Stage Predictor Model loaded successfully!")
except Exception as e:
    print(f"❌ Failed to initialize Stage Predictor: {e}")
    print("💡 Check: Have you run 'train_stage_predictor.py' yet?")
    stage_model = None


# ---------- NEW: STAGE PREDICTOR HELPER FUNCTIONS ----------

def convert_slider_to_ternary(value):
    """Converts a 0-10 slider value to a 0-2 ternary scale."""
    try:
        val = int(value)
        if val <= 3:  # 0, 1, 2, 3
            return 0  # Mild
        elif val <= 7: # 4, 5, 6, 7
            return 1  # Moderate
        else:         # 8, 9, 10
            return 2  # Severe
    except (ValueError, TypeError):
        return 0 # Default to 0 if data is bad

def map_stage_to_string(stage_code):
    """Converts the model's number output to a user-friendly string."""
    stage_map = {
        0: "Premenopause",
        1: "Perimenopause",
        2: "Menopause",
        3: "Postmenopause"
    }
    return stage_map.get(stage_code, "Unknown")


# ---------- ROUTES ----------
@app.route("/")
def home():
    return jsonify({"status": "running", "message": "Diet Planner Flask API is live 🚀"})


@app.route("/recommend", methods=["POST"])
def recommend_diet():
    if planner is None:
        return jsonify({"error": "Planner not initialized properly."}), 500

    data = request.get_json(force=True)
    print("\n🟢 Received request data:", data, flush=True)

    # extract user_id if frontend provides it; fallback to 'guest'
    user_id = data.get("user_id", "guest")
    age = data.get("age")
    mood = data.get("mood")
    
    import json
    
    # --- 💡 CRITICAL CHANGE HERE ---
    # We now expect 'symptoms' to be a dictionary, so the default is {}
    symptoms = json.dumps(data.get("symptoms", {})) 
    # ---
    
    preferences = json.dumps(data.get("preferences", []))
    extra_json = json.dumps(data.get("extra", {})) if data.get("extra") else None

    # 1. Save to DB
    try:
        insert_user_data(user_id=user_id, age=age, symptoms=symptoms, preferences=preferences, mood=mood, extra_json=extra_json)
    except Exception as e:
        print(f"❌ DB insert error: {e}")
        # Note: We continue even if DB fails, to give the user a recommendation
    
    # 2. Fetch latest saved record (for the fallback logic in the service)
    user_row = get_latest_user_record(user_id)

    try:
        # This call is perfect. It passes the new, live data directly
        # to the planner, which is exactly what our fixed service needs.
        result = planner.get_diet_recommendation(request_data=data, user_row=user_row)
        
        print("✅ Result:", result, flush=True)
        return jsonify(result)
        
    except Exception as e:
        import traceback
        print(f"❌ Exception in planner: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ---------- NEW: STAGE PREDICTION ROUTE ----------

@app.route("/predict_menopause_stage", methods=["POST"])
def predict_stage():
    if not stage_model:
        return jsonify({"error": "Stage Predictor Model is not loaded."}), 500

    # Get the JSON data from the mobile app
    data = request.get_json()

    if not data:
        return jsonify({"error": "No input data provided."}), 400

    # --- Prepare Data for the Model ---
    
    # Initialize all expected symptoms to 0
    input_data = {feature: 0 for feature in stage_model_features}

    # Map app keys (like 'hot_flashes') to model feature names
    symptom_mapping = {
        'hot_flashes': 'hot_flashes_severity_ternary',
        'night_sweats': 'night_sweats_severity_ternary',
        'mood_swings': 'mood_swings_severity_ternary',
        'sleep_issues': 'sleep_disturbances_severity_ternary',
        'fatigue': 'fatigue_severity_meno_ternary', 
        'brain_fog': 'brain_fog_severity_ternary',
        'irritability': 'mood_swings_irritability_severity_ternary',
    }

    # Loop through what the app sent and fill our model's input
    for app_key, model_key in symptom_mapping.items():
        if app_key in data:
            # Convert 0-10 slider value to 0-2 ternary value
            ternary_value = convert_slider_to_ternary(data[app_key])
            input_data[model_key] = ternary_value
            
    # Handle the two fatigue features (map 'fatigue' to both)
    if 'fatigue' in data:
        ternary_val = convert_slider_to_ternary(data['fatigue'])
        input_data['fatigue_severity_meno_ternary'] = ternary_val
        input_data['fatigue_severity_pcos_ternary'] = ternary_val
        
    # Handle the two mood features (map 'mood_swings' to both)
    if 'mood_swings' in data:
        ternary_val = convert_slider_to_ternary(data['mood_swings'])
        input_data['mood_swings_severity_ternary'] = ternary_val
        input_data['mood_swings_irritability_severity_ternary'] = ternary_val

    # Convert the dictionary to a DataFrame in the correct feature order
    try:
        df_input = pd.DataFrame([input_data])
        df_input = df_input[stage_model_features] # Ensures column order is correct
    except Exception as e:
        return jsonify({"error": f"Data formatting error: {str(e)}"}), 400

    # --- Make the Prediction ---
    try:
        prediction_code = stage_model.predict(df_input)[0]
        prediction_proba = stage_model.predict_proba(df_input)
        
        # Get the confidence score for the predicted class
        confidence = np.max(prediction_proba) * 100 # as a percentage
        
        # Convert the number (0, 1, 2, 3) to a string
        predicted_stage_string = map_stage_to_string(prediction_code)

        # --- Send the Response ---
        response = {
            "predicted_stage": predicted_stage_string,
            "confidence": round(confidence, 2)
        }
        return jsonify(response)

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


# ---------- RUN ----------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)