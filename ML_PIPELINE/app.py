from flask import Flask, request, jsonify
from diet_planner_service import AdaptiveDietPlanner
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import json
import traceback
import uuid # <-- NEW: For creating unique user IDs

# --- NEW: Imports for Auth ---
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
from passlib.hash import pbkdf2_sha256 # For hashing passwords

# --- UPDATED: Import all database functions ---
from relief_recommender_service import ReliefRecommender
from database import (
    init_db, 
    insert_user_data, 
    get_latest_user_record,
    insert_symptom_log,
    get_user_profile,
    insert_user_profile,
    insert_remedy_recommendation,
    update_remedy_feedback,
    get_db_connection,
    # --- NEW DB Functions ---
    create_user,
    get_user_by_email,
    get_user_by_id
)

app = Flask(__name__)
# allow all origins for local dev
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})

# --- NEW: JWT Configuration ---
# You MUST change this secret key to something random and strong
app.config["JWT_SECRET_KEY"] = "super-secret-key-change-this-please" 
jwt = JWTManager(app)

# ---------- PATH CONFIG ----------
# (All your existing paths)
recipe_path = "../DIET_DATA_PROCESSED/cleaned_indian_recipes_for_ml.csv"
symptom_model_path = "../ML_MODELS/symptom_prediction_model_final.pkl"
symptom_features_path = "../ML_MODELS/final_feature_names.pkl"
diet_model_path = "../ML_MODELS/diet_suitability_predictor.pkl"
diet_features_path = "../ML_MODELS/diet_predictor_features.pkl"
stage_model_path = "../ML_MODELS/stage_prediction_model.pkl"
stage_features_path = "../ML_MODELS/stage_predictor_features.pkl"


# init local sqlite db
init_db()

# ---------- INITIALIZE ALL SERVICES (Existing) ----------
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


# ---------- HELPER FUNCTIONS (Existing) ----------

def convert_slider_to_ternary(value):
    # (No changes)
    try:
        val = int(value)
        if val <= 3: return 0
        elif val <= 7: return 1
        else: return 2
    except (ValueError, TypeError):
        return 0

def map_stage_to_string(stage_code):
    # (No changes)
    stage_map = { 0: "Premenopause", 1: "Perimenopause", 2: "Menopause", 3: "Postmenopause" }
    return stage_map.get(stage_code, "Unknown")

def generate_user_id():
    """Generates a unique user_id."""
    return str(uuid.uuid4())


