from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os
import sys
import traceback

# --- Import service and DB functions ---
from diet_planner_service import AdaptiveDietPlanner
from relief_recommender_service import ReliefRecommender
from database import (
    init_db, 
    register_user,
    login_user,
    insert_user_data, 
    get_latest_user_record,
    insert_symptom_log,
    get_user_profile,
    insert_user_profile,
    insert_remedy_recommendation,
    update_remedy_feedback,
    get_db_connection
)

app = Flask(__name__)
# Enable global CORS with support for credentials and all origins
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Get the directory where app.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

# ---------- PATH CONFIG (Restructured Paths) ----------
# Note: PROJECT_ROOT is now one level up from backend/
recipe_path = os.path.join(PROJECT_ROOT, "datasets_sample", "DIET_DATA_PROCESSED", "cleaned_indian_recipes_for_ml.csv")
symptom_model_path = os.path.join(PROJECT_ROOT, "ml_models", "symptom_prediction_model_final.pkl")
symptom_features_path = os.path.join(PROJECT_ROOT, "ml_models", "final_feature_names.pkl")
diet_model_path = os.path.join(PROJECT_ROOT, "ml_models", "diet_suitability_predictor.pkl")
diet_features_path = os.path.join(PROJECT_ROOT, "ml_models", "diet_predictor_features.pkl")
stage_model_path = os.path.join(PROJECT_ROOT, "ml_models", "stage_prediction_model.pkl")
stage_features_path = os.path.join(PROJECT_ROOT, "ml_models", "stage_predictor_features.pkl")

# Initialize local sqlite database automatically
print("⏳ Initializing database...")
init_db()
print("✅ Database initialized successfully.")

# ---------- INITIALIZE ML MODELS ----------
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
    planner = None

try:
    stage_model = joblib.load(stage_model_path)
    stage_model_features = joblib.load(stage_features_path)
    print("✅ Stage Predictor Model loaded successfully!")
except Exception as e:
    print(f"❌ Failed to initialize Stage Predictor: {e}")
    stage_model = None

try:
    recommender = ReliefRecommender()
    print("✅ ReliefRecommender initialized successfully!")
except Exception as e:
    print(f"❌ Failed to initialize ReliefRecommender: {e}")
    recommender = None


# ---------- STAGE PREDICTOR HELPER FUNCTIONS ----------

def convert_slider_to_ternary(value):
    """Converts a 0-10 slider value to a 0-2 ternary scale."""
    try:
        val = int(value)
        if val <= 3:  return 0  # Mild
        elif val <= 7: return 1  # Moderate
        else:          return 2  # Severe
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

@app.route("/", methods=["GET", "OPTIONS"])
def home():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    try:
        return jsonify({"status": "success", "message": "MENOMAP Flask API is live 🚀"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    
    try:
        data = request.get_json(force=True)
        print("REGISTER PAYLOAD:", data, flush=True)
        email = data.get('email')
        password = data.get('password')
        name = data.get('name', 'User')

        if not email or not password:
            missing = []
            if not email: missing.append("email")
            if not password: missing.append("password")
            return jsonify({"status": "error", "message": f"Missing fields: {', '.join(missing)}"}), 400

        if register_user(email, password, name):
            return jsonify({"status": "success", "message": "User registered successfully"})
        else:
            return jsonify({"status": "error", "message": "Email already in use or registration failed"}), 400
    except Exception as e:
        print(f"❌ Exception in /register: {e}")
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"Server processing error: {str(e)}"}), 500


@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    try:
        data = request.get_json(force=True)
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"status": "error", "message": "Email and password are required"}), 400

        user = login_user(email, password)
        if user:
            return jsonify({
                "status": "success",
                "message": "Login successful",
                "data": {"user": user}
            })
        else:
            return jsonify({"status": "error", "message": "Invalid email or password"}), 401
    except Exception as e:
        print(f"❌ Exception in /login: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/profile", methods=["GET", "OPTIONS"])
