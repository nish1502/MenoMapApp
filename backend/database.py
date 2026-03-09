import sqlite3
from sqlite3 import Connection
from typing import Optional, Dict, Any

import os

# Get the directory where database.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "menomap.db")

def get_db_connection() -> Connection:
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # --- Existing table for Diet Planner ---
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS user_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            age INTEGER,
            symptoms TEXT,
            preferences TEXT,
            mood TEXT,
            extra_json TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    
    # --- 1. NEW: User Profile Table ---
    # Stores base user information. Categorical features are encoded
    # in the service layer (preprocessing).
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_profile (
            user_id TEXT PRIMARY KEY,
            age INTEGER,
            stress_level_encoded INTEGER,
            self_reported_stage_encoded INTEGER,
            cycle_regularity_encoded INTEGER,
            caffeine_intake TEXT,
            diet_preferences TEXT,
            extra_data TEXT
        )
    ''')

    # --- 2. Auth Table ---
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT
        )
    ''')

    # --- 2. NEW: Symptom Logs Table ---
    # Stores the user's daily tracker entries (0-10 scale)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS symptom_logs (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            log_date TEXT NOT NULL,
            predicted_stage TEXT,
            hot_flashes INTEGER,
            mood_swings INTEGER,
            fatigue INTEGER,
            sleep_issues INTEGER,
            brain_fog INTEGER,
            notes TEXT,
            FOREIGN KEY (user_id) REFERENCES user_profile (user_id)
        )
    ''')

    # --- 3. NEW: Remedy History Table ---
    # Stores recommendations and user feedback
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS remedy_history (
            history_id INTEGER PRIMARY KEY AUTOINCREMENT,
            log_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            target_symptom TEXT,         -- e.g., 'hot_flashes_severity_ternary'
            remedy_recommended TEXT,     -- e.g., 'turmericmilk'
            effectiveness INTEGER DEFAULT -1,  -- -1=Pending, 0=Ineffective, 1=Effective
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (log_id) REFERENCES symptom_logs (log_id),
            FOREIGN KEY (user_id) REFERENCES user_profile (user_id)
        )
    ''')

    # --- 4. Performance Index ---
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_id ON symptom_logs(user_id)')
    
    conn.commit()
    conn.close()

# --- Existing Functions for Diet Planner ---

def insert_user_data(user_id: str, age: Optional[int], symptoms: str,
                     preferences: str, mood: Optional[str], extra_json: Optional[str] = None):
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO user_data (user_id, age, symptoms, preferences, mood, extra_json) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, age, symptoms, preferences, mood, extra_json),
    )
    conn.commit()
    conn.close()

def get_latest_user_record(user_id: str):
    conn = get_db_connection()
    row = conn.execute(
        "SELECT * FROM user_data WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1",
        (user_id,),
    ).fetchone()
    conn.close()
    return row

# --- NEW Functions for Symptom Tracker & Relief Recommender ---

def insert_user_profile(user_id: str, profile_data: Dict[str, Any]):
    """
    Inserts or updates a user's base profile.
    Dynamically builds the query based on existing table columns.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Get existing columns in the table
    cursor.execute("PRAGMA table_info(user_profile)")
    columns_info = cursor.fetchall()
    table_columns = [col['name'] for col in columns_info if col['name'] != 'user_id']
    
    # 2. Match profile_data keys to table columns
    # If a key is missing, use None
    values = [profile_data.get(col) for col in table_columns]
    
    # 3. Build dynamic query
    col_names_str = ", ".join(table_columns)
    placeholders_str = ", ".join(["?"] * len(table_columns))
    
    query = f"REPLACE INTO user_profile (user_id, {col_names_str}) VALUES (?, {placeholders_str})"
    
    cursor.execute(query, [user_id] + values)
    conn.commit()
    conn.close()

def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetches a user's base profile as a dictionary.
    """
    conn = get_db_connection()
    row = conn.execute(
        "SELECT * FROM user_profile WHERE user_id = ?",
        (user_id,),
    ).fetchone()
    conn.close()
    
    if row:
        # Convert sqlite3.Row to a dictionary
        return dict(row)
    return None

def insert_symptom_log(user_id: str, log_date: str, predicted_stage: str, 
                       symptoms: Dict[str, Any]) -> int:
    """
    Inserts a daily symptom log and returns the new log_id.
    'symptoms' is the raw data from the app (e.g., {'hot_flashes': 7, ...})
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''
        INSERT INTO symptom_logs 
        (user_id, log_date, predicted_stage, hot_flashes, mood_swings, fatigue, sleep_issues, brain_fog, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (
            user_id, log_date, predicted_stage,
            symptoms.get('hot_flashes', 0),
            symptoms.get('mood_swings', 0),
            symptoms.get('fatigue', 0),
            symptoms.get('sleep_issues', 0),
            symptoms.get('brain_fog', 0),
            symptoms.get('notes', '')
        )
    )
    conn.commit()
    log_id = cursor.lastrowid # Get the ID of the log we just inserted
    conn.close()
    return log_id

def insert_remedy_recommendation(log_id: int, user_id: str, target_symptom: str, 
                                remedy_recommended: str) -> int:
    """
    Logs that a remedy was recommended (feedback is pending).
    Returns the new history_id.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''
        INSERT INTO remedy_history 
        (log_id, user_id, target_symptom, remedy_recommended, effectiveness) 
        VALUES (?, ?, ?, ?, -1)
        ''',
        (log_id, user_id, target_symptom, remedy_recommended)
    )
    conn.commit()
    history_id = cursor.lastrowid
    conn.close()
    return history_id

def update_remedy_feedback(history_id: int, effectiveness_score: int):
    """
    Updates a remedy log with the user's feedback (0 or 1).
    """
    conn = get_db_connection()
    conn.execute(
        "UPDATE remedy_history SET effectiveness = ? WHERE history_id = ?",
        (effectiveness_score, history_id)
    )
    conn.commit()
    conn.close()

# --- Auth Helper Functions ---

def register_user(email, password, name):
    conn = get_db_connection()
    try:
        conn.execute(
            "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
            (email, password, name)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def login_user(email, password):
    conn = get_db_connection()
    row = conn.execute(
        "SELECT id, email, name FROM users WHERE email = ? AND password = ?",
        (email, password)
    ).fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

# --- Main execution ---
if __name__ == '__main__':
    print("Initializing/Updating database 'menomap.db'...")
    init_db()
    print("Database ready.")