# ---------- NEW: AUTHENTICATION ROUTES ----------

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    print("\n🟢 Received /register data:", data.get('email'))
    
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not all([name, email, password]):
        return jsonify({"error": "Missing name, email, or password"}), 400

    # Check if user already exists
    if get_user_by_email(email):
        return jsonify({"error": "Email already exists"}), 409

    try:
        # Create new user
        user_id = generate_user_id()
        password_hash = pbkdf2_sha256.hash(password)
        create_user(user_id, email, name, password_hash)
        print(f"✅ User created successfully: {email} / {user_id}")
        return jsonify({"success": True, "message": "User created successfully"}), 201
    except Exception as e:
        print(f"❌ Exception in /register: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    print("\n🟢 Received /login data:", data.get('email'))
    
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = get_user_by_email(email)

    # Check if user exists and password is correct
    if not user or not pbkdf2_sha256.verify(password, user['password_hash']):
        return jsonify({"error": "Invalid email or password"}), 401

    # Create access token
    access_token = create_access_token(identity=user['user_id'])
    print(f"✅ Login successful, token created for: {email}")
    
    return jsonify({
        "success": True,
        "access_token": access_token,
        "user": {
            "user_id": user['user_id'],
            "email": user['email'],
            "name": user['name']
        }
    }), 200

# ---------- NEW: ONBOARDING ROUTE ----------

@app.route("/save_onboarding_profile", methods=["POST"])
@jwt_required() # <-- This route is protected
def save_onboarding_profile():
    # Get the user_id from their auth token
    current_user_id = get_jwt_identity()
    profile_data = request.get_json()
    
    if not profile_data:
        return jsonify({"error": "No profile data provided"}), 400
        
    print(f"\n🟢 Received /save_onboarding_profile data for user: {current_user_id}")

    try:
        # --- THIS IS THE PERMANENT SOLUTION ---
        # We save the JSON data from the app directly to the user_profile table
        # We assume the app is sending the encoded data
        # (e.g., 'stress_level_encoded': 3)
        insert_user_profile(current_user_id, profile_data)
        print(f"✅ Onboarding profile saved for user: {current_user_id}")
        return jsonify({"success": True, "message": "Profile saved successfully"}), 200
    except Exception as e:
        print(f"❌ Exception in /save_onboarding_profile: {e}")
        return jsonify({"error": str(e)}), 500


# ---------- EXISTING ROUTES (NOW SECURED) ----------

@app.route("/")
def home():
    return jsonify({"status": "running", "message": "MenoMap AI API is live 🚀"})


@app.route("/recommend", methods=["POST"])
@jwt_required() # <-- SECURED
def recommend_diet():
    if planner is None:
        return jsonify({"error": "Planner not initialized properly."}), 500

    # --- UPDATED: Get user_id from token ---
    user_id = get_jwt_identity()
    data = request.get_json(force=True)
    print(f"\n🟢 Received /recommend data for user: {user_id}", flush=True)

    age = data.get("age")
    mood = data.get("mood")
    symptoms = json.dumps(data.get("symptoms", {})) 
    preferences = json.dumps(data.get("preferences", []))
    extra_json = json.dumps(data.get("extra", {})) if data.get("extra") else None

    try:
        insert_user_data(user_id=user_id, age=age, symptoms=symptoms, preferences=preferences, mood=mood, extra_json=extra_json)
    except Exception as e:
        print(f"❌ DB insert error: {e}")
    
    user_row = get_latest_user_record(user_id)

    try:
        result = planner.get_diet_recommendation(request_data=data, user_row=user_row)
        print("✅ Result:", result, flush=True)
        return jsonify(result)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/predict_menopause_stage", methods=["POST"])
@jwt_required() # <-- SECURED
def predict_stage():
    if not stage_model:
        return jsonify({"error": "Stage Predictor Model is not loaded."}), 500

    # --- UPDATED: Get user_id from token ---
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided."}), 400
        
    print(f"\n🟢 Received /predict_menopause_stage data for user: {user_id}", flush=True)

    # ... (Prepare Data for Model - no changes) ...
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
            ternary_value = convert_slider_to_ternary(data[app_key])
            input_data[model_key] = ternary_value
    if 'fatigue' in data:
        ternary_val = convert_slider_to_ternary(data['fatigue'])
        input_data['fatigue_severity_meno_ternary'] = ternary_val
        input_data['fatigue_severity_pcos_ternary'] = ternary_val
    if 'mood_swings' in data:
        ternary_val = convert_slider_to_ternary(data['mood_swings'])
        input_data['mood_swings_severity_ternary'] = ternary_val
        input_data['mood_swings_irritability_severity_ternary'] = ternary_val
    try:
        df_input = pd.DataFrame([input_data])
        df_input = df_input[stage_model_features]
    except Exception as e:
        return jsonify({"error": f"Data formatting error: {str(e)}"}), 400

    # ... (Make Prediction - no changes) ...
    try:
        prediction_code = stage_model.predict(df_input)[0]
        prediction_proba = stage_model.predict_proba(df_input)
        confidence = np.max(prediction_proba) * 100
        predicted_stage_string = map_stage_to_string(prediction_code)

        # --- Save the log to the database (using REAL user_id) ---
        log_date = data.get("log_date", "default_date_string")
        symptoms_to_save = data 
        
        new_log_id = insert_symptom_log(
            user_id,  # <-- This is now the real user_id
            log_date, 
            predicted_stage_string, 
            symptoms_to_save
        )
        print(f"✅ Log saved with ID: {new_log_id} for user {user_id}")

        response = {
            "predicted_stage": predicted_stage_string,
            "confidence": round(confidence, 2),
            "log_id": new_log_id
        }
        return jsonify(response)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


@app.route("/get_remedy", methods=["POST"])
@jwt_required() # <-- SECURED
def get_remedy():
    if not recommender:
        return jsonify({"error": "Relief Recommender not initialized."}), 500

    # --- UPDATED: Get user_id from token ---
    user_id = get_jwt_identity()
    data = request.get_json()
    print(f"\n🟢 Received /get_remedy data for user: {user_id}", flush=True)

    log_id = data.get('log_id')
    target_symptom_key = data.get('target_symptom_key')
    current_severity_ternary = data.get('current_severity_ternary')

    if not all([log_id, target_symptom_key, current_severity_ternary is not None]):
        return jsonify({"error": "Missing log_id, target_symptom_key, or current_severity_ternary"}), 400

    # 1. Fetch User's Base Profile from DB
    profile_data = get_user_profile(user_id) 
    
    # --- MOCK PROFILE REMOVED ---
    if not profile_data:
        print(f"❌ User profile '{user_id}' not found. User must complete onboarding.")
        return jsonify({"error": "User profile not found. Please complete onboarding."}), 404

    # 2. Get Recommendation
    recommendation = recommender.recommend_relief(
        profile_data, 
        target_symptom_key, 
        current_severity_ternary
    )
    
    if "error" in recommendation:
        return jsonify(recommendation), 500

    # 3. Log the recommendation
    try:
        history_id = insert_remedy_recommendation(
            log_id=log_id,
            user_id=user_id,
            target_symptom=target_symptom_key,
            remedy_recommended=recommendation['best_remedy_id']
        )
        recommendation['history_id'] = history_id
        print(f"✅ Recommendation logged with history_id: {history_id}")
        return jsonify(recommendation)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Failed to log recommendation: {str(e)}"}), 500


@app.route("/log_remedy_feedback", methods=["POST"])
@jwt_required() # <-- SECURED
def log_feedback():
    # This route doesn't need user_id, as history_id is unique
    data = request.get_json()
    print("\n🟢 Received /log_remedy_feedback data:", data, flush=True)

    history_id = data.get('history_id')
    was_effective = data.get('was_effective')

    if not history_id:
        return jsonify({"error": "No history_id provided"}), 400

    effectiveness_score = 1 if was_effective else 0

    try:
        update_remedy_feedback(history_id, effectiveness_score)
        print(f"✅ Feedback saved for history_id: {history_id}")
        return jsonify({"success": True, "message": "Feedback saved!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/get_relief_summary", methods=["POST"])
@jwt_required() # <-- SECURED
def get_relief_summary():
    # --- UPDATED: Get user_id from token ---
    user_id = get_jwt_identity()
    print(f"\n🟢 Received /get_relief_summary data for: {user_id}", flush=True)

    try:
        conn = get_db_connection()
        rows = conn.cursor().execute(
            """
            SELECT 
                remedy_recommended,
                AVG(effectiveness) * 100 as effectiveness_percent,
                COUNT(*) as log_count
            FROM remedy_history
            WHERE user_id = ? AND effectiveness != -1
            GROUP BY remedy_recommended
            ORDER BY effectiveness_percent DESC
            """,
            (user_id,)
        ).fetchall()
        conn.close()

        # ... (no changes to the rest of this function) ...
        summary_data = []
        emoji_map = {
            'yoga': '🧘', 'turmericmilk': '🍵', 'journaling': '✍️', 
            'meditation': '🕉️', 'cardio': '🏃‍♀️', 'cinnamonwater': '💧',
            'fenugreekseeds': '🌱', 'aloeverajuice': '🌿', 'strengthtraining': '🏋️‍♀️'
        }
        
        for row in rows:
            remedy_id = row['remedy_recommended']
            summary_data.append({
                "name": remedy_id.title(),
                "emoji": emoji_map.get(remedy_id, '🌿'),
                "effectiveness": round(row['effectiveness_percent']),
                "note": f"Logged {row['log_count']} times"
            })
        mock_trend = {
            "labels": ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            "datasets": [{"data": [0, 0, 0, 0, 0, 0, 0]}],
        }
        ai_suggestion = "Log remedies from the Symptom Tracker to see your insights here!"
        if summary_data:
            ai_suggestion = f"Your best remedy is {summary_data[0]['name']} with {summary_data[0]['effectiveness']}% effectiveness!"

        response = {
            "summary": summary_data,
            "trend": mock_trend,
            "aiSuggestion": ai_suggestion
        }
        return jsonify(response)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ---------- RUN ----------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)