from flask import Flask, request, jsonify
from diet_planner_service import AdaptiveDietPlanner
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np

# --- NEW: Import the new service and DB functions ---
from relief_recommender_service import ReliefRecommender
from database import (
    init_db, 
    insert_user_data, 
    get_latest_user_record,
    # New functions for this feature:
    insert_symptom_log,
    get_user_profile,
    insert_user_profile, # Added for the mock profile fallback
    insert_remedy_recommendation,
    update_remedy_feedback,
    get_db_connection # We need this
)

app = Flask(__name__)
# allow all origins for local dev
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})

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

# ---------- INITIALIZE THE PLANNER (Existing) ----------
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

# ---------- INITIALIZE THE STAGE PREDICTOR MODEL (Existing) ----------
try:
    stage_model = joblib.load(stage_model_path)
    stage_model_features = joblib.load(stage_features_path)
    print("✅ Stage Predictor Model loaded successfully!")
except Exception as e:
    print(f"❌ Failed to initialize Stage Predictor: {e}")
    stage_model = None

# ---------- NEW: INITIALIZE THE RELIEF RECOMMENDER ----------
try:
    recommender = ReliefRecommender()
    print("✅ ReliefRecommender initialized successfully!")
except Exception as e:
    print(f"❌ Failed to initialize ReliefRecommender: {e}")
    recommender = None


# ---------- STAGE PREDICTOR HELPER FUNCTIONS (Existing) ----------

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
    print("\n🟢 Received /recommend data:", data, flush=True)

    # ... (all your existing logic for /recommend) ...
    user_id = data.get("user_id", "guest")
    age = data.get("age")
    mood = data.get("mood")
    
    import json
    
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
        import traceback
        print(f"❌ Exception in planner: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ---------- STAGE PREDICTION ROUTE (UPDATED) ----------
# This route now saves the log to the DB as you planned.

@app.route("/predict_menopause_stage", methods=["POST"])
def predict_stage():
    if not stage_model:
        return jsonify({"error": "Stage Predictor Model is not loaded."}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided."}), 400
        
    print("\n🟢 Received /predict_menopause_stage data:", data, flush=True)

    # --- Prepare Data for the Model (Existing Logic) ---
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

    # --- Make the Prediction (Existing Logic) ---
    try:
        prediction_code = stage_model.predict(df_input)[0]
        prediction_proba = stage_model.predict_proba(df_input)
        confidence = np.max(prediction_proba) * 100
        predicted_stage_string = map_stage_to_string(prediction_code)

        # --- NEW: Save the log to the database ---
        user_id = data.get("user_id", "guest") # Get user_id from app
        log_date = data.get("log_date", "default_date_string") # Get date from app
        symptoms_to_save = data 
        
        new_log_id = insert_symptom_log(
            user_id, 
            log_date, 
            predicted_stage_string, 
            symptoms_to_save
        )
        print(f"✅ Log saved with ID: {new_log_id}")
        # --- End of new code ---

        # --- MODIFIED: Send back the new log_id ---
        response = {
            "predicted_stage": predicted_stage_string,
            "confidence": round(confidence, 2),
            "log_id": new_log_id  # <-- CRITICAL: Send this to the app
        }
        return jsonify(response)

    except Exception as e:
        print(f"❌ Exception in predict_stage: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


# ---------- NEW: RELIEF RECOMMENDER ROUTES ----------

@app.route("/get_remedy", methods=["POST"])
def get_remedy():
    if not recommender:
        return jsonify({"error": "Relief Recommender not initialized."}), 500

    data = request.get_json()
    print("\n🟢 Received /get_remedy data:", data, flush=True)

    user_id = data.get('user_id')
    log_id = data.get('log_id')
    target_symptom_key = data.get('target_symptom_key')
    current_severity_ternary = data.get('current_severity_ternary')

    if not all([user_id, log_id, target_symptom_key, current_severity_ternary is not None]):
        return jsonify({"error": "Missing user_id, log_id, target_symptom_key, or current_severity_ternary"}), 400

    # 1. Fetch User's Base Profile from DB
    profile_data = get_user_profile(user_id) 
    if not profile_data:
        # --- MOCK PROFILE FALLBACK (for testing) ---
        print(f"⚠️ User profile '{user_id}' not found. Using mock profile for testing.")
        profile_data = {
            'stress_level_encoded': 3, 'self_reported_stage_encoded': 1, 'cycle_regularity_encoded': 2,
            'flow_intensity_encoded': 2, 'exercise_frequency_wk': 1.5, 'age_group_simplified_40_49': 1,
            'cycle_length_days': 26.0, 'diet_goal_high_protein': 1, 'age_group_simplified_50_59': 0, 
            'worsen_food_friedfoods': 1, 'avoided_gluten': 0, 'ex_type_none_reported': 0,
            'remedy_turmericmilk': 0, 'diet_goal_calcium_rich': 1, 'avoided_soy': 0,
            'remedy_cinnamonwater': 0, 'remedy_fenugreekseeds': 0, 'age_group_simplified_younger_than_40': 0
        }
        try:
            insert_user_profile(user_id, profile_data)
            print("   > Saved mock profile to DB.")
        except Exception as e:
            print(f"   > Failed to save mock profile: {e}")
        # --- End of Mock Profile Fallback ---

    # 2. Get Recommendation
    recommendation = recommender.recommend_relief(
        profile_data, 
        target_symptom_key, 
        current_severity_ternary
    )
    
    if "error" in recommendation:
        return jsonify(recommendation), 500

    # 3. Log the recommendation to the DB (pending feedback)
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
        print(f"❌ Exception in /get_remedy DB insert: {e}")
        return jsonify({"error": f"Failed to log recommendation: {str(e)}"}), 500


@app.route("/log_remedy_feedback", methods=["POST"])
def log_feedback():
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
        print(f"❌ Exception in /log_remedy_feedback: {e}")
        return jsonify({"error": str(e)}), 500


# ---------- NEW: RELIEF TRACKER SUMMARY ROUTE ----------

@app.route("/get_relief_summary", methods=["POST"])
def get_relief_summary():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    print(f"\n🟢 Received /get_relief_summary data for: {user_id}", flush=True)

    try:
        conn = get_db_connection()
        # Query to get the average effectiveness for each remedy
        rows = conn.cursor().execute(
            """
            SELECT 
                remedy_recommended,
                AVG(effectiveness) * 100 as effectiveness_percent,
                COUNT(*) as log_count
            FROM remedy_history
            WHERE user_id = ? AND effectiveness != -1 -- Only get logs with feedback
            GROUP BY remedy_recommended
            ORDER BY effectiveness_percent DESC
            """,
            (user_id,)
        ).fetchall()
        conn.close()

        # Convert rows to the format the frontend expects
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

        # --- TODO: Add logic for trend chart ---
        mock_trend = {
            "labels": ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            "datasets": [{"data": [0, 0, 0, 0, 0, 0, 0]}],
        }

        # --- AI Suggestion Logic ---
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
        print(f"❌ Exception in /get_relief_summary: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ---------- RUN ----------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)