@app.route("/get_user_profile", methods=["GET", "OPTIONS"])
def get_profile():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"status": "error", "message": "user_id is required"}), 400
        
        profile = get_user_profile(user_id)
        if profile:
            return jsonify({"status": "success", "data": profile})
        else:
            return jsonify({"status": "error", "message": "Profile not found"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/update_profile", methods=["POST", "OPTIONS"])
def update_profile():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
        
    try:
        data = request.get_json(force=True)
        user_id = data.get('user_id')
        profile_data = data.get('profile_data')

        if not user_id or not profile_data:
            return jsonify({"status": "error", "message": "user_id and profile_data are required"}), 400

        insert_user_profile(user_id, profile_data)
        return jsonify({"status": "success", "message": "Profile updated successfully"})
    except Exception as e:
        print(f"❌ Exception in /update_profile: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/recommend", methods=["POST", "OPTIONS"])
def recommend_diet():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
        
    try:
        if planner is None:
            return jsonify({"status": "error", "message": "Planner not initialized properly."}), 500

        data = request.get_json(force=True)
        print("\n🟢 Received /recommend data:", data, flush=True)

        user_id = data.get("user_id", "guest")
        age = data.get("age")
        mood = data.get("mood")
        
        import json
        symptoms = json.dumps(data.get("symptoms", {})) 
        preferences = json.dumps(data.get("preferences", []))
        extra_json = json.dumps(data.get("extra", {})) if data.get("extra") else None

        insert_user_data(user_id=user_id, age=age, symptoms=symptoms, preferences=preferences, mood=mood, extra_json=extra_json)
        
        user_row = get_latest_user_record(user_id)
        result = planner.get_diet_recommendation(request_data=data, user_row=user_row)
        
        print("✅ Diet recommendation generated.")
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        print(f"❌ Exception in /recommend: {e}")
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/predict-stage", methods=["POST", "OPTIONS"])
@app.route("/predict_menopause_stage", methods=["POST", "OPTIONS"])
def predict_stage():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
        
    try:
        if not stage_model:
            return jsonify({"status": "error", "message": "Stage Predictor Model is not loaded."}), 500

        data = request.get_json(force=True)
        if not data:
            return jsonify({"status": "error", "message": "No input data provided."}), 400

        required_fields = ['hot_flashes', 'mood_swings', 'fatigue', 'sleep_issues', 'brain_fog']
        if not all(field in data for field in required_fields):
            return jsonify({"status": "error", "message": f"Missing required symptom data. Required: {required_fields}"}), 400
            
        print("\n🟢 Received /predict-stage data:", data, flush=True)

        # Prepare Data for the Model
        input_data = {feature: 0 for feature in stage_model_features}
        symptom_mapping = {
            'hot_flashes': 'hot_flashes_severity_ternary',
            'night_sweats': 'night_sweats_severity_ternary',
            'mood_swings': 'mood_swings_severity_ternary',
            'sleep_issues': 'sleep_disturbances_severity_ternary',
            'fatigue': 'fatigue_severity_meno_ternary', 
            'brain_fog': 'brain_fog_severity_ternary',
            'irritability': 'mood_swings_irritability_severity_ternary',
        }
        for app_key, model_key in symptom_mapping.items():
            if app_key in data:
                input_data[model_key] = convert_slider_to_ternary(data[app_key])
        
        if 'fatigue' in data:
            val = convert_slider_to_ternary(data['fatigue'])
            input_data['fatigue_severity_meno_ternary'] = val
            input_data['fatigue_severity_pcos_ternary'] = val
            
        if 'mood_swings' in data:
            val = convert_slider_to_ternary(data['mood_swings'])
            input_data['mood_swings_severity_ternary'] = val
            input_data['mood_swings_irritability_severity_ternary'] = val

        df_input = pd.DataFrame([input_data])[stage_model_features]

        # Make prediction
        prediction_code = stage_model.predict(df_input)[0]
        prediction_proba = stage_model.predict_proba(df_input)
        confidence = np.max(prediction_proba) * 100
        predicted_stage_string = map_stage_to_string(prediction_code)

        # Save the log to the database
        user_id = data.get("user_id", "guest")
        log_date = data.get("log_date", "default_date_string")
        
        new_log_id = insert_symptom_log(user_id, log_date, predicted_stage_string, data)
        print(f"✅ Stage log saved with ID: {new_log_id}")

        return jsonify({
            "status": "success",
            "data": {
                "predicted_stage": predicted_stage_string,
                "confidence": round(confidence, 2),
                "log_id": new_log_id
            }
        })
    except Exception as e:
        print(f"❌ Exception in /predict-stage: {e}")
        traceback.print_exc()
        return jsonify({"status": "error", "message": f"Prediction failed: {str(e)}"}), 500


@app.route("/symptom-log", methods=["POST", "OPTIONS"])
def log_symptoms():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    try:
        data = request.get_json(force=True)
        user_id = data.get('user_id')
        log_date = data.get('log_date')
        symptoms = data.get('symptoms')
        if not all([user_id, log_date, symptoms]):
            return jsonify({"status": "error", "message": "Missing user_id, log_date, or symptoms"}), 400
        
        log_id = insert_symptom_log(user_id, log_date, "Logged", symptoms)
        return jsonify({"status": "success", "message": "Symptoms logged successfully", "data": {"log_id": log_id}})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/predict-relief", methods=["POST", "OPTIONS"])
@app.route("/get_remedy", methods=["POST", "OPTIONS"])
def get_remedy():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
        
    try:
        if not recommender:
            return jsonify({"status": "error", "message": "Relief Recommender not initialized."}), 500

        data = request.get_json(force=True)
        print("\n🟢 Received /predict-relief data:", data, flush=True)

        user_id = data.get('user_id')
        log_id = data.get('log_id')
        target_symptom_key = data.get('target_symptom_key')
        current_severity_ternary = data.get('current_severity_ternary')

        if not all([user_id, log_id, target_symptom_key, current_severity_ternary is not None]):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400

        # Fetch User's Base Profile
        profile_data = get_user_profile(user_id) 
        if not profile_data:
            profile_data = {
                'stress_level_encoded': 3, 'self_reported_stage_encoded': 1, 'cycle_regularity_encoded': 2,
                'flow_intensity_encoded': 2, 'exercise_frequency_wk': 1.5, 'age_group_simplified_40_49': 1,
                'cycle_length_days': 26.0, 'diet_goal_high_protein': 1, 'age_group_simplified_50_59': 0, 
                'worsen_food_friedfoods': 1, 'avoided_gluten': 0, 'ex_type_none_reported': 0,
                'remedy_turmericmilk': 0, 'diet_goal_calcium_rich': 1, 'avoided_soy': 0,
                'remedy_cinnamonwater': 0, 'remedy_fenugreekseeds': 0, 'age_group_simplified_younger_than_40': 0
            }
            insert_user_profile(user_id, profile_data)

        recommendation = recommender.recommend_relief(profile_data, target_symptom_key, current_severity_ternary)
        
        if "error" in recommendation:
            return jsonify({"status": "error", "message": recommendation["error"]}), 500

        # Log recommendation
        history_id = insert_remedy_recommendation(
            log_id=log_id, user_id=user_id, target_symptom=target_symptom_key,
            remedy_recommended=recommendation['best_remedy_id']
        )
        recommendation['history_id'] = history_id
        
        print(f"✅ Recommendation returned: {recommendation['best_remedy_id']}")
        return jsonify({"status": "success", "data": recommendation})
    except Exception as e:
        print(f"❌ Exception in /predict-relief: {e}")
        return jsonify({"status": "error", "message": f"Recommendation failed: {str(e)}"}), 500


@app.route("/log_remedy_feedback", methods=["POST", "OPTIONS"])
def log_feedback():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
        
    try:
        data = request.get_json(force=True)
        history_id = data.get('history_id')
        was_effective = data.get('was_effective')

        if not history_id:
            return jsonify({"status": "error", "message": "No history_id provided"}), 400

        effectiveness_score = 1 if was_effective else 0
        update_remedy_feedback(history_id, effectiveness_score)
        
        print(f"✅ Feedback saved for history_id: {history_id}")
        return jsonify({"status": "success", "message": "Feedback saved!"})
    except Exception as e:
        print(f"❌ Exception in /log_remedy_feedback: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/get_relief_summary", methods=["POST", "OPTIONS"])
def get_relief_summary():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
        
    try:
        data = request.get_json(force=True)
        user_id = data.get('user_id')
        if not user_id:
            return jsonify({"status": "error", "message": "user_id is required"}), 400

        conn = get_db_connection()
        rows = conn.cursor().execute(
            """
            SELECT remedy_recommended, AVG(effectiveness) * 100 as effectiveness_percent, COUNT(*) as log_count
            FROM remedy_history WHERE user_id = ? AND effectiveness != -1
            GROUP BY remedy_recommended ORDER BY effectiveness_percent DESC
            """, (user_id,)
        ).fetchall()
        conn.close()

        summary_data = []
        emoji_map = {
            'yoga': '🧘', 'turmericmilk': '🍵', 'journaling': '✍️', 'meditation': '🕉️', 
            'cardio': '🏃‍♀️', 'cinnamonwater': '💧', 'fenugreekseeds': '🌱', 'aloeverajuice': '🌿', 'strengthtraining': '🏋️‍♀️'
        }
        for row in rows:
            remedy_id = row['remedy_recommended']
            summary_data.append({
                "name": remedy_id.title(),
                "emoji": emoji_map.get(remedy_id, '🌿'),
                "effectiveness": round(row['effectiveness_percent']),
                "note": f"Logged {row['log_count']} times"
            })

        mock_trend = {"labels": ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], "datasets": [{"data": [0] * 7}]}
        ai_suggestion = "Log remedies to see insights!" if not summary_data else f"Best remedy: {summary_data[0]['name']} ({summary_data[0]['effectiveness']}% efficacy)"

        return jsonify({"status": "success", "data": {"summary": summary_data, "trend": mock_trend, "aiSuggestion": ai_suggestion}})
    except Exception as e:
        print(f"❌ Exception in /get_relief_summary: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ---------- RUN ----------
if __name__ == "__main__":
    print("\n🚀 MENOMAP Backend starting...")
    print("MENOMAP Backend running at http://localhost:5002")
    app.run(host="0.0.0.0", port=5002, debug=False)